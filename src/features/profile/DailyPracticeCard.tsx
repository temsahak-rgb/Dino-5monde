import {
    useMemo
} from "react";
import {
    Link
} from "react-router";

import {
    useI18n
} from "../../i18n/I18nProvider.js";
import {
    useExerciseTracking
} from "../../services/backend/ExerciseTrackingProvider.js";
import {
    Badge,
    Card,
    ProgressBar
} from "../../ui/components/Controls.js";
import {
    useCurrentLocalDay
} from "../../ui/hooks/useCurrentLocalDay.js";
import {
    summarizeDailyPractice
} from "./dailyPracticeSummary.js";

interface DailyPracticeCardProps {
    showAction?: boolean;
}

function DailyPracticeCard({
    showAction = true
}: DailyPracticeCardProps) {
    const {
        language,
        t
    } = useI18n();
    const {
        attempts
    } = useExerciseTracking();
    const today =
        useCurrentLocalDay();
    const summary =
        useMemo(
            () =>
                summarizeDailyPractice(
                    attempts,
                    new Date()
                ),
            [
                attempts,
                today
            ]
        );
    const remaining =
        Math.max(
            0,
            summary.goal
            - summary.todayAttempts
        );

    return (
        <Card
            className="p-5"
            aria-label={t(
                "profile.dailyPracticeTitle"
            )}
        >
            <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3">
                    <span
                        className="text-2xl"
                        aria-hidden="true"
                    >
                        🔥
                    </span>
                    <div>
                        <p className="text-xs font-bold uppercase tracking-[0.08em] text-muted">
                            {t(
                                "profile.dailyPracticeTitle"
                            )}
                        </p>
                        <p className="mt-2 text-sm text-muted">
                            {summary.todayAttempts
                                >= summary.goal
                                ? t(
                                    "profile.dailyGoalReached"
                                )
                                : summary.todayAttempts
                                    > 0
                                    ? t(
                                        "profile.dailyGoalRemaining",
                                        {
                                            count:
                                                remaining
                                        }
                                    )
                                    : t(
                                        "profile.dailyGoalStart"
                                    )}
                        </p>
                    </div>
                </div>
                <Badge
                    variant={
                        summary.currentStreak > 0
                            ? "warning"
                            : "default"
                    }
                >
                    {t(
                        "profile.dailyStreak",
                        {
                            count:
                                summary.currentStreak
                        }
                    )}
                </Badge>
            </div>

            <div className="mt-4">
                <ProgressBar
                    value={
                        Math.min(
                            summary.todayAttempts,
                            summary.goal
                        )
                    }
                    max={summary.goal}
                    label={t(
                        "profile.dailyGoalProgress"
                    )}
                    showValue
                />
            </div>

            <ol className="mt-5 grid grid-cols-7 gap-1.5">
                {summary.week.map(day => {
                    const date =
                        parseLocalDateKey(
                            day.dateKey
                        );
                    const shortLabel =
                        formatDay(
                            date,
                            language,
                            "narrow"
                        );
                    const fullLabel =
                        formatDay(
                            date,
                            language,
                            "long"
                        );

                    return (
                        <li
                            key={day.dateKey}
                            className="text-center"
                            aria-label={t(
                                "profile.dailyDayLabel",
                                {
                                    count:
                                        day.attemptCount,
                                    day:
                                        fullLabel
                                }
                            )}
                        >
                            <span className="block text-[10px] font-semibold uppercase text-muted">
                                {shortLabel}
                            </span>
                            <span
                                className={`mx-auto mt-1 flex size-7 items-center justify-center rounded-full text-[11px] font-bold ${day.goalReached ? "bg-emerald-500 text-white" : day.attemptCount > 0 ? "bg-amber-300 text-amber-950" : day.today ? "border-2 border-dino-400 bg-dino-50 text-dino-800" : "bg-slate-100 text-slate-500"}`}
                                aria-hidden="true"
                            >
                                {day.attemptCount}
                            </span>
                        </li>
                    );
                })}
            </ol>

            {showAction ? (
                <Link
                    to="/daily"
                    className="mt-5 inline-flex min-h-11 w-full items-center justify-center rounded-control border border-dino-600 px-4 py-2 text-sm font-bold text-dino-700 no-underline transition hover:bg-dino-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-dino-500 focus-visible:ring-offset-2"
                >
                    {t(
                        "profile.dailyPracticeAction"
                    )}
                </Link>
            ) : null}
        </Card>
    );
}

function parseLocalDateKey(
    value: string
): Date {
    const [
        year,
        month,
        day
    ] = value
        .split("-")
        .map(Number);

    return new Date(
        year ?? 1970,
        (month ?? 1) - 1,
        day ?? 1,
        12
    );
}

function formatDay(
    date: Date,
    language: "fa" | "fr",
    weekday: "long" | "narrow"
): string {
    return new Intl.DateTimeFormat(
        language === "fa"
            ? "fa-IR"
            : "fr-FR",
        { weekday }
    ).format(date);
}

export {
    DailyPracticeCard
};

export type {
    DailyPracticeCardProps
};
