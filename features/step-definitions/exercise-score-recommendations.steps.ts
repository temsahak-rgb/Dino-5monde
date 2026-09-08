import assert from "node:assert/strict";

import {
    Given,
    Then,
    When
} from "@cucumber/cucumber";

import {
    buildExerciseScoreReviewItems
} from "../../src/core/reviewEngine.js";
import type {
    ProductWorld
} from "../support/productWorld.js";

Given(
    "a learner has a 40 percent Grammar score to improve",
    function (this: ProductWorld): void {
        this.exerciseAttemptHistory = [{
            activityId: "A1-G-001",
            attemptId:
                "11111111-1111-4111-8111-111111111111",
            completedAt:
                "2026-09-08T10:00:00.000Z",
            contentType: "grammar",
            correctAnswers: 2,
            exerciseId: "practice",
            totalQuestions: 5
        }];
    }
);

Given(
    "a learner improves the same Grammar exercise to 80 percent",
    function (this: ProductWorld): void {
        this.exerciseAttemptHistory = [
            {
                activityId: "A1-G-001",
                attemptId:
                    "11111111-1111-4111-8111-111111111111",
                completedAt:
                    "2026-09-08T10:00:00.000Z",
                contentType: "grammar",
                correctAnswers: 2,
                exerciseId: "practice",
                totalQuestions: 5
            },
            {
                activityId: "A1-G-001",
                attemptId:
                    "22222222-2222-4222-8222-222222222222",
                completedAt:
                    "2026-09-08T11:00:00.000Z",
                contentType: "grammar",
                correctAnswers: 4,
                exerciseId: "practice",
                totalQuestions: 5
            }
        ];
    }
);

When(
    "the personalized exercise review list is prepared",
    function (this: ProductWorld): void {
        this.exerciseScoreRecommendations =
            buildExerciseScoreReviewItems(
                this.exerciseAttemptHistory
                ?? [],
                [{
                    contentType: "grammar",
                    href:
                        "/grammar/lesson/A1-G-001",
                    icon: "📐",
                    id: "A1-G-001",
                    title:
                        "Les pronoms sujets"
                }]
            );
    }
);

Then(
    "the Grammar exercise is recommended with a direct retry link",
    function (this: ProductWorld): void {
        assert.equal(
            this.exerciseScoreRecommendations?.length,
            1
        );
        assert.equal(
            this.exerciseScoreRecommendations?.[0]?.percentage,
            40
        );
        assert.equal(
            this.exerciseScoreRecommendations?.[0]?.href,
            "/grammar/lesson/A1-G-001"
        );
    }
);

Then(
    "no score recommendation remains for that exercise",
    function (this: ProductWorld): void {
        assert.deepEqual(
            this.exerciseScoreRecommendations,
            []
        );
    }
);
