import {
    useState
} from "react";

import {
    getStaticDataUrl
} from "../../core/staticData.js";

import {
    useI18n
} from "../../i18n/I18nProvider.js";

import type {
    VocabPack,
    VocabWord
} from "../../types/global.js";

import {
    Button,
    Card,
    ProgressBar
} from "../../ui/components/Controls.js";

import {
    PageHeader
} from "../../ui/components/Layout.js";

import {
    getWeakWords,
    setWeakWord
} from "./vocabularyRepository.js";

interface VocabularyFlashcardsProps {
    pack: VocabPack;
    reviewMode?: boolean;
    onBack: () => void;
}

type FlashcardStage =
    | "cards"
    | "review-prompt"
    | "result";

/**
 * Flashcard activity for one Vocabulary pack.
 *
 * Historical behavior preserved:
 *
 * - the deck is shuffled
 * - tapping the card reveals the Persian translation
 * - "unknown" adds the word to dino_vocab_weak
 * - "known" removes it from dino_vocab_weak
 * - unknown words from a normal session trigger a review proposal
 * - review mode contains only persisted weak words
 * - the final result can be replayed
 */
function VocabularyFlashcards({
    pack,
    reviewMode = false,
    onBack
}: VocabularyFlashcardsProps) {
    const {
        t
    } = useI18n();

    const [
        sessionReviewMode,
        setSessionReviewMode
    ] =
        useState(
            reviewMode
        );

    const [
        deck,
        setDeck
    ] =
        useState<VocabWord[]>(
            () =>
                createFlashcardDeck(
                    pack,
                    reviewMode
                )
        );

    const [
        index,
        setIndex
    ] =
        useState(0);

    const [
        knownCount,
        setKnownCount
    ] =
        useState(0);

    const [
        retryWords,
        setRetryWords
    ] =
        useState<VocabWord[]>(
            []
        );

    const [
        revealed,
        setRevealed
    ] =
        useState(false);

    const [
        stage,
        setStage
    ] =
        useState<FlashcardStage>(
            "cards"
        );

    if (
        deck.length === 0
    ) {
        return (
            <div
                className="
                    mx-auto
                    w-full
                    max-w-[560px]
                "
            >
                <button
                    type="button"
                    onClick={
                        onBack
                    }
                    className="
                        mb-6
                        border-0
                        bg-transparent
                        p-0
                        text-sm
                        font-bold
                        text-dino-700
                        hover:underline
                        hover:underline-offset-4
                    "
                >
                    ←
                    {" "}
                    {t(
                        "common.back"
                    )}
                </button>

                <Card
                    className="
                        p-8
                        text-center
                    "
                >
                    <div
                        className="
                            text-4xl
                        "
                        aria-hidden="true"
                    >
                        🔁
                    </div>

                    <p
                        className="
                            mt-4
                            text-base
                            font-semibold
                            text-ink
                        "
                    >
                        {t(
                            "vocab.noWeakWords"
                        )}
                    </p>

                    <Button
                        fullWidth
                        className="
                            mt-6
                        "
                        onClick={
                            onBack
                        }
                    >
                        {t(
                            "common.back"
                        )}
                    </Button>
                </Card>
            </div>
        );
    }

    if (
        stage
        === "review-prompt"
    ) {
        return (
            <FlashcardReviewPrompt
                retryCount={
                    retryWords.length
                }
                onReview={() => {
                    startSession(
                        true
                    );
                }}
                onStop={
                    onBack
                }
            />
        );
    }

    if (
        stage
        === "result"
    ) {
        return (
            <FlashcardResult
                knownCount={
                    knownCount
                }
                totalCount={
                    deck.length
                }
                onRetry={() => {
                    startSession(
                        sessionReviewMode
                    );
                }}
                onBack={
                    onBack
                }
            />
        );
    }

    const word =
        deck[
            index
        ];

    if (!word) {
        return null;
    }

    return (
        <div
            className="
                mx-auto
                w-full
                max-w-[560px]
            "
        >
            <div
                className="
                    mb-4
                    flex
                    items-center
                    justify-between
                    gap-4
                "
            >
                <button
                    type="button"
                    onClick={
                        onBack
                    }
                    className="
                        border-0
                        bg-transparent
                        p-0
                        text-sm
                        font-bold
                        text-dino-700
                        hover:underline
                        hover:underline-offset-4
                    "
                >
                    ←
                    {" "}
                    {t(
                        "common.back"
                    )}
                </button>

                <span
                    className="
                        ltr-lock
                        text-sm
                        text-muted
                    "
                >
                    {index + 1}
                    {" "}
                    /
                    {" "}
                    {deck.length}
                </span>
            </div>

            <ProgressBar
                value={
                    index
                }
                max={
                    Math.max(
                        deck.length,
                        1
                    )
                }
            />

            <div
                className="
                    mt-6
                "
            >
                <PageHeader
                    icon={
                        sessionReviewMode
                            ? "🔁"
                            : "🃏"
                    }
                    eyebrow={
                        pack.level
                    }
                    title={
                        sessionReviewMode
                            ? t(
                                "vocab.weakWords"
                            )
                            : t(
                                "vocab.flashcards"
                            )
                    }
                />
            </div>

            <button
                type="button"
                onClick={() => {
                    if (!revealed) {
                        setRevealed(
                            true
                        );
                    }
                }}
                className="
                    block
                    w-full
                    rounded-card
                    border
                    border-line
                    bg-surface
                    p-7
                    text-center
                    shadow-sm
                    transition
                    hover:border-dino-300
                    hover:shadow-md
                    focus-visible:outline-none
                    focus-visible:ring-2
                    focus-visible:ring-dino-500
                    focus-visible:ring-offset-2
                "
            >
                <FlashcardMedia
                    word={
                        word
                    }
                />

                <p
                    className="
                        ltr-lock
                        m-0
                        text-3xl
                        font-bold
                        leading-tight
                        text-ink
                    "
                >
                    {word.fr}
                </p>

                {revealed ? (
                    <div
                        className="
                            mt-6
                        "
                    >
                        <p
                            className="
                                persian-text
                                m-0
                                text-xl
                                font-semibold
                                text-dino-700
                            "
                        >
                            {word.fa}
                        </p>

                        {word.ex ? (
                            <p
                                className="
                                    ltr-lock
                                    mt-4
                                    text-[15px]
                                    italic
                                    leading-6
                                    text-neutral-700
                                "
                            >
                                {word.ex}
                            </p>
                        ) : null}

                        {word.ex_fa ? (
                            <p
                                className="
                                    persian-text
                                    mt-2
                                    text-sm
                                    leading-6
                                    text-muted
                                "
                            >
                                {word.ex_fa}
                            </p>
                        ) : null}
                    </div>
                ) : (
                    <p
                        className="
                            mt-5
                            text-xs
                            text-neutral-400
                        "
                    >
                        {t(
                            "vocab.cardHint"
                        )}
                    </p>
                )}
            </button>

            {revealed ? (
                <div
                    className="
                        mt-4
                        grid
                        grid-cols-2
                        gap-2.5
                    "
                >
                    <button
                        type="button"
                        onClick={
                            markUnknown
                        }
                        className="
                            min-h-12
                            rounded-control
                            border
                            border-red-500
                            bg-surface
                            px-4
                            py-3
                            text-sm
                            font-semibold
                            text-red-600
                            transition
                            hover:bg-red-50
                            focus-visible:outline-none
                            focus-visible:ring-2
                            focus-visible:ring-red-300
                            focus-visible:ring-offset-2
                        "
                    >
                        ❌
                        {" "}
                        {t(
                            "vocab.unknown"
                        )}
                    </button>

                    <button
                        type="button"
                        onClick={
                            markKnown
                        }
                        className="
                            min-h-12
                            rounded-control
                            border
                            border-dino-600
                            bg-dino-600
                            px-4
                            py-3
                            text-sm
                            font-bold
                            text-white
                            transition
                            hover:bg-dino-700
                            focus-visible:outline-none
                            focus-visible:ring-2
                            focus-visible:ring-dino-400
                            focus-visible:ring-offset-2
                        "
                    >
                        ✅
                        {" "}
                        {t(
                            "vocab.known"
                        )}
                    </button>
                </div>
            ) : null}

            <p
                className="
                    mt-3
                    text-center
                    text-xs
                    leading-5
                    text-neutral-400
                "
            >
                {t(
                    "vocab.weakWordsNote"
                )}
            </p>
        </div>
    );

    function markUnknown():
        void {
        setWeakWord(
            pack.id,
            word.fr,
            true
        );

        const nextRetryWords = [
            ...retryWords.filter(
                retryWord =>
                    retryWord.fr
                    !== word.fr
            ),
            word
        ];

        setRetryWords(
            nextRetryWords
        );

        advance(
            nextRetryWords
        );
    }

    function markKnown():
        void {
        setWeakWord(
            pack.id,
            word.fr,
            false
        );

        setKnownCount(
            current =>
                current + 1
        );

        advance(
            retryWords
        );
    }

    /**
     * Moves to the next card or resolves the current flashcard session.
     */
    function advance(
        currentRetryWords:
            VocabWord[]
    ): void {
        const nextIndex =
            index + 1;

        if (
            nextIndex
            < deck.length
        ) {
            setIndex(
                nextIndex
            );

            setRevealed(
                false
            );

            return;
        }

        if (
            currentRetryWords.length
                > 0
            && !sessionReviewMode
        ) {
            setStage(
                "review-prompt"
            );

            return;
        }

        setStage(
            "result"
        );
    }

    /**
     * Starts a fresh normal or weak-word review session.
     */
    function startSession(
        nextReviewMode: boolean
    ): void {
        const nextDeck =
            createFlashcardDeck(
                pack,
                nextReviewMode
            );

        setSessionReviewMode(
            nextReviewMode
        );

        setDeck(
            nextDeck
        );

        setIndex(
            0
        );

        setKnownCount(
            0
        );

        setRetryWords(
            []
        );

        setRevealed(
            false
        );

        setStage(
            nextDeck.length > 0
                ? "cards"
                : "result"
        );
    }
}

