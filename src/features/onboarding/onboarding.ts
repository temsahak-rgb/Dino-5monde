/**
 * Onboarding and placement-test controller.
 *
 * This file owns:
 * - interface-language selection
 * - learning-path selection
 * - placement-test orchestration
 * - placement answer interaction
 * - CEFR result persistence
 *
 * All HTML generation is delegated to
 * `src/ui/views/onboardingView.ts`.
 */

/**
 * Displays the interface-language selection page.
 */
function showLanguage(): void {
    app.innerHTML =
        renderLanguageSelectionView();

    getRequiredElement<HTMLButtonElement>(
        "fr"
    ).onclick = () => {
        selectInterfaceLanguage(
            "fr"
        );
    };

    getRequiredElement<HTMLButtonElement>(
        "fa"
    ).onclick = () => {
        selectInterfaceLanguage(
            "fa"
        );
    };
}

/**
 * Applies the selected interface language and continues onboarding.
 *
 * `setI18nLanguage()` synchronizes localStorage, the HTML `lang` attribute,
 * writing direction and document title.
 *
 * @param language - Selected interface language.
 */
function selectInterfaceLanguage(
    language: Language
): void {
    setI18nLanguage(
        language
    );

    showPath();
}

/**
 * Displays the learning-path selection page.
 */
function showPath(): void {
    app.innerHTML =
        renderPathSelectionView();

    getRequiredElement<HTMLButtonElement>(
        "back"
    ).onclick = () => {
        showLanguage();
    };

    getRequiredElement<HTMLButtonElement>(
        "general"
    ).onclick = () => {
        showPlacementChoice();
    };

    getRequiredElement<HTMLButtonElement>(
        "travel"
    ).onclick = () => {
        selectLearningPath(
            "travel"
        );
    };

    getRequiredElement<HTMLButtonElement>(
        "daily"
    ).onclick = () => {
        selectLearningPath(
            "daily"
        );
    };
}

/**
 * Persists a non-general learning path and opens the application Home page.
 *
 * The General path preserves the historical onboarding behavior and continues
 * through the placement flow instead.
 *
 * @param path - Learning path identifier.
 */
function selectLearningPath(
    path: PathId
): void {
    localStorage.setItem(
        "currentPath",
        path
    );

    void showHome();
}

/**
 * Asks whether the learner wants to run the adaptive placement test.
 */
function showPlacementChoice(): void {
    app.innerHTML =
        renderPlacementChoiceView();

    getRequiredElement<HTMLButtonElement>(
        "back"
    ).onclick = () => {
        showPath();
    };

    getRequiredElement<HTMLButtonElement>(
        "later"
    ).onclick = () => {
        void showHome();
    };

    getRequiredElement<HTMLButtonElement>(
        "yes"
    ).onclick = () => {
        resetPlacementState();
        showQuestion();
    };
}

/**
 * Displays and wires the current adaptive placement question.
 *
 * When the placement engine reports that no further question is required,
 * the final estimated CEFR result is displayed.
 */
function showQuestion(): void {
    const question =
        getNextQuestion();

    if (!question) {
        showFinalResult();
        return;
    }

    const progressPercent =
        (
            getPlacementState()
                .asked
                .length
            / 15
        ) * 100;

    app.innerHTML =
        renderPlacementQuestionView(
            question,
            progressPercent
        );

    bindPlacementQuestionEvents(
        question
    );
}

/**
 * Binds answer interactions for one placement question.
 *
 * @param question - Currently displayed placement question.
 */
function bindPlacementQuestionEvents(
    question: PlacementQuestion
): void {
    const optionButtons =
        queryElements<HTMLButtonElement>(
            ".option-btn"
        );

    const dontKnowButton =
        getRequiredElement<HTMLButtonElement>(
            "dont-know"
        );

    optionButtons.forEach(button => {
        button.onclick = () => {
            const selectedIndex =
                Number.parseInt(
                    button.dataset.index
                    ?? "-1",
                    10
                );

            if (
                selectedIndex < 0
                || selectedIndex
                    >= question.options.length
            ) {
                return;
            }

            handlePlacementAnswer(
                question,
                selectedIndex,
                button,
                optionButtons,
                dontKnowButton
            );
        };
    });

    dontKnowButton.onclick = () => {
        handleUnknownPlacementAnswer(
            question,
            optionButtons,
            dontKnowButton
        );
    };
}

/**
 * Handles a concrete placement answer.
 *
 * @param question - Active placement question.
 * @param selectedIndex - Selected answer index.
 * @param selectedButton - Selected option button.
 * @param optionButtons - All answer buttons.
 * @param dontKnowButton - "I don't know" button.
 */
function handlePlacementAnswer(
    question: PlacementQuestion,
    selectedIndex: number,
    selectedButton: HTMLButtonElement,
    optionButtons: NodeListOf<HTMLButtonElement>,
    dontKnowButton: HTMLButtonElement
): void {
    const correct =
        selectedIndex
        === question.correctIndex;

    answerPlacement(
        correct
    );

    applyPlacementAnswerStyles(
        selectedButton,
        optionButtons,
        question.correctIndex,
        correct
    );

    disablePlacementQuestionControls(
        optionButtons,
        dontKnowButton
    );

    scheduleNextPlacementQuestion();
}

