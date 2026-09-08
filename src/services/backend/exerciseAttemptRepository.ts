import type {
    ExerciseAttempt
} from "../../types/global.js";
import type {
    LearnerExerciseAttemptRow,
    RecordExerciseAttemptRpcRow
} from "./database.types.js";
import type {
    DinoBackendClient
} from "./supabaseClient.js";

type RemoteExerciseAttempt = Pick<
    LearnerExerciseAttemptRow,
    | "activity_id"
    | "completed_at"
    | "content_type"
    | "correct_answers"
    | "exercise_id"
    | "id"
    | "level"
    | "total_questions"
>;

async function loadRemoteExerciseAttempts(
    client: DinoBackendClient,
    userId: string
): Promise<ExerciseAttempt[]> {
    if (!isIdentifier(userId)) {
        throw new TypeError(
            "Invalid learner identity"
        );
    }

    const { data, error } =
        await client
            .from(
                "learner_exercise_attempts"
            )
            .select(
                "id,content_type,activity_id,exercise_id,level,correct_answers,total_questions,completed_at"
            )
            .eq(
                "user_id",
                userId
            );

    if (error) {
        throw error;
    }

    return data.map(
        toExerciseAttempt
    );
}

async function syncRemoteExerciseAttempt(
    client: DinoBackendClient,
    attempt: ExerciseAttempt
): Promise<ExerciseAttempt> {
    assertExerciseAttempt(attempt);

    const { data, error } =
        await client.rpc(
            "record_exercise_attempt",
            {
                p_activity_id:
                    attempt.activityId,
                p_attempt_id:
                    attempt.attemptId,
                p_completed_at:
                    attempt.completedAt,
                p_content_type:
                    attempt.contentType,
                p_correct_answers:
                    attempt.correctAnswers,
                p_exercise_id:
                    attempt.exerciseId,
                p_level:
                    attempt.level
                    ?? null,
                p_total_questions:
                    attempt.totalQuestions
            }
        );

    if (error) {
        throw error;
    }

    return toExerciseAttempt(
        requireAttempt(data[0])
    );
}

function toExerciseAttempt(
    row:
        RemoteExerciseAttempt
        | RecordExerciseAttemptRpcRow
): ExerciseAttempt {
    const attempt: ExerciseAttempt = {
        activityId:
            row.activity_id,
        attemptId:
            "attempt_id" in row
                ? row.attempt_id
                : row.id,
        completedAt:
            row.completed_at,
        contentType:
            row.content_type,
        correctAnswers:
            row.correct_answers,
        exerciseId:
            row.exercise_id,
        ...(row.level
            ? {
                level:
                    row.level
            }
            : {}),
        totalQuestions:
            row.total_questions
    };

    assertExerciseAttempt(attempt);
    return attempt;
}

function requireAttempt(
    value:
        RecordExerciseAttemptRpcRow
        | undefined
): RecordExerciseAttemptRpcRow {
    if (!value) {
        throw new Error(
            "Exercise attempt returned no result"
        );
    }

    return value;
}

function assertExerciseAttempt(
    attempt: ExerciseAttempt
): void {
    if (
        !isUuid(attempt.attemptId)
        || ![
            "grammar",
            "travel",
            "vocabulary"
        ].includes(attempt.contentType)
        || !isIdentifier(attempt.activityId)
        || !isIdentifier(attempt.exerciseId)
        || (
            attempt.contentType
                === "vocabulary"
            ? ![
                "A1",
                "A2",
                "B1",
                "B2",
                "C1",
                "C2"
            ].includes(
                attempt.level
                ?? ""
            )
            : attempt.level !== undefined
        )
        || !Number.isInteger(
            attempt.correctAnswers
        )
        || !Number.isInteger(
            attempt.totalQuestions
        )
        || attempt.totalQuestions < 1
        || attempt.totalQuestions > 200
        || attempt.correctAnswers < 0
        || attempt.correctAnswers
            > attempt.totalQuestions
        || !Number.isFinite(
            Date.parse(
                attempt.completedAt
            )
        )
    ) {
        throw new TypeError(
            "Invalid exercise attempt"
        );
    }
}

function isIdentifier(
    value: string
): boolean {
    return (
        value.length >= 1
        && value.length <= 160
        && value.trim() === value
        && !/[\u0000-\u001f\u007f]/u.test(
            value
        )
    );
}

function isUuid(
    value: string
): boolean {
    return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/iu.test(
        value
    );
}

export {
    loadRemoteExerciseAttempts,
    syncRemoteExerciseAttempt
};
