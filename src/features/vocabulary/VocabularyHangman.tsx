import {
    useCallback,
    useEffect,
    useState
} from "react";

import {
    useI18n
} from "../../i18n/I18nProvider.js";

import type {
    VocabPack
} from "../../types/global.js";

import {
    createHangmanGame,
    getHangmanMaskedLetters,
    guessHangmanLetter,
    normalizeGameAnswer
} from "./vocabularyGameEngine.js";

import type {
    HangmanGame
} from "./vocabularyGameEngine.js";

import {
    VocabularyGameShell,
    VocabularyGameUnavailable
} from "./VocabularyGame.js";

interface VocabularyHangmanProps {
    pack: VocabPack;
    onBack: () => void;
}

const alphabet =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZ";

/**
 * Vocabulary Hangman.
 *
 * Game rules remain entirely owned by hangmanEngine.ts. React only owns the
 * active immutable game state and presentation.
 */
function VocabularyHangman({
    pack,
    onBack
}: VocabularyHangmanProps) {
    const {
        t
    } = useI18n();

    const [
        game,
        setGame
    ] =
        useState<HangmanGame | null>(
            () =>
                createHangmanGame(
                    pack.words
                )
        );

    const guessLetter =
        useCallback(
            (
                letter: string
            ) => {
                setGame(
                    current => {
                        if (!current) {
                            return current;
                        }

                        return guessHangmanLetter(
                            current,
                            letter
                        );
                    }
                );
            },
            []
        );

    /*
     * The old interface exposed an on-screen keyboard only.
     *
     * React also makes physical-keyboard play trivial while retaining exactly
     * the same engine validation.
     */
    useEffect(
        () => {
            function handleKeyDown(
                event: KeyboardEvent
            ): void {
                if (
                    event.ctrlKey
                    || event.metaKey
                    || event.altKey
                ) {
                    return;
                }

                const letter =
                    normalizeGameAnswer(
                        event.key
                    ).slice(
                        0,
                        1
                    );

                if (!letter) {
                    return;
                }

                guessLetter(
                    letter
                );
            }

            window.addEventListener(
                "keydown",
                handleKeyDown
            );

            return () => {
                window.removeEventListener(
                    "keydown",
                    handleKeyDown
                );
            };
        },
        [
            guessLetter
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

    const maskedLetters =
        getHangmanMaskedLetters(
            game
        );

    const wrongLetters =
        game.guessedLetters.filter(
            letter =>
                !game.word.answer.includes(
                    letter
                )
        );

    const statusMessage =
        getHangmanStatusMessage(
            game,
            t
        );

    return (
        <VocabularyGameShell
            pack={
                pack
            }
            icon="🦖"
            title={
                t(
                    "vocab.game.hangman"
                )
            }
            instructions={
                t(
                    "vocab.game.hangmanInstructions"
                )
            }
            onBack={
                onBack
            }
            onRestart={
                restart
            }
        >
            <section
                className="
                    rounded-card
                    border
                    border-line
                    bg-surface
                    p-5
                    text-center
                    shadow-sm
                    sm:p-7
                "
            >
                <p
                    className="
                        text-sm
                        text-muted
                    "
                >
                    {t(
                        "vocab.game.clue"
                    )}
                    {" "}
                    :
                </p>

                <p
                    dir="auto"
                    className="
                        mt-2
                        text-lg
                        font-semibold
                        leading-7
                        text-ink
                    "
                >
                    {game.word.clue}
                </p>

                <div
                    className="
                        ltr-lock
                        mt-8
                        flex
                        flex-wrap
                        justify-center
                        gap-2
                    "
                    aria-label={
                        maskedLetters.join(
                            " "
                        )
                    }
                >
                    {maskedLetters.map(
                        (
                            letter,
                            index
                        ) => (
                            <span
                                key={
                                    index
                                }
                                className="
                                    flex
                                    h-11
                                    min-w-9
                                    items-center
                                    justify-center
                                    border-b-2
                                    border-ink
                                    px-1
                                    text-xl
                                    font-bold
                                    text-ink
                                "
                            >
                                {letter}
                            </span>
                        )
                    )}
                </div>

                <div
                    aria-live="polite"
                    className={`
                        mt-7
                        rounded-control
                        border
                        px-4
                        py-3
                        text-sm
                        font-semibold
                        ${getHangmanStatusClasses(
                            game.status
                        )}
                    `}
                >
                    {statusMessage}
                </div>

                {wrongLetters.length > 0 ? (
                    <p
                        className="
                            ltr-lock
                            mt-4
                            text-sm
                            text-muted
                        "
                    >
                        {t(
                            "vocab.game.wrongLetters"
                        )}
                        {" "}
                        :
                        {" "}
                        <strong
                            className="
                                text-red-700
                            "
                        >
                            {wrongLetters.join(
                                " · "
                            )}
                        </strong>
                    </p>
                ) : null}

                <div
                    className="
                        ltr-lock
                        mt-7
                        grid
                        grid-cols-7
                        gap-1.5
                        sm:grid-cols-9
                    "
                >
                    {[...alphabet].map(
                        letter => {
                            const guessed =
                                game.guessedLetters.includes(
                                    letter
                                );

                            const disabled =
                                guessed
                                || game.status
                                    !== "playing";

                            const correctGuess =
                                guessed
                                && game.word.answer.includes(
                                    letter
                                );

                            const wrongGuess =
                                guessed
                                && !correctGuess;

                            return (
                                <button
                                    key={
                                        letter
                                    }
                                    type="button"
                                    disabled={
                                        disabled
                                    }
                                    onClick={() => {
                                        guessLetter(
                                            letter
                                        );
                                    }}
                                    className={`
                                        aspect-square
                                        min-h-9
                                        rounded-control
                                        border
                                        text-sm
                                        font-bold
                                        transition
                                        focus-visible:outline-none
                                        focus-visible:ring-2
                                        focus-visible:ring-dino-500
                                        focus-visible:ring-offset-1
                                        ${
                                            correctGuess
                                                ? `
                                                    border-emerald-400
                                                    bg-emerald-50
                                                    text-emerald-800
                                                `
                                                : wrongGuess
                                                    ? `
                                                        border-red-300
                                                        bg-red-50
                                                        text-red-700
                                                    `
                                                    : `
                                                        border-line
                                                        bg-page
                                                        text-ink
                                                        hover:border-dino-300
                                                        hover:bg-dino-50
                                                        disabled:cursor-default
                                                        disabled:opacity-40
                                                    `
                                        }
                                    `}
                                >
                                    {letter}
                                </button>
                            );
                        }
                    )}
                </div>
            </section>
        </VocabularyGameShell>
    );

    function restart():
        void {
        setGame(
            createHangmanGame(
                pack.words
            )
        );
    }
}

/* -------------------------------------------------------------------------- */
/* Status                                                                      */
/* -------------------------------------------------------------------------- */

type TranslationFunction =
    ReturnType<
        typeof useI18n
    >["t"];

function getHangmanStatusMessage(
    game: HangmanGame,
    t: TranslationFunction
): string {
    switch (game.status) {
        case "won":
            return t(
                "vocab.game.won",
                {
                    word:
                        game.word.label
                }
            );

        case "lost":
            return t(
                "vocab.game.lost",
                {
                    word:
                        game.word.label
                }
            );

        case "playing":
            return t(
                "vocab.game.remaining",
                {
                    count:
                        game.remainingMistakes
                }
            );
    }
}

function getHangmanStatusClasses(
    status:
        HangmanGame["status"]
): string {
    switch (status) {
        case "won":
            return `
                border-emerald-300
                bg-emerald-50
                text-emerald-900
            `;

        case "lost":
            return `
                border-red-300
                bg-red-50
                text-red-900
            `;

        case "playing":
            return `
                border-line
                bg-page
                text-muted
            `;
    }
}

export {
    VocabularyHangman,
    getHangmanStatusMessage
};