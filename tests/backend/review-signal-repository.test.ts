import assert from "node:assert/strict";
import test from "node:test";

import type {
    WeakWordReviewSignal
} from "../../src/core/reviewSignalEngine.js";
import {
    loadRemoteReviewSignals,
    syncRemoteReviewSignal,
    toLocalReviewSignal
} from "../../src/services/backend/reviewSignalRepository.js";
import type {
    DinoBackendClient
} from "../../src/services/backend/supabaseClient.js";

const localSignal: WeakWordReviewSignal = {
    active: false,
    changedAt: "2026-09-08T10:00:00.000Z",
    payload: { word: "bonjour" },
    signalKey: "bonjour",
    signalType: "weak_word",
    subjectId: "pack-one"
};

const remoteSignal = {
    active: false,
    changed_at: "2026-09-08T10:00:00.000Z",
    payload: { word: "bonjour" },
    signal_key: "bonjour",
    signal_type: "weak_word" as const,
    subject_id: "pack-one",
    updated_at: "2026-09-08T10:00:01.000Z"
};

test(
    "review signals load only the authenticated learner history",
    async () => {
        const calls: unknown[][] = [];
        const query = {
            data: [remoteSignal],
            error: null,
            eq: (field: string, value: unknown) => {
                calls.push(["eq", field, value]);
                return query;
            },
            order: (field: string, options: unknown) => {
                calls.push(["order", field, options]);
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
            await loadRemoteReviewSignals(client, "learner-id"),
            [remoteSignal]
        );
        assert.deepEqual(calls, [
            ["from", "learner_review_signals"],
            [
                "select",
                "signal_type,subject_id,signal_key,payload,active,changed_at,updated_at"
            ],
            ["eq", "user_id", "learner-id"],
            ["order", "changed_at", { ascending: true }]
        ]);
    }
);

test(
    "review signal writes use the sole authenticated merge RPC",
    async () => {
        const calls: unknown[] = [];
        const client = {
            rpc: async (name: string, args: unknown) => {
                calls.push({ args, name });
                return { data: [remoteSignal], error: null };
            }
        } as unknown as DinoBackendClient;

        assert.deepEqual(
            await syncRemoteReviewSignal(client, localSignal),
            remoteSignal
        );
        assert.deepEqual(calls, [{
            args: {
                p_active: false,
                p_changed_at: "2026-09-08T10:00:00.000Z",
                p_payload: { word: "bonjour" },
                p_signal_key: "bonjour",
                p_signal_type: "weak_word",
                p_subject_id: "pack-one"
            },
            name: "sync_review_signal"
        }]);
        assert.deepEqual(
            toLocalReviewSignal(remoteSignal),
            localSignal
        );
    }
);

test(
    "mismatched signal identity is rejected before the network",
    async () => {
        let calls = 0;
        const client = {
            rpc: async () => {
                calls += 1;
                return { data: [], error: null };
            }
        } as unknown as DinoBackendClient;

        await assert.rejects(
            syncRemoteReviewSignal(
                client,
                {
                    ...localSignal,
                    signalKey: "merci"
                }
            ),
            TypeError
        );
        assert.equal(calls, 0);
    }
);
