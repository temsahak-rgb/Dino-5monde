import {
    useEffect,
    useState
} from "react";

import {
    useParams
} from "react-router";

import {
    loadGrammarLesson
} from "../features/grammar/grammarRepository.js";

import {
    GrammarLesson
} from "../features/grammar/GrammarLesson.js";

import {
    getLessonStatus,
    setLessonStatus
} from "../features/grammar/grammarEngine.js";

import {
    getGrammarLevelFromLessonId
} from "../features/grammar/grammarLevels.js";

import {
    useI18n
} from "../i18n/I18nProvider.js";

import {
    useContent
} from "../services/content/ContentProvider.js";

import type {
    GrammarLevel,
    LessonData
} from "../types/global.js";

import {
    BackButton
} from "../ui/components/Controls.js";

import {
    ErrorState,
    LoadingState
} from "../ui/components/Feedback.js";

import {
    Page
} from "../ui/components/Layout.js";

/**
 * Route page for one complete Grammar lesson.
 *
 * Responsibilities:
 * - validate the lesson identifier
 * - derive its CEFR level
 * - load lesson + exercise/quiz sections
 * - initialize the persisted lesson status
 * - expose loading/error states
 *
 * Actual lesson presentation and interaction live in GrammarLesson.
 */
function GrammarLessonPage() {
    const {
        lessonId:
            lessonIdParameter
    } = useParams();

    const {
        t
    } = useI18n();

    const {
        repository,
        status:
            contentStatus
    } = useContent();

    const lessonId =
        normalizeLessonId(
            lessonIdParameter
        );

    const level =
        lessonId
            ? getGrammarLevelFromLessonId(
                lessonId
            )
            : null;

    const [
        lesson,
        setLesson
    ] =
        useState<
            LessonData
            | null
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
        failure,
        setFailure
    ] =
        useState(
            null as
                | "not-found"
                | "unavailable"
                | null
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
                !lessonId
                || !level
            ) {
                setLesson(
                    null
                );

                setLoading(
                    false
                );

                setFailure(
                    "not-found"
                );

                return;
            }

            if (
                contentStatus
                === "loading"
            ) {
                setLoading(
                    true
                );
                setFailure(
                    null
                );

                return;
            }

            if (
                contentStatus
                === "error"
                || !repository
            ) {
                setLesson(
                    null
                );
                setLoading(
                    false
                );
                setFailure(
                    "unavailable"
                );

                return;
            }

            const activeRepository =
                repository;

            let active =
                true;

            async function load(
                grammarLevel:
                    GrammarLevel,

                routeLessonId:
                    string
            ): Promise<void> {
                setLoading(
                    true
                );

                setFailure(
                    null
                );

                try {
                    const loadedLesson =
                        await loadGrammarLesson(
                            activeRepository,
                            grammarLevel,
                            routeLessonId
                        );

                    if (!active) {
                        return;
                    }

                    if (!loadedLesson) {
                        setLesson(
                            null
                        );

                        setFailure(
                            "not-found"
                        );

                        setLoading(
                            false
                        );

                        return;
                    }

                    if (
                        getLessonStatus(
                            routeLessonId
                        )
                        === "not_started"
                    ) {
                        setLessonStatus(
                            routeLessonId,
                            "in_progress"
                        );
                    }

                    setLesson(
                        loadedLesson
                    );
                } catch (error) {
                    console.error(
                        `Failed to load grammar lesson ${routeLessonId}:`,
                        error
                    );

                    if (!active) {
                        return;
                    }

                    setLesson(
                        null
                    );
                    setFailure(
                        "unavailable"
                    );
                }

                setLoading(
                    false
                );
            }

            void load(
                level,
                lessonId
            );

            return () => {
                active =
                    false;
            };
        },
        [
            contentStatus,
            lessonId,
            level,
            repository,
            retryCount
        ]
    );

    if (
        !lessonId
        || !level
    ) {
        return (
            <GrammarLessonError
                level={
                    null
                }
                failure="not-found"
                onRetry={
                    null
                }
            />
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

    if (
        failure
        || !lesson
    ) {
        return (
            <GrammarLessonError
                level={
                    level
                }
                failure={
                    failure
                    ?? "not-found"
                }
                onRetry={() => {
                    setRetryCount(
                        current =>
                            current + 1
                    );
                }}
            />
        );
    }

    return (
        <Page>
            <BackButton
                fallback={
                    `/grammar/${level}`
                }
            >
                ←
                {" "}
                {t(
                    "common.back"
                )}
            </BackButton>

            <GrammarLesson
                lessonId={
                    lessonId
                }
                level={
                    level
                }
                lesson={
                    lesson
                }
            />
        </Page>
    );
}

interface GrammarLessonErrorProps {
    failure:
        | "not-found"
        | "unavailable";

    level:
        GrammarLevel
        | null;

    onRetry:
        (() => void)
        | null;
}

function GrammarLessonError({
    failure,
    level,
    onRetry
}: GrammarLessonErrorProps) {
    const {
        t
    } = useI18n();

    return (
        <Page>
            <BackButton
                fallback={
                    level
                        ? `/grammar/${level}`
                        : "/grammar"
                }
            >
                ←
                {" "}
                {t(
                    "common.back"
                )}
            </BackButton>

            <ErrorState
                title={
                    failure
                    === "unavailable"
                        ? t(
                            "error.unavailable.title"
                        )
                        : t(
                            "error.notFound.title"
                        )
                }
                description={
                    failure
                    === "unavailable"
                        ? t(
                            "error.unavailable.body"
                        )
                        : t(
                            "grammar.lessonNotFound"
                        )
                }
                onRetry={
                    onRetry
                    ?? undefined
                }
                retryLabel={
                    t(
                        "common.retry"
                    )
                }
            />
        </Page>
    );
}

/**
 * Normalizes the optional route parameter before it reaches Grammar engines.
 */
function normalizeLessonId(
    value:
        string
        | undefined
): string | null {
    const normalized =
        value?.trim();

    if (!normalized) {
        return null;
    }

    return normalized;
}

export {
    GrammarLessonPage,
    normalizeLessonId
};
