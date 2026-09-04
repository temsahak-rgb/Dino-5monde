import type { VocabWord } from "../../../types/global.js";

export {
    normalizeGameAnswer,
    prepareVocabularyGameWords,
    randomIndex,
    shuffle
};

export type {
    RandomSource,
    VocabularyGameKind,
    VocabularyGameWord
};

type RandomSource = () => number;

type VocabularyGameKind =
    | "hangman"
    | "word-search"
    | "crossword";

interface VocabularyGameWord {
    answer: string;
    label: string;
    clue: string;
}

/** Converts a French label into the A-Z form used by letter games. */
function normalizeGameAnswer(
    value: string
): string {
    return value
        .normalize("NFD")
        .replace(
            /[\u0300-\u036f]/g,
            ""
        )
        .replace(
            /[^a-zA-Z]/g,
            ""
        )
        .toUpperCase();
}

/** Builds unique game-ready words from one vocabulary pack. */
function prepareVocabularyGameWords(
    words: readonly VocabWord[],
    minimumLength = 3,
    maximumLength = 12
): VocabularyGameWord[] {
    const prepared:
        VocabularyGameWord[] = [];

    const answers =
        new Set<string>();

    for (const word of words) {
        const answer =
            normalizeGameAnswer(
                word.fr
            );

        if (
            answer.length < minimumLength
            || answer.length > maximumLength
            || answers.has(answer)
        ) {
            continue;
        }

        answers.add(answer);

        prepared.push({
            answer,
            label: word.fr.trim(),
            clue:
                word.fa?.trim()
                || word.ex_fa?.trim()
                || word.ex?.trim()
                || word.fr.trim()
        });
    }

    return prepared;
}

function randomIndex(
    length: number,
    random: RandomSource
): number {
    const value = Math.max(
        0,
        Math.min(
            0.999999,
            random()
        )
    );

    return Math.floor(
        value * length
    );
}

function shuffle<T>(
    values: readonly T[],
    random: RandomSource
): T[] {
    const shuffled = [
        ...values
    ];

    for (
        let index = shuffled.length - 1;
        index > 0;
        index -= 1
    ) {
        const target =
            randomIndex(
                index + 1,
                random
            );

        [
            shuffled[index],
            shuffled[target]
        ] = [
            shuffled[target],
            shuffled[index]
        ];
    }

    return shuffled;
}
