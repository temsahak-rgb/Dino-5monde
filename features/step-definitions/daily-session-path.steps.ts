import assert from "node:assert/strict";

import {
    Given,
    Then,
    When
} from "@cucumber/cucumber";

import type {
    ExerciseScoreReviewCatalogItem
} from "../../src/core/reviewEngine.js";
import {
    createDailySessionPlan
} from "../../src/features/practice/dailySessionPlan.js";
import type {
    ProductWorld
} from "../support/productWorld.js";

const dailyCatalog:
    ExerciseScoreReviewCatalogItem[] = [
        {
            contentType: "grammar",
            href: "/grammar/lesson/A1-G-001",
            icon: "📐",
            id: "A1-G-001",
            title: "First grammar lesson"
        },
        {
            contentType: "grammar",
            href: "/grammar/lesson/A1-G-002",
            icon: "📐",
            id: "A1-G-002",
            title: "Second grammar lesson"
        },
        {
            contentType: "vocabulary",
            href: "/vocabulary/A1/pack-one",
            icon: "📖",
            id: "pack-one",
            level: "A1",
            title: "First vocabulary pack"
        }
    ];

Given(
    "the learner has a low score, a different lesson mistake and weak vocabulary",
    function (this: ProductWorld): void {
        this.exerciseAttemptHistory = [{
            activityId: "A1-G-001",
            attemptId:
                "11111111-1111-4111-8111-111111111111",
            completedAt:
                "2026-09-07T10:00:00.000Z",
            contentType: "grammar",
            correctAnswers: 2,
            exerciseId: "quiz",
            totalQuestions: 5
        }];
        this.reviewMistakes = [{
            correctAnswer: 0,
            lessonId: "A1-G-002",
            questionIndex: 0,
            sectionId: "quiz",
            timestamp:
                "2026-09-08T09:00:00.000Z",
            userAnswer: 1
        }];
        this.reviewWeakWords = {
            "pack-one": [
                "bonjour",
                "salut"
            ]
        };
    }
);

When(
    "the daily three-step session is prepared",
    function (this: ProductWorld): void {
        this.dailySessionTasks =
            createDailySessionPlan({
                attempts:
                    this.exerciseAttemptHistory
                    ?? [],
                catalog:
                    dailyCatalog,
                dayKey:
                    "2026-09-08",
                learnerLevel:
                    "A1",
                mistakes:
                    this.reviewMistakes
                    ?? [],
                weakWords:
                    this.reviewWeakWords
                    ?? {}
            });
    }
);

Then(
    "the session contains three unique tasks in learning priority order",
    function (this: ProductWorld): void {
        assert.deepEqual(
            this.dailySessionTasks?.map(
                task => [
                    task.id,
                    task.reason
                ]
            ),
            [
                [
                    "A1-G-001",
                    "score"
                ],
                [
                    "A1-G-002",
                    "mistake"
                ],
                [
                    "pack-one",
                    "weak-word"
                ]
            ]
        );
        assert.equal(
            new Set(
                this.dailySessionTasks?.map(
                    task =>
                        task.id
                )
            ).size,
            3
        );
    }
);
