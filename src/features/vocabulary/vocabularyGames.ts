import { t } from "../../i18n/i18n.js";
import type { VocabPack } from "../../types/global.js";
import {
    app,
    getRequiredElement,
    queryElements
} from "../../ui/ui.js";
import {
    renderCrosswordGameView,
    renderHangmanGameView,
    renderWordSearchGameView
} from "../../ui/views/vocabularyGamesView.js";
import {
    checkCrosswordAnswers,
    createCrosswordGame,
    createHangmanGame,
    createWordSearchGame,
    getHangmanMaskedLetters,
    guessHangmanLetter,
    normalizeGameAnswer,
    selectWordSearchLine
} from "./vocabularyGameEngine.js";
import type {
    CrosswordEvaluation,
    GridCoordinate,
    VocabularyGameKind,
    VocabularyGameWord
} from "./vocabularyGameEngine.js";

export { startVocabularyMiniGame };

type BackHandler =
    () => void | Promise<void>;

/** Opens one fully local mini-game for the selected vocabulary pack. */
function startVocabularyMiniGame(
    pack: VocabPack,
    kind: VocabularyGameKind,
    onBack: BackHandler
): void {
    switch (kind) {
        case "hangman":
            startHangman(
                pack,
                onBack
            );
            break;

        case "word-search":
            startWordSearch(
                pack,
                onBack
            );
            break;

        case "crossword":
            startCrossword(
                pack,
                onBack
            );
            break;
    }
}

function showUnavailableGame(
    onBack: BackHandler
): void {
    alert(
        t("vocab.game.unavailable")
    );

    void onBack();
}

function bindGameChrome(
    onBack: BackHandler,
    onRestart: () => void
): void {
    getRequiredElement<HTMLButtonElement>(
        "vocab-game-back"
    ).onclick = () => {
        void onBack();
    };

    getRequiredElement<HTMLButtonElement>(
        "vocab-game-restart"
    ).onclick = onRestart;
}

function startHangman(
    pack: VocabPack,
    onBack: BackHandler
): void {
    let game = createHangmanGame(
        pack.words
    );

    if (!game) {
        showUnavailableGame(
            onBack
        );
        return;
    }

    const render = (): void => {
        if (!game) {
            return;
        }

        app.innerHTML =
            renderHangmanGameView(
                pack,
                game,
                getHangmanMaskedLetters(
                    game
                )
            );

        bindGameChrome(
            onBack,
            () =>
                startHangman(
                    pack,
                    onBack
                )
        );

        queryElements<HTMLButtonElement>(
            ".vocab-game-key"
        ).forEach(
            button => {
                button.onclick = () => {
                    const letter =
                        button.dataset.letter;

                    if (!letter || !game) {
                        return;
                    }

                    game = guessHangmanLetter(
                        game,
                        letter
                    );

                    render();
                };
            }
        );
    };

    render();
}

function readGridCoordinate(
    button: HTMLButtonElement
): GridCoordinate | null {
    const row = Number.parseInt(
        button.dataset.row
        ?? "",
        10
    );

    const column = Number.parseInt(
        button.dataset.column
        ?? "",
        10
    );

    return Number.isInteger(row)
        && Number.isInteger(column)
            ? {
                row,
                column
            }
            : null;
}

function startWordSearch(
    pack: VocabPack,
    onBack: BackHandler
): void {
    let game = createWordSearchGame(
        pack.words
    );

    if (!game) {
        showUnavailableGame(
            onBack
        );
        return;
    }

    let selectedStart:
        GridCoordinate | null = null;

    let lastMatch:
        VocabularyGameWord
        | null
        | undefined;

    const render = (): void => {
        if (!game) {
            return;
        }

        app.innerHTML =
            renderWordSearchGameView(
                pack,
                game,
                selectedStart,
                lastMatch
            );

        bindGameChrome(
            onBack,
            () =>
                startWordSearch(
                    pack,
                    onBack
                )
        );

        queryElements<HTMLButtonElement>(
            ".word-search-cell"
        ).forEach(
            button => {
                button.onclick = () => {
                    const coordinate =
                        readGridCoordinate(
                            button
                        );

                    if (!coordinate || !game) {
                        return;
                    }

                    if (!selectedStart) {
                        selectedStart = coordinate;
                        lastMatch = undefined;
                        render();
                        return;
                    }

                    const selection =
                        selectWordSearchLine(
                            game,
                            selectedStart,
                            coordinate
                        );

                    game = selection.game;
                    lastMatch =
                        selection.matchedWord;
                    selectedStart = null;

                    render();
                };
            }
        );
    };

    render();
}

function crosswordKey(
    row: number,
    column: number
): string {
    return `${row}:${column}`;
}

function startCrossword(
    pack: VocabPack,
    onBack: BackHandler
): void {
    const game = createCrosswordGame(
        pack.words
    );

    if (!game) {
        showUnavailableGame(
            onBack
        );
        return;
    }

    const answers:
        Record<string, string> = {};

    let evaluation:
        CrosswordEvaluation | undefined;

    const render = (): void => {
        app.innerHTML =
            renderCrosswordGameView(
                pack,
                game,
                answers,
                evaluation
            );

        bindGameChrome(
            onBack,
            () =>
                startCrossword(
                    pack,
                    onBack
                )
        );

        const inputs = Array.from(
            queryElements<HTMLInputElement>(
                ".crossword-input"
            )
        );

        inputs.forEach(
            input => {
                input.oninput = () => {
                    const row = Number.parseInt(
                        input.dataset.row
                        ?? "",
                        10
                    );

                    const column = Number.parseInt(
                        input.dataset.column
                        ?? "",
                        10
                    );

                    if (
                        !Number.isInteger(row)
                        || !Number.isInteger(column)
                    ) {
                        return;
                    }

                    const letter =
                        normalizeGameAnswer(
                            input.value
                        ).slice(0, 1);

                    input.value = letter;
                    answers[
                        crosswordKey(
                            row,
                            column
                        )
                    ] = letter;

                    if (evaluation) {
                        evaluation = undefined;
                        queryElements<HTMLElement>(
                            ".crossword-cell"
                        ).forEach(
                            cell => {
                                cell.classList.remove(
                                    "correct",
                                    "incorrect"
                                );
                            }
                        );

                        getRequiredElement<HTMLElement>(
                            "vocab-game-feedback"
                        ).textContent = "";
                    }

                    if (letter) {
                        const index = Number.parseInt(
                            input.dataset.cellIndex
                            ?? "-1",
                            10
                        );

                        inputs[index + 1]?.focus();
                    }
                };

                input.onkeydown = (
                    event: KeyboardEvent
                ) => {
                    if (
                        event.key !== "Backspace"
                        || input.value
                    ) {
                        return;
                    }

                    const index = Number.parseInt(
                        input.dataset.cellIndex
                        ?? "-1",
                        10
                    );

                    inputs[index - 1]?.focus();
                };
            }
        );

        getRequiredElement<HTMLButtonElement>(
            "crossword-check"
        ).onclick = () => {
            evaluation =
                checkCrosswordAnswers(
                    game,
                    answers
                );

            render();
        };
    };

    render();
}
