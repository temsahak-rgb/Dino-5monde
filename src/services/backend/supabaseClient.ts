import type {
    SupabaseClient
} from "@supabase/supabase-js";

import type {
    ConfiguredBackendConfiguration
} from "./backendEnvironment.js";

import type {
    Database
} from "./database.types.js";

type DinoBackendClient =
    SupabaseClient<Database>;

async function loadDinoBackendClient(
    configuration:
        ConfiguredBackendConfiguration
): Promise<DinoBackendClient> {
    const {
        createClient
    } = await import(
        "@supabase/supabase-js"
    );

    return createClient<Database>(
        configuration.supabaseUrl,
        configuration.publishableKey,
        {
            auth: {
                autoRefreshToken: true,
                detectSessionInUrl: true,
                persistSession: true
            },
            global: {
                headers: {
                    "X-Client-Info":
                        "dino-5monde-web"
                }
            }
        }
    );
}

export {
    loadDinoBackendClient,
    type DinoBackendClient
};
