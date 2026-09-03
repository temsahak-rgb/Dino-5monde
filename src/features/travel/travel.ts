import { markSectionCompleted } from "../../core/progressEngine.js";
import {
    getTravelSections,
    loadTravelIndex,
    loadTravelLesson
} from "./travelEngine.js";
import { showExerciseContent } from "../exercises/exercises.js";
import type { TravelLesson } from "../../types/global.js";
import {
    app,
    getRequiredElement,
    queryElements
} from "../../ui/ui.js";
import {
    renderTravelCatalogView,
    renderTravelLessonLoadingView,
    renderTravelLessonNotFoundView,
    renderTravelLessonView,
    renderTravelMiniLessonView
} from "../../ui/views/travelView.js";

export {
    showTravelPage
};

/**
 * Travel feature controller.
 *
 * This file owns:
 * - Travel lesson loading
 * - navigation
 * - active lesson state
 * - section selection
 * - exercise delegation
 * - completion persistence
 *
 * All HTML rendering is delegated to `src/ui/views/travelView.ts`.
 */

let currentTravelLesson:
    TravelLesson | undefined;
let currentTravelLessonId:
    string | undefined;

/**
 * Displays the complete Travel lesson catalog.
 */
async function showTravelPage(): Promise<void> {
    const lessons =
        await loadTravelIndex();

    app.innerHTML =
        renderTravelCatalogView(
            lessons
        );

    bindTravelCatalogEvents();
}

/**
 * Binds navigation events to Travel lesson cards.
 */
function bindTravelCatalogEvents(): void {
    const lessonCards =
        queryElements<HTMLButtonElement>(
            ".travel-lesson-card"
        );

    lessonCards.forEach(card => {
        card.onclick = () => {
            const lessonId =
                card.dataset.lessonId;

            if (!lessonId) {
                return;
            }

            void showTravelLesson(
                lessonId
            );
        };
    });
}

/**
 * Displays one Travel lesson and its section cards.
 *
 * @param lessonId - Canonical Travel lesson identifier.
 */
async function showTravelLesson(
    lessonId: string
): Promise<void> {
    app.innerHTML =
        renderTravelLessonLoadingView();

    const lesson =
        await loadTravelLesson(
            lessonId
        );

    if (!lesson) {
        app.innerHTML =
            renderTravelLessonNotFoundView();

        getRequiredElement<HTMLButtonElement>(
            "travel-error-back"
        ).onclick = () => {
            void showTravelPage();
        };

        return;
    }

    const sections =
        getTravelSections(
            lesson
        );

    currentTravelLesson =
        lesson;

    currentTravelLessonId =
        lessonId;

    app.innerHTML =
        renderTravelLessonView(
            lesson,
            lessonId,
            sections
        );

    bindTravelLessonEvents(
        lessonId
    );
}

/**
 * Binds navigation events for a rendered Travel lesson.
 *
 * @param lessonId - Currently displayed lesson identifier.
 */
function bindTravelLessonEvents(
    lessonId: string
): void {
    getRequiredElement<HTMLButtonElement>(
        "travel-back"
    ).onclick = () => {
        void showTravelPage();
    };

    const sectionCards =
        queryElements<HTMLButtonElement>(
            ".travel-section-card"
        );

    sectionCards.forEach(card => {
        card.onclick = () => {
            const cardLessonId =
                card.dataset.lessonId
                || lessonId;

            const rawIndex =
                card.dataset.sectionIndex;

            if (rawIndex === undefined) {
                return;
            }

            const sectionIndex =
                Number.parseInt(
                    rawIndex,
                    10
                );

            if (
                !Number.isInteger(
                    sectionIndex
                )
            ) {
                return;
            }

            showMiniLesson(
                cardLessonId,
                sectionIndex
            );
        };
    });
}

/**
 * Opens one Travel section.
 *
 * Exercise sections are delegated to the shared exercise controller. Other
 * section types are rendered inside the current Travel lesson page.
 *
 * @param lessonId - Parent Travel lesson identifier.
 * @param sectionIndex - Section index inside the active lesson.
 */
function showMiniLesson(
    lessonId: string,
    sectionIndex: number
): void {
    const lesson =
        currentTravelLesson;

    if (
        !lesson
        || currentTravelLessonId
            !== lessonId
    ) {
        void showTravelLesson(
            lessonId
        );

        return;
    }

    const sections =
        getTravelSections(
            lesson
        );

    const section =
        sections[sectionIndex];

    if (!section) {
        console.error(
            "Travel section not found:",
            lessonId,
            sectionIndex
        );

        return;
    }

    if (
        section.type
        === "exercise"
    ) {
        showExerciseContent(
            lessonId,
            section,
            () =>
                showTravelLesson(
                    lessonId
                )
        );

        return;
    }

    const container =
        getRequiredElement<HTMLElement>(
            "mini-lesson-content"
        );

    container.innerHTML =
        renderTravelMiniLessonView(
            section
        );

    getRequiredElement<HTMLButtonElement>(
        "travel-complete-btn"
    ).onclick = () => {
        markTravelMiniLessonCompleted(
            lessonId,
            section.id
        );
    };

    container.scrollIntoView({
        behavior: "smooth",
        block: "start"
    });
}

/**
 * Persists Travel section completion and returns to the lesson overview.
 *
 * @param lessonId - Parent Travel lesson identifier.
 * @param sectionId - Completed Travel section identifier.
 */
function markTravelMiniLessonCompleted(
    lessonId: string,
    sectionId: string
): void {
    markSectionCompleted(
        lessonId,
        sectionId
    );

    void showTravelLesson(
        lessonId
    );
}
