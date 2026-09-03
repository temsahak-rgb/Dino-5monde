import {
    localizedValue,
    t
} from "../../i18n/i18n.js";
import type {
    Level,
    StoryDifficulty,
    VocabExercise,
    VocabExerciseQuestion,
    VocabPack,
    VocabPackIndex,
    VocabStory,
    VocabStoryBlank,
    VocabWeakMap,
    VocabWord
} from "../../types/global.js";
import {
    app,
    getRequiredElement,
    queryElements
} from "../../ui/ui.js";
import {
    getVocabScorePresentation,
    renderBlankVocabStoryView,
    renderFlashcardReviewPromptView,
    renderFlashcardView,
    renderLegacyVocabStoryView,
    renderVocabLevelView,
    renderVocabPackUnavailableView,
    renderVocabPackView,
    renderVocabQuizFeedbackView,
    renderVocabQuizQuestionView,
    renderVocabResultView,
    renderVocabularyPageView
} from "../../ui/views/vocabularyView.js";

export {
    showVocabPack,
    showVocabularyPage
};

/**
 * Vocabulary catalog, flashcards, stories, weak-word review, and quizzes.
 *
 * This file owns:
 * - Vocabulary data loading and caching
 * - weak-word persistence
 * - navigation
 * - flashcard state
 * - story interaction
 * - fill-in-the-blank state
 * - comprehension scoring
 * - Vocabulary quiz state and scoring
 *
 * All HTML generation is delegated to
 * `src/ui/views/vocabularyView.ts`.
 */

interface PreparedVocabQuestion {
    question: string;
    options: string[];
    correct: number;
    explanation: string;
}

const vocabCache:
    Record<
        string,
        VocabPackIndex[] | VocabPack
    > = {};
let currentPack:
    VocabPack | undefined;

/**
 * Returns persisted weak words for a vocabulary pack.
 *
 * @param packId - Vocabulary pack identifier.
 * @returns French words currently marked as weak.
 */
function getWeakWords(
    packId: string
): string[] {
    const weakMap =
        JSON.parse(
            localStorage.getItem(
                "dino_vocab_weak"
            )
            || "{}"
        ) as VocabWeakMap;

    return weakMap[packId]
        ?? [];
}

/**
 * Adds or removes a word from the persisted weak-word list.
 *
 * @param packId - Vocabulary pack identifier.
 * @param frenchWord - Canonical French word.
 * @param weak - Whether the word should remain marked as weak.
 */
function setWeakWord(
    packId: string,
    frenchWord: string,
    weak: boolean
): void {
    const weakMap =
        JSON.parse(
            localStorage.getItem(
                "dino_vocab_weak"
            )
            || "{}"
        ) as VocabWeakMap;

    const current =
        (
            weakMap[packId]
            ?? []
        ).filter(
            word =>
                word !== frenchWord
        );

    weakMap[packId] =
        weak
            ? [
                ...current,
                frenchWord
            ]
            : current;

    localStorage.setItem(
        "dino_vocab_weak",
        JSON.stringify(
            weakMap
        )
    );
}

/**
 * Loads and caches the vocabulary pack index for a CEFR level.
 *
 * @param level - CEFR level.
 * @returns Pack index for the requested level.
 */
async function loadVocabIndex(
    level: Level
): Promise<VocabPackIndex[]> {
    const key =
        `index-${level}`;

    const cached =
        vocabCache[key];

    if (
        Array.isArray(
            cached
        )
    ) {
        return cached;
    }

    try {
        const response =
            await fetch(
                `./data/vocabulary/vocab-${level}.json?v=${Date.now()}`,
                {
                    cache: "no-store"
                }
            );

        if (!response.ok) {
            throw new Error(
                `HTTP ${response.status}`
            );
        }

        const data = (await response.json()) as VocabPackIndex[];

        vocabCache[key] =
            data;

        return data;
    } catch (error) {
        console.warn(
            `Vocabulary index unavailable for ${level}:`,
            error
        );

        return [];
    }
}

