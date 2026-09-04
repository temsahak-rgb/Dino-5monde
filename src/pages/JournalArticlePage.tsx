import {
    useEffect,
    useState
} from "react";

import {
    useParams
} from "react-router";

import {
    getPlacementResult
} from "../core/placementEngine.js";

import {
    NewsArticle
} from "../features/news/NewsArticle.js";

import {
    getVisibleNewsLearningContent,
    loadNewsArticle,
    normalizeNewsId
} from "../features/news/newsRepository.js";

import type {
    VisibleNewsLearningContent
} from "../features/news/newsRepository.js";

import {
    useI18n
} from "../i18n/I18nProvider.js";

import type {
    NewsArticle as NewsArticleData
} from "../types/global.js";

import {
    BackButton
} from "../ui/components/Controls.js";

import {
    ErrorState,
    LoadingState
} from "../ui/components/Feedback.js";

import {
    Page
} from "../ui/components/Layout.js";

type ArticleLoadState =
    "loading"
    | "ready"
    | "not-found"
    | "error";

/**
 * Journal article route:
 *
 * /journal/:articleId
 *
 * Responsibilities:
 *
 * - validate the route parameter
 * - load the article
 * - resolve the learner CEFR level
 * - filter vocabulary / grammar annotations
 * - delegate presentation to NewsArticle
 */
function JournalArticlePage() {
    const {
        articleId:
            articleIdParameter
    } = useParams();

    const {
        t
    } = useI18n();

    const articleId =
        normalizeNewsId(
            articleIdParameter
        );

    const [
        article,
        setArticle
    ] =
        useState<
            NewsArticleData
            | null
        >(
            null
        );

    const [
        learningContent,
        setLearningContent
    ] =
        useState<
            VisibleNewsLearningContent
            | null
        >(
            null
        );

    const [
        state,
        setState
    ] =
        useState<ArticleLoadState>(
            "loading"
        );

    const [
        retryCount,
        setRetryCount
    ] =
        useState(
            0
        );

    useEffect(
        () => {
            if (!articleId) {
                setArticle(
                    null
                );

                setLearningContent(
                    null
                );

                setState(
                    "not-found"
                );

                return;
            }

            let active =
                true;

            async function load():
                Promise<void> {
                setState(
                    "loading"
                );

                setArticle(
                    null
                );

                setLearningContent(
                    null
                );

                try {
                    const loadedArticle =
                        await loadNewsArticle(
                            articleId
                        );

                    if (!active) {
                        return;
                    }

                    if (!loadedArticle) {
                        setState(
                            "not-found"
                        );

                        return;
                    }

                    /*
                     * Historical News behavior defaults to A1 when the learner
                     * has no persisted placement result.
                     */
                    const userLevel =
                        getPlacementResult()
                        ?? "A1";

                    const visibleContent =
                        getVisibleNewsLearningContent(
                            loadedArticle,
                            userLevel
                        );

                    setArticle(
                        loadedArticle
                    );

                    setLearningContent(
                        visibleContent
                    );

                    setState(
                        "ready"
                    );
                } catch (error) {
                    console.error(
                        "News detail error:",
                        error
                    );

                    if (!active) {
                        return;
                    }

                    setState(
                        "error"
                    );
                }
            }

            void load();

            return () => {
                active =
                    false;
            };
        },
        [
            articleId,
            retryCount
        ]
    );

    if (
        state === "loading"
    ) {
        return (
            <Page>
                <LoadingState
                    label={
                        t(
                            "common.loading"
                        )
                    }
                />
            </Page>
        );
    }

    if (
        state === "not-found"
    ) {
        return (
            <Page>
                <BackButton
                    fallback="/journal"
                >
                    ←
                    {" "}
                    {t(
                        "common.back"
                    )}
                </BackButton>

                <ErrorState
                    title={
                        t(
                            "news.notFound"
                        )
                    }
                    description={
                        articleId
                        ?? ""
                    }
                />
            </Page>
        );
    }

    if (
        state === "error"
    ) {
        return (
            <Page>
                <BackButton
                    fallback="/journal"
                >
                    ←
                    {" "}
                    {t(
                        "common.back"
                    )}
                </BackButton>

                <ErrorState
                    title={
                        t(
                            "news.notFound"
                        )
                    }
                    action={
                        <button
                            type="button"
                            onClick={() => {
                                setRetryCount(
                                    current =>
                                        current + 1
                                );
                            }}
                            className="
                                text-sm
                                font-bold
                                text-dino-700
                                hover:underline
                                hover:underline-offset-4
                            "
                        >
                            {t(
                                "common.retry"
                            )}
                        </button>
                    }
                />
            </Page>
        );
    }

    if (
        !article
        || !learningContent
    ) {
        return null;
    }

    return (
        <Page>
            <NewsArticle
                article={
                    article
                }
                vocabulary={
                    learningContent
                        .vocabulary
                }
                grammar={
                    learningContent
                        .grammar
                }
                hasHiddenGrammar={
                    learningContent
                        .hasHiddenGrammar
                }
            />
        </Page>
    );
}

export {
    JournalArticlePage
};