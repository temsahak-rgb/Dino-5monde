import assert from "node:assert/strict";
import test from "node:test";

import {
    completeLearningGame,
    startLearningGame
} from "../../src/services/backend/learningGameRepository.js";
import type {
    DinoBackendClient
} from "../../src/services/backend/supabaseClient.js";

const attemptId =
    "11111111-1111-4111-8111-111111111111";
const startedAt =
    "2026-09-08T20:00:00.000Z";
const completedAt =
    "2026-09-08T20:03:00.000Z";

test(
    "game attempt requests carry only the typed game identity and server id",
    async () => {
        const calls:
            Array<{
                args: unknown;
                name: string;
            }> = [];
        const client = {
            rpc: async (
                name: string,
                args: unknown
            ) => {
                calls.push({ args, name });

                return {
                    data: [
                        {
                            activity_id: "A1",
                            activity_type:
                                "hangman_game",
                            attempt_id: attemptId,
                            completed_at:
                                name === "complete_learning_game"
                                    ? completedAt
                                    : null,
                            pack_id:
                                "salutations_expressions_quotidiennes",
                            started_at: startedAt
                        }
                    ],
                    error: null
                };
            }
        } as unknown as DinoBackendClient;

        assert.deepEqual(
            await startLearningGame(
                client,
                "hangman_game",
                "A1",
                "salutations_expressions_quotidiennes"
            ),
            {
                activityId: "A1",
                activityType: "hangman_game",
                attemptId,
                completedAt: null,
                packId:
                    "salutations_expressions_quotidiennes",
                startedAt
            }
        );
        assert.deepEqual(
            await completeLearningGame(
                client,
                attemptId
            ),
            {
                activityId: "A1",
                activityType: "hangman_game",
                attemptId,
                completedAt,
                packId:
                    "salutations_expressions_quotidiennes",
                startedAt
            }
        );
        assert.deepEqual(
            calls,
            [
                {
                    args: {
                        p_activity_id: "A1",
                        p_activity_type:
                            "hangman_game",
                        p_pack_id:
                            "salutations_expressions_quotidiennes"
                    },
                    name: "start_learning_game"
                },
                {
                    args: {
                        p_attempt_id: attemptId
                    },
                    name: "complete_learning_game"
                }
            ]
        );
    }
);

test(
    "malformed game identities and attempt ids never reach Supabase",
    async () => {
        let calls = 0;
        const client = {
            rpc: async () => {
                calls += 1;
                return {
                    data: [],
                    error: null
                };
            }
        } as unknown as DinoBackendClient;

        await assert.rejects(
            startLearningGame(
                client,
                "crossword_game",
                "C2",
                " invalid-pack"
            ),
            TypeError
        );
        await assert.rejects(
            completeLearningGame(
                client,
                "not-an-attempt-id"
            ),
            TypeError
        );
        assert.equal(calls, 0);
    }
);
