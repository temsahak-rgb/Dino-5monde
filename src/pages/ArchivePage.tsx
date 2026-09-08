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
    getAllLessonProgress,
    LESSON_PROGRESS_CHANGE_EVENT,
    LESSON_PROGRESS_IMPORTED_EVENT
} from "../core/progressEngine.js";
import type {
    LessonProgressSnapshot
} from "../core/progressEngine.js";
import {
    buildCompletedLessonArchive
} from "../features/archive/archiveEngine.js";
import {
    ExerciseHistoryCard
} from "../features/profile/ExerciseHistoryCard.js";
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
    Badge,
    Card
} from "../ui/components/Controls.js";
import {
    EmptyState,
    ErrorState,
    LoadingState
} from "../ui/components/Feedback.js";
import {
    Page,
    PageHeader,
    Section,
    SectionHeader
} from "../ui/components/Layout.js";

/** Local-first history of completed lessons and scored exercises. */
function ArchivePage() {
    const {
        language,
        localizedTextClass,
        localizedValue,
        t
    } = useI18n();
    const [progress, setProgress] =
        useState<
            LessonProgressSnapshot[]
        >(
            () =>
                getAllLessonProgress()
        );
    const [catalogs, setCatalogs] =
        useState<ReviewCatalogs | null>(
            null
        );
    const [loadError, setLoadError] =
        useState(false);
    const [loadRevision, setLoadRevision] =
        useState(0);

    useEffect(
        () => {
            const refreshProgress =
                (): void => {
                    setProgress(
                        getAllLessonProgress()
                    );
                };
            const events = [
                LEARNER_ACCOUNT_CHANGE_EVENT,
                LESSON_PROGRESS_CHANGE_EVENT,
                LESSON_PROGRESS_IMPORTED_EVENT
            ] as const;

            for (const eventName of events) {
                window.addEventListener(
                    eventName,
                    refreshProgress
                );
            }

            return () => {
                for (
                    const eventName
                    of events
                ) {
                    window.removeEventListener(
                        eventName,
                        refreshProgress
                    );
                }
            };
        },
        []
    );

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

    const completedLessons =
        useMemo(
            () =>
                catalogs
                    ? buildCompletedLessonArchive(
                        progress,
                        catalogs.lessons
                    )
                    : [],
            [
                catalogs,
                progress
            ]
        );

    return (
        <Page>
            <PageHeader
                icon="🗂️"
                eyebrow={t("archive.eyebrow")}
                title={t("archive.title")}
                description={t("archive.introduction")}
            />

            <Section>
                <SectionHeader
                    title={t("archive.completedTitle")}
                    description={t("archive.completedDescription")}
                    actions={
                        catalogs ? (
                            <Badge variant="success">
                                {t(
                                    "archive.completedCount",
                                    {
                                        count:
                                            completedLessons.length
                                    }
                                )}
                            </Badge>
                        ) : null
                    }
                />

                {loadError ? (
                    <ErrorState
                        title={t("archive.loadErrorTitle")}
                        description={t("archive.loadErrorDescription")}
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
                ) : completedLessons.length
                    === 0 ? (
                    <EmptyState
                        icon="🌱"
                        title={t("archive.emptyTitle")}
                        description={t("archive.emptyDescription")}
                        action={
                            <Link
                                to="/daily"
                                className="font-bold text-dino-700 hover:underline"
                            >
                                {t("archive.startDaily")}
                            </Link>
                        }
                    />
                ) : (
                    <ul className="grid gap-3 sm:grid-cols-2">
                        {completedLessons.map(
                            lesson => (
                                <li
                                    key={[
                                        lesson.contentType,
                                        lesson.id
                                    ].join(":")}
                                    data-archive-lesson={
                                        lesson.id
                                    }
                                >
                                    <Link
                                        to={lesson.href}
                                        className="block h-full text-inherit no-underline"
                                    >
                                        <Card
                                            interactive
                                            className="flex h-full min-h-[120px] items-start gap-3 p-4"
                                        >
                                            <span
                                                className="text-2xl"
                                                aria-hidden="true"
                                            >
                                                {lesson.icon}
                                            </span>
                                            <span className="min-w-0 flex-1">
                                                <span className={"block font-bold text-ink " + localizedTextClass()}>
                                                    {localizedValue(
                                                        lesson.title,
                                                        lesson.titleFa,
                                                        lesson.id
                                                    )}
                                                </span>
                                                <span className="mt-2 flex flex-wrap items-center gap-2 text-xs text-muted">
                                                    <Badge variant="success">
                                                        {t(
                                                            lesson.contentType
                                                                === "grammar"
                                                                ? "archive.grammar"
                                                                : "archive.travel"
                                                        )}
                                                    </Badge>
                                                    {lesson.completedAt ? (
                                                        <span>
                                                            {t(
                                                                "archive.completedAt",
                                                                {
                                                                    date:
                                                                        formatArchiveDate(
                                                                            lesson.completedAt,
                                                                            language
                                                                        )
                                                                }
                                                            )}
                                                        </span>
                                                    ) : null}
                                                </span>
                                            </span>
                                        </Card>
                                    </Link>
                                </li>
                            )
                        )}
                    </ul>
                )}
            </Section>

            <Section>
                <SectionHeader
                    title={t("archive.exercisesTitle")}
                    description={t("archive.exercisesDescription")}
                />
                <ExerciseHistoryCard
                    recentLimit={20}
                />
            </Section>
        </Page>
    );
}

function formatArchiveDate(
    value: string,
    language: "fa" | "fr"
): string {
    return new Intl.DateTimeFormat(
        language === "fa"
            ? "fa-IR"
            : "fr-FR",
        {
            dateStyle: "medium"
        }
    ).format(
        new Date(value)
    );
}

export {
    ArchivePage
};
