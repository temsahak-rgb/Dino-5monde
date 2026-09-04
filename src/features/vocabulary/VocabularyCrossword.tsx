import {
    useMemo,
    useRef,
    useState
} from "react";

import type {
    KeyboardEvent as ReactKeyboardEvent
} from "react";

import {
    useI18n
} from "../../i18n/I18nProvider.js";

import type {
    VocabPack
} from "../../types/global.js";

import {
    Button,
    Card
} from "../../ui/components/Controls.js";

import {
    checkCrosswordAnswers,
    createCrosswordGame,
    normalizeGameAnswer
} from "./vocabularyGameEngine.js";

import type {
    CrosswordEvaluation,
    CrosswordGame
} from "./vocabularyGameEngine.js";

import {
    VocabularyGameShell,
    VocabularyGameUnavailable
} from "./VocabularyGame.js";

interface VocabularyCrosswordProps {
    pack:
        VocabPack;

    onBack:
        () => void;
}

type CrosswordAnswers =
    Record<string, string>;

/**
 * React Vocabulary crossword.
 *
 * The existing crossword engine remains responsible for:
 *
 * - building a connected grid
 * - selecting corpus words
 * - assigning across/down numbers
 * - Persian clues
 * - validating every cell
 *
 * React only manages keyboard input, focus and presentation state.
 */
