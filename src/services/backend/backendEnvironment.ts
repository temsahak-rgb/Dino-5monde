const backendEnvironmentKeys = [
    "VITE_SUPABASE_URL",
    "VITE_SUPABASE_PUBLISHABLE_KEY"
] as const;

type BackendEnvironmentKey =
    typeof backendEnvironmentKeys[number];

type BackendEnvironmentSource =
    Partial<Record<BackendEnvironmentKey, string>>;

interface DisabledBackendConfiguration {
    status: "disabled";
    reason: "missing-environment";
}

interface ConfiguredBackendConfiguration {
    status: "configured";
    supabaseUrl: string;
    publishableKey: string;
}

type BackendConfiguration =
    | DisabledBackendConfiguration
    | ConfiguredBackendConfiguration;

/**
 * Reads the public browser-side backend configuration.
 *
 * Both values may be absent while the existing static application is being
 * deployed. A partial or unsafe configuration fails fast instead of silently
 * connecting to the wrong backend.
 */
function readBackendConfiguration(
    source: BackendEnvironmentSource
): BackendConfiguration {
    const supabaseUrl =
        source.VITE_SUPABASE_URL
            ?.trim()
        ?? "";

    const publishableKey =
        source.VITE_SUPABASE_PUBLISHABLE_KEY
            ?.trim()
        ?? "";

    if (
        !supabaseUrl
        && !publishableKey
    ) {
        return {
            status: "disabled",
            reason: "missing-environment"
        };
    }

    const missing =
        backendEnvironmentKeys.filter(
            key => !source[key]
                ?.trim()
        );

    if (missing.length > 0) {
        throw new Error(
            `Incomplete backend configuration: missing ${missing.join(
                ", "
            )}`
        );
    }

    let parsedUrl: URL;

    try {
        parsedUrl =
            new URL(
                supabaseUrl
            );
    } catch {
        throw new Error(
            "Invalid VITE_SUPABASE_URL"
        );
    }

    const loopbackHosts =
        new Set([
            "127.0.0.1",
            "[::1]",
            "localhost"
        ]);

    if (
        parsedUrl.protocol !== "https:"
        && !(
            parsedUrl.protocol === "http:"
            && loopbackHosts.has(
                parsedUrl.hostname
            )
        )
    ) {
        throw new Error(
            "VITE_SUPABASE_URL must use HTTPS outside local development"
        );
    }

    if (
        parsedUrl.username
        || parsedUrl.password
        || parsedUrl.search
        || parsedUrl.hash
        || ![
            "",
            "/"
        ].includes(
            parsedUrl.pathname
        )
    ) {
        throw new Error(
            "VITE_SUPABASE_URL must be an origin without credentials, path, query or hash"
        );
    }

    if (publishableKey.length < 20) {
        throw new Error(
            "VITE_SUPABASE_PUBLISHABLE_KEY is malformed"
        );
    }

    return {
        status: "configured",
        supabaseUrl:
            parsedUrl.origin,
        publishableKey
    };
}

function readRuntimeBackendConfiguration():
    BackendConfiguration {
    // Keep these accesses explicit: Vite replaces import.meta.env keys at
    // build time and cannot reliably discover them through an alias.
    const runtimeEnvironment: BackendEnvironmentSource = {
        VITE_SUPABASE_URL:
            import.meta.env.VITE_SUPABASE_URL,
        VITE_SUPABASE_PUBLISHABLE_KEY:
            import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY
    };

    return readBackendConfiguration(
        runtimeEnvironment
    );
}

export {
    backendEnvironmentKeys,
    readBackendConfiguration,
    readRuntimeBackendConfiguration,
    type BackendConfiguration,
    type BackendEnvironmentKey,
    type BackendEnvironmentSource,
    type ConfiguredBackendConfiguration,
    type DisabledBackendConfiguration
};
