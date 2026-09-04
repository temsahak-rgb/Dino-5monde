import {
    useEffect,
    useRef,
    useState
} from "react";

import {
    answerPlacement,
    getEstimatedLevelRange,
    getNextQuestion,
    getPlacementState,
    loadPlacementQuestions,
    resetPlacementState,
    savePlacementResult
} from "../../core/placementEngine.js";

import {
    useI18n
} from "../../i18n/I18nProvider.js";

import type {
    Language,
    Level,
    PathId,
    PlacementLevelEstimate,
    PlacementQuestion
} from "../../types/global.js";

import {
    Button,
    Card,
    ProgressBar
} from "../../ui/components/Controls.js";

import {
    LoadingState
} from "../../ui/components/Feedback.js";

type OnboardingStep =
    | "language"
    | "path"
    | "placement-choice"
    | "placement-question"
    | "placement-result"
    | "manual-level";

interface OnboardingFlowProps {
    onComplete: () => void;
}

interface PlacementFeedback {
    selectedIndex: number | null;
    correctIndex: number;
    unknown: boolean;
}

const selectableLevels:
    readonly Level[] = [
        "A1",
        "A2",
        "B1",
        "B2",
        "C1"
    ];

/**
 * Complete React onboarding flow.
 *
 * The placement engine remains framework-agnostic. React owns only transient
 * screen state and presentation.
 */
function OnboardingFlow({
    onComplete
}: OnboardingFlowProps) {
    const {
        language,
        setLanguage,
        t
    } = useI18n();

    const [
        step,
        setStep
    ] = useState<OnboardingStep>(
        () =>
            hasPersistedLanguage()
                ? "path"
                : "language"
    );

    const [
        placementReady,
        setPlacementReady
    ] = useState(false);

    const [
        question,
        setQuestion
    ] =
        useState<PlacementQuestion | null>(
            null
        );

    const [
        result,
        setResult
    ] =
        useState<PlacementLevelEstimate | null>(
            null
        );

    const [
        feedback,
        setFeedback
    ] =
        useState<PlacementFeedback | null>(
            null
        );

    const timeoutRef =
        useRef<number | null>(
            null
        );

    useEffect(
        () => {
            let active = true;

            void loadPlacementQuestions()
                .finally(
                    () => {
                        if (active) {
                            setPlacementReady(
                                true
                            );
                        }
                    }
                );

            return () => {
                active = false;
            };
        },
        []
    );

    useEffect(
        () => {
            return () => {
                if (
                    timeoutRef.current
                    !== null
                ) {
                    window.clearTimeout(
                        timeoutRef.current
                    );
                }
            };
        },
        []
    );

    function selectInterfaceLanguage(
        nextLanguage: Language
    ): void {
        setLanguage(
            nextLanguage
        );

        setStep(
            "path"
        );
    }

    function selectLearningPath(
        path: PathId
    ): void {
        localStorage.setItem(
            "currentPath",
            path
        );

        onComplete();
    }

    function startPlacement(): void {
        resetPlacementState();

        setFeedback(
            null
        );

        showNextQuestion();
    }

    function showNextQuestion(): void {
        const nextQuestion =
            getNextQuestion();

        if (!nextQuestion) {
            const estimate =
                getEstimatedLevelRange();

            setResult(
                estimate
            );

            setQuestion(
                null
            );

            setStep(
                "placement-result"
            );

            return;
        }

        setQuestion(
            nextQuestion
        );

        setStep(
            "placement-question"
        );
    }

    function submitAnswer(
        selectedIndex: number
    ): void {
        if (
            !question
            || feedback
        ) {
            return;
        }

        const correct =
            selectedIndex
            === question.correctIndex;

        answerPlacement(
            correct
        );

        setFeedback({
            selectedIndex,
            correctIndex:
                question.correctIndex,
            unknown: false
        });

        scheduleNextQuestion();
    }

    function submitUnknown(): void {
        if (
            !question
            || feedback
        ) {
            return;
        }

        answerPlacement(
            null
        );

        setFeedback({
            selectedIndex: null,
            correctIndex:
                question.correctIndex,
            unknown: true
        });

        scheduleNextQuestion();
    }

    function scheduleNextQuestion(): void {
        if (
            timeoutRef.current
            !== null
        ) {
            window.clearTimeout(
                timeoutRef.current
            );
        }

        timeoutRef.current =
            window.setTimeout(
                () => {
                    timeoutRef.current =
                        null;

                    setFeedback(
                        null
                    );

                    showNextQuestion();
                },
                1500
            );
    }

    function acceptEstimatedLevel(): void {
        if (!result) {
            return;
        }

        savePlacementResult(
            result.level
        );

        selectLearningPath(
            "general"
        );
    }

    function selectManualLevel(
        level: Level
    ): void {
        savePlacementResult(
            level
        );

        selectLearningPath(
            "general"
        );
    }

    switch (step) {
        case "language":
            return (
                <LanguageStep
                    onSelect={
                        selectInterfaceLanguage
                    }
                />
            );

        case "path":
            return (
                <PathStep
                    onBack={() => {
                        setStep(
                            "language"
                        );
                    }}
                    onGeneral={() => {
                        setStep(
                            "placement-choice"
                        );
                    }}
                    onTravel={() => {
                        selectLearningPath(
                            "travel"
                        );
                    }}
                />
            );

        case "placement-choice":
            return (
                <PlacementChoiceStep
                    ready={
                        placementReady
                    }
                    onBack={() => {
                        setStep(
                            "path"
                        );
                    }}
                    onStart={
                        startPlacement
                    }
                    onLater={() => {
                        selectLearningPath(
                            "general"
                        );
                    }}
                />
            );

        case "placement-question":
            if (!question) {
                return (
                    <LoadingState
                        label={
                            t(
                                "common.loading"
                            )
                        }
                    />
                );
            }

            return (
                <PlacementQuestionStep
                    question={
                        question
                    }
                    feedback={
                        feedback
                    }
                    onAnswer={
                        submitAnswer
                    }
                    onUnknown={
                        submitUnknown
                    }
                />
            );

        case "placement-result":
            if (!result) {
                return (
                    <LoadingState
                        label={
                            t(
                                "common.loading"
                            )
                        }
                    />
                );
            }

            return (
                <PlacementResultStep
                    result={
                        result
                    }
                    onAccept={
                        acceptEstimatedLevel
                    }
                    onChange={() => {
                        setStep(
                            "manual-level"
                        );
                    }}
                />
            );

        case "manual-level":
            return (
                <ManualLevelStep
                    onSelect={
                        selectManualLevel
                    }
                />
            );
    }
}

