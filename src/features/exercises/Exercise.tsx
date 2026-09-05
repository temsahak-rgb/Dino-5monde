import {
    useEffect,
    useMemo,
    useState
} from "react";

import {
    checkAnswer,
    getRandomQuestions,
    prepareQuestion
} from "../../core/exerciseEngine.js";

import {
    markSectionCompleted,
    saveMistake
} from "../../core/progressEngine.js";

import {
    useI18n
} from "../../i18n/I18nProvider.js";

import type {
    ExerciseAnswer,
    ExerciseQuestion,
    ExerciseSectionInput
} from "../../types/global.js";

import {
    Button,
    Card,
    ProgressBar
} from "../../ui/components/Controls.js";

import {
    Alert,
    ResultState
} from "../../ui/components/Feedback.js";

import {
    PageHeader
} from "../../ui/components/Layout.js";

import {
    RichText
} from "../../ui/components/RichText.js";

interface ExerciseProps {
    lessonId: string;
    section: ExerciseSectionInput;
    onBack: () => void;
    onComplete: () => void;
}

/**
 * Shared React exercise runner.
 *
 * Used by Grammar and later Travel.
 *
 * Unlike the historical browser controller, every question type already
 * supported by exerciseEngine is interactive here:
 *
 * - mcq
 * - binary
 * - fill_blank
 * - ordering
 */
