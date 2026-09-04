import assert from "node:assert/strict";
import test from "node:test";

import {
    buildCorpusReport,
    extractCorpusCounts,
    extractCorpusDetails,
    stripAnsi
} from "../../tools/build-corpus-report.js";

test(
    "stripAnsi removes terminal colors",
    () => {
        assert.equal(
            stripAnsi(
                "\u001B[31merror\u001B[0m"
            ),
            "error"
        );
    }
);

test(
    "extractCorpusCounts reads local and CI TAP totals",
    () => {
        assert.deepEqual(
            extractCorpusCounts(
                "ℹ tests 15\nℹ pass 14\nℹ fail 1"
            ),
            {
                tests: 15,
                passed: 14,
                failed: 1
            }
        );

        assert.deepEqual(
            extractCorpusCounts(
                "# tests 15\n# pass 15\n# fail 0"
            ),
            {
                tests: 15,
                passed: 15,
                failed: 0
            }
        );
    }
);

test(
    "extractCorpusDetails keeps the actionable file and field section",
    () => {
        const output = [
            "> test:data",
            "summary noise",
            "✖ failing tests:",
            "AssertionError: data/vocabulary/A1/demo.json.stories.simple.title must be non-empty"
        ].join("\n");

        assert.equal(
            extractCorpusDetails(
                output,
                false
            ),
            [
                "✖ failing tests:",
                "AssertionError: data/vocabulary/A1/demo.json.stories.simple.title must be non-empty"
            ].join("\n")
        );
    }
);

test(
    "buildCorpusReport produces one identifiable sticky comment",
    () => {
        const report = buildCorpusReport(
            "all corpus tests passed\n# tests 15\n# pass 15\n# fail 0",
            true,
            "https://github.com/example/repo/actions/runs/42"
        );

        assert.match(
            report,
            /<!-- dino-corpus-quality-report -->/
        );
        assert.match(
            report,
            /✅ Prêt à fusionner/
        );
        assert.match(
            report,
            /🦕 Vigie du corpus/
        );
        assert.match(
            report,
            /15\/15 réussis/
        );
        assert.match(
            report,
            /un seul rapport/
        );
        assert.match(
            report,
            /actions\/runs\/42/
        );
    }
);
