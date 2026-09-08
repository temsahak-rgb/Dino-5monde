import type {
    ExerciseAnswer,
    LessonProgress,
    MistakeRecord
} from "../types/global.js";

export {
    clearMistakesForLesson,
    getAllLessonProgress,
    getAllMistakes,
    getLessonProgress,
    getMistakesForLesson,
    markLessonCompleted,
    markSectionCompleted,
    mergeLessonProgress,
    mergeRemoteLessonProgress,
    setLessonProgressAccount,
    saveMistake
};

type LessonContentType =
    | "grammar"
    | "travel";

interface LessonProgressChangeDetail {
    contentType: LessonContentType;
    lessonId: string;
    progress: LessonProgress;
}

interface LessonProgressSnapshot {
    contentType: LessonContentType;
    lessonId: string;
    progress: LessonProgress;
}

const LESSON_PROGRESS_CHANGE_EVENT =
    "dino:lessonprogresschange";
const LESSON_PROGRESS_IMPORTED_EVENT =
    "dino:lessonprogressimported";
const LESSON_PROGRESS_ACCOUNT_EVENT =
    "dino:lessonprogressaccountchange";
const LESSON_PROGRESS_CONTENT_TYPES_STORAGE_KEY =
    "dino_lesson_progress_content_types";
const LESSON_PROGRESS_ACTIVE_ACCOUNT_STORAGE_KEY =
    "dino_lesson_progress_active_account";
const LESSON_PROGRESS_ANONYMOUS_ADOPTED_STORAGE_KEY =
    "dino_lesson_progress_anonymous_adopted";

/**
 * Local persistence for lesson progress and user mistakes.
 */

const LESSON_PROGRESS_STORAGE_KEY =
    "dino_lessons_progress";

const MISTAKES_STORAGE_KEY =
    "dino_mistakes";

/* -------------------------------------------------------------------------- */
/* Lesson progress                                                             */
/* -------------------------------------------------------------------------- */

/**
 * Returns the persisted progress state of one lesson.
 */
function getLessonProgress(
    lessonId: string
): LessonProgress {
    const allProgress =
        readLessonProgress();

    return (
        allProgress[
            lessonId
        ]
        ?? {
            status:
                "not_started",

            completedSections:
                [],

            currentSection:
                0,

            lastAccessed:
                null
        }
    );
}

/**
 * Persists one lesson progress record and refreshes its access timestamp.
 */
function saveLessonProgress(
    lessonId: string,
    progress: LessonProgress,
    contentType: LessonContentType
): void {
    const allProgress =
        readLessonProgress();

    const updatedProgress:
        LessonProgress = {
            ...progress,

            completedSections: [
                ...progress.completedSections
            ],

            lastAccessed:
                new Date()
                    .toISOString()
        };

    allProgress[
        lessonId
    ] = updatedProgress;

    localStorage.setItem(
        getAccountScopedStorageKey(
            LESSON_PROGRESS_STORAGE_KEY
        ),
        JSON.stringify(
            allProgress
        )
    );
    saveLessonContentType(
        lessonId,
        contentType
    );

    dispatchProgressChange({
        contentType,
        lessonId,
        progress: updatedProgress
    });
}

/**
 * Marks one section as completed for a lesson.
 *
 * Section completion leaves the lesson in `in_progress` until the feature
 * explicitly confirms that every required section is complete through
 * `markLessonCompleted()`.
 */
function markSectionCompleted(
    lessonId: string,
    sectionId: string,
    contentType: LessonContentType
): void {
    const progress =
        getLessonProgress(
            lessonId
        );

    const completedSections =
        progress.completedSections
            .includes(
                sectionId
            )
            ? [
                ...progress.completedSections
            ]
            : [
                ...progress.completedSections,
                sectionId
            ];

    saveLessonProgress(
        lessonId,
        {
            ...progress,

            completedSections,

            status:
                progress.status === "completed"
                    ? "completed"
                    : "in_progress"
        },
        contentType
    );
}

/**
 * Marks the whole lesson as completed.
 *
 * Grammar and Travel can now use the same persisted lesson-progress contract
 * instead of only marking their final section.
 */
function markLessonCompleted(
    lessonId: string,
    contentType: LessonContentType
): void {
    const progress =
        getLessonProgress(
            lessonId
        );

    saveLessonProgress(
        lessonId,
        {
            ...progress,

            status:
                "completed"
        },
        contentType
    );
}

/** Returns a defensive snapshot used during authenticated bootstrap sync. */
function getAllLessonProgress():
    LessonProgressSnapshot[] {
    const contentTypes = readStringMap(
        getAccountScopedStorageKey(
            LESSON_PROGRESS_CONTENT_TYPES_STORAGE_KEY
        )
    );

    return Object.entries(readLessonProgress()).map(
        ([lessonId, progress]) => ({
            contentType: resolveLessonContentType(
                lessonId,
                contentTypes[lessonId]
            ),
            lessonId,
            progress: {
                ...progress,
                completedSections: [
                    ...progress.completedSections
                ]
            }
        })
    );
}

