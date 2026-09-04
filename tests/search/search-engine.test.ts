import assert from "node:assert/strict";
import test from "node:test";

import {
    isSearchQueryReady,
    normalizeSearchText,
    searchContent
} from "../../src/features/search/searchEngine.js";
import type {
    SearchIndex
} from "../../src/types/global.js";

const index: SearchIndex = {
    version: 1,
    vocab: [
        {
            fr: "bonjour",
            fa: "سلام",
            level: "A1",
            packId: "salutations",
            packTitle: "Premiers échanges"
        },
        {
            fr: "livre",
            fa: "کتاب",
            level: "A1",
            packId: "ecole",
            packTitle: "École et études"
        }
    ],
    grammar: [
        {
            id: "A1-G-001",
            level: "A1",
            module: "Premiers pas",
            icon: "📚",
            title: "Être et avoir",
            estimatedTime: 10,
            exercises: 5
        }
    ],
    news: [
        {
            id: "paris",
            title: "L'été à Paris",
            subtitle_fa: "تابستان در پاریس",
            image: "paris.jpg",
            level: "A2",
            publishedDate: "2026-09-01"
        }
    ]
};

test(
    "Search matches French text without requiring accents",
    () => {
        assert.equal(
            normalizeSearchText(
                "  École-d'été  "
            ),
            "ecole d ete"
        );

        const results =
            searchContent(
                index,
                "ecole"
            );

        assert.deepEqual(
            results.vocab.map(
                word => word.fr
            ),
            [
                "livre"
            ]
        );
    }
);

test(
    "Search aligns Arabic keyboard glyphs with Persian corpus text",
    () => {
        const results =
            searchContent(
                index,
                "كتاب"
            );

        assert.deepEqual(
            results.vocab.map(
                word => word.fa
            ),
            [
                "کتاب"
            ]
        );
    }
);

test(
    "Search indexes vocabulary packs, grammar modules and bilingual news",
    () => {
        assert.equal(
            searchContent(
                index,
                "echanges"
            ).vocab.length,
            1
        );
        assert.equal(
            searchContent(
                index,
                "premiers pas"
            ).grammar.length,
            1
        );
        assert.equal(
            searchContent(
                index,
                "تابستان"
            ).news.length,
            1
        );
        assert.equal(
            isSearchQueryReady(
                " é "
            ),
            false
        );
    }
);
