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
 * Therefore browser-relative URLs such as `./data/...` can no longer be used:
 * they would resolve relative to the active route rather than the deployed
 * application root.
 */

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
 * This also keeps GitHub Pages repository deployments compatible without
 * hard-coding `/Dino-5monde/`.
 */
function getApplicationBaseUrl():
    URL {
    return new URL(
        import.meta.env.DEV
            ? "../../"
            : "../",
        import.meta.url
    );
}

/**
 * Resolves one static application resource independently from the current
 * browser route.
 *
 * Example:
 *
 * getStaticDataUrl(
 *     "data/placement.json"
 * )
 */
function getStaticDataUrl(
    path: string
): string {
    const normalizedPath =
        normalizeStaticPath(
            path
        );

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
    path: string
): string {
    const url =
        new URL(
            getStaticDataUrl(
                path
            )
        );

    url.searchParams.set(
        "v",
        Date.now()
            .toString()
    );

    return url.href;
}

/**
 * Removes route-like leading syntax from a static-data path.
 *
 * All returned paths remain relative to the application root.
 */
function normalizeStaticPath(
    path: string
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
    normalizeStaticPath
};