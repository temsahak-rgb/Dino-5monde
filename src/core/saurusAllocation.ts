/** Shared product rules for learner Saurus identity and evolution. */
const saurusKeys = [
    "velociraptor-explorer",
    "triceratops-perseverant",
    "brachiosaurus-curious"
] as const;

type SaurusKey =
    typeof saurusKeys[number];

type SaurusPhase =
    | "hatchling"
    | "explorer"
    | "guide";

interface SaurusEvolution {
    completedActivities: number;
    currentThreshold: number;
    nextThreshold: number | null;
    phase: SaurusPhase;
    progressToNextPhase: number;
}

const saurusQuizQuestions = [
    {
        id: "new-lesson",
        promptKey: "saurus.quiz.question.newLesson",
        options: [
            {
                labelKey: "saurus.quiz.answer.explore",
                saurus: "velociraptor-explorer"
            },
            {
                labelKey: "saurus.quiz.answer.persist",
                saurus: "triceratops-perseverant"
            },
            {
                labelKey: "saurus.quiz.answer.understand",
                saurus: "brachiosaurus-curious"
            }
        ]
    },
    {
        id: "challenge",
        promptKey: "saurus.quiz.question.challenge",
        options: [
            {
                labelKey: "saurus.quiz.answer.try",
                saurus: "velociraptor-explorer"
            },
            {
                labelKey: "saurus.quiz.answer.steps",
                saurus: "triceratops-perseverant"
            },
            {
                labelKey: "saurus.quiz.answer.connect",
                saurus: "brachiosaurus-curious"
            }
        ]
    },
    {
        id: "session",
        promptKey: "saurus.quiz.question.session",
        options: [
            {
                labelKey: "saurus.quiz.answer.varied",
                saurus: "velociraptor-explorer"
            },
            {
                labelKey: "saurus.quiz.answer.regular",
                saurus: "triceratops-perseverant"
            },
            {
                labelKey: "saurus.quiz.answer.deep",
                saurus: "brachiosaurus-curious"
            }
        ]
    }
] as const;

function isSaurusKey(
    value: string
): value is SaurusKey {
    return saurusKeys.some(
        key => key === value
    );
}

/**
 * Applies the product allocation rules mirrored by the database RPC.
 *
 * Each answer gives one point to one Saurus. A majority wins. When all three
 * answers differ, the last question deliberately breaks the tie because it
 * captures the learner's preferred day-to-day rhythm.
 */
function recommendSaurus(
    answers: readonly SaurusKey[]
): SaurusKey {
    if (
        answers.length
            !== saurusQuizQuestions.length
        || answers.some(
            answer => !isSaurusKey(answer)
        )
    ) {
        throw new TypeError(
            "A complete Saurus quiz is required"
        );
    }

    const scores = new Map<SaurusKey, number>(
        saurusKeys.map(
            key => [key, 0]
        )
    );

    for (const answer of answers) {
        scores.set(
            answer,
            (scores.get(answer) ?? 0) + 1
        );
    }

    const finalAnswer =
        answers[answers.length - 1];

    if (!finalAnswer) {
        throw new TypeError(
            "A complete Saurus quiz is required"
        );
    }

    return [...saurusKeys]
        .sort(
            (left, right) => {
                const scoreDifference =
                    (scores.get(right) ?? 0)
                    - (scores.get(left) ?? 0);

                if (scoreDifference !== 0) {
                    return scoreDifference;
                }

                if (right === finalAnswer) {
                    return 1;
                }

                if (left === finalAnswer) {
                    return -1;
                }

                return saurusKeys.indexOf(left)
                    - saurusKeys.indexOf(right);
            }
        )[0]
        ?? finalAnswer;
}

/**
 * Derives the visual life phase from durable learning activity. The species
 * never changes: only its presentation progresses.
 */
function getSaurusEvolution(
    completedActivities: number
): SaurusEvolution {
    if (
        !Number.isInteger(completedActivities)
        || completedActivities < 0
    ) {
        throw new TypeError(
            "Completed activities must be a positive integer"
        );
    }

    if (completedActivities >= 15) {
        return {
            completedActivities,
            currentThreshold: 15,
            nextThreshold: null,
            phase: "guide",
            progressToNextPhase: 100
        };
    }

    if (completedActivities >= 5) {
        return {
            completedActivities,
            currentThreshold: 5,
            nextThreshold: 15,
            phase: "explorer",
            progressToNextPhase:
                completedActivities - 5
        };
    }

    return {
        completedActivities,
        currentThreshold: 0,
        nextThreshold: 5,
        phase: "hatchling",
        progressToNextPhase:
            completedActivities
    };
}

export {
    getSaurusEvolution,
    isSaurusKey,
    recommendSaurus,
    saurusKeys,
    saurusQuizQuestions
};

export type {
    SaurusEvolution,
    SaurusKey,
    SaurusPhase
};
