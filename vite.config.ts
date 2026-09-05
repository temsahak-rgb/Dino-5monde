import {
    cp,
    mkdir
} from "node:fs/promises";
import { resolve } from "node:path";

import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import {
    defineConfig,
    type Plugin
} from "vite";

import {
    writeSearchIndex
} from "./tools/build-search-index.js";

const rootDirectory =
    import.meta.dirname;

const outputDirectory =
    resolve(
        rootDirectory,
        "dist"
    );

const repositoryName =
    process.env.GITHUB_REPOSITORY
        ?.split("/")
        .at(-1);

const publicBase =
    process.env.GITHUB_ACTIONS === "true"
    && repositoryName
        ? `/${repositoryName}/`
        : "/";

/**
 * Preserves the existing Dino static-data contract.
 *
 * The application currently loads educational content at runtime through
 * relative URLs such as `./data/...`. Vite does not copy the repository-level
 * `data/` directory by default, so this plugin keeps the generated build
 * compatible with the existing engines.
 *
 * It also regenerates the browser search index after each production build.
 */
function dinoStaticDataPlugin(): Plugin {
    return {
        name: "dino-static-data",

        apply: "build",

        async closeBundle(): Promise<void> {
            await mkdir(
                outputDirectory,
                {
                    recursive: true
                }
            );

            await cp(
                resolve(
                    rootDirectory,
                    "data"
                ),
                resolve(
                    outputDirectory,
                    "data"
                ),
                {
                    recursive: true
                }
            );

            await writeSearchIndex(
                rootDirectory,
                resolve(
                    outputDirectory,
                    "search-index.json"
                )
            );

            /*
             * GitHub Pages has no configurable SPA rewrite. Serving the
             * bundled application as 404.html lets React Router recover a
             * directly opened nested URL while keeping assets rooted at the
             * repository base.
             */
            await cp(
                resolve(
                    outputDirectory,
                    "index.html"
                ),
                resolve(
                    outputDirectory,
                    "404.html"
                )
            );
        }
    };
}

export default defineConfig({
    /*
     * Local builds run at the host root. GitHub Actions builds use the
     * repository name as the GitHub Pages base path. React Router consumes
     * the same Vite BASE_URL as its basename.
     */
    base: publicBase,

    plugins: [
        react(),
        tailwindcss(),
        dinoStaticDataPlugin()
    ],

    build: {
        outDir: "dist",
        emptyOutDir: true,
        sourcemap: true,
        target: "es2022"
    },

    server: {
        port: 5173
    },

    preview: {
        host: "127.0.0.1",
        port: 4173
    }
});
