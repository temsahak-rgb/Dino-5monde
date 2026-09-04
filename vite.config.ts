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
        }
    };
}

export default defineConfig({
    /*
     * Dino is deployed on GitHub Pages and currently uses query-string routes.
     * Relative asset URLs therefore keep the build portable both at the domain
     * root and below a repository path such as `/Dino-5monde/`.
     */
    base: "./",

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