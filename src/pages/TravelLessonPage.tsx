import {
    useEffect,
    useState
} from "react";

import {
    useParams
} from "react-router";

import {
    TravelLesson
} from "../features/travel/TravelLesson.js";

import {
    loadTravelLesson
} from "../features/travel/travelEngine.js";

import {
    useI18n
} from "../i18n/I18nProvider.js";

import type {
    TravelLesson as TravelLessonData
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
 * Durable Travel lesson route:
 *
 * /travel/:lessonId
 *
 * This page owns route validation and asynchronous lesson loading.
 * Section navigation and interaction remain local to TravelLesson.
 */
function TravelLessonPage() {
    const {
        lessonId:
            lessonIdParameter
    } = useParams();

    const {
        t
    } = useI18n();

    const lessonId =
        normalizeTravelLessonId(
            lessonIdParameter
        );

    const [
        lesson,
        setLesson
    ] =
        useState<
            TravelLessonData
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
        retryCount,
        setRetryCount
    ] =
        useState(
            0
        );

    useEffect(
        () => {
            /*
             * Keep the validated route identifier in a local constant so
             * TypeScript preserves its non-null type inside the async closure.
             */
            const routeLessonId =
                lessonId;

            if (!routeLessonId) {
                setLesson(
                    null
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

                setLesson(
                    null
                );

                const loadedLesson =
                    await loadTravelLesson(
                        routeLessonId
                    );

                if (!active) {
                    return;
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
                active =
                    false;
            };
        },
        [
            lessonId,
            retryCount
        ]
    );

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
        !lessonId
        || !lesson
    ) {
        return (
            <Page>
                <BackButton
                    fallback="/travel"
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
                            "travel.lessonNotFound"
                        )
                    }
                    description={
                        lessonId
                        ?? ""
                    }
                    action={
                        lessonId ? (
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
                        ) : undefined
                    }
                />
            </Page>
        );
    }

    return (
        <Page>
            <TravelLesson
                key={
                    lessonId
                }
                lessonId={
                    lessonId
                }
                lesson={
                    lesson
                }
            />
        </Page>
    );
}

/**
 * Safely resolves a lesson id received from React Router.
 *
 * Invalid percent-encoded route values are rejected rather than bubbling a
 * URIError into the application.
 */
function normalizeTravelLessonId(
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
    TravelLessonPage,
    normalizeTravelLessonId
};