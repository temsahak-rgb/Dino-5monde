/**
 * Application top-level router and navbar interaction controller.
 *
 * Navigation HTML is delegated to `src/ui/views/navbarView.ts`.
 */

let navbarDelegatedEventsBound = false;

/**
 * Renders the shared application navigation bar.
 *
 * This compatibility facade is intentionally kept because page views already
 * call `renderNavbar()`.
 *
 * @returns Complete navbar HTML.
 */
function renderNavbar(): string {
    const currentSection =
        parseAppSection(
            localStorage.getItem(
                "currentSection"
            )
        )
        ?? "home";

    return renderNavbarView(
        currentSection
    );
}

/**
 * Opens or closes the responsive navigation menu.
 */
function toggleMobileMenu(): void {
    const links =
        document.getElementById(
            "nav-links"
        );

    const toggle =
        document.getElementById(
            "menu-toggle"
        ) as HTMLButtonElement | null;

    if (!links) {
        return;
    }

    const open =
        links.classList.toggle(
            "open"
        );

    if (toggle) {
        toggle.setAttribute(
            "aria-expanded",
            String(open)
        );
    }
}

/**
 * Closes the responsive navigation menu when currently open.
 */
function closeMobileMenu(): void {
    const links =
        document.getElementById(
            "nav-links"
        );

    const toggle =
        document.getElementById(
            "menu-toggle"
        ) as HTMLButtonElement | null;

    links?.classList.remove(
        "open"
    );

    toggle?.setAttribute(
        "aria-expanded",
        "false"
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

    closeMobileMenu();

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

        case "daily":
            await showDailyHome();
            break;

        case "travel":
            await showTravelPage();
            break;

        case "games":
            showGamesPage();
            break;

        case "exercises":
            showExercisesPage();
            break;

        case "profile":
            showProfile();
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
                    toggleMobileMenu();
                    break;

                case "search":
                    closeMobileMenu();
                    openSearch();
                    break;
            }
        }
    );

    navbarDelegatedEventsBound = true;
}

/**
 * Validates a value before using it as an application section.
 *
 * @param value - Raw persisted or DOM value.
 * @returns Valid application section or null.
 */
function parseAppSection(
    value: string | null | undefined
): AppSection | null {
    switch (value) {
        case "home":
        case "grammar":
        case "vocabulary":
        case "daily":
        case "travel":
        case "games":
        case "exercises":
        case "profile":
            return value;

        default:
            return null;
    }
}

bindNavbarDelegatedEvents();