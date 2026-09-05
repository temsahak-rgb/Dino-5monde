import {
    useEffect,
    useState
} from "react";

import {
    TravelCatalog
} from "../features/travel/TravelCatalog.js";

import {
    loadTravelIndex
} from "../features/travel/travelEngine.js";

import {
    useI18n
} from "../i18n/I18nProvider.js";

import type {
    TravelLessonIndex
} from "../types/global.js";

import {
    EmptyState,
    LoadingState
} from "../ui/components/Feedback.js";

import {
    Page,
    PageHeader
} from "../ui/components/Layout.js";

/**
 * Travel landing page.
 *
 * Responsibilities:
 *
 * - load the Travel lesson index
 * - expose loading / empty states
 * - delegate lesson-card rendering to TravelCatalog
 *
 * Individual lesson loading and section interaction remain outside this page.
 */
function TravelIndexPage() {
    const {
        t
    } = useI18n();

    const [
        lessons,
        setLessons
    ] =
        useState<TravelLessonIndex[]>(
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
            let active =
                true;

            async function load():
                Promise<void> {
                setLoading(
                    true
                );

                const loadedLessons =
                    await loadTravelIndex();

                if (!active) {
                    return;
                }

                setLessons(
                    loadedLessons
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

    return (
        <Page>
            <PageHeader
                icon="✈️"
                title={
                    t(
                        "travel.catalogTitle",
                        {
                            count:
                                lessons.length
                        }
                    )
                }
            />

            {lessons.length > 0 ? (
                <TravelCatalog
                    lessons={
                        lessons
                    }
                />
            ) : (
                <EmptyState
                    icon="✈️"
                    title={
                        t(
                            "travel.noLessons"
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
            )}
        </Page>
    );
}

export {
    TravelIndexPage
};