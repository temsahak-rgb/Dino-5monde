import type {
    ExerciseAttempt,
    ExerciseAttemptContentType,
    Level,
    MistakeRecord,
    VocabWeakMap
} from "../types/global.js";

const EXERCISE_REVIEW_TARGET = 80;

interface ReviewCatalogItem {
    href: string;
    icon: string;
    id: string;
    title: string;
    titleFa?: string;
}

interface MistakeReviewItem
    extends ReviewCatalogItem {
    count: number;
    lastMistakeAt: string;
}

interface WeakWordReviewItem
    extends ReviewCatalogItem {
    words: readonly string[];
}

interface ExerciseScoreReviewCatalogItem
    extends ReviewCatalogItem {
    contentType: ExerciseAttemptContentType;
    level?: Level;
}

interface ExerciseScoreReviewItem
    extends ExerciseScoreReviewCatalogItem {
    completedAt: string;
    correctAnswers: number;
    exerciseId: string;
    percentage: number;
    totalQuestions: number;
}

function buildMistakeReviewItems(
    mistakes: readonly MistakeRecord[],
    catalog: readonly ReviewCatalogItem[]
): MistakeReviewItem[] {
    const catalogById =
        new Map(
            catalog.map(item => [item.id, item])
        );

    const groups =
        new Map<string, MistakeReviewItem>();

    for (const mistake of mistakes) {
        if (
            !mistake
            || typeof mistake.lessonId !== "string"
            || typeof mistake.timestamp !== "string"
            || !Number.isFinite(
                Date.parse(mistake.timestamp)
            )
        ) {
            continue;
        }

        const source =
            catalogById.get(mistake.lessonId);

        if (!source) {
            continue;
        }

        const current =
            groups.get(mistake.lessonId);

        groups.set(
            mistake.lessonId,
            {
                ...source,
                count: (current?.count ?? 0) + 1,
                lastMistakeAt:
                    !current
                    || mistake.timestamp > current.lastMistakeAt
                        ? mistake.timestamp
                        : current.lastMistakeAt
            }
        );
    }

    return [...groups.values()].sort(
        (left, right) =>
            right.lastMistakeAt.localeCompare(
                left.lastMistakeAt
            )
    );
}

function buildWeakWordReviewItems(
    weakWords: VocabWeakMap,
    catalog: readonly ReviewCatalogItem[]
): WeakWordReviewItem[] {
    const catalogById =
        new Map(
            catalog.map(item => [item.id, item])
        );

    return Object.entries(weakWords)
        .flatMap(([packId, words]) => {
            const source =
                catalogById.get(packId);

            return source && words.length > 0
                ? [{
                    ...source,
                    words: [...new Set(words)]
                }]
                : [];
        })
        .sort(
            (left, right) =>
                right.words.length - left.words.length
        );
}

function buildExerciseScoreReviewItems(
    attempts: readonly ExerciseAttempt[],
    catalog:
        readonly ExerciseScoreReviewCatalogItem[],
    target = EXERCISE_REVIEW_TARGET
): ExerciseScoreReviewItem[] {
    if (
        !Number.isFinite(target)
        || target < 1
        || target > 100
    ) {
        throw new TypeError(
            "Invalid exercise review target"
        );
    }

    const catalogByIdentity =
        new Map(
            catalog.map(item => [
                createCatalogIdentity(
                    item.contentType,
                    item.id,
                    item.level
                ),
                item
            ])
        );
    const latestByExercise =
        new Map<string, ExerciseAttempt>();

    for (
        const attempt
        of [...attempts].sort(
            (left, right) =>
                Date.parse(right.completedAt)
                - Date.parse(left.completedAt)
        )
    ) {
        if (!isReviewableAttempt(attempt)) {
            continue;
        }

        const identity =
            createExerciseIdentity(attempt);

        if (!latestByExercise.has(identity)) {
            latestByExercise.set(
                identity,
                attempt
            );
        }
    }

    return [...latestByExercise.values()]
        .flatMap(attempt => {
            const percentage =
                Math.round(
                    (
                        attempt.correctAnswers
                        / attempt.totalQuestions
                    )
                    * 100
                );

            if (percentage >= target) {
                return [];
            }

            const source =
                catalogByIdentity.get(
                    createCatalogIdentity(
                        attempt.contentType,
                        attempt.activityId,
                        attempt.level
                    )
                );

            return source
                ? [{
                    ...source,
                    completedAt:
                        attempt.completedAt,
                    correctAnswers:
                        attempt.correctAnswers,
                    exerciseId:
                        attempt.exerciseId,
                    percentage,
                    totalQuestions:
                        attempt.totalQuestions
                }]
                : [];
        })
        .sort(
            (left, right) =>
                left.percentage
                - right.percentage
                || Date.parse(
                    right.completedAt
                )
                - Date.parse(
                    left.completedAt
                )
        );
}

function createCatalogIdentity(
    contentType: ExerciseAttemptContentType,
    activityId: string,
    level?: Level
): string {
    return [
        contentType,
        level ?? "",
        activityId
    ].join("\u0000");
}

function createExerciseIdentity(
    attempt: ExerciseAttempt
): string {
    return [
        createCatalogIdentity(
            attempt.contentType,
            attempt.activityId,
            attempt.level
        ),
        attempt.exerciseId
    ].join("\u0000");
}

function isReviewableAttempt(
    attempt: ExerciseAttempt
): boolean {
    return (
        typeof attempt.activityId === "string"
        && typeof attempt.exerciseId === "string"
        && attempt.activityId.length > 0
        && attempt.exerciseId.length > 0
        && Number.isInteger(
            attempt.correctAnswers
        )
        && Number.isInteger(
            attempt.totalQuestions
        )
        && attempt.totalQuestions > 0
        && attempt.correctAnswers >= 0
        && attempt.correctAnswers
            <= attempt.totalQuestions
        && Number.isFinite(
            Date.parse(attempt.completedAt)
        )
    );
}

export {
    EXERCISE_REVIEW_TARGET,
    buildExerciseScoreReviewItems,
    buildMistakeReviewItems,
    buildWeakWordReviewItems
};

export type {
    ExerciseScoreReviewCatalogItem,
    ExerciseScoreReviewItem,
    MistakeReviewItem,
    ReviewCatalogItem,
    WeakWordReviewItem
};
