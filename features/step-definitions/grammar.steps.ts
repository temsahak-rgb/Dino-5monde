import assert from "node:assert/strict";

import {
    Given,
    Then,
    When
} from "@cucumber/cucumber";

import {
    getGrammarLevelFromLessonId,
    getGrammarLevels
} from "../../src/features/grammar/grammarLevels.js";
import {
    splitList
} from "../support/productWorld.js";
import type {
    ProductWorld
} from "../support/productWorld.js";

Given(
    "the supported grammar levels",
    function (
        this: ProductWorld
    ): void {
        this.grammarLevels =
            getGrammarLevels();
    }
);

Then(
    "the grammar levels are {string}",
    function (
        this: ProductWorld,
        levels: string
    ): void {
        assert.deepEqual(
            this.grammarLevels,
            splitList(levels)
        );
    }
);

Given(
    "the grammar lesson identifier {string}",
    function (
        this: ProductWorld,
        lessonId: string
    ): void {
        this.grammarLessonId =
            lessonId;
    }
);

When(
    "its owning grammar level is resolved",
    function (
        this: ProductWorld
    ): void {
        assert.ok(
            this.grammarLessonId
        );

        this.grammarLevel =
            getGrammarLevelFromLessonId(
                this.grammarLessonId
            );
    }
);

Then(
    "the owning grammar level is {string}",
    function (
        this: ProductWorld,
        level: string
    ): void {
        assert.equal(
            this.grammarLevel,
            level
        );
    }
);
