/**
 * Presentation layer for generic placeholder pages.
 *
 * Placeholder controllers only decide which icon and translated title should
 * be displayed. All HTML structure is owned by this view.
 */

/**
 * Renders a generic application placeholder page.
 *
 * @param icon - Visual icon associated with the unavailable feature.
 * @param title - Already-localized feature title.
 * @returns Complete placeholder-page HTML.
 */
function renderPlaceholderView(
    icon: string,
    title: string
): string {
    return `
        ${renderNavbar()}

        <div style="
            max-width:900px;
            margin:0 auto;
            padding:60px 16px;
            text-align:center;
        ">
            <div style="
                font-size:48px;
                margin-bottom:16px;
            ">
                ${icon}
            </div>

            <h1 style="
                font-size:22px;
                color:#1a1a1a;
                margin-bottom:10px;
            ">
                ${title}
            </h1>

            <p style="
                font-size:14px;
                color:#777;
            ">
                🏗️🦖 ${t("placeholder.underConstruction")}
            </p>
        </div>
    `;
}