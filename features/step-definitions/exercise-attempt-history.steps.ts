import assert from "node:assert/strict";

import {
    Given,
    Then,
    When
} from "@cucumber/cucumber";

import {
    summarizeExerciseAttempts
} from "../../src/features/profile/exerciseAttemptSummary.js";
import type {
    ProductWorld
} from "../support/productWorld.js";

Given(
    "a learner completes a five-question Grammar exercise with four correct answers",
    function (this: ProductWorld): void {
        this.exerciseAttempt = {
            activityId: "A1-G-001",
            attemptId:
                "11111111-1111-4111-8111-111111111111",
            completedAt:
                "2026-09-08T10:00:00.000Z",
            contentType: "grammar",
            correctAnswers: 4,
            exerciseId: "practice",
            totalQuestions: 5
        };
    }
);

When(
    "the same exercise attempt is synchronized twice",
    function (this: ProductWorld): void {
        const attempt = this.exerciseAttempt;

        assert.ok(attempt);
        this.exerciseAttemptHistory = [
            ...new Map(
                [attempt, attempt].map(
                    item => [
                        item.attemptId,
                        item
                    ]
                )
            ).values()
        ];
        this.exerciseAttemptSummary =
            summarizeExerciseAttempts(
                this.exerciseAttemptHistory
            );
    }
);

Then(
    "one immutable 80 percent result appears in the learner profile",
    function (this: ProductWorld): void {
        assert.equal(
            this.exerciseAttemptSummary?.attemptCount,
            1
        );
        assert.equal(
            this.exerciseAttemptSummary?.averagePercentage,
            80
        );
        assert.equal(
            this.exerciseAttemptSummary?.recentAttempts[0],
            this.exerciseAttempt
        );
    }
);
