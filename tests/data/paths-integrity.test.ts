import assert from "node:assert/strict";
import {
    join
} from "node:path";
import test from "node:test";

import {
    assertCefrLevel,
    assertNonEmptyString,
    assertRecord,
    dataDirectory,
    readJson
} from "./data-test-utils.js";

interface LearningPath {
    id: string;
    title: string;
    title_fa?: string;
    icon: string;
    description: string;
    description_fa?: string;
    hasLevels: boolean;
    levels?: unknown[];
    focus: string;
    target_audience: string;
}

test(
    "learning path catalog is internally coherent",
    async () => {
        const paths =
            await readJson<
                Record<string, LearningPath>
            >(
                join(
                    dataDirectory,
                    "paths.json"
                )
            );

        assertRecord(
            paths,
            "data/paths.json"
        );

        const entries =
            Object.entries(
                paths
            );

        assert.ok(
            entries.length > 0,
            "data/paths.json must define at least one learning path"
        );

        for (
            const [
                key,
                path
            ]
            of entries
        ) {
            assertRecord(
                path,
                `paths.${key}`
            );

            assertNonEmptyString(
                path.id,
                `paths.${key}.id`
            );

            assert.equal(
                path.id,
                key,
                `paths.${key}.id must match its object key`
            );

            assertNonEmptyString(
                path.title,
                `paths.${key}.title`
            );

            assertNonEmptyString(
                path.icon,
                `paths.${key}.icon`
            );

            assertNonEmptyString(
                path.description,
                `paths.${key}.description`
            );

            assertNonEmptyString(
                path.focus,
                `paths.${key}.focus`
            );

            assertNonEmptyString(
                path.target_audience,
                `paths.${key}.target_audience`
            );

            assert.equal(
                typeof path.hasLevels,
                "boolean",
                `paths.${key}.hasLevels must be boolean`
            );

            if (
                path.hasLevels
            ) {
                assert.ok(
                    Array.isArray(
                        path.levels
                    ),
                    `paths.${key}.levels must be an array when hasLevels=true`
                );

                assert.ok(
                    path.levels.length > 0,
                    `paths.${key}.levels must not be empty`
                );

                path.levels.forEach(
                    (
                        level,
                        index
                    ) =>
                        assertCefrLevel(
                            level,
                            `paths.${key}.levels[${index}]`
                        )
                );
            }
        }
    }
);