function Exercise({
    lessonId,
    section,
    onBack,
    onComplete
}: ExerciseProps) {
    const {
        localizedTextClass,
        localizedValue,
        t
    } = useI18n();

    /*
     * Question selection and option randomization are performed once for the
     * current section. React re-renders must never reshuffle an active
     * question.
     */
    const questions =
        useMemo(
            () =>
                getRandomQuestions(
                    section,
                    section.displayCount
                    ?? null
                ).map(
                    question =>
                        prepareQuestion(
                            question
                        )
                ),
            [
                section
            ]
        );

    const [
        currentQuestionIndex,
        setCurrentQuestionIndex
    ] = useState(0);

    const [
        correctCount,
        setCorrectCount
    ] = useState(0);

    const [
        submittedAnswer,
        setSubmittedAnswer
    ] =
        useState<ExerciseAnswer | null>(
            null
        );

    const [
        answerCorrect,
        setAnswerCorrect
    ] =
        useState<boolean | null>(
            null
        );

    const [
        fillBlankValue,
        setFillBlankValue
    ] = useState("");

    const [
        orderingSelection,
        setOrderingSelection
    ] =
        useState<number[]>(
            []
        );

    /*
     * Exercise is currently rendered conditionally from the lesson overview,
     * but resetting on section changes keeps the component safe for future
     * direct navigation between exercises.
     */
    useEffect(
        () => {
            setCurrentQuestionIndex(
                0
            );

            setCorrectCount(
                0
            );

            setSubmittedAnswer(
                null
            );

            setAnswerCorrect(
                null
            );

            setFillBlankValue(
                ""
            );

            setOrderingSelection(
                []
            );
        },
        [
            section.id
        ]
    );

    const finished =
        currentQuestionIndex
        >= questions.length;

    /*
     * Preserve the historical behavior: completing all presented questions
     * immediately persists the section, even before the learner presses
     * "return to lesson".
     *
     * markSectionCompleted() is idempotent, so React StrictMode is safe here.
     */
    useEffect(
        () => {
            if (!finished) {
                return;
            }

            markSectionCompleted(
                lessonId,
                section.id
            );
        },
        [
            finished,
            lessonId,
            section.id
        ]
    );

    if (finished) {
        return (
            <ExerciseResult
                correctCount={
                    correctCount
                }
                totalCount={
                    questions.length
                }
                onComplete={
                    onComplete
                }
            />
        );
    }

    const question =
        questions[
            currentQuestionIndex
        ];

    /*
     * Defensive fallback for malformed/randomized collections.
     */
    if (!question) {
        return (
            <ExerciseResult
                correctCount={
                    correctCount
                }
                totalCount={
                    questions.length
                }
                onComplete={
                    onComplete
                }
            />
        );
    }

    const title =
        localizedValue(
            section.title,
            section.title_fa,
            t(
                "exercise.defaultTitle"
            )
        );

    const explanation =
        localizedValue(
            question.explanation,
            question.explanation_fa
        );

    const answered =
        answerCorrect
        !== null;

    return (
        <div
            className="
                mx-auto
                w-full
                max-w-[900px]
            "
        >
            <button
                type="button"
                onClick={
                    onBack
                }
                className="
                    mb-6
                    border-0
                    bg-transparent
                    p-0
                    text-sm
                    font-bold
                    text-dino-700
                    hover:underline
                    hover:underline-offset-4
                "
            >
                ←
                {" "}
                {t(
                    "common.back"
                )}
            </button>

            <div
                className="
                    mb-2
                    flex
                    items-center
                    justify-between
                    gap-4
                    text-xs
                    font-semibold
                    text-muted
                "
            >
                <span>
                    {currentQuestionIndex + 1}
                    {" "}
                    /
                    {" "}
                    {questions.length}
                </span>
            </div>

            <ProgressBar
                value={
                    currentQuestionIndex
                    + 1
                }
                max={
                    questions.length
                    || 1
                }
            />

            <div
                className="
                    mt-6
                "
            >
                <PageHeader
                    eyebrow={
                        section.type === "quiz"
                            ? t(
                                "grammar.type.quiz"
                            )
                            : t(
                                "exercise.defaultTitle"
                            )
                    }
                    icon={
                        section.type === "quiz"
                            ? "🏆"
                            : "✏️"
                    }
                    title={
                        <span
                            className={
                                localizedTextClass()
                            }
                        >
                            {title}
                        </span>
                    }
                />
            </div>

            <Card
                className="
                    p-5
                    sm:p-6
                "
            >
                <div
                    className="
                        ltr-lock
                        text-[17px]
                        font-medium
                        leading-7
                        text-ink
                    "
                >
                    <RichText
                        text={
                            question.question
                        }
                    />
                </div>

                <div
                    className="
                        mt-6
                    "
                >
                    <QuestionInput
                        question={
                            question
                        }
                        submittedAnswer={
                            submittedAnswer
                        }
                        answerCorrect={
                            answerCorrect
                        }
                        fillBlankValue={
                            fillBlankValue
                        }
                        orderingSelection={
                            orderingSelection
                        }
                        onFillBlankChange={
                            setFillBlankValue
                        }
                        onOrderingChange={
                            setOrderingSelection
                        }
                        onSubmit={
                            submitAnswer
                        }
                    />
                </div>

                {answered ? (
                    <div
                        className="
                            mt-5
                        "
                    >
                        <Alert
                            variant={
                                answerCorrect
                                    ? "success"
                                    : "danger"
                            }
                            title={
                                answerCorrect
                                    ? `✅ ${t(
                                        "exercise.correct"
                                    )}`
                                    : `❌ ${t(
                                        "exercise.incorrect"
                                    )}`
                            }
                        >
                            {explanation ? (
                                <div
                                    className={
                                        localizedTextClass()
                                    }
                                >
                                    <RichText
                                        text={
                                            explanation
                                        }
                                    />
                                </div>
                            ) : null}
                        </Alert>

                        <Button
                            fullWidth
                            className="
                                mt-3
                            "
                            onClick={
                                advanceQuestion
                            }
                        >
                            {currentQuestionIndex
                                === questions.length
                                    - 1
                                ? t(
                                    "common.finish"
                                )
                                : t(
                                    "common.nextQuestion"
                                )
                            }
                        </Button>
                    </div>
                ) : null}
            </Card>
        </div>
    );

    /**
     * Validates and persists one answer.
     */
    function submitAnswer(
        answer: ExerciseAnswer
    ): void {
        if (
            answerCorrect
            !== null
        ) {
            return;
        }

        const correct =
            checkAnswer(
                question,
                answer
            );

        setSubmittedAnswer(
            answer
        );

        setAnswerCorrect(
            correct
        );

        if (correct) {
            setCorrectCount(
                count =>
                    count + 1
            );

            return;
        }

        saveMistake(
            lessonId,
            section.id,
            currentQuestionIndex,
            answer,
            question.correct
        );
    }

    /**
     * Advances to the next prepared question and clears transient input state.
     */
    function advanceQuestion():
        void {
        setSubmittedAnswer(
            null
        );

        setAnswerCorrect(
            null
        );

        setFillBlankValue(
            ""
        );

        setOrderingSelection(
            []
        );

        setCurrentQuestionIndex(
            index =>
                index + 1
        );
    }
}