/**
 * Handles the learner choosing "I don't know".
 *
 * The placement engine treats this as an unsuccessful answer while the UI
 * highlights the expected answer for learning feedback.
 *
 * @param question - Active placement question.
 * @param optionButtons - All answer buttons.
 * @param dontKnowButton - "I don't know" button.
 */
function handleUnknownPlacementAnswer(
    question: PlacementQuestion,
    optionButtons: NodeListOf<HTMLButtonElement>,
    dontKnowButton: HTMLButtonElement
): void {
    answerPlacement(
        null
    );

    dontKnowButton.style.backgroundColor =
        "#f8d7da";

    dontKnowButton.style.color =
        "#721c24";

    const correctButton =
        optionButtons[
            question.correctIndex
        ];

    if (correctButton) {
        applyPlacementCorrectStyle(
            correctButton
        );
    }

    disablePlacementQuestionControls(
        optionButtons,
        dontKnowButton
    );

    scheduleNextPlacementQuestion();
}

/**
 * Applies feedback styles after a concrete answer.
 *
 * @param selectedButton - Selected answer button.
 * @param optionButtons - All available answer buttons.
 * @param correctIndex - Correct answer index.
 * @param correct - Whether the learner answered correctly.
 */
function applyPlacementAnswerStyles(
    selectedButton: HTMLButtonElement,
    optionButtons: NodeListOf<HTMLButtonElement>,
    correctIndex: number,
    correct: boolean
): void {
    if (correct) {
        applyPlacementCorrectStyle(
            selectedButton
        );

        return;
    }

    applyPlacementIncorrectStyle(
        selectedButton
    );

    const correctButton =
        optionButtons[
            correctIndex
        ];

    if (correctButton) {
        applyPlacementCorrectStyle(
            correctButton
        );
    }
}

/**
 * Applies the visual state of a correct placement answer.
 *
 * @param button - Answer button.
 */
function applyPlacementCorrectStyle(
    button: HTMLButtonElement
): void {
    button.style.background =
        "#d4edda";

    button.style.borderColor =
        "#28a745";

    button.style.color =
        "#155724";
}

/**
 * Applies the visual state of an incorrect placement answer.
 *
 * @param button - Answer button.
 */
function applyPlacementIncorrectStyle(
    button: HTMLButtonElement
): void {
    button.style.background =
        "#f8d7da";

    button.style.borderColor =
        "#dc3545";

    button.style.color =
        "#721c24";
}

/**
 * Disables placement controls once an answer has been submitted.
 *
 * @param optionButtons - Placement option buttons.
 * @param dontKnowButton - "I don't know" button.
 */
function disablePlacementQuestionControls(
    optionButtons: NodeListOf<HTMLButtonElement>,
    dontKnowButton: HTMLButtonElement
): void {
    optionButtons.forEach(button => {
        button.onclick = null;
        button.style.cursor =
            "default";
    });

    dontKnowButton.onclick = null;
    dontKnowButton.style.cursor =
        "default";
}

/**
 * Opens the next placement question after the feedback delay.
 */
function scheduleNextPlacementQuestion(): void {
    window.setTimeout(
        showQuestion,
        1500
    );
}

/**
 * Displays the adaptive placement result.
 */
function showFinalResult(): void {
    const levelInfo =
        getEstimatedLevelRange();

    app.innerHTML =
        renderPlacementResultView(
            levelInfo
        );

    getRequiredElement<HTMLButtonElement>(
        "accept-level"
    ).onclick = () => {
        savePlacementResult(
            levelInfo.level
        );

        void showHome();
    };

    getRequiredElement<HTMLButtonElement>(
        "change-level"
    ).onclick = () => {
        showLevelSelection();
    };
}

/**
 * Displays the manual CEFR level selector.
 *
 * C2 remains excluded here to preserve the historical onboarding behavior.
 */
function showLevelSelection(): void {
    const levels: readonly Level[] = [
        "A1",
        "A2",
        "B1",
        "B2",
        "C1"
    ];

    app.innerHTML =
        renderLevelSelectionView(
            levels
        );

    const levelButtons =
        queryElements<HTMLButtonElement>(
            ".level-btn"
        );

    levelButtons.forEach(button => {
        button.onclick = () => {
            const level =
                button.dataset.level;

            if (
                !isSelectablePlacementLevel(
                    level
                )
            ) {
                return;
            }

            savePlacementResult(
                level
            );

            void showHome();
        };
    });
}

/**
 * Validates a DOM value before using it as a CEFR level.
 *
 * @param level - Raw level value.
 * @returns Whether the value is a supported CEFR level.
 */
function isSelectablePlacementLevel(
    level: string | undefined
): level is Level {
    return (
        level === "A1"
        || level === "A2"
        || level === "B1"
        || level === "B2"
        || level === "C1"
        || level === "C2"
    );
}