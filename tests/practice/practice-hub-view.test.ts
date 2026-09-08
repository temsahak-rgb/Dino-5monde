import assert from "node:assert/strict";
import test from "node:test";

import {
    createElement
} from "react";

import {
    installReactTestBrowser,
    renderReactView
} from "../react/renderReactView.js";

const browser =
    installReactTestBrowser();

const [
    { I18nProvider },
    { PracticeIndexPage },
    { PracticePackCatalog }
] = await Promise.all([
    import("../../src/i18n/I18nProvider.js"),
    import("../../src/pages/PracticeIndexPage.js"),
    import("../../src/features/practice/PracticePackCatalog.js")
]);

test(
    "the practice hub exposes every shipped game and exercise family",
    () => {
        browser.setLanguage("fr");

        const html = renderReactView(
            createElement(PracticeIndexPage),
            I18nProvider,
            "/practice"
        );

        for (
            const label of [
                "Pendu",
                "Grille de lettres",
                "Mots croisés",
                "Grammaire",
                "Vocabulaire",
                "Voyage"
            ]
        ) {
            assert.match(html, new RegExp(label));
        }

        assert.match(
            html,
            /href="\/practice\/hangman\/A1"/
        );
        assert.match(
            html,
            /href="\/practice\/word-search\/C2"/
        );
        assert.match(
            html,
            /href="\/practice\/crossword\/B2"/
        );
        assert.match(html, /href="\/grammar"/);
        assert.match(html, /href="\/vocabulary"/);
        assert.match(html, /href="\/travel"/);
        assert.doesNotMatch(html, />\s*undefined\s*</);
    }
);

test(
    "a practice theme links directly to a shareable game URL",
    () => {
        browser.setLanguage("fa");

        const html = renderReactView(
            createElement(
                PracticePackCatalog,
                {
                    game: "hangman",
                    level: "A1",
                    packs: [
                        {
                            id: "salutations_expressions_quotidiennes",
                            title: "Salutations",
                            title_fa: "سلام و احوال‌پرسی",
                            icon: "🗣️",
                            words: 15
                        }
                    ]
                }
            ),
            I18nProvider,
            "/practice/hangman/A1"
        );

        assert.match(html, /سلام و احوال‌پرسی/);
        assert.match(
            html,
            /href="\/practice\/hangman\/A1\/salutations_expressions_quotidiennes"/
        );
    }
);
