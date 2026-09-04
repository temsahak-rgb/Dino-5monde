import type { VocabWord } from "../../../types/global.js";
import {
    normalizeGameAnswer,
    prepareVocabularyGameWords
} from "./gameWordsEngine.js";
import type {
    VocabularyGameWord
} from "./gameWordsEngine.js";

export {
    checkCrosswordAnswers,
    createCrosswordGame
};

export type {
    CrosswordDirection,
    CrosswordEntry,
    CrosswordEvaluation,
    CrosswordGame
};

type CrosswordDirection =
    | "across"
    | "down";

interface CrosswordEntry {
    word: VocabularyGameWord;
    direction: CrosswordDirection;
    row: number;
    column: number;
    number: number;
}

interface CrosswordCell {
    row: number;
    column: number;
    letter: string;
    number?: number;
}

interface CrosswordGame {
    rows: number;
    columns: number;
    cells: readonly CrosswordCell[];
    entries: readonly CrosswordEntry[];
}

interface CrosswordEvaluation {
    correctCells: readonly string[];
    incorrectCells: readonly string[];
    completed: boolean;
}

interface MutableCrosswordCell {
    letter: string;
    directions: Set<CrosswordDirection>;
}

interface UnnumberedCrosswordEntry {
    word: VocabularyGameWord;
    direction: CrosswordDirection;
    row: number;
    column: number;
}

const wordLimit = 8;

function cellKey(
    row: number,
    column: number
): string {
    return `${row}:${column}`;
}

function entryCoordinates(
    entry: UnnumberedCrosswordEntry
): Array<{
    row: number;
    column: number;
}> {
    return [...entry.word.answer].map(
        (
            _letter,
            index
        ) => ({
            row:
                entry.row
                + (
                    entry.direction === "down"
                        ? index
                        : 0
                ),
            column:
                entry.column
                + (
                    entry.direction === "across"
                        ? index
                        : 0
                )
        })
    );
}

function canPlaceEntry(
    board: Map<string, MutableCrosswordCell>,
    entry: UnnumberedCrosswordEntry,
    requireCrossing: boolean
): boolean {
    const rowStep =
        entry.direction === "down"
            ? 1
            : 0;

    const columnStep =
        entry.direction === "across"
            ? 1
            : 0;

    if (
        board.has(
            cellKey(
                entry.row - rowStep,
                entry.column - columnStep
            )
        )
        || board.has(
            cellKey(
                entry.row
                    + rowStep
                        * entry.word.answer.length,
                entry.column
                    + columnStep
                        * entry.word.answer.length
            )
        )
    ) {
        return false;
    }

    let crossings = 0;

    for (
        const [index, coordinate]
        of entryCoordinates(entry).entries()
    ) {
        const existing = board.get(
            cellKey(
                coordinate.row,
                coordinate.column
            )
        );

        const letter =
            entry.word.answer[index];

        if (existing) {
            if (
                existing.letter !== letter
                || existing.directions.has(
                    entry.direction
                )
            ) {
                return false;
            }

            crossings += 1;
            continue;
        }

        const neighbours =
            entry.direction === "across"
                ? [
                    cellKey(
                        coordinate.row - 1,
                        coordinate.column
                    ),
                    cellKey(
                        coordinate.row + 1,
                        coordinate.column
                    )
                ]
                : [
                    cellKey(
                        coordinate.row,
                        coordinate.column - 1
                    ),
                    cellKey(
                        coordinate.row,
                        coordinate.column + 1
                    )
                ];

        if (
            neighbours.some(
                neighbour =>
                    board.has(neighbour)
            )
        ) {
            return false;
        }
    }

    return !requireCrossing
        || crossings > 0;
}

function placeEntry(
    board: Map<string, MutableCrosswordCell>,
    entry: UnnumberedCrosswordEntry
): void {
    entryCoordinates(entry).forEach(
        (
            coordinate,
            index
        ) => {
            const key = cellKey(
                coordinate.row,
                coordinate.column
            );

            const existing = board.get(key);

            if (existing) {
                existing.directions.add(
                    entry.direction
                );
                return;
            }

            board.set(
                key,
                {
                    letter:
                        entry.word.answer[index],
                    directions:
                        new Set([
                            entry.direction
                        ])
                }
            );
        }
    );
}

function findCrossingEntry(
    board: Map<string, MutableCrosswordCell>,
    placed: readonly UnnumberedCrosswordEntry[],
    word: VocabularyGameWord
): UnnumberedCrosswordEntry | null {
    for (const anchor of placed) {
        const direction: CrosswordDirection =
            anchor.direction === "across"
                ? "down"
                : "across";

        for (
            let anchorIndex = 0;
            anchorIndex < anchor.word.answer.length;
            anchorIndex += 1
        ) {
            for (
                let wordIndex = 0;
                wordIndex < word.answer.length;
                wordIndex += 1
            ) {
                if (
                    anchor.word.answer[anchorIndex]
                    !== word.answer[wordIndex]
                ) {
                    continue;
                }

                const crossingRow =
                    anchor.row
                    + (
                        anchor.direction === "down"
                            ? anchorIndex
                            : 0
                    );

                const crossingColumn =
                    anchor.column
                    + (
                        anchor.direction === "across"
                            ? anchorIndex
                            : 0
                    );

                const candidate:
                    UnnumberedCrosswordEntry = {
                        word,
                        direction,
                        row:
                            crossingRow
                            - (
                                direction === "down"
                                    ? wordIndex
                                    : 0
                            ),
                        column:
                            crossingColumn
                            - (
                                direction === "across"
                                    ? wordIndex
                                    : 0
                            )
                    };

                if (
                    canPlaceEntry(
                        board,
                        candidate,
                        true
                    )
                ) {
                    return candidate;
                }
            }
        }
    }

    return null;
}