/**
 * Loads and caches a complete vocabulary pack.
 *
 * @param level - Parent CEFR level.
 * @param packId - Vocabulary pack identifier.
 * @returns Loaded pack or null when unavailable.
 */
async function loadVocabPack(
    level: Level,
    packId: string
): Promise<VocabPack | null> {
    const key =
        `${level}-${packId}`;

    const cached =
        vocabCache[key];

    if (
        cached
        && !Array.isArray(
            cached
        )
    ) {
        return cached;
    }

    try {
        const response =
            await fetch(
                `./data/vocabulary/${level}/${packId}.json?v=${Date.now()}`,
                {
                    cache: "no-store"
                }
            );

        if (!response.ok) {
            throw new Error(
                `HTTP ${response.status}`
            );
        }

        const data = (await response.json()) as VocabPack;

        data.level =
            level;

        vocabCache[key] =
            data;

        return data;
    } catch (error) {
        console.warn(
            `Vocabulary pack unavailable: ${level}/${packId}`,
            error
        );

        return null;
    }
}

/**
 * Returns the active vocabulary pack or fails fast when navigation state is
 * invalid.
 *
 * @returns Current vocabulary pack.
 */
function getCurrentVocabPack(): VocabPack {
    const pack =
        currentPack;

    if (!pack) {
        throw new Error(
            "No active vocabulary pack is available."
        );
    }

    return pack;
}

/**
 * Displays the Vocabulary level selector.
 */
async function showVocabularyPage(): Promise<void> {
    const levels:
        readonly Level[] = [
            "A1",
            "A2",
            "B1",
            "B2",
            "C1",
            "C2"
        ];

    app.innerHTML =
        renderVocabularyPageView(
            levels
        );

    queryElements<HTMLButtonElement>(
        ".vocab-level-card"
    ).forEach(
        button => {
            button.onclick = () => {
                const level =
                    parseVocabLevel(
                        button.dataset.level
                    );

                if (!level) {
                    return;
                }

                void showVocabLevel(
                    level
                );
            };
        }
    );
}

/**
 * Displays every vocabulary pack available for one CEFR level.
 *
 * @param level - CEFR level.
 */
async function showVocabLevel(
    level: Level
): Promise<void> {
    const packs =
        await loadVocabIndex(
            level
        );

    app.innerHTML =
        renderVocabLevelView(
            level,
            packs
        );

    getRequiredElement<HTMLButtonElement>(
        "vocab-level-back"
    ).onclick = () => {
        void showVocabularyPage();
    };

    queryElements<HTMLButtonElement>(
        ".vocab-pack-card"
    ).forEach(
        button => {
            button.onclick = () => {
                const cardLevel =
                    parseVocabLevel(
                        button.dataset.level
                    );

                const packId =
                    button.dataset.packId;

                if (
                    !cardLevel
                    || !packId
                ) {
                    return;
                }

                void showVocabPack(
                    cardLevel,
                    packId
                );
            };
        }
    );
}

/**
 * Displays one vocabulary pack and its available activities.
 *
 * @param level - Parent CEFR level.
 * @param packId - Pack identifier.
 */
async function showVocabPack(
    level: Level,
    packId: string
): Promise<void> {
    const pack =
        await loadVocabPack(
            level,
            packId
        );

    if (!pack) {
        app.innerHTML =
            renderVocabPackUnavailableView();

        getRequiredElement<HTMLButtonElement>(
            "vocab-unavailable-back"
        ).onclick = () => {
            void showVocabLevel(
                level
            );
        };

        return;
    }

    currentPack =
        pack;

    const weakCount =
        getWeakWords(
            pack.id
        ).length;

    const hasSimple =
        Boolean(
            pack.stories?.simple
            || pack.stories?.easy
        );

    const hasLiterary =
        Boolean(
            pack.stories?.literary
            || pack.stories?.hard
        );

    const hasQuiz =
        Boolean(
            pack.quiz
            || pack.exercise
        );

    app.innerHTML =
        renderVocabPackView(
            pack,
            weakCount,
            hasSimple,
            hasLiterary,
            hasQuiz
        );

    bindVocabPackEvents(
        pack
    );
}

