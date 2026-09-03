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

/** Loads and caches the Travel lesson index. */
async function loadTravelIndex(): Promise<TravelLessonIndex[]> {
    if (travelDataCache.index) {
        return travelDataCache.index;
    }

    try {
        const response = await fetch("./data/travel/lessons.json", { cache: "no-store" });
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
        }

        const lessons = await response.json() as unknown;
        travelDataCache.index = Array.isArray(lessons)
            ? lessons as TravelLessonIndex[]
            : [];
        return travelDataCache.index;
    } catch (error) {
        console.error("Error loading travel index:", error);
        return [];
    }
}

/** Loads and caches one Travel lesson by its canonical index id. */
async function loadTravelLesson(lessonId: string): Promise<TravelLesson | null> {
    const cached = travelDataCache.lessons[lessonId];
    if (cached) {
        return cached;
    }

    const lesson = await loadSpecificLesson<TravelLesson>("travel", lessonId);
    if (!lesson) {
        return null;
    }

    if (lesson.id !== lessonId) {
        console.warn(`Travel lesson id mismatch: ${lessonId} / ${lesson.id}`);
    }

    travelDataCache.lessons[lessonId] = lesson;
    return lesson;
}

/** Normalizes supported Travel section containers to a single array. */
function getTravelSections(lesson: TravelLesson | null | undefined): TravelSection[] {
    if (!lesson) return [];
    if (Array.isArray(lesson.miniLessons)) return lesson.miniLessons;
    if (Array.isArray(lesson.sections)) return lesson.sections;
    return [];
}

/** Returns the icon associated with a Travel section type. */
function getTravelSectionIcon(section: TravelSection): string {
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

/** Returns the most useful content count for a Travel section. */
function getTravelSectionCount(section: TravelSection): number {
    switch (section.type) {
        case "vocab":
            return section.words.length;
        case "tips":
            return section.tips.length;
        case "lesson":
            return section.examples?.length ?? 0;
        case "exercise":
            return section.questions.length;
    }
}

/** Returns the localized display label for a Travel section type. */
function getTravelSectionLabel(section: TravelSection, lang: Language): string {
    const labels: Record<TravelSection["type"], Record<Language, string>> = {
        vocab: { fr: "Vocabulaire", fa: "واژگان" },
        tips: { fr: "Conseils", fa: "نکته" },
        lesson: { fr: "Leçon", fa: "درسنامه" },
        exercise: { fr: "Exercice", fa: "تمرین" }
    };

    return labels[section.type][lang];
}
