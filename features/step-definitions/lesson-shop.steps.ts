import assert from "node:assert/strict";

import {
    Given,
    Then,
    When
} from "@cucumber/cucumber";

import type {
    ProductWorld
} from "../support/productWorld.js";

Given(
    "an authenticated learner without a credit wallet",
    function (this: ProductWorld): void {
        this.shopAuthenticated = true;
        this.shopCredits = undefined;
        this.shopOwnedLessonIds = [];
    }
);

When(
    "the starter wallet is created",
    function (this: ProductWorld): void {
        assert.equal(
            this.shopAuthenticated,
            true
        );
        assert.equal(
            this.shopCredits,
            undefined
        );

        this.shopCredits = 100;
    }
);

Given(
    "an authenticated learner with {int} credits",
    function (
        this: ProductWorld,
        credits: number
    ): void {
        this.shopAuthenticated = true;
        this.shopCredits = credits;
        this.shopOwnedLessonIds = [];
    }
);

Given(
    "the Shop lesson {string} costs {int} credits",
    function (
        this: ProductWorld,
        lessonId: string,
        credits: number
    ): void {
        assert.ok(
            lessonId.trim()
        );
        assert.ok(
            credits > 0
        );

        this.shopLessonId = lessonId;
        this.shopLessonPrice = credits;
    }
);

Given(
    "the Shop lesson is not yet owned",
    function (this: ProductWorld): void {
        const lessonId =
            requiredLessonId(this);

        this.shopOwnedLessonIds =
            (this.shopOwnedLessonIds ?? [])
                .filter(
                    ownedLessonId =>
                        ownedLessonId !== lessonId
                );
    }
);

Given(
    "the learner already owns the Shop lesson",
    function (this: ProductWorld): void {
        const lessonId =
            requiredLessonId(this);

        this.shopOwnedLessonIds = [
            lessonId
        ];
    }
);

Given(
    "an unauthenticated Shop visitor",
    function (this: ProductWorld): void {
        this.shopAuthenticated = false;
        this.shopCredits = undefined;
        this.shopOwnedLessonIds = [];
    }
);

When(
    "the learner purchases the Shop lesson",
    purchaseShopLesson
);

When(
    "the learner purchases the Shop lesson again",
    purchaseShopLesson
);

When(
    "the visitor attempts to purchase the Shop lesson",
    purchaseShopLesson
);

Then(
    "the learner has {int} credits",
    assertCredits
);

Then(
    "the learner still has {int} credits",
    assertCredits
);

Then(
    "the Shop purchase succeeds",
    function (this: ProductWorld): void {
        assert.equal(
            this.shopPurchaseStatus,
            "purchased"
        );
    }
);

Then(
    "the Shop purchase is idempotent",
    function (this: ProductWorld): void {
        assert.equal(
            this.shopPurchaseStatus,
            "already-owned"
        );
    }
);

Then(
    "the Shop purchase is refused for insufficient credits",
    function (this: ProductWorld): void {
        assert.equal(
            this.shopPurchaseStatus,
            "insufficient-credits"
        );
    }
);

Then(
    "the Shop purchase requires sign-in",
    function (this: ProductWorld): void {
        assert.equal(
            this.shopPurchaseStatus,
            "sign-in-required"
        );
    }
);

Then(
    "the learner owns exactly one entitlement for the Shop lesson",
    function (this: ProductWorld): void {
        const lessonId =
            requiredLessonId(this);
        const matchingEntitlements =
            (this.shopOwnedLessonIds ?? [])
                .filter(
                    ownedLessonId =>
                        ownedLessonId === lessonId
                );

        assert.equal(
            matchingEntitlements.length,
            1
        );
    }
);

Then(
    "no entitlement is created for the Shop lesson",
    function (this: ProductWorld): void {
        const lessonId =
            requiredLessonId(this);

        assert.equal(
            (this.shopOwnedLessonIds ?? [])
                .includes(lessonId),
            false
        );
    }
);

Then(
    "no credit wallet is debited",
    function (this: ProductWorld): void {
        assert.equal(
            this.shopCredits,
            undefined
        );
    }
);

