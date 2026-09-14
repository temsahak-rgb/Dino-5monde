import {
    ContentContractError,
    asContentJsonObject,
    assertContentIdentity
} from "../../services/content/contentRepository.js";

import type {
    AdminContentItemRpcRow,
    AdminContentRevisionRpcRow,
    CanonicalContentType,
    ImportContentRevisionRpcRow,
    Json
} from "../../services/backend/database.types.js";

import type {
    DinoBackendClient
} from "../../services/backend/supabaseClient.js";

interface AdminContentDraft {
    contentKey: string;
    contentType: CanonicalContentType;
    level: string | null;
    payload: Json;
    schemaVersion: number;
    sourcePath: string | null;
    titleFa: string | null;
    titleFr: string;
}

async function loadContentAdminStatus(
    client: DinoBackendClient
): Promise<boolean> {
    const {
        data,
        error
    } = await client.rpc(
        "get_content_admin_status",
        {}
    );

    if (error) {
        throw error;
    }

    if (data.length !== 1) {
        throw new ContentContractError(
            "Admin status response is invalid"
        );
    }

    return data[0].is_admin;
}

async function loadAdminContentItems(
    client: DinoBackendClient
): Promise<AdminContentItemRpcRow[]> {
    const {
        data,
        error
    } = await client.rpc(
        "admin_list_content_items",
        {}
    );

    if (error) {
        throw error;
    }

    return data;
}

async function loadAdminContentRevisions(
    client: DinoBackendClient,
    contentType: CanonicalContentType,
    contentKey: string
): Promise<AdminContentRevisionRpcRow[]> {
    assertContentIdentity(
        contentKey
    );

    const {
        data,
        error
    } = await client.rpc(
        "admin_get_content_revisions",
        {
            p_content_key:
                contentKey,
            p_content_type:
                contentType
        }
    );

    if (error) {
        throw error;
    }

    return data;
}

async function saveAdminContentDraft(
    client: DinoBackendClient,
    draft: AdminContentDraft
): Promise<ImportContentRevisionRpcRow> {
    validateAdminContentDraft(
        draft
    );

    const {
        data,
        error
    } = await client.rpc(
        "admin_import_content_draft",
        {
            p_content_key:
                draft.contentKey,
            p_content_type:
                draft.contentType,
            p_level:
                draft.level,
            p_payload:
                draft.payload,
            p_schema_version:
                draft.schemaVersion,
            p_source_path:
                draft.sourcePath,
            p_title_fa:
                draft.titleFa,
            p_title_fr:
                draft.titleFr
        }
    );

    if (error) {
        throw error;
    }

    if (data.length !== 1) {
        throw new ContentContractError(
            "Draft response is invalid"
        );
    }

    return data[0];
}

async function publishAdminContentRevision(
    client: DinoBackendClient,
    contentType: CanonicalContentType,
    contentKey: string,
    revisionNumber: number
): Promise<void> {
    assertContentIdentity(
        contentKey
    );

    if (
        !Number.isInteger(
            revisionNumber
        )
        || revisionNumber < 1
    ) {
        throw new TypeError(
            "A positive revision number is required"
        );
    }

    const {
        data,
        error
    } = await client.rpc(
        "admin_publish_content_revision",
        {
            p_content_key:
                contentKey,
            p_content_type:
                contentType,
            p_revision_number:
                revisionNumber
        }
    );

    if (error) {
        throw error;
    }

    if (data.length !== 1) {
        throw new ContentContractError(
            "Publication response is invalid"
        );
    }
}

async function publishLatestAdminContentBatch(
    client: DinoBackendClient,
    contentType: CanonicalContentType
): Promise<number> {
    const {
        data,
        error
    } = await client.rpc(
        "admin_publish_latest_content_batch",
        {
            p_content_type:
                contentType
        }
    );

    if (error) {
        throw error;
    }

    if (
        data.length !== 1
        || !Number.isInteger(
            data[0].published_count
        )
    ) {
        throw new ContentContractError(
            "Batch publication response is invalid"
        );
    }

    return data[0].published_count;
}

function validateAdminContentDraft(
    draft: AdminContentDraft
): void {
    assertContentIdentity(
        draft.contentKey
    );

    if (
        draft.titleFr.trim()
        !== draft.titleFr
        || draft.titleFr.length === 0
        || draft.titleFr.length > 200
    ) {
        throw new TypeError(
            "A normalized French title is required"
        );
    }

    if (
        !Number.isInteger(
            draft.schemaVersion
        )
        || draft.schemaVersion < 1
    ) {
        throw new TypeError(
            "A positive schema version is required"
        );
    }

    const payload =
        asContentJsonObject(
            draft.payload,
            "admin payload"
        );
    const catalog =
        asContentJsonObject(
            payload.catalog,
            "admin payload.catalog"
        );
    const document =
        asContentJsonObject(
            payload.document,
            "admin payload.document"
        );

    if (
        catalog.id
            !== draft.contentKey
        || document.id
            !== draft.contentKey
    ) {
        throw new ContentContractError(
            "Catalog and document ids must match the content key"
        );
    }
}

export {
    loadAdminContentItems,
    loadAdminContentRevisions,
    loadContentAdminStatus,
    publishAdminContentRevision,
    publishLatestAdminContentBatch,
    saveAdminContentDraft,
    validateAdminContentDraft
};

export type {
    AdminContentDraft
};
