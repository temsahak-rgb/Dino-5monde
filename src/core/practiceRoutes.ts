import type {
    Level
} from "../types/global.js";

const practiceGameKinds = [
    "hangman",
    "word-search",
    "crossword"
] as const;

const practiceLevels = [
    "A1",
    "A2",
    "B1",
    "B2",
    "C1",
    "C2"
] as const satisfies readonly Level[];

type PracticeGameKind =
    typeof practiceGameKinds[number];

function isPracticeGameKind(
    value: string | undefined
): value is PracticeGameKind {
    return practiceGameKinds.some(
        game => game === value
    );
}

function createPracticeCatalogPath(
    game: PracticeGameKind,
    level: Level
): string {
    return `/practice/${game}/${level}`;
}

function createPracticeGamePath(
    game: PracticeGameKind,
    level: Level,
    packId: string
): string {
    return `${createPracticeCatalogPath(game, level)}/${encodePracticePackId(packId)}`;
}

function encodePracticePackId(
    packId: string
): string {
    if (
        !packId
        || packId.trim() !== packId
        || packId.length > 160
        || packId === "."
        || packId === ".."
        || /[\\/\u0000-\u001f\u007f]/u.test(packId)
    ) {
        throw new TypeError(
            `Invalid practice pack identifier: ${JSON.stringify(packId)}`
        );
    }

    return encodeURIComponent(packId);
}

export {
    createPracticeCatalogPath,
    createPracticeGamePath,
    isPracticeGameKind,
    practiceGameKinds,
    practiceLevels
};

export type {
    PracticeGameKind
};
