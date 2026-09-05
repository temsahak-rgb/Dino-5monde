import {
    createElement,
    type ComponentType,
    type ReactElement,
    type ReactNode
} from "react";

import {
    renderToStaticMarkup
} from "react-dom/server";

import {
    MemoryRouter
} from "react-router";

import type {
    Language
} from "../../src/types/global.js";

interface ReactTestBrowser {
    setLanguage:
        (language: Language) => void;
}

type ReactProvider =
    ComponentType<{
        children: ReactNode;
    }>;

/**
 * Installs the small browser surface required while importing the i18n
 * runtime in Node. React effects are intentionally not emulated here: these
 * tests exercise deterministic server-rendered presentation.
 */
function installReactTestBrowser(
    initialLanguage: Language = "fr"
): ReactTestBrowser {
    let language =
        initialLanguage;

    Object.defineProperty(
        globalThis,
        "localStorage",
        {
            configurable: true,
            value: {
                getItem: (
                    key: string
                ) => key === "language"
                    ? language
                    : null,
                setItem: (
                    key: string,
                    value: string
                ) => {
                    if (
                        key === "language"
                        && (
                            value === "fr"
                            || value === "fa"
                        )
                    ) {
                        language =
                            value;
                    }
                }
            }
        }
    );

    Object.defineProperty(
        globalThis,
        "document",
        {
            configurable: true,
            value: {
                documentElement: {
                    dir: "ltr",
                    lang: "fr"
                },
                title: ""
            }
        }
    );

    return {
        setLanguage: (
            nextLanguage: Language
        ) => {
            language =
                nextLanguage;
        }
    };
}

/**
 * Renders a React view with the same router and i18n contexts it receives in
 * the application, while keeping the test runner DOM-free.
 */
function renderReactView(
    element: ReactElement,
    Provider: ReactProvider,
    route = "/"
): string {
    return renderToStaticMarkup(
        createElement(
            MemoryRouter,
            {
                initialEntries: [
                    route
                ]
            },
            createElement(
                Provider,
                {
                    children:
                        element
                }
            )
        )
    );
}

export {
    installReactTestBrowser,
    renderReactView
};
