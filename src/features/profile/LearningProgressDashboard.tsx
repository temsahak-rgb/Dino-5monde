import {
    useEffect,
    useMemo,
    useState
} from "react";
import {
    Link
} from "react-router";

import type {
    LessonProgressSnapshot
} from "../../core/progressEngine.js";
import {
    getGrammarLevels
} from "../grammar/grammarLevels.js";
import {
    loadGrammar
} from "../grammar/grammarEngine.js";
import {
    loadTravelIndex
} from "../travel/travelEngine.js";
import {
    createLearningProgressOverview
} from "./learningProgressOverview.js";
import type {
    LearningProgressMetric
} from "./learningProgressOverview.js";
import {
    useI18n
} from "../../i18n/I18nProvider.js";
import type {
    LearnerActivityReward
} from "../../services/backend/learningRewardRepository.js";
import {
    Button,
    Card,
    ProgressBar
} from "../../ui/components/Controls.js";

interface LearningProgressDashboardProps {
    progress: readonly LessonProgressSnapshot[];
    rewards: readonly LearnerActivityReward[];
}

interface LearningProgressCatalog {
    grammarLessonIds: string[];
    travelLessonIds: string[];
}

type CatalogStatus =
    | "loading"
    | "ready"
    | "error";

let catalogRequest:
    Promise<LearningProgressCatalog>
    | null = null;

const areaPresentation = {
    games: {
        href: "/practice",
        icon: "🎮",
        labelKey:
            "profile.learningProgressGames"
    },
    grammar: {
        href: "/grammar",
        icon: "📚",
        labelKey:
            "profile.learningProgressGrammar"
    },
    travel: {
        href: "/travel",
        icon: "✈️",
        labelKey:
            "profile.learningProgressTravel"
    }
} as const;

function LearningProgressDashboard({
    progress,
    rewards
}: LearningProgressDashboardProps) {
    const {
        t
    } = useI18n();
    const [
        catalog,
        setCatalog
    ] = useState<LearningProgressCatalog | null>(
        null
    );
    const [
        status,
        setStatus
    ] = useState<CatalogStatus>("loading");
    const [
        retryVersion,
        setRetryVersion
    ] = useState(0);

    useEffect(
        () => {
            let active = true;
            setStatus("loading");

            void loadLearningProgressCatalog()
                .then(
                    loadedCatalog => {
                        if (!active) {
                            return;
                        }

                        setCatalog(loadedCatalog);
                        setStatus("ready");
                    },
                    () => {
                        if (active) {
                            setStatus("error");
                        }
                    }
                );

            return () => {
                active = false;
            };
        },
        [
            retryVersion
        ]
    );

    const overview =
        useMemo(
            () =>
                catalog
                    ? createLearningProgressOverview({
                        grammarLessonIds:
                            catalog.grammarLessonIds,
                        progress,
                        rewards,
                        travelLessonIds:
                            catalog.travelLessonIds
                    })
                    : null,
            [
                catalog,
                progress,
                rewards
            ]
        );

    return (
        <Card
            className="mb-5 p-5 sm:p-6"
            aria-label={t(
                "profile.learningProgressTitle"
            )}
        >
            <div className="flex items-start gap-3">
                <span
                    className="text-2xl"
                    aria-hidden="true"
                >
                    📊
                </span>
                <div>
                    <h2 className="text-lg font-bold text-ink">
                        {t(
                            "profile.learningProgressTitle"
                        )}
                    </h2>
                    <p className="mt-1 text-sm leading-6 text-muted">
                        {t(
                            "profile.learningProgressDescription"
                        )}
                    </p>
                </div>
            </div>

            {status === "loading" ? (
                <p
                    className="mt-5 text-sm font-semibold text-muted"
                    role="status"
                >
                    {t("common.loading")}
                </p>
            ) : status === "error"
                || !overview
                ? (
                    <div
                        className="mt-5 flex flex-wrap items-center justify-between gap-3 rounded-control border border-warning bg-warning-soft p-3"
                        role="alert"
                    >
                        <span className="text-sm font-semibold text-amber-900">
                            {t(
                                "profile.learningProgressUnavailable"
                            )}
                        </span>
                        <Button
                            variant="secondary"
                            onClick={() => {
                                catalogRequest = null;
                                setRetryVersion(
                                    current =>
                                        current + 1
                                );
                            }}
                        >
                            {t("common.retry")}
                        </Button>
                    </div>
                )
                : (
                    <div className="mt-5 grid gap-3 md:grid-cols-3">
                        {[
                            overview.grammar,
                            overview.travel,
                            overview.games
                        ].map(metric => (
                            <ProgressArea
                                key={metric.area}
                                metric={metric}
                            />
                        ))}
                    </div>
                )}
        </Card>
    );
}

function ProgressArea({
    metric
}: {
    metric: LearningProgressMetric;
}) {
    const {
        t
    } = useI18n();
    const presentation =
        areaPresentation[metric.area];
    const label =
        t(presentation.labelKey);
    const complete =
        metric.total > 0
        && metric.completed
            === metric.total;
    const started =
        metric.completed > 0;

    return (
        <Link
            to={presentation.href}
            data-progress-area={metric.area}
            className="rounded-card border border-line bg-canvas p-4 text-inherit no-underline transition hover:border-dino-300 hover:bg-dino-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-dino-500"
        >
            <span className="flex items-center justify-between gap-3">
                <strong className="flex items-center gap-2 text-sm text-ink">
                    <span aria-hidden="true">
                        {presentation.icon}
                    </span>
                    {label}
                </strong>
                <span
                    className={`size-3 shrink-0 rounded-full ${
                        complete
                            ? "bg-emerald-500"
                            : started
                                ? "bg-amber-400"
                                : "bg-slate-300"
                    }`}
                    aria-hidden="true"
                />
            </span>
            <p className="my-3 text-sm font-semibold text-ink-soft">
                {t(
                    metric.area === "games"
                        ? "profile.learningProgressRewards"
                        : "profile.learningProgressLessons",
                    {
                        completed:
                            metric.completed,
                        total:
                            metric.total
                    }
                )}
            </p>
            <ProgressBar
                value={metric.completed}
                max={metric.total}
                label={label}
                showValue
            />
        </Link>
    );
}

function loadLearningProgressCatalog():
    Promise<LearningProgressCatalog> {
    if (catalogRequest) {
        return catalogRequest;
    }

    catalogRequest = Promise.all([
        Promise.all(
            getGrammarLevels().map(
                level =>
                    loadGrammar(level)
            )
        ),
        loadTravelIndex()
    ]).then(
        ([
            grammarCatalogs,
            travelLessons
        ]) => {
            const grammarLessonIds =
                grammarCatalogs
                    .flat()
                    .map(lesson => lesson.id);
            const travelLessonIds =
                travelLessons.map(
                    lesson => lesson.id
                );

            if (
                grammarLessonIds.length === 0
                || travelLessonIds.length === 0
            ) {
                throw new Error(
                    "Learning progress catalog is unavailable"
                );
            }

            return {
                grammarLessonIds,
                travelLessonIds
            };
        }
    ).catch(
        reason => {
            catalogRequest = null;
            throw reason;
        }
    );

    return catalogRequest;
}

export {
    LearningProgressDashboard
};

export type {
    LearningProgressDashboardProps
};
