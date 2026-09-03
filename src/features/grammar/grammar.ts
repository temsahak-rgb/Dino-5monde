/**
 * Grammar feature controller.
 *
 * This file owns grammar data loading, navigation, progress state and browser
 * event orchestration.
 *
 * HTML rendering is delegated to `src/ui/views/grammarView.ts`.
 */

/**
 * Displays the grammar catalog for the learner's current CEFR level.
 */
async function showGrammarPage(): Promise<void> {
    const level = getPlacementResult() || "A1";

    app.innerHTML =
        renderGrammarLoadingView();

    await loadGrammar(level);

    const allLessons =
        getGrammar(level);

    const recommended =
        getRecommendedGrammar(level);

    app.innerHTML =
        renderGrammarCatalogView(
            level,
            allLessons,
            recommended
        );

    bindGrammarCatalogEvents();
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
        getPlacementResult() || "A1";

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

        lesson =
            await response.json()
                as LessonData;
    } catch {
        app.innerHTML =
            renderGrammarLessonNotFoundView();

        getRequiredElement<HTMLButtonElement>(
            "grammar-error-back"
        ).onclick = () => {
            void showGrammarPage();
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
        lessonId
    );
}

/**
 * Binds navigation, bookmark and section events for a rendered grammar lesson.
 *
 * @param lessonId - Currently displayed lesson identifier.
 */
function bindGrammarLessonEvents(
    lessonId: string
): void {
    getRequiredElement<HTMLButtonElement>(
        "back"
    ).onclick = () => {
        void showGrammarPage();
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
        lessonId.split("-")[0] as Level;

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
        section
    );
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

/**
 * Temporary compatibility wrapper.
 *
 * Some classic browser scripts may still refer to the historical `renderTable`
 * helper while the view-layer migration is in progress.
 *
 * @param table - Lesson table data.
 * @returns Rendered table HTML from the grammar view.
 */
function renderTable(
    table: LessonTable | null | undefined
): string {
    return renderGrammarTableView(
        table
    );
}