/** Stable navigation boundary shared by feature controllers. */
import {
    createSectionRoute,
    type AppRoute
} from "./routeEngine.js";
import type { AppSection } from "../types/global.js";

interface NavigationOptions {
    replace?: boolean;
    focus?: boolean;
}

type NavigationHandler = (
    route: AppRoute,
    options?: NavigationOptions
) => Promise<void>;
type RestoreHandler = (
    options?: Pick<NavigationOptions, "focus">
) => Promise<void>;
type BackHandler = (
    fallback: AppRoute
) => Promise<void>;

interface NavigationHandlers {
    navigate: NavigationHandler;
    restore: RestoreHandler;
    back: BackHandler;
}

let navigationHandlers: NavigationHandlers | null = null;

/** Registers the concrete browser-router operations during bootstrap. */
function registerNavigationHandlers(
    handlers: NavigationHandlers
): void {
    navigationHandlers = handlers;
}

/** Navigates to one trusted durable route. */
async function navigateToRoute(
    route: AppRoute,
    options?: NavigationOptions
): Promise<void> {
    if (!navigationHandlers) {
        throw new Error(
            "Navigation requested before router initialization."
        );
    }

    await navigationHandlers.navigate(
        route,
        options
    );
}

/** Navigates to a top-level section through its canonical route. */
async function navigateToSection(
    section: AppSection
): Promise<void> {
    await navigateToRoute(
        createSectionRoute(section)
    );
}

/** Restores the route requested by the current URL. */
async function restoreRequestedRoute(
    options?: Pick<NavigationOptions, "focus">
): Promise<void> {
    if (!navigationHandlers) {
        throw new Error(
            "Route restoration requested before router initialization."
        );
    }

    await navigationHandlers.restore(options);
}

/** Returns through app history, or renders a deterministic direct-link fallback. */
async function navigateBack(
    fallback: AppRoute
): Promise<void> {
    if (!navigationHandlers) {
        throw new Error(
            "Back navigation requested before router initialization."
        );
    }

    await navigationHandlers.back(fallback);
}

/** Validates persisted and DOM values before they enter the router. */
function parseAppSection(
    value: string | null | undefined
): AppSection | null {
    switch (value) {
        case "home":
        case "grammar":
        case "vocabulary":
        case "travel":
        case "journal":
            return value;

        default:
            return null;
    }
}

/** Returns whether a real app link should use client-side navigation. */
function shouldHandleAppLink(
    event: MouseEvent
): boolean {
    return (
        !event.defaultPrevented
        && event.button === 0
        && !event.altKey
        && !event.ctrlKey
        && !event.metaKey
        && !event.shiftKey
    );
}

export {
    navigateBack,
    navigateToRoute,
    navigateToSection,
    parseAppSection,
    registerNavigationHandlers,
    restoreRequestedRoute,
    shouldHandleAppLink
};

export type {
    NavigationHandlers,
    NavigationOptions
};
