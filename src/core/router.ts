import {
    parseAppSection,
    registerNavigationHandler
} from "./navigation.js";
import { showGrammarPage } from "../features/grammar/grammar.js";
import {
    showJournalPage
} from "../features/news/news.js";
import {
    openSearch
} from "../features/search/search.js";
import { showTravelPage } from "../features/travel/travel.js";
import { showVocabularyPage } from "../features/vocabulary/vocabulary.js";
import { showHome } from "../pages/home.js";
import type { AppSection } from "../types/global.js";
import { app } from "../ui/ui.js";

export {
    initializeRouter,
    switchSection
};

/**
 * Application top-level router and navbar interaction controller.
 *
 * Navigation HTML is delegated to `src/ui/views/navbarView.ts`.
 */

let navbarDelegatedEventsBound = false;

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
    localStorage.setItem(
        "currentSection",
        section
    );

    closeNavigationMenu();

    switch (section) {
        case "home":
            await showHome();
            break;

        case "grammar":
            await showGrammarPage();
            break;

        case "vocabulary":
            await showVocabularyPage();
            break;

        case "travel":
            await showTravelPage();
            break;

        case "journal":
            await showJournalPage();
            break;
    }
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

/**
 * Installs the application-wide navigation event delegation once.
 */
function initializeRouter(): void {
    registerNavigationHandler(
        switchSection
    );
    bindNavbarDelegatedEvents();
}
