import assert from "node:assert/strict";
import test from "node:test";

import type {
    Language,
    SearchResults
} from "../../src/types/global.js";

let language: Language =
    "fr";

Object.defineProperty(
    globalThis,
    "localStorage",
    {
        configurable: true,
        value: {
            getItem: () => language,
            setItem: () => undefined
        }
    }
);

Object.defineProperty(
    globalThis,
    "document",
    {
        configurable: true,
        value: {
            documentElement: {
                dir: "ltr",
                lang: "fr"
            },
            title: ""
        }
    }
);

const searchView =
    await import(
        "../../src/ui/views/searchView.js"
    );

test(
    "Search modal exposes accessible dialog and live-result semantics",
    () => {
        language =
            "fr";

        const html =
            searchView.renderSearchModalView();

        assert.match(
            html,
            /role="dialog"/
        );
        assert.match(
            html,
            /aria-modal="true"/
        );
        assert.match(
            html,
            /aria-live="polite"/
        );
        assert.match(
            html,
            /aria-label="Fermer la recherche"/
        );
    }
);

test(
    "Search modal localizes its controls in Persian",
    () => {
        language =
            "fa";

        const html =
            searchView.renderSearchModalView();

        assert.match(
            html,
            /بستن جستجو/
        );
        assert.match(
            html,
            /کلمه یا عبارت/
        );
    }
);

test(
    "Search results escape corpus HTML while preserving highlighting",
    () => {
        language =
            "fr";

        const results: SearchResults = {
            vocab: [],
            grammar: [],
            news: [
                {
                    id: "unsafe",
                    title: "Paris <img src=x>",
                    image: "demo.jpg",
                    level: "A1",
                    publishedDate: "2026-09-01"
                }
            ]
        };

        const html =
            searchView.renderSearchResultsView(
                results,
                "Paris"
            );

        assert.doesNotMatch(
            html,
            /<img src=x>/
        );
        assert.match(
            html,
            /Paris<\/mark>/
        );
        assert.match(
            html,
            /&lt;img src=x&gt;/
        );
    }
);
