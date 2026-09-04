import {
    Fragment,
    useMemo,
    useState
} from "react";

import {
    prepareVocabStory
} from "./vocabularyEngine.js";

import {
    useI18n
} from "../../i18n/I18nProvider.js";

import type {
    StoryDifficulty,
    VocabPack,
    VocabStory,
    VocabStoryBlank,
    VocabStoryQuestion,
    VocabStoryWithTitle
} from "../../types/global.js";

import {
    Badge,
    Button,
    Card
} from "../../ui/components/Controls.js";

interface VocabularyStoryProps {
    pack: VocabPack;
    difficulty:
        StoryDifficulty;
    onBack: () => void;
}

interface BlankStoryResult {
    correct: number;
    total: number;
    percentage: number;
}

/**
 * Vocabulary story activity.
 *
 * Dino currently supports two corpus generations:
 *
 * 1. paragraph-based stories
 * 2. text stories containing {{BLANK_n}} placeholders
 *
 * Both are kept compatible here.
 */
function VocabularyStory({
    pack,
    difficulty,
    onBack
}: VocabularyStoryProps) {
    const {
        t
    } = useI18n();

    const rawStory =
        resolveVocabularyStory(
            pack,
            difficulty
        );

    const story =
        rawStory
            ? prepareVocabStory(
                pack,
                rawStory
            )
            : null;

    const blankStory =
        Boolean(
            story?.text
            && story.blanks?.length
        );

    const sortedBlanks =
        useMemo(
            () =>
                [
                    ...(
                        story?.blanks
                        ?? []
                    )
                ].sort(
                    (
                        first,
                        second
                    ) =>
                        first.id
                        - second.id
                ),
            [
                story
            ]
        );

    /*
     * Historical behavior differs slightly between the two corpus schemas:
     *
     * - paragraph translations start visible
     * - full-text translations start hidden
     */
    const [
        translationVisible,
        setTranslationVisible
    ] =
        useState(
            !blankStory
        );

    const [
        blankAnswers,
        setBlankAnswers
    ] =
        useState<
            Array<number | null>
        >(
            () =>
                new Array(
                    sortedBlanks.length
                ).fill(
                    null
                )
        );

    const [
        blankResult,
        setBlankResult
    ] =
        useState<
            BlankStoryResult | null
        >(
            null
        );

    const [
        questionAnswers,
        setQuestionAnswers
    ] =
        useState<
            Partial<
                Record<
                    number,
                    number
                >
            >
        >({});

    if (!story) {
        return (
            <div
                className="
                    mx-auto
                    w-full
                    max-w-[700px]
                "
            >
                <StoryBackButton
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
                        📖
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
                            "common.soon"
                        )}
                    </p>
                </Card>
            </div>
        );
    }

    const hasTranslation =
        Boolean(
            story.text_fa
            || story.paragraphs?.some(
                paragraph =>
                    Boolean(
                        paragraph.fa
                    )
            )
        );

    return (
        <div
            className="
                mx-auto
                w-full
                max-w-[700px]
            "
        >
            <StoryBackButton
                onBack={
                    onBack
                }
            />

            <StoryHeader
                story={
                    story
                }
                difficulty={
                    difficulty
                }
                hasTranslation={
                    hasTranslation
                }
                translationVisible={
                    translationVisible
                }
                onToggleTranslation={() => {
                    setTranslationVisible(
                        visible =>
                            !visible
                    );
                }}
            />

            {blankStory ? (
                <BlankStory
                    story={
                        story
                    }
                    blanks={
                        sortedBlanks
                    }
                    answers={
                        blankAnswers
                    }
                    result={
                        blankResult
                    }
                    translationVisible={
                        translationVisible
                    }
                    onAnswer={
                        (
                            blankIndex,
                            optionIndex
                        ) => {
                            setBlankAnswers(
                                current => {
                                    const next = [
                                        ...current
                                    ];

                                    next[
                                        blankIndex
                                    ] =
                                        optionIndex;

                                    return next;
                                }
                            );

                            setBlankResult(
                                null
                            );
                        }
                    }
                    onCheck={() => {
                        setBlankResult(
                            evaluateBlankStory(
                                sortedBlanks,
                                blankAnswers
                            )
                        );
                    }}
                />
            ) : (
                <LegacyStory
                    story={
                        story
                    }
                    translationVisible={
                        translationVisible
                    }
                    questionAnswers={
                        questionAnswers
                    }
                    onAnswerQuestion={
                        (
                            questionIndex,
                            optionIndex
                        ) => {
                            setQuestionAnswers(
                                current => ({
                                    ...current,
                                    [
                                        questionIndex
                                    ]:
                                        optionIndex
                                })
                            );
                        }
                    }
                />
            )}
        </div>
    );
}

