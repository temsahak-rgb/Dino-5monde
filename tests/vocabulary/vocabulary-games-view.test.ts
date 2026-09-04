import assert from "node:assert/strict";
import test from "node:test";

import {
    createCrosswordGame,
    createHangmanGame,
    createWordSearchGame,
    getHangmanMaskedLetters
} from "../../src/features/vocabulary/vocabularyGameEngine.js";
import type {
    VocabPack,
    VocabWord
} from "../../src/types/global.js";

const words: VocabWord[] = [
    { fr: "château", fa: "قلعه" },
    { fr: "table", fa: "میز" },
    { fr: "bateau", fa: "قایق" },
    { fr: "école", fa: "مدرسه" },
    { fr: "lecture", fa: "مطالعه" },
    { fr: "route", fa: "جاده" },
    { fr: "lettre", fa: "نامه" },
    { fr: "terre", fa: "زمین" }
];

const pack: VocabPack = {
    id: "demo",
    level: "A1",
    title: "Pack de démonstration",
    words
};

function seededRandom(): () => number {
    let seed = 31;

    return () => {
        seed = (
            seed * 1_103_515_245
            + 12_345
        ) % 2_147_483_648;

        return seed / 2_147_483_648;
    };
}

async function loadViews() {
    Object.defineProperty(
        globalThis,
        "localStorage",
        {
            configurable: true,
            value: {
                getItem: () => null,
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
                getElementById: (
                    id: string
                ) => id === "app"
                    ? {}
                    : null,
                title: ""
            }
        }
    );

    return import(
        "../../src/ui/views/vocabularyGamesView.js"
    );
}

test(
    "Hangman view renders its keyboard and never leaks undefined",
    async () => {
        const game = createHangmanGame(
            words,
            () => 0
        );

        assert.ok(game);

        const {
            renderHangmanGameView
        } = await loadViews();

        const html = renderHangmanGameView(
            pack,
            game,
            getHangmanMaskedLetters(
                game
            )
        );

        assert.equal(
            html.match(
                /class="vocab-game-key"/g
            )?.length,
            26
        );
        assert.doesNotMatch(
            html,
            />\s*undefined\s*</
        );
    }
);

test(
    "Word-search view renders a complete selectable grid",
    async () => {
        const game = createWordSearchGame(
            words,
            seededRandom()
        );

        assert.ok(game);

        const {
            renderWordSearchGameView
        } = await loadViews();

        const html = renderWordSearchGameView(
            pack,
            game,
            null,
            undefined
        );

        assert.equal(
            html.match(
                /data-row="\d+"/g
            )?.length,
            game.size * game.size
        );
        assert.match(
            html,
            /class="word-search-cell"/
        );
        assert.match(
            html,
            /class="word-search-grid-wrap"/
        );
    }
);

test(
    "Crossword view renders one input per playable cell and clue lists",
    async () => {
        const game = createCrosswordGame(
            words
        );

        assert.ok(game);

        const {
            renderCrosswordGameView
        } = await loadViews();

        const html = renderCrosswordGameView(
            pack,
            game,
            {}
        );

        assert.equal(
            html.match(
                /class="crossword-input ltr-lock"/g
            )?.length,
            game.cells.length
        );
        assert.match(
            html,
            /id="crossword-check"/
        );
        assert.match(
            html,
            /class="crossword-clue-list"/
        );
    }
);