/** Imports server progress without emitting another outbound sync event. */
function mergeRemoteLessonProgress(
    contentType: LessonContentType,
    lessonId: string,
    remote: LessonProgress
): LessonProgress {
    const allProgress = readLessonProgress();
    const local = getLessonProgress(lessonId);
    const merged = mergeLessonProgress(
        local,
        remote
    );

    allProgress[lessonId] = merged;
    localStorage.setItem(
        getAccountScopedStorageKey(
            LESSON_PROGRESS_STORAGE_KEY
        ),
        JSON.stringify(allProgress)
    );
    saveLessonContentType(
        lessonId,
        contentType
    );

    if (/^(A1|A2|B1|B2|C1)-G-/u.test(lessonId)) {
        const grammarProgress = readStringMap(
            getAccountScopedStorageKey("dino_progress")
        );
        grammarProgress[lessonId] = merged.status;
        localStorage.setItem(
            getAccountScopedStorageKey("dino_progress"),
            JSON.stringify(grammarProgress)
        );
    }

    dispatchLessonProgressEvent(
        LESSON_PROGRESS_IMPORTED_EVENT,
        {
            contentType,
            lessonId,
            progress: merged
        }
    );

    return merged;
}

/** Combines two devices without ever losing completed work. */
function mergeLessonProgress(
    local: LessonProgress,
    remote: LessonProgress
): LessonProgress {
    return {
        status:
            progressRank(remote.status) > progressRank(local.status)
                ? remote.status
                : local.status,
        completedSections: [
            ...new Set([
                ...local.completedSections,
                ...remote.completedSections
            ])
        ],
        currentSection: Math.max(
            local.currentSection,
            remote.currentSection
        ),
        lastAccessed:
            [local.lastAccessed, remote.lastAccessed]
                .filter((value): value is string => Boolean(value))
                .sort()
                .at(-1)
            ?? null
    };
}

function progressRank(
    status: LessonProgress["status"]
): number {
    return status === "completed"
        ? 2
        : status === "in_progress"
            ? 1
            : 0;
}

function dispatchProgressChange(
    detail: LessonProgressChangeDetail
): void {
    dispatchLessonProgressEvent(
        LESSON_PROGRESS_CHANGE_EVENT,
        detail
    );
}

function dispatchLessonProgressEvent(
    eventName: string,
    detail: LessonProgressChangeDetail
): void {
    if (
        typeof window === "undefined"
        || typeof CustomEvent === "undefined"
    ) {
        return;
    }

    window.dispatchEvent(
        new CustomEvent<LessonProgressChangeDetail>(
            eventName,
            { detail }
        )
    );
}

function saveLessonContentType(
    lessonId: string,
    contentType: LessonContentType
): void {
    const contentTypes = readStringMap(
        getAccountScopedStorageKey(
            LESSON_PROGRESS_CONTENT_TYPES_STORAGE_KEY
        )
    );
    contentTypes[lessonId] = contentType;
    localStorage.setItem(
        getAccountScopedStorageKey(
            LESSON_PROGRESS_CONTENT_TYPES_STORAGE_KEY
        ),
        JSON.stringify(contentTypes)
    );
}

/** Selects one private local progress namespace for the active account. */
function setLessonProgressAccount(
    accountId: string | null
): void {
    if (
        accountId !== null
        && (
            !accountId
            || accountId.trim() !== accountId
            || accountId.length > 160
        )
    ) {
        throw new TypeError("Invalid lesson progress account");
    }

    const previousAccount = localStorage.getItem(
        LESSON_PROGRESS_ACTIVE_ACCOUNT_STORAGE_KEY
    );

    if (accountId === null) {
        localStorage.removeItem(
            LESSON_PROGRESS_ACTIVE_ACCOUNT_STORAGE_KEY
        );
    } else {
        adoptAnonymousProgress(accountId);
        localStorage.setItem(
            LESSON_PROGRESS_ACTIVE_ACCOUNT_STORAGE_KEY,
            accountId
        );
    }

    if (previousAccount !== accountId) {
        dispatchLessonProgressAccountChange();
    }
}

function dispatchLessonProgressAccountChange(): void {
    if (
        typeof window === "undefined"
        || typeof Event === "undefined"
    ) {
        return;
    }

    window.dispatchEvent(
        new Event(LESSON_PROGRESS_ACCOUNT_EVENT)
    );
}

