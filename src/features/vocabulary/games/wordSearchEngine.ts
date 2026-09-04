import type { VocabWord } from "../../../types/global.js";
import {
    prepareVocabularyGameWords,
    randomIndex,
    shuffle
} from "./gameWordsEngine.js";
import type {
    RandomSource,
    VocabularyGameWord
} from "./gameWordsEngine.js";

export {
    createWordSearchGame,
    selectWordSearchLine
};

export type {
    GridCoordinate,
    WordSearchGame,
    WordSearchPlacement,
    WordSearchSelectionResult
};

interface GridCoordinate {
    row: number;
    column: number;
}

interface WordSearchPlacement {
    word: VocabularyGameWord;
    cells: readonly GridCoordinate[];
}

interface WordSearchGame {
    size: number;
    grid: readonly (readonly string[])[];
    placements: readonly WordSearchPlacement[];
    foundAnswers: readonly string[];
}

interface WordSearchSelectionResult {
    game: WordSearchGame;
    matchedWord: VocabularyGameWord | null;
}

const alphabet =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZ";

const gridSize = 12;

const wordLimit = 8;

const directions = [
    { row: 0, column: 1 },
    { row: 1, column: 0 },
    { row: 1, column: 1 },
    { row: 1, column: -1 }
] as const;

function getRandomStart(
    wordLength: number,
    rowStep: number,
    columnStep: number,
    random: RandomSource
): GridCoordinate {
    const rowRange = rowStep === 0
        ? gridSize
        : gridSize - wordLength + 1;

    const row = randomIndex(
        rowRange,
        random
    );

    if (columnStep === 0) {
        return {
            row,
            column: randomIndex(
                gridSize,
                random
            )
        };
    }

    const columnOffset = randomIndex(
        gridSize - wordLength + 1,
        random
    );

    return {
        row,
        column: columnStep > 0
            ? columnOffset
            : wordLength - 1
                + columnOffset
    };
}

function buildPlacement(
    word: VocabularyGameWord,
    rowStep: number,
    columnStep: number,
    start: GridCoordinate
): WordSearchPlacement {
    return {
        word,
        cells: [...word.answer].map(
            (
                _letter,
                index
            ) => ({
                row:
                    start.row
                    + rowStep * index,
                column:
                    start.column
                    + columnStep * index
            })
        )
    };
}

function canPlaceWord(
    grid: readonly (readonly (string | null)[])[],
    placement: WordSearchPlacement
): boolean {
    return placement.cells.every(
        (
            cell,
            index
        ) => {
            const current =
                grid[cell.row][cell.column];

            return current === null
                || current
                    === placement.word.answer[index];
        }
    );
}

function writePlacement(
    grid: Array<Array<string | null>>,
    placement: WordSearchPlacement
): void {
    placement.cells.forEach(
        (
            cell,
            index
        ) => {
            grid[cell.row][cell.column] =
                placement.word.answer[index];
        }
    );
}

/** Creates one complete letter grid containing up to eight corpus words. */
function createWordSearchGame(
    words: readonly VocabWord[],
    random: RandomSource = Math.random
): WordSearchGame | null {
    const candidates = shuffle(
        prepareVocabularyGameWords(
            words
        ),
        random
    ).slice(
        0,
        wordLimit
    );

    if (candidates.length < 3) {
        return null;
    }

    const grid:
        Array<Array<string | null>> =
            Array.from(
                { length: gridSize },
                () =>
                    Array<string | null>(
                        gridSize
                    ).fill(null)
            );

    const placements:
        WordSearchPlacement[] = [];

    for (const word of candidates) {
        for (
            let attempt = 0;
            attempt < 120;
            attempt += 1
        ) {
            const direction = directions[
                randomIndex(
                    directions.length,
                    random
                )
            ];

            const placement = buildPlacement(
                word,
                direction.row,
                direction.column,
                getRandomStart(
                    word.answer.length,
                    direction.row,
                    direction.column,
                    random
                )
            );

            if (
                !canPlaceWord(
                    grid,
                    placement
                )
            ) {
                continue;
            }

            writePlacement(
                grid,
                placement
            );

            placements.push(
                placement
            );
            break;
        }
    }

    if (placements.length < 3) {
        return null;
    }

    return {
        size: gridSize,
        grid: grid.map(
            row =>
                row.map(
                    cell =>
                        cell
                        ?? alphabet[
                            randomIndex(
                                alphabet.length,
                                random
                            )
                        ]
                )
        ),
        placements,
        foundAnswers: []
    };
}

function createLine(
    start: GridCoordinate,
    end: GridCoordinate
): GridCoordinate[] | null {
    const rowDistance =
        end.row - start.row;

    const columnDistance =
        end.column - start.column;

    if (
        rowDistance !== 0
        && columnDistance !== 0
        && Math.abs(rowDistance)
            !== Math.abs(columnDistance)
    ) {
        return null;
    }

    const length = Math.max(
        Math.abs(rowDistance),
        Math.abs(columnDistance)
    ) + 1;

    const rowStep = Math.sign(
        rowDistance
    );

    const columnStep = Math.sign(
        columnDistance
    );

    return Array.from(
        { length },
        (
            _value,
            index
        ) => ({
            row:
                start.row
                + rowStep * index,
            column:
                start.column
                + columnStep * index
        })
    );
}

function sameCoordinates(
    first: readonly GridCoordinate[],
    second: readonly GridCoordinate[]
): boolean {
    return first.length === second.length
        && first.every(
            (
                cell,
                index
            ) =>
                cell.row
                    === second[index].row
                && cell.column
                    === second[index].column
        );
}

/** Resolves a two-click straight-line selection in a letter grid. */
function selectWordSearchLine(
    game: WordSearchGame,
    start: GridCoordinate,
    end: GridCoordinate
): WordSearchSelectionResult {
    const line = createLine(
        start,
        end
    );

    if (!line) {
        return {
            game,
            matchedWord: null
        };
    }

    const reversed = [
        ...line
    ].reverse();

    const placement = game.placements.find(
        candidate =>
            !game.foundAnswers.includes(
                candidate.word.answer
            )
            && (
                sameCoordinates(
                    candidate.cells,
                    line
                )
                || sameCoordinates(
                    candidate.cells,
                    reversed
                )
            )
    );

    if (!placement) {
        return {
            game,
            matchedWord: null
        };
    }

    return {
        game: {
            ...game,
            foundAnswers: [
                ...game.foundAnswers,
                placement.word.answer
            ]
        },
        matchedWord: placement.word
    };
}
