import { renderNavbar } from "./navbarView.js";
import {
    localizedTextClass,
    localizedValue,
    t
} from "../../i18n/i18n.js";
import type {
    NewsArticle,
    NewsGrammarItem,
    NewsIndexItem,
    NewsSource,
    NewsVocabularyItem
} from "../../types/global.js";

export {
    renderNewsDetailView,
    renderNewsHomeCardView,
    renderNewsNotFoundView
};

/**
 * Presentation layer for the News feature.
 *
 * This file owns News HTML generation only.
 *
 * Loading, CEFR filtering, navigation and interaction state remain in
 * `src/features/news/news.ts`.
 */

/**
 * Renders the current news card displayed on the home page.
 *
 * Navigation is exposed through `data-news-id` and wired by the controller.
 *
 * @param news - News item to feature.
 * @returns Home-page news card HTML.
 */
function renderNewsHomeCardView(
    news: NewsIndexItem
): string {
    const title = localizedValue(
        news.title,
        news.title_fa
    );

    const subtitle = localizedValue(
        news.subtitle,
        news.subtitle_fa
    );

    return `
        <button
            type="button"
            class="news-home-card"
            data-news-id="${news.id}"
            style="
                width:100%;
                display:block;
                background:#fff;
                border:none;
                border-radius:12px;
                overflow:hidden;
                box-shadow:0 4px 12px rgba(0,0,0,0.1);
                margin:0 0 30px;
                padding:0;
                cursor:pointer;
                text-align:inherit;
                font:inherit;
            "
        >
            <div style="
                position:relative;
                height:350px;
                overflow:hidden;
            ">
                <img
                    src="${news.image}"
                    alt="${title}"
                    style="
                        width:100%;
                        height:100%;
                        object-fit:cover;
                    "
                >

                <div style="
                    position:absolute;
                    top:15px;
                    right:15px;
                    display:flex;
                    gap:8px;
                ">
                    <span style="
                        background:#087F5B;
                        color:#fff;
                        padding:6px 12px;
                        border-radius:6px;
                        font-size:13px;
                        font-weight:700;
                    ">
                        ${news.level}
                    </span>

                    <span style="
                        background:rgba(0,0,0,0.7);
                        color:#fff;
                        padding:6px 12px;
                        border-radius:6px;
                        font-size:13px;
                        font-weight:700;
                    ">
                        📰 ${t("news.weekly")}
                    </span>
                </div>

                <div style="
                    position:absolute;
                    bottom:0;
                    left:0;
                    right:0;
                    background:linear-gradient(
                        to top,
                        rgba(0,0,0,0.9),
                        transparent
                    );
                    padding:25px;
                    color:#fff;
                ">
                    <h2
                        class="${localizedTextClass()}"
                        style="
                            font-size:24px;
                            font-weight:700;
                            margin:0 0 8px;
                        "
                    >
                        ${title}
                    </h2>

                    ${
                        subtitle
                            ? `
                                <p
                                    class="${localizedTextClass()}"
                                    style="
                                        font-size:15px;
                                        margin:0;
                                        opacity:0.9;
                                    "
                                >
                                    ${subtitle}
                                </p>
                            `
                            : ""
                    }
                </div>
            </div>

            <div style="
                padding:15px 25px;
                display:flex;
                justify-content:space-between;
                align-items:center;
                border-top:1px solid #f0f0f0;
            ">
                <span style="
                    font-size:13px;
                    color:#777;
                ">
                    📅 ${news.publishedDate}
                </span>

                <span style="
                    font-size:14px;
                    font-weight:700;
                    color:#087F5B;
                ">
                    ${t("news.readMore")}
                </span>
            </div>
        </button>
    `;
}

/**
 * Renders one complete News article.
 *
 * Vocabulary and grammar have already been filtered according to the
 * learner's CEFR level by the controller.
 *
 * @param news - Loaded article.
 * @param vocabulary - Visible vocabulary entries.
 * @param grammar - Visible grammar entries.
 * @param hasHiddenGrammar - Whether grammar exists but is above user level.
 * @returns Complete article HTML.
 */
