import {
    useEffect,
    useState
} from "react";

import {
    NewsCatalog
} from "../features/news/NewsCatalog.js";

import {
    loadNewsIndex
} from "../features/news/newsRepository.js";

import {
    useI18n
} from "../i18n/I18nProvider.js";

import type {
    NewsIndexItem
} from "../types/global.js";

import {
    EmptyState,
    ErrorState,
    LoadingState
} from "../ui/components/Feedback.js";

import {
    Page,
    PageHeader
} from "../ui/components/Layout.js";

type JournalLoadState =
    "loading"
    | "ready"
    | "error";

/**
 * Editorial Journal index.
 *
 * Durable route:
 *
 * /journal
 *
 * This replaces the historical DOM-driven `showJournalPage()`.
 */
function JournalIndexPage() {
    const {
        t
    } = useI18n();

    const [
        articles,
        setArticles
    ] =
        useState<NewsIndexItem[]>(
            []
        );

    const [
        state,
        setState
    ] =
        useState<JournalLoadState>(
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
            let active =
                true;

            async function load():
                Promise<void> {
                setState(
                    "loading"
                );

                try {
                    const loadedArticles =
                        await loadNewsIndex();

                    if (!active) {
                        return;
                    }

                    setArticles(
                        loadedArticles
                    );

                    setState(
                        "ready"
                    );
                } catch (error) {
                    console.error(
                        "Journal loading error:",
                        error
                    );

                    if (!active) {
                        return;
                    }

                    setArticles(
                        []
                    );

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

    return (
        <Page>
            <PageHeader
                icon="📰"
                title={
                    t(
                        "news.journalTitle"
                    )
                }
                description={
                    t(
                        "news.journalSubtitle"
                    )
                }
            />

            {state === "error" ? (
                <ErrorState
                    title={
                        t(
                            "news.journalEmpty"
                        )
                    }
                    action={
                        <RetryButton
                            onRetry={() => {
                                setRetryCount(
                                    current =>
                                        current + 1
                                );
                            }}
                        />
                    }
                />
            ) : articles.length > 0 ? (
                <NewsCatalog
                    articles={
                        articles
                    }
                />
            ) : (
                <EmptyState
                    icon="📰"
                    title={
                        t(
                            "news.journalEmpty"
                        )
                    }
                    action={
                        <RetryButton
                            onRetry={() => {
                                setRetryCount(
                                    current =>
                                        current + 1
                                );
                            }}
                        />
                    }
                />
            )}
        </Page>
    );
}

/* -------------------------------------------------------------------------- */
/* Retry                                                                       */
/* -------------------------------------------------------------------------- */

interface RetryButtonProps {
    onRetry:
        () => void;
}

function RetryButton({
    onRetry
}: RetryButtonProps) {
    const {
        t
    } = useI18n();

    return (
        <button
            type="button"
            onClick={
                onRetry
            }
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
    );
}

export {
    JournalIndexPage
};