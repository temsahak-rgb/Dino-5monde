import {
    createContext,
    type ReactNode,
    useCallback,
    useContext,
    useEffect,
    useMemo,
    useState
} from "react";

import {
    useAuth
} from "./AuthProvider.js";

import {
    useBackend
} from "./BackendProvider.js";

import type {
    LearnerProfileRow
} from "./database.types.js";

import {
    loadLearnerProfile,
    saveLearnerProfile,
    type LearnerProfileDraft
} from "./learnerProfileRepository.js";

type LearnerProfileStatus =
    | "backend-disabled"
    | "signed-out"
    | "loading"
    | "missing"
    | "ready"
    | "error";

interface LearnerProfileContextValue {
    error: Error | null;
    profile: LearnerProfileRow | null;
    saveProfile: (
        draft: LearnerProfileDraft
    ) => Promise<LearnerProfileRow>;
    status: LearnerProfileStatus;
}

interface LearnerProfileProviderProps {
    children: ReactNode;
}

const LearnerProfileContext =
    createContext<LearnerProfileContextValue | null>(
        null
    );

function LearnerProfileProvider({
    children
}: LearnerProfileProviderProps) {
    const {
        client,
        connectionStatus
    } = useBackend();

    const {
        status: authStatus,
        user
    } = useAuth();

    const [
        profile,
        setProfile
    ] = useState<LearnerProfileRow | null>(
        null
    );

    const [
        loadStatus,
        setLoadStatus
    ] = useState<
        "idle"
        | "loading"
        | "missing"
        | "ready"
        | "error"
    >(
        "idle"
    );

    const [
        error,
        setError
    ] = useState<Error | null>(
        null
    );

    useEffect(
        () => {
            let active =
                true;

            setProfile(
                null
            );
            setError(
                null
            );

            if (
                authStatus !== "signed-in"
                || !user
                || !client
            ) {
                setLoadStatus(
                    "idle"
                );

                return () => {
                    active =
                        false;
                };
            }

            setLoadStatus(
                "loading"
            );

            void loadLearnerProfile(
                client,
                user.id
            ).then(
                loadedProfile => {
                    if (!active) {
                        return;
                    }

                    setProfile(
                        loadedProfile
                    );
                    setLoadStatus(
                        loadedProfile
                            ? "ready"
                            : "missing"
                    );
                },
                reason => {
                    if (!active) {
                        return;
                    }

                    setError(
                        reason instanceof Error
                            ? reason
                            : new Error(
                                "Unable to load the learner profile"
                            )
                    );
                    setLoadStatus(
                        "error"
                    );
                }
            );

            return () => {
                active =
                    false;
            };
        },
        [
            authStatus,
            client,
            user
        ]
    );

    const saveProfile =
        useCallback(
            async (
                draft: LearnerProfileDraft
            ): Promise<LearnerProfileRow> => {
                if (
                    !client
                    || !user
                    || authStatus !== "signed-in"
                ) {
                    throw new Error(
                        "An authenticated learner is required"
                    );
                }

                const savedProfile =
                    await saveLearnerProfile(
                        client,
                        user.id,
                        draft
                    );

                setProfile(
                    savedProfile
                );
                setLoadStatus(
                    "ready"
                );
                setError(
                    null
                );

                return savedProfile;
            },
            [
                authStatus,
                client,
                user
            ]
        );

    const status:
        LearnerProfileStatus =
        connectionStatus === "disabled"
            ? "backend-disabled"
            : authStatus === "signed-out"
                ? "signed-out"
                : authStatus !== "signed-in"
                    ? "loading"
                    : loadStatus === "missing"
                        ? "missing"
                        : loadStatus === "ready"
                            ? "ready"
                            : loadStatus === "error"
                                ? "error"
                                : "loading";

    const value =
        useMemo<LearnerProfileContextValue>(
            () => ({
                error,
                profile,
                saveProfile,
                status
            }),
            [
                error,
                profile,
                saveProfile,
                status
            ]
        );

    return (
        <LearnerProfileContext.Provider
            value={value}
        >
            {children}
        </LearnerProfileContext.Provider>
    );
}

function useLearnerProfile():
    LearnerProfileContextValue {
    const value =
        useContext(
            LearnerProfileContext
        );

    if (!value) {
        throw new Error(
            "useLearnerProfile must be used within LearnerProfileProvider"
        );
    }

    return value;
}

export {
    LearnerProfileProvider,
    useLearnerProfile,
    type LearnerProfileContextValue,
    type LearnerProfileProviderProps,
    type LearnerProfileStatus
};