/* -------------------------------------------------------------------------- */
/* Question dispatcher                                                         */
/* -------------------------------------------------------------------------- */

interface QuestionInputProps {
    question: ExerciseQuestion;

    submittedAnswer:
        ExerciseAnswer | null;

    answerCorrect:
        boolean | null;

    fillBlankValue: string;

    orderingSelection:
        number[];

    onFillBlankChange:
        (value: string) => void;

    onOrderingChange:
        (value: number[]) => void;

    onSubmit:
        (answer: ExerciseAnswer) => void;
}

function QuestionInput({
    question,
    submittedAnswer,
    answerCorrect,
    fillBlankValue,
    orderingSelection,
    onFillBlankChange,
    onOrderingChange,
    onSubmit
}: QuestionInputProps) {
    switch (question.type) {
        case "mcq":
        case "binary":
            return (
                <ChoiceQuestion
                    question={
                        question
                    }
                    submittedAnswer={
                        submittedAnswer
                    }
                    answerCorrect={
                        answerCorrect
                    }
                    onSubmit={
                        onSubmit
                    }
                />
            );

        case "fill_blank":
            return (
                <FillBlankQuestion
                    value={
                        fillBlankValue
                    }
                    answered={
                        answerCorrect
                        !== null
                    }
                    correct={
                        answerCorrect
                    }
                    onChange={
                        onFillBlankChange
                    }
                    onSubmit={
                        onSubmit
                    }
                />
            );

        case "ordering":
            return (
                <OrderingQuestion
                    question={
                        question
                    }
                    selectedIndices={
                        orderingSelection
                    }
                    answered={
                        answerCorrect
                        !== null
                    }
                    correct={
                        answerCorrect
                    }
                    onChange={
                        onOrderingChange
                    }
                    onSubmit={
                        onSubmit
                    }
                />
            );
    }
}

/* -------------------------------------------------------------------------- */
/* MCQ / binary                                                                */
/* -------------------------------------------------------------------------- */

interface ChoiceQuestionProps {
    question:
        Extract<
            ExerciseQuestion,
            {
                type:
                    | "mcq"
                    | "binary";
            }
        >;

    submittedAnswer:
        ExerciseAnswer | null;

    answerCorrect:
        boolean | null;

    onSubmit:
        (answer: ExerciseAnswer) => void;
}

function ChoiceQuestion({
    question,
    submittedAnswer,
    answerCorrect,
    onSubmit
}: ChoiceQuestionProps) {
    const answered =
        answerCorrect
        !== null;

    return (
        <div
            className="
                grid
                gap-2.5
            "
        >
            {question.options.map(
                (
                    option,
                    index
                ) => {
                    const state =
                        getChoiceState(
                            index,
                            question.correct,
                            submittedAnswer,
                            answered
                        );

                    return (
                        <button
                            key={
                                index
                            }
                            type="button"
                            disabled={
                                answered
                            }
                            onClick={() => {
                                onSubmit(
                                    index
                                );
                            }}
                            className={`
                                ltr-lock
                                w-full
                                rounded-control
                                border
                                px-4
                                py-3.5
                                text-left
                                text-[15px]
                                font-medium
                                transition
                                disabled:cursor-default
                                ${getChoiceClasses(
                                    state
                                )}
                            `}
                        >
                            <RichText
                                text={
                                    option
                                }
                                inline
                            />
                        </button>
                    );
                }
            )}
        </div>
    );
}

type ChoiceState =
    | "default"
    | "correct"
    | "incorrect";

function getChoiceState(
    index: number,
    correctIndex: number,
    submittedAnswer:
        ExerciseAnswer | null,
    answered: boolean
): ChoiceState {
    if (!answered) {
        return "default";
    }

    if (
        index
        === correctIndex
    ) {
        return "correct";
    }

    if (
        typeof submittedAnswer
            === "number"
        && index
            === submittedAnswer
    ) {
        return "incorrect";
    }

    return "default";
}