Given(
    "an authenticated learner completes a credit-bearing activity",
    function (this: ProductWorld): void {
        this.shopAuthenticated = true;
        this.shopCredits = 100;
        this.learningActivityId =
            "travel_lesson:TR-006";
        this.learningActivityComplete = true;
        this.learningRewardCredits = 5;
        this.learningRewardGranted =
            false;
        this.learningRewardLedgerEntries =
            0;
    }
);

Given(
    "an authenticated learner is missing one required lesson section",
    function (this: ProductWorld): void {
        this.shopAuthenticated = true;
        this.shopCredits = 100;
        this.learningActivityId =
            "travel_lesson:TR-006";
        this.learningActivityComplete = false;
        this.learningRewardCredits = 5;
        this.learningRewardGranted = false;
        this.learningRewardLedgerEntries = 0;
    }
);

When(
    "the activity reward is requested twice",
    function (this: ProductWorld): void {
        grantLearningReward.call(this);
        grantLearningReward.call(this);
    }
);

When(
    "the activity reward is requested",
    function (this: ProductWorld): void {
        grantLearningReward.call(this);
    }
);

Then(
    "the learner wallet receives the earned credits exactly once",
    function (this: ProductWorld): void {
        assert.equal(
            this.shopCredits,
            105
        );
    }
);

Then(
    "no learning credits are awarded",
    function (this: ProductWorld): void {
        assert.equal(this.shopCredits, 100);
        assert.equal(
            this.learningRewardStatus,
            "incomplete"
        );
    }
);

Then(
    "no immutable reward claim is recorded",
    function (this: ProductWorld): void {
        assert.equal(
            this.learningRewardLedgerEntries,
            0
        );
    }
);

Then(
    "one immutable reward claim is recorded",
    function (this: ProductWorld): void {
        assert.equal(
            this.learningRewardLedgerEntries,
            1
        );
    }
);

function purchaseShopLesson(
    this: ProductWorld
): void {
    const lessonId =
        requiredLessonId(this);

    if (!this.shopAuthenticated) {
        this.shopPurchaseStatus =
            "sign-in-required";
        return;
    }

    const credits =
        this.shopCredits;
    const price =
        this.shopLessonPrice;

    assert.ok(
        typeof credits
        === "number"
    );
    assert.ok(
        typeof price
        === "number"
    );

    const ownedLessonIds =
        this.shopOwnedLessonIds
        ?? [];

    if (
        ownedLessonIds.includes(
            lessonId
        )
    ) {
        this.shopPurchaseStatus =
            "already-owned";
        return;
    }

    if (credits < price) {
        this.shopPurchaseStatus =
            "insufficient-credits";
        return;
    }

    this.shopCredits =
        credits - price;
    this.shopOwnedLessonIds = [
        ...ownedLessonIds,
        lessonId
    ];
    this.shopPurchaseStatus =
        "purchased";
}

function assertCredits(
    this: ProductWorld,
    expectedCredits: number
): void {
    assert.equal(
        this.shopCredits,
        expectedCredits
    );
}

function requiredLessonId(
    world: ProductWorld
): string {
    const lessonId =
        world.shopLessonId;

    assert.ok(
        lessonId,
        "A Shop lesson must be selected"
    );

    return lessonId;
}

function grantLearningReward(
    this: ProductWorld
): void {
    assert.equal(
        this.shopAuthenticated,
        true
    );
    assert.ok(
        this.learningActivityId
    );
    assert.ok(
        typeof this.shopCredits
            === "number"
    );
    assert.ok(
        typeof this.learningRewardCredits
            === "number"
    );

    if (!this.learningActivityComplete) {
        this.learningRewardStatus =
            "incomplete";
        return;
    }

    if (this.learningRewardGranted) {
        return;
    }

    this.shopCredits +=
        this.learningRewardCredits;
    this.learningRewardGranted =
        true;
    this.learningRewardStatus =
        "awarded";
    this.learningRewardLedgerEntries =
        (
            this.learningRewardLedgerEntries
            ?? 0
        ) + 1;
}
