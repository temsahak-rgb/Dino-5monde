import {
    getStaticDataUrl
} from "../../core/staticData.js";

import type {
    TravelLesson,
    TravelLessonIndex,
    TravelSection
} from "../../types/global.js";

export {
    getTravelSections,
    loadTravelIndex,
    loadTravelLesson
};

/**
 * Travel lesson loading, caching, and section metadata helpers.
 *
 * Travel is now independent from the historical pathEngine. Static resources
 * are resolved from the application root so nested React routes such as:
 *
 * /travel/TRAVEL-001
 *
 * never affect data loading.
 */

interface TravelDataCache {
    index:
        TravelLessonIndex[]
        | null;

    lessons:
        Record<
            string,
            TravelLesson
        >;
}

const travelDataCache:
    TravelDataCache = {
        index:
            null,

        lessons:
            {}
    };

/* -------------------------------------------------------------------------- */
/* Catalog                                                                     */
/* -------------------------------------------------------------------------- */

/**
 * Loads and caches the Travel lesson index.
 *
 * Corpus location:
 *
 * data/travel/lessons.json
 *
 * @returns Travel lesson index.
 */
async function loadTravelIndex():
    Promise<TravelLessonIndex[]> {
    if (
        travelDataCache.index
        !== null
    ) {
        return (
            travelDataCache.index
        );
    }

    try {
        const response =
            await fetch(
                getStaticDataUrl(
                    "data/travel/lessons.json"
                ),
                {
                    cache:
                        "no-store"
                }
            );

        if (!response.ok) {
            throw new Error(
                `HTTP ${response.status}`
            );
        }

        const data =
            (
                await response.json()
            ) as unknown;

        const lessons =
            Array.isArray(
                data
            )
                ? data as TravelLessonIndex[]
                : [];

        travelDataCache.index =
            lessons;

        return lessons;
    } catch (error) {
        console.error(
            "Error loading Travel index:",
            error
        );

        return [];
    }
}

/* -------------------------------------------------------------------------- */
/* Lesson                                                                      */
/* -------------------------------------------------------------------------- */

/**
 * Loads and caches one Travel lesson by its canonical index identifier.
 *
 * Corpus location:
 *
 * data/travel/lessons/{lessonId}.json
 *
 * @param lessonId - Canonical Travel lesson identifier.
 * @returns Loaded Travel lesson, or null when unavailable.
 */
async function loadTravelLesson(
    lessonId: string
): Promise<TravelLesson | null> {
    const normalizedLessonId =
        lessonId.trim();

    if (!normalizedLessonId) {
        return null;
    }

    const cached =
        travelDataCache.lessons[
            normalizedLessonId
        ];

    if (cached) {
        return cached;
    }

    try {
        const response =
            await fetch(
                getStaticDataUrl(
                    `data/travel/lessons/${encodeURIComponent(
                        normalizedLessonId
                    )}.json`
                )
            );

        if (!response.ok) {
            throw new Error(
                `HTTP ${response.status}`
            );
        }

        const lesson =
            (
                await response.json()
            ) as TravelLesson;

        if (
            lesson.id
            !== normalizedLessonId
        ) {
            console.warn(
                "Travel lesson id mismatch:",
                normalizedLessonId,
                lesson.id
            );
        }

        travelDataCache.lessons[
            normalizedLessonId
        ] = lesson;

        console.log(
            `Travel lesson loaded: ${normalizedLessonId}`
        );

        return lesson;
    } catch (error) {
        console.error(
            `Failed to load Travel lesson: ${normalizedLessonId}`,
            error
        );

        return null;
    }
}

/* -------------------------------------------------------------------------- */
/* Sections                                                                    */
/* -------------------------------------------------------------------------- */

/**
 * Normalizes supported Travel section containers to a single array.
 *
 * Historical Travel data exists in two compatible shapes:
 *
 * {
 *     miniLessons: [...]
 * }
 *
 * and:
 *
 * {
 *     sections: [...]
 * }
 *
 * Consumers must use this function rather than depending directly on either
 * corpus representation.
 *
 * `miniLessons` keeps priority to preserve the historical behavior.
 *
 * @param lesson - Travel lesson.
 * @returns Normalized Travel sections.
 */
function getTravelSections(
    lesson:
        TravelLesson
        | null
        | undefined
): TravelSection[] {
    if (!lesson) {
        return [];
    }

    if (
        Array.isArray(
            lesson.miniLessons
        )
    ) {
        return (
            lesson.miniLessons
        );
    }

    if (
        Array.isArray(
            lesson.sections
        )
    ) {
        return (
            lesson.sections
        );
    }

    return [];
}