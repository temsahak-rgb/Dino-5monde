import type {
    ExerciseAnswer,
    LessonProgress,
    MistakeRecord
} from "../types/global.js";

export {
    clearMistakesForLesson,
    getAllMistakes,
    getLessonProgress,
    getMistakesForLesson,
    markLessonCompleted,
    markSectionCompleted,
    saveMistake
};

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
    progress: LessonProgress
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
        LESSON_PROGRESS_STORAGE_KEY,
        JSON.stringify(
            allProgress
        )
    );
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
    sectionId: string
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
                "in_progress"
        }
    );
}

/**
 * Marks the whole lesson as completed.
 *
 * Grammar and Travel can now use the same persisted lesson-progress contract
 * instead of only marking their final section.
 */
function markLessonCompleted(
    lessonId: string
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
        }
    );
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
            LESSON_PROGRESS_STORAGE_KEY
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