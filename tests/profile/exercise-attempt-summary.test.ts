import assert from "node:assert/strict";
import test from "node:test";

import {
    summarizeExerciseAttempts,
    toPercentage
} from "../../src/features/profile/exerciseAttemptSummary.js";
import type {
    ExerciseAttempt
} from "../../src/types/global.js";

const attempts: ExerciseAttempt[] = [
    {
        activityId: "A1-G-001",
        attemptId:
            "11111111-1111-4111-8111-111111111111",
        completedAt: "2026-09-08T09:00:00.000Z",
        contentType: "grammar",
        correctAnswers: 4,
        exerciseId: "practice",
        totalQuestions: 5
    },
    {
        activityId: "TR-006",
        attemptId:
            "22222222-2222-4222-8222-222222222222",
        completedAt: "2026-09-08T10:00:00.000Z",
        contentType: "travel",
        correctAnswers: 2,
        exerciseId: "hotel-quiz",
        totalQuestions: 5
    },
    {
        activityId: "pack-one",
        attemptId:
            "33333333-3333-4333-8333-333333333333",
        completedAt: "2026-09-08T11:00:00.000Z",
        contentType: "vocabulary",
        correctAnswers: 1,
        exerciseId: "quiz",
        level: "A1",
        totalQuestions: 2
    }
];

test(
    "exercise history exposes weighted average, best score and recent order",
    () => {
        const summary =
            summarizeExerciseAttempts(
                attempts,
                2
            );

        assert.equal(summary.attemptCount, 3);
        assert.equal(summary.averagePercentage, 58);
        assert.equal(summary.bestPercentage, 80);
        assert.deepEqual(
            summary.recentAttempts.map(
                attempt => attempt.attemptId
            ),
            [
                "33333333-3333-4333-8333-333333333333",
                "22222222-2222-4222-8222-222222222222"
            ]
        );
    }
);

test(
    "exercise history keeps a stable empty state and rounded percentages",
    () => {
        assert.deepEqual(
            summarizeExerciseAttempts([]),
            {
                attemptCount: 0,
                averagePercentage: 0,
                bestPercentage: 0,
                recentAttempts: []
            }
        );
        assert.equal(toPercentage(2, 3), 67);
    }
);
