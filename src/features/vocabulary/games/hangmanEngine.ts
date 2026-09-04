import type { VocabWord } from "../../../types/global.js";
import {
    normalizeGameAnswer,
    prepareVocabularyGameWords,
    randomIndex
} from "./gameWordsEngine.js";
import type {
    RandomSource,
    VocabularyGameWord
} from "./gameWordsEngine.js";

export {
    createHangmanGame,
    getHangmanMaskedLetters,
    guessHangmanLetter
};

export type {
    HangmanGame,
    HangmanStatus
};

type HangmanStatus =
    | "playing"
    | "won"
    | "lost";

interface HangmanGame {
    word: VocabularyGameWord;
    guessedLetters: readonly string[];
    remainingMistakes: number;
    status: HangmanStatus;
}

const hangmanMistakes = 7;

/** Starts one Hangman round from a vocabulary pack. */
function createHangmanGame(
    words: readonly VocabWord[],
    random: RandomSource = Math.random
): HangmanGame | null {
    const prepared =
        prepareVocabularyGameWords(
            words,
            2,
            18
        );

    if (prepared.length === 0) {
        return null;
    }

    return {
        word: prepared[
            randomIndex(
                prepared.length,
                random
            )
        ],
        guessedLetters: [],
        remainingMistakes: hangmanMistakes,
        status: "playing"
    };
}

/** Applies one Hangman guess without mutating the previous round. */
function guessHangmanLetter(
    game: HangmanGame,
    value: string
): HangmanGame {
    if (game.status !== "playing") {
        return game;
    }

    const letter =
        normalizeGameAnswer(
            value
        ).slice(0, 1);

    if (
        !letter
        || game.guessedLetters.includes(
            letter
        )
    ) {
        return game;
    }

    const guessedLetters = [
        ...game.guessedLetters,
        letter
    ];

    const correct =
        game.word.answer.includes(
            letter
        );

    const remainingMistakes =
        correct
            ? game.remainingMistakes
            : game.remainingMistakes - 1;

    const solved = [
        ...game.word.answer
    ].every(
        answerLetter =>
            guessedLetters.includes(
                answerLetter
            )
    );

    return {
        ...game,
        guessedLetters,
        remainingMistakes,
        status: solved
            ? "won"
            : remainingMistakes === 0
                ? "lost"
                : "playing"
    };
}

/** Returns the currently revealed Hangman letters. */
function getHangmanMaskedLetters(
    game: HangmanGame
): string[] {
    return [
        ...game.word.answer
    ].map(
        letter =>
            game.status === "lost"
            || game.guessedLetters.includes(
                letter
            )
                ? letter
                : "_"
    );
}
