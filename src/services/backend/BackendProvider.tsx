import {
    createContext,
    type ReactNode,
    useContext,
    useEffect,
    useMemo,
    useState
} from "react";

import {
    readRuntimeBackendConfiguration,
    type BackendConfiguration
} from "./backendEnvironment.js";

import {
    loadDinoBackendClient,
    type DinoBackendClient
} from "./supabaseClient.js";

type BackendConnectionStatus =
    | "disabled"
    | "connecting"
    | "ready"
    | "error";

interface BackendContextValue {
    configuration: BackendConfiguration;
    client: DinoBackendClient | null;
    connectionStatus: BackendConnectionStatus;
    error: Error | null;
}

interface BackendProviderProps {
    children: ReactNode;
    configuration?: BackendConfiguration;
}

const BackendContext =
    createContext<BackendContextValue | null>(
        null
    );

function BackendProvider({
    children,
    configuration
}: BackendProviderProps) {
    const resolvedConfiguration =
        useMemo(
            () => configuration
                ?? readRuntimeBackendConfiguration(),
            [
                configuration
            ]
        );

    const [
        client,
        setClient
    ] = useState<DinoBackendClient | null>(
        null
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

            setClient(
                null
            );
            setError(
                null
            );

            if (
                resolvedConfiguration.status
                === "disabled"
            ) {
                return () => {
                    active =
                        false;
                };
            }

            void loadDinoBackendClient(
                resolvedConfiguration
            ).then(
                loadedClient => {
                    if (active) {
                        setClient(
                            loadedClient
                        );
                    }
                },
                reason => {
                    if (active) {
                        setError(
                            reason instanceof Error
                                ? reason
                                : new Error(
                                    "Unable to initialize the backend client"
                                )
                        );
                    }
                }
            );

            return () => {
                active =
                    false;
            };
        },
        [
            resolvedConfiguration
        ]
    );

    const connectionStatus:
        BackendConnectionStatus =
        resolvedConfiguration.status
            === "disabled"
            ? "disabled"
            : error
                ? "error"
                : client
                    ? "ready"
                    : "connecting";

    const value =
        useMemo(
            () => ({
                configuration:
                    resolvedConfiguration,
                client,
                connectionStatus,
                error
            }),
            [
                client,
                connectionStatus,
                error,
                resolvedConfiguration
            ]
        );

    return (
        <BackendContext.Provider
            value={
                value
            }
        >
            {children}
        </BackendContext.Provider>
    );
}

function useBackend():
    BackendContextValue {
    const value =
        useContext(
            BackendContext
        );

    if (!value) {
        throw new Error(
            "useBackend must be used within BackendProvider"
        );
    }

    return value;
}

export {
    BackendProvider,
    useBackend,
    type BackendConnectionStatus,
    type BackendContextValue,
    type BackendProviderProps
};
