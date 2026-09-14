import {
    asContentJsonObject
} from "../../services/content/contentRepository.js";

import type {
    AdminContentItemRpcRow,
    AdminContentRevisionRpcRow,
    CanonicalContentType,
    Json
} from "../../services/backend/database.types.js";

import type {
    AdminContentDraft
} from "./adminContentRepository.js";

interface AdminContentEditorValue {
    contentKey: string;
    contentType: CanonicalContentType;
    level: string;
    payloadText: string;
    schemaVersion: string;
    sourcePath: string;
    titleFa: string;
    titleFr: string;
}

function createEmptyAdminContentEditor():
AdminContentEditorValue {
    const value: AdminContentEditorValue = {
        contentKey: "",
        contentType:
            "grammar_lesson",
        level: "A1",
        payloadText: "",
        schemaVersion: "2",
        sourcePath: "admin-panel",
        titleFa: "",
        titleFr: ""
    };

    return {
        ...value,
        payloadText: createAdminPayloadTemplate(value)
    };
}

function createAdminContentEditorFromRevision(
    item: AdminContentItemRpcRow,
    revision: AdminContentRevisionRpcRow
): AdminContentEditorValue {
    return {
        contentKey:
            item.content_key,
        contentType:
            item.content_type,
        level:
            revision.level
            ?? "",
        payloadText:
            JSON.stringify(
                revision.payload,
                null,
                2
            ),
        schemaVersion:
            String(
                revision.schema_version
            ),
        sourcePath:
            revision.source_path
            ?? "admin-panel",
        titleFa:
            revision.title_fa
            ?? "",
        titleFr:
            revision.title_fr
    };
}

function createAdminPayloadTemplate(
    value: AdminContentEditorValue
): string {
    const id =
        value.contentKey.trim();
    const title =
        value.titleFr.trim();
    const level =
        value.level.trim();

    const catalog: Record<
        string,
        Json
    > = {
        id,
        title
    };
    const document: Record<
        string,
        Json
    > = {
        id,
        sections: [],
        title
    };

    if (level) {
        catalog.level =
            level;
        document.level =
            level;
    }

    if (
        value.contentType
        === "grammar_lesson"
    ) {
        Object.assign(
            catalog,
            {
                estimatedTime: 10,
                exercises: 0,
                category: "base",
                icon: "📘",
                importance: 1,
                lessons: 1,
                module:
                    "Nouveau module",
                prerequisites: [],
                recommended: false
            }
        );
        Object.assign(
            document,
            {
                estimatedTime: 10,
                icon: "📘"
            }
        );
    }

    return JSON.stringify(
        {
            catalog,
            document,
            ...(
                value.contentType
                === "grammar_lesson"
                    ? {
                        exerciseSections: []
                    }
                    : {}
            )
        },
        null,
        2
    );
}

function parseAdminContentEditor(
    value: AdminContentEditorValue
): AdminContentDraft {
    let parsed:
        Json;

    try {
        parsed =
            JSON.parse(
                value.payloadText
            ) as Json;
    } catch (error) {
        throw new TypeError(
            "Le payload JSON n’est pas valide.",
            {
                cause:
                    error
            }
        );
    }

    asContentJsonObject(
        parsed,
        "admin payload"
    );

    return {
        contentKey:
            value.contentKey.trim(),
        contentType:
            value.contentType,
        level:
            value.level.trim()
            || null,
        payload:
            parsed,
        schemaVersion:
            Number(
                value.schemaVersion
            ),
        sourcePath:
            value.sourcePath.trim()
            || null,
        titleFa:
            value.titleFa.trim()
            || null,
        titleFr:
            value.titleFr.trim()
    };
}

export {
    createAdminContentEditorFromRevision,
    createAdminPayloadTemplate,
    createEmptyAdminContentEditor,
    parseAdminContentEditor
};

export type {
    AdminContentEditorValue
};
