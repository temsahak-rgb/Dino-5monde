import type {
    ExerciseAnswer,
    MistakeRecord,
    VocabWeakMap
} from "../types/global.js";

import {
    getAccountScopedStorageKey
} from "./learnerStorage.js";

type ReviewSignalType =
    | "mistake"
    | "weak_word";

interface WeakWordSignalPayload {
    word: string;
}

interface ReviewSignalBase {
    active: boolean;
    changedAt: string;
    signalKey: string;
    subjectId: string;
}

interface MistakeReviewSignal extends ReviewSignalBase {
    payload: MistakeRecord;
    signalType: "mistake";
}

interface WeakWordReviewSignal extends ReviewSignalBase {
    payload: WeakWordSignalPayload;
    signalType: "weak_word";
}

type ReviewSignal =
    | MistakeReviewSignal
    | WeakWordReviewSignal;

interface ReviewSignalChangeDetail {
    signal: ReviewSignal;
}

const REVIEW_SIGNAL_CHANGE_EVENT =
    "dino:reviewsignalchange";
const REVIEW_SIGNAL_IMPORTED_EVENT =
    "dino:reviewsignalimported";
const REVIEW_SIGNAL_CHANGES_STORAGE_KEY =
    "dino_review_signal_changes";
const MISTAKES_STORAGE_KEY =
    "dino_mistakes";
const WEAK_WORDS_STORAGE_KEY =
    "dino_vocab_weak";

function saveMistake(
    lessonId: string,
    sectionId: string,
    questionIndex: number,
    userAnswer: ExerciseAnswer,
    correctAnswer: number | string | string[]
): void {
    const timestamp = new Date().toISOString();
    const mistake: MistakeRecord = {
        correctAnswer,
        id: createMistakeId(),
        lessonId,
        questionIndex,
        sectionId,
        timestamp,
        userAnswer
    };
    const mistakes = readMistakes();
    mistakes.push(mistake);
    writeMistakes(mistakes);
    persistLocalSignal(
        createMistakeSignal(mistake, true, timestamp)
    );
}

function getAllMistakes(): MistakeRecord[] {
    return readMistakes();
}

function clearMistakesForLesson(
    lessonId: string
): void {
    const mistakes = readMistakes();
    const removed = mistakes.filter(
        mistake => mistake.lessonId === lessonId
    );
    writeMistakes(
        mistakes.filter(
            mistake => mistake.lessonId !== lessonId
        )
    );

    const changedAt = new Date().toISOString();
    for (const mistake of removed) {
        persistLocalSignal(
            createMistakeSignal(mistake, false, changedAt)
        );
    }
}

function getWeakWords(
    packId: string
): string[] {
    return [...(readWeakWordMap()[packId] ?? [])];
}

function getAllWeakWords(): VocabWeakMap {
    return Object.fromEntries(
        Object.entries(readWeakWordMap()).map(
            ([packId, words]) => [packId, [...words]]
        )
    );
}

function setWeakWord(
    packId: string,
    frenchWord: string,
    weak: boolean
): void {
    assertIdentifier(packId, "pack id");
    assertIdentifier(frenchWord, "weak word");

    const weakMap = readWeakWordMap();
    const current = (weakMap[packId] ?? []).filter(
        word => word !== frenchWord
    );
    weakMap[packId] = weak
        ? [...current, frenchWord]
        : current;
    writeWeakWordMap(weakMap);

    persistLocalSignal({
        active: weak,
        changedAt: new Date().toISOString(),
        payload: { word: frenchWord },
        signalKey: createWeakWordSignalKey(packId, frenchWord),
        signalType: "weak_word",
        subjectId: packId
    });
}

