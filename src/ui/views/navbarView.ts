import { parseAppSection } from "../../core/navigation.js";
import { t } from "../../i18n/i18n.js";
import type { AppSection } from "../../types/global.js";

export {
    renderNavbar,
    renderNavbarView
};

/**
 * Renders the shared navigation using the persisted active section.
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
 * Presentation layer for the shared application navigation bar.
 *
 * This file owns:
 * - navbar HTML
 * - active-section presentation
 * - responsive navbar CSS
 * - localized labels and accessibility titles
 *
 * Routing, mobile-menu interaction and search opening remain in
 * `src/core/router.ts`.
 */

/**
 * Renders the shared application navigation bar.
 *
 * Navigation actions are exposed through data attributes. The router installs
 * one delegated event listener on the persistent application root.
 *
 * @param currentSection - Currently active top-level application section.
 * @returns Complete navbar HTML.
 */
function renderNavbarView(
    currentSection: AppSection
): string {
    return `
        <nav
            id="main-navbar"
            style="
                background:#087F5B;
                height:48px;
                display:flex;
                align-items:center;
                justify-content:space-between;
                padding:0 16px;
                position:sticky;
                top:0;
                z-index:1000;
            "
        >
            ${renderNavbarBrandView()}

            <button
                id="menu-toggle"
                type="button"
                data-nav-action="toggle-menu"
                aria-label="Menu"
                aria-controls="nav-links"
                aria-expanded="false"
                style="
                    display:none;
                    background:none;
                    border:none;
                    color:#fff;
                    font-size:20px;
                    cursor:pointer;
                    padding:4px 8px;
                    margin:0;
                    line-height:1;
                "
            >
                ☰
            </button>

            <div
                id="nav-links"
                style="
                    display:flex;
                    align-items:center;
                    gap:0;
                "
            >
                ${renderNavbarSectionItemView(
                    "grammar",
                    t("navbar.grammar"),
                    currentSection
                )}

                ${renderNavbarSectionItemView(
                    "vocabulary",
                    t("navbar.vocabulary"),
                    currentSection
                )}

                ${renderNavbarSectionItemView(
                    "travel",
                    t("navbar.travel"),
                    currentSection
                )}

                ${renderNavbarSearchView()}
            </div>
        </nav>

        ${renderNavbarResponsiveStyleView()}
    `;
}

/**
 * Renders the application brand displayed at the beginning of the navbar.
 *
 * @returns Brand button HTML.
 */
function renderNavbarBrandView(): string {
    return `
        <button
            type="button"
            class="navbar-brand"
            data-nav-section="home"
            style="
                background:none;
                border:none;
                cursor:pointer;
                display:flex;
                align-items:center;
                gap:6px;
                padding:0;
                margin:0;
                font:inherit;
            "
        >
            <span style="font-size:16px;">
                🦖
            </span>

            <span style="
                color:#fff;
                font-size:14px;
                font-weight:700;
            ">
                ${t("app.title")}
            </span>
        </button>
    `;
}

/**
 * Renders one top-level application section.
 *
 * @param section - Destination application section.
 * @param label - Localized section label.
 * @param currentSection - Current application section.
 * @returns Navigation item HTML.
 */
function renderNavbarSectionItemView(
    section: AppSection,
    label: string,
    currentSection: AppSection
): string {
    const active =
        currentSection === section;

    return `
        <button
            type="button"
            class="navbar-section-item"
            data-nav-section="${section}"
            data-active="${active ? "true" : "false"}"
            ${active ? 'aria-current="page"' : ""}
            style="
                background:none;
                border:none;
                border-bottom:2px solid ${
                    active
                        ? "#fff"
                        : "transparent"
                };
                color:${
                    active
                        ? "#fff"
                        : "rgba(255,255,255,0.7)"
                };
                font-size:13px;
                font-weight:${
                    active
                        ? "700"
                        : "500"
                };
                cursor:pointer;
                padding:0 12px;
                line-height:48px;
                margin:0;
            "
        >
            ${label}
        </button>
    `;
}

/**
 * Renders the global search action.
 *
 * @returns Search button HTML.
 */
function renderNavbarSearchView(): string {
    return `
        <button
            type="button"
            class="navbar-icon-action"
            data-nav-action="search"
            title="${t("navbar.search")}"
            aria-label="${t("navbar.search")}"
            style="
                background:none;
                border:none;
                color:#fff;
                font-size:16px;
                cursor:pointer;
                padding:0 10px;
                margin:0;
                line-height:48px;
            "
        >
            🔍
        </button>
    `;
}

/**
 * Renders the temporary responsive CSS required by the classic-script navbar.
 *
 * This can later move to `src/styles/style.css` once the HTML extraction pass
 * is complete.
 *
 * @returns Responsive navbar style block.
 */
function renderNavbarResponsiveStyleView(): string {
    return `
        <style>
            .navbar-section-item:hover,
            .navbar-icon-action:hover,
            .navbar-brand:hover {
                color: #fff !important;
                opacity: 0.8;
            }

            @media (max-width: 768px) {
                #menu-toggle {
                    display: block !important;
                }

                #nav-links {
                    display: none !important;
                    position: absolute;
                    top: 48px;
                    left: 0;
                    right: 0;
                    background: #087F5B;
                    flex-direction: column;
                    padding: 4px 0;
                    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
                }

                #nav-links.open {
                    display: flex !important;
                }

                #nav-links button {
                    width: 100%;
                    text-align: left;
                    padding: 12px 16px !important;
                    line-height: 1.4 !important;
                    border-bottom:
                        1px solid rgba(255, 255, 255, 0.1) !important;
                    border-left: none !important;
                }

                .navbar-brand {
                    width: auto !important;
                }
            }
        </style>
    `;
}
