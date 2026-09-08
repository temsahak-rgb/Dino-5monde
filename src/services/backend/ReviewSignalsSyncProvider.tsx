import {
    createContext,
    type ReactNode,
    useContext,
    useEffect,
    useMemo,
    useState
} from "react";

import {
    initializeLocalReviewSignals,
    mergeRemoteReviewSignal,
    REVIEW_SIGNAL_CHANGE_EVENT
} from "../../core/reviewSignalEngine.js";
import type {
    ReviewSignal,
    ReviewSignalChangeDetail
} from "../../core/reviewSignalEngine.js";
import {
    setActiveLearnerAccount
} from "../../core/learnerStorage.js";
import {
    useAuth
} from "./AuthProvider.js";
import {
    useBackend
} from "./BackendProvider.js";
import {
    loadRemoteReviewSignals,
    syncRemoteReviewSignal,
    toLocalReviewSignal
} from "./reviewSignalRepository.js";

type ReviewSignalsSyncStatus =
    | "backend-disabled"
    | "signed-out"
    | "syncing"
    | "ready"
    | "error";

interface ReviewSignalsSyncValue {
    error: Error | null;
    status: ReviewSignalsSyncStatus;
}

interface ReviewSignalsSyncProviderProps {
    children: ReactNode;
}

const ReviewSignalsSyncContext =
    createContext<ReviewSignalsSyncValue | null>(null);

function ReviewSignalsSyncProvider({
    children
}: ReviewSignalsSyncProviderProps) {
    const { client, connectionStatus } = useBackend();
    const { status: authStatus, user } = useAuth();
    const [status, setStatus] =
        useState<ReviewSignalsSyncStatus>("signed-out");
    const [error, setError] =
        useState<Error | null>(null);

    useEffect(() => {
        let active = true;

        if (!client) {
            setStatus(
                connectionStatus === "disabled"
                    ? "backend-disabled"
                    : connectionStatus === "error"
                        ? "error"
                        : "syncing"
            );
            return () => {
                active = false;
            };
        }

        if (authStatus !== "signed-in" || !user) {
            if (authStatus === "signed-out") {
                setActiveLearnerAccount(null);
            }
            setStatus(
                authStatus === "loading"
                    ? "syncing"
                    : "signed-out"
            );
            return () => {
                active = false;
            };
        }

        setActiveLearnerAccount(user.id);
        setStatus("syncing");
        setError(null);
        const syncClient = client;
        const userId = user.id;

        const synchronize = async (
            signal: ReviewSignal
        ): Promise<void> => {
            const remote = await syncRemoteReviewSignal(
                syncClient,
                signal
            );
            mergeRemoteReviewSignal(
                toLocalReviewSignal(remote)
            );
        };

        void bootstrap().catch(reason => {
            if (active) {
                setError(asError(reason));
                setStatus("error");
            }
        });

        async function bootstrap(): Promise<void> {
            const remoteSignals = await loadRemoteReviewSignals(
                syncClient,
                userId
            );

            for (const remote of remoteSignals) {
                mergeRemoteReviewSignal(
                    toLocalReviewSignal(remote)
                );
            }

            for (const local of initializeLocalReviewSignals()) {
                await synchronize(local);
            }

            if (active) {
                setStatus("ready");
            }
        }

        const handleSignalChange = (event: Event): void => {
            const detail = (
                event as CustomEvent<ReviewSignalChangeDetail>
            ).detail;

            if (!detail?.signal) {
                return;
            }

            void synchronize(detail.signal).then(
                () => {
                    if (active) {
                        setError(null);
                        setStatus("ready");
                    }
                },
                reason => {
                    if (active) {
                        setError(asError(reason));
                        setStatus("error");
                    }
                }
            );
        };

        window.addEventListener(
            REVIEW_SIGNAL_CHANGE_EVENT,
            handleSignalChange
        );

        return () => {
            active = false;
            window.removeEventListener(
                REVIEW_SIGNAL_CHANGE_EVENT,
                handleSignalChange
            );
        };
    }, [
        authStatus,
        client,
        connectionStatus,
        user
    ]);

    const value = useMemo(
        () => ({ error, status }),
        [error, status]
    );

    return (
        <ReviewSignalsSyncContext.Provider value={value}>
            {children}
        </ReviewSignalsSyncContext.Provider>
    );
}

function useReviewSignalsSync(): ReviewSignalsSyncValue {
    const value = useContext(ReviewSignalsSyncContext);

    if (!value) {
        throw new Error(
            "useReviewSignalsSync must be used within ReviewSignalsSyncProvider"
        );
    }

    return value;
}

function asError(reason: unknown): Error {
    return reason instanceof Error
        ? reason
        : new Error("Unable to synchronize review signals");
}

export {
    ReviewSignalsSyncProvider,
    useReviewSignalsSync
};
