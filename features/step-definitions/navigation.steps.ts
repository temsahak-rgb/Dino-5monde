import assert from "node:assert/strict";

import {
    Given,
    Then,
    When
} from "@cucumber/cucumber";

import {
    createAppPath,
    matchAppPath
} from "../../src/app/routes.js";
import type {
    AppRoute
} from "../../src/app/routes.js";
import type {
    ProductWorld
} from "../support/productWorld.js";

type PublicDestinationKind =
    | "grammar lesson"
    | "journal article"
    | "travel lesson";

Given(
    "a {string} destination identified by {string}",
    function (
        this: ProductWorld,
        kind: PublicDestinationKind,
        identifier: string
    ): void {
        this.destination =
            createDestination(
                kind,
                identifier
            );
    }
);

When(
    "its canonical public path is created",
    function (
        this: ProductWorld
    ): void {
        assert.ok(
            this.destination
        );

        this.publicPath =
            createAppPath(
                this.destination
            );
    }
);

Then(
    "the public path is {string}",
    function (
        this: ProductWorld,
        path: string
    ): void {
        assert.equal(
            this.publicPath,
            path
        );
    }
);

Then(
    "resolving the path selects the same destination",
    function (
        this: ProductWorld
    ): void {
        assert.ok(
            this.publicPath
        );

        assert.deepEqual(
            matchAppPath(
                this.publicPath
            ),
            this.destination
        );
    }
);

Given(
    "the public path {string}",
    function (
        this: ProductWorld,
        path: string
    ): void {
        this.publicPath =
            path;
    }
);

When(
    "the public path is resolved",
    function (
        this: ProductWorld
    ): void {
        assert.ok(
            this.publicPath
        );

        this.resolvedDestination =
            matchAppPath(
                this.publicPath
            );
    }
);

Then(
    "no application destination is selected",
    function (
        this: ProductWorld
    ): void {
        assert.equal(
            this.resolvedDestination,
            null
        );
    }
);

function createDestination(
    kind: PublicDestinationKind,
    identifier: string
): AppRoute {
    switch (kind) {
        case "grammar lesson":
            return {
                name: "grammar-lesson",
                lessonId: identifier
            };
        case "journal article":
            return {
                name: "journal-article",
                articleId: identifier
            };
        case "travel lesson":
            return {
                name: "travel-lesson",
                lessonId: identifier
            };
        default:
            throw new TypeError(
                `Unknown public destination: ${String(kind)}`
            );
    }
}
