import {
    useEffect,
    useState
} from "react";

import {
    Link
} from "react-router";

import {
    clearMistakesForLesson,
    getAllMistakes,
    REVIEW_SIGNAL_IMPORTED_EVENT
} from "../core/reviewSignalEngine.js";
import {
    LEARNER_ACCOUNT_CHANGE_EVENT
} from "../core/learnerStorage.js";

import {
    buildMistakeReviewItems,
    buildWeakWordReviewItems
} from "../core/reviewEngine.js";

import type {
    MistakeReviewItem,
    ReviewCatalogItem,
    WeakWordReviewItem
} from "../core/reviewEngine.js";

import {
    getGrammarLevels
} from "../features/grammar/grammarLevels.js";

import {
    loadGrammar
} from "../features/grammar/grammarEngine.js";

import {
    loadTravelIndex
} from "../features/travel/travelEngine.js";

import {
    loadVocabularyIndex
} from "../features/vocabulary/vocabularyRepository.js";
import {
    getAllWeakWords
} from "../core/reviewSignalEngine.js";

import {
    practiceLevels
} from "../core/practiceRoutes.js";

import {
    useI18n
} from "../i18n/I18nProvider.js";
import {
    useReviewSignalsSync
} from "../services/backend/ReviewSignalsSyncProvider.js";

import {
    Badge,
    Button,
    Card
} from "../ui/components/Controls.js";

import {
    EmptyState,
    LoadingState
} from "../ui/components/Feedback.js";

import {
    Page,
    PageHeader,
    Section,
    SectionHeader
} from "../ui/components/Layout.js";

