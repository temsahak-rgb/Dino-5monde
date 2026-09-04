/**
 * Shared static-data URL resolver.
 *
 * Dino keeps its educational corpus outside the JavaScript bundle:
 *
 * data/
 *   grammar-A1.json
 *   placement.json
 *   lessons/
 *   exercises/
 *   vocabulary/
 *   travel/
 *   news/
 *
 * React Router now uses durable nested routes such as:
 *
 * /grammar/A1
 * /grammar/lesson/A1-G-001
 * /vocabulary/B1/travel
 *
 * Therefore browser-relative URLs such as `./data/...` cannot be used in the
 * browser application: they would resolve relative to the active route rather
 * than the deployed application root.
 *
 * Tests and other non-Vite consumers keep a relative URL contract so injected
 * fetchers remain deterministic and do not depend on a browser origin.
 */

/**
 * Detects whether the module is currently executed through Vite.
 *
 * `import.meta.env` is injected by Vite but does not exist when the same
 * TypeScript module is executed directly by Node through `tsx`.
 */
function hasViteEnvironment():
    boolean {
    return (
        typeof import.meta.env
        !== "undefined"
    );
}

/**
 * Returns whether the current Vite environment is development.
 *
 * The explicit environment guard is important: accessing
 * `import.meta.env.DEV` directly crashes in Node because `env` is undefined.
 */
function isViteDevelopment():
    boolean {
    return (
        hasViteEnvironment()
        && import.meta.env.DEV
            === true
    );
}

/**
 * Returns the application root URL.
 *
 * Development:
 *
 *   module:
 *   http://localhost:5173/src/core/staticData.ts
 *
 *   ../../
 *   =>
 *   http://localhost:5173/
 *
 * Production:
 *
 *   module:
 *   https://example.com/Dino-5monde/assets/index-xxx.js
 *
 *   ../
 *   =>
 *   https://example.com/Dino-5monde/
 *
 * Node / tests:
 *
 *   module:
 *   file:///repo/src/core/staticData.ts
 *
 *   ../../
 *   =>
 *   file:///repo/
 *
 * This also keeps GitHub Pages repository deployments compatible without
 * hard-coding `/Dino-5monde/`.
 */
function getApplicationBaseUrl():
    URL {
    const relativeBase =
        hasViteEnvironment()
            ? (
                isViteDevelopment()
                    ? "../../"
                    : "../"
            )
            : "../../";

    return new URL(
        relativeBase,
        import.meta.url
    );
}

/**
 * Resolves one static application resource independently from the current
 * browser route.
 *
 * Browser / Vite:
 *
 * getStaticDataUrl(
 *     "data/placement.json"
 * )
 *
 * =>
 *
 * http://localhost:5173/data/placement.json
 *
 * Node / tests:
 *
 * =>
 *
 * ./data/placement.json
 */
function getStaticDataUrl(
    path:
        string
): string {
    const normalizedPath =
        normalizeStaticPath(
            path
        );

    /*
     * Direct Node execution has no browser deployment root.
     *
     * Returning a stable relative path also preserves the historical contract
     * expected by injected test fetchers.
     */
    if (
        !hasViteEnvironment()
    ) {
        return (
            `./${normalizedPath}`
        );
    }

    return new URL(
        normalizedPath,
        getApplicationBaseUrl()
    ).href;
}

/**
 * Resolves one static resource and adds a cache-busting query parameter.
 *
 * Useful for corpus files that should reflect the latest deployed data
 * immediately.
 */
function getFreshStaticDataUrl(
    path:
        string
): string {
    const staticUrl =
        getStaticDataUrl(
            path
        );

    const version =
        Date.now()
            .toString();

    /*
     * `new URL("./file.json")` requires an explicit base in Node.
     *
     * For the non-Vite relative contract, appending the query parameter
     * directly keeps the result portable.
     */
    if (
        staticUrl.startsWith(
            "./"
        )
    ) {
        const separator =
            staticUrl.includes(
                "?"
            )
                ? "&"
                : "?";

        return (
            `${staticUrl}${separator}v=${version}`
        );
    }

    const url =
        new URL(
            staticUrl
        );

    url.searchParams.set(
        "v",
        version
    );

    return url.href;
}

/**
 * Removes route-like leading syntax from a static-data path.
 *
 * All returned paths remain relative to the application root.
 */
function normalizeStaticPath(
    path:
        string
): string {
    return path
        .trim()
        .replace(
            /^\.?\//,
            ""
        )
        .replace(
            /^\/+/,
            ""
        );
}

export {
    getApplicationBaseUrl,
    getFreshStaticDataUrl,
    getStaticDataUrl,
    hasViteEnvironment,
    normalizeStaticPath
};