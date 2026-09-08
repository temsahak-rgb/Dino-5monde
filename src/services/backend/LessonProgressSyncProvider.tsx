import {
    createContext,
    type ReactNode,
    useContext,
    useEffect,
    useMemo,
    useState
} from "react";

import {
    getAllLessonProgress,
    LESSON_PROGRESS_CHANGE_EVENT,
    mergeRemoteLessonProgress
} from "../../core/progressEngine.js";

import {
    setActiveLearnerAccount
} from "../../core/learnerStorage.js";

import type {
    LessonContentType,
    LessonProgressChangeDetail,
    LessonProgressSnapshot
} from "../../core/progressEngine.js";

import {
    loadRemoteLessonProgress,
    syncRemoteLessonProgress,
    toLocalLessonProgress
} from "./lessonProgressRepository.js";

import {
    useAuth
} from "./AuthProvider.js";

import {
    useBackend
} from "./BackendProvider.js";

type LessonProgressSyncStatus =
    | "backend-disabled"
    | "signed-out"
    | "syncing"
    | "ready"
    | "error";

interface LessonProgressSyncValue {
    error: Error | null;
    progress: readonly LessonProgressSnapshot[];
    status: LessonProgressSyncStatus;
}

interface LessonProgressSyncProviderProps {
    children: ReactNode;
}

const LessonProgressSyncContext =
    createContext<LessonProgressSyncValue | null>(null);

/**
 * Uploads local lesson progress at sign-in and imports the server's monotonic
 * merge. Later local writes are synchronized through a typed browser event.
 */
function LessonProgressSyncProvider({
    children
}: LessonProgressSyncProviderProps) {
    const { client, connectionStatus } = useBackend();
    const { status: authStatus, user } = useAuth();
    const [status, setStatus] =
        useState<LessonProgressSyncStatus>("signed-out");
    const [error, setError] =
        useState<Error | null>(null);
    const [progress, setProgress] =
        useState<LessonProgressSnapshot[]>([]);

    useEffect(() => {
        let active = true;

        if (!client) {
            setProgress([]);
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
            setProgress([]);
            setStatus(
                authStatus === "loading"
                    ? "syncing"
                    : "signed-out"
            );
            return () => {
                active = false;
            };
        }

        setStatus("syncing");
        setError(null);
        setActiveLearnerAccount(user.id);
        setProgress(getAllLessonProgress());
        const syncClient = client;
        const userId = user.id;

        const synchronize = async (
            contentType: LessonContentType,
            lessonId: string,
            progress: LessonProgressChangeDetail["progress"]
        ): Promise<void> => {
            const remote = await syncRemoteLessonProgress(
                syncClient,
                contentType,
                lessonId,
                progress
            );
            mergeRemoteLessonProgress(
                remote.content_type,
                remote.lesson_id,
                toLocalLessonProgress(remote)
            );
            if (active) {
                setProgress(getAllLessonProgress());
            }
        };

        void bootstrap().catch(reason => {
            if (active) {
                setError(asError(reason));
                setStatus("error");
            }
        });

        async function bootstrap(): Promise<void> {
            const [remoteRecords] = await Promise.all([
                loadRemoteLessonProgress(syncClient, userId)
            ]);
            const localRecords = getAllLessonProgress();

            for (const local of localRecords) {
                const {
                    contentType,
                    lessonId,
                    progress
                } = local;

                if (!progress.lastAccessed) {
                    continue;
                }

                await synchronize(
                    contentType,
                    lessonId,
                    progress
                );
            }

            for (const remote of remoteRecords) {
                mergeRemoteLessonProgress(
                    remote.content_type,
                    remote.lesson_id,
                    toLocalLessonProgress(remote)
                );
            }

            if (active) {
                setProgress(getAllLessonProgress());
                setStatus("ready");
            }
        }

        const handleProgressChange = (event: Event): void => {
            const detail = (
                event as CustomEvent<LessonProgressChangeDetail>
            ).detail;

            if (!detail) {
                return;
            }

            setProgress(getAllLessonProgress());
            setStatus("syncing");

            void synchronize(
                detail.contentType,
                detail.lessonId,
                detail.progress
            ).then(
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
            LESSON_PROGRESS_CHANGE_EVENT,
            handleProgressChange
        );

        return () => {
            active = false;
            window.removeEventListener(
                LESSON_PROGRESS_CHANGE_EVENT,
                handleProgressChange
            );
        };
    }, [
        authStatus,
        client,
        connectionStatus,
        user
    ]);

    const value = useMemo(
        () => ({
            error,
            progress,
            status
        }),
        [
            error,
            progress,
            status
        ]
    );

    return (
        <LessonProgressSyncContext.Provider value={value}>
            {children}
        </LessonProgressSyncContext.Provider>
    );
}

function useLessonProgressSync(): LessonProgressSyncValue {
    const value = useContext(LessonProgressSyncContext);

    if (!value) {
        throw new Error(
            "useLessonProgressSync must be used within LessonProgressSyncProvider"
        );
    }

    return value;
}

function asError(reason: unknown): Error {
    return reason instanceof Error
        ? reason
        : new Error("Unable to synchronize lesson progress");
}

export {
    LessonProgressSyncProvider,
    useLessonProgressSync
};