/* -------------------------------------------------------------------------- */
/* Media                                                                       */
/* -------------------------------------------------------------------------- */

interface FlashcardMediaProps {
    word: VocabWord;
}

function FlashcardMedia({
    word
}: FlashcardMediaProps) {
    if (word.img) {
        return (
            <img
                src={
                    resolveVocabularyImage(
                        word.img
                    )
                }
                alt=""
                className="
                    mx-auto
                    mb-4
                    max-h-40
                    w-full
                    rounded-control
                    object-cover
                "
            />
        );
    }

    if (word.emoji) {
        return (
            <div
                className="
                    mb-3
                    text-5xl
                "
                aria-hidden="true"
            >
                {word.emoji}
            </div>
        );
    }

    return null;
}

function resolveVocabularyImage(
    source: string
): string {
    if (
        /^(?:https?:|data:|blob:)/i
            .test(
                source
            )
    ) {
        return source;
    }

    return getStaticDataUrl(
        source
    );
}

/* -------------------------------------------------------------------------- */
/* Review prompt                                                               */
/* -------------------------------------------------------------------------- */

interface FlashcardReviewPromptProps {
    retryCount: number;
    onReview: () => void;
    onStop: () => void;
}

function FlashcardReviewPrompt({
    retryCount,
    onReview,
    onStop
}: FlashcardReviewPromptProps) {
    const {
        t
    } = useI18n();

    return (
        <div
            className="
                mx-auto
                w-full
                max-w-[500px]
                py-8
                text-center
            "
        >
            <div
                className="
                    text-5xl
                "
                aria-hidden="true"
            >
                🔁
            </div>

            <h1
                className="
                    mt-4
                    text-2xl
                    font-bold
                    text-ink
                "
            >
                {t(
                    "vocab.unknownCount",
                    {
                        count:
                            retryCount
                    }
                )}
            </h1>

            <p
                className="
                    mt-2
                    text-sm
                    leading-6
                    text-muted
                "
            >
                {t(
                    "vocab.reviewNow"
                )}
            </p>

            <div
                className="
                    mt-7
                    grid
                    gap-2.5
                "
            >
                <Button
                    fullWidth
                    onClick={
                        onReview
                    }
                >
                    🔁
                    {" "}
                    {t(
                        "vocab.review"
                    )}
                </Button>

                <button
                    type="button"
                    onClick={
                        onStop
                    }
                    className="
                        min-h-12
                        w-full
                        rounded-control
                        border
                        border-line
                        bg-surface
                        px-4
                        py-3
                        text-sm
                        font-semibold
                        text-ink
                        transition
                        hover:bg-neutral-50
                    "
                >
                    {t(
                        "common.finish"
                    )}
                </button>
            </div>
        </div>
    );
}