/* -------------------------------------------------------------------------- */
/* Language                                                                    */
/* -------------------------------------------------------------------------- */

interface LanguageStepProps {
    onSelect:
        (language: Language) => void;
}

function LanguageStep({
    onSelect
}: LanguageStepProps) {
    const {
        t
    } = useI18n();

    return (
        <OnboardingContainer>
            <DinoMark />

            <h1
                className="
                    text-center
                    text-2xl
                    font-bold
                "
            >
                {t("app.title")}
            </h1>

            <p
                className="
                    mt-2
                    text-center
                    text-sm
                    text-muted
                "
            >
                {t(
                    "onboarding.chooseLanguage"
                )}
            </p>

            <div
                className="
                    mt-8
                    grid
                    gap-3
                "
            >
                <Button
                    variant="secondary"
                    fullWidth
                    className="
                        justify-start
                        text-base
                    "
                    onClick={() => {
                        onSelect(
                            "fr"
                        );
                    }}
                >
                    <span aria-hidden="true">
                        🇫🇷
                    </span>

                    {t(
                        "onboarding.french"
                    )}
                </Button>

                <Button
                    variant="secondary"
                    fullWidth
                    className="
                        justify-start
                        text-base
                    "
                    onClick={() => {
                        onSelect(
                            "fa"
                        );
                    }}
                >
                    <span aria-hidden="true">
                        🇮🇷
                    </span>

                    {t(
                        "onboarding.persian"
                    )}
                </Button>
            </div>
        </OnboardingContainer>
    );
}

/* -------------------------------------------------------------------------- */
/* Learning path                                                               */
/* -------------------------------------------------------------------------- */

interface PathStepProps {
    onBack: () => void;
    onGeneral: () => void;
    onTravel: () => void;
}

function PathStep({
    onBack,
    onGeneral,
    onTravel
}: PathStepProps) {
    const {
        t
    } = useI18n();

    return (
        <OnboardingContainer>
            <DinoMark />

            <OnboardingBackButton
                onClick={
                    onBack
                }
            />

            <h1
                className="
                    text-xl
                    font-bold
                "
            >
                {t(
                    "onboarding.choosePath"
                )}
            </h1>

            <div
                className="
                    mt-6
                    grid
                    gap-3
                "
            >
                <Button
                    variant="secondary"
                    fullWidth
                    className="
                        justify-start
                        text-base
                    "
                    onClick={
                        onGeneral
                    }
                >
                    🇫🇷
                    {t(
                        "onboarding.general"
                    )}
                </Button>

                <Button
                    variant="secondary"
                    fullWidth
                    className="
                        justify-start
                        text-base
                    "
                    onClick={
                        onTravel
                    }
                >
                    ✈️
                    {t(
                        "onboarding.travel"
                    )}
                </Button>
            </div>
        </OnboardingContainer>
    );
}

/* -------------------------------------------------------------------------- */
/* Placement choice                                                            */
/* -------------------------------------------------------------------------- */