/* -------------------------------------------------------------------------- */
/* Header                                                                      */
/* -------------------------------------------------------------------------- */

interface StoryHeaderProps {
    story: VocabStoryWithTitle;
    difficulty:
        StoryDifficulty;
    hasTranslation: boolean;
    translationVisible: boolean;
    onToggleTranslation:
        () => void;
}

function StoryHeader({
    story,
    difficulty,
    hasTranslation,
    translationVisible,
    onToggleTranslation
}: StoryHeaderProps) {
    const {
        t
    } = useI18n();

    const simple =
        difficulty
            === "simple"
        || difficulty
            === "easy";

    return (
        <header
            className="
                mb-6
            "
        >
            <div
                className="
                    mb-2
                    flex
                    items-center
                    gap-2
                "
            >
                <span
                    className="
                        text-xl
                    "
                    aria-hidden="true"
                >
                    {simple
                        ? "🌱"
                        : "🌳"
                    }
                </span>

                <Badge>
                    {simple
                        ? "Simple"
                        : "Literary"
                    }
                </Badge>
            </div>

            <h1
                className="
                    ltr-lock
                    text-2xl
                    font-bold
                    leading-tight
                    text-ink
                "
            >
                {story.title}
            </h1>

            {story.title_fa ? (
                <p
                    className="
                        persian-text
                        mt-1.5
                        text-[15px]
                        text-muted
                    "
                >
                    {story.title_fa}
                </p>
            ) : null}

            {hasTranslation ? (
                <button
                    type="button"
                    onClick={
                        onToggleTranslation
                    }
                    className="
                        mt-4
                        rounded-control
                        border
                        border-line
                        bg-surface
                        px-4
                        py-2
                        text-sm
                        font-semibold
                        text-ink
                        transition
                        hover:border-dino-300
                        hover:bg-dino-50
                    "
                >
                    👁️
                    {" "}
                    {t(
                        "vocab.toggleTranslation"
                    )}

                    <span
                        className="
                            ms-2
                            text-xs
                            text-muted
                        "
                    >
                        {translationVisible
                            ? "−"
                            : "+"
                        }
                    </span>
                </button>
            ) : null}
        </header>
    );
}

interface StoryBackButtonProps {
    onBack: () => void;
}

