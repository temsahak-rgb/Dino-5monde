import assert from "node:assert/strict";
import test from "node:test";

import {
    createElement
} from "react";

import {
    getGrammarLevelFromLessonId,
    getGrammarLevels
} from "../../src/features/grammar/grammarLevels.js";

import {
    installReactTestBrowser,
    renderReactView
} from "../react/renderReactView.js";

installReactTestBrowser();

const [
    {
        GrammarIndexPage
    },
    {
        I18nProvider
    }
] = await Promise.all([
    import(
        "../../src/pages/GrammarIndexPage.js"
    ),
    import(
        "../../src/i18n/I18nProvider.js"
    )
]);

test(
    "Grammar exposes the available A1 through C1 levels",
    () => {
        assert.deepEqual(
            getGrammarLevels(),
            [
                "A1",
                "A2",
                "B1",
                "B2",
                "C1"
            ]
        );
    }
);

test(
    "Grammar lesson navigation derives the level from the lesson id",
    () => {
        assert.equal(
            getGrammarLevelFromLessonId(
                "A1-G-003"
            ),
            "A1"
        );

        assert.equal(
            getGrammarLevelFromLessonId(
                "C1-G-010"
            ),
            "C1"
        );

        assert.equal(
            getGrammarLevelFromLessonId(
                "C2-G-001"
            ),
            null
        );

        assert.equal(
            getGrammarLevelFromLessonId(
                "invalid"
            ),
            null
        );
    }
);

test(
    "React Grammar level selector renders five navigable cards and excludes C2",
    () => {
        const html =
            renderReactView(
                createElement(
                    GrammarIndexPage
                ),
                I18nProvider,
                "/grammar"
            );

        const destinations = [
            ...html.matchAll(
                /href="(\/grammar\/[A-Z]\d)"/g
            )
        ].map(
            match =>
                match[1]
        );

        assert.deepEqual(
            destinations,
            [
                "/grammar/A1",
                "/grammar/A2",
                "/grammar/B1",
                "/grammar/B2",
                "/grammar/C1"
            ]
        );

        assert.match(
            html,
            /Choisissez votre niveau de grammaire/
        );

        assert.doesNotMatch(
            html,
            /href="\/grammar\/C2"/
        );
    }
);