interface PlacementChoiceStepProps {
    ready: boolean;
    onBack: () => void;
    onStart: () => void;
    onLater: () => void;
}

function PlacementChoiceStep({
    ready,
    onBack,
    onStart,
    onLater
}: PlacementChoiceStepProps) {
    const {
        t
    } = useI18n();

    return (
        <OnboardingContainer>
            <DinoMark />

            <OnboardingBackButton
                onClick={
                    onBack
                }
            />

            <h1
                className="
                    text-xl
                    font-bold
                "
            >
                {t(
                    "onboarding.general"
                )}
            </h1>

            <p
                className="
                    mt-2
                    text-sm
                    leading-6
                    text-muted
                "
            >
                {t(
                    "onboarding.levelQuestion"
                )}
            </p>

            <div
                className="
                    mt-7
                    grid
                    gap-3
                "
            >
                <Button
                    fullWidth
                    disabled={
                        !ready
                    }
                    onClick={
                        onStart
                    }
                >
                    {ready
                        ? t(
                            "onboarding.startTest"
                        )
                        : t(
                            "common.loading"
                        )
                    }
                </Button>

                <Button
                    variant="secondary"
                    fullWidth
                    onClick={
                        onLater
                    }
                >
                    {t(
                        "onboarding.later"
                    )}
                </Button>
            </div>
        </OnboardingContainer>
    );
}

/* -------------------------------------------------------------------------- */
/* Placement question                                                          */
/* -------------------------------------------------------------------------- */

interface PlacementQuestionStepProps {
    question: PlacementQuestion;
    feedback:
        PlacementFeedback | null;

    onAnswer:
        (index: number) => void;

    onUnknown: () => void;
}

