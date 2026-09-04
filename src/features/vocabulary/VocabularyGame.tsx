import type {
    ReactNode
} from "react";

import {
    useI18n
} from "../../i18n/I18nProvider.js";

import type {
    VocabPack
} from "../../types/global.js";

import {
    Card
} from "../../ui/components/Controls.js";

import {
    VocabularyCrossword
} from "./VocabularyCrossword.js";

import {
    VocabularyHangman
} from "./VocabularyHangman.js";

import type {
    VocabularyGameKind
} from "./vocabularyGameEngine.js";

import {
    VocabularyWordSearch
} from "./VocabularyWordSearch.js";

interface VocabularyGameProps {
    pack: VocabPack;
    game:
        VocabularyGameKind;
    onBack: () => void;
}

/**
 * React entry point for Vocabulary mini-games.
 *
 * The game engines remain framework-independent. This component only routes
 * the selected activity to its React presentation/orchestration layer.
 */
function VocabularyGame({
    pack,
    game,
    onBack
}: VocabularyGameProps) {
    switch (game) {
        case "hangman":
            return (
                <VocabularyHangman
                    pack={
                        pack
                    }
                    onBack={
                        onBack
                    }
                />
            );

        case "word-search":
            return (
                <VocabularyWordSearch
                    pack={
                        pack
                    }
                    onBack={
                        onBack
                    }
                />
            );

        case "crossword":
            return (
                <VocabularyCrossword
                    pack={
                        pack
                    }
                    onBack={
                        onBack
                    }
                />
            );
    }
}

/* -------------------------------------------------------------------------- */
/* Shared game shell                                                           */
/* -------------------------------------------------------------------------- */

interface VocabularyGameShellProps {
    pack: VocabPack;

    icon: string;
    title: string;
    instructions: string;

    onBack: () => void;
    onRestart: () => void;

    children: ReactNode;
}

/**
 * Shared layout used by Hangman, Word Search and Crossword.
 *
 * This replaces the historical `renderGameShell()` string template.
 */
function VocabularyGameShell({
    pack,
    icon,
    title,
    instructions,
    onBack,
    onRestart,
    children
}: VocabularyGameShellProps) {
    const {
        localizedTextClass,
        localizedValue,
        t
    } = useI18n();

    const frenchPackTitle =
        pack.title
        || pack.theme
        || pack.id;

    const persianPackTitle =
        pack.title_fa
        || pack.theme_fa;

    const packTitle =
        localizedValue(
            frenchPackTitle,
            persianPackTitle,
            pack.id
        );

    return (
        <main
            className="
                mx-auto
                w-full
                max-w-[960px]
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

            <header
                className="
                    flex
                    items-start
                    gap-3
                "
            >
                <span
                    className="
                        shrink-0
                        text-4xl
                        leading-none
                    "
                    aria-hidden="true"
                >
                    {icon}
                </span>

                <div
                    className="
                        min-w-0
                    "
                >
                    <h1
                        className="
                            text-2xl
                            font-bold
                            leading-tight
                            text-ink
                        "
                    >
                        {title}
                    </h1>

                    <p
                        className={`
                            mt-1
                            text-sm
                            text-muted
                            ${localizedTextClass()}
                        `}
                    >
                        {packTitle}
                    </p>
                </div>
            </header>

            <p
                className="
                    mt-5
                    max-w-2xl
                    text-sm
                    leading-6
                    text-muted
                "
            >
                {instructions}
            </p>

            <div
                className="
                    mt-6
                "
            >
                {children}
            </div>

            <button
                type="button"
                onClick={
                    onRestart
                }
                className="
                    mt-5
                    min-h-11
                    rounded-control
                    border
                    border-line
                    bg-surface
                    px-4
                    py-2.5
                    text-sm
                    font-semibold
                    text-ink
                    transition
                    hover:border-dino-300
                    hover:bg-dino-50
                    focus-visible:outline-none
                    focus-visible:ring-2
                    focus-visible:ring-dino-500
                    focus-visible:ring-offset-2
                "
            >
                ↻
                {" "}
                {t(
                    "vocab.game.newRound"
                )}
            </button>
        </main>
    );
}

/* -------------------------------------------------------------------------- */
/* Unavailable game                                                           */
/* -------------------------------------------------------------------------- */

interface VocabularyGameUnavailableProps {
    onBack: () => void;
}

/**
 * React replacement for the previous alert + automatic return behavior.
 */
function VocabularyGameUnavailable({
    onBack
}: VocabularyGameUnavailableProps) {
    const {
        t
    } = useI18n();

    return (
        <div
            className="
                mx-auto
                w-full
                max-w-[560px]
            "
        >
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
                    🎮
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
                        "vocab.game.unavailable"
                    )}
                </p>

                <button
                    type="button"
                    onClick={
                        onBack
                    }
                    className="
                        mt-6
                        min-h-11
                        rounded-control
                        bg-dino-600
                        px-5
                        py-2.5
                        text-sm
                        font-bold
                        text-white
                        transition
                        hover:bg-dino-700
                    "
                >
                    ←
                    {" "}
                    {t(
                        "common.back"
                    )}
                </button>
            </Card>
        </div>
    );
}

export {
    VocabularyGame,
    VocabularyGameShell,
    VocabularyGameUnavailable
};