/** Adds metadata to historical local records before their first sync. */
function initializeLocalReviewSignals(): ReviewSignal[] {
    const signals = readReviewSignals();
    let changed = false;

    for (const mistake of readMistakes()) {
        const signal = createMistakeSignal(
            mistake,
            true,
            mistake.timestamp
        );
        const key = createSignalStorageKey(signal);

        if (!signals[key]) {
            signals[key] = signal;
            changed = true;
        }
    }

    const migrationTimestamp = new Date().toISOString();
    for (
        const [packId, words]
        of Object.entries(readWeakWordMap())
    ) {
        for (const word of words) {
            const signal: WeakWordReviewSignal = {
                active: true,
                changedAt: migrationTimestamp,
                payload: { word },
                signalKey: createWeakWordSignalKey(packId, word),
                signalType: "weak_word",
                subjectId: packId
            };
            const key = createSignalStorageKey(signal);

            if (!signals[key]) {
                signals[key] = signal;
                changed = true;
            }
        }
    }

    if (changed) {
        writeReviewSignals(signals);
    }

    return Object.values(signals).map(cloneReviewSignal);
}

function mergeRemoteReviewSignal(
    remote: ReviewSignal
): ReviewSignal {
    assertReviewSignal(remote);

    const signals = readReviewSignals();
    const storageKey = createSignalStorageKey(remote);
    const local = signals[storageKey];
    const resolved = local
        ? chooseLatestReviewSignal(local, remote)
        : cloneReviewSignal(remote);

    signals[storageKey] = resolved;
    writeReviewSignals(signals);
    applyReviewSignal(resolved);
    dispatchReviewSignalEvent(
        REVIEW_SIGNAL_IMPORTED_EVENT,
        resolved
    );

    return cloneReviewSignal(resolved);
}

/** Last-write-wins merge where equal timestamps always preserve a deletion. */
function chooseLatestReviewSignal(
    left: ReviewSignal,
    right: ReviewSignal
): ReviewSignal {
    assertSameSignal(left, right);

    if (left.changedAt > right.changedAt) {
        return cloneReviewSignal(left);
    }

    if (right.changedAt > left.changedAt) {
        return cloneReviewSignal(right);
    }

    if (left.active !== right.active) {
        return cloneReviewSignal(
            left.active ? right : left
        );
    }

    return cloneReviewSignal(right);
}

function persistLocalSignal(
    signal: ReviewSignal
): void {
    assertReviewSignal(signal);
    const signals = readReviewSignals();
    signals[createSignalStorageKey(signal)] = cloneReviewSignal(signal);
    writeReviewSignals(signals);
    dispatchReviewSignalEvent(
        REVIEW_SIGNAL_CHANGE_EVENT,
        signal
    );
}

function createMistakeSignal(
    mistake: MistakeRecord,
    active: boolean,
    changedAt: string
): MistakeReviewSignal {
    const signalKey = getMistakeSignalKey(mistake);

    return {
        active,
        changedAt,
        payload: {
            ...mistake,
            id: signalKey
        },
        signalKey,
        signalType: "mistake",
        subjectId: mistake.lessonId
    };
}

function getMistakeSignalKey(
    mistake: MistakeRecord
): string {
    if (mistake.id) {
        return mistake.id;
    }

    return `legacy-${stableHash(JSON.stringify([
        mistake.lessonId,
        mistake.sectionId,
        mistake.questionIndex,
        mistake.userAnswer,
        mistake.correctAnswer,
        mistake.timestamp
    ]))}`;
}

function createWeakWordSignalKey(
    _packId: string,
    word: string
): string {
    return word;
}

function stableHash(value: string): string {
    let first = 0x811c9dc5;
    let second = 0x9e3779b9;

    for (let index = 0; index < value.length; index += 1) {
        const code = value.charCodeAt(index);
        first = Math.imul(first ^ code, 0x01000193);
        second = Math.imul(second ^ code, 0x85ebca6b);
    }

    return `${(first >>> 0).toString(36)}-${(second >>> 0).toString(36)}`;
}

