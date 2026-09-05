import assert from "node:assert/strict";

import {
    Given,
    Then,
    When
} from "@cucumber/cucumber";
import type {
    DataTable
} from "@cucumber/cucumber";

import {
    getAvailableVocabularyGames
} from "../../src/features/vocabulary/vocabularyGameEngine.js";
import {
    splitList
} from "../support/productWorld.js";
import type {
    ProductWorld
} from "../support/productWorld.js";

Given(
    "a vocabulary pack with these French words:",
    function (
        this: ProductWorld,
        table: DataTable
    ): void {
        this.vocabularyWords =
            table.hashes().map(
                row => ({
                    fr:
                        requiredCell(
                            row,
                            "word"
                        ),
                    fa: "واژه"
                })
            );
    }
);

When(
    "the playable vocabulary games are resolved",
    function (
        this: ProductWorld
    ): void {
        assert.ok(
            this.vocabularyWords
        );

        this.availableGames =
            getAvailableVocabularyGames(
                this.vocabularyWords
            );
    }
);

Then(
    "the available games are {string}",
    function (
        this: ProductWorld,
        games: string
    ): void {
        assert.deepEqual(
            this.availableGames,
            splitList(games)
        );
    }
);

function requiredCell(
    row: Record<string, string>,
    name: string
): string {
    const value = row[name];

    assert.ok(
        value,
        `Missing ${name} cell`
    );

    return value;
}
