import type {
    ExerciseAttempt
} from "../../types/global.js";

interface ExerciseAttemptSummary {
    attemptCount: number;
    averagePercentage: number;
    bestPercentage: number;
    recentAttempts: ExerciseAttempt[];
}

function summarizeExerciseAttempts(
    attempts: readonly ExerciseAttempt[],
    recentLimit = 3
): ExerciseAttemptSummary {
    const ordered =
        [...attempts].sort(
            (left, right) =>
                right.completedAt.localeCompare(
                    left.completedAt
                )
        );
    const totalCorrect =
        ordered.reduce(
            (
                total,
                attempt
            ) =>
                total
                + attempt.correctAnswers,
            0
        );
    const totalQuestions =
        ordered.reduce(
            (
                total,
                attempt
            ) =>
                total
                + attempt.totalQuestions,
            0
        );
    const percentages =
        ordered.map(
            attempt =>
                toPercentage(
                    attempt.correctAnswers,
                    attempt.totalQuestions
                )
        );

    return {
        attemptCount:
            ordered.length,
        averagePercentage:
            totalQuestions > 0
                ? toPercentage(
                    totalCorrect,
                    totalQuestions
                )
                : 0,
        bestPercentage:
            percentages.length > 0
                ? Math.max(...percentages)
                : 0,
        recentAttempts:
            ordered.slice(
                0,
                Math.max(
                    0,
                    recentLimit
                )
            )
    };
}

function toPercentage(
    correct: number,
    total: number
): number {
    return Math.round(
        (
            correct
            / Math.max(total, 1)
        )
        * 100
    );
}

export {
    summarizeExerciseAttempts,
    toPercentage
};

export type {
    ExerciseAttemptSummary
};
