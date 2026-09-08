import {
    useMemo
} from "react";
import {
    Link
} from "react-router";

import {
    summarizeDailyPractice
} from "../profile/dailyPracticeSummary.js";
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

/** Compact Home entry point into the learner's current daily session. */
function DailySessionCallout() {
    const {
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
                    today
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
    const complete =
        remaining === 0;

    return (
        <Link
            to="/daily"
            className="mb-8 block text-inherit no-underline"
            aria-label={t("home.dailySessionOpen")}
        >
            <Card
                interactive
                className="border-amber-200 bg-amber-50 p-4 sm:p-5"
            >
                <div className="flex items-start gap-3 sm:gap-4">
                    <span
                        className="text-3xl"
                        aria-hidden="true"
                    >
                        {complete
                            ? "🎉"
                            : "☀️"}
                    </span>
                    <span className="min-w-0 flex-1">
                        <span className="flex flex-wrap items-center justify-between gap-2">
                            <strong className="text-base text-amber-950 sm:text-lg">
                                {t("daily.title")}
                            </strong>
                            <Badge variant={complete ? "success" : "warning"}>
                                {t(
                                    "home.dailySessionProgress",
                                    {
                                        completed:
                                            Math.min(
                                                summary.todayAttempts,
                                                summary.goal
                                            ),
                                        total:
                                            summary.goal
                                    }
                                )}
                            </Badge>
                        </span>
                        <span className="mt-1 block text-sm leading-5 text-amber-900">
                            {complete
                                ? t(
                                    "daily.completeDescription"
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
                                        "daily.cardDescription"
                                    )}
                        </span>
                        <span className="mt-3 block">
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
                            />
                        </span>
                    </span>
                    <span
                        className="hidden self-center font-bold text-amber-900 sm:inline"
                        aria-hidden="true"
                    >
                        →
                    </span>
                </div>
            </Card>
        </Link>
    );
}

export {
    DailySessionCallout
};
