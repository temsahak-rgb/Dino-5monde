import assert from "node:assert/strict";

import {
    Given,
    Then,
    When
} from "@cucumber/cucumber";

import {
    normalizeEmail
} from "../../src/services/backend/authGateway.js";
import {
    formatLearnerDisplayName,
    normalizeLearnerProfileDraft
} from "../../src/services/backend/learnerProfileRepository.js";
import type {
    ProductWorld
} from "../support/productWorld.js";

Given(
    "a learner has access to an authorized email address",
    function (this: ProductWorld): void {
        this.email =
            "learner@example.com";
    }
);

When(
    "the learner requests and follows a valid email sign-in link",
    function (this: ProductWorld): void {
        assert.equal(
            normalizeEmail(
                this.email
                ?? ""
            ),
            "learner@example.com"
        );
        this.authenticatedUserId =
            "11111111-1111-4111-8111-111111111111";
    }
);

Then(
    "the learner is authenticated into one account",
    function (this: ProductWorld): void {
        assert.match(
            this.authenticatedUserId
            ?? "",
            /^[0-9a-f-]{36}$/u
        );
    }
);

Given(
    "an authenticated learner has no profile",
    function (this: ProductWorld): void {
        this.authenticatedUserId =
            "11111111-1111-4111-8111-111111111111";
        this.learnerProfile =
            undefined;
    }
);

When(
    "the learner submits the required profile information",
    function (this: ProductWorld): void {
        assert.ok(
            this.authenticatedUserId
        );

        this.learnerProfile =
            normalizeLearnerProfileDraft({
                avatarKey: "dino-green",
                displayName: "Mina",
                showSaurusSuffix: true
            });
    }
);

Then(
    "one learner profile is created",
    function (this: ProductWorld): void {
        assert.deepEqual(
            this.learnerProfile,
            {
                avatarKey: "dino-green",
                displayName: "Mina",
                showSaurusSuffix: true
            }
        );
    }
);

Given(
    "a learner profile named {string}",
    function (
        this: ProductWorld,
        displayName: string
    ): void {
        this.learnerProfile = {
            avatarKey: "dino-green",
            displayName,
            showSaurusSuffix: false
        };
    }
);

When(
    "the learner keeps the Saurus display suffix enabled",
    function (this: ProductWorld): void {
        assert.ok(
            this.learnerProfile
        );

        this.learnerProfile = {
            ...this.learnerProfile,
            showSaurusSuffix: true
        };
        this.displayedLearnerName =
            formatLearnerDisplayName({
                display_name:
                    this.learnerProfile.displayName,
                show_saurus_suffix:
                    this.learnerProfile.showSaurusSuffix
            });
    }
);

Then(
    "the displayed learner name is {string}",
    function (
        this: ProductWorld,
        expectedName: string
    ): void {
        assert.equal(
            this.displayedLearnerName,
            expectedName
        );
    }
);