/** Turns synchronized mistakes and weak words into concrete next actions. */
function PracticeReviewPage() {
    const {
        language,
        localizedTextClass,
        localizedValue,
        t
    } = useI18n();
    const {
        status: reviewSyncStatus
    } = useReviewSignalsSync();

    const [mistakes, setMistakes] =
        useState<MistakeReviewItem[]>([]);
    const [weakWords, setWeakWords] =
        useState<WeakWordReviewItem[]>([]);
    const [loading, setLoading] =
        useState(true);

    useEffect(
        () => {
            let active = true;
            let catalogs: Awaited<
                ReturnType<typeof loadReviewCatalog>
            > | null = null;

            const refreshReviewItems = (): void => {
                if (!active || !catalogs) {
                    return;
                }

                setMistakes(
                    buildMistakeReviewItems(
                        getAllMistakes(),
                        catalogs.lessons
                    )
                );
                setWeakWords(
                    buildWeakWordReviewItems(
                        getAllWeakWords(),
                        catalogs.vocabulary
                    )
                );
                setLoading(false);
            };

            const handleReviewChange = (): void => {
                refreshReviewItems();
            };

            window.addEventListener(
                REVIEW_SIGNAL_IMPORTED_EVENT,
                handleReviewChange
            );
            window.addEventListener(
                LEARNER_ACCOUNT_CHANGE_EVENT,
                handleReviewChange
            );

            void loadReviewCatalog()
                .then(loadedCatalogs => {
                    catalogs = loadedCatalogs;
                    refreshReviewItems();
                });

            return () => {
                active = false;
                window.removeEventListener(
                    REVIEW_SIGNAL_IMPORTED_EVENT,
                    handleReviewChange
                );
                window.removeEventListener(
                    LEARNER_ACCOUNT_CHANGE_EVENT,
                    handleReviewChange
                );
            };
        },
        []
    );

    const mistakeCount = mistakes.reduce(
        (total, item) => total + item.count,
        0
    );
    const weakWordCount = weakWords.reduce(
        (total, item) => total + item.words.length,
        0
    );

    return (
        <Page>
            <PageHeader
                icon="🔁"
                eyebrow={t("review.eyebrow")}
                title={t("review.title")}
                description={t("review.introduction")}
                actions={
                    !loading ? (
                        <div className="flex gap-2">
                            <Badge variant={mistakeCount ? "warning" : "success"}>
                                {t("review.mistakeCount", { count: mistakeCount })}
                            </Badge>
                            <Badge variant={weakWordCount ? "info" : "success"}>
                                {t("review.wordCount", { count: weakWordCount })}
                            </Badge>
                        </div>
                    ) : null
                }
            />

            <Card
                className={`mb-7 p-4 text-sm leading-6 ${reviewSyncStatus === "ready" ? "border-emerald-200 bg-emerald-50 text-emerald-950" : reviewSyncStatus === "syncing" ? "border-amber-200 bg-amber-50 text-amber-950" : reviewSyncStatus === "error" ? "border-rose-200 bg-rose-50 text-rose-950" : "border-sky-200 bg-info-soft text-sky-950"}`}
                role="status"
                aria-live="polite"
            >
                {t(
                    reviewSyncStatus === "ready"
                        ? "review.syncReady"
                        : reviewSyncStatus === "syncing"
                            ? "review.syncing"
                            : reviewSyncStatus === "error"
                                ? "review.syncError"
                                : "review.localNotice"
                )}
            </Card>

            {loading ? (
                <LoadingState label={t("common.loading")} />
            ) : mistakes.length === 0 && weakWords.length === 0 ? (
                <EmptyState
                    icon="🎉"
                    title={t("review.emptyTitle")}
                    description={t("review.emptyDescription")}
                    action={
                        <Link
                            to="/practice"
                            className="font-bold text-dino-700 hover:underline"
                        >
                            {t("review.openPractice")}
                        </Link>
                    }
                />
            ) : (
                <>
                    <Section>
                        <SectionHeader
                            title={t("review.mistakesTitle")}
                            description={t("review.mistakesDescription")}
                        />

                        {mistakes.length > 0 ? (
                            <div className="grid gap-3">
                                {mistakes.map(item => (
                                    <Card
                                        key={item.id}
                                        className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center"
                                    >
                                        <span className="text-2xl" aria-hidden="true">
                                            {item.icon}
                                        </span>
                                        <div className="min-w-0 flex-1">
                                            <h2 className={`font-bold text-ink ${localizedTextClass()}`}>
                                                {localizedValue(item.title, item.titleFa, item.id)}
                                            </h2>
                                            <p className="mt-1 text-sm text-muted">
                                                {t("review.lessonMistakes", { count: item.count })}
                                                {" · "}
                                                {new Intl.DateTimeFormat(
                                                    language === "fa" ? "fa-IR" : "fr-FR",
                                                    { dateStyle: "medium" }
                                                ).format(new Date(item.lastMistakeAt))}
                                            </p>
                                        </div>
                                        <div className="flex flex-wrap gap-2">
                                            <Link
                                                to={item.href}
                                                className="inline-flex min-h-11 items-center rounded-control border border-dino-600 px-3 py-2 text-sm font-bold text-dino-700 no-underline hover:bg-dino-50"
                                            >
                                                {t("review.retryLesson")}
                                            </Link>
                                            <Button
                                                variant="ghost"
                                                onClick={() => {
                                                    clearMistakesForLesson(item.id);
                                                    setMistakes(current =>
                                                        current.filter(candidate => candidate.id !== item.id)
                                                    );
                                                }}
                                            >
                                                {t("review.markReviewed")}
                                            </Button>
                                        </div>
                                    </Card>
                                ))}
                            </div>
                        ) : (
                            <p className="text-sm text-muted">{t("review.noMistakes")}</p>
                        )}
                    </Section>

                    <Section>
                        <SectionHeader
                            title={t("review.weakWordsTitle")}
                            description={t("review.weakWordsDescription")}
                        />

                        {weakWords.length > 0 ? (
                            <div className="grid gap-3 sm:grid-cols-2">
                                {weakWords.map(item => (
                                    <Link
                                        key={item.id}
                                        to={item.href}
                                        className="text-inherit no-underline"
                                    >
                                        <Card interactive className="h-full p-4">
                                            <div className="flex items-start gap-3">
                                                <span className="text-2xl" aria-hidden="true">{item.icon}</span>
                                                <div>
                                                    <h2 className={`font-bold text-ink ${localizedTextClass()}`}>
                                                        {localizedValue(item.title, item.titleFa, item.id)}
                                                    </h2>
                                                    <p className="mt-2 text-sm font-semibold text-dino-700">
                                                        {t("review.reviewWords", { count: item.words.length })}
                                                    </p>
                                                </div>
                                            </div>
                                        </Card>
                                    </Link>
                                ))}
                            </div>
                        ) : (
                            <p className="text-sm text-muted">{t("review.noWeakWords")}</p>
                        )}
                    </Section>
                </>
            )}
        </Page>
    );
}

async function loadReviewCatalog(): Promise<{
    lessons: ReviewCatalogItem[];
    vocabulary: ReviewCatalogItem[];
}> {
    const [grammarCatalogs, travel, vocabularyCatalogs] =
        await Promise.all([
            Promise.all(getGrammarLevels().map(level => loadGrammar(level))),
            loadTravelIndex(),
            Promise.all(practiceLevels.map(level => loadVocabularyIndex(level)))
        ]);

    return {
        lessons: [
            ...grammarCatalogs.flat().map(lesson => ({
                href: `/grammar/lesson/${encodeURIComponent(lesson.id)}`,
                icon: lesson.icon || "📐",
                id: lesson.id,
                title: lesson.title,
                titleFa: lesson.title_fa
            })),
            ...travel.map(lesson => ({
                href: `/travel/${encodeURIComponent(lesson.id)}`,
                icon: lesson.icon || "✈️",
                id: lesson.id,
                title: lesson.title,
                titleFa: lesson.title_fa
            }))
        ],
        vocabulary: vocabularyCatalogs.flatMap((packs, index) => {
            const level = practiceLevels[index];

            return level
                ? packs.map(pack => ({
                    href: `/vocabulary/${level}/${encodeURIComponent(pack.id)}/review`,
                    icon: pack.icon || "📖",
                    id: pack.id,
                    title: pack.title,
                    titleFa: pack.title_fa
                }))
                : [];
        })
    };
}

export {
    loadReviewCatalog,
    PracticeReviewPage
};
