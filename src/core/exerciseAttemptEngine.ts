import {
    getAccountScopedStorageKey
} from "./learnerStorage.js";

import type {
    ExerciseAttempt,
    ExerciseAttemptDraft
} from "../types/global.js";

const EXERCISE_ATTEMPT_CHANGE_EVENT =
    "dino:exerciseattemptchange";
const EXERCISE_ATTEMPT_IMPORTED_EVENT =
    "dino:exerciseattemptimported";
const EXERCISE_ATTEMPTS_STORAGE_KEY =
    "dino_exercise_attempts";
const MAX_LOCAL_EXERCISE_ATTEMPTS =
    500;

interface ExerciseAttemptChangeDetail {
    attempt: ExerciseAttempt;
}

function recordExerciseAttempt(
    draft: ExerciseAttemptDraft
): ExerciseAttempt {
    const attempt: ExerciseAttempt = {
        ...draft,
        attemptId:
            crypto.randomUUID(),
        completedAt:
            new Date().toISOString()
    };

    assertExerciseAttempt(attempt);
    writeExerciseAttempts([
        attempt,
        ...getAllExerciseAttempts()
    ]);
    dispatchAttemptEvent(
        EXERCISE_ATTEMPT_CHANGE_EVENT,
        attempt
    );

    return attempt;
}

function getAllExerciseAttempts():
    ExerciseAttempt[] {
    const raw =
        localStorage.getItem(
            getAccountScopedStorageKey(
                EXERCISE_ATTEMPTS_STORAGE_KEY
            )
        );

    if (!raw) {
        return [];
    }

    try {
        const parsed =
            JSON.parse(raw) as unknown;

        if (!Array.isArray(parsed)) {
            return [];
        }

        const unique =
            new Map<string, ExerciseAttempt>();

        for (const value of parsed) {
            if (!isExerciseAttempt(value)) {
                continue;
            }

            if (!unique.has(value.attemptId)) {
                unique.set(
                    value.attemptId,
                    {
                        ...value
                    }
                );
            }
        }

        return [...unique.values()]
            .sort(
                (left, right) =>
                    right.completedAt.localeCompare(
                        left.completedAt
                    )
            )
            .slice(
                0,
                MAX_LOCAL_EXERCISE_ATTEMPTS
            );
    } catch {
        return [];
    }
}

function mergeRemoteExerciseAttempt(
    attempt: ExerciseAttempt
): void {
    assertExerciseAttempt(attempt);
    writeExerciseAttempts([
        attempt,
        ...getAllExerciseAttempts().filter(
            current =>
                current.attemptId
                    !== attempt.attemptId
        )
    ]);
    dispatchAttemptEvent(
        EXERCISE_ATTEMPT_IMPORTED_EVENT,
        attempt
    );
}

function writeExerciseAttempts(
    attempts: readonly ExerciseAttempt[]
): void {
    const unique =
        new Map<string, ExerciseAttempt>();

    for (const attempt of attempts) {
        if (!unique.has(attempt.attemptId)) {
            unique.set(
                attempt.attemptId,
                attempt
            );
        }
    }

    const stored =
        [...unique.values()]
            .sort(
                (left, right) =>
                    right.completedAt.localeCompare(
                        left.completedAt
                    )
            )
            .slice(
                0,
                MAX_LOCAL_EXERCISE_ATTEMPTS
            );

    localStorage.setItem(
        getAccountScopedStorageKey(
            EXERCISE_ATTEMPTS_STORAGE_KEY
        ),
        JSON.stringify(stored)
    );
}

function assertExerciseAttempt(
    attempt: ExerciseAttempt
): void {
    if (!isExerciseAttempt(attempt)) {
        throw new TypeError(
            "Invalid exercise attempt"
        );
    }
}

function isExerciseAttempt(
    value: unknown
): value is ExerciseAttempt {
    if (
        !value
        || typeof value !== "object"
        || Array.isArray(value)
    ) {
        return false;
    }

    const attempt =
        value as Partial<ExerciseAttempt>;
    const vocabulary =
        attempt.contentType
            === "vocabulary";

    return (
        typeof attempt.attemptId
            === "string"
        && isUuid(attempt.attemptId)
        && (
            attempt.contentType
                === "grammar"
            || attempt.contentType
                === "travel"
            || vocabulary
        )
        && isSafeIdentifier(
            attempt.activityId
        )
        && isSafeIdentifier(
            attempt.exerciseId
        )
        && (
            vocabulary
                ? isLevel(attempt.level)
                : attempt.level
                    === undefined
        )
        && Number.isInteger(
            attempt.correctAnswers
        )
        && Number.isInteger(
            attempt.totalQuestions
        )
        && (
            attempt.totalQuestions
            ?? 0
        ) >= 1
        && (
            attempt.totalQuestions
            ?? 0
        ) <= 200
        && (
            attempt.correctAnswers
            ?? -1
        ) >= 0
        && (
            attempt.correctAnswers
            ?? 0
        ) <= (
            attempt.totalQuestions
            ?? -1
        )
        && typeof attempt.completedAt
            === "string"
        && Number.isFinite(
            Date.parse(
                attempt.completedAt
            )
        )
        && attempt.completedAt
            >= "2020-01-01T00:00:00.000Z"
    );
}

function isSafeIdentifier(
    value: unknown
): value is string {
    return (
        typeof value === "string"
        && value.length >= 1
        && value.length <= 160
        && value.trim() === value
        && !/[\u0000-\u001f\u007f]/u.test(
            value
        )
    );
}

function isLevel(
    value: unknown
): boolean {
    return (
        value === "A1"
        || value === "A2"
        || value === "B1"
        || value === "B2"
        || value === "C1"
        || value === "C2"
    );
}

function isUuid(
    value: string
): boolean {
    return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/iu.test(
        value
    );
}

function dispatchAttemptEvent(
    eventName: string,
    attempt: ExerciseAttempt
): void {
    if (
        typeof window === "undefined"
        || typeof CustomEvent === "undefined"
    ) {
        return;
    }

    window.dispatchEvent(
        new CustomEvent<ExerciseAttemptChangeDetail>(
            eventName,
            {
                detail: {
                    attempt
                }
            }
        )
    );
}

export {
    EXERCISE_ATTEMPT_CHANGE_EVENT,
    EXERCISE_ATTEMPT_IMPORTED_EVENT,
    MAX_LOCAL_EXERCISE_ATTEMPTS,
    getAllExerciseAttempts,
    mergeRemoteExerciseAttempt,
    recordExerciseAttempt
};

export type {
    ExerciseAttemptChangeDetail
};
