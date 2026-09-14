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
    createAdminPayloadTemplate,
    createEmptyAdminContentEditor,
    parseAdminContentEditor
} from "../../src/features/admin/adminContentEditor.js";
import {
    loadAdminContentItems,
    loadAdminContentRevisions,
    loadContentAdminStatus,
    publishAdminContentRevision,
    publishLatestAdminContentBatch,
    saveAdminContentDraft,
    validateAdminContentDraft
} from "../../src/features/admin/adminContentRepository.js";
import {
    importAdminContentDrafts,
    loadGrammarExportDrafts
} from "../../src/features/admin/grammarExport.js";
import {
    ContentContractError
} from "../../src/services/content/contentRepository.js";
import type {
    DinoBackendClient
} from "../../src/services/backend/supabaseClient.js";

const root = resolve(
    dirname(fileURLToPath(import.meta.url)),
    "../.."
);

const draft = {
    contentKey: "A1-G-ADMIN-001",
    contentType: "grammar_lesson" as const,
    level: "A1",
    payload: {
        catalog: {
            id: "A1-G-ADMIN-001",
            title: "Le présent"
        },
        document: {
            id: "A1-G-ADMIN-001",
            sections: [],
            title: "Le présent"
        },
        exerciseSections: []
    },
    schemaVersion: 2,
    sourcePath: "admin-panel",
    titleFa: null,
    titleFr: "Le présent"
};

test(
    "content admin repository separates private draft import from explicit publication",
    async () => {
        const calls: Array<{ args: unknown; name: string }> = [];
        const client = {
            rpc: async (name: string, args: unknown) => {
                calls.push({ args, name });

                switch (name) {
                    case "get_content_admin_status":
                        return { data: [{ is_admin: true }], error: null };
                    case "admin_list_content_items":
                        return { data: [{ content_key: draft.contentKey }], error: null };
                    case "admin_get_content_revisions":
                        return { data: [{ revision_number: 1 }], error: null };
                    case "admin_import_content_draft":
                        return {
                            data: [{
                                content_hash: "a".repeat(64),
                                content_key: draft.contentKey,
                                content_type: draft.contentType,
                                published: false,
                                revision_number: 1
                            }],
                            error: null
                        };
                    case "admin_publish_content_revision":
                        return { data: [{ revision_number: 1 }], error: null };
                    case "admin_publish_latest_content_batch":
                        return { data: [{ published_count: 3 }], error: null };
                    default:
                        throw new Error(`Unexpected RPC ${name}`);
                }
            }
        } as unknown as DinoBackendClient;

        assert.equal(await loadContentAdminStatus(client), true);
        assert.equal((await loadAdminContentItems(client)).length, 1);
        assert.equal(
            (await loadAdminContentRevisions(
                client,
                draft.contentType,
                draft.contentKey
            )).length,
            1
        );
        assert.equal((await saveAdminContentDraft(client, draft)).published, false);
        await publishAdminContentRevision(
            client,
            draft.contentType,
            draft.contentKey,
            1
        );
        assert.equal(
            await publishLatestAdminContentBatch(client, draft.contentType),
            3
        );

        assert.deepEqual(
            calls.map(call => call.name),
            [
                "get_content_admin_status",
                "admin_list_content_items",
                "admin_get_content_revisions",
                "admin_import_content_draft",
                "admin_publish_content_revision",
                "admin_publish_latest_content_batch"
            ]
        );
        assert.deepEqual(calls[3]?.args, {
            p_content_key: draft.contentKey,
            p_content_type: draft.contentType,
            p_level: "A1",
            p_payload: draft.payload,
            p_schema_version: 2,
            p_source_path: "admin-panel",
            p_title_fa: null,
            p_title_fr: "Le présent"
        });
    }
);

test(
    "content admin rejects malformed identities, revisions and payload contracts before network calls",
    async () => {
        assert.throws(
            () => validateAdminContentDraft({
                ...draft,
                contentKey: "../unsafe"
            }),
            TypeError
        );
        assert.throws(
            () => validateAdminContentDraft({
                ...draft,
                payload: {
                    ...draft.payload,
                    document: {
                        id: "another-id"
                    }
                }
            }),
            ContentContractError
        );

        const client = {
            rpc: async () => {
                throw new Error("network must not be reached");
            }
        } as unknown as DinoBackendClient;

        await assert.rejects(
            publishAdminContentRevision(
                client,
                draft.contentType,
                draft.contentKey,
                0
            ),
            TypeError
        );
    }
);

