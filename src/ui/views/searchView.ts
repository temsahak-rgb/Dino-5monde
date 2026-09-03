/**
 * Presentation layer for site-wide search.
 *
 * This file owns:
 * - search modal HTML
 * - empty/loading/error states
 * - vocabulary result rendering
 * - grammar result rendering
 * - news result rendering
 * - search-term highlighting
 *
 * Search loading, indexing, filtering and navigation remain in
 * `src/features/search/search.ts`.
 */

interface SearchViewResults {
    vocab: SearchVocabWord[];
    grammar: SearchGrammarItem[];
    news: NewsIndexItem[];
}

/**
 * Renders the complete search modal.
 *
 * @returns Search modal inner HTML.
 */
function renderSearchModalView(): string {
    return `
        <div style="
            background:#fff;
            border-radius:12px;
            width:100%;
            max-width:800px;
            box-shadow:0 10px 40px rgba(0,0,0,0.3);
            overflow:hidden;
        ">
            <div style="
                background:#087F5B;
                padding:16px 20px;
                display:flex;
                justify-content:space-between;
                align-items:center;
            ">
                <h2 style="
                    color:#fff;
                    margin:0;
                    font-size:18px;
                ">
                    🔍 ${t("search.title")}
                </h2>

                <button
                    id="search-close"
                    type="button"
                    aria-label="${t("common.back")}"
                    style="
                        background:rgba(255,255,255,0.2);
                        border:none;
                        border-radius:6px;
                        padding:6px 12px;
                        color:#fff;
                        cursor:pointer;
                        font-size:16px;
                    "
                >
                    ✕
                </button>
            </div>

            <div style="
                padding:20px;
                border-bottom:1px solid #e0e0e0;
            ">
                <input
                    type="text"
                    id="search-input"
                    placeholder="${t("search.placeholder")}"
                    autocomplete="off"
                    style="
                        width:100%;
                        padding:14px 18px;
                        font-size:16px;
                        border:2px solid #e0e0e0;
                        border-radius:8px;
                        box-sizing:border-box;
                        outline:none;
                    "
                >
            </div>

            <div
                id="search-results"
                style="
                    padding:20px;
                    max-height:60vh;
                    overflow-y:auto;
                "
            >
                ${renderSearchMinimumCharactersView()}
            </div>
        </div>
    `;
}

/**
 * Returns the CSS applied to the modal backdrop.
 *
 * Keeping it here prevents presentation styling from leaking back into the
 * search controller while the project still relies heavily on inline styles.
 *
 * @returns Modal backdrop CSS text.
 */
function getSearchModalStyle(): string {
    return [
        "position:fixed",
        "top:0",
        "left:0",
        "right:0",
        "bottom:0",
        "background:rgba(0,0,0,0.85)",
        "z-index:9999",
        "display:flex",
        "align-items:flex-start",
        "justify-content:center",
        "padding:40px 16px",
        "overflow-y:auto"
    ].join(";");
}

/**
 * Renders the initial state displayed before enough characters are entered.
 *
 * @returns Initial search-state HTML.
 */
function renderSearchMinimumCharactersView(): string {
    return `
        <p style="
            text-align:center;
            color:#999;
            padding:30px;
        ">
            ${t("search.minCharacters")}
        </p>
    `;
}

/**
 * Renders the search loading state.
 *
 * @returns Loading-state HTML.
 */
function renderSearchLoadingView(): string {
    return `
        <p style="
            text-align:center;
            color:#999;
            padding:30px;
        ">
            🔄 ${t("search.loading")}
        </p>
    `;
}

/**
 * Renders the state displayed when no matching content exists.
 *
 * @returns Empty-results HTML.
 */
function renderSearchNoResultsView(): string {
    return `
        <p style="
            text-align:center;
            color:#999;
            padding:40px;
        ">
            ${t("search.noResults")}
        </p>
    `;
}

/**
 * Renders a search error.
 *
 * @param message - Technical error detail.
 * @returns Search-error HTML.
 */
function renderSearchErrorView(
    message: string
): string {
    return `
        <p style="
            text-align:center;
            color:#dc2626;
            padding:30px;
        ">
            ❌ ${t("search.error")}: ${message}
        </p>
    `;
}

/**
 * Renders all search result families.
 *
 * @param results - Search result collections.
 * @param query - User query used for highlighting.
 * @returns Complete search-results HTML.
 */
