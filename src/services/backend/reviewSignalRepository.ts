import {
    assertReviewSignal
} from "../../core/reviewSignalEngine.js";

import type {
    ReviewSignal
} from "../../core/reviewSignalEngine.js";
import type {
    Json,
    LearnerReviewSignalRow
} from "./database.types.js";
import type {
    DinoBackendClient
} from "./supabaseClient.js";

type RemoteReviewSignal = Pick<
    LearnerReviewSignalRow,
    | "active"
    | "changed_at"
    | "payload"
    | "signal_key"
    | "signal_type"
    | "subject_id"
    | "updated_at"
>;

const reviewSignalProjection =
    "signal_type,subject_id,signal_key,payload,active,changed_at,updated_at";

async function loadRemoteReviewSignals(
    client: DinoBackendClient,
    userId: string
): Promise<RemoteReviewSignal[]> {
    const { data, error } = await client
        .from("learner_review_signals")
        .select(reviewSignalProjection)
        .eq("user_id", userId)
        .order("changed_at", { ascending: true });

    if (error) {
        throw error;
    }

    return data;
}

async function syncRemoteReviewSignal(
    client: DinoBackendClient,
    signal: ReviewSignal
): Promise<RemoteReviewSignal> {
    assertReviewSignal(signal);

    const { data, error } = await client.rpc(
        "sync_review_signal",
        {
            p_active: signal.active,
            p_changed_at: signal.changedAt,
            p_payload: signal.payload as unknown as Json,
            p_signal_key: signal.signalKey,
            p_signal_type: signal.signalType,
            p_subject_id: signal.subjectId
        }
    );

    if (error) {
        throw error;
    }

    const result = data[0];

    if (!result) {
        throw new Error("Review signal synchronization returned no result");
    }

    return result;
}

function toLocalReviewSignal(
    remote: RemoteReviewSignal
): ReviewSignal {
    const signal = {
        active: remote.active,
        changedAt: remote.changed_at,
        payload: remote.payload,
        signalKey: remote.signal_key,
        signalType: remote.signal_type,
        subjectId: remote.subject_id
    };

    assertReviewSignal(signal);
    return signal;
}

export {
    loadRemoteReviewSignals,
    syncRemoteReviewSignal,
    toLocalReviewSignal
};

export type {
    RemoteReviewSignal
};
