import assert from "node:assert/strict";
import test from "node:test";
import {
    dirname,
    resolve
} from "node:path";
import {
    fileURLToPath
} from "node:url";

import {
    assertFeaturePolicy,
    buildFeatureMarkdown,
    inspectFeatureProgress
} from "../../tools/build-feature-report.js";

const currentDirectory =
    dirname(
        fileURLToPath(
            import.meta.url
        )
    );

function fixture(
    name: string
): string {
    return `tests/fixtures/features/${name}`;
}

test(
    "feature progress counts scenario examples and inherited lifecycle tags",
    async () => {
        const progress =
            await inspectFeatureProgress([
                fixture(
                    "lifecycle.feature"
                )
            ]);

        assert.equal(
            progress.total,
            5
        );
        assert.equal(
            progress.completed,
            3
        );
        assert.equal(
            progress.implemented.length,
            3
        );
        assert.equal(
            progress.planned.length,
            1
        );
        assert.equal(
            progress.invalid.length,
            1
        );
        assert.equal(
            progress.percentage,
            60
        );

        assert.throws(
            () =>
                assertFeaturePolicy(
                    progress
                ),
            /exactly one of @implemented or @planned/
        );
    }
);

test(
    "feature policy rejects scenarios without a lifecycle tag",
    async () => {
        const progress =
            await inspectFeatureProgress([
                fixture(
                    "unclassified.feature"
                )
            ]);

        assert.equal(
            progress.invalid.length,
            1
        );
        assert.throws(
            () =>
                assertFeaturePolicy(
                    progress
                ),
            /This scenario has no lifecycle tag/
        );
    }
);

test(
    "feature markdown makes implemented and planned work visible",
    async () => {
        const progress =
            await inspectFeatureProgress([
                resolve(
                    currentDirectory,
                    "../../features/**/*.feature"
                )
            ]);

        assert.doesNotThrow(
            () =>
                assertFeaturePolicy(
                    progress
                )
        );

        const markdown =
            buildFeatureMarkdown(
                progress
            );

        assert.match(
            markdown,
            new RegExp(
                `Implemented \\| ${progress.implemented.length}`,
                "u"
            )
        );
        assert.match(
            markdown,
            new RegExp(
                `Planned \\| ${progress.planned.length}`,
                "u"
            )
        );
        assert.match(
            markdown,
            /Executed and blocking/
        );
    }
);
