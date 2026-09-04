import assert from "node:assert/strict";
import test from "node:test";

import {
    checkCrosswordAnswers,
    createCrosswordGame,
    createHangmanGame,
    createWordSearchGame,
    getAvailableVocabularyGames,
    getHangmanMaskedLetters,
    guessHangmanLetter,
    normalizeGameAnswer,
    selectWordSearchLine
} from "../../src/features/vocabulary/vocabularyGameEngine.js";
import type { VocabWord } from "../../src/types/global.js";

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

function seededRandom(
    initialSeed = 17
): () => number {
    let seed = initialSeed;

    return () => {
        seed = (
            seed * 1_664_525
            + 1_013_904_223
        ) % 4_294_967_296;

        return seed / 4_294_967_296;
    };
}

test(
    "letter games normalize accents and punctuation",
    () => {
        assert.equal(
            normalizeGameAnswer(
                "l'été !"
            ),
            "LETE"
        );
    }
);

test(
    "Hangman tracks correct and incorrect guesses immutably",
    () => {
        const initial = createHangmanGame(
            [words[0]],
            () => 0
        );

        assert.ok(initial);

        const correct = guessHangmanLetter(
            initial,
            "â"
        );

        assert.notEqual(
            correct,
            initial
        );
        assert.equal(
            correct.remainingMistakes,
            7
        );
        assert.ok(
            getHangmanMaskedLetters(
                correct
            ).includes("A")
        );

        const incorrect = guessHangmanLetter(
            correct,
            "z"
        );

        assert.equal(
            incorrect.remainingMistakes,
            6
        );
    }
);

test(
    "Hangman detects a completed word",
    () => {
        let game = createHangmanGame(
            [
                {
                    fr: "été",
                    fa: "تابستان"
                }
            ],
            () => 0
        );

        assert.ok(game);

        game = guessHangmanLetter(
            game,
            "e"
        );
        game = guessHangmanLetter(
            game,
            "t"
        );

        assert.equal(
            game.status,
            "won"
        );
    }
);

test(
    "Word search resolves forward and reverse grid selections",
    () => {
        const initial = createWordSearchGame(
            words,
            seededRandom()
        );

        assert.ok(initial);
        assert.ok(
            initial.placements.length >= 3
        );

        const placement =
            initial.placements[0];

        const reversed = selectWordSearchLine(
            initial,
            placement.cells[
                placement.cells.length - 1
            ],
            placement.cells[0]
        );

        assert.equal(
            reversed.matchedWord?.answer,
            placement.word.answer
        );
        assert.ok(
            reversed.game.foundAnswers.includes(
                placement.word.answer
            )
        );

        const invalid = selectWordSearchLine(
            reversed.game,
            {
                row: 0,
                column: 0
            },
            {
                row: 1,
                column: 2
            }
        );

        assert.equal(
            invalid.matchedWord,
            null
        );
    }
);

test(
    "Crossword generator creates real intersections and validates answers",
    () => {
        const game = createCrosswordGame(
            words
        );

        assert.ok(game);
        assert.ok(
            game.entries.length >= 2
        );

        const occupied =
            new Map<string, number>();

        for (const entry of game.entries) {
            for (
                let index = 0;
                index < entry.word.answer.length;
                index += 1
            ) {
                const row =
                    entry.row
                    + (
                        entry.direction === "down"
                            ? index
                            : 0
                    );

                const column =
                    entry.column
                    + (
                        entry.direction === "across"
                            ? index
                            : 0
                    );

                const key = `${row}:${column}`;

                occupied.set(
                    key,
                    (
                        occupied.get(key)
                        ?? 0
                    ) + 1
                );
            }
        }

        assert.ok(
            [...occupied.values()].some(
                count => count > 1
            )
        );

        const answers =
            Object.fromEntries(
                game.cells.map(
                    cell => [
                        `${cell.row}:${cell.column}`,
                        cell.letter
                    ]
                )
            );

        assert.equal(
            checkCrosswordAnswers(
                game,
                answers
            ).completed,
            true
        );

        answers[`${game.cells[0].row}:${game.cells[0].column}`] = "Z";

        assert.equal(
            checkCrosswordAnswers(
                game,
                answers
            ).completed,
            false
        );
    }
);

test(
    "available game list only exposes playable game types",
    () => {
        assert.deepEqual(
            getAvailableVocabularyGames(
                words
            ),
            [
                "hangman",
                "word-search",
                "crossword"
            ]
        );

        assert.deepEqual(
            getAvailableVocabularyGames(
                [words[0]]
            ),
            [
                "hangman"
            ]
        );
    }
);
