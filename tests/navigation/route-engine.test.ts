import assert from "node:assert/strict";
import test from "node:test";

import {
    appRoutePatterns,
    createAppPath,
    getAppRouteSection,
    matchAppPath
} from "../../src/app/routes.js";
import type {
    AppRoute
} from "../../src/app/routes.js";

test(
    "the route schema describes every React Router branch once",
    () => {
        assert.deepEqual(
            appRoutePatterns,
            {
                onboarding: "/onboarding",
                home: "/",
                grammarIndex: "/grammar",
                grammarLevel: "/grammar/:level",
                grammarLesson: "/grammar/lesson/:lessonId",
                vocabularyIndex: "/vocabulary",
                vocabularyLevel: "/vocabulary/:level",
                vocabularyPack: "/vocabulary/:level/:packId",
                travelIndex: "/travel",
                travelLesson: "/travel/:lessonId",
                journalIndex: "/journal",
                journalArticle: "/journal/:articleId",
                about: "/info/about",
                contact: "/info/contact",
                workWithUs: "/info/work-with-us",
                notFound: "*"
            }
        );

        const durablePatterns = Object.values(appRoutePatterns).filter(
            path => path !== "*"
        );
        assert.equal(
            new Set(durablePatterns).size,
            durablePatterns.length,
            "React route patterns must be unique"
        );
        assert.equal(
            durablePatterns.every(path => path.startsWith("/")),
            true,
            "Durable React routes must be absolute"
        );
    }
);

test(
    "canonical React locations round-trip through the pure route contract",
    () => {
        const routes: AppRoute[] = [
            { name: "onboarding" },
            { name: "home" },
            { name: "grammar-index" },
            { name: "grammar-level", level: "B1" },
            { name: "grammar-lesson", lessonId: "A1-G-003-B" },
            { name: "vocabulary-index" },
            { name: "vocabulary-level", level: "C2" },
            {
                name: "vocabulary-pack",
                level: "A1",
                packId: "salutations_expressions_quotidiennes"
            },
            { name: "travel-index" },
            { name: "travel-lesson", lessonId: "suite 13 shopping" },
            { name: "journal-index" },
            {
                name: "journal-article",
                articleId: "2026-w34-azadi-tower"
            },
            { name: "about" },
            { name: "contact" },
            { name: "work-with-us" }
        ];

        for (const route of routes) {
            assert.deepEqual(
                matchAppPath(createAppPath(route)),
                route
            );
        }

        assert.equal(
            createAppPath({
                name: "travel-lesson",
                lessonId: "suite 13 shopping"
            }),
            "/travel/suite%2013%20shopping"
        );
    }
);

test(
    "pathname matching ignores location search and hash state",
    () => {
        assert.deepEqual(
            matchAppPath("/grammar/A2?campaign=client#lesson-list"),
            {
                name: "grammar-level",
                level: "A2"
            }
        );
        assert.deepEqual(
            matchAppPath("/"),
            { name: "home" }
        );
    }
);

test(
    "route matching rejects unknown, malformed, and unsafe paths",
    () => {
        for (
            const pathname
            of [
                "",
                "grammar/A1",
                "//example.test/grammar/A1",
                "/grammar/C2",
                "/grammar/lesson/..%2Fsecret",
                "/grammar/lesson/%20A1-G-001",
                "/vocabulary/A1/..%5Csecret",
                "/vocabulary/Z9/pack",
                "/travel/%2Fabsolute",
                "/journal/..",
                "/info/profile",
                "/grammar/A1/",
                "/unknown"
            ]
        ) {
            assert.equal(
                matchAppPath(pathname),
                null,
                pathname
            );
        }
    }
);

test(
    "path builders reject values that could escape a route segment",
    () => {
        for (
            const lessonId
            of [
                "",
                "../secret",
                "..\\secret",
                " lesson",
                "lesson ",
                "a".repeat(161)
            ]
        ) {
            assert.throws(
                () => createAppPath({
                    name: "grammar-lesson",
                    lessonId
                }),
                TypeError
            );
        }
    }
);

test(
    "route helpers map React locations to primary navigation sections",
    () => {
        assert.equal(
            getAppRouteSection({ name: "journal-index" }),
            "journal"
        );
        assert.equal(
            getAppRouteSection({
                name: "grammar-lesson",
                lessonId: "B1-G-001"
            }),
            "grammar"
        );
        assert.equal(
            getAppRouteSection({ name: "contact" }),
            null
        );
        assert.equal(
            getAppRouteSection({ name: "onboarding" }),
            null
        );
    }
);
