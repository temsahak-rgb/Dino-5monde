import {
    useEffect,
    useMemo,
    useState
} from "react";
import {
    Link
} from "react-router";

import {
    LEARNER_ACCOUNT_CHANGE_EVENT
} from "../core/learnerStorage.js";
import {
    getPlacementResult
} from "../core/placementEngine.js";
import {
    getAllMistakes,
    getAllWeakWords,
    REVIEW_SIGNAL_IMPORTED_EVENT
} from "../core/reviewSignalEngine.js";
import {
    DailyPracticeCard
} from "../features/profile/DailyPracticeCard.js";
import {
    summarizeDailyPractice,
    toLocalDateKey
} from "../features/profile/dailyPracticeSummary.js";
import {
    DailySessionTasks
} from "../features/practice/DailySessionTasks.js";
import {
    createDailySessionPlan
} from "../features/practice/dailySessionPlan.js";
import {
    loadReviewCatalog
} from "../features/practice/reviewCatalog.js";
import type {
    ReviewCatalogs
} from "../features/practice/reviewCatalog.js";
import {
    useI18n
} from "../i18n/I18nProvider.js";
import {
    useExerciseTracking
} from "../services/backend/ExerciseTrackingProvider.js";
import {
    Badge
} from "../ui/components/Controls.js";
import {
    EmptyState,
    ErrorState,
    LoadingState,
    ResultState
} from "../ui/components/Feedback.js";
import {
    Page,
    PageHeader
} from "../ui/components/Layout.js";
import {
    useCurrentLocalDay
} from "../ui/hooks/useCurrentLocalDay.js";

/** A deterministic, shareable three-step learning path for the current day. */
function DailySessionPage() {
    const {
        t
    } = useI18n();
    const {
        attempts
    } = useExerciseTracking();
    const today =
        useCurrentLocalDay();
    const [catalogs, setCatalogs] =
        useState<ReviewCatalogs | null>(
            null
        );
    const [loadError, setLoadError] =
        useState(false);
    const [loadRevision, setLoadRevision] =
        useState(0);
    const [signalRevision, setSignalRevision] =
        useState(0);

    useEffect(
        () => {
            let active = true;

            setLoadError(false);

            void loadReviewCatalog()
                .then(loadedCatalogs => {
                    if (active) {
                        setCatalogs(
                            loadedCatalogs
                        );
                    }
                })
                .catch(() => {
                    if (active) {
                        setLoadError(true);
                    }
                });

            return () => {
                active = false;
            };
        },
        [loadRevision]
    );

    useEffect(
        () => {
            const handleSignalsChanged =
                (): void => {
                    setSignalRevision(
                        current =>
                            current + 1
                    );
                };

            window.addEventListener(
                REVIEW_SIGNAL_IMPORTED_EVENT,
                handleSignalsChanged
            );
            window.addEventListener(
                LEARNER_ACCOUNT_CHANGE_EVENT,
                handleSignalsChanged
            );

            return () => {
                window.removeEventListener(
                    REVIEW_SIGNAL_IMPORTED_EVENT,
                    handleSignalsChanged
                );
                window.removeEventListener(
                    LEARNER_ACCOUNT_CHANGE_EVENT,
                    handleSignalsChanged
                );
            };
        },
        []
    );

    const learnerLevel =
        getPlacementResult()
        ?? "A1";
    const dailySummary =
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
    const remainingTasks =
        Math.max(
            0,
            dailySummary.goal
            - dailySummary.todayAttempts
        );
    const tasks =
        useMemo(
            () =>
                catalogs
                && remainingTasks > 0
                    ? createDailySessionPlan({
                        attempts,
                        catalog:
                            catalogs.exercises,
                        dayKey:
                            toLocalDateKey(
                                today
                            ),
                        learnerLevel,
                        mistakes:
                            getAllMistakes(),
                        limit:
                            remainingTasks,
                        weakWords:
                            getAllWeakWords()
                    })
                    : [],
            [
                attempts,
                catalogs,
                learnerLevel,
                remainingTasks,
                signalRevision,
                today
            ]
        );

    return (
        <Page>
            <PageHeader
                icon="☀️"
                eyebrow={t("daily.eyebrow")}
                title={t("daily.title")}
                description={t("daily.introduction")}
                actions={
                    <Badge variant="success">
                        {t(
                            "daily.level",
                            {
                                level:
                                    learnerLevel
                            }
                        )}
                    </Badge>
                }
            />

            <div className="mb-8 max-w-2xl">
                <DailyPracticeCard
                    showAction={false}
                />
            </div>

            {dailySummary.todayAttempts
                >= dailySummary.goal ? (
                <ResultState
                    icon="🎉"
                    title={t("daily.completeTitle")}
                    description={t("daily.completeDescription")}
                    actions={
                        <Link
                            to="/practice/review"
                            className="inline-flex min-h-11 items-center rounded-control border border-dino-600 px-4 py-2 text-sm font-bold text-dino-700 no-underline hover:bg-dino-50"
                        >
                            {t("daily.openReview")}
                        </Link>
                    }
                />
            ) : loadError ? (
                <ErrorState
                    title={t("daily.loadErrorTitle")}
                    description={t("daily.loadErrorDescription")}
                    retryLabel={t("common.retry")}
                    onRetry={() => {
                        setCatalogs(null);
                        setLoadRevision(
                            current =>
                                current + 1
                        );
                    }}
                />
            ) : !catalogs ? (
                <LoadingState
                    label={t("common.loading")}
                />
            ) : tasks.length > 0 ? (
                <DailySessionTasks
                    items={tasks}
                />
            ) : (
                <EmptyState
                    icon="🌱"
                    title={t("daily.emptyTitle")}
                    description={t("daily.emptyDescription")}
                />
            )}
        </Page>
    );
}

export {
    DailySessionPage
};
