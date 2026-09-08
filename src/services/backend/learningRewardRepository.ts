import type {
    LearnerActivityRewardRow,
    LearningActivityType,
    LearningRewardRuleRow
} from "./database.types.js";

import type {
    DinoBackendClient
} from "./supabaseClient.js";

type LearningRewardRule = Pick<
    LearningRewardRuleRow,
    | "activity_id"
    | "activity_type"
    | "reward_credits"
>;

type LearnerActivityReward = Pick<
    LearnerActivityRewardRow,
    | "activity_id"
    | "activity_type"
    | "awarded_at"
    | "credits_awarded"
>;

interface ClaimLearningRewardResult {
    activityId: string;
    activityType: LearningActivityType;
    awarded: boolean;
    awardedAt: string;
    balance: number;
    creditsAwarded: number;
}

const learningRewardRuleProjection =
    "activity_id,activity_type,reward_credits";
const learnerActivityRewardProjection =
    "activity_id,activity_type,awarded_at,credits_awarded";

async function loadLearningRewardRules(
    client: DinoBackendClient
): Promise<LearningRewardRule[]> {
    const {
        data,
        error
    } = await client
        .from(
            "learning_reward_rules"
        )
        .select(
            learningRewardRuleProjection
        )
        .eq(
            "active",
            true
        )
        .order(
            "activity_type",
            { ascending: true }
        )
        .order(
            "activity_id",
            { ascending: true }
        );

    if (error) {
        throw error;
    }

    return data;
}

async function loadLearnerActivityRewards(
    client: DinoBackendClient,
    userId: string
): Promise<LearnerActivityReward[]> {
    const {
        data,
        error
    } = await client
        .from(
            "learner_activity_rewards"
        )
        .select(
            learnerActivityRewardProjection
        )
        .eq(
            "user_id",
            userId
        )
        .order(
            "awarded_at",
            { ascending: false }
        );

    if (error) {
        throw error;
    }

    return data;
}

async function claimLearningReward(
    client: DinoBackendClient,
    activityType: LearningActivityType,
    activityId: string
): Promise<ClaimLearningRewardResult> {
    assertLearningActivity(
        activityType,
        activityId
    );

    const {
        data,
        error
    } = await client.rpc(
        "claim_learning_reward",
        {
            p_activity_id:
                activityId,
            p_activity_type:
                activityType
        }
    );

    if (error) {
        throw error;
    }

    const result =
        data[0];

    if (!result) {
        throw new Error(
            "Learning reward returned no result"
        );
    }

    return {
        activityId:
            result.activity_id,
        activityType:
            result.activity_type,
        awarded:
            result.awarded,
        awardedAt:
            result.awarded_at,
        balance:
            result.credits_remaining,
        creditsAwarded:
            result.credits_awarded
    };
}

function assertLearningActivity(
    activityType: LearningActivityType,
    activityId: string
): void {
    const gameActivity =
        activityType === "hangman_game"
        || activityType === "word_search_game"
        || activityType === "crossword_game";

    if (
        (
            activityType !== "travel_lesson"
            && !gameActivity
        )
        || activityId.length === 0
        || activityId.length > 160
        || activityId.trim()
            !== activityId
        || /[\u0000-\u001f\u007f]/u.test(
            activityId
        )
        || (
            gameActivity
            && ![
                "A1",
                "A2",
                "B1",
                "B2",
                "C1",
                "C2"
            ].includes(activityId)
        )
    ) {
        throw new TypeError(
            "Invalid learning activity"
        );
    }
}

function createLearningRewardKey(
    activityType: LearningActivityType,
    activityId: string
): string {
    assertLearningActivity(
        activityType,
        activityId
    );

    return `${activityType}:${activityId}`;
}

export {
    claimLearningReward,
    createLearningRewardKey,
    loadLearnerActivityRewards,
    loadLearningRewardRules,
    type ClaimLearningRewardResult,
    type LearnerActivityReward,
    type LearningActivityType,
    type LearningRewardRule
};