function getChoiceClasses(
    state: ChoiceState
): string {
    switch (state) {
        case "correct":
            return `
                border-emerald-400
                bg-emerald-50
                text-emerald-950
            `;

        case "incorrect":
            return `
                border-red-400
                bg-red-50
                text-red-950
            `;

        case "default":
            return `
                border-line
                bg-page
                text-ink
                hover:border-dino-300
                hover:bg-dino-50
            `;
    }
}

/* -------------------------------------------------------------------------- */
/* Fill blank                                                                  */
/* -------------------------------------------------------------------------- */

interface FillBlankQuestionProps {
    value: string;
    answered: boolean;
    correct: boolean | null;

    onChange:
        (value: string) => void;

    onSubmit:
        (answer: ExerciseAnswer) => void;
}

function FillBlankQuestion({
    value,
    answered,
    correct,
    onChange,
    onSubmit
}: FillBlankQuestionProps) {
    const {
        t
    } = useI18n();

    return (
        <form
            onSubmit={
                event => {
                    event.preventDefault();

                    const answer =
                        value.trim();

                    if (!answer) {
                        return;
                    }

                    onSubmit(
                        answer
                    );
                }
            }
        >
            <input
                type="text"
                value={value}
                disabled={
                    answered
                }
                autoComplete="off"
                onChange={
                    event => {
                        onChange(
                            event.target.value
                        );
                    }
                }
                className={`
                    ltr-lock
                    min-h-12
                    w-full
                    rounded-control
                    border
                    bg-surface
                    px-4
                    py-3
                    text-[15px]
                    text-ink
                    outline-none
                    transition
                    focus:border-dino-500
                    focus:ring-2
                    focus:ring-dino-100
                    ${
                        answered
                            ? correct
                                ? `
                                    border-emerald-400
                                    bg-emerald-50
                                `
                                : `
                                    border-red-400
                                    bg-red-50
                                `
                            : "border-line"
                    }
                `}
            />

            {!answered ? (
                <Button
                    type="submit"
                    fullWidth
                    className="
                        mt-3
                    "
                    disabled={
                        value.trim()
                            .length === 0
                    }
                >
                    {t(
                        "common.continue"
                    )}
                </Button>
            ) : null}
        </form>
    );
}

/* -------------------------------------------------------------------------- */
/* Ordering                                                                    */
/* -------------------------------------------------------------------------- */

interface OrderingQuestionProps {
    question:
        Extract<
            ExerciseQuestion,
            {
                type: "ordering";
            }
        >;

    selectedIndices:
        number[];

    answered: boolean;
    correct: boolean | null;

    onChange:
        (indices: number[]) => void;

    onSubmit:
        (answer: ExerciseAnswer) => void;
}

