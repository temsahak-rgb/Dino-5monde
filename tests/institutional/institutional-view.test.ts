import assert from "node:assert/strict";
import test from "node:test";

import {
    createElement,
    type ComponentType
} from "react";

import {
    installReactTestBrowser,
    renderReactView
} from "../react/renderReactView.js";

const browser =
    installReactTestBrowser();

const [
    {
        Footer
    },
    {
        AboutPage
    },
    {
        ContactPage
    },
    {
        WorkWithUsPage
    },
    {
        NotFoundPage
    },
    {
        I18nProvider
    }
] = await Promise.all([
    import(
        "../../src/ui/components/Footer.js"
    ),
    import(
        "../../src/pages/AboutPage.js"
    ),
    import(
        "../../src/pages/ContactPage.js"
    ),
    import(
        "../../src/pages/WorkWithUsPage.js"
    ),
    import(
        "../../src/pages/NotFoundPage.js"
    ),
    import(
        "../../src/i18n/I18nProvider.js"
    )
]);

test(
    "React footer exposes exactly three accessible institutional destinations",
    () => {
        browser.setLanguage(
            "fr"
        );

        const html =
            renderReactView(
                createElement(
                    Footer
                ),
                I18nProvider,
                "/info/contact"
            );

        const destinations = [
            ...html.matchAll(
                /href="(\/info\/[^"]+)"/g
            )
        ].map(
            match =>
                match[1]
        );

        assert.deepEqual(
            destinations,
            [
                "/info/about",
                "/info/contact",
                "/info/work-with-us"
            ]
        );

        assert.match(
            html,
            /aria-label="Informations sur Dino"/
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

        assert.equal(
            html.match(
                /aria-current="page"/g
            )?.length,
            1
        );

        assert.doesNotMatch(
            html,
            />\s*undefined\s*</
        );
    }
);

test(
    "every React institutional page ships useful content and a way back",
    () => {
        browser.setLanguage(
            "fr"
        );

        const pages: Array<{
            route: string;
            Component: ComponentType;
        }> = [
            {
                route: "/info/about",
                Component: AboutPage
            },
            {
                route: "/info/contact",
                Component: ContactPage
            },
            {
                route: "/info/work-with-us",
                Component: WorkWithUsPage
            }
        ];

        for (
            const {
                route,
                Component
            }
            of pages
        ) {
            const html =
                renderReactView(
                    createElement(
                        Component
                    ),
                    I18nProvider,
                    route
                );

            assert.match(
                html,
                /<h1[^>]*>[^<]+<\/h1>/
            );

            assert.match(
                html,
                /<button[^>]*>[\s\S]*?Retour[\s\S]*?<\/button>/
            );

            assert.doesNotMatch(
                html,
                /Bientôt|placeholder|undefined/i
            );
        }
    }
);

test(
    "contact and collaboration actions target real public project channels",
    () => {
        browser.setLanguage(
            "fr"
        );

        const contact =
            renderReactView(
                createElement(
                    ContactPage
                ),
                I18nProvider,
                "/info/contact"
            );

        const collaboration =
            renderReactView(
                createElement(
                    WorkWithUsPage
                ),
                I18nProvider,
                "/info/work-with-us"
            );

        assert.match(
            contact,
            /github\.com\/temsahak-rgb\/Dino-5monde\/issues\/new/
        );

        assert.match(
            collaboration,
            /href="https:\/\/github\.com\/temsahak-rgb\/Dino-5monde"/
        );

        assert.equal(
            (
                `${contact}${collaboration}`
                    .match(
                        /rel="noopener noreferrer"/g
                    )
                    ?? []
            ).length,
            2
        );
    }
);

test(
    "React footer and pages render their Persian interface copy",
    () => {
        browser.setLanguage(
            "fa"
        );

        const html = `
            ${renderReactView(
                createElement(
                    Footer
                ),
                I18nProvider,
                "/info/about"
            )}
            ${renderReactView(
                createElement(
                    AboutPage
                ),
                I18nProvider,
                "/info/about"
            )}
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
    "unknown institutional paths render the React not-found page safely",
    () => {
        browser.setLanguage(
            "fr"
        );

        const html =
            renderReactView(
                createElement(
                    NotFoundPage
                ),
                I18nProvider,
                "/info/profile"
            );

        assert.match(
            html,
            /data-error-page="not-found"/
        );

        assert.match(
            html,
            /\/info\/profile/
        );

        assert.match(
            html,
            /404/
        );
    }
);
