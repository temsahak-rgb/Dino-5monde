import assert from "node:assert/strict";
import {
    readFile
} from "node:fs/promises";
import test from "node:test";
import {
    dirname,
    resolve
} from "node:path";
import {
    fileURLToPath
} from "node:url";

import {
    createElement
} from "react";

import type {
    NewsIndexItem
} from "../../src/types/global.js";

import {
    installReactTestBrowser,
    renderReactView
} from "../react/renderReactView.js";

const currentDirectory =
    dirname(
        fileURLToPath(
            import.meta.url
        )
    );

const root =
    resolve(
        currentDirectory,
        "../.."
    );

const browser =
    installReactTestBrowser();

const [
    {
        Navbar
    },
    {
        I18nProvider
    },
    {
        NewsCatalog
    },
    {
        EmptyState
    },
    {
        t
    }
] = await Promise.all([
    import(
        "../../src/ui/components/Navbar.js"
    ),
    import(
        "../../src/i18n/I18nProvider.js"
    ),
    import(
        "../../src/features/news/NewsCatalog.js"
    ),
    import(
        "../../src/ui/components/Feedback.js"
    ),
    import(
        "../../src/i18n/i18n.js"
    )
]);

function renderNavbar(
    route: string
): string {
    return renderReactView(
        createElement(
            Navbar,
            {
                initialMenuOpen: true
            }
        ),
        I18nProvider,
        route
    );
}

test(
    "React header exposes only shipped destinations as navigation actions",
    () => {
        browser.setLanguage(
            "fr"
        );

        const html =
            renderNavbar(
                "/grammar"
            );

        const destinations = [
            ...html.matchAll(
                /<a[^>]+href="([^"]+)"/g
            )
        ].map(
            match =>
                match[1]
        );

        assert.deepEqual(
            destinations,
            [
                "/",
                "/grammar",
                "/vocabulary",
                "/travel",
                "/journal"
            ]
        );

        assert.equal(
            html.match(
                /aria-disabled="true"/g
            )?.length,
            4
        );

        for (
            const label
            of [
                "Musique",
                "Boutique",
                "Archive",
                "Profil"
            ]
        ) {
            assert.match(
                html,
                new RegExp(
                    `>\\s*${label}\\s*<`
                )
            );
        }

        assert.equal(
            html.match(
                /aria-current="page"/g
            )?.length,
            1
        );

        assert.match(
            html,
            /aria-current="page"[^>]*href="\/grammar"|href="\/grammar"[^>]*aria-current="page"/
        );

        assert.doesNotMatch(
            html,
            /\bonclick=/
        );

        assert.doesNotMatch(
            html,
            />\s*undefined\s*</
        );
    }
);

test(
    "React header keeps the requested hierarchy and accessible disclosure",
    () => {
        browser.setLanguage(
            "fr"
        );

        const html =
            renderNavbar(
                "/"
            );

        const learningIndex =
            html.indexOf(
                "Apprendre"
            );

        const gamesIndex =
            html.indexOf(
                "Jeux et exercices"
            );

        const discoveryIndex =
            html.indexOf(
                "Découvrir"
            );

        const servicesIndex =
            html.indexOf(
                "Services"
            );

        const accountIndex =
            html.indexOf(
                "Mon espace"
            );

        assert.ok(
            learningIndex
            < gamesIndex
        );

        assert.ok(
            gamesIndex
            < discoveryIndex
        );

        assert.ok(
            discoveryIndex
            < servicesIndex
        );

        assert.ok(
            servicesIndex
            < accountIndex
        );

        assert.match(
            html,
            /aria-controls="main-navigation-menu"/
        );

        assert.match(
            html,
            /aria-expanded="true"/
        );

        assert.match(
            html,
            /id="main-navigation-menu"/
        );

        /*
         * Home is represented by the brand link rather than duplicated in
         * the expanded feature menu. Feature routes still expose
         * aria-current, as covered by the Grammar assertion above.
         */
        assert.doesNotMatch(
            html,
            /aria-current="page"/
        );

        assert.match(
            html,
            /<a[^>]*href="\/"/
        );
    }
);

test(
    "React Journal catalog renders real article links and its localized empty state",
    () => {
        browser.setLanguage(
            "fr"
        );

        const news:
            NewsIndexItem[] = [
                {
                    id: "article-1",
                    title: "Premier article",
                    image: "./image-1.jpg",
                    level: "A1",
                    publishedDate: "2026-09-01"
                },
                {
                    id: "article-2",
                    title: "Deuxième article",
                    image: "./image-2.jpg",
                    level: "B1",
                    publishedDate: "2026-09-02"
                }
            ];

        const journalHtml =
            renderReactView(
                createElement(
                    NewsCatalog,
                    {
                        articles:
                            news
                    }
                ),
                I18nProvider,
                "/journal"
            );

        assert.equal(
            journalHtml.match(
                /<article>/g
            )?.length,
            2
        );

        assert.match(
            journalHtml,
            /href="\/journal\/article-1"/
        );

        assert.match(
            journalHtml,
            /href="\/journal\/article-2"/
        );

        const emptyHtml =
            renderReactView(
                createElement(
                    EmptyState,
                    {
                        title:
                            t(
                                "news.journalEmpty"
                            )
                    }
                ),
                I18nProvider,
                "/journal"
            );

        assert.match(
            emptyHtml,
            /Aucun article n’est disponible/
        );
    }
);

test(
    "React header navigation remains fully localized in Persian",
    () => {
        browser.setLanguage(
            "fa"
        );

        const html =
            renderNavbar(
                "/travel"
            );

        assert.match(
            html,
            /بازی‌ها و تمرین‌ها/
        );

        assert.match(
            html,
            /موسیقی/
        );

        assert.match(
            html,
            /پروفایل/
        );

        assert.doesNotMatch(
            html,
            /Jeux et exercices|Musique|Profil/
        );
    }
);

test(
    "React header provides responsive layout and visible keyboard focus",
    async () => {
        const [
            navbarSource,
            css
        ] = await Promise.all([
            readFile(
                resolve(
                    root,
                    "src/ui/components/Navbar.tsx"
                ),
                "utf8"
            ),
            readFile(
                resolve(
                    root,
                    "src/styles/style.css"
                ),
                "utf8"
            )
        ]);

        assert.match(
            navbarSource,
            /aria-expanded=\{/
        );

        assert.match(
            navbarSource,
            /aria-controls="main-navigation-menu"/
        );

        assert.match(
            navbarSource,
            /id="main-navigation-menu"/
        );

        assert.match(
            navbarSource,
            /max-\[560px\]:grid-cols-1/
        );

        assert.match(
            navbarSource,
            /max-\[560px\]:inset-x-2/
        );

        assert.match(
            navbarSource,
            /focus-visible:ring-2/
        );

        assert.match(
            css,
            /:focus-visible\s*\{/
        );
    }
);
