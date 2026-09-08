import {
    practiceLevels
} from "../../core/practiceRoutes.js";

import type {
    LessonProgressSnapshot
} from "../../core/progressEngine.js";
import type {
    LearnerActivityReward
} from "../../services/backend/learningRewardRepository.js";

type LearningProgressArea =
    | "games"
    | "grammar"
    | "travel";

interface LearningProgressMetric {
    area: LearningProgressArea;
    completed: number;
    total: number;
}

interface LearningProgressOverview {
    games: LearningProgressMetric;
    grammar: LearningProgressMetric;
    travel: LearningProgressMetric;
}

interface LearningProgressOverviewInput {
    grammarLessonIds: readonly string[];
    progress: readonly LessonProgressSnapshot[];
    rewards: readonly LearnerActivityReward[];
    travelLessonIds: readonly string[];
}

const gameActivityTypes = [
    "hangman_game",
    "word_search_game",
    "crossword_game"
] as const;

const eligibleGameRewardKeys =
    new Set(
        gameActivityTypes.flatMap(
            activityType =>
                practiceLevels.map(
                    level =>
                        `${activityType}:${level}`
                )
        )
    );

function createLearningProgressOverview({
    grammarLessonIds,
    progress,
    rewards,
    travelLessonIds
}: LearningProgressOverviewInput):
    LearningProgressOverview {
    const grammarIds =
        new Set(grammarLessonIds);
    const travelIds =
        new Set(travelLessonIds);

    return {
        games: {
            area: "games",
            completed:
                countGameRewards(rewards),
            total:
                eligibleGameRewardKeys.size
        },
        grammar: {
            area: "grammar",
            completed:
                countCompletedLessons(
                    progress,
                    "grammar",
                    grammarIds
                ),
            total:
                grammarIds.size
        },
        travel: {
            area: "travel",
            completed:
                countCompletedLessons(
                    progress,
                    "travel",
                    travelIds
                ),
            total:
                travelIds.size
        }
    };
}

function countCompletedLessons(
    progress: readonly LessonProgressSnapshot[],
    contentType: "grammar" | "travel",
    catalogIds: ReadonlySet<string>
): number {
    return new Set(
        progress
            .filter(
                record =>
                    record.contentType
                        === contentType
                    && record.progress.status
                        === "completed"
                    && catalogIds.has(
                        record.lessonId
                    )
            )
            .map(record => record.lessonId)
    ).size;
}

function countGameRewards(
    rewards: readonly LearnerActivityReward[]
): number {
    return new Set(
        rewards
            .map(
                reward =>
                    `${reward.activity_type}:${reward.activity_id}`
            )
            .filter(
                key =>
                    eligibleGameRewardKeys.has(
                        key
                    )
            )
    ).size;
}

export {
    createLearningProgressOverview
};

export type {
    LearningProgressArea,
    LearningProgressMetric,
    LearningProgressOverview,
    LearningProgressOverviewInput
};
