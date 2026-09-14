import {
    createClient
} from "@supabase/supabase-js";

import {
    createContentCatalogDigest,
    loadCanonicalContentCatalog,
    summarizeContentCatalog,
    type CanonicalContentDocument
} from "./content/contentCatalog.js";
import type {
    Database
} from "../src/services/backend/database.types.js";

const apply =
    process.argv.includes("--apply");
const documents =
    await loadCanonicalContentCatalog();
const summary = {
    digest:
        createContentCatalogDigest(
            documents
        ),
    documents:
        documents.length,
    mode:
        apply
            ? "apply"
            : "dry-run",
    types:
        summarizeContentCatalog(
            documents
        )
};

if (!apply) {
    process.stdout.write(
        `${JSON.stringify(summary, null, 2)}\n`
    );
    process.exit(0);
}

const supabaseUrl =
    requireEnvironment(
        "SUPABASE_URL"
    );
const serviceRoleKey =
    requireEnvironment(
        "SUPABASE_SERVICE_ROLE_KEY"
    );
const client = createClient<Database>(
    supabaseUrl,
    serviceRoleKey,
    {
        auth: {
            autoRefreshToken: false,
            persistSession: false
        }
    }
);

let imported = 0;

for (const batch of batches(documents, 8)) {
    await Promise.all(
        batch.map(
            async document => {
                const {
                    data,
                    error
                } = await client.rpc(
                    "import_content_revision",
                    {
                        p_content_key:
                            document.contentKey,
                        p_content_type:
                            document.contentType,
                        p_level:
                            document.level,
                        p_payload:
                            document.payload,
                        p_publish: true,
                        p_schema_version:
                            document.schemaVersion,
                        p_source_path:
                            document.sourcePath,
                        p_title_fa:
                            document.titleFa,
                        p_title_fr:
                            document.titleFr
                    }
                );

                if (error) {
                    throw new Error(
                        `Unable to import ${document.contentType}:${document.contentKey}`,
                        { cause: error }
                    );
                }

                if (!data?.[0]) {
                    throw new Error(
                        `Import returned no result for ${document.contentType}:${document.contentKey}`
                    );
                }

                imported += 1;
            }
        )
    );
}

process.stdout.write(
    `${JSON.stringify({
        ...summary,
        imported
    }, null, 2)}\n`
);

function requireEnvironment(
    name: string
): string {
    const value =
        process.env[name]?.trim();

    if (!value) {
        throw new Error(
            `${name} is required with --apply`
        );
    }

    return value;
}

function batches<T>(
    values: readonly T[],
    size: number
): T[][] {
    const result: T[][] = [];

    for (
        let index = 0;
        index < values.length;
        index += size
    ) {
        result.push(
            values.slice(
                index,
                index + size
            )
        );
    }

    return result;
}
