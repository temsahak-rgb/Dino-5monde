import assert from "node:assert/strict";
import test from "node:test";

import {
    buildMistakeReviewItems,
    buildWeakWordReviewItems
} from "../../src/core/reviewEngine.js";

const catalog = [{
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
