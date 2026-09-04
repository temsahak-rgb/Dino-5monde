import {
    getStaticDataUrl
} from "../../core/staticData.js";

import type {
    SearchIndex
} from "../../types/global.js";

export {
    loadSearchIndex,
    resetSearchIndexCache
};

type SearchFetch =
    (
        input: string
    ) => Promise<Response>;

let searchIndexPromise:
    Promise<SearchIndex>
    | null =
    null;

/* -------------------------------------------------------------------------- */
/* Validation                                                                 */
/* -------------------------------------------------------------------------- */

function isSearchIndex(
    value: unknown
): value is SearchIndex {
    if (
        typeof value
            !== "object"
        || value === null
    ) {
        return false;
    }

    const candidate =
        value as Partial<SearchIndex>;

    return (
        candidate.version
            === 1
        && Array.isArray(
            candidate.vocab
        )
        && Array.isArray(
            candidate.grammar
        )
        && Array.isArray(
            candidate.news
        )
    );
}

/* -------------------------------------------------------------------------- */
/* Loading                                                                    */
/* -------------------------------------------------------------------------- */

/**
 * Fetches the generated application-wide search index.
 *
 * `search-index.json` is emitted at the application root during the Vite
 * build. Resolving it through staticData prevents nested React routes such as:
 *
 * /journal/:articleId
 * /grammar/lesson/:lessonId
 *
 * from incorrectly requesting:
 *
 * /journal/search-index.json
 * /grammar/lesson/search-index.json
 */
async function fetchSearchIndex(
    fetcher:
        SearchFetch
): Promise<SearchIndex> {
    const response =
        await fetcher(
            getStaticDataUrl(
                "search-index.json"
            )
        );

    if (!response.ok) {
        throw new Error(
            `Search index request failed with status ${response.status}.`
        );
    }

    const index:
        unknown =
        await response.json();

    if (
        !isSearchIndex(
            index
        )
    ) {
        throw new Error(
            "Search index payload is invalid."
        );
    }

    return index;
}

/**
 * Loads the generated search index once per application session.
 *
 * Concurrent callers share the same pending Promise.
 *
 * Failed requests are removed from the cache so a later search can retry
 * without requiring a page reload.
 */
function loadSearchIndex(
    fetcher:
        SearchFetch =
        fetch
): Promise<SearchIndex> {
    if (!searchIndexPromise) {
        searchIndexPromise =
            fetchSearchIndex(
                fetcher
            ).catch(
                error => {
                    searchIndexPromise =
                        null;

                    throw error;
                }
            );
    }

    return searchIndexPromise;
}

/* -------------------------------------------------------------------------- */
/* Cache                                                                      */
/* -------------------------------------------------------------------------- */

/**
 * Clears the in-memory index cache.
 *
 * Primarily useful for deterministic tests.
 */
function resetSearchIndexCache():
    void {
    searchIndexPromise =
        null;
}