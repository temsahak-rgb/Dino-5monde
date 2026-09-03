/**
 * Shared browser helpers.
 *
 * This file intentionally remains a classic browser script while the
 * application still relies on global functions.
 *
 * Interface translations live in `src/i18n/`.
 * Feature HTML lives in `src/ui/views/`.
 */

const appElement =
    document.getElementById(
        "app"
    );

if (!appElement) {
    throw new Error(
        "Application root #app was not found."
    );
}

const app: HTMLElement =
    appElement;

/**
 * Returns the currently selected interface language.
 *
 * Kept as a compatibility facade while existing application code still calls
 * `getLanguage()`. The canonical language source is the i18n runtime.
 *
 * @returns Active interface language.
 */
function getLanguage(): Language {
    return getI18nLanguage();
}

/**
 * Returns a required DOM element and fails fast when the expected element is
 * missing from the currently rendered page.
 *
 * @param id - DOM id without the leading hash.
 * @returns Required DOM element.
 */
function getRequiredElement<
    T extends HTMLElement = HTMLElement
>(
    id: string
): T {
    const element =
        document.getElementById(
            id
        );

    if (!element) {
        throw new Error(
            `Required DOM element #${id} was not found.`
        );
    }

    return element as T;
}

/**
 * Queries every DOM element matching a selector.
 *
 * @param selector - Valid CSS selector.
 * @returns Matching DOM elements.
 */
function queryElements<
    T extends Element = HTMLElement
>(
    selector: string
): NodeListOf<T> {
    return document.querySelectorAll<T>(
        selector
    );
}

/**
 * Converts the small Markdown subset supported by the application to HTML.
 *
 * Raw HTML is escaped before formatting rules are applied.
 *
 * Supported syntax:
 * - headings
 * - unordered lists
 * - bold
 * - italic
 * - inline code
 * - strikethrough
 * - `[text][red]`
 * - line breaks
 *
 * @param text - Markdown-like source text.
 * @returns Formatted HTML.
 */
function renderMarkdown(
    text?: string
): string {
    if (!text) {
        return "";
    }

    return text
        .replace(
            /&/g,
            "&amp;"
        )
        .replace(
            /</g,
            "&lt;"
        )
        .replace(
            />/g,
            "&gt;"
        )
        .replace(
            /^### (.*$)/gm,
            '<h4 style="margin-top:20px;margin-bottom:10px;color:#333;font-size:16px;font-weight:700;">$1</h4>'
        )
        .replace(
            /^## (.*$)/gm,
            '<h3 style="margin-top:24px;margin-bottom:12px;color:#333;font-size:18px;font-weight:700;">$1</h3>'
        )
        .replace(
            /^# (.*$)/gm,
            '<h2 style="margin-top:28px;margin-bottom:14px;color:#1a1a1a;font-size:20px;font-weight:700;">$1</h2>'
        )
        .replace(
            /^- (.*$)/gm,
            '<li style="margin-bottom:6px;line-height:1.6;">$1</li>'
        )
        .replace(
            /(<li>.*?<\/li>(\s*<li>.*?<\/li>)*)/gs,
            '<ul style="margin:12px 0;padding-right:22px;list-style-type:disc;color:#333;">$1</ul>'
        )
        .replace(
            /\*\*(.*?)\*\*/g,
            '<strong style="font-weight:700;color:#1a1a1a;">$1</strong>'
        )
        .replace(
            /\*(.*?)\*/g,
            '<em style="font-style:italic;color:#555;">$1</em>'
        )
        .replace(
            /`(.*?)`/g,
            '<code style="background:#f0f0f0;color:#c7254e;padding:2px 6px;border-radius:3px;font-family:monospace;font-size:0.9em;">$1</code>'
        )
        .replace(
            /~~(.*?)~~/g,
            '<del style="color:#999;text-decoration:line-through;">$1</del>'
        )
        .replace(
            /\[(.*?)\]\[red\]/g,
            '<span style="color:#dc2626;font-weight:700;">$1</span>'
        )
        .replace(
            /\n/g,
            "<br>"
        );
}

/**
 * Renders a shared section heading.
 *
 * This is the only presentation helper temporarily retained in `ui.ts`
 * because existing Home and Grammar views already depend on it.
 *
 * The historical `lang` argument is retained to avoid forcing another change
 * in those views during this step.
 *
 * @param title - Localized section title.
 * @param moreOnclick - Legacy optional action expression.
 * @param _lang - Deprecated compatibility argument.
 * @returns Section-header HTML.
 */
function sectionHeader(
    title: string,
    moreOnclick: string,
    _lang: Language
): string {
    return `
        <div style="
            display:flex;
            justify-content:space-between;
            align-items:baseline;
            margin-bottom:14px;
            border-bottom:2px solid #1a1a1a;
            padding-bottom:10px;
        ">
            <h2 style="
                margin:0;
                font-size:20px;
                font-weight:700;
                color:#1a1a1a;
            ">
                ${title}
            </h2>

            ${
                moreOnclick
                    ? `
                        <button
                            type="button"
                            data-section-action="${moreOnclick}"
                            style="
                                background:none;
                                border:none;
                                padding:0;
                                font-size:14px;
                                color:#087F5B;
                                cursor:pointer;
                                font-weight:600;
                            "
                        >
                            ${t("common.all")}
                        </button>
                    `
                    : ""
            }
        </div>
    `;
}