/**
 * Binds navigation and activity selection on a Vocabulary pack page.
 *
 * @param pack - Active vocabulary pack.
 */
function bindVocabPackEvents(
    pack: VocabPack
): void {
    getRequiredElement<HTMLButtonElement>(
        "vocab-pack-back"
    ).onclick = () => {
        void showVocabLevel(
            pack.level
        );
    };

    queryElements<HTMLButtonElement>(
        ".vocab-activity-card"
    ).forEach(
        button => {
            button.onclick = () => {
                const action =
                    button.dataset.action;

                switch (action) {
                    case "flashcards":
                        startFlashcards(
                            button.dataset.reviewMode
                            === "true"
                        );
                        break;

                    case "story": {
                        const difficulty =
                            parseStoryDifficulty(
                                button.dataset.difficulty
                            );

                        if (!difficulty) {
                            return;
                        }

                        startStory(
                            difficulty
                        );
                        break;
                    }

                    case "exercise":
                        startVocabExercise();
                        break;
                }
            };
        }
    );
}

/**
 * Starts the flashcard activity for the active Vocabulary pack.
 *
 * @param reviewMode - Whether only persisted weak words should be used.
 */
function startFlashcards(
    reviewMode = false
): void {
    const pack =
        getCurrentVocabPack();

    const weak =
        getWeakWords(
            pack.id
        );

    const sourceDeck =
        reviewMode
            ? pack.words.filter(
                word =>
                    weak.includes(
                        word.fr
                    )
            )
            : [
                ...pack.words
            ];

    const deck =
        shuffleVocabWords(
            sourceDeck
        );

    if (
        deck.length === 0
    ) {
        alert(
            t("vocab.noWeakWords")
        );

        return;
    }

    let index = 0;
    let knownCount = 0;

    const retry:
        VocabWord[] = [];

    /**
     * Displays the active flashcard.
     */
    function showCurrentCard(): void {
        if (
            index >= deck.length
        ) {
            showFlashcardEnd();
            return;
        }

        const word =
            deck[index];

        app.innerHTML =
            renderFlashcardView(
                pack,
                word,
                index,
                deck.length
            );

        getRequiredElement<HTMLButtonElement>(
            "vocab-flashcard-back"
        ).onclick = () => {
            void showVocabPack(
                pack.level,
                pack.id
            );
        };

        const flashcard =
            getRequiredElement<HTMLElement>(
                "flashcard"
            );

        flashcard.onclick = () => {
            getRequiredElement<HTMLElement>(
                "card-back"
            ).style.display =
                "block";

            getRequiredElement<HTMLElement>(
                "card-hint"
            ).style.display =
                "none";

            getRequiredElement<HTMLElement>(
                "card-buttons"
            ).style.display =
                "flex";

            flashcard.onclick =
                null;
        };

        getRequiredElement<HTMLButtonElement>(
            "btn-unknown"
        ).onclick = () => {
            setWeakWord(
                pack.id,
                word.fr,
                true
            );

            retry.push(
                word
            );

            index++;
            showCurrentCard();
        };

        getRequiredElement<HTMLButtonElement>(
            "btn-known"
        ).onclick = () => {
            setWeakWord(
                pack.id,
                word.fr,
                false
            );

            knownCount++;
            index++;
            showCurrentCard();
        };
    }

    /**
     * Displays the flashcard activity result.
     */
    function showFlashcardEnd(): void {
        if (
            retry.length > 0
            && !reviewMode
        ) {
            app.innerHTML =
                renderFlashcardReviewPromptView(
                    retry.length
                );

            getRequiredElement<HTMLButtonElement>(
                "btn-review"
            ).onclick = () => {
                startFlashcards(
                    true
                );
            };

            getRequiredElement<HTMLButtonElement>(
                "btn-stop"
            ).onclick = () => {
                void showVocabPack(
                    pack.level,
                    pack.id
                );
            };

            return;
        }

        const percentage =
            Math.round(
                (
                    knownCount
                    / Math.max(
                        deck.length,
                        1
                    )
                ) * 100
            );

        app.innerHTML =
            renderVocabResultView(
                knownCount,
                deck.length,
                percentage,
                "common.morePractice"
            );

        getRequiredElement<HTMLButtonElement>(
            "vocab-result-retry"
        ).onclick = () => {
            startFlashcards(
                reviewMode
            );
        };

        getRequiredElement<HTMLButtonElement>(
            "vocab-result-back"
        ).onclick = () => {
            void showVocabPack(
                pack.level,
                pack.id
            );
        };
    }

    showCurrentCard();
}

