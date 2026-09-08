import assert from "node:assert/strict";
import test from "node:test";

import {
    loadRemoteExerciseAttempts,
    syncRemoteExerciseAttempt
} from "../../src/services/backend/exerciseAttemptRepository.js";
import type {
    DinoBackendClient
} from "../../src/services/backend/supabaseClient.js";
import type {
    ExerciseAttempt
} from "../../src/types/global.js";

const localAttempt: ExerciseAttempt = {
    activityId: "A1-G-001",
    attemptId:
        "11111111-1111-4111-8111-111111111111",
    completedAt: "2026-09-08T10:00:00.000Z",
    contentType: "grammar",
    correctAnswers: 4,
    exerciseId: "practice",
    totalQuestions: 5
};

const remoteAttempt = {
    activity_id: "A1-G-001",
    completed_at: "2026-09-08T10:00:00.000Z",
    content_type: "grammar" as const,
    correct_answers: 4,
    exercise_id: "practice",
    id: "11111111-1111-4111-8111-111111111111",
    level: null,
    total_questions: 5
};

test(
    "exercise attempts load only the authenticated learner history",
    async () => {
        const calls: unknown[][] = [];
        const query = {
            data: [remoteAttempt],
            error: null,
            eq: (field: string, value: unknown) => {
                calls.push(["eq", field, value]);
                return query;
            },
            select: (columns: string) => {
                calls.push(["select", columns]);
                return query;
            }
        };
        const client = {
            from: (table: string) => {
                calls.push(["from", table]);
                return query;
            }
        } as unknown as DinoBackendClient;

        assert.deepEqual(
            await loadRemoteExerciseAttempts(
                client,
                "learner-id"
            ),
            [localAttempt]
        );
        assert.deepEqual(calls, [
            ["from", "learner_exercise_attempts"],
            [
                "select",
                "id,content_type,activity_id,exercise_id,level,correct_answers,total_questions,completed_at"
            ],
            ["eq", "user_id", "learner-id"]
        ]);
    }
);

test(
    "exercise attempt writes use the immutable idempotent RPC",
    async () => {
        const calls: unknown[] = [];
        const client = {
            rpc: async (name: string, args: unknown) => {
                calls.push({ args, name });
                return {
                    data: [{
                        ...remoteAttempt,
                        attempt_id: remoteAttempt.id
                    }],
                    error: null
                };
            }
        } as unknown as DinoBackendClient;

        assert.deepEqual(
            await syncRemoteExerciseAttempt(
                client,
                localAttempt
            ),
            localAttempt
        );
        assert.deepEqual(calls, [{
            args: {
                p_activity_id: "A1-G-001",
                p_attempt_id:
                    "11111111-1111-4111-8111-111111111111",
                p_completed_at:
                    "2026-09-08T10:00:00.000Z",
                p_content_type: "grammar",
                p_correct_answers: 4,
                p_exercise_id: "practice",
                p_level: null,
                p_total_questions: 5
            },
            name: "record_exercise_attempt"
        }]);
    }
);

test(
    "malformed exercise attempts never reach the server",
    async () => {
        let calls = 0;
        const client = {
            rpc: async () => {
                calls += 1;
                return { data: [], error: null };
            }
        } as unknown as DinoBackendClient;

        await assert.rejects(
            syncRemoteExerciseAttempt(
                client,
                {
                    ...localAttempt,
                    correctAnswers: 6
                }
            ),
            TypeError
        );
        await assert.rejects(
            syncRemoteExerciseAttempt(
                client,
                {
                    ...localAttempt,
                    activityId: " A1-G-001"
                }
            ),
            TypeError
        );
        assert.equal(calls, 0);
    }
);
