import {
    getSection,
    loadLessonWithExercises
} from "../../core/lessonEngine.js";
import {
    getLessonProgress,
    markSectionCompleted
} from "../../core/progressEngine.js";
import {
    getGrammar,
    getLessonStatus,
    getRecommendedGrammar,
    getStatusIcon,
    isBookmarked,
    loadGrammar,
    setLessonStatus,
    toggleBookmark
} from "./grammarEngine.js";
import {
    getGrammarLevelFromLessonId,
    getGrammarLevels
} from "./grammarLevels.js";
import { t } from "../../i18n/i18n.js";
import { showExerciseContent } from "../exercises/exercises.js";
import type {
    GrammarLessonIndex,
    LessonContentSection,
    LessonData,
    Level
} from "../../types/global.js";
import {
    app,
    getRequiredElement,
    queryElements
} from "../../ui/ui.js";
import {
    type GrammarCatalogCardViewModel,
    renderGrammarCatalogView,
    renderGrammarPageView,
    renderGrammarLessonContentView,
    renderGrammarLessonNotFoundView,
    renderGrammarLessonView,
    renderGrammarLoadingView
} from "../../ui/views/grammarView.js";

export {
    showGrammarLesson,
    showGrammarPage,
    showLessonContent
};

/**
 * Grammar feature controller.
 *
 * This file owns grammar data loading, navigation, progress state and browser
 * event orchestration.
 *
 * HTML rendering is delegated to `src/ui/views/grammarView.ts`.
 */

/**
 * Displays the Grammar CEFR-level selector.
 */
async function showGrammarPage(): Promise<void> {
    app.innerHTML =
        renderGrammarPageView(
            getGrammarLevels()
        );

    queryElements<HTMLButtonElement>(
        ".grammar-level-card"
    ).forEach(
        button => {
            button.onclick = () => {
                const level =
                    parseGrammarLevel(
                        button.dataset.level
                    );

                if (!level) {
                    return;
                }

                void showGrammarLevel(
                    level
                );
            };
        }
    );
}

/** Displays the grammar catalog for one selected CEFR level. */
async function showGrammarLevel(
    level: Level
): Promise<void> {

    app.innerHTML =
        renderGrammarLoadingView();

    await loadGrammar(level);

    const allLessons =
        getGrammar(level);

    const recommended =
        getRecommendedGrammar(level);

    const allLessonCards =
        createGrammarCatalogCards(
            allLessons
        );

    const recommendedCards =
        recommended.map(
            lesson => ({
                lesson,
                statusIcon: "🦖"
            })
        );

    app.innerHTML =
        renderGrammarCatalogView(
            level,
            allLessonCards,
            recommendedCards
        );

    getRequiredElement<HTMLButtonElement>(
        "grammar-level-back"
    ).onclick = () => {
        void showGrammarPage();
    };

    bindGrammarCatalogEvents();
}

/**
 * Prepares persisted lesson state for the presentation layer.
 */
function createGrammarCatalogCards(
    lessons: GrammarLessonIndex[]
): GrammarCatalogCardViewModel[] {
    return lessons.map(
        lesson => ({
            lesson,
            statusIcon: getStatusIcon(
                getLessonStatus(
                    lesson.id
                )
            )
        })
    );
}

/**
 * Binds navigation events to grammar lesson cards.
 *
 * Lesson identifiers are provided by the view through `data-lesson-id`.
 */
function bindGrammarCatalogEvents(): void {
    const lessonCards =
        queryElements<HTMLButtonElement>(
            ".grammar-lesson-card"
        );

    lessonCards.forEach(card => {
        card.onclick = () => {
            const lessonId =
                card.dataset.lessonId;

            if (!lessonId) {
                return;
            }

            void showGrammarLesson(
                lessonId
            );
        };
    });
}

/**
 * Loads and displays one grammar lesson.
 *
 * @param lessonId - Grammar lesson identifier.
 */