function renderSearchResultsView(
    results: SearchViewResults,
    query: string
): string {
    let html = "";

    if (results.vocab.length > 0) {
        html += renderSearchVocabularyResultsView(
            results.vocab,
            query
        );
    }

    if (results.grammar.length > 0) {
        html += renderSearchGrammarResultsView(
            results.grammar,
            query
        );
    }

    if (results.news.length > 0) {
        html += renderSearchNewsResultsView(
            results.news,
            query
        );
    }

    return html;
}

/**
 * Renders vocabulary search results.
 *
 * @param results - Matching vocabulary entries.
 * @param query - Search query.
 * @returns Vocabulary result block HTML.
 */
function renderSearchVocabularyResultsView(
    results: SearchVocabWord[],
    query: string
): string {
    return `
        ${renderSearchGroupHeaderView(
            "📖",
            t("search.vocabulary"),
            results.length,
            false
        )}

        ${results
            .slice(0, 15)
            .map(
                item =>
                    renderSearchVocabularyItemView(
                        item,
                        query
                    )
            )
            .join("")}
    `;
}

/**
 * Renders one vocabulary result.
 *
 * Navigation metadata is exposed through data attributes for the controller.
 *
 * @param item - Vocabulary result.
 * @param query - Search query.
 * @returns Vocabulary result HTML.
 */
function renderSearchVocabularyItemView(
    item: SearchVocabWord,
    query: string
): string {
    return `
        <button
            type="button"
            class="search-result-item search-vocab-result"
            data-level="${item.level}"
            data-pack-id="${item.packId}"
            style="
                width:100%;
                background:#f9fafb;
                border:1px solid #e0e0e0;
                border-radius:8px;
                padding:12px;
                margin-bottom:8px;
                cursor:pointer;
                text-align:inherit;
                font:inherit;
            "
        >
            <div style="
                display:flex;
                justify-content:space-between;
                align-items:start;
                gap:10px;
            ">
                <div style="flex:1;">
                    <p
                        class="ltr-lock"
                        style="
                            font-weight:700;
                            color:#1a1a1a;
                            margin:0 0 3px;
                            font-size:15px;
                        "
                    >
                        ${highlightSearchMatch(
                            item.fr,
                            query
                        )}
                    </p>

                    <p
                        class="persian-text"
                        style="
                            font-size:13px;
                            color:#777;
                            margin:0;
                        "
                    >
                        ${highlightSearchMatch(
                            item.fa,
                            query
                        )}
                    </p>

                    ${
                        item.ex
                            ? `
                                <p
                                    class="ltr-lock"
                                    style="
                                        font-size:12px;
                                        color:#888;
                                        margin:6px 0 0;
                                        font-style:italic;
                                    "
                                >
                                    ${highlightSearchMatch(
                                        item.ex,
                                        query
                                    )}
                                </p>
                            `
                            : ""
                    }
                </div>

                <span style="
                    background:#e8f5f0;
                    color:#087F5B;
                    padding:3px 8px;
                    border-radius:4px;
                    font-size:11px;
                    font-weight:700;
                    white-space:nowrap;
                ">
                    ${item.level}
                </span>
            </div>
        </button>
    `;
}

/**
 * Renders grammar search results.
 *
 * @param results - Matching grammar lessons.
 * @param query - Search query.
 * @returns Grammar result block HTML.
 */
function renderSearchGrammarResultsView(
    results: SearchGrammarItem[],
    query: string
): string {
    return `
        ${renderSearchGroupHeaderView(
            "📚",
            t("search.grammar"),
            results.length,
            true
        )}

        ${results
            .slice(0, 15)
            .map(
                item =>
                    renderSearchGrammarItemView(
                        item,
                        query
                    )
            )
            .join("")}
    `;
}

/**
 * Renders one grammar search result.
 *
 * @param item - Grammar result.
 * @param query - Search query.
 * @returns Grammar result HTML.
 */
