import assert from "node:assert/strict";
import {
    readFile
} from "node:fs/promises";
import {
    dirname,
    resolve
} from "node:path";
import test from "node:test";
import {
    fileURLToPath
} from "node:url";

import {
    createContentCatalogDigest,
    loadCanonicalContentCatalog,
    stableStringify,
    summarizeContentCatalog
} from "../../tools/content/contentCatalog.js";

const root = resolve(
    dirname(
        fileURLToPath(import.meta.url)
    ),
    "../.."
);

test(
    "the one-time canonical inventory covers the complete current corpus",
    async () => {
        const documents =
            await loadCanonicalContentCatalog();

        assert.equal(
            documents.length,
            673
        );
        assert.deepEqual(
            summarizeContentCatalog(documents),
            {
                grammar_lesson: 125,
                news_article: 1,
                travel_lesson: 31,
                vocabulary_pack: 516
            }
        );
        assert.equal(
            createContentCatalogDigest(
                documents
            ),
            "30e689723daa78bf8d72ceebd32798ca2c23acc93737d776f2830fdd281a0209"
        );
    }
);

test(
    "every canonical document keeps its legacy index and detail provenance",
    async () => {
        const documents =
            await loadCanonicalContentCatalog();
        const identities = new Set<string>();

        for (const document of documents) {
            const catalogId =
                document.payload.catalog.id;
            const detailId =
                document.payload.document.id;
            const identity =
                `${document.contentType}:${document.contentKey}`;

            assert.equal(
                catalogId,
                document.contentKey,
                `${identity} index identity drift`
            );
            assert.equal(
                detailId,
                document.contentKey,
                `${identity} detail identity drift`
            );
            assert.ok(
                document.titleFr.length > 0,
                `${identity} requires a French title`
            );
            assert.match(
                document.sourcePath,
                /^data\/.+\.json$/u
            );
            assert.equal(
                document.schemaVersion,
                1
            );
            assert.ok(
                !identities.has(identity),
                `${identity} must remain unique`
            );
            identities.add(identity);
        }
    }
);

test(
    "stableStringify makes catalog checksums independent from object key order",
    () => {
        assert.equal(
            stableStringify({
                zebra: 1,
                alpha: {
                    two: 2,
                    one: 1
                }
            }),
            stableStringify({
                alpha: {
                    one: 1,
                    two: 2
                },
                zebra: 1
            })
        );
    }
);

test(
    "the importer is dry-run by default and requires explicit server credentials to write",
    async () => {
        const [
            importer,
            packageSource
        ] = await Promise.all([
            readFile(
                resolve(
                    root,
                    "tools/import-content-catalog.ts"
                ),
                "utf8"
            ),
            readFile(
                resolve(root, "package.json"),
                "utf8"
            )
        ]);

        assert.match(
            importer,
            /process\.argv\.includes\("--apply"\)/u
        );
        assert.match(
            importer,
            /SUPABASE_SERVICE_ROLE_KEY/u
        );
        assert.doesNotMatch(
            importer,
            /sb_secret_|sb_publishable_|postgresql:\/\//u
        );

        const packageJson = JSON.parse(
            packageSource
        ) as {
            scripts: Record<string, string>;
        };

        assert.equal(
            packageJson.scripts["content:inventory"],
            "tsx tools/import-content-catalog.ts"
        );
        assert.equal(
            packageJson.scripts["content:import"],
            "tsx tools/import-content-catalog.ts --apply"
        );
    }
);
