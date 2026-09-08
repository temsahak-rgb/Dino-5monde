import assert from "node:assert/strict";
import test from "node:test";

import {
    getAllExerciseAttempts,
    mergeRemoteExerciseAttempt,
    recordExerciseAttempt
} from "../../src/core/exerciseAttemptEngine.js";
import {
    setActiveLearnerAccount
} from "../../src/core/learnerStorage.js";

class MemoryStorage {
    private readonly values = new Map<string, string>();

    clear(): void {
        this.values.clear();
    }

    getItem(key: string): string | null {
        return this.values.get(key) ?? null;
    }

    removeItem(key: string): void {
        this.values.delete(key);
    }

    setItem(key: string, value: string): void {
        this.values.set(key, value);
    }
}

const memoryStorage = new MemoryStorage();
Object.defineProperty(
    globalThis,
    "localStorage",
    {
        configurable: true,
        value: memoryStorage
    }
);

test(
    "anonymous exercise history is adopted once and stays isolated by account",
    () => {
        memoryStorage.clear();
        const anonymousAttempt =
            recordExerciseAttempt({
                activityId: "A1-G-001",
                contentType: "grammar",
                correctAnswers: 4,
                exerciseId: "practice",
                totalQuestions: 5
            });

        setActiveLearnerAccount("learner-one");
        assert.deepEqual(
            getAllExerciseAttempts(),
            [anonymousAttempt]
        );

        setActiveLearnerAccount("learner-two");
        assert.deepEqual(getAllExerciseAttempts(), []);
        recordExerciseAttempt({
            activityId: "TR-006",
            contentType: "travel",
            correctAnswers: 3,
            exerciseId: "hotel-quiz",
            totalQuestions: 3
        });

        setActiveLearnerAccount("learner-one");
        assert.deepEqual(
            getAllExerciseAttempts(),
            [anonymousAttempt]
        );
    }
);

test(
    "remote attempts merge idempotently and remain newest first",
    () => {
        memoryStorage.clear();
        setActiveLearnerAccount("learner-one");
        const older = {
            activityId: "pack-one",
            attemptId:
                "11111111-1111-4111-8111-111111111111",
            completedAt:
                "2026-09-08T09:00:00.000Z",
            contentType: "vocabulary" as const,
            correctAnswers: 2,
            exerciseId: "quiz",
            level: "A1" as const,
            totalQuestions: 3
        };
        const newer = {
            activityId: "A1-G-001",
            attemptId:
                "22222222-2222-4222-8222-222222222222",
            completedAt:
                "2026-09-08T10:00:00.000Z",
            contentType: "grammar" as const,
            correctAnswers: 5,
            exerciseId: "practice",
            totalQuestions: 5
        };

        mergeRemoteExerciseAttempt(older);
        mergeRemoteExerciseAttempt(newer);
        mergeRemoteExerciseAttempt(older);

        assert.deepEqual(
            getAllExerciseAttempts(),
            [newer, older]
        );
    }
);

test(
    "corrupt or structurally invalid local attempts are ignored",
    () => {
        memoryStorage.clear();
        setActiveLearnerAccount(null);
        memoryStorage.setItem(
            "dino_exercise_attempts",
            JSON.stringify([
                { attemptId: "not-a-uuid" },
                null,
                "bad"
            ])
        );

        assert.deepEqual(getAllExerciseAttempts(), []);
    }
);
