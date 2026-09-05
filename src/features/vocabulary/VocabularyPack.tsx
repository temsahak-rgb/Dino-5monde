import {
    useMemo,
    useState
} from "react";

import {
    getAvailableVocabularyGames
} from "./vocabularyGameEngine.js";

import type {
    VocabularyGameKind
} from "./vocabularyGameEngine.js";

import {
    getWeakWords
} from "./vocabularyRepository.js";

import {
    VocabularyFlashcards
} from "./VocabularyFlashcards.js";

import {
    VocabularyGame
} from "./VocabularyGame.js";

import {
    VocabularyQuiz
} from "./VocabularyQuiz.js";

import {
    VocabularyStory
} from "./VocabularyStory.js";

import {
    useI18n
} from "../../i18n/I18nProvider.js";

import type {
    StoryDifficulty,
    VocabPack
} from "../../types/global.js";

import {
    BackButton,
    Badge
} from "../../ui/components/Controls.js";

import {
    Grid,
    PageHeader
} from "../../ui/components/Layout.js";

interface VocabularyPackProps {
    pack: VocabPack;
}

type VocabularyActivity =
    | {
        type: "menu";
    }
    | {
        type: "flashcards";
        reviewMode: boolean;
    }
    | {
        type: "story";
        difficulty:
            StoryDifficulty;
    }
    | {
        type: "quiz";
    }
    | {
        type: "game";
        game:
            VocabularyGameKind;
    };

/**
 * Vocabulary pack orchestration.
 *
 * The pack itself owns ephemeral activity navigation while React Router keeps
 * the durable pack URL:
 *
 * /vocabulary/:level/:packId
 *
 * This mirrors the historical behavior without returning to DOM replacement.
 */
