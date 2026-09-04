import assert from "node:assert/strict";
import test from "node:test";

import {
    loadSearchIndex,
    resetSearchIndexCache
} from "../../src/features/search/searchRepository.js";
import type {
    SearchIndex
} from "../../src/types/global.js";

const emptyIndex: SearchIndex = {
    version: 1,
    vocab: [],
    grammar: [],
    news: []
};

test(
    "concurrent searches share one pending index request",
    async () => {
        resetSearchIndexCache();

        let requestCount = 0;
        const fetcher = async (
            input: string
        ): Promise<Response> => {
            requestCount += 1;
            assert.equal(
                input,
                "./search-index.json"
            );

            await new Promise(
                resolve => setTimeout(
                    resolve,
                    5
                )
            );

            return new Response(
                JSON.stringify(
                    emptyIndex
                ),
                {
                    status: 200
                }
            );
        };

        const [
            first,
            second
        ] = await Promise.all([
            loadSearchIndex(
                fetcher
            ),
            loadSearchIndex(
                fetcher
            )
        ]);

        assert.equal(
            requestCount,
            1
        );
        assert.strictEqual(
            first,
            second
        );
    }
);

test(
    "a failed index request can be retried",
    async () => {
        resetSearchIndexCache();

        let requestCount = 0;
        const fetcher = async (): Promise<Response> => {
            requestCount += 1;

            return requestCount === 1
                ? new Response(
                    "unavailable",
                    {
                        status: 503
                    }
                )
                : new Response(
                    JSON.stringify(
                        emptyIndex
                    ),
                    {
                        status: 200
                    }
                );
        };

        await assert.rejects(
            loadSearchIndex(
                fetcher
            ),
            /status 503/
        );
        await loadSearchIndex(
            fetcher
        );

        assert.equal(
            requestCount,
            2
        );
    }
);
