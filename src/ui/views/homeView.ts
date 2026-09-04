import { renderNavbar } from "./navbarView.js";
import { t } from "../../i18n/i18n.js";
import type { Level } from "../../types/global.js";
import { sectionHeader } from "../ui.js";

export {
    renderHomeView
};

/**
 * Presentation layer for the application home page.
 *
 * This file owns the HTML structure of the home screen. Application state,
 * data loading and navigation remain outside the view layer.
 */

/**
 * Renders the personalized home page.
 *
 * @param level - Current CEFR level of the learner.
 * @param newsHtml - Pre-rendered dynamic news section.
 * @returns Complete home-page HTML.
 */
function renderHomeView(
    level: Level,
    newsHtml: string
): string {
    return `
        ${renderNavbar()}

        <div style="
            max-width:960px;
            margin:0 auto;
            padding:32px 20px 60px;
        ">
            ${renderHomeHeader(level)}

            ${newsHtml}

            ${renderHomeHighlights()}
        </div>
    `;
}

/**
 * Renders the greeting and current learner level.
 *
 * @param level - Current CEFR level.
 * @returns Home header HTML.
 */
function renderHomeHeader(
    level: Level
): string {
    return `
        <div style="
            display:flex;
            align-items:center;
            gap:16px;
            margin-bottom:8px;
        ">
            <span style="
                font-size:48px;
                line-height:1;
            ">
                🦖
            </span>

            <h1 style="
                font-size:30px;
                font-weight:700;
                color:#1a1a1a;
                margin:0;
            ">
                ${t("home.greeting")}
            </h1>
        </div>

        <p style="
            font-size:17px;
            color:#777;
            margin:0 0 36px;
        ">
            ${level} · ${t("home.currentLevel")}
        </p>
    `;
}

/**
 * Renders the static editorial highlights displayed under the news section.
 *
 * @returns Highlight section HTML.
 */
function renderHomeHighlights(): string {
    return `
        <div style="margin-bottom:45px;">
            ${sectionHeader(
                t("home.newsAdvice"),
                { destination: "journal" }
            )}

            <div style="
                display:grid;
                grid-template-columns:repeat(
                    auto-fill,
                    minmax(280px, 1fr)
                );
                gap:14px;
            ">
                ${renderHomeGrammarCard()}
                ${renderHomeDailyCard()}
                ${renderHomeTravelCard()}
                ${renderHomeTipCard()}
            </div>
        </div>
    `;
}

/**
 * Renders the grammar editorial card.
 *
 * @returns Grammar highlight HTML.
 */
function renderHomeGrammarCard(): string {
    return `
        <a
            href="?view=grammar"
            data-nav-section="grammar"
            data-home-highlight="grammar"
            class="home-highlight-card"
            style="
            background:#fff;
            border:1px solid #e0e0e0;
            border-radius:8px;
            overflow:hidden;
            cursor:pointer;
            grid-column:span 2;
            text-decoration:none;
            color:inherit;
        ">
            <div style="
                height:180px;
                background:linear-gradient(
                    135deg,
                    #e8f5f0,
                    #d0ebe1
                );
                display:flex;
                align-items:center;
                justify-content:center;
                font-size:64px;
            ">
                📖
            </div>

            <div style="padding:18px;">
                <p style="
                    font-size:12px;
                    font-weight:700;
                    color:#087F5B;
                    text-transform:uppercase;
                    letter-spacing:1px;
                    margin:0 0 10px;
                ">
                    ${t("home.grammarLabel")}
                </p>

                <h3 style="
                    font-size:18px;
                    font-weight:600;
                    color:#1a1a1a;
                    margin:0 0 10px;
                    line-height:1.4;
                ">
                    ${t("home.grammarTitle")}
                </h3>

                <p style="
                    font-size:13px;
                    color:#888;
                    margin:0;
                ">
                    ${t("home.grammarMeta")}
                </p>
            </div>
        </a>
    `;
}

/**
 * Renders the daily-life editorial card.
 *
 * @returns Daily-life highlight HTML.
 */
