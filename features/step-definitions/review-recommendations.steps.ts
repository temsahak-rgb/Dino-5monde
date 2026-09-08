import assert from "node:assert/strict";

import {
    Given,
    Then,
    When
} from "@cucumber/cucumber";

import {
    buildMistakeReviewItems
} from "../../src/core/reviewEngine.js";

import type {
    ProductWorld
} from "../support/productWorld.js";

Given(
    "a learner made {int} mistakes in grammar lesson {string}",
    function (this: ProductWorld, count: number, lessonId: string): void {
        this.reviewMistakes = Array.from({ length: count }, (_, index) => ({
            lessonId,
            sectionId: "exercise",
            questionIndex: index,
            userAnswer: 1,
            correctAnswer: 0,
            timestamp: `2026-09-08T10:0${index}:00.000Z`
        }));
    }
);

When(
    "review recommendations are prepared",
    function (this: ProductWorld): void {
        assert.ok(this.reviewMistakes);

        this.reviewItems = buildMistakeReviewItems(
            this.reviewMistakes,
            [{
                href: "/grammar/lesson/A1-G-001",
                icon: "📐",
                id: "A1-G-001",
                title: "Subject pronouns"
            }]
        );
    }
);

Then(
    "one recommendation links to {string}",
    function (this: ProductWorld, href: string): void {
        assert.equal(this.reviewItems?.length, 1);
        assert.equal(this.reviewItems[0]?.href, href);
    }
);

Then(
    "the recommendation reports {int} mistakes",
    function (this: ProductWorld, count: number): void {
        assert.equal(this.reviewItems?.[0]?.count, count);
    }
);
