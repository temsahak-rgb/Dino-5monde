import {
    Link
} from "react-router";

import {
    useI18n
} from "../../i18n/I18nProvider.js";
import {
    useExerciseTracking
} from "../../services/backend/ExerciseTrackingProvider.js";
import type {
    ExerciseAttempt
} from "../../types/global.js";
import {
    Card
} from "../../ui/components/Controls.js";
import {
    summarizeExerciseAttempts,
    toPercentage
} from "./exerciseAttemptSummary.js";

function ExerciseHistoryCard() {
    const {
        language,
        t
    } = useI18n();
    const {
        attempts,
        status
    } = useExerciseTracking();
    const summary =
        summarizeExerciseAttempts(
            attempts
        );

    return (
        <Card
            className="p-5"
            aria-label={t(
                "profile.exerciseHistoryTitle"
            )}
        >
            <div className="flex items-start justify-between gap-3">
                <div>
                    <p className="text-xs font-bold uppercase tracking-[0.08em] text-muted">
                        {t(
                            "profile.exerciseHistoryTitle"
                        )}
                    </p>
                    <p className="mt-2 text-sm text-muted">
                        {t(
                            "profile.exerciseHistoryDescription"
                        )}
                    </p>
                </div>
                <span
                    className={`mt-1 size-3 shrink-0 rounded-full ${
                        status === "ready"
                            ? "bg-emerald-500"
                            : status === "syncing"
                                ? "animate-pulse bg-amber-400"
                                : status === "error"
                                    ? "bg-rose-500"
                                    : "bg-slate-300"
                    }`}
                    aria-hidden="true"
                />
            </div>

            {summary.attemptCount === 0 ? (
                <p className="mt-4 text-sm text-muted">
                    {status === "syncing"
                        ? t("common.loading")
                        : t(
                            "profile.exerciseHistoryEmpty"
                        )}
                </p>
            ) : (
                <>
                    <div className="mt-4 grid grid-cols-3 gap-2 text-center">
                        <ExerciseStat
                            label={t(
                                "profile.exerciseAttempts"
                            )}
                            value={
                                summary.attemptCount
                            }
                        />
                        <ExerciseStat
                            label={t(
                                "profile.exerciseAverage"
                            )}
                            value={
                                `${summary.averagePercentage}%`
                            }
                        />
                        <ExerciseStat
                            label={t(
                                "profile.exerciseBest"
                            )}
                            value={
                                `${summary.bestPercentage}%`
                            }
                        />
                    </div>

                    <ul className="mt-4 grid gap-2">
                        {summary.recentAttempts.map(
                            attempt => (
                                <li
                                    key={
                                        attempt.attemptId
                                    }
                                    className="rounded-control border border-line bg-canvas p-3"
                                >
                                    <Link
                                        to={
                                            getAttemptPath(
                                                attempt
                                            )
                                        }
                                        className="text-sm font-bold text-dino-800 no-underline hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-dino-500"
                                    >
                                        {getAttemptTitle(
                                            attempt,
                                            t
                                        )}
                                    </Link>
                                    <span className="mt-1 flex flex-wrap items-center justify-between gap-2 text-xs text-muted">
                                        <span>
                                            {formatAttemptDate(
                                                attempt.completedAt,
                                                language
                                            )}
                                        </span>
                                        <strong className="ltr-lock text-dino-700">
                                            {t(
                                                "profile.exerciseScore",
                                                {
                                                    correct:
                                                        attempt.correctAnswers,
                                                    percentage:
                                                        toPercentage(
                                                            attempt.correctAnswers,
                                                            attempt.totalQuestions
                                                        ),
                                                    total:
                                                        attempt.totalQuestions
                                                }
                                            )}
                                        </strong>
                                    </span>
                                </li>
                            )
                        )}
                    </ul>
                </>
            )}

            {status === "error" ? (
                <p
                    className="mt-3 text-xs leading-5 text-rose-700"
                    role="status"
                >
                    {t(
                        "profile.exerciseSyncError"
                    )}
                </p>
            ) : null}
        </Card>
    );
}

function ExerciseStat({
    label,
    value
}: {
    label: string;
    value: number | string;
}) {
    return (
        <div className="rounded-control bg-dino-50 p-2">
            <strong className="block text-lg text-dino-800">
                {value}
            </strong>
            <span className="mt-1 block text-[11px] leading-4 text-muted">
                {label}
            </span>
        </div>
    );
}

type TranslationFunction =
    ReturnType<typeof useI18n>["t"];

function getAttemptTitle(
    attempt: ExerciseAttempt,
    t: TranslationFunction
): string {
    switch (attempt.contentType) {
        case "grammar":
            return t(
                "profile.exerciseGrammar",
                {
                    id:
                        attempt.activityId
                }
            );
        case "travel":
            return t(
                "profile.exerciseTravel",
                {
                    id:
                        attempt.activityId
                }
            );
        case "vocabulary":
            return t(
                "profile.exerciseVocabulary",
                {
                    level:
                        attempt.level
                        ?? ""
                }
            );
    }
}

function getAttemptPath(
    attempt: ExerciseAttempt
): string {
    switch (attempt.contentType) {
        case "grammar":
            return `/grammar/lesson/${encodeURIComponent(
                attempt.activityId
            )}`;
        case "travel":
            return `/travel/${encodeURIComponent(
                attempt.activityId
            )}`;
        case "vocabulary":
            return `/vocabulary/${
                attempt.level
                ?? "A1"
            }/${encodeURIComponent(
                attempt.activityId
            )}`;
    }
}

function formatAttemptDate(
    value: string,
    language: "fa" | "fr"
): string {
    const date =
        new Date(value);

    if (
        Number.isNaN(
            date.getTime()
        )
    ) {
        return "";
    }

    return new Intl.DateTimeFormat(
        language === "fa"
            ? "fa-IR"
            : "fr-FR",
        {
            dateStyle: "short"
        }
    ).format(date);
}

export {
    ExerciseHistoryCard
};
