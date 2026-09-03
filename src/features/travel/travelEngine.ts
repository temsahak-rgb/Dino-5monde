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

        const lessons =
            await response.json()
                as unknown;

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

/**
 * Returns the icon associated with a Travel section type.
 *
 * @param section - Travel section.
 * @returns Section icon.
 */
function getTravelSectionIcon(
    section: TravelSection
): string {
    switch (section.type) {
        case "vocab":
            return "📖";

        case "tips":
            return "💡";

        case "lesson":
            return "📚";

        case "exercise":
            return "✏️";
    }
}

/**
 * Returns the most useful content count for a Travel section.
 *
 * @param section - Travel section.
 * @returns Number of primary content items.
 */
function getTravelSectionCount(
    section: TravelSection
): number {
    switch (section.type) {
        case "vocab":
            return section.words.length;

        case "tips":
            return section.tips.length;

        case "lesson":
            return (
                section.examples
                    ?.length
                ?? 0
            );

        case "exercise":
            return section.questions.length;
    }
}

/**
 * Returns the localized display label associated with a Travel section type.
 *
 * The optional language argument is retained temporarily for compatibility
 * with older callers. Translation now comes exclusively from the central
 * i18n runtime.
 *
 * New view code should normally use `getTravelSectionTypeLabelView()`.
 *
 * @param section - Travel section.
 * @param _lang - Deprecated compatibility parameter.
 * @returns Localized section label.
 */
function getTravelSectionLabel(
    section: TravelSection,
    _lang?: Language
): string {
    switch (section.type) {
        case "vocab":
            return t(
                "travel.type.vocab"
            );

        case "tips":
            return t(
                "travel.type.tips"
            );

        case "lesson":
            return t(
                "travel.type.lesson"
            );

        case "exercise":
            return t(
                "travel.type.exercise"
            );
    }
}