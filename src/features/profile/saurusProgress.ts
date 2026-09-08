import type {
    LessonProgressSnapshot
} from "../../core/progressEngine.js";
import type {
    LearnerActivityReward
} from "../../services/backend/learningRewardRepository.js";

function countCompletedSaurusActivities(
    progress: readonly LessonProgressSnapshot[],
    rewards: readonly LearnerActivityReward[]
): number {
    const completedLessons = new Set(
        progress
            .filter(
                record =>
                    record.progress.status
                        === "completed"
            )
            .map(
                record =>
                    `${record.contentType}:${record.lessonId}`
            )
    );
    for (const reward of rewards) {
        completedLessons.add(
            reward.activity_type
                === "travel_lesson"
                ? `travel:${reward.activity_id}`
                : `reward:${reward.activity_type}:${reward.activity_id}`
        );
    }

    return completedLessons.size;
}

export {
    countCompletedSaurusActivities
};