test(
    "admin editor creates valid normalized JSON drafts",
    () => {
        const editor = {
            ...createEmptyAdminContentEditor(),
            contentKey: " A1-G-ADMIN-002 ",
            level: " A1 ",
            titleFr: " Le futur proche "
        };
        editor.payloadText = createAdminPayloadTemplate(editor);

        const parsed = parseAdminContentEditor(editor);

        assert.equal(parsed.contentKey, "A1-G-ADMIN-002");
        assert.equal(parsed.titleFr, "Le futur proche");
        assert.equal(parsed.level, "A1");
        assert.deepEqual(
            (parsed.payload as { document: { id: string } }).document.id,
            "A1-G-ADMIN-002"
        );
        assert.throws(
            () => parseAdminContentEditor({
                ...editor,
                payloadText: "{not-json}"
            }),
            /Le payload JSON n’est pas valide/u
        );
    }
);

test(
    "legacy Grammar export is readable as validated admin drafts without changing source data",
    async () => {
        const originalFetch = globalThis.fetch;
        globalThis.fetch = (async input => {
            const path = String(input).replace(/^\.\//u, "");

            try {
                const source = await readFile(resolve(root, path), "utf8");
                return Response.json(JSON.parse(source) as unknown);
            } catch {
                return new Response(null, { status: 404 });
            }
        }) as typeof fetch;

        try {
            const drafts = await loadGrammarExportDrafts();

            assert.equal(drafts.length, 125);
            assert.equal(new Set(drafts.map(item => item.contentKey)).size, 125);
            for (const item of drafts) {
                assert.doesNotThrow(() => validateAdminContentDraft(item));
                assert.match(item.sourcePath ?? "", /^data\/lessons\//u);
            }
        } finally {
            globalThis.fetch = originalFetch;
        }
    }
);

test(
    "bulk import has bounded concurrency and reports completed drafts",
    async () => {
        let active = 0;
        let maximumActive = 0;
        const progress: number[] = [];
        const drafts = Array.from(
            { length: 7 },
            (_, index) => {
                const contentKey = `A1-G-BULK-${index}`;
                return {
                    ...draft,
                    contentKey,
                    payload: {
                        catalog: { id: contentKey },
                        document: { id: contentKey }
                    }
                };
            }
        );
        const client = {
            rpc: async () => {
                active += 1;
                maximumActive = Math.max(maximumActive, active);
                await Promise.resolve();
                active -= 1;
                return {
                    data: [{
                        content_hash: "b".repeat(64),
                        content_key: draft.contentKey,
                        content_type: draft.contentType,
                        published: false,
                        revision_number: 1
                    }],
                    error: null
                };
            }
        } as unknown as DinoBackendClient;

        await importAdminContentDrafts(
            client,
            drafts,
            completed => progress.push(completed),
            3
        );

        assert.equal(maximumActive, 3);
        assert.deepEqual(progress.sort((left, right) => left - right), [1, 2, 3, 4, 5, 6, 7]);
        await assert.rejects(
            importAdminContentDrafts(client, drafts, undefined, 9),
            TypeError
        );
    }
);

test(
    "content administration migration exposes only allowlisted RPCs and preserves auditability",
    async () => {
        const migration = await readFile(
            resolve(
                root,
                "supabase/migrations/20260915100000_create_content_admin_api.sql"
            ),
            "utf8"
        );

        assert.match(migration, /alter table public\.content_admins\s+force row level security/u);
        assert.match(migration, /revoke all on table public\.content_admins\s+from public, anon, authenticated/u);
        assert.match(migration, /perform public\.assert_content_admin_access\(\)/u);
        assert.match(migration, /p_source_path,\s+false/u);
        assert.match(migration, /'source',\s*'admin_panel'/u);
        assert.match(migration, /'source',\s*'admin_panel_batch'/u);
        assert.doesNotMatch(
            migration,
            /grant (?:select|insert|update|delete) on table public\.content_(?:admins|items|revisions|publication_events)\s+to (?:anon|authenticated)/u
        );
        assert.doesNotMatch(migration, /service_role[^;]*(?:anon|authenticated)/u);
    }
);
