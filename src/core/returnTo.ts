interface SafeReturnToOptions {
    blockedPaths?: readonly string[];
    fallback?: string;
}

/** Keeps post-flow navigation inside the current Dino application. */
function getSafeReturnTo(
    value: string | null,
    options: SafeReturnToOptions = {}
): string {
    const fallback =
        options.fallback
        ?? "/";

    if (
        !value
        || !value.startsWith("/")
        || value.startsWith("//")
        || value.includes("\\")
    ) {
        return fallback;
    }

    try {
        const base =
            new URL(
                "https://dino.invalid"
            );

        const candidate =
            new URL(
                value,
                base
            );

        if (
            candidate.origin !== base.origin
            || options.blockedPaths?.includes(
                candidate.pathname
            )
        ) {
            return fallback;
        }

        return `${candidate.pathname}${candidate.search}${candidate.hash}`;
    } catch {
        return fallback;
    }
}

/** Builds an absolute Dino URL without losing a GitHub Pages basename. */
function createDeploymentUrl(
    origin: string,
    basename: string,
    internalPath: string
): string {
    const normalizedBasename =
        basename.endsWith("/")
            ? basename
            : `${basename}/`;
    const deploymentBase =
        new URL(
            normalizedBasename,
            `${origin.replace(/\/$/u, "")}/`
        );

    return new URL(
        internalPath.replace(/^\/+/u, ""),
        deploymentBase
    ).href;
}

export {
    createDeploymentUrl,
    getSafeReturnTo,
    type SafeReturnToOptions
};
