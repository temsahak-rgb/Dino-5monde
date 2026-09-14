import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import test from "node:test";
import { buildAdminVocabularyPayload, readAdminVocabularyEditor } from "../../src/features/admin/adminVocabularyEditor.js";
import { validateAdminVocabularyEditor } from "../../src/features/admin/adminVocabularyValidation.js";
import { loadVocabularyExportDrafts } from "../../src/features/admin/vocabularyExport.js";
import type { AdminContentDraft } from "../../src/features/admin/adminContentRepository.js";

const root = resolve(import.meta.dirname, "../..");

test("all indexed Vocabulary packs survive the structured editor", async () => {
    const originalFetch = globalThis.fetch;
    globalThis.fetch = (async input => {
        const path = String(input).replace(/^\.\//u, "");
        try { return Response.json(JSON.parse(await readFile(resolve(root, path), "utf8")) as unknown); }
        catch { return new Response(null, { status: 404 }); }
    }) as typeof fetch;
    try {
        const drafts = await loadVocabularyExportDrafts();
        assert.equal(drafts.length, 516);
        for (const draft of drafts) {
            const value = readAdminVocabularyEditor(createEditor(draft));
            const errors = validateAdminVocabularyEditor(value).filter(issue => issue.severity === "error");
            assert.deepEqual(errors, [], `${draft.contentKey}: ${JSON.stringify(errors)}`);
            assert.deepEqual(buildAdminVocabularyPayload(value), draft.payload, `${draft.contentKey} must round-trip exactly`);
        }
    } finally { globalThis.fetch = originalFetch; }
});

test("Vocabulary extensions stay attached to reordered entities", () => {
    const payload = { catalog: { id: "salut", title: "Salut", words: 2 }, document: { id: "salut", level: "A1", theme: "Salut", words: [{ fr: "bonjour", fa: "سلام", extension: "first" }, { fr: "merci", fa: "مرسی", extension: "second" }], quiz: { displayCount: 1, questions: [{ question: "Q", options: ["a", "b"], correctIndex: 0, type: "mcq", extension: true }] } } };
    const draft = { contentKey: "salut", contentType: "vocabulary_pack" as const, level: "A1", payload, schemaVersion: 1, sourcePath: "test", titleFa: null, titleFr: "Salut" } satisfies AdminContentDraft;
    const value = readAdminVocabularyEditor(createEditor(draft));
    value.words.reverse();
    const rebuilt = buildAdminVocabularyPayload(value) as typeof payload;
    assert.equal(rebuilt.document.words[0]?.extension, "second");
    assert.equal(rebuilt.document.quiz.questions[0]?.extension, true);
});

function createEditor(draft: AdminContentDraft) {
    return { contentKey: draft.contentKey, contentType: draft.contentType, level: draft.level ?? "", payloadText: JSON.stringify(draft.payload), schemaVersion: String(draft.schemaVersion), sourcePath: draft.sourcePath ?? "admin-panel", titleFa: draft.titleFa ?? "", titleFr: draft.titleFr };
}