function StoryBackButton({
    onBack
}: StoryBackButtonProps) {
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
/* Legacy paragraph story                                                      */
/* -------------------------------------------------------------------------- */

interface LegacyStoryProps {
    story:
        VocabStoryWithTitle;
    translationVisible:
        boolean;
    questionAnswers:
        Partial<
            Record<
                number,
                number
            >
        >;
    onAnswerQuestion:
        (
            questionIndex: number,
            optionIndex: number
        ) => void;
}

function LegacyStory({
    story,
    translationVisible,
    questionAnswers,
    onAnswerQuestion
}: LegacyStoryProps) {
    const {
        t
    } = useI18n();

    return (
        <>
            <Card
                className="
                    p-5
                    sm:p-6
                "
            >
                <div
                    className="
                        divide-y
                        divide-neutral-100
                    "
                >
                    {(
                        story.paragraphs
                        ?? []
                    ).map(
                        (
                            paragraph,
                            index
                        ) => (
                            <div
                                key={
                                    index
                                }
                                className="
                                    py-4
                                    first:pt-0
                                    last:pb-0
                                "
                            >
                                <p
                                    className="
                                        ltr-lock
                                        whitespace-pre-line
                                        text-base
                                        leading-8
                                        text-ink
                                    "
                                >
                                    {
                                        paragraph.fr
                                    }
                                </p>

                                {translationVisible
                                    && paragraph.fa ? (
                                    <p
                                        className="
                                            persian-text
                                            mt-2
                                            text-sm
                                            leading-7
                                            text-muted
                                        "
                                    >
                                        {
                                            paragraph.fa
                                        }
                                    </p>
                                ) : null}
                            </div>
                        )
                    )}
                </div>
            </Card>

            {story.keyWords?.length ? (
                <section
                    className="
                        mt-6
                    "
                >
                    <h2
                        className="
                            text-base
                            font-bold
                            text-ink
                        "
                    >
                        🔑
                        {" "}
                        {t(
                            "vocab.keywords"
                        )}
                    </h2>

                    <div
                        className="
                            mt-3
                            flex
                            flex-wrap
                            gap-2
                        "
                    >
                        {story.keyWords.map(
                            word => (
                                <span
                                    key={
                                        word
                                    }
                                    className="
                                        ltr-lock
                                        rounded-full
                                        bg-dino-50
                                        px-3
                                        py-1.5
                                        text-sm
                                        font-semibold
                                        text-dino-700
                                    "
                                >
                                    {word}
                                </span>
                            )
                        )}
                    </div>
                </section>
            ) : null}

            {story.questions?.length ? (
                <section
                    className="
                        mt-7
                    "
                >
                    <h2
                        className="
                            mb-4
                            text-base
                            font-bold
                            text-ink
                        "
                    >
                        ❓
                        {" "}
                        {t(
                            "vocab.comprehension"
                        )}
                    </h2>

                    <div
                        className="
                            grid
                            gap-3
                        "
                    >
                        {story.questions.map(
                            (
                                question,
                                questionIndex
                            ) => (
                                <StoryQuestion
                                    key={
                                        questionIndex
                                    }
                                    question={
                                        question
                                    }
                                    questionIndex={
                                        questionIndex
                                    }
                                    selectedAnswer={
                                        questionAnswers[
                                            questionIndex
                                        ]
                                    }
                                    onAnswer={
                                        onAnswerQuestion
                                    }
                                />
                            )
                        )}
                    </div>
                </section>
            ) : null}
        </>
    );
}

/* -------------------------------------------------------------------------- */
/* Legacy comprehension questions                                              */
/* -------------------------------------------------------------------------- */

interface StoryQuestionProps {
    question:
        VocabStoryQuestion;
    questionIndex:
        number;
    selectedAnswer:
        number | undefined;
    onAnswer:
        (
            questionIndex: number,
            optionIndex: number
        ) => void;
}

function StoryQuestion({
    question,
    questionIndex,
    selectedAnswer,
    onAnswer
}: StoryQuestionProps) {
    const answered =
        selectedAnswer
        !== undefined;

    return (
        <Card
            className="
                p-4
                sm:p-5
            "
        >
            <p
                className="
                    ltr-lock
                    text-[15px]
                    font-semibold
                    leading-6
                    text-ink
                "
            >
                {question.question}
            </p>

            <div
                className="
                    mt-3
                    grid
                    gap-2
                "
            >
                {question.options.map(
                    (
                        option,
                        optionIndex
                    ) => {
                        const state =
                            getStoryQuestionState(
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
                                    onAnswer(
                                        questionIndex,
                                        optionIndex
                                    );
                                }}
                                className={`
                                    ltr-lock
                                    rounded-control
                                    border
                                    px-3.5
                                    py-3
                                    text-left
                                    text-sm
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
        </Card>
    );
}

/* -------------------------------------------------------------------------- */
/* Fill-in-the-blank story                                                     */
/* -------------------------------------------------------------------------- */

interface BlankStoryProps {
    story:
        VocabStoryWithTitle;
    blanks:
        VocabStoryBlank[];
    answers:
        Array<number | null>;
    result:
        BlankStoryResult | null;
    translationVisible:
        boolean;
    onAnswer:
        (
            blankIndex: number,
            optionIndex: number
        ) => void;
    onCheck:
        () => void;
}

function BlankStory({
    story,
    blanks,
    answers,
    result,
    translationVisible,
    onAnswer,
    onCheck
}: BlankStoryProps) {
    const {
        t
    } = useI18n();

    return (
        <>
            <p
                className="
                    mb-4
                    text-sm
                    text-muted
                "
            >
                {t(
                    "vocab.fillBlanks"
                )}
            </p>

            <Card
                className="
                    ltr-lock
                    whitespace-pre-wrap
                    p-5
                    text-base
                    leading-9
                    sm:p-6
                "
            >
                <BlankStoryText
                    text={
                        story.text
                        ?? ""
                    }
                    blanks={
                        blanks
                    }
                    answers={
                        answers
                    }
                    showResult={
                        result
                        !== null
                    }
                />
            </Card>

            <div
                className="
                    mt-5
                    grid
                    gap-3
                "
            >
                {blanks.map(
                    (
                        blank,
                        blankIndex
                    ) => (
                        <BlankQuestion
                            key={
                                blank.id
                            }
                            blank={
                                blank
                            }
                            index={
                                blankIndex
                            }
                            selectedAnswer={
                                answers[
                                    blankIndex
                                ]
                                ?? null
                            }
                            showResult={
                                result
                                !== null
                            }
                            onAnswer={
                                onAnswer
                            }
                        />
                    )
                )}
            </div>

            <Button
                fullWidth
                className="
                    mt-4
                "
                onClick={
                    onCheck
                }
            >
                {t(
                    "vocab.checkAnswers"
                )}
            </Button>

            {result ? (
                <BlankResult
                    result={
                        result
                    }
                />
            ) : null}

            {story.text_fa
                && translationVisible ? (
                <div
                    className="
                        persian-text
                        mt-5
                        rounded-card
                        border
                        border-dino-300
                        bg-dino-50
                        p-5
                    "
                >
                    <h3
                        className="
                            text-base
                            font-bold
                            text-dino-700
                        "
                    >
                        📖
                        {" "}
                        {t(
                            "vocab.storyTranslation"
                        )}
                    </h3>

                    <p
                        className="
                            mt-3
                            whitespace-pre-line
                            text-[15px]
                            leading-8
                            text-neutral-700
                        "
                    >
                        {story.text_fa}
                    </p>
                </div>
            ) : null}
        </>
    );
}

/* -------------------------------------------------------------------------- */
/* Blank story text                                                            */
/* -------------------------------------------------------------------------- */

interface BlankStoryTextProps {
    text: string;
    blanks:
        VocabStoryBlank[];
    answers:
        Array<number | null>;
    showResult:
        boolean;
}

function BlankStoryText({
    text,
    blanks,
    answers,
    showResult
}: BlankStoryTextProps) {
    const parts =
        text.split(
            /{{BLANK_\d+}}/
        );

    const placeholders =
        text.match(
            /{{BLANK_\d+}}/g
        )
        ?? [];

    return (
        <>
            {parts.map(
                (
                    part,
                    index
                ) => {
                    const blank =
                        blanks[
                            index
                        ];

                    const answerIndex =
                        answers[
                            index
                        ];

                    const answer =
                        blank
                        && answerIndex
                            !== null
                        && answerIndex
                            !== undefined
                            ? blank.options[
                                answerIndex
                            ]
                            : undefined;

                    const correct =
                        Boolean(
                            blank
                            && answerIndex
                                === blank.correctIndex
                        );

                    return (
                        <Fragment
                            key={
                                index
                            }
                        >
                            {part}

                            {index
                                < placeholders.length ? (
                                <span
                                    className={`
                                        mx-1
                                        inline-block
                                        min-w-24
                                        rounded-control
                                        border-2
                                        border-dashed
                                        px-2.5
                                        py-0.5
                                        text-center
                                        text-sm
                                        font-semibold
                                        ${
                                            showResult
                                                ? correct
                                                    ? `
                                                        border-emerald-500
                                                        bg-emerald-50
                                                        text-emerald-800
                                                    `
                                                    : `
                                                        border-red-400
                                                        bg-red-50
                                                        text-red-800
                                                    `
                                                : `
                                                    border-dino-500
                                                    bg-dino-50
                                                    text-dino-700
                                                `
                                        }
                                    `}
                                >
                                    {answer
                                        ?? "___"
                                    }
                                </span>
                            ) : null}
                        </Fragment>
                    );
                }
            )}
        </>
    );
}

/* -------------------------------------------------------------------------- */
/* Blank choices                                                               */
/* -------------------------------------------------------------------------- */

interface BlankQuestionProps {
    blank:
        VocabStoryBlank;
    index: number;
    selectedAnswer:
        number | null;
    showResult:
        boolean;
    onAnswer:
        (
            blankIndex: number,
            optionIndex: number
        ) => void;
}

function BlankQuestion({
    blank,
    index,
    selectedAnswer,
    showResult,
    onAnswer
}: BlankQuestionProps) {
    return (
        <Card
            className="
                p-4
            "
        >
            <p
                className="
                    ltr-lock
                    text-sm
                    font-semibold
                    text-ink
                "
            >
                {index + 1}.
                {" "}
                ___
            </p>

            <div
                className="
                    mt-3
                    grid
                    grid-cols-2
                    gap-2
                "
            >
                {blank.options.map(
                    (
                        option,
                        optionIndex
                    ) => {
                        const selected =
                            selectedAnswer
                            === optionIndex;

                        const correct =
                            optionIndex
                            === blank.correctIndex;

                        let state:
                            AnswerState =
                                "default";

                        if (
                            showResult
                            && correct
                        ) {
                            state =
                                "correct";
                        } else if (
                            showResult
                            && selected
                            && !correct
                        ) {
                            state =
                                "incorrect";
                        } else if (
                            selected
                        ) {
                            state =
                                "selected";
                        }

                        return (
                            <button
                                key={
                                    optionIndex
                                }
                                type="button"
                                onClick={() => {
                                    onAnswer(
                                        index,
                                        optionIndex
                                    );
                                }}
                                className={`
                                    ltr-lock
                                    rounded-control
                                    border
                                    px-3
                                    py-2.5
                                    text-sm
                                    font-medium
                                    transition
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
        </Card>
    );
}

/* -------------------------------------------------------------------------- */
/* Blank result                                                                */
/* -------------------------------------------------------------------------- */

interface BlankResultProps {
    result:
        BlankStoryResult;
}

function BlankResult({
    result
}: BlankResultProps) {
    const {
        t
    } = useI18n();

    const presentation =
        getStoryResultPresentation(
            result.percentage,
            t
        );

    return (
        <div
            className="
                mt-4
                rounded-card
                border
                border-line
                bg-surface
                p-4
                text-center
            "
        >
            <div
                className="
                    text-2xl
                "
                aria-hidden="true"
            >
                {presentation.emoji}
            </div>

            <p
                className="
                    mt-2
                    font-bold
                    text-ink
                "
            >
                {result.correct}
                /
                {result.total}
                {" "}
                ({result.percentage}%)
            </p>

            <p
                className="
                    mt-1
                    text-sm
                    text-muted
                "
            >
                {presentation.message}
            </p>
        </div>
    );
}

/* -------------------------------------------------------------------------- */
/* Story resolution                                                           */
/* -------------------------------------------------------------------------- */

function resolveVocabularyStory(
    pack: VocabPack,
    difficulty:
        StoryDifficulty
): VocabStory | null {
    const fallback:
        StoryDifficulty =
            difficulty
                === "simple"
                ? "easy"
                : difficulty
                    === "literary"
                    ? "hard"
                    : difficulty;

    return (
        pack.stories?.[
            difficulty
        ]
        ?? pack.stories?.[
            fallback
        ]
        ?? null
    );
}

/* -------------------------------------------------------------------------- */
/* Evaluation                                                                 */
/* -------------------------------------------------------------------------- */

function evaluateBlankStory(
    blanks:
        readonly VocabStoryBlank[],
    answers:
        readonly (
            number | null
        )[]
): BlankStoryResult {
    const correct =
        blanks.reduce(
            (
                count,
                blank,
                index
            ) =>
                answers[
                    index
                ]
                === blank.correctIndex
                    ? count + 1
                    : count,
            0
        );

    const total =
        blanks.length;

    const percentage =
        Math.round(
            (
                correct
                / Math.max(
                    total,
                    1
                )
            )
            * 100
        );

    return {
        correct,
        total,
        percentage
    };
}

/* -------------------------------------------------------------------------- */
/* Answer presentation                                                        */
/* -------------------------------------------------------------------------- */

type AnswerState =
    | "default"
    | "selected"
    | "correct"
    | "incorrect";

function getStoryQuestionState(
    optionIndex: number,
    correctIndex: number,
    selectedAnswer:
        number | undefined
): AnswerState {
    if (
        selectedAnswer
        === undefined
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
        case "selected":
            return `
                border-dino-500
                bg-dino-50
                text-dino-800
            `;

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
/* Result presentation                                                        */
/* -------------------------------------------------------------------------- */

type TranslationFunction =
    ReturnType<
        typeof useI18n
    >["t"];

function getStoryResultPresentation(
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
                    "common.moreEffort"
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
    VocabularyStory,
    evaluateBlankStory,
    resolveVocabularyStory
};