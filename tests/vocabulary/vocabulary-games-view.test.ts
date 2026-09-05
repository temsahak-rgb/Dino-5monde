import assert from "node:assert/strict";
import test from "node:test";

import {
    createElement,
    type ReactElement
} from "react";

import {
    createCrosswordGame,
    createHangmanGame,
    createWordSearchGame
} from "../../src/features/vocabulary/vocabularyGameEngine.js";

import type {
    VocabPack,
    VocabWord
} from "../../src/types/global.js";

import {
    installReactTestBrowser,
    renderReactView
} from "../react/renderReactView.js";

const words: VocabWord[] = [
    {
        fr: "château",
        fa: "قلعه"
    },
    {
        fr: "table",
        fa: "میز"
    },
    {
        fr: "bateau",
        fa: "قایق"
    },
    {
        fr: "école",
        fa: "مدرسه"
    },
    {
        fr: "lecture",
        fa: "مطالعه"
    },
    {
        fr: "route",
        fa: "جاده"
    },
    {
        fr: "lettre",
        fa: "نامه"
    },
    {
        fr: "terre",
        fa: "زمین"
    }
];

const pack: VocabPack = {
    id: "demo",
    level: "A1",
    title: "Pack de démonstration",
    words
};

function seededRandom():
    () => number {
    let seed =
        31;

    return () => {
        seed = (
            seed * 1_103_515_245
            + 12_345
        ) % 2_147_483_648;

        return seed
            / 2_147_483_648;
    };
}

installReactTestBrowser();

const [
    {
        I18nProvider
    },
    {
        VocabularyHangman
    },
    {
        VocabularyWordSearch
    },
    {
        VocabularyCrossword
    }
] = await Promise.all([
    import(
        "../../src/i18n/I18nProvider.js"
    ),
    import(
        "../../src/features/vocabulary/VocabularyHangman.js"
    ),
    import(
        "../../src/features/vocabulary/VocabularyWordSearch.js"
    ),
    import(
        "../../src/features/vocabulary/VocabularyCrossword.js"
    )
]);

function renderGame(
    element: ReactElement,
    random = seededRandom()
): string {
    const originalRandom =
        Math.random;

    Math.random =
        random;

    try {
        return renderReactView(
            element,
            I18nProvider,
            "/vocabulary/A1/demo"
        );
    } finally {
        Math.random =
            originalRandom;
    }
}

test(
    "React Hangman renders its complete keyboard and never leaks undefined",
    () => {
        assert.ok(
            createHangmanGame(
                words,
                () => 0
            )
        );

        const html =
            renderGame(
                createElement(
                    VocabularyHangman,
                    {
                        pack,
                        onBack: () =>
                            undefined
                    }
                )
            );

        assert.equal(
            html.match(
                /<button[^>]*class="[^"]*aspect-square[^"]*"/g
            )?.length,
            26
        );

        assert.match(
            html,
            /aria-live="polite"/
        );

        assert.doesNotMatch(
            html,
            />\s*undefined\s*</
        );
    }
);

test(
    "React word search renders a complete selectable grid",
    () => {
        const expectedGame =
            createWordSearchGame(
                words,
                seededRandom()
            );

        assert.ok(
            expectedGame
        );

        const html =
            renderGame(
                createElement(
                    VocabularyWordSearch,
                    {
                        pack,
                        onBack: () =>
                            undefined
                    }
                ),
                seededRandom()
            );

        assert.equal(
            html.match(
                /aria-pressed="false"/g
            )?.length,
            expectedGame.size
                * expectedGame.size
        );

        assert.match(
            html,
            /Mots à trouver/
        );

        assert.match(
            html,
            /aria-live="polite"/
        );
    }
);

test(
    "React crossword renders one input per playable cell and both clue lists",
    () => {
        const expectedGame =
            createCrosswordGame(
                words
            );

        assert.ok(
            expectedGame
        );

        const html =
            renderGame(
                createElement(
                    VocabularyCrossword,
                    {
                        pack,
                        onBack: () =>
                            undefined
                    }
                )
            );

        assert.equal(
            html.match(
                /<input[^>]*type="text"/g
            )?.length,
            expectedGame.cells.length
        );

        assert.match(
            html,
            />\s*Horizontal\s*</
        );

        assert.match(
            html,
            />\s*Vertical\s*</
        );

        assert.match(
            html,
            /Vérifier la grille/
        );
    }
);