function createMistakeId(): string {
    if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
        return crypto.randomUUID();
    }

    return `mistake-${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`;
}

function applyReviewSignal(
    signal: ReviewSignal
): void {
    if (signal.signalType === "mistake") {
        const mistakes = readMistakes().filter(
            mistake => getMistakeSignalKey(mistake) !== signal.signalKey
        );

        if (signal.active) {
            mistakes.push({ ...signal.payload });
        }

        writeMistakes(mistakes);
        return;
    }

    const weakMap = readWeakWordMap();
    const current = (weakMap[signal.subjectId] ?? []).filter(
        word => word !== signal.payload.word
    );
    weakMap[signal.subjectId] = signal.active
        ? [...current, signal.payload.word]
        : current;
    writeWeakWordMap(weakMap);
}

function readMistakes(): MistakeRecord[] {
    const parsed = readJson(
        getAccountScopedStorageKey(MISTAKES_STORAGE_KEY),
        []
    );

    return Array.isArray(parsed)
        ? parsed.filter(isMistakeRecord)
        : [];
}

function writeMistakes(
    mistakes: readonly MistakeRecord[]
): void {
    localStorage.setItem(
        getAccountScopedStorageKey(MISTAKES_STORAGE_KEY),
        JSON.stringify(mistakes)
    );
}

function readWeakWordMap(): VocabWeakMap {
    const parsed = readJson(
        getAccountScopedStorageKey(WEAK_WORDS_STORAGE_KEY),
        {}
    );

    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
        return {};
    }

    return Object.fromEntries(
        Object.entries(parsed).flatMap(([packId, value]) =>
            Array.isArray(value)
                ? [[
                    packId,
                    value.filter(
                        (word): word is string => typeof word === "string"
                    )
                ]]
                : []
        )
    );
}

function writeWeakWordMap(
    weakMap: VocabWeakMap
): void {
    localStorage.setItem(
        getAccountScopedStorageKey(WEAK_WORDS_STORAGE_KEY),
        JSON.stringify(weakMap)
    );
}

function readReviewSignals(): Record<string, ReviewSignal> {
    const parsed = readJson(
        getAccountScopedStorageKey(REVIEW_SIGNAL_CHANGES_STORAGE_KEY),
        {}
    );

    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
        return {};
    }

    return Object.fromEntries(
        Object.entries(parsed).flatMap(([key, value]) => {
            try {
                assertReviewSignal(value);
                return [[key, cloneReviewSignal(value)]];
            } catch {
                return [];
            }
        })
    );
}

function writeReviewSignals(
    signals: Record<string, ReviewSignal>
): void {
    localStorage.setItem(
        getAccountScopedStorageKey(REVIEW_SIGNAL_CHANGES_STORAGE_KEY),
        JSON.stringify(signals)
    );
}

function readJson(
    key: string,
    fallback: unknown
): unknown {
    try {
        return JSON.parse(localStorage.getItem(key) ?? JSON.stringify(fallback));
    } catch {
        return fallback;
    }
}

function createSignalStorageKey(
    signal: Pick<ReviewSignal, "signalType" | "subjectId" | "signalKey">
): string {
    return JSON.stringify([
        signal.signalType,
        signal.subjectId,
        signal.signalKey
    ]);
}

function cloneReviewSignal(
    signal: ReviewSignal
): ReviewSignal {
    return signal.signalType === "mistake"
        ? {
            ...signal,
            payload: {
                ...signal.payload,
                correctAnswer: Array.isArray(signal.payload.correctAnswer)
                    ? [...signal.payload.correctAnswer]
                    : signal.payload.correctAnswer,
                userAnswer: Array.isArray(signal.payload.userAnswer)
                    ? [...signal.payload.userAnswer]
                    : signal.payload.userAnswer
            }
        }
        : {
            ...signal,
            payload: { ...signal.payload }
        };
}

