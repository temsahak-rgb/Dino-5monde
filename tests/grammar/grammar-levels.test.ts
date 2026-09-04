import assert from "node:assert/strict";
import test from "node:test";

import {
    getGrammarLevelFromLessonId,
    getGrammarLevels
} from "../../src/features/grammar/grammarLevels.js";

test(
    "Grammar exposes the available A1 through C1 levels",
    () => {
        assert.deepEqual(
            getGrammarLevels(),
            [
                "A1",
                "A2",
                "B1",
                "B2",
                "C1"
            ]
        );
    }
);

test(
    "Grammar lesson navigation derives the level from the lesson id",
    () => {
        assert.equal(
            getGrammarLevelFromLessonId(
                "A1-G-003"
            ),
            "A1"
        );
        assert.equal(
            getGrammarLevelFromLessonId(
                "C1-G-010"
            ),
            "C1"
        );
        assert.equal(
            getGrammarLevelFromLessonId(
                "C2-G-001"
            ),
            null
        );
        assert.equal(
            getGrammarLevelFromLessonId(
                "invalid"
            ),
            null
        );
    }
);

test(
    "Grammar level selector renders five navigable cards and excludes C2",
    async () => {
        Object.defineProperty(
            globalThis,
            "localStorage",
            {
                configurable: true,
                value: {
                    getItem: () => null,
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

        const {
            renderGrammarPageView
        } = await import(
            "../../src/ui/views/grammarView.js"
        );

        const html =
            renderGrammarPageView(
                getGrammarLevels()
            );

        assert.equal(
            html.match(
                /class="grammar-level-card"/g
            )?.length,
            5
        );
        assert.match(
            html,
            /data-level="A1"/
        );
        assert.match(
            html,
            /data-level="C1"/
        );
        assert.doesNotMatch(
            html,
            /data-level="C2"/
        );
    }
);