/* -------------------------------------------------------------------------- */
/* Result                                                                      */
/* -------------------------------------------------------------------------- */

interface FlashcardResultProps {
    knownCount: number;
    totalCount: number;
    onRetry: () => void;
    onBack: () => void;
}

function FlashcardResult({
    knownCount,
    totalCount,
    onRetry,
    onBack
}: FlashcardResultProps) {
    const {
        t
    } = useI18n();

    const percentage =
        totalCount > 0
            ? Math.round(
                (
                    knownCount
                    / totalCount
                )
                * 100
            )
            : 0;

    const presentation =
        getFlashcardResultPresentation(
            percentage,
            t
        );

    return (
        <div
            className="
                mx-auto
                w-full
                max-w-[500px]
                py-8
                text-center
            "
        >
            <div
                className="
                    text-5xl
                "
                aria-hidden="true"
            >
                {presentation.emoji}
            </div>

            <h1
                className="
                    mt-4
                    text-2xl
                    font-bold
                    text-ink
                "
            >
                {presentation.message}
            </h1>

            <p
                className="
                    ltr-lock
                    mt-3
                    text-base
                    text-muted
                "
            >
                {knownCount}
                {" "}
                /
                {" "}
                {totalCount}
                {" "}
                ({percentage}%)
            </p>

            <div
                className="
                    mt-7
                    grid
                    gap-2.5
                "
            >
                <Button
                    fullWidth
                    onClick={
                        onRetry
                    }
                >
                    🔄
                    {" "}
                    {t(
                        "common.retry"
                    )}
                </Button>

                <button
                    type="button"
                    onClick={
                        onBack
                    }
                    className="
                        min-h-12
                        w-full
                        rounded-control
                        border
                        border-line
                        bg-surface
                        px-4
                        py-3
                        text-sm
                        font-semibold
                        text-ink
                        transition
                        hover:bg-neutral-50
                    "
                >
                    {t(
                        "common.back"
                    )}
                </button>
            </div>
        </div>
    );
}

