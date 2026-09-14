import assert from "node:assert/strict";
import test from "node:test";

import {
    createElement
} from "react";

import {
    installReactTestBrowser,
    renderReactView
} from "../react/renderReactView.js";

import type {
    NewsArticle as NewsArticleData
} from "../../src/types/global.js";

installReactTestBrowser("fr");

const [
    { I18nProvider },
    { NewsArticle }
] = await Promise.all([
    import("../../src/i18n/I18nProvider.js"),
    import("../../src/features/news/NewsArticle.js")
]);

const article: NewsArticleData = {
    content: {
        fullText: "Un article complet pour tester ses connexions pédagogiques.",
        grammar: [{
            example: "La tour a été construite.",
            grammarId: "B1-G-PASSIVE-001",
            level: "B1",
            title: "La voix passive"
        }],
        simpleText: "Un article simple.",
        vocabulary: [{
            fa: "میراث",
            fr: "patrimoine",
            level: "B1",
            packId: "vocabulary-b1-patrimoine"
        }]
    },
    id: "2026-w34-azadi-tower",
    image: "https://images.example.test/azadi.jpg",
    level: "B1",
    publishedDate: "2026-08-22",
    sources: [],
    title: "La tour Azadi"
};

test(
    "React News annotations expose durable Grammar and Vocabulary destinations",
    () => {
        const html = renderReactView(
            createElement(NewsArticle, {
                article,
                grammar: article.content.grammar ?? [],
                hasHiddenGrammar: false,
                preview: true,
                vocabulary: article.content.vocabulary ?? []
            }),
            I18nProvider,
            "/journal/2026-w34-azadi-tower"
        );

        assert.match(
            html,
            /href="\/vocabulary\/B1\/vocabulary-b1-patrimoine"/u
        );
        assert.match(html, /Voir le pack de vocabulaire/u);
        assert.match(
            html,
            /href="\/grammar\/lesson\/B1-G-PASSIVE-001"/u
        );
        assert.match(html, /Voir la leçon de grammaire/u);
    }
);

test(
    "React News preview tolerates an unfinished relation identifier",
    () => {
        const unfinished = {
            ...article,
            content: {
                ...article.content,
                vocabulary: [{
                    fa: "میراث",
                    fr: "patrimoine",
                    level: "B1" as const,
                    packId: "../pack"
                }]
            }
        };
        const html = renderReactView(
            createElement(NewsArticle, {
                article: unfinished,
                grammar: [],
                hasHiddenGrammar: false,
                preview: true,
                vocabulary: unfinished.content.vocabulary
            }),
            I18nProvider
        );

        assert.match(html, /patrimoine/u);
        assert.doesNotMatch(html, /href="\/vocabulary/u);
    }
);
