import assert from "node:assert/strict";
import test from "node:test";

import {
    buildCorpusReport,
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
            "all corpus tests passed",
            true,
            "https://github.com/example/repo/actions/runs/42"
        );

        assert.match(
            report,
            /<!-- dino-corpus-quality-report -->/
        );
        assert.match(
            report,
            /✅ Corpus valide/
        );
        assert.match(
            report,
            /actions\/runs\/42/
        );
    }
);
