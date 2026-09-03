/**
 * Stable navigation boundary shared by feature controllers.
 *
 * Feature modules request a top-level route without importing the router or
 * another page controller. The router registers the concrete handler during
 * application bootstrap.
 */

import type { AppSection } from "../types/global.js";

type NavigationHandler =
    (section: AppSection) => Promise<void>;

let navigationHandler:
    NavigationHandler | null = null;

/**
 * Registers the application's concrete top-level navigation handler.
 */
function registerNavigationHandler(
    handler: NavigationHandler
): void {
    navigationHandler =
        handler;
}

/**
 * Navigates through the registered router without coupling callers to it.
 */
async function navigateToSection(
    section: AppSection
): Promise<void> {
    if (
        !navigationHandler
    ) {
        throw new Error(
            "Navigation requested before router initialization."
        );
    }

    await navigationHandler(
        section
    );
}

/**
 * Validates persisted and DOM values before they enter the router.
 */
function parseAppSection(
    value: string | null | undefined
): AppSection | null {
    switch (value) {
        case "home":
        case "grammar":
        case "vocabulary":
        case "travel":
            return value;

        default:
            return null;
    }
}

export {
    navigateToSection,
    parseAppSection,
    registerNavigationHandler
};
