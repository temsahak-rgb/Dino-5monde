import assert from "node:assert/strict";
import {
    readdir,
    readFile
} from "node:fs/promises";
import {
    relative,
    resolve
} from "node:path";
import test from "node:test";

async function collectTypeScriptFiles(
    directory: string
): Promise<string[]> {
    const entries = await readdir(
        directory,
        { withFileTypes: true }
    );
    const files: string[] = [];

    for (const entry of entries) {
        const entryPath = resolve(
            directory,
            entry.name
        );

        if (entry.isDirectory()) {
            files.push(
                ...await collectTypeScriptFiles(
                    entryPath
                )
            );
        } else if (
            entry.isFile()
            && entry.name.endsWith(".ts")
            && !entry.name.endsWith(".d.ts")
        ) {
            files.push(entryPath);
        }
    }

    return files;
}

test(
    "the router is the only navigation module that owns browser URL history",
    async () => {
        const violations: string[] = [];
        const sourceFiles = [
            resolve("app.ts"),
            ...await collectTypeScriptFiles(
                resolve("src")
            )
        ];

        for (const file of sourceFiles) {
            const repositoryPath = relative(
                resolve(),
                file
            ).replace(/\\/gu, "/");

            if (repositoryPath === "src/core/router.ts") {
                continue;
            }

            const source = await readFile(
                file,
                "utf8"
            );

            if (
                /window\.(?:history|location)|\bpopstate\b/u.test(
                    source
                )
            ) {
                violations.push(repositoryPath);
            }
        }

        assert.deepEqual(
            violations,
            []
        );
    }
);
