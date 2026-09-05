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
 * Tests and other Node consumers keep a relative URL contract so injected
 * fetchers remain deterministic and do not depend on a browser origin.
 */

/**
 * Returns the current module URL.
 */
function getModuleUrl():
    URL {
    return new URL(
        import.meta.url
    );
}

/**
 * Detects whether this module is executing as a browser-served module.
 *
 * Vite development and production deployments use http/https module URLs.
 * Direct execution through Node/tsx uses a file:// URL.
 *
 * Keeping this detection based on standard import.meta.url means this module
 * does not depend on Vite-specific ImportMeta extensions.
 */
function hasViteEnvironment():
    boolean {
    const protocol =
        getModuleUrl()
            .protocol;

    return (
        protocol === "http:"
        || protocol === "https:"
    );
}

/**
 * Detects whether import.meta.url still points to the original source module.
 *
 * Development:
 *
 *   http://localhost:5173/src/core/staticData.ts
 *
 * Node tests:
 *
 *   file:///repo/src/core/staticData.ts
 *
 * Production bundles instead execute from something similar to:
 *
 *   https://example.com/Dino-5monde/assets/index-xxx.js
 */
function isSourceModule():
    boolean {
    const pathname =
        getModuleUrl()
            .pathname;

    return pathname.includes(
        "/src/core/"
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
 * This keeps repository deployments compatible without hard-coding a
 * deployment directory such as `/Dino-5monde/`.
 */
function getApplicationBaseUrl():
    URL {
    const relativeBase =
        isSourceModule()
            ? "../../"
            : "../";

    return new URL(
        relativeBase,
        import.meta.url
    );
}

/**
 * Resolves one static application resource independently from the current
 * browser route.
 *
 * Browser:
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
     * Returning a stable relative path preserves the contract expected by
     * injected test fetchers.
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
     * Relative Node/test URLs cannot be passed directly to new URL() without
     * an explicit base.
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