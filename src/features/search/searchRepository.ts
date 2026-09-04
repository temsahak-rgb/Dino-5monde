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
    | null = null;

function isSearchIndex(
    value: unknown
): value is SearchIndex {
    if (
        typeof value !== "object"
        || value === null
    ) {
        return false;
    }

    const candidate =
        value as Partial<SearchIndex>;

    return candidate.version === 1
        && Array.isArray(
            candidate.vocab
        )
        && Array.isArray(
            candidate.grammar
        )
        && Array.isArray(
            candidate.news
        );
}

async function fetchSearchIndex(
    fetcher: SearchFetch
): Promise<SearchIndex> {
    const response =
        await fetcher(
            "./search-index.json"
        );

    if (!response.ok) {
        throw new Error(
            `Search index request failed with status ${response.status}.`
        );
    }

    const index: unknown =
        await response.json();

    if (!isSearchIndex(index)) {
        throw new Error(
            "Search index payload is invalid."
        );
    }

    return index;
}

/**
 * Loads the generated search index once per page, including while the first
 * request is still pending. Failed requests are evicted so a retry can heal a
 * transient network error.
 */
function loadSearchIndex(
    fetcher: SearchFetch = fetch
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

/**
 * Clears the in-memory cache. Exposed for deterministic tests only.
 */
function resetSearchIndexCache(): void {
    searchIndexPromise =
        null;
}