type TranslationFunction =
    ReturnType<
        typeof useI18n
    >["t"];

function getFlashcardResultPresentation(
    percentage: number,
    t: TranslationFunction
): {
    emoji: string;
    message: string;
} {
    if (
        percentage < 50
    ) {
        return {
            emoji: "💪",
            message:
                t(
                    "common.morePractice"
                )
        };
    }

    if (
        percentage < 80
    ) {
        return {
            emoji: "👍",
            message:
                t(
                    "common.good"
                )
        };
    }

    return {
        emoji: "🎉",
        message:
            t(
                "common.excellent"
            )
    };
}

/* -------------------------------------------------------------------------- */
/* Deck                                                                        */
/* -------------------------------------------------------------------------- */

function createFlashcardDeck(
    pack: VocabPack,
    reviewMode: boolean
): VocabWord[] {
    const weakWords =
        reviewMode
            ? getWeakWords(
                pack.id
            )
            : [];

    const sourceDeck =
        reviewMode
            ? pack.words.filter(
                word =>
                    weakWords.includes(
                        word.fr
                    )
            )
            : [
                ...pack.words
            ];

    return shuffleVocabularyWords(
        sourceDeck
    );
}

function shuffleVocabularyWords(
    words: readonly VocabWord[]
): VocabWord[] {
    const shuffled = [
        ...words
    ];

    for (
        let index =
            shuffled.length - 1;
        index > 0;
        index--
    ) {
        const target =
            Math.floor(
                Math.random()
                * (index + 1)
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

export {
    VocabularyFlashcards,
    createFlashcardDeck,
    shuffleVocabularyWords
};