import { navigateToSection } from "../../core/navigation.js";
import type { InstitutionalPage } from "../../types/global.js";
import { app } from "../../ui/ui.js";
import {
    renderInstitutionalFooterView,
    renderInstitutionalPageView
} from "../../ui/views/institutionalView.js";

export {
    initializeInstitutionalNavigation,
    parseInstitutionalPage,
    showInstitutionalPage
};

let activePage: InstitutionalPage | null = null;
let initialized = false;

/**
 * Validates a DOM-provided institutional destination.
 */
function parseInstitutionalPage(
    value: string | null | undefined
): InstitutionalPage | null {
    switch (value) {
        case "about":
        case "contact":
        case "work-with-us":
            return value;

        default:
            return null;
    }
}

/**
 * Renders the persistent product footer in the document shell.
 */
function renderFooter(): void {
    const root = document.getElementById(
        "site-footer-root"
    );

    if (!root) {
        throw new Error(
            "Institutional footer root #site-footer-root was not found."
        );
    }

    root.innerHTML =
        renderInstitutionalFooterView(
            activePage
        );
}

/**
 * Displays one institutional information page.
 */
function showInstitutionalPage(
    page: InstitutionalPage
): void {
    activePage = page;
    app.innerHTML =
        renderInstitutionalPageView(
            page
        );
    renderFooter();
    window.scrollTo({
        top: 0,
        behavior: "smooth"
    });
}

/**
 * Handles links inside the persistent footer.
 */
function handleFooterClick(
    event: MouseEvent
): void {
    const target = event.target;

    if (!(target instanceof Element)) {
        return;
    }

    const link =
        target.closest<HTMLElement>(
            "[data-institutional-page]"
        );
    const page = parseInstitutionalPage(
        link?.dataset.institutionalPage
    );

    if (!link || !page) {
        return;
    }

    event.preventDefault();
    showInstitutionalPage(page);
}

/**
 * Handles page actions and clears footer state when top-level navigation is
 * used from an institutional page.
 */
function handleAppClick(
    event: MouseEvent
): void {
    const target = event.target;

    if (!(target instanceof Element)) {
        return;
    }

    const action = target.closest<HTMLElement>(
        "[data-institutional-action]"
    );

    if (
        action?.dataset.institutionalAction
        === "home"
    ) {
        activePage = null;
        renderFooter();
        void navigateToSection("home");
        return;
    }

    if (
        activePage
        && target.closest(
            "[data-nav-section]"
        )
    ) {
        activePage = null;
        renderFooter();
    }
}

/**
 * Re-renders institutional UI after the onboarding language changes.
 */
function handleLanguageChange(): void {
    if (activePage) {
        app.innerHTML =
            renderInstitutionalPageView(
                activePage
            );
    }

    renderFooter();
}

/**
 * Installs the persistent footer and its delegated interactions once.
 */
function initializeInstitutionalNavigation(): void {
    if (initialized) {
        return;
    }

    const root = document.getElementById(
        "site-footer-root"
    );

    if (!root) {
        throw new Error(
            "Institutional footer root #site-footer-root was not found."
        );
    }

    root.addEventListener(
        "click",
        handleFooterClick
    );
    app.addEventListener(
        "click",
        handleAppClick
    );
    window.addEventListener(
        "dino:languagechange",
        handleLanguageChange
    );

    renderFooter();
    initialized = true;
}
