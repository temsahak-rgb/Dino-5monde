/**
 * Daily-path controllers and shared exercise orchestration.
 *
 * HTML rendering is delegated to `src/ui/views/pathsView.ts`.
 */

/**
 * Displays the Daily French landing page.
 */
async function showDailyHome(): Promise<void> {
    app.innerHTML = renderDailyHomeView();
}

/**
 * Loads and displays the first instructional section of a Daily lesson.
 *
 * @param lessonId - Daily lesson identifier.
 */
async function showDailyLesson(
    lessonId: string
): Promise<void> {
    app.innerHTML = renderDailyLessonLoadingView();

    const lessonData =
        await loadSpecificLesson<LessonData>(
            "daily",
            lessonId
        );

    if (!lessonData) {
        app.innerHTML =
            renderDailyLessonUnavailableView();

        getRequiredElement<HTMLButtonElement>(
            "daily-return-btn"
        ).onclick = () => {
            void showHome();
        };

        return;
    }

    const firstLessonSection =
        lessonData.sections.find(
            (
                section
            ): section is LessonContentSection =>
                section.type === "lesson"
        );

    if (firstLessonSection) {
        showLessonContent(
            lessonId,
            firstLessonSection
        );
    }
}

/**
 * Displays an exercise section and manages question-by-question interaction.
 *
 * Presentation is delegated to the shared exercise view while this controller
 * owns mutable exercise state, answer validation and progress persistence.
 *
 * @param lessonId - Parent lesson identifier.
 * @param section - Exercise or quiz section to render.
 * @param onBack - Optional callback used by non-grammar flows.
 */
function showExerciseContent(
    lessonId: string,
    section: ExerciseSectionInput,
    onBack: BackHandler | null = null
): void {
    const questions = getRandomQuestions(
        section,
        section.displayCount ?? null
    );

    const goBack: BackHandler =
        onBack
        || (() => showGrammarLesson(lessonId));

    let currentQuestionIndex = 0;
    let correctCount = 0;

    /**
     * Renders and wires the active question.
     */
    function showCurrentQuestion(): void {
        if (
            currentQuestionIndex
            >= questions.length
        ) {
            showExerciseResult(
                lessonId,
                section,
                correctCount,
                questions.length,
                goBack
            );

            return;
        }

        const question = prepareQuestion(
            questions[currentQuestionIndex]
        );

        app.innerHTML =
            renderExerciseQuestionView(
                section,
                question,
                currentQuestionIndex,
                questions.length
            );

        getRequiredElement<HTMLButtonElement>(
            "back"
        ).onclick = () => {
            void goBack();
        };

        /*
         * The current interactive UI supports choice questions only.
         * Other question contracts are rendered with an explanatory fallback.
         */
        if (
            question.type !== "mcq"
            && question.type !== "binary"
        ) {
            return;
        }

        const optionButtons =
            queryElements<HTMLButtonElement>(
                ".option-btn"
            );

        optionButtons.forEach(button => {
            button.onclick = () => {
                const selectedIndex =
                    Number.parseInt(
                        button.dataset.index ?? "-1",
                        10
                    );

                const correct = checkAnswer(
                    question,
                    selectedIndex
                );

                if (correct) {
                    correctCount++;
                } else {
                    saveMistake(
                        lessonId,
                        section.id,
                        currentQuestionIndex,
                        selectedIndex,
                        question.correct
                    );
                }

                applyExerciseAnswerStyles(
                    optionButtons,
                    button,
                    question.correct,
                    correct
                );

                disableExerciseOptions(
                    optionButtons
                );

                const feedback =
                    getRequiredElement<HTMLElement>(
                        "feedback"
                    );

                feedback.innerHTML =
                    renderExerciseFeedbackView(
                        correct,
                        question
                    );

                getRequiredElement<HTMLButtonElement>(
                    "next-btn"
                ).onclick = () => {
                    currentQuestionIndex++;
                    showCurrentQuestion();
                };
            };
        });
    }

    showCurrentQuestion();
}

/**
 * Applies visual answer state to the selected and correct options.
 *
 * DOM styling remains controller-side for now because it represents transient
 * interaction state rather than initial page structure.
 *
 * @param optionButtons - All rendered choice buttons.
 * @param selectedButton - Button selected by the learner.
 * @param correctIndex - Index of the correct answer.
 * @param correct - Whether the selected answer is correct.
 */
function applyExerciseAnswerStyles(
    optionButtons: NodeListOf<HTMLButtonElement>,
    selectedButton: HTMLButtonElement,
    correctIndex: number,
    correct: boolean
): void {
    if (correct) {
        selectedButton.style.background =
            "#d4edda";

        selectedButton.style.borderColor =
            "#28a745";

        selectedButton.style.color =
            "#155724";

        return;
    }

    selectedButton.style.background =
        "#f8d7da";

    selectedButton.style.borderColor =
        "#dc3545";

    selectedButton.style.color =
        "#721c24";

    const correctButton =
        optionButtons[correctIndex];

    if (!correctButton) {
        return;
    }

    correctButton.style.background =
        "#d4edda";

    correctButton.style.borderColor =
        "#28a745";

    correctButton.style.color =
        "#155724";
}

/**
 * Prevents additional answers after the learner has selected an option.
 *
 * @param optionButtons - Choice buttons rendered for the active question.
 */
function disableExerciseOptions(
    optionButtons: NodeListOf<HTMLButtonElement>
): void {
    optionButtons.forEach(button => {
        button.onclick = null;
        button.style.cursor = "default";
    });
}

/**
 * Displays the final score of an exercise section.
 *
 * @param lessonId - Parent lesson identifier.
 * @param section - Completed exercise section.
 * @param correctCount - Number of correct answers.
 * @param totalCount - Number of questions presented.
 * @param onBack - Optional return callback.
 */
function showExerciseResult(
    lessonId: string,
    section: ExerciseSectionInput,
    correctCount: number,
    totalCount: number,
    onBack: BackHandler | null = null
): void {
    const goBack: BackHandler =
        onBack
        || (() => showGrammarLesson(lessonId));

    markSectionCompleted(
        lessonId,
        section.id
    );

    app.innerHTML =
        renderExerciseResultView(
            correctCount,
            totalCount
        );

    getRequiredElement<HTMLButtonElement>(
        "exercise-return-btn"
    ).onclick = () => {
        void goBack();
    };
}