function VocabularyCrossword({
    pack,
    onBack
}: VocabularyCrosswordProps) {
    const {
        t
    } = useI18n();

    const [
        game,
        setGame
    ] =
        useState<CrosswordGame | null>(
            () =>
                createCrosswordGame(
                    pack.words
                )
        );

    const [
        answers,
        setAnswers
    ] =
        useState<CrosswordAnswers>(
            {}
        );

    const [
        evaluation,
        setEvaluation
    ] =
        useState<
            CrosswordEvaluation
            | undefined
        >(
            undefined
        );

    const inputRefs =
        useRef<
            Array<
                HTMLInputElement
                | null
            >
        >(
            []
        );

    const cellsByKey =
        useMemo(
            () =>
                new Map(
                    (
                        game?.cells
                        ?? []
                    ).map(
                        cell => [
                            crosswordCellKey(
                                cell.row,
                                cell.column
                            ),
                            cell
                        ]
                    )
                ),
            [
                game
            ]
        );

    const orderedPlayableCells =
        useMemo(
            () => {
                if (!game) {
                    return [];
                }

                const cells:
                    Array<{
                        row:
                            number;

                        column:
                            number;
                    }> = [];

                for (
                    let row = 0;
                    row < game.rows;
                    row++
                ) {
                    for (
                        let column = 0;
                        column < game.columns;
                        column++
                    ) {
                        if (
                            cellsByKey.has(
                                crosswordCellKey(
                                    row,
                                    column
                                )
                            )
                        ) {
                            cells.push({
                                row,
                                column
                            });
                        }
                    }
                }

                return cells;
            },
            [
                cellsByKey,
                game
            ]
        );

    const inputIndexByKey =
        useMemo(
            () =>
                new Map(
                    orderedPlayableCells.map(
                        (
                            cell,
                            index
                        ) => [
                            crosswordCellKey(
                                cell.row,
                                cell.column
                            ),
                            index
                        ]
                    )
                ),
            [
                orderedPlayableCells
            ]
        );

    if (!game) {
        return (
            <VocabularyGameUnavailable
                onBack={
                    onBack
                }
            />
        );
    }

    /*
     * `game` is React state and therefore remains nullable from TypeScript's
     * point of view inside nested callbacks/functions.
     *
     * This constant captures the validated game for the current render and
     * gives those functions a stable non-null CrosswordGame.
     */
    const playableGame =
        game;

    const correctCells =
        new Set(
            evaluation?.correctCells
            ?? []
        );

    const incorrectCells =
        new Set(
            evaluation?.incorrectCells
            ?? []
        );

    const across =
        playableGame.entries.filter(
            entry =>
                entry.direction
                === "across"
        );

    const down =
        playableGame.entries.filter(
            entry =>
                entry.direction
                === "down"
        );

    const feedback =
        evaluation?.completed
            ? t(
                "vocab.game.crosswordCompleted"
            )
            : evaluation
                ? t(
                    "vocab.game.crosswordRetry"
                )
                : "";

    return (
        <VocabularyGameShell
            pack={
                pack
            }
            icon="✏️"
            title={
                t(
                    "vocab.game.crossword"
                )
            }
            instructions={
                t(
                    "vocab.game.crosswordInstructions"
                )
            }
            onBack={
                onBack
            }
            onRestart={
                restart
            }
        >
            <div
                className="
                    grid
                    gap-5
                    xl:grid-cols-[minmax(0,1fr)_300px]
                "
            >
                <Card
                    className="
                        min-w-0
                        overflow-x-auto
                        p-3
                        sm:p-5
                    "
                >
                    <div
                        className="
                            mx-auto
                            grid
                            w-max
                            gap-1
                            ltr-lock
                        "
                        style={{
                            gridTemplateColumns:
                                `repeat(${playableGame.columns}, 42px)`
                        }}
                    >
                        {renderGrid()}
                    </div>
                </Card>

                <div
                    className="
                        grid
                        content-start
                        gap-4
                    "
                >
                    <CrosswordClueList
                        title={
                            t(
                                "vocab.game.across"
                            )
                        }
                        entries={
                            across
                        }
                    />

                    <CrosswordClueList
                        title={
                            t(
                                "vocab.game.down"
                            )
                        }
                        entries={
                            down
                        }
                    />
                </div>
            </div>

            <Button
                fullWidth
                className="
                    mt-5
                "
                onClick={
                    checkAnswers
                }
            >
                ✓
                {" "}
                {t(
                    "vocab.game.check"
                )}
            </Button>

            {feedback ? (
                <div
                    aria-live="polite"
                    className={`
                        mt-4
                        rounded-control
                        border
                        px-4
                        py-3
                        text-sm
                        font-semibold
                        ${
                            evaluation
                                ?.completed
                                ? `
                                    border-emerald-300
                                    bg-emerald-50
                                    text-emerald-900
                                `
                                : `
                                    border-amber-300
                                    bg-amber-50
                                    text-amber-900
                                `
                        }
                    `}
                >
                    {feedback}
                </div>
            ) : null}
        </VocabularyGameShell>
    );

    /**
     * Produces every occupied and empty board position in row-major order.
     */
    function renderGrid() {
        const elements =
            [];

        for (
            let row = 0;
            row < playableGame.rows;
            row++
        ) {
            for (
                let column = 0;
                column < playableGame.columns;
                column++
            ) {
                const key =
                    crosswordCellKey(
                        row,
                        column
                    );

                const cell =
                    cellsByKey.get(
                        key
                    );

                if (!cell) {
                    elements.push(
                        <span
                            key={
                                key
                            }
                            aria-hidden="true"
                            className="
                                h-[42px]
                                w-[42px]
                                rounded
                                bg-neutral-200
                            "
                        />
                    );

                    continue;
                }

                const inputIndex =
                    inputIndexByKey.get(
                        key
                    )
                    ?? -1;

                const correct =
                    correctCells.has(
                        key
                    );

                const incorrect =
                    incorrectCells.has(
                        key
                    );

                elements.push(
                    <label
                        key={
                            key
                        }
                        className={`
                            relative
                            flex
                            h-[42px]
                            w-[42px]
                            items-center
                            justify-center
                            rounded
                            border
                            transition
                            ${
                                correct
                                    ? `
                                        border-emerald-500
                                        bg-emerald-50
                                    `
                                    : incorrect
                                        ? `
                                            border-red-400
                                            bg-red-50
                                        `
                                        : `
                                            border-line
                                            bg-surface
                                        `
                            }
                        `}
                    >
                        {cell.number ? (
                            <span
                                className="
                                    pointer-events-none
                                    absolute
                                    left-1
                                    top-0.5
                                    text-[9px]
                                    font-bold
                                    leading-none
                                    text-muted
                                "
                            >
                                {cell.number}
                            </span>
                        ) : null}

                        <input
                            ref={
                                element => {
                                    if (
                                        inputIndex
                                        >= 0
                                    ) {
                                        inputRefs
                                            .current[
                                                inputIndex
                                            ] =
                                                element;
                                    }
                                }
                            }
                            type="text"
                            inputMode="text"
                            autoComplete="off"
                            maxLength={1}
                            value={
                                answers[
                                    key
                                ]
                                ?? ""
                            }
                            aria-label={
                                t(
                                    "vocab.game.crosswordCell",
                                    {
                                        row:
                                            row + 1,

                                        column:
                                            column + 1
                                    }
                                )
                            }
                            onChange={
                                event => {
                                    updateAnswer(
                                        key,
                                        inputIndex,
                                        event.target
                                            .value
                                    );
                                }
                            }
                            onKeyDown={
                                event => {
                                    handleKeyDown(
                                        event,
                                        key,
                                        inputIndex
                                    );
                                }
                            }
                            className="
                                ltr-lock
                                h-full
                                w-full
                                border-0
                                bg-transparent
                                p-0
                                pt-1
                                text-center
                                text-lg
                                font-bold
                                uppercase
                                text-ink
                                outline-none
                            "
                        />
                    </label>
                );
            }
        }

        return elements;
    }

    /**
     * Normalizes one cell to a single A-Z character and moves focus forward.
     */
    function updateAnswer(
        key:
            string,
        inputIndex:
            number,
        rawValue:
            string
    ): void {
        const letter =
            normalizeGameAnswer(
                rawValue
            ).slice(
                0,
                1
            );

        setAnswers(
            current => ({
                ...current,

                [
                    key
                ]:
                    letter
            })
        );

        /*
         * The historical implementation clears previous red/green evaluation
         * as soon as the learner edits a cell.
         */
        if (evaluation) {
            setEvaluation(
                undefined
            );
        }

        if (
            letter
            && inputIndex
                >= 0
        ) {
            requestAnimationFrame(
                () => {
                    inputRefs
                        .current[
                            inputIndex
                            + 1
                        ]
                        ?.focus();
                }
            );
        }
    }

    /**
     * Empty Backspace moves to the previous playable crossword cell.
     */
    function handleKeyDown(
        event:
            ReactKeyboardEvent<
                HTMLInputElement
            >,
        key:
            string,
        inputIndex:
            number
    ): void {
        if (
            event.key
            !== "Backspace"
        ) {
            return;
        }

        if (
            answers[
                key
            ]
        ) {
            return;
        }

        if (
            inputIndex
            <= 0
        ) {
            return;
        }

        event.preventDefault();

        inputRefs
            .current[
                inputIndex - 1
            ]
            ?.focus();
    }

    function checkAnswers():
        void {
        setEvaluation(
            checkCrosswordAnswers(
                playableGame,
                answers
            )
        );
    }

    function restart():
        void {
        setGame(
            createCrosswordGame(
                pack.words
            )
        );

        setAnswers(
            {}
        );

        setEvaluation(
            undefined
        );

        inputRefs.current =
            [];
    }
}