function PlacementQuestionStep({
    question,
    feedback,
    onAnswer,
    onUnknown
}: PlacementQuestionStepProps) {
    const {
        t
    } = useI18n();

    const askedCount =
        getPlacementState()
            .asked
            .length;

    const progress =
        (
            askedCount
            / 15
        )
        * 100;

    return (
        <div
            className="
                mx-auto
                w-full
                max-w-[600px]
                px-4
                py-8
            "
        >
            <div
                className="
                    mb-5
                    text-center
                    text-4xl
                "
                aria-hidden="true"
            >
                🦖
            </div>

            <ProgressBar
                value={
                    progress
                }
                max={100}
            />

            <Card
                className="
                    mt-6
                    p-6
                    sm:p-8
                "
            >
                <p
                    className="
                        ltr-lock
                        text-lg
                        font-medium
                        leading-7
                    "
                >
                    {question.question}
                </p>

                <div
                    className="
                        mt-6
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
                                getOptionState(
                                    index,
                                    feedback
                                );

                            return (
                                <button
                                    key={
                                        `${question.id}-${index}`
                                    }
                                    type="button"
                                    disabled={
                                        feedback
                                        !== null
                                    }
                                    onClick={() => {
                                        onAnswer(
                                            index
                                        );
                                    }}
                                    className={`
                                        ltr-lock
                                        w-full
                                        rounded-control
                                        border
                                        px-4
                                        py-3
                                        text-left
                                        text-sm
                                        font-medium
                                        transition
                                        disabled:cursor-default
                                        ${getOptionClasses(
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

                <button
                    type="button"
                    disabled={
                        feedback
                        !== null
                    }
                    onClick={
                        onUnknown
                    }
                    className={`
                        mt-4
                        w-full
                        rounded-control
                        border
                        px-4
                        py-3
                        text-sm
                        font-bold
                        transition
                        disabled:cursor-default
                        ${
                            feedback?.unknown
                                ? `
                                    border-red-300
                                    bg-danger-soft
                                    text-danger
                                `
                                : `
                                    border-danger
                                    bg-surface
                                    text-danger
                                    hover:bg-danger-soft
                                `
                        }
                    `}
                >
                    {t(
                        "onboarding.dontKnow"
                    )}
                </button>
            </Card>
        </div>
    );
}

type OptionState =
    | "default"
    | "correct"
    | "incorrect";

function getOptionState(
    index: number,
    feedback:
        PlacementFeedback | null
): OptionState {
    if (!feedback) {
        return "default";
    }

    if (
        index
        === feedback.correctIndex
    ) {
        return "correct";
    }

    if (
        index
        === feedback.selectedIndex
    ) {
        return "incorrect";
    }

    return "default";
}

function getOptionClasses(
    state: OptionState
): string {
    switch (state) {
        case "correct":
            return `
                border-dino-400
                bg-dino-100
                text-dino-900
            `;

        case "incorrect":
            return `
                border-red-400
                bg-danger-soft
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
/* Placement result                                                            */
/* -------------------------------------------------------------------------- */

interface PlacementResultStepProps {
    result:
        PlacementLevelEstimate;

    onAccept: () => void;
    onChange: () => void;
}

function PlacementResultStep({
    result,
    onAccept,
    onChange
}: PlacementResultStepProps) {
    const {
        t
    } = useI18n();

    return (
        <OnboardingContainer
            centered
        >
            <DinoMark />

            <h1
                className="
                    text-2xl
                    font-bold
                "
            >
                🎉
                {" "}
                {t(
                    "onboarding.finalResult"
                )}
            </h1>

            <p
                className="
                    mt-4
                    text-sm
                    text-muted
                "
            >
                {t(
                    "onboarding.yourLevel"
                )}
            </p>

            <div
                className="
                    ltr-lock
                    mt-3
                    text-center
                    text-5xl
                    font-extrabold
                    text-dino-600
                "
            >
                {result.range}
            </div>

            <p
                className="
                    mt-2
                    text-base
                    font-bold
                    text-dino-700
                "
            >
                {getLevelLabel(
                    result.level,
                    t
                )}
            </p>

            <p
                className="
                    mt-5
                    text-sm
                    leading-6
                    text-muted
                "
            >
                {t(
                    "onboarding.canModify"
                )}
            </p>

            <div
                className="
                    mt-7
                    grid
                    w-full
                    gap-3
                "
            >
                <Button
                    fullWidth
                    onClick={
                        onAccept
                    }
                >
                    {t(
                        "onboarding.acceptLevel"
                    )}
                </Button>

                <Button
                    variant="secondary"
                    fullWidth
                    onClick={
                        onChange
                    }
                >
                    {t(
                        "onboarding.changeLevel"
                    )}
                </Button>
            </div>
        </OnboardingContainer>
    );
}

/* -------------------------------------------------------------------------- */
/* Manual level                                                                */
/* -------------------------------------------------------------------------- */

interface ManualLevelStepProps {
    onSelect:
        (level: Level) => void;
}

function ManualLevelStep({
    onSelect
}: ManualLevelStepProps) {
    const {
        t
    } = useI18n();

    return (
        <OnboardingContainer
            centered
        >
            <DinoMark />

            <h1
                className="
                    text-xl
                    font-bold
                "
            >
                {t(
                    "onboarding.chooseYourLevel"
                )}
            </h1>

            <div
                className="
                    mt-7
                    grid
                    w-full
                    gap-3
                "
            >
                {selectableLevels.map(
                    level => (
                        <Button
                            key={
                                level
                            }
                            variant="secondary"
                            fullWidth
                            className="
                                justify-between
                            "
                            onClick={() => {
                                onSelect(
                                    level
                                );
                            }}
                        >
                            <strong
                                className="
                                    ltr-lock
                                    text-lg
                                    text-dino-700
                                "
                            >
                                {level}
                            </strong>

                            <span
                                className="
                                    text-sm
                                    text-muted
                                "
                            >
                                {getLevelLabel(
                                    level,
                                    t
                                )}
                            </span>
                        </Button>
                    )
                )}
            </div>
        </OnboardingContainer>
    );
}

/* -------------------------------------------------------------------------- */
/* Shared                                                                      */
/* -------------------------------------------------------------------------- */

interface OnboardingContainerProps {
    children:
        React.ReactNode;

    centered?: boolean;
}

function OnboardingContainer({
    children,
    centered = false
}: OnboardingContainerProps) {
    return (
        <div
            className={`
                mx-auto
                w-full
                max-w-[400px]
                px-4
                py-14
                ${
                    centered
                        ? "text-center"
                        : ""
                }
            `}
        >
            {children}
        </div>
    );
}

function DinoMark() {
    return (
        <div
            className="
                mb-5
                text-center
                text-6xl
                leading-none
            "
            aria-hidden="true"
        >
            🦖
        </div>
    );
}

interface OnboardingBackButtonProps {
    onClick: () => void;
}

function OnboardingBackButton({
    onClick
}: OnboardingBackButtonProps) {
    const {
        t
    } = useI18n();

    return (
        <button
            type="button"
            onClick={
                onClick
            }
            className="
                mb-5
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
            {t("common.back")}
        </button>
    );
}

type TranslationFunction =
    ReturnType<
        typeof useI18n
    >["t"];

function getLevelLabel(
    level: Level,
    t: TranslationFunction
): string {
    const keys = {
        A1: "grammar.level.A1",
        A2: "grammar.level.A2",
        B1: "grammar.level.B1",
        B2: "grammar.level.B2",
        C1: "grammar.level.C1",
        C2: "grammar.level.C2"
    } as const;

    return t(
        keys[level]
    );
}

function hasPersistedLanguage(): boolean {
    const language =
        localStorage.getItem(
            "language"
        );

    return (
        language === "fr"
        || language === "fa"
    );
}

export {
    OnboardingFlow
};