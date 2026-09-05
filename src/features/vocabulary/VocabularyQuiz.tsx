import {
    useMemo,
    useState
} from "react";

import {
    useI18n
} from "../../i18n/I18nProvider.js";

import type {
    VocabExercise,
    VocabExerciseQuestion,
    VocabPack
} from "../../types/global.js";

import {
    Button,
    Card,
    ProgressBar
} from "../../ui/components/Controls.js";

import {
    RichText
} from "../../ui/components/RichText.js";

interface VocabularyQuizProps {
    pack: VocabPack;
    onBack: () => void;
}

interface PreparedVocabQuestion {
    question: string;
    options: string[];
    correct: number;
    explanation: string;
}

type AnswerState =
    | "default"
    | "correct"
    | "incorrect";

/**
 * Interactive Vocabulary quiz.
 *
 * The historical behavior is preserved:
 *
 * - `pack.exercise` takes priority over `pack.quiz`
 * - question order is randomized
 * - `displayCount` limits the session
 * - answer options are randomized
 * - the semantic correct answer survives option shuffling
 * - questions lock after the first answer
 * - the correct option is revealed after an error
 * - the complete activity can be retried
 */
function VocabularyQuiz({
    pack,
    onBack
}: VocabularyQuizProps) {
    const {
        localizedValue,
        t
    } = useI18n();

    const exercise =
        pack.exercise
        || pack.quiz;

    const [
        sessionId,
        setSessionId
    ] = useState(0);

    const questions =
        useMemo(
            () => {
                if (!exercise) {
                    return [];
                }

                return prepareVocabExerciseQuestions(
                    exercise,
                    (
                        french,
                        persian
                    ) =>
                        localizedValue(
                            french,
                            persian
                        )
                );
            },
            [
                exercise,
                localizedValue,
                sessionId
            ]
        );

    const [
        questionIndex,
        setQuestionIndex
    ] = useState(0);

    const [
        correctCount,
        setCorrectCount
    ] = useState(0);

    const [
        selectedAnswer,
        setSelectedAnswer
    ] =
        useState<number | null>(
            null
        );

    if (
        !exercise
        || exercise.questions.length
            === 0
    ) {
        return (
            <div
                className="
                    mx-auto
                    w-full
                    max-w-[560px]
                "
            >
                <QuizBackButton
                    onBack={
                        onBack
                    }
                />

                <Card
                    className="
                        p-8
                        text-center
                    "
                >
                    <div
                        className="
                            text-4xl
                        "
                        aria-hidden="true"
                    >
                        📝
                    </div>

                    <p
                        className="
                            mt-4
                            text-base
                            font-semibold
                            text-ink
                        "
                    >
                        {t(
                            "vocab.exerciseSoon"
                        )}
                    </p>
                </Card>
            </div>
        );
    }

    if (
        questionIndex
        >= questions.length
    ) {
        return (
            <VocabularyQuizResult
                correctCount={
                    correctCount
                }
                totalCount={
                    questions.length
                }
                onRetry={
                    restartQuiz
                }
                onBack={
                    onBack
                }
            />
        );
    }

    const question =
        questions[
            questionIndex
        ];

    if (!question) {
        return (
            <VocabularyQuizResult
                correctCount={
                    correctCount
                }
                totalCount={
                    questions.length
                }
                onRetry={
                    restartQuiz
                }
                onBack={
                    onBack
                }
            />
        );
    }

    const answered =
        selectedAnswer
        !== null;

    const correct =
        selectedAnswer
        === question.correct;

    return (
        <div
            className="
                mx-auto
                w-full
                max-w-[560px]
            "
        >
            <QuizBackButton
                onBack={
                    onBack
                }
            />

            <div
                className="
                    mb-2
                    flex
                    items-center
                    justify-between
                    gap-4
                "
            >
                <span
                    className="
                        ltr-lock
                        text-sm
                        text-muted
                    "
                >
                    {questionIndex + 1}
                    {" "}
                    /
                    {" "}
                    {questions.length}
                </span>

                <span
                    className="
                        text-sm
                        font-semibold
                        text-dino-700
                    "
                >
                    📝
                    {" "}
                    {t(
                        "vocab.quiz"
                    )}
                </span>
            </div>

            <ProgressBar
                value={
                    questionIndex + 1
                }
                max={
                    Math.max(
                        questions.length,
                        1
                    )
                }
            />

            <Card
                className="
                    mt-6
                    p-5
                    sm:p-6
                "
            >
                <p
                    className="
                        ltr-lock
                        text-[17px]
                        font-semibold
                        leading-7
                        text-ink
                    "
                >
                    {question.question}
                </p>

                <div
                    className="
                        mt-5
                        grid
                        gap-2.5
                    "
                >
                    {question.options.map(
                        (
                            option,
                            optionIndex
                        ) => {
                            const state =
                                getQuizAnswerState(
                                    optionIndex,
                                    question.correct,
                                    selectedAnswer
                                );

                            return (
                                <button
                                    key={
                                        optionIndex
                                    }
                                    type="button"
                                    disabled={
                                        answered
                                    }
                                    onClick={() => {
                                        answerQuestion(
                                            optionIndex
                                        );
                                    }}
                                    className={`
                                        ltr-lock
                                        min-h-12
                                        w-full
                                        rounded-control
                                        border
                                        px-4
                                        py-3
                                        text-left
                                        text-[15px]
                                        font-medium
                                        transition
                                        disabled:cursor-default
                                        ${getAnswerStateClasses(
                                            state
                                        )}
                                    `}
                                >
                                    {option}
                                </button>
                            );
                        }
                    )}
                </div>

                {answered ? (
                    <div
                        className="
                            mt-5
                        "
                    >
                        <div
                            className={`
                                rounded-control
                                border
                                p-4
                                ${
                                    correct
                                        ? `
                                            border-emerald-300
                                            bg-emerald-50
                                            text-emerald-900
                                        `
                                        : `
                                            border-red-300
                                            bg-red-50
                                            text-red-900
                                        `
                                }
                            `}
                        >
                            <p
                                className="
                                    font-bold
                                "
                            >
                                {correct
                                    ? `✅ ${t(
                                        "exercise.correct"
                                    )}`
                                    : `❌ ${t(
                                        "exercise.incorrect"
                                    )}`
                                }
                            </p>

                            {question.explanation ? (
                                <div
                                    className="
                                        mt-2
                                        text-sm
                                        leading-6
                                    "
                                >
                                    <RichText
                                        text={
                                            question.explanation
                                        }
                                    />
                                </div>
                            ) : null}
                        </div>

                        <Button
                            fullWidth
                            className="
                                mt-3
                            "
                            onClick={
                                nextQuestion
                            }
                        >
                            {questionIndex
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
     * Records the first answer selected for the active question.
     */
    function answerQuestion(
        optionIndex: number
    ): void {
        if (
            selectedAnswer
            !== null
        ) {
            return;
        }

        if (
            optionIndex < 0
            || optionIndex
                >= question.options.length
        ) {
            return;
        }

        setSelectedAnswer(
            optionIndex
        );

        if (
            optionIndex
            === question.correct
        ) {
            setCorrectCount(
                count =>
                    count + 1
            );
        }
    }

    /**
     * Advances to the next prepared question.
     */
    function nextQuestion():
        void {
        setSelectedAnswer(
            null
        );

        setQuestionIndex(
            current =>
                current + 1
        );
    }

    /**
     * Creates an entirely fresh randomized session.
     */
    function restartQuiz():
        void {
        setQuestionIndex(
            0
        );

        setCorrectCount(
            0
        );

        setSelectedAnswer(
            null
        );

        setSessionId(
            current =>
                current + 1
        );
    }
}

/* -------------------------------------------------------------------------- */
/* Back                                                                        */
/* -------------------------------------------------------------------------- */

interface QuizBackButtonProps {
    onBack: () => void;
}

function QuizBackButton({
    onBack
}: QuizBackButtonProps) {
    const {
        t
    } = useI18n();

    return (
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
    );
}

/* -------------------------------------------------------------------------- */
/* Result                                                                      */
/* -------------------------------------------------------------------------- */

interface VocabularyQuizResultProps {
    correctCount: number;
    totalCount: number;
    onRetry: () => void;
    onBack: () => void;
}

function VocabularyQuizResult({
    correctCount,
    totalCount,
    onRetry,
    onBack
}: VocabularyQuizResultProps) {
    const {
        t
    } = useI18n();

    const percentage =
        Math.round(
            (
                correctCount
                / Math.max(
                    totalCount,
                    1
                )
            )
            * 100
        );

    const presentation =
        getQuizResultPresentation(
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
                text-center
            "
        >
            <div
                className="
                    text-5xl
                "
                aria-hidden="true"
            >
                {presentation.emoji}
            </div>

            <h1
                className="
                    mt-4
                    text-2xl
                    font-bold
                    text-ink
                "
            >
                {presentation.message}
            </h1>

            <p
                className="
                    ltr-lock
                    mt-3
                    text-base
                    text-muted
                "
            >
                {correctCount}
                {" "}
                /
                {" "}
                {totalCount}
                {" "}
                ({percentage}%)
            </p>

            <div
                className="
                    mt-7
                    grid
                    gap-2.5
                "
            >
                <Button
                    fullWidth
                    onClick={
                        onRetry
                    }
                >
                    🔄
                    {" "}
                    {t(
                        "common.retry"
                    )}
                </Button>

                <button
                    type="button"
                    onClick={
                        onBack
                    }
                    className="
                        min-h-12
                        w-full
                        rounded-control
                        border
                        border-line
                        bg-surface
                        px-4
                        py-3
                        text-sm
                        font-semibold
                        text-ink
                        transition
                        hover:bg-neutral-50
                    "
                >
                    {t(
                        "common.back"
                    )}
                </button>
            </div>
        </div>
    );
}

/* -------------------------------------------------------------------------- */
/* Question preparation                                                        */
/* -------------------------------------------------------------------------- */

type LocalizeExplanation =
    (
        french:
            string | undefined,
        persian:
            string | undefined
    ) => string;

/**
 * Randomizes a Vocabulary exercise while preserving all semantic answers.
 */
function prepareVocabExerciseQuestions(
    exercise: VocabExercise,
    localizeExplanation:
        LocalizeExplanation
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
                    question,
                    localizeExplanation
                )
        );
}

/**
 * Fisher-Yates copy of the source question collection.
 */
function shuffleVocabExerciseQuestions(
    questions:
        readonly VocabExerciseQuestion[]
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
 * Randomizes answer options while keeping track of the semantic correct one.
 *
 * Both historical corpus fields are accepted:
 *
 * - `correct`
 * - `correctIndex`
 */
function prepareVocabExerciseQuestion(
    question:
        VocabExerciseQuestion,
    localizeExplanation:
        LocalizeExplanation
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
            localizeExplanation(
                question.explanation,
                question.explanation_fa
            )
    };
}

/* -------------------------------------------------------------------------- */
/* Answer presentation                                                        */
/* -------------------------------------------------------------------------- */

function getQuizAnswerState(
    optionIndex: number,
    correctIndex: number,
    selectedAnswer:
        number | null
): AnswerState {
    if (
        selectedAnswer
        === null
    ) {
        return "default";
    }

    if (
        optionIndex
        === correctIndex
    ) {
        return "correct";
    }

    if (
        optionIndex
        === selectedAnswer
    ) {
        return "incorrect";
    }

    return "default";
}

function getAnswerStateClasses(
    state:
        AnswerState
): string {
    switch (state) {
        case "correct":
            return `
                border-emerald-500
                bg-emerald-50
                text-emerald-900
            `;

        case "incorrect":
            return `
                border-red-400
                bg-red-50
                text-red-900
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
/* Score                                                                       */
/* -------------------------------------------------------------------------- */

type TranslationFunction =
    ReturnType<
        typeof useI18n
    >["t"];

function getQuizResultPresentation(
    percentage: number,
    t: TranslationFunction
): {
    emoji: string;
    message: string;
} {
    if (
        percentage < 50
    ) {
        return {
            emoji: "💪",
            message:
                t(
                    "common.morePractice"
                )
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
                )
        };
    }

    return {
        emoji: "🎉",
        message:
            t(
                "common.excellent"
            )
    };
}

export {
    VocabularyQuiz,
    prepareVocabExerciseQuestion,
    prepareVocabExerciseQuestions,
    shuffleVocabExerciseQuestions
};

export type {
    PreparedVocabQuestion
};