function renderSearchGrammarItemView(
    item: SearchGrammarItem,
    query: string
): string {
    const title = localizedValue(
        item.title,
        item.title_fa
    );

    return `
        <button
            type="button"
            class="search-result-item search-grammar-result"
            data-grammar-id="${item.id}"
            style="
                width:100%;
                background:#f9fafb;
                border:1px solid #e0e0e0;
                border-radius:8px;
                padding:12px;
                margin-bottom:8px;
                cursor:pointer;
                text-align:inherit;
                font:inherit;
            "
        >
            <div style="
                display:flex;
                justify-content:space-between;
                align-items:start;
                gap:10px;
            ">
                <div style="flex:1;">
                    <p
                        class="${localizedTextClass()}"
                        style="
                            font-weight:700;
                            color:#1a1a1a;
                            margin:0 0 3px;
                            font-size:15px;
                        "
                    >
                        ${highlightSearchMatch(
                            title,
                            query
                        )}
                    </p>

                    ${
                        item.example
                            ? `
                                <p
                                    class="ltr-lock"
                                    style="
                                        font-size:12px;
                                        color:#888;
                                        margin:6px 0 0;
                                        font-style:italic;
                                    "
                                >
                                    ${highlightSearchMatch(
                                        item.example,
                                        query
                                    )}
                                </p>
                            `
                            : ""
                    }
                </div>

                <span style="
                    background:#fef3c7;
                    color:#d97706;
                    padding:3px 8px;
                    border-radius:4px;
                    font-size:11px;
                    font-weight:700;
                    white-space:nowrap;
                ">
                    ${item.level}
                </span>
            </div>
        </button>
    `;
}

/**
 * Renders News search results.
 *
 * @param results - Matching News items.
 * @param query - Search query.
 * @returns News result block HTML.
 */
function renderSearchNewsResultsView(
    results: NewsIndexItem[],
    query: string
): string {
    return `
        ${renderSearchGroupHeaderView(
            "📰",
            t("search.news"),
            results.length,
            true
        )}

        ${results
            .slice(0, 10)
            .map(
                item =>
                    renderSearchNewsItemView(
                        item,
                        query
                    )
            )
            .join("")}
    `;
}

/**
 * Renders one News search result.
 *
 * @param item - News result.
 * @param query - Search query.
 * @returns News result HTML.
 */
function renderSearchNewsItemView(
    item: NewsIndexItem,
    query: string
): string {
    const title = localizedValue(
        item.title,
        item.title_fa
    );

    return `
        <button
            type="button"
            class="search-result-item search-news-result"
            data-news-id="${item.id}"
            style="
                width:100%;
                background:#f9fafb;
                border:1px solid #e0e0e0;
                border-radius:8px;
                padding:12px;
                margin-bottom:8px;
                cursor:pointer;
                text-align:inherit;
                font:inherit;
            "
        >
            <p
                class="${localizedTextClass()}"
                style="
                    font-weight:700;
                    color:#1a1a1a;
                    margin:0 0 3px;
                    font-size:15px;
                "
            >
                ${highlightSearchMatch(
                    title,
                    query
                )}
            </p>

            <p style="
                font-size:12px;
                color:#777;
                margin:0;
            ">
                ${item.publishedDate}
                ·
                ${item.level}
            </p>
        </button>
    `;
}

/**
 * Renders a search result-family heading.
 *
 * @param icon - Group icon.
 * @param title - Localized group title.
 * @param count - Number of matches.
 * @param separated - Whether additional top spacing should be added.
 * @returns Search-group heading HTML.
 */
function renderSearchGroupHeaderView(
    icon: string,
    title: string,
    count: number,
    separated: boolean
): string {
    return `
        <h3 style="
            font-size:15px;
            font-weight:700;
            color:#087F5B;
            margin:${separated ? "20px" : "0"} 0 10px;
            padding-bottom:8px;
            border-bottom:2px solid #087F5B;
        ">
            ${icon} ${title} (${count})
        </h3>
    `;
}

/**
 * Highlights case-insensitive occurrences of the query inside a result string.
 *
 * @param text - Source text.
 * @param query - Search query.
 * @returns HTML with matching text wrapped in `<mark>`.
 */
function highlightSearchMatch(
    text: string | undefined,
    query: string
): string {
    if (!text) {
        return "";
    }

    if (!query) {
        return text;
    }

    const escapedQuery =
        query.replace(
            /[.*+?^${}()|[\]\\]/g,
            "\\$&"
        );

    return text.replace(
        new RegExp(
            `(${escapedQuery})`,
            "gi"
        ),
        '<mark style="background:#fef08a;padding:0 2px;border-radius:2px;">$1</mark>'
    );
}