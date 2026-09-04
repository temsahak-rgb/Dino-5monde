import {
    useEffect,
    useState
} from "react";

import {
    useParams
} from "react-router";

import {
    VocabularyCatalog
} from "../features/vocabulary/VocabularyCatalog.js";

import {
    parseVocabularyLevel
} from "../features/vocabulary/vocabularyLevels.js";

import {
    loadVocabularyIndex
} from "../features/vocabulary/vocabularyRepository.js";

import {
    useI18n
} from "../i18n/I18nProvider.js";

import type {
    Level,
    VocabPackIndex
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
    Page,
    PageHeader
} from "../ui/components/Layout.js";

/**
 * Vocabulary pack catalog for one CEFR level.
 *
 * Responsibilities:
 * - validate the route level
 * - load the pack index
 * - expose loading/empty states
 * - delegate pack rendering to VocabularyCatalog
 */
function VocabularyLevelPage() {
    const {
        level:
            levelParameter
    } = useParams();

    const {
        t
    } = useI18n();

    const level =
        parseVocabularyLevel(
            levelParameter
        );

    const [
        packs,
        setPacks
    ] =
        useState<
            VocabPackIndex[]
        >(
            []
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
            /*
             * Preserve the validated route value inside the asynchronous
             * closure.
             */
            const vocabularyLevel =
                level;

            if (!vocabularyLevel) {
                setPacks(
                    []
                );

                setLoading(
                    false
                );

                return;
            }

            let active =
                true;

            async function load():
                Promise<void> {
                setLoading(
                    true
                );

                const loadedPacks =
                    await loadVocabularyIndex(
                        vocabularyLevel
                    );

                if (!active) {
                    return;
                }

                setPacks(
                    loadedPacks
                );

                setLoading(
                    false
                );
            }

            void load();

            return () => {
                active =
                    false;
            };
        },
        [
            level,
            retryCount
        ]
    );

    if (!level) {
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

            <PageHeader
                icon="📖"
                eyebrow={
                    t(
                        "vocab.title"
                    )
                }
                title={
                    level
                }
                description={
                    t(
                        "vocab.chooseCategory"
                    )
                }
            />

            {packs.length > 0 ? (
                <VocabularyCatalog
                    level={
                        level
                    }
                    packs={
                        packs
                    }
                />
            ) : (
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
                            className="
                                text-sm
                                font-bold
                                text-dino-700
                                hover:underline
                                hover:underline-offset-4
                            "
                            onClick={() => {
                                setRetryCount(
                                    current =>
                                        current + 1
                                );
                            }}
                        >
                            {t(
                                "common.retry"
                            )}
                        </button>
                    }
                />
            )}
        </Page>
    );
}

/**
 * Re-exported only for route-related consumers during the migration.
 */
function isVocabularyLevel(
    value:
        string
        | undefined
): value is Level {
    return (
        parseVocabularyLevel(
            value
        )
        !== null
    );
}

export {
    VocabularyLevelPage,
    isVocabularyLevel
};