function OrderingQuestion({
    question,
    selectedIndices,
    answered,
    correct,
    onChange,
    onSubmit
}: OrderingQuestionProps) {
    const {
        t
    } = useI18n();

    const selectedWords =
        selectedIndices
            .map(
                index =>
                    question.words[
                        index
                    ]
            )
            .filter(
                (
                    word
                ): word is string =>
                    typeof word
                        === "string"
            );

    return (
        <div>
            <div
                className={`
                    ltr-lock
                    min-h-16
                    rounded-control
                    border
                    px-3
                    py-3
                    ${
                        answered
                            ? correct
                                ? `
                                    border-emerald-400
                                    bg-emerald-50
                                `
                                : `
                                    border-red-400
                                    bg-red-50
                                `
                            : `
                                border-line
                                bg-page
                            `
                    }
                `}
            >
                {selectedIndices.length
                    > 0 ? (
                    <div
                        className="
                            flex
                            flex-wrap
                            gap-2
                        "
                    >
                        {selectedIndices.map(
                            (
                                sourceIndex,
                                position
                            ) => (
                                <button
                                    key={
                                        `${sourceIndex}-${position}`
                                    }
                                    type="button"
                                    disabled={
                                        answered
                                    }
                                    onClick={() => {
                                        onChange(
                                            selectedIndices
                                                .filter(
                                                    (
                                                        _,
                                                        index
                                                    ) =>
                                                        index
                                                        !== position
                                                )
                                        );
                                    }}
                                    className="
                                        rounded-control
                                        border
                                        border-dino-300
                                        bg-surface
                                        px-3
                                        py-1.5
                                        text-sm
                                        font-semibold
                                        text-dino-800
                                        disabled:cursor-default
                                    "
                                >
                                    {
                                        question.words[
                                            sourceIndex
                                        ]
                                    }
                                </button>
                            )
                        )}
                    </div>
                ) : (
                    <span
                        className="
                            text-sm
                            text-muted
                        "
                    >
                        …
                    </span>
                )}
            </div>

            <div
                className="
                    ltr-lock
                    mt-4
                    flex
                    flex-wrap
                    gap-2
                "
            >
                {question.words.map(
                    (
                        word,
                        index
                    ) => {
                        const selected =
                            selectedIndices
                                .includes(
                                    index
                                );

                        return (
                            <button
                                key={
                                    index
                                }
                                type="button"
                                disabled={
                                    answered
                                    || selected
                                }
                                onClick={() => {
                                    onChange([
                                        ...selectedIndices,
                                        index
                                    ]);
                                }}
                                className="
                                    rounded-control
                                    border
                                    border-line
                                    bg-surface
                                    px-3
                                    py-2
                                    text-sm
                                    font-semibold
                                    text-ink
                                    transition
                                    hover:border-dino-300
                                    hover:bg-dino-50
                                    disabled:cursor-default
                                    disabled:opacity-35
                                "
                            >
                                {word}
                            </button>
                        );
                    }
                )}
            </div>

            {!answered ? (
                <Button
                    fullWidth
                    className="
                        mt-4
                    "
                    disabled={
                        selectedWords.length
                        !== question.correct.length
                    }
                    onClick={() => {
                        onSubmit(
                            selectedWords
                        );
                    }}
                >
                    {t(
                        "common.continue"
                    )}
                </Button>
            ) : null}
        </div>
    );
}

/* -------------------------------------------------------------------------- */
/* Result                                                                      */
/* -------------------------------------------------------------------------- */

interface ExerciseResultProps {
    correctCount: number;
    totalCount: number;
    onComplete: () => void;
}

function ExerciseResult({
    correctCount,
    totalCount,
    onComplete
}: ExerciseResultProps) {
    const {
        t
    } = useI18n();

    const percentage =
        totalCount > 0
            ? Math.round(
                (
                    correctCount
                    / totalCount
                )
                * 100
            )
            : 0;

    const presentation =
        getResultPresentation(
            percentage,
            t
        );

    return (
        <div
            className="
                mx-auto
                w-full
                max-w-[500px]
                py-8
            "
        >
            <ResultState
                icon={
                    presentation.emoji
                }
                title={
                    presentation.message
                }
                score={
                    `${correctCount}/${totalCount}`
                }
                description={
                    `${percentage}%`
                }
                variant={
                    presentation.variant
                }
                actions={
                    <div
                        className="
                            w-full
                        "
                    >
                        <Button
                            fullWidth
                            onClick={
                                onComplete
                            }
                        >
                            {t(
                                "exercise.returnLesson"
                            )}
                        </Button>
                    </div>
                }
            />
        </div>
    );
}

type TranslationFunction =
    ReturnType<
        typeof useI18n
    >["t"];

function getResultPresentation(
    percentage: number,
    t: TranslationFunction
): {
    emoji: string;
    message: string;
    variant:
        | "success"
        | "warning"
        | "info";
} {
    if (
        percentage < 50
    ) {
        return {
            emoji: "💪",
            message:
                t(
                    "common.moreEffort"
                ),
            variant:
                "warning"
        };
    }

    if (
        percentage < 80
    ) {
        return {
            emoji: "👍",
            message:
                t(
                    "common.good"
                ),
            variant:
                "info"
        };
    }

    return {
        emoji: "🎉",
        message:
            t(
                "common.excellent"
            ),
        variant:
            "success"
    };
}

export {
    Exercise
};