function renderHomeDailyCard(): string {
    return `
        <a
            href="?view=vocabulary"
            data-nav-section="vocabulary"
            data-home-highlight="vocabulary"
            class="home-highlight-card"
            style="
            background:#fff;
            border:1px solid #e0e0e0;
            border-radius:8px;
            overflow:hidden;
            cursor:pointer;
            text-decoration:none;
            color:inherit;
        ">
            <div style="
                height:120px;
                background:linear-gradient(
                    135deg,
                    #fef3e2,
                    #fde5c8
                );
                display:flex;
                align-items:center;
                justify-content:center;
                font-size:48px;
            ">
                🏦
            </div>

            <div style="padding:16px;">
                <p style="
                    font-size:12px;
                    font-weight:700;
                    color:#d97706;
                    text-transform:uppercase;
                    letter-spacing:1px;
                    margin:0 0 8px;
                ">
                    ${t("home.dailyLabel")}
                </p>

                <h3 style="
                    font-size:16px;
                    font-weight:600;
                    color:#1a1a1a;
                    margin:0 0 8px;
                    line-height:1.4;
                ">
                    ${t("home.dailyTitle")}
                </h3>

                <p style="
                    font-size:13px;
                    color:#888;
                    margin:0;
                ">
                    ${t("home.dailyMeta")}
                </p>
            </div>
        </a>
    `;
}

/**
 * Renders the travel editorial card.
 *
 * @returns Travel highlight HTML.
 */
function renderHomeTravelCard(): string {
    return `
        <a
            href="?view=travel"
            data-nav-section="travel"
            data-home-highlight="travel"
            class="home-highlight-card"
            style="
            background:#fff;
            border:1px solid #e0e0e0;
            border-radius:8px;
            overflow:hidden;
            cursor:pointer;
            text-decoration:none;
            color:inherit;
        ">
            <div style="
                height:120px;
                background:linear-gradient(
                    135deg,
                    #e8f0fe,
                    #d5e5fc
                );
                display:flex;
                align-items:center;
                justify-content:center;
                font-size:48px;
            ">
                ✈️
            </div>

            <div style="padding:16px;">
                <p style="
                    font-size:12px;
                    font-weight:700;
                    color:#2563eb;
                    text-transform:uppercase;
                    letter-spacing:1px;
                    margin:0 0 8px;
                ">
                    ${t("home.travelLabel")}
                </p>

                <h3 style="
                    font-size:16px;
                    font-weight:600;
                    color:#1a1a1a;
                    margin:0 0 8px;
                    line-height:1.4;
                ">
                    ${t("home.travelTitle")}
                </h3>

                <p style="
                    font-size:13px;
                    color:#888;
                    margin:0;
                ">
                    ${t("home.travelMeta")}
                </p>
            </div>
        </a>
    `;
}

/**
 * Renders the daily-tip editorial card.
 *
 * @returns Tip highlight HTML.
 */
function renderHomeTipCard(): string {
    return `
        <a
            href="?view=journal"
            data-nav-section="journal"
            data-home-highlight="journal"
            class="home-highlight-card"
            style="
            background:#fffbeb;
            border:1px solid #fde68a;
            border-radius:8px;
            overflow:hidden;
            cursor:pointer;
            text-decoration:none;
            color:inherit;
        ">
            <div style="
                height:120px;
                background:linear-gradient(
                    135deg,
                    #fef9c3,
                    #fde68a
                );
                display:flex;
                align-items:center;
                justify-content:center;
                font-size:48px;
            ">
                ✨
            </div>

            <div style="padding:16px;">
                <p style="
                    font-size:12px;
                    font-weight:700;
                    color:#b45309;
                    text-transform:uppercase;
                    letter-spacing:1px;
                    margin:0 0 8px;
                ">
                    ✨ ${t("home.tipLabel")}
                </p>

                <h3 style="
                    font-size:16px;
                    font-weight:600;
                    color:#1a1a1a;
                    margin:0 0 8px;
                    line-height:1.4;
                ">
                    ${t("home.tipTitle")}
                </h3>

                <p style="
                    font-size:13px;
                    color:#888;
                    margin:0;
                ">
                    ${t("home.tipMeta")}
                </p>
            </div>
        </a>
    `;
}
