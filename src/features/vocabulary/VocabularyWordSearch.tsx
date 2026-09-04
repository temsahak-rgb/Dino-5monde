import {
    useMemo,
    useState
} from "react";

import {
    useI18n
} from "../../i18n/I18nProvider.js";

import type {
    VocabPack
} from "../../types/global.js";

import {
    createWordSearchGame,
    selectWordSearchLine
} from "./vocabularyGameEngine.js";

import type {
    GridCoordinate,
    VocabularyGameWord,
    WordSearchGame
} from "./vocabularyGameEngine.js";

import {
    VocabularyGameShell,
    VocabularyGameUnavailable
} from "./VocabularyGame.js";

interface VocabularyWordSearchProps {
    pack: VocabPack;
    onBack: () => void;
}

/**
 * Two-click Vocabulary word-search.
 *
 * Interaction:
 *
 * 1. select the first letter
 * 2. select the final letter
 * 3. the engine validates the resulting straight line
 *
 * The engine remains responsible for:
 *
 * - grid generation
 * - word placement
 * - reverse selections
 * - diagonal/horizontal/vertical validation
 * - found-word persistence
 */
function VocabularyWordSearch({
    pack,
    onBack
}: VocabularyWordSearchProps) {
    const {
        t
    } = useI18n();

    const [
        game,
        setGame
    ] =
        useState<WordSearchGame | null>(
            () =>
                createWordSearchGame(
                    pack.words
                )
        );

    const [
        selectedStart,
        setSelectedStart
    ] =
        useState<GridCoordinate | null>(
            null
        );

    const [
        lastMatch,
        setLastMatch
    ] =
        useState<
            VocabularyGameWord
            | null
            | undefined
        >(
            undefined
        );

    const foundCells =
        useMemo(
            () =>
                game
                    ? getFoundCells(
                        game
                    )
                    : new Set<string>(),
            [
                game
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

    const completed =
        game.foundAnswers.length
        === game.placements.length;

    const feedback =
        getWordSearchFeedback(
            game,
            selectedStart,
            lastMatch,
            t
        );

    const selectedKey =
        selectedStart
            ? coordinateKey(
                selectedStart
            )
            : null;

    return (
        <VocabularyGameShell
            pack={
                pack
            }
            icon="🔎"
            title={
                t(
                    "vocab.game.wordSearch"
                )
            }
            instructions={
                t(
                    "vocab.game.wordSearchInstructions"
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
                    lg:grid-cols-[minmax(0,1fr)_220px]
                "
            >
                <section
                    className="
                        min-w-0
                        rounded-card
                        border
                        border-line
                        bg-surface
                        p-3
                        shadow-sm
                        sm:p-5
                    "
                >
                    <div
                        className="
                            mx-auto
                            w-full
                            max-w-[620px]
                            overflow-x-auto
                        "
                    >
                        <div
                            className="
                                ltr-lock
                                grid
                                min-w-[480px]
                                gap-1
                            "
                            style={{
                                gridTemplateColumns:
                                    `repeat(${game.size}, minmax(0, 1fr))`
                            }}
                            aria-label={
                                t(
                                    "vocab.game.wordSearch"
                                )
                            }
                        >
                            {game.grid.flatMap(
                                (
                                    row,
                                    rowIndex
                                ) =>
                                    row.map(
                                        (
                                            letter,
                                            columnIndex
                                        ) => {
                                            const coordinate = {
                                                row:
                                                    rowIndex,
                                                column:
                                                    columnIndex
                                            };

                                            const key =
                                                coordinateKey(
                                                    coordinate
                                                );

                                            const found =
                                                foundCells.has(
                                                    key
                                                );

                                            const selected =
                                                selectedKey
                                                === key;

                                            return (
                                                <button
                                                    key={
                                                        key
                                                    }
                                                    type="button"
                                                    disabled={
                                                        completed
                                                    }
                                                    onClick={() => {
                                                        selectCell(
                                                            coordinate
                                                        );
                                                    }}
                                                    aria-pressed={
                                                        selected
                                                    }
                                                    className={`
                                                        aspect-square
                                                        min-h-8
                                                        rounded
                                                        border
                                                        text-sm
                                                        font-bold
                                                        transition
                                                        focus-visible:outline-none
                                                        focus-visible:ring-2
                                                        focus-visible:ring-dino-500
                                                        focus-visible:ring-offset-1
                                                        ${
                                                            found
                                                                ? `
                                                                    border-emerald-400
                                                                    bg-emerald-100
                                                                    text-emerald-900
                                                                `
                                                                : selected
                                                                    ? `
                                                                        border-dino-600
                                                                        bg-dino-100
                                                                        text-dino-900
                                                                        ring-2
                                                                        ring-dino-300
                                                                    `
                                                                    : `
                                                                        border-line
                                                                        bg-page
                                                                        text-ink
                                                                        hover:border-dino-300
                                                                        hover:bg-dino-50
                                                                    `
                                                        }
                                                        disabled:cursor-default
                                                    `}
                                                >
                                                    {letter}
                                                </button>
                                            );
                                        }
                                    )
                            )}
                        </div>
                    </div>
                </section>

                <aside
                    className="
                        rounded-card
                        border
                        border-line
                        bg-surface
                        p-4
                        shadow-sm
                    "
                >
                    <h2
                        className="
                            text-base
                            font-bold
                            text-ink
                        "
                    >
                        {t(
                            "vocab.game.wordsToFind"
                        )}
                    </h2>

                    <ul
                        className="
                            ltr-lock
                            mt-4
                            grid
                            gap-2
                        "
                    >
                        {game.placements.map(
                            placement => {
                                const found =
                                    game.foundAnswers.includes(
                                        placement.word.answer
                                    );

                                return (
                                    <li
                                        key={
                                            placement.word.answer
                                        }
                                        className={`
                                            rounded-control
                                            border
                                            px-3
                                            py-2
                                            text-sm
                                            font-semibold
                                            ${
                                                found
                                                    ? `
                                                        border-emerald-300
                                                        bg-emerald-50
                                                        text-emerald-800
                                                        line-through
                                                    `
                                                    : `
                                                        border-line
                                                        bg-page
                                                        text-ink
                                                    `
                                            }
                                        `}
                                    >
                                        {found
                                            ? "✓ "
                                            : ""
                                        }

                                        {
                                            placement
                                                .word
                                                .label
                                        }
                                    </li>
                                );
                            }
                        )}
                    </ul>
                </aside>
            </div>

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
                        completed
                            ? `
                                border-emerald-300
                                bg-emerald-50
                                text-emerald-900
                            `
                            : lastMatch === null
                                ? `
                                    border-amber-300
                                    bg-amber-50
                                    text-amber-900
                                `
                                : `
                                    border-line
                                    bg-surface
                                    text-muted
                                `
                    }
                `}
            >
                {feedback}
            </div>
        </VocabularyGameShell>
    );

    /**
     * Handles the two-click selection model.
     */
    function selectCell(
        coordinate: GridCoordinate
    ): void {
        if (
            !game
            || completed
        ) {
            return;
        }

        if (!selectedStart) {
            setSelectedStart(
                coordinate
            );

            setLastMatch(
                undefined
            );

            return;
        }

        const selection =
            selectWordSearchLine(
                game,
                selectedStart,
                coordinate
            );

        setGame(
            selection.game
        );

        setLastMatch(
            selection.matchedWord
        );

        setSelectedStart(
            null
        );
    }

    /**
     * Generates an entirely new grid from the same pack.
     */
    function restart():
        void {
        setGame(
            createWordSearchGame(
                pack.words
            )
        );

        setSelectedStart(
            null
        );

        setLastMatch(
            undefined
        );
    }
}

/* -------------------------------------------------------------------------- */
/* Found cells                                                                 */
/* -------------------------------------------------------------------------- */

function getFoundCells(
    game: WordSearchGame
): Set<string> {
    return new Set(
        game.placements
            .filter(
                placement =>
                    game.foundAnswers.includes(
                        placement.word.answer
                    )
            )
            .flatMap(
                placement =>
                    placement.cells.map(
                        coordinateKey
                    )
            )
    );
}

function coordinateKey(
    coordinate: GridCoordinate
): string {
    return (
        `${coordinate.row}:${coordinate.column}`
    );
}

/* -------------------------------------------------------------------------- */
/* Feedback                                                                    */
/* -------------------------------------------------------------------------- */

type TranslationFunction =
    ReturnType<
        typeof useI18n
    >["t"];

function getWordSearchFeedback(
    game: WordSearchGame,
    selectedStart:
        GridCoordinate | null,
    lastMatch:
        VocabularyGameWord
        | null
        | undefined,
    t: TranslationFunction
): string {
    const completed =
        game.foundAnswers.length
        === game.placements.length;

    if (completed) {
        return t(
            "vocab.game.wordSearchCompleted"
        );
    }

    if (lastMatch) {
        return t(
            "vocab.game.wordFound",
            {
                word:
                    lastMatch.label
            }
        );
    }

    if (
        lastMatch === null
    ) {
        return t(
            "vocab.game.wordSearchMiss"
        );
    }

    if (selectedStart) {
        return t(
            "vocab.game.selectEnd"
        );
    }

    return t(
        "vocab.game.foundCount",
        {
            found:
                game.foundAnswers.length,
            total:
                game.placements.length
        }
    );
}

export {
    VocabularyWordSearch,
    coordinateKey,
    getFoundCells,
    getWordSearchFeedback
};