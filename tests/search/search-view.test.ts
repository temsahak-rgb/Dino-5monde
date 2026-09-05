import assert from "node:assert/strict";
import test from "node:test";

import {
    createElement
} from "react";
import {
    renderToStaticMarkup
} from "react-dom/server";

import {
    installReactTestBrowser,
    renderReactView
} from "../react/renderReactView.js";

const browser =
    installReactTestBrowser();

const [
    {
        HighlightedText,
        SearchDialog
    },
    {
        I18nProvider
    }
] = await Promise.all([
    import(
        "../../src/features/search/SearchDialog.js"
    ),
    import(
        "../../src/i18n/I18nProvider.js"
    )
]);

function renderSearchDialog():
    string {
    return renderReactView(
        createElement(
            SearchDialog,
            {
                open: true,
                onClose: () =>
                    undefined,
                renderInline: true
            }
        ),
        I18nProvider
    );
}

test(
    "React Search dialog exposes accessible dialog and live-result semantics",
    () => {
        browser.setLanguage(
            "fr"
        );

        const html =
            renderSearchDialog();

        assert.match(
            html,
            /role="dialog"/
        );

        assert.match(
            html,
            /aria-modal="true"/
        );

        assert.match(
            html,
            /aria-labelledby="search-dialog-title"/
        );

        assert.match(
            html,
            /role="region"/
        );

        assert.match(
            html,
            /aria-live="polite"/
        );

        assert.match(
            html,
            /aria-label="Fermer la recherche"/
        );
    }
);

test(
    "React Search dialog localizes its controls in Persian",
    () => {
        browser.setLanguage(
            "fa"
        );

        const html =
            renderSearchDialog();

        assert.match(
            html,
            /بستن جستجو/
        );

        assert.match(
            html,
            /کلمه یا عبارت/
        );

        assert.doesNotMatch(
            html,
            /Fermer la recherche|Mot ou expression/
        );
    }
);

test(
    "React Search highlighting escapes corpus HTML while preserving its match",
    () => {
        const html =
            renderToStaticMarkup(
                createElement(
                    HighlightedText,
                    {
                        text:
                            "Paris <img src=x>",
                        query:
                            "Paris"
                    }
                )
            );

        assert.doesNotMatch(
            html,
            /<img src=x>/
        );

        assert.match(
            html,
            /<mark[^>]*>Paris<\/mark>/
        );

        assert.match(
            html,
            /&lt;img src=x&gt;/
        );
    }
);
