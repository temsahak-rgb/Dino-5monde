import { loadSpecificLesson } from "../../core/pathEngine.js";
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
 */

interface TravelDataCache {
    index: TravelLessonIndex[] | null;
    lessons: Record<string, TravelLesson>;
}

const travelDataCache: TravelDataCache = {
    index: null,
    lessons: {}
};

/**
 * Loads and caches the Travel lesson index.
 *
 * @returns Travel lesson index.
 */
async function loadTravelIndex(): Promise<TravelLessonIndex[]> {
    if (travelDataCache.index) {
        return travelDataCache.index;
    }

    try {
        const response = await fetch(
            "./data/travel/lessons.json",
            {
                cache: "no-store"
            }
        );

        if (!response.ok) {
            throw new Error(
                `HTTP ${response.status}`
            );
        }

        const lessons = (await response.json()) as unknown;

        travelDataCache.index =
            Array.isArray(lessons)
                ? lessons as TravelLessonIndex[]
                : [];

        return travelDataCache.index;
    } catch (error) {
        console.error(
            "Error loading Travel index:",
            error
        );

        return [];
    }
}

/**
 * Loads and caches one Travel lesson by its canonical index id.
 *
 * @param lessonId - Canonical Travel lesson identifier.
 * @returns Loaded Travel lesson, or null when unavailable.
 */
async function loadTravelLesson(
    lessonId: string
): Promise<TravelLesson | null> {
    const cached =
        travelDataCache.lessons[
            lessonId
        ];

    if (cached) {
        return cached;
    }

    const lesson =
        await loadSpecificLesson<TravelLesson>(
            "travel",
            lessonId
        );

    if (!lesson) {
        return null;
    }

    if (
        lesson.id !== lessonId
    ) {
        console.warn(
            "Travel lesson id mismatch:",
            lessonId,
            lesson.id
        );
    }

    travelDataCache.lessons[
        lessonId
    ] = lesson;

    return lesson;
}

/**
 * Normalizes supported Travel section containers to a single array.
 *
 * Some Travel data uses `miniLessons`, while other files use `sections`.
 * Consumers should use this helper instead of depending on either storage
 * shape directly.
 *
 * @param lesson - Travel lesson.
 * @returns Normalized Travel sections.
 */
function getTravelSections(
    lesson: TravelLesson | null | undefined
): TravelSection[] {
    if (!lesson) {
        return [];
    }

    if (
        Array.isArray(
            lesson.miniLessons
        )
    ) {
        return lesson.miniLessons;
    }

    if (
        Array.isArray(
            lesson.sections
        )
    ) {
        return lesson.sections;
    }

    return [];
}
