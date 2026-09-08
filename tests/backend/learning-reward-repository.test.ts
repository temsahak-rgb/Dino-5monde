import assert from "node:assert/strict";
import test from "node:test";

import {
    claimLearningReward,
    createLearningRewardKey,
    loadLearnerActivityRewards,
    loadLearningRewardRules
} from "../../src/services/backend/learningRewardRepository.js";
import type {
    DinoBackendClient
} from "../../src/services/backend/supabaseClient.js";

test(
    "learning rewards load only active rules and the current learner claims",
    async () => {
        const calls: unknown[][] = [];
        const rule = {
            activity_id: "TR-006",
            activity_type:
                "travel_lesson" as const,
            reward_credits: 5
        };
        const reward = {
            activity_id: "TR-006",
            activity_type:
                "travel_lesson" as const,
            awarded_at:
                "2026-09-08T10:00:00.000Z",
            credits_awarded: 5
        };

        function createQuery(
            table: string
        ) {
            const query = {
                data:
                    table
                        === "learning_reward_rules"
                        ? [rule]
                        : [reward],
                error: null,
                eq: (
                    field: string,
                    value: unknown
                ) => {
                    calls.push([
                        table,
                        "eq",
                        field,
                        value
                    ]);
                    return query;
                },
                order: (
                    field: string,
                    options: unknown
                ) => {
                    calls.push([
                        table,
                        "order",
                        field,
                        options
                    ]);
                    return query;
                },
                select: (
                    columns: string
                ) => {
                    calls.push([
                        table,
                        "select",
                        columns
                    ]);
                    return query;
                }
            };

            return query;
        }

        const client = {
            from: (table: string) =>
                createQuery(table)
        } as unknown as DinoBackendClient;

        assert.deepEqual(
            await loadLearningRewardRules(
                client
            ),
            [rule]
        );
        assert.deepEqual(
            await loadLearnerActivityRewards(
                client,
                "learner-id"
            ),
            [reward]
        );
        assert.deepEqual(
            calls,
            [
                [
                    "learning_reward_rules",
                    "select",
                    "activity_id,activity_type,reward_credits"
                ],
                [
                    "learning_reward_rules",
                    "eq",
                    "active",
                    true
                ],
                [
                    "learning_reward_rules",
                    "order",
                    "activity_type",
                    { ascending: true }
                ],
                [
                    "learning_reward_rules",
                    "order",
                    "activity_id",
                    { ascending: true }
                ],
                [
                    "learner_activity_rewards",
                    "select",
                    "activity_id,activity_type,awarded_at,credits_awarded"
                ],
                [
                    "learner_activity_rewards",
                    "eq",
                    "user_id",
                    "learner-id"
                ],
                [
                    "learner_activity_rewards",
                    "order",
                    "awarded_at",
                    { ascending: false }
                ]
            ]
        );
    }
);

test(
    "reward claims send no browser-controlled amount and expose a stable result",
    async () => {
        const calls: unknown[] = [];
        const client = {
            rpc: async (
                name: string,
                args: unknown
            ) => {
                calls.push({
                    args,
                    name
                });

                return {
                    data: [
                        {
                            activity_id:
                                "TR-006",
                            activity_type:
                                "travel_lesson",
                            awarded: true,
                            awarded_at:
                                "2026-09-08T10:00:00.000Z",
                            credits_awarded: 5,
                            credits_remaining: 105
                        }
                    ],
                    error: null
                };
            }
        } as unknown as DinoBackendClient;

        assert.deepEqual(
            await claimLearningReward(
                client,
                "travel_lesson",
                "TR-006"
            ),
            {
                activityId: "TR-006",
                activityType:
                    "travel_lesson",
                awarded: true,
                awardedAt:
                    "2026-09-08T10:00:00.000Z",
                balance: 105,
                creditsAwarded: 5
            }
        );
        assert.deepEqual(
            calls,
            [
                {
                    args: {
                        p_activity_id:
                            "TR-006",
                        p_activity_type:
                            "travel_lesson"
                    },
                    name:
                        "claim_learning_reward"
                }
            ]
        );
        assert.equal(
            createLearningRewardKey(
                "travel_lesson",
                "TR-006"
            ),
            "travel_lesson:TR-006"
        );
        await assert.rejects(
            claimLearningReward(
                client,
                "travel_lesson",
                " TR-006"
            ),
            TypeError
        );
    }
);
