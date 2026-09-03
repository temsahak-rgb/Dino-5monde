// ===============================
// ✈️ Travel data engine
// ===============================

const travelDataCache = {
    index: null,
    lessons: {}
};

// ===============================
// Chargement de l'index
// ===============================

async function loadTravelIndex() {
    if (travelDataCache.index) {
        return travelDataCache.index;
    }

    try {
        const response = await fetch(
            "./data/travel/lessons.json",
            { cache: "no-store" }
        );

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
        }

        const lessons = await response.json();

        travelDataCache.index = Array.isArray(lessons)
            ? lessons
            : [];

        return travelDataCache.index;
    } catch (error) {
        console.error(
            "Error loading travel index:",
            error
        );

        return [];
    }
}

// ===============================
// Chargement d'une leçon
// ===============================

async function loadTravelLesson(lessonId) {
    if (travelDataCache.lessons[lessonId]) {
        return travelDataCache.lessons[lessonId];
    }

    const lesson = await loadSpecificLesson(
        "travel",
        lessonId
    );

    if (!lesson) {
        return null;
    }

    // Certains anciens fichiers ont un id interne
    // légèrement différent de celui de lessons.json.
    // L'id de l'index reste la référence.
    if (lesson.id && lesson.id !== lessonId) {
        console.warn(
            `Travel lesson id mismatch: ${lessonId} / ${lesson.id}`
        );
    }

    travelDataCache.lessons[lessonId] = lesson;

    return lesson;
}

// ===============================
// Normalisation des sections
// ===============================

function getTravelSections(lesson) {
    if (!lesson) {
        return [];
    }

    if (Array.isArray(lesson.miniLessons)) {
        return lesson.miniLessons;
    }

    // Compatibilité si les données migrent plus tard
    // vers le format générique "sections".
    if (Array.isArray(lesson.sections)) {
        return lesson.sections;
    }

    return [];
}

// ===============================
// Métadonnées de section
// ===============================

function getTravelSectionIcon(section) {
    switch (section?.type) {
        case "vocab":
            return "📖";

        case "tips":
            return "💡";

        case "lesson":
            return "📚";

        case "exercise":
            return "✏️";

        default:
            return "📝";
    }
}

function getTravelSectionCount(section) {
    switch (section?.type) {
        case "vocab":
            return section.words?.length || 0;

        case "tips":
            return section.tips?.length || 0;

        case "lesson":
            return section.examples?.length || 0;

        case "exercise":
            return section.questions?.length || 0;

        default:
            return 0;
    }
}

function getTravelSectionLabel(section, lang) {
    const labels = {
        vocab: {
            fr: "Vocabulaire",
            fa: "واژگان"
        },
        tips: {
            fr: "Conseils",
            fa: "نکته"
        },
        lesson: {
            fr: "Leçon",
            fa: "درسنامه"
        },
        exercise: {
            fr: "Exercice",
            fa: "تمرین"
        }
    };

    const label = labels[section?.type];

    if (!label) {
        return lang === "fa"
            ? "بخش"
            : "Section";
    }

    return label[lang] || label.fr;
}