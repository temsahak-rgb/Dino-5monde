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

async function collectSourceFiles(
    directory: string
): Promise<string[]> {
    const entries = await readdir(directory, { withFileTypes: true });
    const files: string[] = [];

    for (const entry of entries) {
        const entryPath = resolve(directory, entry.name);

        if (entry.isDirectory()) {
            files.push(...await collectSourceFiles(entryPath));
        } else if (
            entry.isFile()
            && /\.tsx?$/u.test(entry.name)
            && !entry.name.endsWith(".d.ts")
        ) {
            files.push(entryPath);
        }
    }

    return files.sort();
}

function repositoryPath(
    path: string
): string {
    return relative(resolve(), path).replace(/\\/gu, "/");
}

test(
    "React Router exclusively owns client-side URL mutations",
    async () => {
        const violations: string[] = [];

        for (const file of await collectSourceFiles(resolve("src"))) {
            const source = await readFile(file, "utf8");
            const path = repositoryPath(file);

            if (
                /\b(?:window\.)?history\.(?:pushState|replaceState|back|forward|go)\s*\(/u.test(source)
                || /\b(?:window\.)?location\.(?:assign|replace)\s*\(/u.test(source)
                || /\b(?:window\.)?location\.href\s*=/u.test(source)
                || /["']popstate["']/u.test(source)
            ) {
                violations.push(path);
            }

            if (
                /<a\b[^>]*\bhref=["']\//iu.test(source)
            ) {
                violations.push(
                    `${path}: internal navigation must use Link or NavLink`
                );
            }
        }

        assert.deepEqual(
            violations,
            [],
            `Native browser navigation bypasses React Router:\n${violations.join("\n")}`
        );
    }
);

test(
    "router creation and provider stay inside AppRouter",
    async () => {
        const owners: string[] = [];

        for (const file of await collectSourceFiles(resolve("src"))) {
            const source = await readFile(file, "utf8");

            if (/\b(?:createBrowserRouter|RouterProvider)\b/u.test(source)) {
                owners.push(repositoryPath(file));
            }
        }

        assert.deepEqual(
            owners,
            ["src/app/AppRouter.tsx"]
        );
    }
);

test(
    "imperative component navigation is supplied by React Router",
    async () => {
        const violations: string[] = [];

        for (const file of await collectSourceFiles(resolve("src"))) {
            const source = await readFile(file, "utf8");

            if (
                /\bnavigate\s*\(/u.test(source)
                && !/\buseNavigate\b/u.test(source)
            ) {
                violations.push(repositoryPath(file));
            }
        }

        assert.deepEqual(violations, []);
    }
);
