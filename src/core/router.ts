import {
    parseAppSection,
    registerNavigationHandlers,
    shouldHandleAppLink,
    type NavigationOptions
} from "./navigation.js";
import {
    createSectionRoute,
    parseAppRoute,
    serializeAppRoute,
    type AppRoute
} from "./routeEngine.js";
import { presentRoute } from "./routePresentation.js";
import { openSearch } from "../features/search/search.js";
import type { AppSection } from "../types/global.js";
import { app } from "../ui/ui.js";

export {
    initializeRouter,
    switchSection
};

/**
 * Application router and navbar interaction controller.
 *
 * This module is the sole owner of browser URL and history mutations.
 * Route rendering and visual transitions are delegated to
 * `routePresentation.ts`.
 */

interface DinoHistoryState {
    dinoRoute: true;
    index: number;
}

let navbarDelegatedEventsBound = false;
let routerStarted = false;
let historyIndex = 0;
let navigationQueue = Promise.resolve();

function isDinoHistoryState(
    value: unknown
): value is DinoHistoryState {
    if (
        typeof value !== "object"
        || value === null
    ) {
        return false;
    }

    const candidate = value as Partial<DinoHistoryState>;

    return (
        candidate.dinoRoute === true
        && typeof candidate.index === "number"
        && Number.isSafeInteger(candidate.index)
        && candidate.index >= 0
    );
}

/** Serializes rendering so async data loads cannot overtake a route. */
function enqueueNavigation(
    task: () => Promise<void>
): Promise<void> {
    const result = navigationQueue.then(
        task,
        task
    );

    navigationQueue = result.catch(
        () => undefined
    );

    return result;
}

function getRouteUrl(
    route: AppRoute
): string {
    return `${window.location.pathname}${serializeAppRoute(route)}`;
}

async function performNavigation(
    requestedRoute: AppRoute,
    options: NavigationOptions = {}
): Promise<void> {
    routerStarted = true;
    const route = parseAppRoute(
        serializeAppRoute(
            requestedRoute
        )
    ) ?? { view: "home" };
    const routeUrl = getRouteUrl(route);
    const currentUrl =
        `${window.location.pathname}${window.location.search}`;

    if (
        options.replace
        || routeUrl === currentUrl
    ) {
        window.history.replaceState(
            {
                dinoRoute: true,
                index: historyIndex
            } satisfies DinoHistoryState,
            "",
            routeUrl
        );
    } else {
        historyIndex += 1;
        window.history.pushState(
            {
                dinoRoute: true,
                index: historyIndex
            } satisfies DinoHistoryState,
            "",
            routeUrl
        );
    }

    closeNavigationMenu();
    await presentRoute(
        route,
        options.focus ?? true
    );
}

/** Restores, validates and canonicalizes the current query string. */
async function restoreRequestedRoute(
    options: Pick<NavigationOptions, "focus"> = {}
): Promise<void> {
    routerStarted = true;

    const parsed = parseAppRoute(
        window.location.search
    );
    const route: AppRoute = parsed ?? { view: "home" };
    const state = window.history.state;

    historyIndex = isDinoHistoryState(state)
        ? state.index
        : 0;

    window.history.replaceState(
        {
            dinoRoute: true,
            index: historyIndex
        } satisfies DinoHistoryState,
        "",
        getRouteUrl(route)
    );

    closeNavigationMenu();
    await presentRoute(
        route,
        options.focus ?? false
    );
}

/** Uses in-app history when available and a stable parent otherwise. */
async function navigateBack(
    fallback: AppRoute
): Promise<void> {
    if (historyIndex > 0) {
        window.history.back();
        return;
    }

    await performNavigation(
        fallback,
        {
            replace: true,
            focus: true
        }
    );
}

function handlePopState(
    event: PopStateEvent
): void {
    if (!routerStarted) {
        return;
    }

    const state = event.state;
    historyIndex = isDinoHistoryState(state)
        ? state.index
        : 0;

    void enqueueNavigation(
        () => restoreRequestedRoute({ focus: true })
    );
}