function renderNewsDetailView(
    news: NewsArticle,
    vocabulary: NewsVocabularyItem[],
    grammar: NewsGrammarItem[],
    hasHiddenGrammar: boolean
): string {
    const title = localizedValue(
        news.title,
        news.title_fa
    );

    const subtitle = localizedValue(
        news.subtitle,
        news.subtitle_fa
    );

    return `
        ${renderNavbar()}

        <div style="
            max-width:900px;
            margin:0 auto;
            padding:20px 16px 60px;
        ">
            <button
                id="news-back"
                type="button"
                class="back-btn"
                style="margin-bottom:20px;"
            >
                ← ${t("news.backHome")}
            </button>

            <img
                src="${news.image}"
                alt="${news.imageAlt || title}"
                style="
                    width:100%;
                    max-height:500px;
                    object-fit:cover;
                    border-radius:12px;
                    margin-bottom:20px;
                "
            >

            <div style="
                display:flex;
                gap:10px;
                align-items:center;
                margin-bottom:15px;
                flex-wrap:wrap;
            ">
                <span style="
                    background:#087F5B;
                    color:#fff;
                    padding:6px 12px;
                    border-radius:6px;
                    font-size:13px;
                    font-weight:700;
                ">
                    ${news.level}
                </span>

                <span style="
                    font-size:14px;
                    color:#777;
                ">
                    📅 ${news.publishedDate}
                </span>
            </div>

            <h1
                class="${localizedTextClass()}"
                style="
                    font-size:28px;
                    font-weight:700;
                    color:#1a1a1a;
                    margin:0 0 10px;
                    line-height:1.3;
                "
            >
                ${title}
            </h1>

            ${
                subtitle
                    ? `
                        <p
                            class="${localizedTextClass()}"
                            style="
                                font-size:16px;
                                color:#555;
                                margin:0 0 30px;
                            "
                        >
                            ${subtitle}
                        </p>
                    `
                    : ""
            }

            ${renderNewsTextSwitcherView()}

            ${renderNewsArticleTextsView(news)}

            ${
                vocabulary.length > 0
                    ? renderNewsVocabularyView(
                        vocabulary
                    )
                    : ""
            }

            ${
                grammar.length > 0
                    ? renderNewsGrammarView(
                        grammar
                    )
                    : hasHiddenGrammar
                        ? renderNewsHiddenGrammarView()
                        : ""
            }

            ${
                news.sources?.length
                    ? renderNewsSourcesView(
                        news.sources
                    )
                    : ""
            }
        </div>
    `;
}

/**
 * Renders the full/simplified text selector.
 *
 * Event handlers are attached by the News controller.
 *
 * @returns Text-switcher HTML.
 */
function renderNewsTextSwitcherView(): string {
    return `
        <div style="
            display:flex;
            gap:10px;
            margin-bottom:20px;
            background:#f9fafb;
            padding:10px;
            border-radius:8px;
        ">
            <button
                id="btn-full"
                type="button"
                data-news-mode="full"
                style="
                    flex:1;
                    padding:10px;
                    font-size:14px;
                    font-weight:700;
                    border:2px solid #087F5B;
                    border-radius:6px;
                    background:#087F5B;
                    color:#fff;
                    cursor:pointer;
                "
            >
                📖 ${t("news.fullText")}
            </button>

            <button
                id="btn-simple"
                type="button"
                data-news-mode="simple"
                style="
                    flex:1;
                    padding:10px;
                    font-size:14px;
                    font-weight:600;
                    border:2px solid #e0e0e0;
                    border-radius:6px;
                    background:#fff;
                    color:#1a1a1a;
                    cursor:pointer;
                "
            >
                🌱 ${t("news.simpleText")}
            </button>
        </div>
    `;
}

/**
 * Renders both article text variants.
 *
 * The simplified version starts hidden and is toggled by the controller.
 *
 * @param news - News article.
 * @returns Article text HTML.
 */
function renderNewsArticleTextsView(
    news: NewsArticle
): string {
    return `
        <div
            id="news-full-text"
            style="
                background:#fff;
                border:1px solid #e0e0e0;
                border-radius:8px;
                padding:30px;
                margin-bottom:30px;
            "
        >
            <div
                class="ltr-lock"
                style="
                    font-size:16px;
                    line-height:1.9;
                    color:#333;
                    white-space:pre-line;
                "
            >
                ${news.content.fullText}
            </div>
        </div>

        <div
            id="news-simple-text"
            style="
                display:none;
                background:#f0f9ff;
                border:1px solid #087F5B;
                border-radius:8px;
                padding:30px;
                margin-bottom:30px;
            "
        >
            <p style="
                font-size:13px;
                color:#087F5B;
                font-weight:700;
                margin:0 0 12px;
            ">
                🌱 ${t("news.simplifiedVersion")}
            </p>

            <div
                class="ltr-lock"
                style="
                    font-size:16px;
                    line-height:1.9;
                    color:#333;
                    white-space:pre-line;
                "
            >
                ${news.content.simpleText}
            </div>
        </div>
    `;
}

/**
 * Renders the vocabulary associated with an article.
 *
 * News vocabulary intentionally remains bilingual learning content.
 *
 * @param vocabulary - Vocabulary items visible to the learner.
 * @returns Vocabulary section HTML.
 */
