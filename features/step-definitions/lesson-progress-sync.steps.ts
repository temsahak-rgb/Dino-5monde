import assert from "node:assert/strict";

import {
    Given,
    Then,
    When
} from "@cucumber/cucumber";

import {
    mergeLessonProgress
} from "../../src/core/progressEngine.js";
import type {
    LessonProgress
} from "../../src/types/global.js";

import {
    splitList
} from "../support/productWorld.js";
import type {
    ProductWorld
} from "../support/productWorld.js";

Given(
    "one device completed sections {string} of a lesson",
    function (this: ProductWorld, sections: string): void {
        this.localLessonProgress = {
            completedSections: splitList(sections),
            currentSection: 2,
            lastAccessed: "2026-09-08T10:00:00.000Z",
            status: "completed"
        };
    }
);

Given(
    "another device reports section {string} as in progress",
    function (this: ProductWorld, section: string): void {
        this.remoteLessonProgress = {
            completedSections: [section],
            currentSection: 1,
            lastAccessed: "2026-09-07T10:00:00.000Z",
            status: "in_progress"
        };
    }
);

When(
    "both lesson progress records are merged",
    function (this: ProductWorld): void {
        assert.ok(this.localLessonProgress);
        assert.ok(this.remoteLessonProgress);
        this.mergedLessonProgress = mergeLessonProgress(
            this.localLessonProgress,
            this.remoteLessonProgress
        );
    }
);

Then(
    "the lesson remains completed",
    function (this: ProductWorld): void {
        assert.equal(
            this.mergedLessonProgress?.status,
            "completed"
        );
    }
);

Then(
    "the completed sections are {string}",
    function (this: ProductWorld, sections: string): void {
        assert.deepEqual(
            this.mergedLessonProgress?.completedSections,
            splitList(sections)
        );
    }
);