function assertSameSignal(
    left: ReviewSignal,
    right: ReviewSignal
): void {
    if (
        left.signalType !== right.signalType
        || left.subjectId !== right.subjectId
        || left.signalKey !== right.signalKey
    ) {
        throw new TypeError("Cannot merge unrelated review signals");
    }
}

function assertReviewSignal(
    value: unknown
): asserts value is ReviewSignal {
    if (!value || typeof value !== "object" || Array.isArray(value)) {
        throw new TypeError("Invalid review signal");
    }

    const signal = value as Partial<ReviewSignal>;
    if (
        (signal.signalType !== "mistake" && signal.signalType !== "weak_word")
        || typeof signal.active !== "boolean"
        || typeof signal.changedAt !== "string"
        || !Number.isFinite(Date.parse(signal.changedAt))
        || typeof signal.signalKey !== "string"
        || typeof signal.subjectId !== "string"
    ) {
        throw new TypeError("Invalid review signal");
    }

    assertIdentifier(signal.signalKey, "signal key");
    assertIdentifier(signal.subjectId, "subject id");

    if (signal.signalType === "mistake") {
        if (!isMistakeRecord(signal.payload)) {
            throw new TypeError("Invalid mistake signal");
        }
        if (
            signal.payload.lessonId !== signal.subjectId
            || getMistakeSignalKey(signal.payload) !== signal.signalKey
        ) {
            throw new TypeError("Mismatched mistake signal identity");
        }
        return;
    }

    const payload = signal.payload as Partial<WeakWordSignalPayload> | undefined;
    if (!payload || typeof payload.word !== "string") {
        throw new TypeError("Invalid weak-word signal");
    }
    assertIdentifier(payload.word, "weak word");
    if (payload.word !== signal.signalKey) {
        throw new TypeError("Mismatched weak-word signal identity");
    }
}

function assertIdentifier(
    value: string,
    label: string
): void {
    if (!value || value.trim() !== value || value.length > 200) {
        throw new TypeError(`Invalid ${label}`);
    }
}

function isMistakeRecord(
    value: unknown
): value is MistakeRecord {
    if (!value || typeof value !== "object" || Array.isArray(value)) {
        return false;
    }

    const mistake = value as Partial<MistakeRecord>;
    return (
        typeof mistake.lessonId === "string"
        && typeof mistake.sectionId === "string"
        && Number.isInteger(mistake.questionIndex)
        && typeof mistake.timestamp === "string"
        && Number.isFinite(Date.parse(mistake.timestamp))
        && isExerciseAnswer(mistake.userAnswer)
        && isExerciseAnswer(mistake.correctAnswer)
        && (mistake.id === undefined || typeof mistake.id === "string")
    );
}

function isExerciseAnswer(
    value: unknown
): value is ExerciseAnswer {
    return typeof value === "number"
        || typeof value === "string"
        || (
            Array.isArray(value)
            && value.every(item => typeof item === "string")
        );
}

function dispatchReviewSignalEvent(
    eventName: string,
    signal: ReviewSignal
): void {
    if (typeof window === "undefined" || typeof CustomEvent === "undefined") {
        return;
    }

    window.dispatchEvent(
        new CustomEvent<ReviewSignalChangeDetail>(
            eventName,
            { detail: { signal: cloneReviewSignal(signal) } }
        )
    );
}

export {
    REVIEW_SIGNAL_CHANGE_EVENT,
    REVIEW_SIGNAL_IMPORTED_EVENT,
    assertReviewSignal,
    chooseLatestReviewSignal,
    clearMistakesForLesson,
    getAllMistakes,
    getAllWeakWords,
    getWeakWords,
    initializeLocalReviewSignals,
    mergeRemoteReviewSignal,
    saveMistake,
    setWeakWord
};

export type {
    MistakeReviewSignal,
    ReviewSignal,
    ReviewSignalChangeDetail,
    WeakWordReviewSignal,
    WeakWordSignalPayload
};
