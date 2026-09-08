import assert from "node:assert/strict";
import test from "node:test";

import {
    createDailySessionPlan
} from "../../src/features/practice/dailySessionPlan.js";
import type {
    ExerciseScoreReviewCatalogItem
} from "../../src/core/reviewEngine.js";

const catalog:
    ExerciseScoreReviewCatalogItem[] = [
        {
            contentType: "grammar",
            href: "/grammar/lesson/A1-G-001",
            icon: "📐",
            id: "A1-G-001",
            title: "Grammar one"
        },
        {
            contentType: "grammar",
            href: "/grammar/lesson/A1-G-002",
            icon: "📐",
            id: "A1-G-002",
            title: "Grammar two"
        },
        {
            contentType: "vocabulary",
            href: "/vocabulary/A1/pack-one",
            icon: "📖",
            id: "pack-one",
            level: "A1",
            title: "Vocabulary one"
        },
        {
            contentType: "travel",
            href: "/travel/TR-006",
            icon: "✈️",
            id: "TR-006",
            title: "Travel one"
        },
        {
            contentType: "grammar",
            href: "/grammar/lesson/C1-G-001",
            icon: "📐",
            id: "C1-G-001",
            title: "Paid Grammar"
        }
    ];

test(
    "daily session prioritizes scores, mistakes and weak words without duplicate activities",
    () => {
        const tasks =
            createDailySessionPlan({
                attempts: [{
                    activityId:
                        "A1-G-001",
                    attemptId:
                        "11111111-1111-4111-8111-111111111111",
                    completedAt:
                        "2026-09-08T10:00:00.000Z",
                    contentType:
                        "grammar",
                    correctAnswers: 2,
                    exerciseId: "quiz",
                    totalQuestions: 5
                }],
                catalog,
                dayKey: "2026-09-08",
                learnerLevel: "A1",
                mistakes: [
                    {
                        correctAnswer: 0,
                        lessonId:
                            "A1-G-001",
                        questionIndex: 0,
                        sectionId: "quiz",
                        timestamp:
                            "2026-09-08T09:00:00.000Z",
                        userAnswer: 1
                    },
                    {
                        correctAnswer: 0,
                        lessonId:
                            "A1-G-002",
                        questionIndex: 0,
                        sectionId: "quiz",
                        timestamp:
                            "2026-09-08T09:00:00.000Z",
                        userAnswer: 1
                    }
                ],
                weakWords: {
                    "pack-one": [
                        "bonjour",
                        "salut"
                    ]
                }
            });

        assert.deepEqual(
            tasks.map(task => ({
                id: task.id,
                reason: task.reason
            })),
            [
                {
                    id: "A1-G-001",
                    reason: "score"
                },
                {
                    id: "A1-G-002",
                    reason: "mistake"
                },
                {
                    id: "pack-one",
                    reason: "weak-word"
                }
            ]
        );
        assert.equal(
            tasks[2]?.href,
            "/vocabulary/A1/pack-one/review"
        );
    }
);

test(
    "daily discovery is balanced, level-aware and excludes locked shop content",
    () => {
        const tasks =
            createDailySessionPlan({
                attempts: [],
                catalog,
                dayKey: "2026-09-08",
                learnerLevel: "A1",
                mistakes: [],
                weakWords: {}
            });

        assert.equal(tasks.length, 3);
        assert.deepEqual(
            new Set(
                tasks.map(
                    task =>
                        task.contentType
                )
            ),
            new Set([
                "grammar",
                "vocabulary",
                "travel"
            ])
        );
        assert.equal(
            tasks.some(
                task =>
                    task.id
                    === "C1-G-001"
            ),
            false
        );
        assert.equal(
            tasks.every(
                task =>
                    task.reason
                    === "discovery"
            ),
            true
        );
    }
);

test(
    "daily session rejects unsafe sizing and malformed day keys",
    () => {
        const input = {
            attempts: [],
            catalog,
            dayKey: "2026-09-08",
            learnerLevel: "A1" as const,
            mistakes: [],
            weakWords: {}
        };

        assert.throws(
            () =>
                createDailySessionPlan({
                    ...input,
                    limit: 0
                }),
            TypeError
        );
        assert.throws(
            () =>
                createDailySessionPlan({
                    ...input,
                    dayKey: "today"
                }),
            TypeError
        );
    }
);