/**
 * Returns a randomized copy of a Vocabulary word collection.
 *
 * @param words - Source words.
 * @returns Shuffled deck.
 */
function shuffleVocabWords(
    words: VocabWord[]
): VocabWord[] {
    const shuffled = [
        ...words
    ];

    for (
        let index =
            shuffled.length - 1;
        index > 0;
        index--
    ) {
        const target =
            Math.floor(
                Math.random()
                * (index + 1)
            );

        [
            shuffled[index],
            shuffled[target]
        ] = [
            shuffled[target],
            shuffled[index]
        ];
    }

    return shuffled;
}

/**
 * Toggles all currently rendered story translations.
 */
function toggleStoryTranslation(): void {
    queryElements<HTMLElement>(
        ".story-tr"
    ).forEach(
        element => {
            element.style.display =
                element.style.display
                === "none"
                    ? "block"
                    : "none";
        }
    );
}

/**
 * Starts a story activity using either the current or legacy story schema.
 *
 * @param difficulty - Requested story difficulty.
 */
function startStory(
    difficulty: StoryDifficulty
): void {
    const pack =
        getCurrentVocabPack();

    const fallbackDifficulty:
        StoryDifficulty =
            difficulty === "simple"
                ? "easy"
                : difficulty === "literary"
                    ? "hard"
                    : difficulty;

    const story =
        pack.stories?.[
            difficulty
        ]
        || pack.stories?.[
            fallbackDifficulty
        ];

    if (!story) {
        alert(
            t("common.soon")
        );

        return;
    }

    if (
        story.text
        && story.blanks?.length
    ) {
        showBlankStory(
            pack,
            story,
            difficulty
        );

        return;
    }

    app.innerHTML =
        renderLegacyVocabStoryView(
            pack,
            story,
            difficulty
        );

    bindVocabStoryCommonEvents(
        pack
    );

    bindLegacyStoryQuestions(
        story
    );
}

/**
 * Binds common navigation and translation controls used by story screens.
 *
 * @param pack - Active vocabulary pack.
 */
function bindVocabStoryCommonEvents(
    pack: VocabPack
): void {
    getRequiredElement<HTMLButtonElement>(
        "vocab-story-back"
    ).onclick = () => {
        void showVocabPack(
            pack.level,
            pack.id
        );
    };

    const translationButton =
        document.getElementById(
            "story-translation-toggle"
        ) as HTMLButtonElement | null;

    if (
        translationButton
    ) {
        translationButton.onclick =
            toggleStoryTranslation;
    }
}

/**
 * Displays and wires a fill-in-the-blank story.
 *
 * @param pack - Active vocabulary pack.
 * @param story - Story data.
 * @param difficulty - Story difficulty.
 */
