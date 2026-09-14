import assert from "node:assert/strict";
import test from "node:test";

import {
    buildAdminNewsPayload,
    createNewsArticlePreview,
    getAdminNewsCompletion,
    readAdminNewsEditor,
    updateAdminNewsEditor,
    validateAdminNewsEditor
} from "../../src/features/admin/adminNewsEditor.js";

import type {
    AdminContentItemRpcRow,
    Json
} from "../../src/services/backend/database.types.js";

import type {
    AdminNewsEditorValue
} from "../../src/features/admin/adminNewsEditor.js";

const news: AdminNewsEditorValue = {
    contentKey: "2026-w34-azadi-tower",
    fullText: "La tour Azadi raconte une histoire importante et documentée. ".repeat(3).trim(),
    grammar: [{
        example: "La tour a été construite en 1971.",
        explanation: "نمونه‌ای از گذشته مجهول",
        grammarId: "B1-G-PASSIVE-001",
        level: "B1",
        title: "La voix passive",
        translation: "برج در سال ۱۹۷۱ ساخته شد."
    }],
    image: "https://images.example.test/azadi.jpg",
    imageAlt: "La tour Azadi vue depuis la place",
    level: "B1-C1",
    publishedDate: "2026-08-22",
    simpleText: "La tour Azadi est un monument connu de Téhéran. ".repeat(2).trim(),
    sources: [{
        title: "Site officiel",
        url: "https://source.example.test/azadi"
    }],
    subtitleFa: "نماد تهران",
    subtitleFr: "Un monument entre histoire et modernité",
    titleFa: "برج آزادی",
    titleFr: "La tour Azadi",
    vocabulary: [{
        fa: "میراث",
        fr: "patrimoine",
        level: "B1",
        packId: "vocabulary-b1-patrimoine"
    }]
};

const availableItems: AdminContentItemRpcRow[] = [
    createItem("grammar_lesson", "B1-G-PASSIVE-001", "B1"),
    createItem("vocabulary_pack", "vocabulary-b1-patrimoine", "B1")
];

test(
    "structured News values produce the canonical catalog and document payload",
    () => {
        const payload = buildAdminNewsPayload(news) as {
            catalog: Record<string, Json>;
            document: {
                content: {
                    grammar: Array<Record<string, Json>>;
                    vocabulary: Array<Record<string, Json>>;
                };
                id: string;
                week: number;
                year: number;
            };
        };

        assert.equal(payload.catalog.id, news.contentKey);
        assert.equal(payload.catalog.week, 34);
        assert.equal(payload.catalog.year, 2026);
        assert.equal(payload.document.id, news.contentKey);
        assert.equal(
            payload.document.content.grammar[0]?.grammarId,
            "B1-G-PASSIVE-001"
        );
        assert.equal(
            payload.document.content.vocabulary[0]?.packId,
            "vocabulary-b1-patrimoine"
        );
    }
);

test(
    "the structured News editor round-trips server payloads without losing links",
    () => {
        const editor = {
            contentKey: news.contentKey,
            contentType: "news_article" as const,
            level: news.level,
            payloadText: JSON.stringify(buildAdminNewsPayload(news)),
            schemaVersion: "2",
            sourcePath: "admin-panel",
            titleFa: news.titleFa,
            titleFr: news.titleFr
        };
        const decoded = readAdminNewsEditor(editor);
        const updated = updateAdminNewsEditor(editor, decoded);

        assert.deepEqual(decoded, news);
        assert.equal(updated.titleFr, news.titleFr);
        assert.equal(updated.contentType, "news_article");
        assert.deepEqual(
            JSON.parse(updated.payloadText) as Json,
            buildAdminNewsPayload(news)
        );
    }
);

test(
    "publication validation accepts a complete article with published relations",
    () => {
        const issues = validateAdminNewsEditor(news, availableItems);

        assert.deepEqual(issues, []);
        assert.equal(getAdminNewsCompletion(issues), 100);
    }
);

test(
    "publication validation reports malformed fields and missing relations",
    () => {
        const issues = validateAdminNewsEditor({
            ...news,
            contentKey: "article libre",
            fullText: "Trop court",
            image: "http://insecure.example.test/image.jpg",
            level: "C1-A1",
            publishedDate: "2026-02-31",
            simpleText: "Court",
            sources: [{ title: "X", url: "not-a-url" }],
            vocabulary: [{
                ...news.vocabulary[0]!,
                packId: "missing-pack"
            }]
        }, availableItems);

        assert.ok(issues.some(issue => issue.field === "Identifiant"));
        assert.ok(issues.some(issue => issue.field === "Date de publication"));
        assert.ok(issues.some(issue => issue.field === "Image"));
        assert.ok(issues.some(issue =>
            issue.field === "Niveau"
            && issue.message.includes("plus simple")
        ));
        assert.ok(issues.some(issue => issue.field === "Texte complet"));
        assert.ok(issues.some(issue => issue.field === "Texte simplifié"));
        assert.ok(issues.some(issue => issue.field === "Source 1"));
        assert.ok(issues.some(issue =>
            issue.field === "Vocabulaire 1"
            && issue.message.includes("missing-pack")
        ));
        assert.ok(getAdminNewsCompletion(issues) < 100);
    }
);

test(
    "preview data keeps bilingual content and explicit learning links",
    () => {
        const preview = createNewsArticlePreview(news);

        assert.equal(preview.title, "La tour Azadi");
        assert.equal(preview.title_fa, "برج آزادی");
        assert.equal(preview.content.grammar?.[0]?.grammarId, "B1-G-PASSIVE-001");
        assert.equal(
            preview.content.vocabulary?.[0]?.packId,
            "vocabulary-b1-patrimoine"
        );
    }
);

function createItem(
    contentType: AdminContentItemRpcRow["content_type"],
    contentKey: string,
    level: string
): AdminContentItemRpcRow {
    return {
        archived_at: null,
        content_key: contentKey,
        content_type: contentType,
        item_id: `${contentType}-id`,
        latest_revision_number: 1,
        level,
        published_at: "2026-09-15T10:00:00.000Z",
        published_revision_number: 1,
        revision_count: 1,
        title_fa: null,
        title_fr: contentKey,
        updated_at: "2026-09-15T10:00:00.000Z"
    };
}
