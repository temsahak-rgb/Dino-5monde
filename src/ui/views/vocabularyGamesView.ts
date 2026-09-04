import { renderNavbar } from "./navbarView.js";
import {
    localizedTextClass,
    localizedValue,
    t
} from "../../i18n/i18n.js";
import type { VocabPack } from "../../types/global.js";
import type {
    CrosswordEvaluation,
    CrosswordGame,
    GridCoordinate,
    HangmanGame,
    VocabularyGameWord,
    WordSearchGame
} from "../../features/vocabulary/vocabularyGameEngine.js";

export {
    renderCrosswordGameView,
    renderHangmanGameView,
    renderWordSearchGameView
};

const alphabet =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZ";

function getPackTitle(
    pack: VocabPack
): string {
    return localizedValue(
        pack.title
        || pack.theme
        || pack.id,
        pack.title_fa
        || pack.theme_fa,
        pack.id
    );
}

function renderGameShell(
    pack: VocabPack,
    icon: string,
    title: string,
    instructions: string,
    content: string
): string {
    return `
        ${renderNavbar()}

        <main class="vocab-game-page">
            <button
                id="vocab-game-back"
                type="button"
                class="back-btn"
            >
                ← ${t("common.back")}
            </button>

            <header class="vocab-game-header">
                <span
                    class="vocab-game-icon"
                    aria-hidden="true"
                >
                    ${icon}
                </span>

                <div>
                    <h1>${title}</h1>
                    <p class="${localizedTextClass()}">
                        ${getPackTitle(pack)}
                    </p>
                </div>
            </header>

            <p class="vocab-game-instructions">
                ${instructions}
            </p>

            ${content}

            <button
                id="vocab-game-restart"
                type="button"
                class="vocab-game-action"
            >
                ↻ ${t("vocab.game.newRound")}
            </button>
        </main>
    `;
}

function renderHangmanGameView(
    pack: VocabPack,
    game: HangmanGame,
    maskedLetters: readonly string[]
): string {
    const wrongLetters =
        game.guessedLetters.filter(
            letter =>
                !game.word.answer.includes(
                    letter
                )
        );

    const status =
        game.status === "won"
            ? t(
                "vocab.game.won",
                {
                    word: game.word.label
                }
            )
            : game.status === "lost"
                ? t(
                    "vocab.game.lost",
                    {
                        word: game.word.label
                    }
                )
                : t(
                    "vocab.game.remaining",
                    {
                        count:
                            game.remainingMistakes
                    }
                );

    const content = `
        <section class="vocab-game-panel">
            <p class="vocab-game-clue persian-text">
                ${t("vocab.game.clue")} :
                <strong>${game.word.clue}</strong>
            </p>

            <div
                class="hangman-word ltr-lock"
                aria-label="${maskedLetters.join(" ")}"
            >
                ${maskedLetters
                    .map(
                        letter => `
                            <span>${letter}</span>
                        `
                    )
                    .join("")}
            </div>

            <p
                id="vocab-game-feedback"
                class="vocab-game-feedback ${game.status}"
                aria-live="polite"
            >
                ${status}
            </p>

            ${wrongLetters.length > 0
                ? `
                    <p class="hangman-wrong ltr-lock">
                        ${t("vocab.game.wrongLetters")} :
                        ${wrongLetters.join(" · ")}
                    </p>
                `
                : ""
            }

            <div class="hangman-keyboard ltr-lock">
                ${[...alphabet]
                    .map(
                        letter => `
                            <button
                                type="button"
                                class="vocab-game-key"
                                data-letter="${letter}"
                                ${
                                    game.guessedLetters.includes(
                                        letter
                                    )
                                    || game.status !== "playing"
                                        ? "disabled"
                                        : ""
                                }
                            >
                                ${letter}
                            </button>
                        `
                    )
                    .join("")}
            </div>
        </section>
    `;

    return renderGameShell(
        pack,
        "🦖",
        t("vocab.game.hangman"),
        t("vocab.game.hangmanInstructions"),
        content
    );
}

function coordinateKey(
    coordinate: GridCoordinate
): string {
    return `${coordinate.row}:${coordinate.column}`;
}

