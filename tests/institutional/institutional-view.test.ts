import assert from "node:assert/strict";
import test from "node:test";

import type { InstitutionalPage } from "../../src/types/global.js";

let language: "fr" | "fa" = "fr";

async function loadInstitutionalView() {
    Object.defineProperty(
        globalThis,
        "localStorage",
        {
            configurable: true,
            value: {
                getItem: (key: string) => key === "language"
                    ? language
                    : null,
                setItem: () => undefined
            }
        }
    );

    Object.defineProperty(
        globalThis,
        "document",
        {
            configurable: true,
            value: {
                documentElement: {
                    dir: "ltr",
                    lang: "fr"
                },
                getElementById: (
                    id: string
                ) => id === "app"
                    ? {}
                    : null,
                title: ""
            }
        }
    );

    return import(
        "../../src/ui/views/institutionalView.js"
    );
}

test(
    "footer exposes exactly three accessible institutional destinations",
    async () => {
        language = "fr";
        const {
            renderInstitutionalFooterView
        } = await loadInstitutionalView();
        const html =
            renderInstitutionalFooterView(
                "contact"
            );

        assert.match(
            html,
            /<footer class="site-footer">/
        );
        assert.equal(
            html.match(
                /data-institutional-page=/g
            )?.length,
            3
        );
        assert.match(
            html,
            /À propos/
        );
        assert.match(
            html,
            /Contact/
        );
        assert.match(
            html,
            /Travailler avec nous/
        );
        assert.match(
            html,
            /aria-current="page"/
        );
        assert.doesNotMatch(
            html,
            />\s*undefined\s*</
        );
    }
);

test(
    "every institutional page ships useful content and a way back",
    async () => {
        language = "fr";
        const {
            renderInstitutionalPageView
        } = await loadInstitutionalView();
        const pages: InstitutionalPage[] = [
            "about",
            "contact",
            "work-with-us"
        ];

        for (const page of pages) {
            const html =
                renderInstitutionalPageView(
                    page
                );
            const mainContent =
                html.match(
                    /<main class="institutional-page">[\s\S]*<\/main>/
                )?.[0];

            assert.ok(
                mainContent,
                `${page} must render its institutional content`
            );
            assert.match(
                mainContent,
                /data-institutional-action="home"/
            );
            assert.match(
                mainContent,
                /<h1>[^<]+<\/h1>/
            );
            assert.doesNotMatch(
                mainContent,
                /Bientôt|placeholder|undefined/i
            );
        }
    }
);

test(
    "contact and collaboration actions target real public project channels",
    async () => {
        language = "fr";
        const {
            renderInstitutionalPageView
        } = await loadInstitutionalView();
        const contact =
            renderInstitutionalPageView(
                "contact"
            );
        const collaboration =
            renderInstitutionalPageView(
                "work-with-us"
            );

        assert.match(
            contact,
            /github\.com\/temsahak-rgb\/Dino-5monde\/issues\/new/
        );
        assert.match(
            collaboration,
            /href="https:\/\/github\.com\/temsahak-rgb\/Dino-5monde"/
        );
        assert.match(
            `${contact}${collaboration}`,
            /rel="noreferrer"/
        );
    }
);

test(
    "footer and pages render their Persian interface copy",
    async () => {
        language = "fa";
        const {
            renderInstitutionalFooterView,
            renderInstitutionalPageView
        } = await loadInstitutionalView();
        const html = `
            ${renderInstitutionalFooterView()}
            ${renderInstitutionalPageView("about")}
        `;

        assert.match(
            html,
            /درباره ما/
        );
        assert.match(
            html,
            /تماس/
        );
        assert.match(
            html,
            /همکاری با ما/
        );
    }
);

test(
    "institutional page parser rejects untrusted DOM values",
    async () => {
        Object.defineProperty(
            globalThis,
            "document",
            {
                configurable: true,
                value: {
                    documentElement: {
                        dir: "ltr",
                        lang: "fr"
                    },
                    getElementById: (
                        id: string
                    ) => id === "app"
                        ? {}
                        : null,
                    title: ""
                }
            }
        );
        const {
            parseInstitutionalPage
        } = await import(
            "../../src/features/institutional/institutional.js"
        );

        assert.equal(
            parseInstitutionalPage("about"),
            "about"
        );
        assert.equal(
            parseInstitutionalPage("work-with-us"),
            "work-with-us"
        );
        assert.equal(
            parseInstitutionalPage("profile"),
            null
        );
        assert.equal(
            parseInstitutionalPage(undefined),
            null
        );
    }
);
