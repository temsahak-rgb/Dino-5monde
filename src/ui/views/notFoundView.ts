import { t } from "../../i18n/i18n.js";
import { renderNavbar } from "./navbarView.js";

export {
    renderNotFoundView
};

interface NotFoundViewOptions {
    backButtonId: string;
    message: string;
}

/**
 * Renders the shared 404 state for a safe route whose resource is missing.
 *
 * Feature controllers keep ownership of the return destination and bind it to
 * the stable button id supplied here.
 */
function renderNotFoundView(
    options: NotFoundViewOptions
): string {
    return `
        ${renderNavbar()}

        <main
            data-error-page="not-found"
            style="
                max-width:680px;
                margin:0 auto;
                padding:72px 16px 80px;
                text-align:center;
            "
        >
            <p
                aria-hidden="true"
                style="
                    margin:0;
                    color:#087F5B;
                    font-size:72px;
                    font-weight:800;
                    letter-spacing:-4px;
                    line-height:1;
                "
            >
                404
            </p>

            <h1 style="
                margin:18px 0 10px;
                color:#1a1a1a;
                font-size:28px;
                line-height:1.25;
            ">
                ${t("error.notFound.title")}
            </h1>

            <p style="
                max-width:480px;
                margin:0 auto;
                color:#666;
                font-size:16px;
                line-height:1.6;
            ">
                ${options.message}
            </p>

            <button
                id="${options.backButtonId}"
                type="button"
                class="back-btn"
                style="margin-top:28px;"
            >
                ← ${t("common.back")}
            </button>
        </main>
    `;
}
