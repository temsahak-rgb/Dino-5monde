import assert from "node:assert/strict";

import {
    Given,
    Then,
    When
} from "@cucumber/cucumber";

import {
    chooseLatestReviewSignal
} from "../../src/core/reviewSignalEngine.js";
import type {
    ProductWorld
} from "../support/productWorld.js";

Given(
    "a weak word was recorded on an older device",
    function (this: ProductWorld): void {
        this.olderReviewSignal = {
            active: true,
            changedAt: "2026-09-08T09:00:00.000Z",
            payload: { word: "bonjour" },
            signalKey: "bonjour",
            signalType: "weak_word",
            subjectId: "pack-one"
        };
    }
);

Given(
    "the weak word was reviewed on a newer device",
    function (this: ProductWorld): void {
        this.newerReviewSignal = {
            active: false,
            changedAt: "2026-09-08T10:00:00.000Z",
            payload: { word: "bonjour" },
            signalKey: "bonjour",
            signalType: "weak_word",
            subjectId: "pack-one"
        };
    }
);

When(
    "both review signals are merged",
    function (this: ProductWorld): void {
        assert.ok(this.olderReviewSignal);
        assert.ok(this.newerReviewSignal);
        this.mergedReviewSignal = chooseLatestReviewSignal(
            this.olderReviewSignal,
            this.newerReviewSignal
        );
    }
);

Then(
    "the review signal remains inactive",
    function (this: ProductWorld): void {
        assert.equal(this.mergedReviewSignal?.active, false);
    }
);
