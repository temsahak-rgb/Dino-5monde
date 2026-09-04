import type { VocabWord } from "../../types/global.js";
import {
    checkCrosswordAnswers,
    createCrosswordGame
} from "./games/crosswordEngine.js";
import type {
    CrosswordEvaluation,
    CrosswordGame
} from "./games/crosswordEngine.js";
import {
    normalizeGameAnswer,
    prepareVocabularyGameWords
} from "./games/gameWordsEngine.js";
import type {
    VocabularyGameKind,
    VocabularyGameWord
} from "./games/gameWordsEngine.js";
import {
    createHangmanGame,
    getHangmanMaskedLetters,
    guessHangmanLetter
} from "./games/hangmanEngine.js";
import type {
    HangmanGame
} from "./games/hangmanEngine.js";
import {
    createWordSearchGame,
    selectWordSearchLine
} from "./games/wordSearchEngine.js";
import type {
    GridCoordinate,
    WordSearchGame
} from "./games/wordSearchEngine.js";

export {
    checkCrosswordAnswers,
    createCrosswordGame,
    createHangmanGame,
    createWordSearchGame,
    getAvailableVocabularyGames,
    getHangmanMaskedLetters,
    guessHangmanLetter,
    normalizeGameAnswer,
    selectWordSearchLine
};

export type {
    CrosswordEvaluation,
    CrosswordGame,
    GridCoordinate,
    HangmanGame,
    VocabularyGameKind,
    VocabularyGameWord,
    WordSearchGame
};

/** Returns only the games a vocabulary pack can build completely. */
function getAvailableVocabularyGames(
    words: readonly VocabWord[]
): VocabularyGameKind[] {
    const hangmanWords =
        prepareVocabularyGameWords(
            words,
            2,
            18
        );

    const gridWords =
        prepareVocabularyGameWords(
            words
        );

    const games:
        VocabularyGameKind[] = [];

    if (hangmanWords.length >= 1) {
        games.push("hangman");
    }

    if (gridWords.length >= 3) {
        games.push("word-search");

        if (createCrosswordGame(words)) {
            games.push("crossword");
        }
    }

    return games;
}