function adoptAnonymousProgress(
    accountId: string
): void {
    if (
        localStorage.getItem(
            LESSON_PROGRESS_ANONYMOUS_ADOPTED_STORAGE_KEY
        ) === "true"
    ) {
        return;
    }

    for (
        const baseKey
        of [
            LESSON_PROGRESS_STORAGE_KEY,
            LESSON_PROGRESS_CONTENT_TYPES_STORAGE_KEY,
            "dino_progress"
        ]
    ) {
        const anonymousValue = localStorage.getItem(baseKey);

        if (anonymousValue !== null) {
            localStorage.setItem(
                `${baseKey}:${accountId}`,
                anonymousValue
            );
            localStorage.removeItem(baseKey);
        }
    }

    localStorage.setItem(
        LESSON_PROGRESS_ANONYMOUS_ADOPTED_STORAGE_KEY,
        "true"
    );
}

function getAccountScopedStorageKey(
    baseKey: string
): string {
    const accountId = localStorage.getItem(
        LESSON_PROGRESS_ACTIVE_ACCOUNT_STORAGE_KEY
    );

    return accountId
        ? `${baseKey}:${accountId}`
        : baseKey;
}

function resolveLessonContentType(
    lessonId: string,
    storedContentType: string | undefined
): LessonContentType {
    if (
        storedContentType === "grammar"
        || storedContentType === "travel"
    ) {
        return storedContentType;
    }

    return /^(A1|A2|B1|B2|C1)-G-/u.test(lessonId)
        ? "grammar"
        : "travel";
}

function readStringMap(
    key: string
): Record<string, string> {
    try {
        const parsed = JSON.parse(
            localStorage.getItem(key) || "{}"
        ) as unknown;

        return parsed && typeof parsed === "object" && !Array.isArray(parsed)
            ? parsed as Record<string, string>
            : {};
    } catch {
        return {};
    }
}

/* -------------------------------------------------------------------------- */
/* Mistakes                                                                    */
/* -------------------------------------------------------------------------- */

/**
 * Stores an incorrect answer for later review.
 */
function saveMistake(
    lessonId: string,
    sectionId: string,
    questionIndex: number,
    userAnswer:
        ExerciseAnswer,
    correctAnswer:
        number
        | string
        | string[]
): void {
    const allMistakes =
        readMistakes();

    allMistakes.push({
        lessonId,
        sectionId,
        questionIndex,
        userAnswer,
        correctAnswer,
        timestamp:
            new Date()
                .toISOString()
    });

    localStorage.setItem(
        MISTAKES_STORAGE_KEY,
        JSON.stringify(
            allMistakes
        )
    );
}

/**
 * Returns mistakes associated with one lesson.
 */
function getMistakesForLesson(
    lessonId: string
): MistakeRecord[] {
    return readMistakes()
        .filter(
            mistake =>
                mistake.lessonId
                === lessonId
        );
}

/**
 * Returns every persisted mistake.
 */
function getAllMistakes():
    MistakeRecord[] {
    return readMistakes();
}

/**
 * Removes every persisted mistake associated with one lesson.
 */
function clearMistakesForLesson(
    lessonId: string
): void {
    const remainingMistakes =
        readMistakes()
            .filter(
                mistake =>
                    mistake.lessonId
                    !== lessonId
            );

    localStorage.setItem(
        MISTAKES_STORAGE_KEY,
        JSON.stringify(
            remainingMistakes
        )
    );
}

/* -------------------------------------------------------------------------- */
/* Persistence readers                                                         */
/* -------------------------------------------------------------------------- */

function readLessonProgress():
    Record<
        string,
        LessonProgress
    > {
    const raw =
        localStorage.getItem(
            getAccountScopedStorageKey(
                LESSON_PROGRESS_STORAGE_KEY
            )
        );

    if (!raw) {
        return {};
    }

    try {
        const parsed =
            JSON.parse(
                raw
            ) as unknown;

        if (
            !parsed
            || typeof parsed
                !== "object"
            || Array.isArray(
                parsed
            )
        ) {
            return {};
        }

        return parsed as Record<
            string,
            LessonProgress
        >;
    } catch {
        return {};
    }
}

function readMistakes():
    MistakeRecord[] {
    const raw =
        localStorage.getItem(
            MISTAKES_STORAGE_KEY
        );

    if (!raw) {
        return [];
    }

    try {
        const parsed =
            JSON.parse(
                raw
            ) as unknown;

        return Array.isArray(
            parsed
        )
            ? parsed as MistakeRecord[]
            : [];
    } catch {
        return [];
    }
}

export {
    LESSON_PROGRESS_ACCOUNT_EVENT,
    LESSON_PROGRESS_CHANGE_EVENT,
    LESSON_PROGRESS_IMPORTED_EVENT,
    getAccountScopedStorageKey
};

export type {
    LessonContentType,
    LessonProgressChangeDetail,
    LessonProgressSnapshot
};