function getFoundWordSearchCells(
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

function renderWordSearchGameView(
    pack: VocabPack,
    game: WordSearchGame,
    selectedStart: GridCoordinate | null,
    lastMatch: VocabularyGameWord | null | undefined
): string {
    const foundCells =
        getFoundWordSearchCells(
            game
        );

    const selectedKey =
        selectedStart
            ? coordinateKey(
                selectedStart
            )
            : null;

    const completed =
        game.foundAnswers.length
        === game.placements.length;

    const feedback = completed
        ? t("vocab.game.wordSearchCompleted")
        : lastMatch
            ? t(
                "vocab.game.wordFound",
                {
                    word: lastMatch.label
                }
            )
            : lastMatch === null
                ? t("vocab.game.wordSearchMiss")
                : selectedStart
                    ? t("vocab.game.selectEnd")
                    : t(
                        "vocab.game.foundCount",
                        {
                            found:
                                game.foundAnswers.length,
                            total:
                                game.placements.length
                        }
                    );

    const content = `
        <section class="vocab-game-panel word-search-layout">
            <div class="word-search-grid-wrap">
                <div
                    class="word-search-grid ltr-lock"
                    style="--word-search-size:${game.size}"
                    aria-label="${t("vocab.game.wordSearch")}"
                >
                    ${game.grid
                    .flatMap(
                        (
                            row,
                            rowIndex
                        ) =>
                            row.map(
                                (
                                    letter,
                                    columnIndex
                                ) => {
                                    const key =
                                        `${rowIndex}:${columnIndex}`;

                                    const classNames = [
                                        "word-search-cell",
                                        foundCells.has(key)
                                            ? "found"
                                            : "",
                                        selectedKey === key
                                            ? "selected"
                                            : ""
                                    ].filter(Boolean)
                                        .join(" ");

                                    return `
                                        <button
                                            type="button"
                                            class="${classNames}"
                                            data-row="${rowIndex}"
                                            data-column="${columnIndex}"
                                            ${completed ? "disabled" : ""}
                                        >
                                            ${letter}
                                        </button>
                                    `;
                                }
                            )
                    )
                        .join("")}
                </div>
            </div>

            <aside class="word-search-words">
                <h2>${t("vocab.game.wordsToFind")}</h2>

                <ul class="ltr-lock">
                    ${game.placements
                        .map(
                            placement => `
                                <li class="${
                                    game.foundAnswers.includes(
                                        placement.word.answer
                                    )
                                        ? "found"
                                        : ""
                                }">
                                    ${placement.word.label}
                                </li>
                            `
                        )
                        .join("")}
                </ul>
            </aside>
        </section>

        <p
            id="vocab-game-feedback"
            class="vocab-game-feedback ${completed ? "won" : ""}"
            aria-live="polite"
        >
            ${feedback}
        </p>
    `;

    return renderGameShell(
        pack,
        "🔎",
        t("vocab.game.wordSearch"),
        t("vocab.game.wordSearchInstructions"),
        content
    );
}

function crosswordCellKey(
    row: number,
    column: number
): string {
    return `${row}:${column}`;
}

function renderCrosswordGameView(
    pack: VocabPack,
    game: CrosswordGame,
    answers: Readonly<Record<string, string>>,
    evaluation?: CrosswordEvaluation
): string {
    const cellsByKey =
        new Map(
            game.cells.map(
                cell => [
                    crosswordCellKey(
                        cell.row,
                        cell.column
                    ),
                    cell
                ]
            )
        );

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

    let inputIndex = 0;

    const gridCells:
        string[] = [];

    for (
        let row = 0;
        row < game.rows;
        row += 1
    ) {
        for (
            let column = 0;
            column < game.columns;
            column += 1
        ) {
            const key =
                crosswordCellKey(
                    row,
                    column
                );

            const cell =
                cellsByKey.get(key);

            if (!cell) {
                gridCells.push(
                    '<span class="crossword-block" aria-hidden="true"></span>'
                );
                continue;
            }

            const classNames = [
                "crossword-cell",
                correctCells.has(key)
                    ? "correct"
                    : "",
                incorrectCells.has(key)
                    ? "incorrect"
                    : ""
            ].filter(Boolean)
                .join(" ");

            gridCells.push(`
                <label class="${classNames}">
                    ${cell.number
                        ? `<span>${cell.number}</span>`
                        : ""
                    }
                    <input
                        class="crossword-input ltr-lock"
                        type="text"
                        inputmode="text"
                        autocomplete="off"
                        maxlength="1"
                        value="${answers[key] ?? ""}"
                        data-row="${row}"
                        data-column="${column}"
                        data-cell-index="${inputIndex}"
                        aria-label="${t(
                            "vocab.game.crosswordCell",
                            {
                                row: row + 1,
                                column: column + 1
                            }
                        )}"
                    >
                </label>
            `);

            inputIndex += 1;
        }
    }

    const across =
        game.entries.filter(
            entry =>
                entry.direction === "across"
        );

    const down =
        game.entries.filter(
            entry =>
                entry.direction === "down"
        );

    const feedback =
        evaluation?.completed
            ? t("vocab.game.crosswordCompleted")
            : evaluation
                ? t("vocab.game.crosswordRetry")
                : "";

    const content = `
        <section class="vocab-game-panel crossword-layout">
            <div class="crossword-grid-wrap">
                <div
                    class="crossword-grid ltr-lock"
                    style="--crossword-columns:${game.columns}"
                >
                    ${gridCells.join("")}
                </div>
            </div>

            <div class="crossword-clues">
                ${renderCrosswordClueList(
                    t("vocab.game.across"),
                    across
                )}

                ${renderCrosswordClueList(
                    t("vocab.game.down"),
                    down
                )}
            </div>
        </section>

        <button
            id="crossword-check"
            type="button"
            class="vocab-game-primary"
        >
            ✓ ${t("vocab.game.check")}
        </button>

        <p
            id="vocab-game-feedback"
            class="vocab-game-feedback ${evaluation?.completed ? "won" : ""}"
            aria-live="polite"
        >
            ${feedback}
        </p>
    `;

    return renderGameShell(
        pack,
        "✏️",
        t("vocab.game.crossword"),
        t("vocab.game.crosswordInstructions"),
        content
    );
}

function renderCrosswordClueList(
    title: string,
    entries: CrosswordGame["entries"]
): string {
    if (entries.length === 0) {
        return "";
    }

    return `
        <section>
            <h2>${title}</h2>
            <ol class="crossword-clue-list">
                ${entries
                    .map(
                        entry => `
                            <li
                                value="${entry.number}"
                                class="persian-text"
                            >
                                ${entry.word.clue}
                                <small>
                                    (${entry.word.answer.length})
                                </small>
                            </li>
                        `
                    )
                    .join("")}
            </ol>
        </section>
    `;
}