/**
 * Applies one consistent visual and accessibility state to the header menu.
 *
 * @param open - Whether the menu must be visible.
 * @param restoreFocus - Whether focus should return to its trigger.
 */
function setNavigationMenuOpen(
    open: boolean,
    restoreFocus = false
): void {
    const menu =
        document.getElementById(
            "nav-links"
        );

    const toggle =
        document.getElementById(
            "menu-toggle"
        ) as HTMLButtonElement | null;

    if (!menu) {
        return;
    }

    menu.hidden = !open;

    toggle?.setAttribute(
        "aria-expanded",
        String(open)
    );

    if (
        restoreFocus
        && toggle
    ) {
        toggle.focus();
    }
}

/**
 * Opens or closes the main navigation menu.
 */
function toggleNavigationMenu(): void {
    const menu =
        document.getElementById(
            "nav-links"
        );

    if (!menu) {
        return;
    }

    setNavigationMenuOpen(
        menu.hidden
    );
}

/**
 * Closes the main navigation menu.
 */
function closeNavigationMenu(
    restoreFocus = false
): void {
    setNavigationMenuOpen(
        false,
        restoreFocus
    );
}

/**
 * Routes the application to a top-level section.
 *
 * @param section - Destination application section.
 */
async function switchSection(
    section: AppSection
): Promise<void> {
    await enqueueNavigation(
        () => performNavigation(
            createSectionRoute(section)
        )
    );
}

/**
 * Installs one delegated click handler for every rendered navbar.
 *
 * `#app` itself survives page changes, while its `innerHTML` is replaced.
 * Delegating events here therefore avoids rebuilding listeners every time a
 * screen calls `renderNavbar()`.
 */
function bindNavbarDelegatedEvents(): void {
    if (
        navbarDelegatedEventsBound
    ) {
        return;
    }

    app.addEventListener(
        "click",
        event => {
            const target =
                event.target;

            if (
                !(target instanceof Element)
            ) {
                return;
            }

            const sectionButton =
                target.closest<HTMLElement>(
                    "[data-nav-section]"
                );

            if (
                sectionButton
                && app.contains(
                    sectionButton
                )
            ) {
                if (
                    sectionButton instanceof HTMLAnchorElement
                ) {
                    if (!shouldHandleAppLink(event)) {
                        return;
                    }

                    event.preventDefault();
                }

                const section =
                    parseAppSection(
                        sectionButton.dataset.navSection
                    );

                if (section) {
                    void switchSection(
                        section
                    );
                }

                return;
            }

            const actionButton =
                target.closest<HTMLElement>(
                    "[data-nav-action]"
                );

            if (
                !actionButton
                || !app.contains(
                    actionButton
                )
            ) {
                return;
            }

            switch (
                actionButton.dataset.navAction
            ) {
                case "toggle-menu":
                    toggleNavigationMenu();
                    break;

                case "search":
                    closeNavigationMenu();
                    openSearch();
                    break;
            }
        }
    );

    document.addEventListener(
        "click",
        event => {
            const target =
                event.target;

            if (
                target instanceof Element
                && !target.closest(
                    "#main-navbar"
                )
            ) {
                closeNavigationMenu();
            }
        }
    );

    document.addEventListener(
        "keydown",
        event => {
            if (
                event.key === "Escape"
                && document.getElementById(
                    "nav-links"
                )?.hidden === false
            ) {
                closeNavigationMenu(
                    true
                );
            }
        }
    );

    navbarDelegatedEventsBound = true;
}

/** Installs navigation without rendering before onboarding has completed. */
function initializeRouter(): void {
    registerNavigationHandlers({
        navigate: (route, options) => enqueueNavigation(
            () => performNavigation(route, options)
        ),
        restore: options => enqueueNavigation(
            () => restoreRequestedRoute(options)
        ),
        back: fallback => enqueueNavigation(
            () => navigateBack(fallback)
        )
    });
    bindNavbarDelegatedEvents();
    window.addEventListener(
        "popstate",
        handlePopState
    );
    window.history.scrollRestoration = "manual";
}
