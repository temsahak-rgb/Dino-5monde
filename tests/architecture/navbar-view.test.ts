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
    parseAppSection
} from "../../src/core/navigation.js";
import type {
    NewsIndexItem
} from "../../src/types/global.js";

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

let language:
    "fr" | "fa" = "fr";

async function loadNavbarView() {
    Object.defineProperty(
        globalThis,
        "localStorage",
        {
            configurable: true,
            value: {
                getItem: (
                    key: string
                ) => key === "language"
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
                title: ""
            }
        }
    );

    return import(
        "../../src/ui/views/navbarView.js"
    );
}

test(
    "header menu exposes only shipped destinations as navigation actions",
    async () => {
        language = "fr";

        const {
            renderNavbarView
        } = await loadNavbarView();

        const html =
            renderNavbarView(
                "grammar"
            );

        const destinations = [
            ...html.matchAll(
                /data-nav-section="([^"]+)"/g
            )
        ].map(
            match => match[1]
        );

        assert.deepEqual(
            destinations,
            [
                "home",
                "grammar",
                "vocabulary",
                "travel",
                "journal"
            ]
        );

        assert.equal(
            html.match(
                /data-nav-status="planned"/g
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
            /data-nav-section="grammar"[\s\S]*?aria-current="page"/
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
    "header menu keeps the requested hierarchy and accessible disclosure",
    async () => {
        language = "fr";

        const {
            renderNavbarView
        } = await loadNavbarView();

        const html =
            renderNavbarView(
                "home"
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
            /id="menu-toggle"[\s\S]*?aria-controls="nav-links"[\s\S]*?aria-expanded="false"/
        );
        assert.match(
            html,
            /id="nav-links"[\s\S]*?hidden/
        );
        assert.equal(
            html.match(
                /aria-current="page"/g
            )?.length,
            1
        );
        assert.match(
            html,
            /data-nav-section="home"[\s\S]*?aria-current="page"/
        );
        assert.equal(
            html.match(
                /aria-disabled="true"/g
            )?.length,
            4
        );
    }
);

test(
    "navigation parser accepts Journal but rejects unshipped destinations",
    () => {
        assert.equal(
            parseAppSection(
                "journal"
            ),
            "journal"
        );
        assert.equal(
            parseAppSection(
                "music"
            ),
            null
        );
    }
);

test(
    "Journal view renders the real article index and a localized empty state",
    async () => {
        language = "fr";

        const {
            renderNewsJournalView
        } = await import(
            "../../src/ui/views/newsView.js"
        );

        const news: NewsIndexItem[] = [
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
            renderNewsJournalView(
                news
            );

        assert.equal(
            journalHtml.match(
                /class="news-home-card"/g
            )?.length,
            2
        );
        assert.match(
            journalHtml,
            /data-news-id="article-1"/
        );
        assert.match(
            journalHtml,
            /data-news-id="article-2"/
        );

        const emptyHtml =
            renderNewsJournalView(
                []
            );

        assert.match(
            emptyHtml,
            /Aucun article n’est disponible/
        );
    }
);

test(
    "header navigation remains fully localized in Persian",
    async () => {
        language = "fa";

        const {
            renderNavbarView
        } = await loadNavbarView();

        const html =
            renderNavbarView(
                "travel"
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
    "header styles provide mobile layout and visible keyboard focus",
    async () => {
        const css =
            await readFile(
                resolve(
                    root,
                    "src/styles/style.css"
                ),
                "utf8"
            );

        assert.match(
            css,
            /\.navbar-menu-panel\[hidden\]/
        );
        assert.match(
            css,
            /\.navbar-menu-toggle:focus-visible/
        );
        assert.match(
            css,
            /@media \(max-width: 560px\)[\s\S]*?\.navbar-menu-panel/
        );
    }
);
