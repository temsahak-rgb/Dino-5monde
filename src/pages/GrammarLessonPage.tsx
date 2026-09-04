import {
    useEffect,
    useState
} from "react";

import {
    useParams
} from "react-router";

import {
    loadLessonWithExercises
} from "../core/lessonEngine.js";

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
        useState<LessonData | null>(
            null
        );

    const [
        loading,
        setLoading
    ] =
        useState(true);

    const [
        failed,
        setFailed
    ] =
        useState(false);

    const [
        retryCount,
        setRetryCount
    ] =
        useState(0);

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

                setFailed(
                    true
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

                setFailed(
                    false
                );

                const loadedLesson =
                    await loadLessonWithExercises(
                        level,
                        lessonId
                    );

                if (!active) {
                    return;
                }

                if (!loadedLesson) {
                    setLesson(
                        null
                    );

                    setFailed(
                        true
                    );

                    setLoading(
                        false
                    );

                    return;
                }

                if (
                    getLessonStatus(
                        lessonId
                    )
                    === "not_started"
                ) {
                    setLessonStatus(
                        lessonId,
                        "in_progress"
                    );
                }

                setLesson(
                    loadedLesson
                );

                setLoading(
                    false
                );
            }

            void load();

            return () => {
                active = false;
            };
        },
        [
            lessonId,
            level,
            retryCount
        ]
    );

    if (
        !lessonId
        || !level
    ) {
        return (
            <GrammarLessonError
                level={null}
                onRetry={null}
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
        failed
        || !lesson
    ) {
        return (
            <GrammarLessonError
                level={
                    level
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
                ← {t("common.back")}
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
    level:
        GrammarLevel | null;

    onRetry:
        (() => void)
        | null;
}

function GrammarLessonError({
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
                ← {t("common.back")}
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
    value: string | undefined
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