function VocabularyPack({
    pack
}: VocabularyPackProps) {
    const {
        localizedTextClass,
        localizedValue,
        t
    } = useI18n();

    const [
        activity,
        setActivity
    ] =
        useState<VocabularyActivity>({
            type: "menu"
        });

    const [
        weakCount,
        setWeakCount
    ] =
        useState(
            () =>
                getWeakWords(
                    pack.id
                ).length
        );

    const availableGames =
        useMemo(
            () =>
                getAvailableVocabularyGames(
                    pack.words
                ),
            [
                pack.words
            ]
        );

    const hasSimpleStory =
        Boolean(
            pack.stories?.simple
            || pack.stories?.easy
        );

    const hasLiteraryStory =
        Boolean(
            pack.stories?.literary
            || pack.stories?.hard
        );

    const hasQuiz =
        Boolean(
            pack.quiz
            || pack.exercise
        );

    const frenchTitle =
        pack.title
        || pack.theme
        || pack.id;

    const persianTitle =
        pack.title_fa
        || pack.theme_fa
        || frenchTitle;

    const title =
        localizedValue(
            frenchTitle,
            persianTitle,
            pack.id
        );

    if (
        activity.type
        === "flashcards"
    ) {
        return (
            <VocabularyFlashcards
                pack={
                    pack
                }
                reviewMode={
                    activity.reviewMode
                }
                onBack={
                    returnToMenu
                }
            />
        );
    }

    if (
        activity.type
        === "story"
    ) {
        return (
            <VocabularyStory
                pack={
                    pack
                }
                difficulty={
                    activity.difficulty
                }
                onBack={
                    returnToMenu
                }
            />
        );
    }

    if (
        activity.type
        === "quiz"
    ) {
        return (
            <VocabularyQuiz
                pack={
                    pack
                }
                onBack={
                    returnToMenu
                }
            />
        );
    }

    if (
        activity.type
        === "game"
    ) {
        return (
            <VocabularyGame
                pack={
                    pack
                }
                game={
                    activity.game
                }
                onBack={
                    returnToMenu
                }
            />
        );
    }

    return (
        <>
            <BackButton
                fallback={
                    `/vocabulary/${pack.level}`
                }
            >
                ← {t("common.back")}
            </BackButton>

            <PageHeader
                icon={
                    pack.icon
                    || "📖"
                }
                eyebrow={
                    pack.level
                }
                title={
                    <span
                        className={
                            localizedTextClass()
                        }
                    >
                        {title}
                    </span>
                }
                description={
                    `${pack.words.length} ${t(
                        "common.words"
                    )}`
                }
            />

            <div
                className="
                    mb-6
                    flex
                    flex-wrap
                    gap-2
                "
            >
                <Badge>
                    {pack.level}
                </Badge>

                <Badge>
                    {pack.words.length}
                    {" "}
                    {t(
                        "common.words"
                    )}
                </Badge>

                {weakCount > 0 ? (
                    <Badge>
                        🔁
                        {" "}
                        {weakCount}
                        {" "}
                        {t(
                            "common.words"
                        )}
                    </Badge>
                ) : null}
            </div>

            <Grid variant="wide">
                <ActivityCard
                    icon="🃏"
                    title={
                        t(
                            "vocab.flashcards"
                        )
                    }
                    description={
                        `${pack.words.length} ${t(
                            "common.words"
                        )}`
                    }
                    onClick={() => {
                        setActivity({
                            type:
                                "flashcards",
                            reviewMode:
                                false
                        });
                    }}
                />

                {availableGames.includes(
                    "hangman"
                ) ? (
                    <ActivityCard
                        icon="🦖"
                        title={
                            t(
                                "vocab.game.hangman"
                            )
                        }
                        description={
                            t(
                                "vocab.game.hangmanMeta"
                            )
                        }
                        onClick={() => {
                            setActivity({
                                type:
                                    "game",
                                game:
                                    "hangman"
                            });
                        }}
                    />
                ) : null}

                {availableGames.includes(
                    "word-search"
                ) ? (
                    <ActivityCard
                        icon="🔎"
                        title={
                            t(
                                "vocab.game.wordSearch"
                            )
                        }
                        description={
                            t(
                                "vocab.game.wordSearchMeta"
                            )
                        }
                        onClick={() => {
                            setActivity({
                                type:
                                    "game",
                                game:
                                    "word-search"
                            });
                        }}
                    />
                ) : null}

                {availableGames.includes(
                    "crossword"
                ) ? (
                    <ActivityCard
                        icon="✏️"
                        title={
                            t(
                                "vocab.game.crossword"
                            )
                        }
                        description={
                            t(
                                "vocab.game.crosswordMeta"
                            )
                        }
                        onClick={() => {
                            setActivity({
                                type:
                                    "game",
                                game:
                                    "crossword"
                            });
                        }}
                    />
                ) : null}

                {hasSimpleStory ? (
                    <ActivityCard
                        icon="🌱"
                        title={
                            t(
                                "vocab.simpleStory"
                            )
                        }
                        description={
                            t(
                                "vocab.simpleStoryMeta"
                            )
                        }
                        onClick={() => {
                            setActivity({
                                type:
                                    "story",
                                difficulty:
                                    "simple"
                            });
                        }}
                    />
                ) : null}

                {hasLiteraryStory ? (
                    <ActivityCard
                        icon="🌳"
                        title={
                            t(
                                "vocab.literaryStory"
                            )
                        }
                        description={
                            t(
                                "vocab.literaryStoryMeta"
                            )
                        }
                        onClick={() => {
                            setActivity({
                                type:
                                    "story",
                                difficulty:
                                    "literary"
                            });
                        }}
                    />
                ) : null}

                {hasQuiz ? (
                    <ActivityCard
                        icon="📝"
                        title={
                            t(
                                "vocab.quiz"
                            )
                        }
                        description={
                            t(
                                "vocab.quizMeta"
                            )
                        }
                        onClick={() => {
                            setActivity({
                                type:
                                    "quiz"
                            });
                        }}
                    />
                ) : null}

                {weakCount > 0 ? (
                    <ActivityCard
                        icon="🔁"
                        title={
                            t(
                                "vocab.weakWords"
                            )
                        }
                        description={
                            `${weakCount} ${t(
                                "common.words"
                            )}`
                        }
                        onClick={() => {
                            setActivity({
                                type:
                                    "flashcards",
                                reviewMode:
                                    true
                            });
                        }}
                    />
                ) : null}
            </Grid>
        </>
    );

    /**
     * Returns from an ephemeral activity to the durable pack menu.
     *
     * Flashcards can mutate weak-word persistence, so the count is refreshed
     * every time an activity closes.
     */
    function returnToMenu():
        void {
        setWeakCount(
            getWeakWords(
                pack.id
            ).length
        );

        setActivity({
            type: "menu"
        });
    }
}

/* -------------------------------------------------------------------------- */
/* Activity card                                                               */
/* -------------------------------------------------------------------------- */

interface ActivityCardProps {
    icon: string;
    title: string;
    description: string;
    onClick: () => void;
}

/**
 * Shared activity selector used by the pack landing screen.
 */
function ActivityCard({
    icon,
    title,
    description,
    onClick
}: ActivityCardProps) {
    return (
        <button
            type="button"
            onClick={
                onClick
            }
            className="
                group
                flex
                min-h-[132px]
                w-full
                flex-col
                rounded-card
                border
                border-line
                bg-surface
                p-4
                text-start
                shadow-sm
                transition
                hover:-translate-y-0.5
                hover:border-dino-300
                hover:shadow-md
                focus-visible:outline-none
                focus-visible:ring-2
                focus-visible:ring-dino-500
                focus-visible:ring-offset-2
            "
        >
            <span
                className="
                    text-2xl
                    leading-none
                "
                aria-hidden="true"
            >
                {icon}
            </span>

            <strong
                className="
                    mt-4
                    text-base
                    font-semibold
                    text-ink
                "
            >
                {title}
            </strong>

            <span
                className="
                    mt-1.5
                    text-sm
                    leading-5
                    text-muted
                "
            >
                {description}
            </span>
        </button>
    );
}

export {
    ActivityCard,
    VocabularyPack
};