function showBlankStory(
    pack: VocabPack,
    story: VocabStory,
    difficulty: StoryDifficulty
): void {
    const sortedBlanks =
        [
            ...(story.blanks ?? [])
        ].sort(
            (
                first,
                second
            ) =>
                first.id
                - second.id
        );

    app.innerHTML =
        renderBlankVocabStoryView(
            pack,
            story,
            difficulty,
            sortedBlanks
        );

    bindVocabStoryCommonEvents(
        pack
    );

    const answers:
        Array<number | null> =
            new Array(
                sortedBlanks.length
            ).fill(
                null
            );

    queryElements<HTMLButtonElement>(
        ".blank-opt"
    ).forEach(
        button => {
            button.onclick = () => {
                const blankIndex =
                    Number.parseInt(
                        button.dataset.idx
                        ?? "-1",
                        10
                    );

                const optionIndex =
                    Number.parseInt(
                        button.dataset.oi
                        ?? "-1",
                        10
                    );

                if (
                    blankIndex < 0
                    || blankIndex
                        >= sortedBlanks.length
                    || optionIndex < 0
                ) {
                    return;
                }

                const blank =
                    sortedBlanks[
                        blankIndex
                    ];

                if (
                    optionIndex
                    >= blank.options.length
                ) {
                    return;
                }

                answers[
                    blankIndex
                ] = optionIndex;

                setSelectedBlankOptionStyle(
                    blankIndex,
                    button
                );

                const blankButton =
                    document.querySelector<
                        HTMLButtonElement
                    >(
                        `.blank-btn[data-blank="${blankIndex}"]`
                    );

                if (
                    blankButton
                ) {
                    blankButton.textContent =
                        blank.options[
                            optionIndex
                        ]
                        ?? "___";
                }
            };
        }
    );

    getRequiredElement<HTMLButtonElement>(
        "check-blanks"
    ).onclick = () => {
        checkBlankStoryAnswers(
            sortedBlanks,
            answers
        );
    };
}

/**
 * Applies the selected state to one blank option.
 *
 * @param blankIndex - Blank display index.
 * @param selectedButton - Selected option button.
 */
function setSelectedBlankOptionStyle(
    blankIndex: number,
    selectedButton: HTMLButtonElement
): void {
    queryElements<HTMLButtonElement>(
        `.blank-opt[data-idx="${blankIndex}"]`
    ).forEach(
        candidate => {
            candidate.style.background =
                "#fafafa";

            candidate.style.borderColor =
                "#e0e0e0";
        }
    );

    selectedButton.style.background =
        "#e8f5f0";

    selectedButton.style.borderColor =
        "#087F5B";
}

/**
 * Validates every answer in a fill-in-the-blank story.
 *
 * @param blanks - Ordered blanks.
 * @param answers - Selected option indexes.
 */
function checkBlankStoryAnswers(
    blanks: VocabStoryBlank[],
    answers: Array<number | null>
): void {
    let correctCount = 0;

    blanks.forEach(
        (
            blank,
            index
        ) => {
            const valid =
                answers[index]
                === blank.correctIndex;

            if (valid) {
                correctCount++;
            }

            const blankButton =
                document.querySelector<
                    HTMLButtonElement
                >(
                    `.blank-btn[data-blank="${index}"]`
                );

            if (
                blankButton
            ) {
                applyVocabAnswerStyle(
                    blankButton,
                    valid
                );
            }
        }
    );

    const percentage =
        Math.round(
            (
                correctCount
                / Math.max(
                    blanks.length,
                    1
                )
            ) * 100
        );

    const presentation =
        getVocabScorePresentation(
            percentage,
            "common.moreEffort"
        );

    alert(
        `${presentation.emoji} ${correctCount}/${blanks.length} (${percentage}%) - ${presentation.message}`
    );
}

/**
 * Wires comprehension questions used by the legacy story schema.
 *
 * @param story - Active story.
 */
