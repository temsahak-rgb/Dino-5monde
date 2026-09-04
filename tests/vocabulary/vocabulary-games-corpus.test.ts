import assert from "node:assert/strict";
import { join } from "node:path";
import test from "node:test";

import {
    createCrosswordGame,
    createHangmanGame,
    createWordSearchGame,
    getAvailableVocabularyGames
} from "../../src/features/vocabulary/vocabularyGameEngine.js";
import type { VocabPack } from "../../src/types/global.js";
import {
    collectFiles,
    dataDirectory,
    readJson,
    repositoryPath
} from "../data/data-test-utils.js";

function seededRandom(
    value: string
): () => number {
    let seed = [...value].reduce(
        (
            current,
            character
        ) =>
            (
                current * 31
                + character.charCodeAt(0)
            ) >>> 0,
        1
    );

    return () => {
        seed = (
            seed * 1_664_525
            + 1_013_904_223
        ) >>> 0;

        return seed / 4_294_967_296;
    };
}

test(
    "every real vocabulary pack only exposes games it can generate",
    async () => {
        const packPaths = (
            await collectFiles(
                join(
                    dataDirectory,
                    "vocabulary"
                )
            )
        ).filter(
            path =>
                /[\\/](A1|A2|B1|B2|C1|C2)[\\/][^\\/]+\.json$/.test(
                    path
                )
        );

        assert.ok(
            packPaths.length > 0
        );

        for (const packPath of packPaths) {
            const pack =
                await readJson<VocabPack>(
                    packPath
                );

            const available =
                getAvailableVocabularyGames(
                    pack.words
                );

            if (
                available.includes(
                    "hangman"
                )
            ) {
                assert.ok(
                    createHangmanGame(
                        pack.words,
                        () => 0
                    ),
                    `${repositoryPath(packPath)} must generate Hangman`
                );
            }

            if (
                available.includes(
                    "word-search"
                )
            ) {
                assert.ok(
                    createWordSearchGame(
                        pack.words,
                        seededRandom(
                            packPath
                        )
                    ),
                    `${repositoryPath(packPath)} must generate a word-search grid`
                );
            }

            if (
                available.includes(
                    "crossword"
                )
            ) {
                assert.ok(
                    createCrosswordGame(
                        pack.words
                    ),
                    `${repositoryPath(packPath)} must generate a crossword`
                );
            }
        }
    }
);
