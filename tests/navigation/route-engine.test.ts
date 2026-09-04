import assert from "node:assert/strict";
import test from "node:test";

import {
    createSectionRoute,
    getRouteSection,
    parseAppRoute,
    serializeAppRoute
} from "../../src/core/routeEngine.js";
import type { AppRoute } from "../../src/core/routeEngine.js";

test(
    "route codec round-trips every durable view with stable parameter order",
    () => {
        const routes: AppRoute[] = [
            { view: "home" },
            {
                view: "grammar",
                target: "index"
            },
            {
                view: "grammar",
                target: "level",
                level: "B1"
            },
            {
                view: "grammar",
                target: "lesson",
                lessonId: "A1-G-003-B"
            },
            {
                view: "vocabulary",
                target: "index"
            },
            {
                view: "vocabulary",
                target: "level",
                level: "C2"
            },
            {
                view: "vocabulary",
                target: "pack",
                level: "A1",
                packId: "salutations_expressions_quotidiennes"
            },
            {
                view: "vocabulary",
                target: "pack",
                level: "B1",
                packId: "arrival-office"
            },
            {
                view: "vocabulary",
                target: "pack",
                level: "C1",
                packId: "societe-debats"
            },
            {
                view: "vocabulary",
                target: "pack",
                level: "C2",
                packId: "pensee_critique"
            },
            {
                view: "travel",
                target: "index"
            },
            {
                view: "travel",
                target: "lesson",
                lessonId: "suite 13 shopping"
            },
            {
                view: "journal",
                target: "index"
            },
            {
                view: "journal",
                target: "article",
                articleId: "2026-w34-azadi-tower"
            },
            {
                view: "info",
                page: "work-with-us"
            }
        ];

        for (const route of routes) {
            assert.deepEqual(
                parseAppRoute(
                    serializeAppRoute(
                        route
                    )
                ),
                route
            );
        }

        assert.equal(
            serializeAppRoute({
                view: "vocabulary",
                target: "pack",
                level: "A1",
                packId: "salutations_expressions_quotidiennes"
            }),
            "?view=vocabulary&level=A1&pack=salutations_expressions_quotidiennes"
        );
    }
);

test(
    "route parser accepts a bare entry point and canonicalizes extra parameters",
    () => {
        assert.deepEqual(
            parseAppRoute(""),
            { view: "home" }
        );
        assert.deepEqual(
            parseAppRoute(
                "?campaign=client&view=grammar&level=A2"
            ),
            {
                view: "grammar",
                target: "level",
                level: "A2"
            }
        );
    }
);

test(
    "route parser rejects ambiguous and incomplete route combinations",
    () => {
        for (
            const search
            of [
                "?campaign=client",
                "?view=grammar&view=travel",
                "?view=grammar&level=A1&lesson=A1-G-001",
                "?view=vocabulary&pack=salutations",
                "?view=info",
                "?view=info&page=profile",
                "?view=unknown"
            ]
        ) {
            assert.equal(
                parseAppRoute(search),
                null,
                search
            );
        }
    }
);

test(
    "route parser strictly rejects identifiers that could escape data paths",
    () => {
        for (
            const search
            of [
                "?view=grammar&lesson=..%2Fsecret",
                "?view=grammar&lesson=C2-G-001",
                "?view=vocabulary&level=A1&pack=..%2Fsecret",
                `?view=vocabulary&level=A1&pack=${"a".repeat(121)}`,
                "?view=travel&lesson=..%5Csecret",
                "?view=travel&lesson=%2Fabsolute",
                "?view=travel&lesson=%20TR-006",
                "?view=travel&lesson=TR-006%20",
                "?view=journal&article=..%2Fsecret",
                `?view=journal&article=2026-w34-${"a".repeat(152)}`
            ]
        ) {
            assert.equal(
                parseAppRoute(search),
                null,
                search
            );
        }
    }
);

test(
    "route helpers map navbar sections and institutional state",
    () => {
        assert.deepEqual(
            createSectionRoute("journal"),
            {
                view: "journal",
                target: "index"
            }
        );
        assert.equal(
            getRouteSection({
                view: "grammar",
                target: "lesson",
                lessonId: "B1-G-001"
            }),
            "grammar"
        );
        assert.equal(
            getRouteSection({
                view: "info",
                page: "contact"
            }),
            null
        );
    }
);
