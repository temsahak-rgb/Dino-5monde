import {
    getFreshStaticDataUrl
} from "../../core/staticData.js";

import type {
    Level,
    NewsArticle,
    NewsGrammarItem,
    NewsIndexItem,
    NewsVocabularyItem
} from "../../types/global.js";

/**
 * News / Journal data repository.
 *
 * Responsibilities:
 *
 * - load the editorial index
 * - load individual articles
 * - keep a small in-memory cache
 * - apply the historical CEFR visibility rule
 *
 * UI, navigation and React state deliberately remain outside this module.
 */

const cefrRank:
    Record<Level, number> = {
        A1: 1,
        A2: 2,
        B1: 3,
        B2: 4,
        C1: 5,
        C2: 6
    };

let newsIndexCache:
    NewsIndexItem[]
    | null =
    null;

const newsArticleCache =
    new Map<
        string,
        NewsArticle
    >();

/* -------------------------------------------------------------------------- */
/* Index                                                                       */
/* -------------------------------------------------------------------------- */

/**
 * Loads the published News index.
 *
 * Historical location:
 *
 * data/news/news-index.json
 *
 * A timestamp is still added to the URL on actual network requests, preserving
 * the previous behavior where editorial changes were not allowed to remain
 * hidden behind the browser cache.
 */
async function loadNewsIndex(
    forceRefresh = false
): Promise<NewsIndexItem[]> {
    if (
        !forceRefresh
        && newsIndexCache
            !== null
    ) {
        return [
            ...newsIndexCache
        ];
    }

    const response =
        await fetch(
            getFreshStaticDataUrl(
                "data/news/news-index.json"
            ),
            {
                cache:
                    "no-store"
            }
        );

    if (!response.ok) {
        throw new Error(
            `News index failed with status ${response.status}`
        );
    }

    const data =
        (
            await response.json()
        ) as unknown;

    if (
        !Array.isArray(
            data
        )
    ) {
        throw new Error(
            "Invalid News index format"
        );
    }

    newsIndexCache =
        data as NewsIndexItem[];

    return [
        ...newsIndexCache
    ];
}

/**
 * Returns the most recent editorial entry.
 *
 * The corpus historically treats the first index item as the current article.
 */
async function loadCurrentNews():
    Promise<NewsIndexItem | null> {
    const news =
        await loadNewsIndex();

    return (
        news[0]
        ?? null
    );
}

/* -------------------------------------------------------------------------- */
/* Article                                                                     */
/* -------------------------------------------------------------------------- */

/**
 * Loads one complete article.
 *
 * Historical location:
 *
 * data/news/{articleId}.json
 *
 * A missing article returns null. Other network failures remain errors so the
 * route can distinguish "not found" from an unavailable data source.
 */
async function loadNewsArticle(
    articleId: string,
    forceRefresh = false
): Promise<NewsArticle | null> {
    const normalizedId =
        normalizeNewsId(
            articleId
        );

    if (!normalizedId) {
        return null;
    }

    if (
        !forceRefresh
        && newsArticleCache.has(
            normalizedId
        )
    ) {
        return (
            newsArticleCache.get(
                normalizedId
            )
            ?? null
        );
    }

    const response =
        await fetch(
            getFreshStaticDataUrl(
                `data/news/${encodeURIComponent(
                    normalizedId
                )}.json`
            ),
            {
                cache:
                    "no-store"
            }
        );

    if (
        response.status
        === 404
    ) {
        return null;
    }

    if (!response.ok) {
        throw new Error(
            `News article failed with status ${response.status}: ${normalizedId}`
        );
    }

    const article =
        (
            await response.json()
        ) as NewsArticle;

    if (
        article.id
        && article.id
            !== normalizedId
    ) {
        console.warn(
            "News article id mismatch:",
            normalizedId,
            article.id
        );
    }

    newsArticleCache.set(
        normalizedId,
        article
    );

    return article;
}

/* -------------------------------------------------------------------------- */
/* CEFR filtering                                                              */
/* -------------------------------------------------------------------------- */

/**
 * Returns whether learning content should be visible for a learner.
 *
 * This deliberately preserves the historical News rule:
 *
 * - current level: visible
 * - lower levels: visible
 * - one CEFR level above: visible
 * - anything higher: hidden
 *
 * Content without an explicit level is always visible.
 */
function isNewsContentVisible(
    contentLevel:
        Level
        | undefined,
    userLevel:
        Level
): boolean {
    if (!contentLevel) {
        return true;
    }

    return (
        cefrRank[
            contentLevel
        ]
        <= cefrRank[
            userLevel
        ] + 1
    );
}

interface VisibleNewsLearningContent {
    vocabulary:
        NewsVocabularyItem[];

    grammar:
        NewsGrammarItem[];

    hasHiddenGrammar:
        boolean;
}

/**
 * Applies learner-level filtering to the educational annotations attached to
 * one article.
 */
function getVisibleNewsLearningContent(
    article:
        NewsArticle,
    userLevel:
        Level
): VisibleNewsLearningContent {
    const vocabulary =
        (
            article.content
                .vocabulary
            ?? []
        ).filter(
            item =>
                isNewsContentVisible(
                    item.level,
                    userLevel
                )
        );

    const allGrammar =
        article.content
            .grammar
        ?? [];

    const grammar =
        allGrammar.filter(
            item =>
                isNewsContentVisible(
                    item.level,
                    userLevel
                )
        );

    return {
        vocabulary,
        grammar,

        hasHiddenGrammar:
            allGrammar.length > 0
            && grammar.length === 0
    };
}

/* -------------------------------------------------------------------------- */
/* Cache                                                                       */
/* -------------------------------------------------------------------------- */

function clearNewsCache():
    void {
    newsIndexCache =
        null;

    newsArticleCache.clear();
}

/* -------------------------------------------------------------------------- */
/* Utilities                                                                   */
/* -------------------------------------------------------------------------- */

function normalizeNewsId(
    value:
        string
        | null
        | undefined
): string | null {
    if (!value) {
        return null;
    }

    const normalized =
        value.trim();

    return (
        normalized
        || null
    );
}

export {
    cefrRank,
    clearNewsCache,
    getVisibleNewsLearningContent,
    isNewsContentVisible,
    loadCurrentNews,
    loadNewsArticle,
    loadNewsIndex,
    normalizeNewsId
};

export type {
    VisibleNewsLearningContent
};