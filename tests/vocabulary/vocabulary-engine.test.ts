import assert from "node:assert/strict";
import test from "node:test";

import { prepareVocabStory } from "../../src/features/vocabulary/vocabularyEngine.js";
import type {
    VocabPack,
    VocabStory
} from "../../src/types/global.js";

function createPack(
    overrides: Partial<VocabPack> = {}
): VocabPack {
    return {
        id: "travel-basics",
        level: "A1",
        words: [],
        ...overrides
    };
}

test(
    "prepareVocabStory preserves an explicit corpus title",
    () => {
        const story: VocabStory = {
            title: "Une journée à Paris"
        };

        const prepared = prepareVocabStory(
            createPack({
                title: "Le voyage"
            }),
            story
        );

        assert.equal(
            prepared.title,
            "Une journée à Paris"
        );
        assert.notEqual(
            prepared,
            story
        );
    }
);

test(
    "prepareVocabStory falls back through pack title theme and id",
    () => {
        assert.equal(
            prepareVocabStory(
                createPack({
                    title: "Le voyage"
                }),
                {}
            ).title,
            "Le voyage"
        );

        assert.equal(
            prepareVocabStory(
                createPack({
                    title: "   ",
                    theme: "À la gare"
                }),
                {
                    title: "  "
                }
            ).title,
            "À la gare"
        );

        assert.equal(
            prepareVocabStory(
                createPack(),
                {}
            ).title,
            "travel-basics"
        );
    }
);

test(
    "prepareVocabStory never exposes undefined as a title",
    () => {
        const prepared = prepareVocabStory(
            createPack(),
            {
                title: undefined,
                title_fa: "  "
            }
        );

        assert.equal(
            prepared.title,
            "travel-basics"
        );
        assert.equal(
            prepared.title_fa,
            undefined
        );
    }
);
