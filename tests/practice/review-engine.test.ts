import assert from "node:assert/strict";
import test from "node:test";

import {
    buildExerciseScoreReviewItems,
    buildMistakeReviewItems,
    buildWeakWordReviewItems
} from "../../src/core/reviewEngine.js";

const catalog = [{
    href: "/grammar/lesson/A1-G-001",
    icon: "📐",
    id: "A1-G-001",
    title: "Les pronoms sujets"
}];

const exerciseCatalog = [{
    contentType: "grammar" as const,
    href: "/grammar/lesson/A1-G-001",
    icon: "📐",
    id: "A1-G-001",
    title: "Les pronoms sujets"
}];

test(
    "mistakes are grouped into a recent actionable lesson recommendation",
    () => {
        const items = buildMistakeReviewItems(
            [
                {
                    lessonId: "A1-G-001",
                    sectionId: "quiz",
                    questionIndex: 0,
                    userAnswer: 1,
                    correctAnswer: 0,
                    timestamp: "2026-09-07T10:00:00.000Z"
                },
                {
                    lessonId: "A1-G-001",
                    sectionId: "quiz",
                    questionIndex: 1,
                    userAnswer: "tu",
                    correctAnswer: "il",
                    timestamp: "2026-09-08T10:00:00.000Z"
                }
            ],
            catalog
        );

        assert.equal(items.length, 1);
        assert.equal(items[0]?.count, 2);
        assert.equal(items[0]?.href, "/grammar/lesson/A1-G-001");
        assert.equal(items[0]?.lastMistakeAt, "2026-09-08T10:00:00.000Z");
    }
);

test(
    "weak-word recommendations deduplicate words and ignore stale packs",
    () => {
        const items = buildWeakWordReviewItems(
            {
                "A1-G-001": ["bonjour", "bonjour", "salut"],
                missing: ["fantôme"]
            },
            catalog
        );

        assert.deepEqual(items[0]?.words, ["bonjour", "salut"]);
        assert.equal(items.length, 1);
    }
);

test(
    "review recommendations ignore corrupted local timestamps",
    () => {
        const items = buildMistakeReviewItems(
            [{
                lessonId: "A1-G-001",
                sectionId: "quiz",
                questionIndex: 0,
                userAnswer: 1,
                correctAnswer: 0,
                timestamp: "not-a-date"
            }],
            catalog
        );

        assert.deepEqual(items, []);
    }
);

test(
    "exercise recommendations keep only the latest score for each exercise",
    () => {
        const items =
            buildExerciseScoreReviewItems(
                [
                    {
                        activityId: "A1-G-001",
                        attemptId:
                            "11111111-1111-4111-8111-111111111111",
                        completedAt:
                            "2026-09-08T09:00:00.000Z",
                        contentType: "grammar",
                        correctAnswers: 4,
                        exerciseId: "quiz",
                        totalQuestions: 5
                    },
                    {
                        activityId: "A1-G-001",
                        attemptId:
                            "22222222-2222-4222-8222-222222222222",
                        completedAt:
                            "2026-09-08T10:00:00.000Z",
                        contentType: "grammar",
                        correctAnswers: 2,
                        exerciseId: "quiz",
                        totalQuestions: 5
                    }
                ],
                exerciseCatalog
            );

        assert.equal(items.length, 1);
        assert.equal(items[0]?.percentage, 40);
        assert.equal(
            items[0]?.completedAt,
            "2026-09-08T10:00:00.000Z"
        );
    }
);

test(
    "a successful retry clears the exercise recommendation",
    () => {
        const items =
            buildExerciseScoreReviewItems(
                [
                    {
                        activityId: "A1-G-001",
                        attemptId:
                            "11111111-1111-4111-8111-111111111111",
                        completedAt:
                            "2026-09-08T09:00:00.000Z",
                        contentType: "grammar",
                        correctAnswers: 1,
                        exerciseId: "quiz",
                        totalQuestions: 5
                    },
                    {
                        activityId: "A1-G-001",
                        attemptId:
                            "22222222-2222-4222-8222-222222222222",
                        completedAt:
                            "2026-09-08T10:00:00.000Z",
                        contentType: "grammar",
                        correctAnswers: 4,
                        exerciseId: "quiz",
                        totalQuestions: 5
                    }
                ],
                exerciseCatalog
            );

        assert.deepEqual(items, []);
    }
);

test(
    "exercise recommendations prioritize the lowest latest scores",
    () => {
        const items =
            buildExerciseScoreReviewItems(
                [
                    {
                        activityId: "A1-G-001",
                        attemptId:
                            "11111111-1111-4111-8111-111111111111",
                        completedAt:
                            "2026-09-08T09:00:00.000Z",
                        contentType: "grammar",
                        correctAnswers: 3,
                        exerciseId: "quiz-one",
                        totalQuestions: 5
                    },
                    {
                        activityId: "A1-G-001",
                        attemptId:
                            "22222222-2222-4222-8222-222222222222",
                        completedAt:
                            "2026-09-08T10:00:00.000Z",
                        contentType: "grammar",
                        correctAnswers: 1,
                        exerciseId: "quiz-two",
                        totalQuestions: 5
                    }
                ],
                exerciseCatalog
            );

        assert.deepEqual(
            items.map(item => item.percentage),
            [20, 60]
        );
    }
);
