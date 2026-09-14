import {
    createContext,
    type ReactNode,
    useContext,
    useMemo
} from "react";

import {
    createSupabaseContentRepository
} from "../backend/supabaseContentRepository.js";

import {
    useBackend
} from "../backend/BackendProvider.js";

import {
    createStaticContentRepository
} from "./staticContentRepository.js";

import type {
    ContentRepository,
    ContentSource
} from "./contentRepository.js";

type ContentConnectionStatus =
    | "loading"
    | "ready"
    | "error";

interface ContentContextValue {
    error: Error | null;
    repository:
        ContentRepository
        | null;
    source:
        ContentSource
        | null;
    status: ContentConnectionStatus;
}

interface ContentProviderProps {
    children: ReactNode;
    staticRepository?:
        ContentRepository;
}

const ContentContext =
    createContext<
        ContentContextValue
        | null
    >(
        null
    );

function ContentProvider({
    children,
    staticRepository
}: ContentProviderProps) {
    const {
        client,
        connectionStatus,
        error:
            backendError
    } = useBackend();

    const fallback =
        useMemo(
            () => staticRepository
                ?? createStaticContentRepository(),
            [
                staticRepository
            ]
        );

    const serverRepository =
        useMemo(
            () => client
                ? createSupabaseContentRepository(
                    client
                )
                : null,
            [
                client
            ]
        );

    const value =
        useMemo<ContentContextValue>(
            () => {
                if (
                    connectionStatus
                    === "disabled"
                ) {
                    return {
                        error: null,
                        repository:
                            fallback,
                        source:
                            fallback.source,
                        status: "ready"
                    };
                }

                if (
                    connectionStatus
                    === "ready"
                    && serverRepository
                ) {
                    return {
                        error: null,
                        repository:
                            serverRepository,
                        source: "server",
                        status: "ready"
                    };
                }

                if (
                    connectionStatus
                    === "error"
                ) {
                    return {
                        error:
                            backendError
                            ?? new Error(
                                "Content server is unavailable"
                            ),
                        repository: null,
                        source: null,
                        status: "error"
                    };
                }

                return {
                    error: null,
                    repository: null,
                    source: null,
                    status: "loading"
                };
            },
            [
                backendError,
                connectionStatus,
                fallback,
                serverRepository
            ]
        );

    return (
        <ContentContext.Provider
            value={value}
        >
            {children}
        </ContentContext.Provider>
    );
}

function useContent():
ContentContextValue {
    const value =
        useContext(
            ContentContext
        );

    if (!value) {
        throw new Error(
            "useContent must be used within ContentProvider"
        );
    }

    return value;
}

export {
    ContentProvider,
    useContent
};

export type {
    ContentConnectionStatus,
    ContentContextValue,
    ContentProviderProps
};
