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
    buildSearchIndex,
    writeSearchIndex
} from "./tools/build-search-index.js";

const rootDirectory =
    import.meta.dirname;

const outputDirectory =
    resolve(
        rootDirectory,
        "dist"
    );

const publicBase =
    process.env.DINO_PUBLIC_BASE
    ?? "/";

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

        configureServer(server): void {
            server.middlewares.use(
                (
                    request,
                    response,
                    next
                ) => {
                    const pathname =
                        new URL(
                            request.url
                            ?? "/",
                            "http://localhost"
                        ).pathname;

                    if (
                        !pathname.endsWith(
                            "/search-index.json"
                        )
                    ) {
                        next();
                        return;
                    }

                    void buildSearchIndex(
                        rootDirectory
                    ).then(
                        index => {
                            response.statusCode =
                                200;
                            response.setHeader(
                                "Content-Type",
                                "application/json; charset=utf-8"
                            );
                            response.setHeader(
                                "Cache-Control",
                                "no-store"
                            );
                            response.end(
                                `${JSON.stringify(
                                    index
                                )}\n`
                            );
                        }
                    ).catch(
                        error => {
                            server.config.logger.error(
                                `Unable to build the development search index: ${String(
                                    error
                                )}`
                            );
                            response.statusCode =
                                500;
                            response.end(
                                "Search index generation failed."
                            );
                        }
                    );
                }
            );
        },

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
     * Local and verification builds run at the host root. The Pages workflow
     * explicitly supplies the repository base path. React Router consumes the
     * same Vite BASE_URL as its basename.
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