function bindLegacyStoryQuestions(
    story: VocabStory
): void {
    queryElements<HTMLButtonElement>(
        ".story-q"
    ).forEach(
        button => {
            button.onclick = () => {
                const questionIndex =
                    Number.parseInt(
                        button.dataset.q
                        ?? "-1",
                        10
                    );

                const optionIndex =
                    Number.parseInt(
                        button.dataset.o
                        ?? "-1",
                        10
                    );

                const question =
                    story.questions?.[
                        questionIndex
                    ];

                if (
                    !question
                    || optionIndex < 0
                    || optionIndex
                        >= question.options.length
                ) {
                    return;
                }

                const siblings =
                    queryElements<HTMLButtonElement>(
                        `.story-q[data-q="${questionIndex}"]`
                    );

                siblings.forEach(
                    candidate => {
                        candidate.onclick =
                            null;
                    }
                );

                const correct =
                    optionIndex
                    === question.correct;

                applyVocabAnswerStyle(
                    button,
                    correct
                );

                if (!correct) {
                    const correctButton =
                        siblings[
                            question.correct
                        ];

                    if (
                        correctButton
                    ) {
                        applyVocabAnswerStyle(
                            correctButton,
                            true
                        );
                    }
                }
            };
        }
    );
}

/**
 * Starts the randomized quiz attached to the active Vocabulary pack.
 */
function startVocabExercise(): void {
    const pack =
        getCurrentVocabPack();

    const exercise =
        pack.exercise
        || pack.quiz;

    if (
        !exercise?.questions.length
    ) {
        alert(
            t("vocab.exerciseSoon")
        );

        return;
    }

    const questions =
        prepareVocabExerciseQuestions(
            exercise
        );

    let questionIndex = 0;
    let correctCount = 0;

    /**
     * Displays one quiz question or the final result.
     */
    function showCurrentQuestion(): void {
        if (
            questionIndex
            >= questions.length
        ) {
            showQuizResult();
            return;
        }

        const question =
            questions[
                questionIndex
            ];

        app.innerHTML =
            renderVocabQuizQuestionView(
                question.question,
                question.options,
                questionIndex,
                questions.length
            );

        getRequiredElement<HTMLButtonElement>(
            "vocab-quiz-back"
        ).onclick = () => {
            void showVocabPack(
                pack.level,
                pack.id
            );
        };

        const buttons =
            queryElements<HTMLButtonElement>(
                ".vq"
            );

        buttons.forEach(
            button => {
                button.onclick = () => {
                    const optionIndex =
                        Number.parseInt(
                            button.dataset.o
                            ?? "-1",
                            10
                        );

                    if (
                        optionIndex < 0
                        || optionIndex
                            >= question.options.length
                    ) {
                        return;
                    }

                    const correct =
                        optionIndex
                        === question.correct;

                    if (correct) {
                        correctCount++;
                    }

                    buttons.forEach(
                        candidate => {
                            candidate.onclick =
                                null;
                        }
                    );

                    applyVocabAnswerStyle(
                        button,
                        correct
                    );

                    if (!correct) {
                        const correctButton =
                            buttons[
                                question.correct
                            ];

                        if (
                            correctButton
                        ) {
                            applyVocabAnswerStyle(
                                correctButton,
                                true
                            );
                        }
                    }

                    const feedback =
                        getRequiredElement<HTMLElement>(
                            "vfb"
                        );

                    feedback.innerHTML =
                        renderVocabQuizFeedbackView(
                            question.explanation
                        );

                    getRequiredElement<HTMLButtonElement>(
                        "vnext"
                    ).onclick = () => {
                        questionIndex++;
                        showCurrentQuestion();
                    };
                };
            }
        );
    }

    /**
     * Displays the final quiz result.
     */
    function showQuizResult(): void {
        const percentage =
            Math.round(
                (
                    correctCount
                    / Math.max(
                        questions.length,
                        1
                    )
                ) * 100
            );

        app.innerHTML =
            renderVocabResultView(
                correctCount,
                questions.length,
                percentage,
                "common.morePractice"
            );

        getRequiredElement<HTMLButtonElement>(
            "vocab-result-retry"
        ).onclick = () => {
            startVocabExercise();
        };

        getRequiredElement<HTMLButtonElement>(
            "vocab-result-back"
        ).onclick = () => {
            void showVocabPack(
                pack.level,
                pack.id
            );
        };
    }

    showCurrentQuestion();
}