function renderNewsVocabularyView(
    vocabulary: NewsVocabularyItem[]
): string {
    return `
        <details style="
            background:#fff;
            border:1px solid #e0e0e0;
            border-radius:8px;
            margin-bottom:20px;
            overflow:hidden;
        ">
            <summary style="
                padding:18px 24px;
                font-weight:700;
                color:#087F5B;
                cursor:pointer;
                background:#f9fafb;
                display:flex;
                justify-content:space-between;
                align-items:center;
                list-style:none;
            ">
                <span>
                    📚 ${t("news.keyVocabulary")}
                </span>

                <span style="font-size:18px;">
                    ▼
                </span>
            </summary>

            <div style="
                padding:0 24px 24px;
                border-top:1px solid #e0e0e0;
            ">
                <div style="
                    display:grid;
                    grid-template-columns:
                        repeat(auto-fill,minmax(250px,1fr));
                    gap:10px;
                    margin-top:20px;
                ">
                    ${vocabulary
                        .map(
                            word =>
                                renderNewsVocabularyItemView(
                                    word
                                )
                        )
                        .join("")}
                </div>
            </div>
        </details>
    `;
}

/**
 * Renders one vocabulary entry.
 *
 * @param word - News vocabulary entry.
 * @returns Vocabulary-card HTML.
 */
function renderNewsVocabularyItemView(
    word: NewsVocabularyItem
): string {
    return `
        <div style="
            background:#f9fafb;
            padding:12px 16px;
            border-radius:6px;
            border-right:4px solid #087F5B;
        ">
            <p
                class="ltr-lock"
                style="
                    font-weight:700;
                    color:#1a1a1a;
                    margin:0 0 4px;
                    font-size:15px;
                "
            >
                ${word.fr}

                ${
                    word.level
                        ? `
                            <span style="
                                font-size:11px;
                                background:#e0e0e0;
                                padding:2px 6px;
                                border-radius:4px;
                                color:#555;
                            ">
                                ${word.level}
                            </span>
                        `
                        : ""
                }
            </p>

            <p
                class="persian-text"
                style="
                    font-size:14px;
                    color:#777;
                    margin:0;
                "
            >
                ${word.fa}
            </p>
        </div>
    `;
}

/**
 * Renders visible grammar points associated with the article.
 *
 * @param grammar - Grammar points visible to the learner.
 * @returns Grammar section HTML.
 */
function renderNewsGrammarView(
    grammar: NewsGrammarItem[]
): string {
    return `
        <details style="
            background:#fff;
            border:1px solid #e0e0e0;
            border-radius:8px;
            margin-bottom:20px;
            overflow:hidden;
        ">
            <summary style="
                padding:18px 24px;
                font-weight:700;
                color:#087F5B;
                cursor:pointer;
                background:#f9fafb;
                display:flex;
                justify-content:space-between;
                align-items:center;
                list-style:none;
            ">
                <span>
                    📐 ${t("news.grammarPoints")}
                </span>

                <span style="font-size:18px;">
                    ▼
                </span>
            </summary>

            <div style="
                padding:0 24px 24px;
                border-top:1px solid #e0e0e0;
            ">
                ${grammar
                    .map(
                        (
                            item,
                            index
                        ) =>
                            renderNewsGrammarItemView(
                                item,
                                index
                            )
                    )
                    .join("")}
            </div>
        </details>
    `;
}

/**
 * Renders one News grammar point.
 *
 * Grammar lesson navigation is exposed through `data-grammar-id`.
 *
 * @param item - Grammar point.
 * @param index - Zero-based display index.
 * @returns Grammar-card HTML.
 */
function renderNewsGrammarItemView(
    item: NewsGrammarItem,
    index: number
): string {
    return `
        <div style="
            background:#f9fafb;
            border:1px solid #e0e0e0;
            border-radius:8px;
            padding:20px;
            margin-bottom:15px;
            margin-top:20px;
        ">
            <h3 style="
                font-size:16px;
                font-weight:700;
                color:#1a1a1a;
                margin:0 0 10px;
            ">
                ${index + 1}. ${item.title}

                ${
                    item.level
                        ? `
                            <span style="
                                font-size:12px;
                                background:#087F5B;
                                color:#fff;
                                padding:2px 8px;
                                border-radius:4px;
                                margin-right:8px;
                            ">
                                ${item.level}
                            </span>
                        `
                        : ""
                }
            </h3>

            <div
                class="ltr-lock"
                style="
                    background:#fff;
                    padding:12px;
                    border-radius:6px;
                    margin:10px 0;
                    font-size:15px;
                    line-height:1.7;
                    border-left:3px solid #087F5B;
                    font-style:italic;
                "
            >
                ${item.example}
            </div>

            ${
                item.translation
                    ? `
                        <p
                            class="persian-text"
                            style="
                                font-size:14px;
                                color:#555;
                                margin:10px 0;
                            "
                        >
                            ${item.translation}
                        </p>
                    `
                    : ""
            }

            ${
                item.explanation
                    ? `
                        <p
                            class="persian-text"
                            style="
                                font-size:14px;
                                color:#777;
                                margin:8px 0 0;
                            "
                        >
                            💡 ${item.explanation}
                        </p>
                    `
                    : ""
            }

            ${renderNewsGrammarActionView(item)}
        </div>
    `;
}

