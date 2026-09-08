import assert from "node:assert/strict";
import test from "node:test";

import {
    getLearningGameActivityType
} from "../../src/features/practice/practiceGameRewards.js";

test(
    "each public mini-game maps to one stable backend reward type",
    () => {
        assert.deepEqual(
            {
                crossword:
                    getLearningGameActivityType(
                        "crossword"
                    ),
                hangman:
                    getLearningGameActivityType(
                        "hangman"
                    ),
                wordSearch:
                    getLearningGameActivityType(
                        "word-search"
                    )
            },
            {
                crossword:
                    "crossword_game",
                hangman:
                    "hangman_game",
                wordSearch:
                    "word_search_game"
            }
        );
    }
);
