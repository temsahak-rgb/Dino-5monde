import type {
    Session,
    User
} from "@supabase/supabase-js";

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
    createSupabaseAuthGateway,
    type AuthGateway
} from "./authGateway.js";

import {
    useBackend
} from "./BackendProvider.js";

type AuthenticationStatus =
    | "backend-disabled"
    | "loading"
    | "signed-out"
    | "signed-in"
    | "error";

interface AuthContextValue {
    error: Error | null;
    requestEmailOtp: (
        email: string,
        redirectTo?: string
    ) => Promise<void>;
    session: Session | null;
    signOut: () => Promise<void>;
    status: AuthenticationStatus;
    user: User | null;
    verifyEmailOtp: (
        email: string,
        token: string
    ) => Promise<void>;
}

interface AuthProviderProps {
    children: ReactNode;
}

const AuthContext =
    createContext<AuthContextValue | null>(
        null
    );

function AuthProvider({
    children
}: AuthProviderProps) {
    const {
        client,
        connectionStatus,
        error: backendError
    } = useBackend();

    const gateway =
        useMemo<AuthGateway | null>(
            () => client
                ? createSupabaseAuthGateway(
                    client
                )
                : null,
            [
                client
            ]
        );

    const [
        session,
        setSession
    ] = useState<Session | null>(
        null
    );

    const [
        sessionStatus,
        setSessionStatus
    ] = useState<
        "loading"
        | "ready"
        | "error"
    >(
        "loading"
    );

    const [
        sessionError,
        setSessionError
    ] = useState<Error | null>(
        null
    );

    useEffect(
        () => {
            let active =
                true;

            setSession(
                null
            );
            setSessionError(
                null
            );

            if (!gateway) {
                setSessionStatus(
                    connectionStatus === "error"
                        ? "error"
                        : connectionStatus === "disabled"
                            ? "ready"
                            : "loading"
                );

                return () => {
                    active =
                        false;
                };
            }

            setSessionStatus(
                "loading"
            );

            const unsubscribe =
                gateway.subscribe(
                    nextSession => {
                        if (!active) {
                            return;
                        }

                        setSession(
                            nextSession
                        );
                        setSessionStatus(
                            "ready"
                        );
                        setSessionError(
                            null
                        );
                    }
                );

            void gateway.getSession().then(
                currentSession => {
                    if (!active) {
                        return;
                    }

                    setSession(
                        currentSession
                    );
                    setSessionStatus(
                        "ready"
                    );
                },
                reason => {
                    if (!active) {
                        return;
                    }

                    setSessionError(
                        asError(
                            reason,
                            "Unable to restore the authentication session"
                        )
                    );
                    setSessionStatus(
                        "error"
                    );
                }
            );

            return () => {
                active =
                    false;
                unsubscribe();
            };
        },
        [
            connectionStatus,
            gateway
        ]
    );

    const requireGateway =
        useCallback(
            (): AuthGateway => {
                if (!gateway) {
                    throw new Error(
                        "Authentication backend is unavailable"
                    );
                }

                return gateway;
            },
            [
                gateway
            ]
        );

    const requestEmailOtp =
        useCallback(
            async (
                email: string,
                redirectTo?: string
            ): Promise<void> => {
                await requireGateway()
                    .requestEmailOtp(
                        email,
                        redirectTo
                    );
            },
            [
                requireGateway
            ]
        );

    const verifyEmailOtp =
        useCallback(
            async (
                email: string,
                token: string
            ): Promise<void> => {
                const verifiedSession =
                    await requireGateway()
                        .verifyEmailOtp(
                            email,
                            token
                        );

                setSession(
                    verifiedSession
                );
                setSessionStatus(
                    "ready"
                );
                setSessionError(
                    null
                );
            },
            [
                requireGateway
            ]
        );

    const signOut =
        useCallback(
            async (): Promise<void> => {
                await requireGateway()
                    .signOut();

                setSession(
                    null
                );
                setSessionStatus(
                    "ready"
                );
            },
            [
                requireGateway
            ]
        );

    const status:
        AuthenticationStatus =
        connectionStatus === "disabled"
            ? "backend-disabled"
            : connectionStatus === "error"
                || sessionStatus === "error"
                ? "error"
                : connectionStatus !== "ready"
                    || sessionStatus === "loading"
                    ? "loading"
                    : session
                        ? "signed-in"
                        : "signed-out";

    const value =
        useMemo<AuthContextValue>(
            () => ({
                error:
                    backendError
                    ?? sessionError,
                requestEmailOtp,
                session,
                signOut,
                status,
                user:
                    session?.user
                    ?? null,
                verifyEmailOtp
            }),
            [
                backendError,
                requestEmailOtp,
                session,
                sessionError,
                signOut,
                status,
                verifyEmailOtp
            ]
        );

    return (
        <AuthContext.Provider
            value={value}
        >
            {children}
        </AuthContext.Provider>
    );
}

function useAuth():
    AuthContextValue {
    const value =
        useContext(
            AuthContext
        );

    if (!value) {
        throw new Error(
            "useAuth must be used within AuthProvider"
        );
    }

    return value;
}

function asError(
    reason: unknown,
    fallback: string
): Error {
    return reason instanceof Error
        ? reason
        : new Error(
            fallback
        );
}

export {
    AuthProvider,
    useAuth,
    type AuthenticationStatus,
    type AuthContextValue,
    type AuthProviderProps
};