/**
 * Renders the contextual action attached to a grammar point.
 *
 * @param item - Grammar point.
 * @returns Grammar action HTML.
 */
function renderNewsGrammarActionView(
    item: NewsGrammarItem
): string {
    if (item.grammarId) {
        return `
            <button
                type="button"
                class="news-grammar-link"
                data-grammar-id="${item.grammarId}"
                style="
                    display:inline-block;
                    margin-top:10px;
                    font-size:13px;
                    font-weight:700;
                    color:#087F5B;
                    background:#e8f5f0;
                    padding:6px 12px;
                    border:none;
                    border-radius:6px;
                    cursor:pointer;
                "
            >
                🔗 ${t("news.viewGrammarLesson")}
            </button>
        `;
    }

    if (item.level) {
        return `
            <p style="
                font-size:12px;
                color:#999;
                margin-top:10px;
            ">
                ${t(
                    "news.grammarLevel",
                    {
                        level: item.level
                    }
                )}
            </p>
        `;
    }

    return "";
}

/**
 * Renders the message used when all article grammar is above the learner's
 * current level.
 *
 * @returns Hidden-grammar message HTML.
 */
function renderNewsHiddenGrammarView(): string {
    return `
        <div style="
            background:#fffbeb;
            border:1px solid #fde68a;
            border-radius:8px;
            padding:16px;
            margin-bottom:20px;
            text-align:center;
            color:#92400e;
        ">
            ${t("news.advancedGrammarHidden")}
        </div>
    `;
}

/**
 * Renders article sources.
 *
 * External links remain real anchors because they represent navigation rather
 * than application actions.
 *
 * @param sources - Article sources.
 * @returns Sources HTML.
 */
function renderNewsSourcesView(
    sources: NewsSource[]
): string {
    return `
        <details style="
            background:#fff;
            border:1px solid #e0e0e0;
            border-radius:8px;
            margin-bottom:20px;
            overflow:hidden;
        ">
            <summary style="
                padding:18px 24px;
                font-weight:700;
                color:#1a1a1a;
                cursor:pointer;
                background:#f9fafb;
                display:flex;
                justify-content:space-between;
                align-items:center;
                list-style:none;
            ">
                <span>
                    📖 ${t("news.sources")}
                </span>

                <span style="font-size:18px;">
                    ▼
                </span>
            </summary>

            <div style="
                padding:0 24px 24px;
                border-top:1px solid #e0e0e0;
            ">
                <div style="
                    display:flex;
                    flex-direction:column;
                    gap:10px;
                    margin-top:20px;
                ">
                    ${sources
                        .map(
                            source =>
                                renderNewsSourceView(
                                    source
                                )
                        )
                        .join("")}
                </div>
            </div>
        </details>
    `;
}

/**
 * Renders one external article source.
 *
 * @param source - News source.
 * @returns Source link HTML.
 */
function renderNewsSourceView(
    source: NewsSource
): string {
    return `
        <a
            href="${source.url}"
            target="_blank"
            rel="noopener noreferrer"
            style="
                padding:12px 16px;
                background:#fff;
                border:1px solid #e0e0e0;
                border-radius:6px;
                color:#087F5B;
                text-decoration:none;
                font-weight:600;
                display:flex;
                justify-content:space-between;
                align-items:center;
            "
        >
            <span>
                ${source.title}
            </span>

            <span>↗</span>
        </a>
    `;
}

/**
 * Renders the article-not-found page.
 *
 * The controller binds the return action to `#news-error-back`.
 *
 * @returns Complete error-page HTML.
 */
function renderNewsNotFoundView(): string {
    return `
        ${renderNavbar()}

        <div style="
            text-align:center;
            padding:60px 16px;
        ">
            <p style="
                font-size:18px;
                color:#777;
            ">
                ❌ ${t("news.notFound")}
            </p>

            <button
                id="news-error-back"
                type="button"
                style="
                    margin-top:15px;
                    padding:10px 20px;
                    border:1px solid #ddd;
                    border-radius:6px;
                    background:#fff;
                    cursor:pointer;
                "
            >
                ${t("common.back")}
            </button>
        </div>
    `;
}
