import assert from "node:assert/strict";
import test from "node:test";

import {
    ContentContractError
} from "../../src/services/content/contentRepository.js";

import {
    loadSupabaseContentCatalog,
    loadSupabaseContentDocument
} from "../../src/services/backend/supabaseContentRepository.js";

import type {
    DinoBackendClient
} from "../../src/services/backend/supabaseClient.js";

test(
    "Supabase content reads use a lightweight catalog RPC and one targeted detail RPC",
    async () => {
        const calls: Array<{
            args: unknown;
            name: string;
        }> = [];
        const client = {
            rpc: async (
                name: string,
                args: unknown
            ) => {
                calls.push({
                    args,
                    name
                });

                if (
                    name
                    === "get_published_content_catalog"
                ) {
                    return {
                        data: [{
                            catalog: {
                                exercises: 8,
                                estimatedTime: 10,
                                icon: "👋",
                                id: "A1-G-001",
                                level: "A1",
                                module: "Premiers pas",
                                title: "Les pronoms sujets"
                            },
                            content_key:
                                "A1-G-001",
                            content_type:
                                "grammar_lesson",
                            item_id:
                                "item-id",
                            level: "A1",
                            published_at:
                                "2026-09-14T10:00:00.000Z",
                            revision_id:
                                "revision-id",
                            revision_number: 2,
                            schema_version: 2,
                            title_fa: null,
                            title_fr:
                                "Les pronoms sujets"
                        }],
                        error: null
                    };
                }

                return {
                    data: [{
                        content_hash:
                            "a".repeat(64),
                        content_key:
                            "A1-G-001",
                        content_type:
                            "grammar_lesson",
                        item_id:
                            "item-id",
                        level: "A1",
                        payload: {
                            catalog: {
                                id: "A1-G-001"
                            },
                            document: {
                                id: "A1-G-001",
                                sections: [],
                                title:
                                    "Les pronoms personnels sujets"
                            },
                            exerciseSections: [{
                                id: "A1-G-001-quiz",
                                questions: [],
                                title: "Quiz",
                                type: "quiz"
                            }]
                        },
                        published_at:
                            "2026-09-14T10:00:00.000Z",
                        revision_id:
                            "revision-id",
                        revision_number: 2,
                        schema_version: 2,
                        title_fa: null,
                        title_fr:
                            "Les pronoms personnels sujets"
                    }],
                    error: null
                };
            }
        } as unknown as DinoBackendClient;

        const catalog =
            await loadSupabaseContentCatalog(
                client,
                "grammar_lesson",
                "A1"
            );
        const document =
            await loadSupabaseContentDocument(
                client,
                "grammar_lesson",
                "A1-G-001"
            );

        assert.equal(
            catalog[0]?.contentKey,
            "A1-G-001"
        );
        assert.equal(
            document?.exerciseSections[0]
                ?.id,
            "A1-G-001-quiz"
        );
        assert.deepEqual(
            calls,
            [
                {
                    args: {
                        p_content_type:
                            "grammar_lesson",
                        p_level: "A1"
                    },
                    name:
                        "get_published_content_catalog"
                },
                {
                    args: {
                        p_content_key:
                            "A1-G-001",
                        p_content_type:
                            "grammar_lesson"
                    },
                    name:
                        "get_published_content"
                }
            ]
        );
    }
);

test(
    "Supabase content rejects mismatched payload identities before rendering",
    async () => {
        const client = {
            rpc: async () => ({
                data: [{
                    content_hash:
                        "a".repeat(64),
                    content_key:
                        "A1-G-001",
                    content_type:
                        "grammar_lesson",
                    item_id: "item-id",
                    level: "A1",
                    payload: {
                        catalog: {
                            id: "wrong-id"
                        },
                        document: {
                            id: "A1-G-001"
                        }
                    },
                    published_at:
                        "2026-09-14T10:00:00.000Z",
                    revision_id:
                        "revision-id",
                    revision_number: 1,
                    schema_version: 1,
                    title_fa: null,
                    title_fr: "Titre"
                }],
                error: null
            })
        } as unknown as DinoBackendClient;

        await assert.rejects(
            loadSupabaseContentDocument(
                client,
                "grammar_lesson",
                "A1-G-001"
            ),
            ContentContractError
        );
        await assert.rejects(
            loadSupabaseContentDocument(
                client,
                "grammar_lesson",
                " ../unsafe"
            ),
            TypeError
        );
    }
);