function normalizeEntries(
    placed: readonly UnnumberedCrosswordEntry[],
    minimumRow: number,
    minimumColumn: number
): CrosswordEntry[] {
    const normalized = placed.map(
        entry => ({
            ...entry,
            row: entry.row - minimumRow,
            column: entry.column - minimumColumn
        })
    );

    const startKeys = [
        ...new Set(
            normalized.map(
                entry =>
                    cellKey(
                        entry.row,
                        entry.column
                    )
            )
        )
    ].sort(
        (
            first,
            second
        ) => {
            const [firstRow, firstColumn] =
                first.split(":").map(Number);

            const [secondRow, secondColumn] =
                second.split(":").map(Number);

            return firstRow - secondRow
                || firstColumn - secondColumn;
        }
    );

    const numberByStart = new Map(
        startKeys.map(
            (
                key,
                index
            ) => [key, index + 1]
        )
    );

    return normalized.map(
        entry => ({
            ...entry,
            number:
                numberByStart.get(
                    cellKey(
                        entry.row,
                        entry.column
                    )
                )
                ?? 0
        })
    );
}

/** Generates a connected crossword from French answers and Persian clues. */
function createCrosswordGame(
    words: readonly VocabWord[]
): CrosswordGame | null {
    const candidates =
        prepareVocabularyGameWords(
            words,
            3,
            12
        ).sort(
            (
                first,
                second
            ) =>
                second.answer.length
                - first.answer.length
        );

    if (candidates.length < 2) {
        return null;
    }

    const board =
        new Map<
            string,
            MutableCrosswordCell
        >();

    const placed:
        UnnumberedCrosswordEntry[] = [];

    const firstEntry:
        UnnumberedCrosswordEntry = {
            word: candidates[0],
            direction: "across",
            row: 0,
            column: 0
        };

    placeEntry(
        board,
        firstEntry
    );

    placed.push(firstEntry);

    for (const word of candidates.slice(1)) {
        if (placed.length >= wordLimit) {
            break;
        }

        const entry = findCrossingEntry(
            board,
            placed,
            word
        );

        if (!entry) {
            continue;
        }

        placeEntry(
            board,
            entry
        );

        placed.push(entry);
    }

    if (placed.length < 2) {
        return null;
    }

    const coordinates = [...board.keys()].map(
        key => {
            const [row, column] =
                key.split(":").map(Number);

            return { row, column };
        }
    );

    const minimumRow = Math.min(
        ...coordinates.map(
            coordinate => coordinate.row
        )
    );

    const minimumColumn = Math.min(
        ...coordinates.map(
            coordinate => coordinate.column
        )
    );

    const entries = normalizeEntries(
        placed,
        minimumRow,
        minimumColumn
    );

    const numberByStart = new Map(
        entries.map(
            entry => [
                cellKey(
                    entry.row,
                    entry.column
                ),
                entry.number
            ]
        )
    );

    const cells: CrosswordCell[] =
        coordinates.map(
            coordinate => {
                const row =
                    coordinate.row - minimumRow;

                const column =
                    coordinate.column
                    - minimumColumn;

                return {
                    row,
                    column,
                    letter:
                        board.get(
                            cellKey(
                                coordinate.row,
                                coordinate.column
                            )
                        )?.letter
                        ?? "",
                    number:
                        numberByStart.get(
                            cellKey(row, column)
                        )
                };
            }
        );

    return {
        rows:
            Math.max(
                ...cells.map(
                    cell => cell.row
                )
            ) + 1,
        columns:
            Math.max(
                ...cells.map(
                    cell => cell.column
                )
            ) + 1,
        cells,
        entries
    };
}

/** Checks every crossword cell and reports completion without mutating input. */
function checkCrosswordAnswers(
    game: CrosswordGame,
    answers: Readonly<Record<string, string>>
): CrosswordEvaluation {
    const correctCells: string[] = [];
    const incorrectCells: string[] = [];

    for (const cell of game.cells) {
        const key = cellKey(
            cell.row,
            cell.column
        );

        const answer = normalizeGameAnswer(
            answers[key]
            ?? ""
        ).slice(0, 1);

        if (answer === cell.letter) {
            correctCells.push(key);
        } else {
            incorrectCells.push(key);
        }
    }

    return {
        correctCells,
        incorrectCells,
        completed:
            correctCells.length
            === game.cells.length
    };
}