/**
 * Prepares the randomized Vocabulary quiz.
 *
 * Both question order and answer-option order are randomized while preserving
 * the semantic correct answer.
 *
 * @param exercise - Vocabulary exercise or quiz.
 * @returns Prepared questions.
 */
function prepareVocabExerciseQuestions(
    exercise: VocabExercise
): PreparedVocabQuestion[] {
    const shuffledQuestions =
        shuffleVocabExerciseQuestions(
            exercise.questions
        );

    const displayCount =
        Math.min(
            exercise.displayCount
            ?? shuffledQuestions.length,
            shuffledQuestions.length
        );

    return shuffledQuestions
        .slice(
            0,
            displayCount
        )
        .map(
            question =>
                prepareVocabExerciseQuestion(
                    question
                )
        );
}

/**
 * Returns a randomized copy of quiz questions.
 *
 * @param questions - Source questions.
 * @returns Randomized questions.
 */
function shuffleVocabExerciseQuestions(
    questions: VocabExerciseQuestion[]
): VocabExerciseQuestion[] {
    const shuffled = [
        ...questions
    ];

    for (
        let index =
            shuffled.length - 1;
        index > 0;
        index--
    ) {
        const target =
            Math.floor(
                Math.random()
                * (index + 1)
            );

        [
            shuffled[index],
            shuffled[target]
        ] = [
            shuffled[target],
            shuffled[index]
        ];
    }

    return shuffled;
}

/**
 * Randomizes one Vocabulary question while preserving its correct answer.
 *
 * @param question - Source Vocabulary question.
 * @returns Prepared question.
 */
function prepareVocabExerciseQuestion(
    question: VocabExerciseQuestion
): PreparedVocabQuestion {
    const correctIndex =
        question.correct
        ?? question.correctIndex
        ?? -1;

    const options =
        question.options.map(
            (
                text,
                index
            ) => ({
                text,
                correct:
                    index
                    === correctIndex
            })
        );

    for (
        let index =
            options.length - 1;
        index > 0;
        index--
    ) {
        const target =
            Math.floor(
                Math.random()
                * (index + 1)
            );

        [
            options[index],
            options[target]
        ] = [
            options[target],
            options[index]
        ];
    }

    return {
        question:
            question.question,

        options:
            options.map(
                option =>
                    option.text
            ),

        correct:
            options.findIndex(
                option =>
                    option.correct
            ),

        explanation:
            localizedValue(
                question.explanation,
                question.explanation_fa
            )
    };
}

/**
 * Applies correct/incorrect visual feedback to an interactive answer.
 *
 * This is transient DOM state and intentionally remains in the controller.
 *
 * @param element - Interactive answer element.
 * @param correct - Whether the answer is correct.
 */
function applyVocabAnswerStyle(
    element: HTMLElement,
    correct: boolean
): void {
    element.style.background =
        correct
            ? "#d4edda"
            : "#f8d7da";

    element.style.borderColor =
        correct
            ? "#28a745"
            : "#dc3545";

    element.style.color =
        correct
            ? "#155724"
            : "#721c24";
}

/**
 * Validates a CEFR value received from a DOM data attribute.
 *
 * @param value - Raw level.
 * @returns Valid CEFR level or null.
 */
function parseVocabLevel(
    value: string | undefined
): Level | null {
    switch (value) {
        case "A1":
        case "A2":
        case "B1":
        case "B2":
        case "C1":
        case "C2":
            return value;

        default:
            return null;
    }
}

/**
 * Validates a story difficulty received from the DOM.
 *
 * @param value - Raw difficulty.
 * @returns Supported story difficulty or null.
 */
function parseStoryDifficulty(
    value: string | undefined
): StoryDifficulty | null {
    switch (value) {
        case "simple":
        case "literary":
        case "easy":
        case "hard":
            return value;

        default:
            return null;
    }
}