/* -------------------------------------------------------------------------- */
/* Clues                                                                      */
/* -------------------------------------------------------------------------- */

interface CrosswordClueListProps {
    title:
        string;

    entries:
        CrosswordGame["entries"];
}

function CrosswordClueList({
    title,
    entries
}: CrosswordClueListProps) {
    if (
        entries.length
        === 0
    ) {
        return null;
    }

    return (
        <Card
            className="
                p-4
            "
        >
            <h2
                className="
                    text-base
                    font-bold
                    text-ink
                "
            >
                {title}
            </h2>

            <ol
                className="
                    mt-3
                    grid
                    gap-3
                "
            >
                {entries.map(
                    entry => (
                        <li
                            key={
                                `${entry.number}:${entry.direction}:${entry.word.answer}`
                            }
                            className="
                                grid
                                grid-cols-[auto_1fr]
                                gap-2
                                text-sm
                                leading-6
                            "
                        >
                            <strong
                                className="
                                    ltr-lock
                                    text-dino-700
                                "
                            >
                                {entry.number}.
                            </strong>

                            <span
                                className="
                                    persian-text
                                    text-ink
                                "
                            >
                                {entry.word.clue}

                                <small
                                    className="
                                        ltr-lock
                                        ms-1
                                        text-muted
                                    "
                                >
                                    (
                                    {
                                        entry
                                            .word
                                            .answer
                                            .length
                                    }
                                    )
                                </small>
                            </span>
                        </li>
                    )
                )}
            </ol>
        </Card>
    );
}

/* -------------------------------------------------------------------------- */
/* Utilities                                                                  */
/* -------------------------------------------------------------------------- */

function crosswordCellKey(
    row:
        number,
    column:
        number
): string {
    return `${row}:${column}`;
}

export {
    VocabularyCrossword,
    crosswordCellKey
};