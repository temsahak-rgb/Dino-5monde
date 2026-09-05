import {
    useEffect,
    useMemo,
    useState
} from "react";

import {
    useParams
} from "react-router";

import {
    getGrammar,
    loadGrammar
} from "../features/grammar/grammarEngine.js";

import type {
    GrammarLessonIndex,
    GrammarLevel
} from "../types/global.js";

import {
    GrammarCatalog
} from "../features/grammar/GrammarCatalog.js";

import {
    useI18n
} from "../i18n/I18nProvider.js";

import {
    BackButton
} from "../ui/components/Controls.js";

import {
    ErrorState,
    LoadingState
} from "../ui/components/Feedback.js";

import {
    Page,
    PageHeader
} from "../ui/components/Layout.js";

/**
 * Grammar catalog route for one CEFR level.
 *
 * Responsibilities:
 * - validate the URL parameter
 * - load the Grammar catalog
 * - expose loading/error states
 * - delegate catalog presentation to GrammarCatalog
 */
function GrammarLevelPage() {
    const {
        level:
            levelParameter
    } = useParams();

    const {
        t
    } = useI18n();

    const level =
        parseGrammarLevel(
            levelParameter
        );

    const [
        lessons,
        setLessons
    ] =
        useState<
            GrammarLessonIndex[]
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
        failed,
        setFailed
    ] =
        useState(
            false
        );

    useEffect(
        () => {
            if (!level) {
                setLessons(
                    []
                );

                setFailed(
                    false
                );

                setLoading(
                    false
                );

                return;
            }

            let active =
                true;

            async function load(
                grammarLevel:
                    GrammarLevel
            ): Promise<void> {
                setLoading(
                    true
                );

                setFailed(
                    false
                );

                const loaded =
                    await loadGrammar(
                        grammarLevel
                    );

                if (!active) {
                    return;
                }

                const catalog =
                    loaded.length > 0
                        ? loaded
                        : getGrammar(
                            grammarLevel
                        );

                setLessons(
                    catalog
                );

                setFailed(
                    catalog.length
                    === 0
                );

                setLoading(
                    false
                );
            }

            void load(
                level
            );

            return () => {
                active =
                    false;
            };
        },
        [
            level
        ]
    );

    const recommended =
        useMemo(
            () =>
                lessons.filter(
                    lesson =>
                        lesson.recommended
                        === true
                ),
            [
                lessons
            ]
        );

    if (!level) {
        return (
            <Page>
                <BackButton
                    fallback="/grammar"
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
                            "grammar.lessonNotFound"
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

    if (failed) {
        return (
            <Page>
                <BackButton
                    fallback="/grammar"
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
                            "grammar.lessonNotFound"
                        )
                    }
                    onRetry={() => {
                        window.location
                            .reload();
                    }}
                    retryLabel={
                        t(
                            "common.retry"
                        )
                    }
                />
            </Page>
        );
    }

    return (
        <Page>
            <BackButton
                fallback="/grammar"
            >
                ←
                {" "}
                {t(
                    "common.back"
                )}
            </BackButton>

            <PageHeader
                icon="📚"
                eyebrow={
                    t(
                        "navbar.grammar"
                    )
                }
                title={
                    `${level} · ${getGrammarLevelLabel(
                        level,
                        t
                    )}`
                }
                description={
                    `${lessons.length} ${t(
                        "common.sections"
                    )}`
                }
            />

            <GrammarCatalog
                level={
                    level
                }
                lessons={
                    lessons
                }
                recommended={
                    recommended
                }
            />
        </Page>
    );
}

/**
 * Validates a Grammar CEFR route parameter.
 */
function parseGrammarLevel(
    value:
        string
        | undefined
): GrammarLevel | null {
    switch (value) {
        case "A1":
        case "A2":
        case "B1":
        case "B2":
        case "C1":
            return value;

        default:
            return null;
    }
}

type TranslationFunction =
    ReturnType<
        typeof useI18n
    >["t"];

function getGrammarLevelLabel(
    level:
        GrammarLevel,
    t:
        TranslationFunction
): string {
    const keys = {
        A1:
            "grammar.level.A1",

        A2:
            "grammar.level.A2",

        B1:
            "grammar.level.B1",

        B2:
            "grammar.level.B2",

        C1:
            "grammar.level.C1"
    } as const;

    return t(
        keys[
            level
        ]
    );
}

export {
    GrammarLevelPage,
    parseGrammarLevel
};