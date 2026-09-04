import assert from "node:assert/strict";
import test from "node:test";

import {
    collectFiles,
    dataDirectory,
    readJson,
    repositoryPath
} from "./data-test-utils.js";

test(
    "every data JSON file is non-empty and parseable",
    async () => {
        const files =
            await collectFiles(
                dataDirectory
            );

        assert.ok(
            files.length > 0,
            "No JSON data files were found"
        );

        for (
            const filePath
            of files
        ) {
            const value =
                await readJson<unknown>(
                    filePath
                );

            assert.notEqual(
                value,
                null,
                `${repositoryPath(filePath)} must not contain JSON null`
            );
        }
    }
);
