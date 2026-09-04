/**
 * Builds the browser application into the dist directory.
 *
 * TypeScript compilation preserves the source directory layout while static
 * assets are copied unchanged so the generated index.html can keep using the
 * same relative URLs as the source application.
 */

import { execFileSync } from "node:child_process";
import { cp, mkdir, rm } from "node:fs/promises";
import { createRequire } from "node:module";
import { resolve } from "node:path";

import {
    writeSearchIndex
} from "./build-search-index.js";

const require = createRequire(import.meta.url);

const root = resolve(import.meta.dirname, "..");
const dist = resolve(root, "dist");
const tsconfig = resolve(root, "tsconfig.json");

/**
 * Resolves the TypeScript CLI JavaScript entry point installed in the project.
 *
 * Using the JavaScript entry point instead of `node_modules/.bin/tsc` avoids
 * platform-specific shell wrappers such as `tsc.cmd` on Windows.
 *
 * @returns Absolute path to the TypeScript compiler CLI.
 */
function getTypeScriptCli(): string {
    return require.resolve("typescript/bin/tsc");
}

/**
 * Compiles the application TypeScript sources using the production tsconfig.
 *
 * The compiler is executed with the same Node.js runtime that launched this
 * build script, making the invocation portable across Windows, Linux and macOS.
 */
function compileApplication(): void {
    execFileSync(
        process.execPath,
        [
            getTypeScriptCli(),
            "-p",
            tsconfig
        ],
        {
            cwd: root,
            stdio: "inherit"
        }
    );
}

/**
 * Copies the static resources required by the generated browser application.
 */
async function copyStaticAssets(): Promise<void> {
    await cp(
        resolve(root, "index.html"),
        resolve(dist, "index.html")
    );

    await cp(
        resolve(root, "data"),
        resolve(dist, "data"),
        {
            recursive: true
        }
    );

    await mkdir(
        resolve(dist, "src", "styles"),
        {
            recursive: true
        }
    );

    await cp(
        resolve(root, "src", "styles"),
        resolve(dist, "src", "styles"),
        {
            recursive: true
        }
    );
}

/**
 * Executes the complete deterministic production build.
 *
 * The output directory is deleted before compilation to guarantee that no
 * stale JavaScript or static asset survives between builds.
 */
async function build(): Promise<void> {
    await rm(
        dist,
        {
            recursive: true,
            force: true
        }
    );

    compileApplication();

    await copyStaticAssets();

    const searchIndex =
        await writeSearchIndex(
            root,
            resolve(
                dist,
                "search-index.json"
            )
        );

    console.log(
        `Search index generated: ${searchIndex.vocab.length} vocabulary words, ${searchIndex.grammar.length} grammar lessons, ${searchIndex.news.length} news articles.`
    );
    console.log("Build completed: dist/");
}

await build();
