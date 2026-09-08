import type {
    LearningGameActivityType,
    LearningGameAttemptRpcRow,
    LearningGameLevel
} from "./database.types.js";
import type {
    DinoBackendClient
} from "./supabaseClient.js";

type LearningGameAttempt = {
    activityId: LearningGameLevel;
    activityType: LearningGameActivityType;
    attemptId: string;
    completedAt: string | null;
    packId: string;
    startedAt: string;
};

async function startLearningGame(
    client: DinoBackendClient,
    activityType: LearningGameActivityType,
    level: LearningGameLevel,
    packId: string
): Promise<LearningGameAttempt> {
    assertLearningGame(activityType, level, packId);

    const { data, error } = await client.rpc(
        "start_learning_game",
        {
            p_activity_id: level,
            p_activity_type: activityType,
            p_pack_id: packId
        }
    );

    if (error) {
        throw error;
    }

    return toLearningGameAttempt(
        requireAttempt(data[0])
    );
}

async function completeLearningGame(
    client: DinoBackendClient,
    attemptId: string
): Promise<LearningGameAttempt> {
    if (!isUuid(attemptId)) {
        throw new TypeError(
            "Invalid learning game attempt"
        );
    }

    const { data, error } = await client.rpc(
        "complete_learning_game",
        {
            p_attempt_id: attemptId
        }
    );

    if (error) {
        throw error;
    }

    return toLearningGameAttempt(
        requireAttempt(data[0])
    );
}

function assertLearningGame(
    activityType: LearningGameActivityType,
    level: LearningGameLevel,
    packId: string
): void {
    if (
        ![
            "hangman_game",
            "word_search_game",
            "crossword_game"
        ].includes(activityType)
        || ![
            "A1",
            "A2",
            "B1",
            "B2",
            "C1",
            "C2"
        ].includes(level)
        || !packId
        || packId.trim() !== packId
        || packId.length > 160
        || /[\\/\u0000-\u001f\u007f]/u.test(packId)
    ) {
        throw new TypeError(
            "Invalid learning game"
        );
    }
}

function requireAttempt(
    value: LearningGameAttemptRpcRow | undefined
): LearningGameAttemptRpcRow {
    if (!value) {
        throw new Error(
            "Learning game attempt returned no result"
        );
    }

    return value;
}

function toLearningGameAttempt(
    value: LearningGameAttemptRpcRow
): LearningGameAttempt {
    if (
        !isUuid(value.attempt_id)
        || !Number.isFinite(
            Date.parse(value.started_at)
        )
        || (
            value.completed_at !== null
            && !Number.isFinite(
                Date.parse(value.completed_at)
            )
        )
    ) {
        throw new TypeError(
            "Invalid learning game attempt response"
        );
    }

    assertLearningGame(
        value.activity_type,
        value.activity_id,
        value.pack_id
    );

    return {
        activityId: value.activity_id,
        activityType: value.activity_type,
        attemptId: value.attempt_id,
        completedAt: value.completed_at,
        packId: value.pack_id,
        startedAt: value.started_at
    };
}

function isUuid(value: string): boolean {
    return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/iu.test(
        value
    );
}

export {
    completeLearningGame,
    startLearningGame
};

export type {
    LearningGameAttempt
};
