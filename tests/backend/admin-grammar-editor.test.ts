import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import test from "node:test";

import {
    buildAdminGrammarPayload,
    createGrammarLessonPreview,
    readAdminGrammarEditor,
    updateAdminGrammarEditor
} from "../../src/features/admin/adminGrammarEditor.js";

import {
    getAdminGrammarCompletion,
    validateAdminGrammarEditor
} from "../../src/features/admin/adminGrammarValidation.js";

import {
    loadGrammarExportDrafts
} from "../../src/features/admin/grammarExport.js";

import type {
    AdminContentItemRpcRow,
    Json
} from "../../src/services/backend/database.types.js";

import type {
    AdminContentDraft
} from "../../src/features/admin/adminContentRepository.js";

const root = resolve(import.meta.dirname, "../..");

const completePayload = {
    catalog: {
        category: "base",
        estimatedTime: 15,
        exercises: 12,
        icon: "🦕",
        id: "A1-G-999",
        importance: 3,
        lessons: 1,
        level: "A1",
        module: "Fondations",
        prerequisites: ["A1-G-001"],
        recommended: true,
        title: "Carte catalogue",
        title_fa: "کارت"
    },
    document: {
        estimatedTime: 15,
        extension: { preserved: true },
        icon: "📘",
        id: "A1-G-999",
        level: "A1",
        sections: [{
            content: "Un contenu pédagogique suffisamment détaillé.",
            examples: [{ fa: "نمونه", fr: "Un exemple" }],
            id: "A1-G-999-1",
            table: {
                headers: ["Sujet", "Forme"],
                rows: [["je", "suis"]]
            },
            title: "Première partie",
            title_fa: "بخش اول",
            type: "lesson"
        }],
        title: "Titre de la leçon",
        title_fa: "عنوان درس"
    },
    exerciseSections: [{
        id: "A1-G-999-ex1",
        questions: [{
            correct: 1,
            editorExtension: "choice-metadata",
            explanation: "Parce que c’est la bonne forme.",
            options: ["suis", "es"],
            question: "Tu ___",
            type: "mcq"
        }, {
            correct: 0,
            options: ["Vrai", "Faux"],
            question: "Je suis est une forme du verbe être.",
            type: "binary"
        }, {
            correct: "suis",
            question: "Je ___",
            type: "fill_blank"
        }, {
            correct: ["Je", "suis", "ici"],
            editorExtension: "ordering-metadata",
            question: "Remettez la phrase en ordre.",
            type: "ordering",
            words: ["ici", "Je", "suis"]
        }],
        title: "S’entraîner",
        type: "exercise"
    }],
    privateExtension: "conservée"
} satisfies Json;

test("Grammar codec preserves deliberate catalog overrides and unknown extensions", () => {
    const editor = createEditor("A1-G-999", completePayload);
    const grammar = readAdminGrammarEditor(editor);
    const updated = updateAdminGrammarEditor(editor, grammar);
    const rebuilt = JSON.parse(updated.payloadText) as typeof completePayload;

    assert.equal(grammar.catalogTitleFr, "Carte catalogue");
    assert.equal(grammar.titleFr, "Titre de la leçon");
    assert.equal(grammar.catalogIcon, "🦕");
    assert.equal(grammar.icon, "📘");
    assert.deepEqual(rebuilt, completePayload);
    assert.equal(rebuilt.privateExtension, "conservée");
    assert.deepEqual(rebuilt.document.extension, { preserved: true });

    const reordered = {
        ...grammar,
        exercises: grammar.exercises.map(section => ({
            ...section,
            questions: [...section.questions].reverse()
        }))
    };
    const reorderedPayload = buildAdminGrammarPayload(reordered) as {
        exerciseSections: Array<{
            questions: Array<Record<string, Json>>;
        }>;
    };
    assert.equal(
        reorderedPayload.exerciseSections[0]?.questions[0]?.editorExtension,
        "ordering-metadata"
    );
    assert.equal(
        reorderedPayload.exerciseSections[0]?.questions[3]?.editorExtension,
        "choice-metadata"
    );
});

test("Grammar validation accepts every supported question format", () => {
    const grammar = readAdminGrammarEditor(createEditor("A1-G-999", completePayload));
    const issues = validateAdminGrammarEditor(grammar, [
        createItem("A1-G-001"),
        createItem("A1-G-999")
    ]);

    assert.deepEqual(issues, []);
    assert.equal(getAdminGrammarCompletion(issues), 100);
    assert.equal(createGrammarLessonPreview(grammar).sections.length, 2);
});

test("Grammar validation explains unsafe publication fields", () => {
    const grammar = readAdminGrammarEditor(createEditor("A1-G-999", completePayload));
    grammar.contentKey = "grammar libre";
    grammar.level = "C1";
    grammar.lessons[0]!.content = "court";
    grammar.lessons[0]!.table!.rows = [["incomplète"]];
    grammar.exercises[0]!.questions[3]!.correctOrder = ["autre"];
    grammar.prerequisites = ["missing", "missing"];

    const issues = validateAdminGrammarEditor(grammar, []);

    assert.ok(issues.some(issue => issue.field === "Identifiant"));
    assert.ok(issues.some(issue => issue.field === "Niveau"));
    assert.ok(issues.some(issue => issue.field.includes("tableau")));
    assert.ok(issues.some(issue => issue.message.includes("permutation exacte")));
    assert.ok(issues.some(issue => issue.field === "Prérequis"));
    assert.ok(getAdminGrammarCompletion(issues) < 100);
});

test("all legacy Grammar exports round-trip through the structured editor", async () => {
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
        const inventory = drafts.map(draft => createItem(draft.contentKey));

        assert.equal(drafts.length, 125);
        for (const draft of drafts) {
            const editor = createEditorFromDraft(draft);
            const grammar = readAdminGrammarEditor(editor);
            const errors = validateAdminGrammarEditor(grammar, inventory)
                .filter(issue => issue.severity === "error");

            assert.deepEqual(errors, [], `${draft.contentKey}: ${JSON.stringify(errors)}`);
            assert.deepEqual(
                buildAdminGrammarPayload(grammar),
                draft.payload,
                `${draft.contentKey} must round-trip without changing its source contract`
            );
        }
    } finally {
        globalThis.fetch = originalFetch;
    }
});

function createEditor(contentKey: string, payload: Json) {
    const object = payload as typeof completePayload;
    return {
        contentKey,
        contentType: "grammar_lesson" as const,
        level: "A1",
        payloadText: JSON.stringify(payload),
        schemaVersion: "2",
        sourcePath: "admin-panel",
        titleFa: object.catalog.title_fa,
        titleFr: object.catalog.title
    };
}

function createEditorFromDraft(draft: AdminContentDraft) {
    return {
        contentKey: draft.contentKey,
        contentType: draft.contentType,
        level: draft.level ?? "",
        payloadText: JSON.stringify(draft.payload),
        schemaVersion: String(draft.schemaVersion),
        sourcePath: draft.sourcePath ?? "admin-panel",
        titleFa: draft.titleFa ?? "",
        titleFr: draft.titleFr
    };
}

function createItem(contentKey: string): AdminContentItemRpcRow {
    return {
        archived_at: null,
        content_key: contentKey,
        content_type: "grammar_lesson",
        item_id: `${contentKey}-id`,
        latest_revision_number: 1,
        level: contentKey.slice(0, 2),
        published_at: "2026-09-15T10:00:00.000Z",
        published_revision_number: 1,
        revision_count: 1,
        title_fa: null,
        title_fr: contentKey,
        updated_at: "2026-09-15T10:00:00.000Z"
    };
}
