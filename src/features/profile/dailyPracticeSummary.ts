import type {
    ExerciseAttempt
} from "../../types/global.js";

const DAILY_EXERCISE_GOAL = 3;
const DAILY_PRACTICE_WINDOW = 7;
const MAX_EXERCISE_CLOCK_SKEW_MS =
    5 * 60 * 1_000;

interface DailyPracticeDay {
    attemptCount: number;
    dateKey: string;
    goalReached: boolean;
    today: boolean;
}

interface DailyPracticeSummary {
    currentStreak: number;
    goal: number;
    goalPercentage: number;
    todayAttempts: number;
    week: DailyPracticeDay[];
}

function summarizeDailyPractice(
    attempts: readonly ExerciseAttempt[],
    now = new Date(),
    goal = DAILY_EXERCISE_GOAL
): DailyPracticeSummary {
    if (
        !Number.isInteger(goal)
        || goal < 1
        || goal > 100
        || !Number.isFinite(now.getTime())
    ) {
        throw new TypeError(
            "Invalid daily practice inputs"
        );
    }

    const attemptsByDay =
        new Map<string, number>();
    const todayKey =
        toLocalDateKey(now);

    for (const attempt of attempts) {
        const completedAt =
            new Date(attempt.completedAt);

        if (
            !Number.isFinite(
                completedAt.getTime()
            )
            || completedAt.getTime()
                > now.getTime()
                + MAX_EXERCISE_CLOCK_SKEW_MS
        ) {
            continue;
        }

        const dateKey =
            toLocalDateKey(completedAt);

        if (dateKey > todayKey) {
            continue;
        }

        attemptsByDay.set(
            dateKey,
            (
                attemptsByDay.get(dateKey)
                ?? 0
            ) + 1
        );
    }

    const todayAttempts =
        attemptsByDay.get(todayKey)
        ?? 0;
    const yesterday =
        addLocalDays(now, -1);
    const streakAnchor =
        todayAttempts > 0
            ? now
            : attemptsByDay.has(
                toLocalDateKey(yesterday)
            )
                ? yesterday
                : null;
    let currentStreak = 0;

    if (streakAnchor) {
        while (
            attemptsByDay.has(
                toLocalDateKey(
                    addLocalDays(
                        streakAnchor,
                        -currentStreak
                    )
                )
            )
        ) {
            currentStreak += 1;
        }
    }

    return {
        currentStreak,
        goal,
        goalPercentage:
            Math.min(
                100,
                Math.round(
                    (
                        todayAttempts
                        / goal
                    )
                    * 100
                )
            ),
        todayAttempts,
        week:
            Array.from(
                {
                    length:
                        DAILY_PRACTICE_WINDOW
                },
                (_, index) => {
                    const date =
                        addLocalDays(
                            now,
                            index
                            - DAILY_PRACTICE_WINDOW
                            + 1
                        );
                    const dateKey =
                        toLocalDateKey(date);
                    const attemptCount =
                        attemptsByDay.get(
                            dateKey
                        )
                        ?? 0;

                    return {
                        attemptCount,
                        dateKey,
                        goalReached:
                            attemptCount
                            >= goal,
                        today:
                            dateKey
                            === todayKey
                    };
                }
            )
    };
}

function addLocalDays(
    source: Date,
    amount: number
): Date {
    return new Date(
        source.getFullYear(),
        source.getMonth(),
        source.getDate() + amount,
        12
    );
}

function toLocalDateKey(
    date: Date
): string {
    return [
        date.getFullYear(),
        String(
            date.getMonth() + 1
        ).padStart(2, "0"),
        String(
            date.getDate()
        ).padStart(2, "0")
    ].join("-");
}

export {
    DAILY_EXERCISE_GOAL,
    DAILY_PRACTICE_WINDOW,
    MAX_EXERCISE_CLOCK_SKEW_MS,
    summarizeDailyPractice,
    toLocalDateKey
};

export type {
    DailyPracticeDay,
    DailyPracticeSummary
};
