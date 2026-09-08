import assert from "node:assert/strict";
import test from "node:test";

import {
    summarizeDailyPractice
} from "../../src/features/profile/dailyPracticeSummary.js";
import type {
    ExerciseAttempt
} from "../../src/types/global.js";

const now =
    new Date(2026, 8, 8, 12);

function createAttempt(
    attemptId: string,
    daysAgo: number
): ExerciseAttempt {
    const completedAt =
        new Date(
            2026,
            8,
            8 - daysAgo,
            9
        ).toISOString();

    return {
        activityId: "A1-G-001",
        attemptId,
        completedAt,
        contentType: "grammar",
        correctAnswers: 4,
        exerciseId: `quiz-${attemptId}`,
        totalQuestions: 5
    };
}

test(
    "daily practice counts today's exercises and seven local calendar days",
    () => {
        const summary =
            summarizeDailyPractice(
                [
                    createAttempt(
                        "today-one",
                        0
                    ),
                    createAttempt(
                        "today-two",
                        0
                    ),
                    createAttempt(
                        "older",
                        8
                    )
                ],
                now
            );

        assert.equal(summary.todayAttempts, 2);
        assert.equal(summary.goal, 3);
        assert.equal(summary.goalPercentage, 67);
        assert.equal(summary.week.length, 7);
        assert.equal(
            summary.week.at(-1)?.attemptCount,
            2
        );
        assert.equal(
            summary.week.at(-1)?.today,
            true
        );
    }
);

test(
    "daily streak counts consecutive practice days through today",
    () => {
        const summary =
            summarizeDailyPractice(
                [
                    createAttempt("today", 0),
                    createAttempt("yesterday", 1),
                    createAttempt("two-days", 2),
                    createAttempt("old", 4)
                ],
                now
            );

        assert.equal(summary.currentStreak, 3);
    }
);

test(
    "yesterday keeps a streak alive until today's practice window closes",
    () => {
        const summary =
            summarizeDailyPractice(
                [
                    createAttempt("yesterday", 1),
                    createAttempt("two-days", 2)
                ],
                now
            );

        assert.equal(summary.todayAttempts, 0);
        assert.equal(summary.currentStreak, 2);
    }
);

test(
    "a missed recent day resets the current streak",
    () => {
        const summary =
            summarizeDailyPractice(
                [
                    createAttempt("old", 2),
                    {
                        ...createAttempt(
                            "future",
                            0
                        ),
                        completedAt:
                            new Date(
                                2026,
                                8,
                                9,
                                9
                            ).toISOString()
                    }
                ],
                now
            );

        assert.equal(summary.currentStreak, 0);
        assert.equal(summary.todayAttempts, 0);
    }
);

test(
    "small device clock differences do not hide a newly completed exercise",
    () => {
        const slightlyAhead = {
            ...createAttempt("ahead", 0),
            completedAt:
                new Date(
                    now.getTime()
                    + 60_000
                ).toISOString()
        };

        assert.equal(
            summarizeDailyPractice(
                [slightlyAhead],
                now
            ).todayAttempts,
            1
        );
    }
);
