import {
    useEffect,
    useState
} from "react";

import {
    useParams
} from "react-router";

import {
    VocabularyPack
} from "../features/vocabulary/VocabularyPack.js";

import {
    parseVocabularyLevel
} from "../features/vocabulary/vocabularyLevels.js";

import {
    loadVocabularyPack
} from "../features/vocabulary/vocabularyRepository.js";

import {
    useI18n
} from "../i18n/I18nProvider.js";

import type {
    Level,
    VocabPack
} from "../types/global.js";

import {
    BackButton
} from "../ui/components/Controls.js";

import {
    EmptyState,
    ErrorState,
    LoadingState
} from "../ui/components/Feedback.js";

import {
    Page
} from "../ui/components/Layout.js";

/**
 * Durable Vocabulary pack route:
 *
 * /vocabulary/:level/:packId
 *
 * Activity navigation remains local to VocabularyPack. This prevents
 * flashcards, stories and quizzes from polluting the application router while
 * still giving each Vocabulary pack a durable URL.
 */
function VocabularyPackPage() {
    const {
        level:
            levelParameter,
        packId:
            packIdParameter
    } = useParams();

    const {
        t
    } = useI18n();

    const level =
        parseVocabularyLevel(
            levelParameter
        );

    const packId =
        normalizePackId(
            packIdParameter
        );

    const [
        pack,
        setPack
    ] =
        useState<
            VocabPack | null
        >(
            null
        );

    const [
        loading,
        setLoading
    ] =
        useState(
            true
        );

    const [
        retryCount,
        setRetryCount
    ] =
        useState(
            0
        );

    useEffect(
        () => {
            if (
                !level
                || !packId
            ) {
                setPack(
                    null
                );

                setLoading(
                    false
                );

                return;
            }

            let active =
                true;

            async function load(
                vocabularyLevel:
                    Level,

                routePackId:
                    string
            ): Promise<void> {
                setLoading(
                    true
                );

                setPack(
                    null
                );

                const loadedPack =
                    await loadVocabularyPack(
                        vocabularyLevel,
                        routePackId
                    );

                if (!active) {
                    return;
                }

                setPack(
                    loadedPack
                );

                setLoading(
                    false
                );
            }

            void load(
                level,
                packId
            );

            return () => {
                active =
                    false;
            };
        },
        [
            level,
            packId,
            retryCount
        ]
    );

    if (
        !level
        || !packId
    ) {
        return (
            <Page>
                <BackButton
                    fallback="/vocabulary"
                >
                    ←
                    {" "}
                    {t(
                        "common.back"
                    )}
                </BackButton>

                <ErrorState
                    title={
                        t(
                            "error.notFound.title"
                        )
                    }
                    description={
                        t(
                            "vocab.packSoon"
                        )
                    }
                />
            </Page>
        );
    }

    if (loading) {
        return (
            <Page>
                <LoadingState
                    label={
                        t(
                            "common.loading"
                        )
                    }
                />
            </Page>
        );
    }

    if (!pack) {
        return (
            <Page>
                <BackButton
                    fallback={
                        `/vocabulary/${level}`
                    }
                >
                    ←
                    {" "}
                    {t(
                        "common.back"
                    )}
                </BackButton>

                <EmptyState
                    icon="📖"
                    title={
                        t(
                            "vocab.packSoon"
                        )
                    }
                    action={
                        <button
                            type="button"
                            onClick={() => {
                                setRetryCount(
                                    current =>
                                        current + 1
                                );
                            }}
                            className="
                                text-sm
                                font-bold
                                text-dino-700
                                hover:underline
                                hover:underline-offset-4
                            "
                        >
                            {t(
                                "common.retry"
                            )}
                        </button>
                    }
                />
            </Page>
        );
    }

    return (
        <Page>
            <VocabularyPack
                key={
                    `${level}:${pack.id}`
                }
                pack={
                    pack
                }
            />
        </Page>
    );
}

/**
 * Safely decodes the pack identifier coming from React Router.
 *
 * Malformed percent-encoded URLs are treated as invalid instead of crashing
 * the whole route.
 */
function normalizePackId(
    value:
        string
        | undefined
): string | null {
    if (!value) {
        return null;
    }

    try {
        const decoded =
            decodeURIComponent(
                value
            ).trim();

        return (
            decoded
            || null
        );
    } catch {
        return null;
    }
}

export {
    VocabularyPackPage,
    normalizePackId
};