import assert from "node:assert/strict";

import {
    Given,
    Then,
    When
} from "@cucumber/cucumber";

import {
    summarizeDailyPractice
} from "../../src/features/profile/dailyPracticeSummary.js";
import type {
    ExerciseAttempt
} from "../../src/types/global.js";
import type {
    ProductWorld
} from "../support/productWorld.js";

const summaryDate =
    new Date(2026, 8, 8, 12);

Given(
    "a learner practiced on three consecutive days including today",
    function (this: ProductWorld): void {
        this.exerciseAttemptHistory = [
            createAttempt("today-one", 0),
            createAttempt("yesterday", 1),
            createAttempt("two-days", 2)
        ];
    }
);

Given(
    "the learner completed two exercises today",
    function (this: ProductWorld): void {
        this.exerciseAttemptHistory = [
            ...(this.exerciseAttemptHistory
                ?? []),
            createAttempt("today-two", 0)
        ];
    }
);

When(
    "the daily practice summary is prepared for a three-exercise goal",
    function (this: ProductWorld): void {
        this.dailyPracticeSummary =
            summarizeDailyPractice(
                this.exerciseAttemptHistory
                ?? [],
                summaryDate,
                3
            );
    }
);

Then(
    "the profile shows a three-day streak and one exercise remaining",
    function (this: ProductWorld): void {
        assert.equal(
            this.dailyPracticeSummary?.currentStreak,
            3
        );
        assert.equal(
            this.dailyPracticeSummary?.todayAttempts,
            2
        );
        assert.equal(
            (
                this.dailyPracticeSummary?.goal
                ?? 0
            )
            - (
                this.dailyPracticeSummary?.todayAttempts
                ?? 0
            ),
            1
        );
    }
);

function createAttempt(
    attemptId: string,
    daysAgo: number
): ExerciseAttempt {
    return {
        activityId: "A1-G-001",
        attemptId,
        completedAt:
            new Date(
                2026,
                8,
                8 - daysAgo,
                9
            ).toISOString(),
        contentType: "grammar",
        correctAnswers: 4,
        exerciseId: `quiz-${attemptId}`,
        totalQuestions: 5
    };
}