async function showGrammarLesson(
    lessonId: string
): Promise<void> {
    const level =
        getGrammarLevelFromLessonId(
            lessonId
        );

    if (!level) {
        app.innerHTML =
            renderGrammarLessonNotFoundView();

        getRequiredElement<HTMLButtonElement>(
            "grammar-error-back"
        ).onclick = () => {
            void showGrammarPage();
        };

        return;
    }

    let lesson: LessonData;

    try {
        const response = await fetch(
            `./data/lessons/${level}/${lessonId}.json`
        );

        if (!response.ok) {
            throw new Error(
                `HTTP ${response.status}`
            );
        }

        lesson = (await response.json()) as LessonData;
    } catch {
        app.innerHTML =
            renderGrammarLessonNotFoundView();

        getRequiredElement<HTMLButtonElement>(
            "grammar-error-back"
        ).onclick = () => {
            void showGrammarLevel(
                level
            );
        };

        return;
    }

    const status =
        getLessonStatus(lessonId);

    const bookmarked =
        isBookmarked(lessonId);

    const progress =
        getLessonProgress(lessonId);

    if (status === "not_started") {
        setLessonStatus(
            lessonId,
            "in_progress"
        );
    }

    app.innerHTML =
        renderGrammarLessonView(
            lesson,
            lessonId,
            level,
            bookmarked,
            progress
        );

    bindGrammarLessonEvents(
        lessonId,
        level
    );
}

/**
 * Binds navigation, bookmark and section events for a rendered grammar lesson.
 *
 * @param lessonId - Currently displayed lesson identifier.
 */
function bindGrammarLessonEvents(
    lessonId: string,
    level: Level
): void {
    getRequiredElement<HTMLButtonElement>(
        "back"
    ).onclick = () => {
        void showGrammarLevel(
            level
        );
    };

    const bookmarkButton =
        getRequiredElement<HTMLButtonElement>(
            "bookmark-btn"
        );

    bookmarkButton.onclick = () => {
        bookmarkButton.textContent =
            toggleBookmark(lessonId)
                ? "⭐"
                : "☆";
    };

    const sectionCards =
        queryElements<HTMLButtonElement>(
            ".grammar-section-card"
        );

    sectionCards.forEach(card => {
        card.onclick = () => {
            const sectionId =
                card.dataset.sectionId;

            const parentLessonId =
                card.dataset.lessonId
                || lessonId;

            if (!sectionId) {
                return;
            }

            void showLessonSection(
                parentLessonId,
                sectionId
            );
        };
    });
}

/**
 * Loads one grammar section and delegates it to the appropriate controller.
 *
 * @param lessonId - Parent grammar lesson identifier.
 * @param sectionId - Section identifier.
 */
async function showLessonSection(
    lessonId: string,
    sectionId: string
): Promise<void> {
    const level =
        getGrammarLevelFromLessonId(
            lessonId
        );

    if (!level) {
        alert(
            t("grammar.lessonNotFound")
        );

        return;
    }

    const lessonData =
        await loadLessonWithExercises(
            level,
            lessonId
        );

    const section =
        getSection(
            lessonData,
            sectionId
        );

    if (!section) {
        alert(
            t("grammar.sectionNotFound")
        );

        return;
    }

    if (section.type === "lesson") {
        showLessonContent(
            lessonId,
            section
        );

        return;
    }

    showExerciseContent(
        lessonId,
        section,
        () =>
            showGrammarLesson(
                lessonId
            )
    );
}

/** Validates a CEFR level received from a Grammar level card. */
function parseGrammarLevel(
    value: string | undefined
): Level | null {
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

/**
 * Displays one instructional grammar section.
 *
 * @param lessonId - Parent grammar lesson identifier.
 * @param section - Instructional lesson section.
 */
function showLessonContent(
    lessonId: string,
    section: LessonContentSection
): void {
    app.innerHTML =
        renderGrammarLessonContentView(
            section
        );

    getRequiredElement<HTMLButtonElement>(
        "back"
    ).onclick = () => {
        void showGrammarLesson(
            lessonId
        );
    };

    getRequiredElement<HTMLButtonElement>(
        "complete-btn"
    ).onclick = () => {
        markSectionCompleted(
            lessonId,
            section.id
        );

        void showGrammarLesson(
            lessonId
        );
    };
}
