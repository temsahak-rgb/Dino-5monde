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
    applyDocumentLanguage,
    getI18nLanguage,
    getTextDirection,
    localizedTextClass,
    localizedValue,
    setI18nLanguage,
    t
} from "./i18n.js";

import type {
    Language
} from "../types/global.js";

interface I18nContextValue {
    language: Language;

    direction:
        | "ltr"
        | "rtl";

    setLanguage:
        (language: Language) => void;

    t: typeof t;

    localizedValue:
        typeof localizedValue;

    localizedTextClass:
        typeof localizedTextClass;
}

interface I18nProviderProps {
    children: ReactNode;
}

const I18nContext =
    createContext<I18nContextValue | null>(
        null
    );

/**
 * Makes the existing Dino i18n runtime reactive for React.
 *
 * The existing `i18n.ts` module remains the canonical source for:
 *
 * - persisted language
 * - translations
 * - bilingual educational values
 * - document `lang`
 * - document `dir`
 * - document title
 *
 * React only subscribes to changes and exposes the runtime through context.
 */
function I18nProvider({
    children
}: I18nProviderProps) {
    const [
        language,
        setLanguageState
    ] = useState<Language>(
        () => getI18nLanguage()
    );

    /**
     * Re-synchronizes React with the canonical i18n runtime.
     */
    const synchronizeLanguage =
        useCallback(
            (): void => {
                const currentLanguage =
                    getI18nLanguage();

                applyDocumentLanguage(
                    currentLanguage
                );

                setLanguageState(
                    currentLanguage
                );
            },
            []
        );

    useEffect(
        () => {
            /*
             * Handles changes initiated inside this browser tab through
             * `setI18nLanguage()`.
             */
            const handleLanguageChange =
                (): void => {
                    synchronizeLanguage();
                };

            /*
             * Keeps multiple Dino tabs synchronized when localStorage changes
             * in another document.
             */
            const handleStorage =
                (
                    event: StorageEvent
                ): void => {
                    if (
                        event.key !== "language"
                    ) {
                        return;
                    }

                    synchronizeLanguage();
                };

            window.addEventListener(
                "dino:languagechange",
                handleLanguageChange
            );

            window.addEventListener(
                "storage",
                handleStorage
            );

            synchronizeLanguage();

            return () => {
                window.removeEventListener(
                    "dino:languagechange",
                    handleLanguageChange
                );

                window.removeEventListener(
                    "storage",
                    handleStorage
                );
            };
        },
        [
            synchronizeLanguage
        ]
    );

    const changeLanguage =
        useCallback(
            (
                nextLanguage: Language
            ): void => {
                if (
                    nextLanguage
                    === getI18nLanguage()
                ) {
                    applyDocumentLanguage(
                        nextLanguage
                    );

                    return;
                }

                setI18nLanguage(
                    nextLanguage
                );

                /*
                 * The custom event emitted by `setI18nLanguage()` also updates
                 * this state. Updating immediately here keeps the React API
                 * deterministic even if the event implementation changes.
                 */
                setLanguageState(
                    nextLanguage
                );
            },
            []
        );

    const value =
        useMemo<I18nContextValue>(
            () => ({
                language,

                direction:
                    getTextDirection(
                        language
                    ),

                setLanguage:
                    changeLanguage,

                t,

                localizedValue,

                localizedTextClass
            }),
            [
                language,
                changeLanguage
            ]
        );

    return (
        <I18nContext.Provider
            value={value}
        >
            {children}
        </I18nContext.Provider>
    );
}

/**
 * Returns the reactive Dino internationalization API.
 */
function useI18n(): I18nContextValue {
    const context =
        useContext(
            I18nContext
        );

    if (!context) {
        throw new Error(
            "useI18n must be used inside I18nProvider."
        );
    }

    return context;
}

export {
    I18nProvider,
    useI18n
};

export type {
    I18nContextValue
};