import {
    createContext,
    type ReactNode,
    useCallback,
    useContext,
    useEffect,
    useMemo,
    useRef,
    useState
} from "react";

import {
    EXERCISE_ATTEMPT_CHANGE_EVENT,
    getAllExerciseAttempts,
    mergeRemoteExerciseAttempt,
    recordExerciseAttempt
} from "../../core/exerciseAttemptEngine.js";
import {
    setActiveLearnerAccount
} from "../../core/learnerStorage.js";
import type {
    ExerciseAttempt,
    ExerciseAttemptDraft
} from "../../types/global.js";
import {
    useAuth
} from "./AuthProvider.js";
import {
    useBackend
} from "./BackendProvider.js";
import {
    loadRemoteExerciseAttempts,
    syncRemoteExerciseAttempt
} from "./exerciseAttemptRepository.js";

type ExerciseTrackingStatus =
    | "backend-disabled"
    | "signed-out"
    | "syncing"
    | "ready"
    | "error";

interface ExerciseTrackingValue {
    attempts: readonly ExerciseAttempt[];
    error: Error | null;
    recordAttempt:
        (
            draft: ExerciseAttemptDraft
        ) => ExerciseAttempt;
    status: ExerciseTrackingStatus;
}

interface ExerciseTrackingProviderProps {
    children: ReactNode;
}

const ExerciseTrackingContext =
    createContext<ExerciseTrackingValue | null>(
        null
    );

function ExerciseTrackingProvider({
    children
}: ExerciseTrackingProviderProps) {
    const {
        client,
        connectionStatus
    } = useBackend();
    const {
        status: authStatus,
        user
    } = useAuth();
    const [
        attempts,
        setAttempts
    ] = useState<ExerciseAttempt[]>([]);
    const [
        status,
        setStatus
    ] = useState<ExerciseTrackingStatus>(
        "signed-out"
    );
    const [
        error,
        setError
    ] = useState<Error | null>(null);
    const inFlight =
        useRef<Map<
            string,
            Promise<ExerciseAttempt>
        >>(new Map());

    const recordAttempt =
        useCallback(
            (
                draft: ExerciseAttemptDraft
            ): ExerciseAttempt => {
                const attempt =
                    recordExerciseAttempt(
                        draft
                    );

                setAttempts(
                    getAllExerciseAttempts()
                );
                return attempt;
            },
            []
        );

    useEffect(
        () => {
            let active = true;

            if (
                !client
                || authStatus !== "signed-in"
                || !user
            ) {
                if (
                    authStatus
                    === "signed-out"
                ) {
                    setActiveLearnerAccount(null);
                }

                setAttempts(
                    getAllExerciseAttempts()
                );
                setStatus(
                    connectionStatus
                        === "disabled"
                        ? "backend-disabled"
                        : authStatus
                            === "loading"
                            ? "syncing"
                            : "signed-out"
                );

                return () => {
                    active = false;
                };
            }

            setActiveLearnerAccount(user.id);
            setAttempts(
                getAllExerciseAttempts()
            );
            setStatus("syncing");
            setError(null);
            const syncClient = client;
            const userId = user.id;

            const synchronize =
                (
                    attempt: ExerciseAttempt
                ): Promise<ExerciseAttempt> => {
                    const existing =
                        inFlight.current.get(
                            attempt.attemptId
                        );

                    if (existing) {
                        return existing;
                    }

                    const request =
                        syncRemoteExerciseAttempt(
                            syncClient,
                            attempt
                        ).then(
                            remote => {
                                mergeRemoteExerciseAttempt(
                                    remote
                                );
                                if (active) {
                                    setAttempts(
                                        getAllExerciseAttempts()
                                    );
                                }
                                return remote;
                            }
                        ).finally(
                            () => {
                                inFlight.current.delete(
                                    attempt.attemptId
                                );
                            }
                        );

                    inFlight.current.set(
                        attempt.attemptId,
                        request
                    );
                    return request;
                };

            const handleAttempt =
                (event: Event): void => {
                    const detail =
                        (
                            event as CustomEvent<{
                                attempt:
                                    ExerciseAttempt;
                            }>
                        ).detail;

                    if (!detail?.attempt) {
                        return;
                    }

                    setAttempts(
                        getAllExerciseAttempts()
                    );
                    setStatus("syncing");

                    void synchronize(
                        detail.attempt
                    ).then(
                        () => {
                            if (active) {
                                setError(null);
                                setStatus("ready");
                            }
                        },
                        reason => {
                            if (active) {
                                setError(
                                    asError(reason)
                                );
                                setStatus("error");
                            }
                        }
                    );
                };

            window.addEventListener(
                EXERCISE_ATTEMPT_CHANGE_EVENT,
                handleAttempt
            );

            void bootstrap().catch(
                reason => {
                    if (active) {
                        setError(
                            asError(reason)
                        );
                        setStatus("error");
                    }
                }
            );

            async function bootstrap():
                Promise<void> {
                const remoteAttempts =
                    await loadRemoteExerciseAttempts(
                        syncClient,
                        userId
                    );
                const localAttempts =
                    getAllExerciseAttempts();
                const remoteById =
                    new Map(
                        remoteAttempts.map(
                            attempt => [
                                attempt.attemptId,
                                attempt
                            ]
                        )
                    );

                for (const attempt of localAttempts) {
                    const remote =
                        remoteById.get(
                            attempt.attemptId
                        );

                    if (remote) {
                        if (
                            !sameExerciseAttempt(
                                attempt,
                                remote
                            )
                        ) {
                            throw new Error(
                                "Exercise attempt identity conflict"
                            );
                        }

                        continue;
                    }

                    await synchronize(attempt);
                }

                for (const attempt of remoteAttempts) {
                    mergeRemoteExerciseAttempt(
                        attempt
                    );
                }

                if (active) {
                    setAttempts(
                        getAllExerciseAttempts()
                    );
                    setStatus("ready");
                }
            }

            return () => {
                active = false;
                window.removeEventListener(
                    EXERCISE_ATTEMPT_CHANGE_EVENT,
                    handleAttempt
                );
            };
        },
        [
            authStatus,
            client,
            connectionStatus,
            user
        ]
    );

    const value =
        useMemo<ExerciseTrackingValue>(
            () => ({
                attempts,
                error,
                recordAttempt,
                status
            }),
            [
                attempts,
                error,
                recordAttempt,
                status
            ]
        );

    return (
        <ExerciseTrackingContext.Provider
            value={value}
        >
            {children}
        </ExerciseTrackingContext.Provider>
    );
}

function useExerciseTracking():
    ExerciseTrackingValue {
    const value =
        useContext(
            ExerciseTrackingContext
        );

    if (!value) {
        throw new Error(
            "useExerciseTracking must be used within ExerciseTrackingProvider"
        );
    }

    return value;
}

function asError(
    reason: unknown
): Error {
    return reason instanceof Error
        ? reason
        : new Error(
            "Unable to synchronize exercise attempts"
        );
}

function sameExerciseAttempt(
    left: ExerciseAttempt,
    right: ExerciseAttempt
): boolean {
    return (
        left.attemptId === right.attemptId
        && left.activityId === right.activityId
        && left.contentType === right.contentType
        && left.correctAnswers === right.correctAnswers
        && left.exerciseId === right.exerciseId
        && left.level === right.level
        && left.totalQuestions === right.totalQuestions
        && left.completedAt === right.completedAt
    );
}

export {
    ExerciseTrackingProvider,
    useExerciseTracking
};

export type {
    ExerciseTrackingProviderProps,
    ExerciseTrackingStatus,
    ExerciseTrackingValue
};
