import { t } from "../../i18n/i18n.js";
import type { InstitutionalPage } from "../../types/global.js";
import { renderNavbarView } from "./navbarView.js";

export {
    renderInstitutionalFooterView,
    renderInstitutionalPageView
};

const repositoryUrl =
    "https://github.com/temsahak-rgb/Dino-5monde";
const issueUrl =
    `${repositoryUrl}/issues/new`;

/**
 * Renders the product-wide institutional footer.
 *
 * @param activePage - Institutional page currently displayed, when any.
 * @returns Semantic footer HTML.
 */
function renderInstitutionalFooterView(
    activePage: InstitutionalPage | null = null
): string {
    return `
        <footer class="site-footer">
            <div class="site-footer__inner">
                <div class="site-footer__brand">
                    <span aria-hidden="true">🦖</span>
                    <div>
                        <strong>${t("app.title")}</strong>
                        <p>${t("footer.tagline")}</p>
                    </div>
                </div>

                <nav
                    class="site-footer__navigation"
                    aria-label="${t("footer.navigationLabel")}"
                >
                    ${renderFooterLink(
                        "about",
                        t("footer.about"),
                        activePage
                    )}
                    ${renderFooterLink(
                        "contact",
                        t("footer.contact"),
                        activePage
                    )}
                    ${renderFooterLink(
                        "work-with-us",
                        t("footer.workWithUs"),
                        activePage
                    )}
                </nav>
            </div>
        </footer>
    `;
}

/**
 * Renders one footer navigation link.
 */
function renderFooterLink(
    page: InstitutionalPage,
    label: string,
    activePage: InstitutionalPage | null
): string {
    const active = page === activePage;

    return `
        <a
            href="?view=info&amp;page=${page}"
            data-institutional-page="${page}"
            ${active ? 'aria-current="page"' : ""}
        >
            ${label}
        </a>
    `;
}

/**
 * Renders a complete institutional information page.
 *
 * These pages intentionally remain static and transparent: contact and
 * contribution actions point to the public project channels that exist today.
 *
 * @param page - Institutional destination to display.
 * @returns Complete page HTML.
 */
function renderInstitutionalPageView(
    page: InstitutionalPage
): string {
    return `
        ${renderNavbarView(null)}

        <main class="institutional-page">
            <button
                type="button"
                class="back-btn"
                data-institutional-action="home"
            >
                ← ${t("common.back")}
            </button>

            ${renderInstitutionalHeader(page)}
            ${renderInstitutionalContent(page)}
        </main>
    `;
}

/**
 * Renders the title block shared by institutional pages.
 */
function renderInstitutionalHeader(
    page: InstitutionalPage
): string {
    const titleKey = {
        about: "institutional.about.title",
        contact: "institutional.contact.title",
        "work-with-us": "institutional.work.title"
    } as const;
    const introductionKey = {
        about: "institutional.about.introduction",
        contact: "institutional.contact.introduction",
        "work-with-us": "institutional.work.introduction"
    } as const;

    return `
        <header class="institutional-page__header">
            <p class="institutional-page__eyebrow">
                ${t("institutional.eyebrow")}
            </p>
            <h1>${t(titleKey[page])}</h1>
            <p>${t(introductionKey[page])}</p>
        </header>
    `;
}

/**
 * Selects the useful, shipped content for an institutional page.
 */
function renderInstitutionalContent(
    page: InstitutionalPage
): string {
    switch (page) {
        case "about":
            return renderAboutContent();

        case "contact":
            return renderContactContent();

        case "work-with-us":
            return renderWorkWithUsContent();
    }
}

/**
 * Renders product mission and learning-method information.
 */
function renderAboutContent(): string {
    return `
        <div class="institutional-page__grid">
            ${renderInformationCard(
                "🎯",
                t("institutional.about.missionTitle"),
                t("institutional.about.missionBody")
            )}
            ${renderInformationCard(
                "🧭",
                t("institutional.about.methodTitle"),
                t("institutional.about.methodBody")
            )}
            ${renderInformationCard(
                "🌍",
                t("institutional.about.audienceTitle"),
                t("institutional.about.audienceBody")
            )}
        </div>

        <section class="institutional-page__notice">
            <h2>${t("institutional.about.privacyTitle")}</h2>
            <p>${t("institutional.about.privacyBody")}</p>
        </section>
    `;
}

/**
 * Renders contact guidance and the project's real support channel.
 */
function renderContactContent(): string {
    return `
        <section class="institutional-page__section">
            <h2>${t("institutional.contact.beforeTitle")}</h2>
            <ul class="institutional-page__list">
                <li>${t("institutional.contact.itemContent")}</li>
                <li>${t("institutional.contact.itemBug")}</li>
                <li>${t("institutional.contact.itemAccessibility")}</li>
            </ul>
        </section>

        ${renderExternalAction(
            issueUrl,
            t("institutional.contact.action"),
            t("institutional.contact.actionMeta")
        )}

        <p class="institutional-page__fine-print">
            ${t("institutional.contact.publicNotice")}
        </p>
    `;
}

/**
 * Renders concrete contribution paths without implying unavailable vacancies.
 */
function renderWorkWithUsContent(): string {
    return `
        <div class="institutional-page__grid">
            ${renderInformationCard(
                "✍️",
                t("institutional.work.contentTitle"),
                t("institutional.work.contentBody")
            )}
            ${renderInformationCard(
                "🧩",
                t("institutional.work.productTitle"),
                t("institutional.work.productBody")
            )}
            ${renderInformationCard(
                "🛠️",
                t("institutional.work.technicalTitle"),
                t("institutional.work.technicalBody")
            )}
        </div>

        ${renderExternalAction(
            repositoryUrl,
            t("institutional.work.action"),
            t("institutional.work.actionMeta")
        )}
    `;
}

/**
 * Renders one compact information card.
 */
function renderInformationCard(
    icon: string,
    title: string,
    body: string
): string {
    return `
        <article class="institutional-card">
            <span class="institutional-card__icon" aria-hidden="true">
                ${icon}
            </span>
            <h2>${title}</h2>
            <p>${body}</p>
        </article>
    `;
}

/**
 * Renders an external action with enough context to make its destination
 * predictable for keyboard and screen-reader users.
 */
function renderExternalAction(
    href: string,
    label: string,
    description: string
): string {
    return `
        <aside class="institutional-action">
            <div>
                <strong>${label}</strong>
                <p>${description}</p>
            </div>
            <a
                href="${href}"
                target="_blank"
                rel="noreferrer"
            >
                ${label}
                <span aria-hidden="true">↗</span>
            </a>
        </aside>
    `;
}
