import { parseAppSection } from "../../core/navigation.js";
import { t } from "../../i18n/i18n.js";
import type { AppSection } from "../../types/global.js";

export {
    renderNavbar,
    renderNavbarView
};

/**
 * Shared application navigation.
 *
 * Only shipped destinations are interactive. Roadmap entries remain visible
 * and explicitly unavailable, so the information architecture can grow
 * without sending learners to empty placeholder screens.
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
 * Renders the shared application header.
 *
 * Interaction is exposed through data attributes and owned by the router.
 *
 * @param currentSection - Current application section.
 * @returns Complete header HTML.
 */
function renderNavbarView(
    currentSection: AppSection
): string {
    return `
        <header
            id="main-navbar"
            class="navbar"
        >
            <nav
                class="navbar-bar"
                aria-label="${t("navbar.primaryNavigation")}"
            >
                ${renderNavbarBrandView(
                    currentSection
                )}

                <div class="navbar-actions">
                    ${renderNavbarSearchView()}

                    <button
                        id="menu-toggle"
                        type="button"
                        class="navbar-menu-toggle"
                        data-nav-action="toggle-menu"
                        aria-controls="nav-links"
                        aria-expanded="false"
                    >
                        <span aria-hidden="true">☰</span>
                        <span>${t("navbar.menu")}</span>
                    </button>
                </div>

                <div
                    id="nav-links"
                    class="navbar-menu-panel"
                    hidden
                >
                    ${renderLearningGroupView(
                        currentSection
                    )}

                    ${renderDiscoveryGroupView(
                        currentSection
                    )}
                    ${renderServicesGroupView()}
                    ${renderAccountGroupView()}
                </div>
            </nav>
        </header>
    `;
}

function renderNavbarBrandView(
    currentSection: AppSection
): string {
    const active =
        currentSection === "home";

    return `
        <button
            type="button"
            class="navbar-brand"
            data-nav-section="home"
            data-active="${active ? "true" : "false"}"
            ${active ? 'aria-current="page"' : ""}
        >
            <span aria-hidden="true">🦖</span>
            <span>${t("app.title")}</span>
        </button>
    `;
}

function renderLearningGroupView(
    currentSection: AppSection
): string {
    return `
        <section
            class="navbar-menu-group navbar-menu-group-learning"
            aria-labelledby="navbar-learning-title"
        >
            <h2
                id="navbar-learning-title"
                class="navbar-menu-group-title"
            >
                ${t("navbar.group.learning")}
            </h2>

            <p
                id="navbar-games-title"
                class="navbar-menu-subtitle"
            >
                ${t("navbar.gamesExercises")}
            </p>

            <div
                class="navbar-menu-subitems"
                role="group"
                aria-labelledby="navbar-games-title"
            >
                ${renderNavbarSectionItemView(
                    "grammar",
                    t("navbar.grammar"),
                    currentSection,
                    "📐"
                )}

                ${renderNavbarSectionItemView(
                    "vocabulary",
                    t("navbar.vocabulary"),
                    currentSection,
                    "📖"
                )}
            </div>

            ${renderNavbarSectionItemView(
                "travel",
                t("navbar.travel"),
                currentSection,
                "✈️"
            )}
        </section>
    `;
}

function renderDiscoveryGroupView(
    currentSection: AppSection
): string {
    return `
        <section
            class="navbar-menu-group"
            aria-labelledby="navbar-discovery-title"
        >
            <h2
                id="navbar-discovery-title"
                class="navbar-menu-group-title"
            >
                ${t("navbar.group.discovery")}
            </h2>

            ${renderPlannedNavbarItemView(
                t("navbar.music"),
                "🎵"
            )}

            ${renderNavbarSectionItemView(
                "journal",
                t("navbar.journal"),
                currentSection,
                "📰"
            )}
        </section>
    `;
}

function renderServicesGroupView(): string {
    return `
        <section
            class="navbar-menu-group"
            aria-labelledby="navbar-services-title"
        >
            <h2
                id="navbar-services-title"
                class="navbar-menu-group-title"
            >
                ${t("navbar.group.services")}
            </h2>

            ${renderPlannedNavbarItemView(
                t("navbar.shop"),
                "🛍️"
            )}
        </section>
    `;
}

function renderAccountGroupView(): string {
    return `
        <section
            class="navbar-menu-group"
            aria-labelledby="navbar-account-title"
        >
            <h2
                id="navbar-account-title"
                class="navbar-menu-group-title"
            >
                ${t("navbar.group.account")}
            </h2>

            ${renderPlannedNavbarItemView(
                t("navbar.archive"),
                "🗂️"
            )}

            ${renderPlannedNavbarItemView(
                t("navbar.profile"),
                "👤"
            )}
        </section>
    `;
}

function renderNavbarSectionItemView(
    section: AppSection,
    label: string,
    currentSection: AppSection,
    icon: string
): string {
    const active =
        currentSection === section;

    return `
        <button
            type="button"
            class="navbar-menu-item"
            data-nav-section="${section}"
            data-active="${active ? "true" : "false"}"
            ${active ? 'aria-current="page"' : ""}
        >
            <span
                class="navbar-menu-item-icon"
                aria-hidden="true"
            >
                ${icon}
            </span>

            <span>${label}</span>
        </button>
    `;
}

function renderPlannedNavbarItemView(
    label: string,
    icon: string
): string {
    return `
        <button
            type="button"
            class="navbar-menu-item navbar-menu-item-planned"
            data-nav-status="planned"
            aria-disabled="true"
            disabled
            title="${t("navbar.unavailable")}"
        >
            <span
                class="navbar-menu-item-icon"
                aria-hidden="true"
            >
                ${icon}
            </span>

            <span class="navbar-menu-item-label">
                ${label}
            </span>

            <span class="navbar-menu-item-badge">
                ${t("navbar.soon")}
            </span>
        </button>
    `;
}

function renderNavbarSearchView(): string {
    return `
        <button
            type="button"
            class="navbar-search"
            data-nav-action="search"
            title="${t("navbar.search")}"
            aria-label="${t("navbar.search")}"
        >
            <span aria-hidden="true">🔍</span>
        </button>
    `;
}
