import {
    ContentContractError,
    asContentJsonObject,
    asContentJsonObjectArray,
    assertContentIdentity
} from "../content/contentRepository.js";

import type {
    ContentCatalogEntry,
    ContentDocument,
    ContentJsonObject,
    ContentRepository
} from "../content/contentRepository.js";

import type {
    CanonicalContentType,
    PublishedContentCatalogRpcRow,
    PublishedContentRpcRow
} from "./database.types.js";

import type {
    DinoBackendClient
} from "./supabaseClient.js";

function createSupabaseContentRepository(
    client: DinoBackendClient
): ContentRepository {
    return {
        source: "server",

        listCatalog: async (
            contentType,
            level = null
        ) => loadSupabaseContentCatalog(
            client,
            contentType,
            level
        ),

        loadDocument: async (
            contentType,
            contentKey
        ) => loadSupabaseContentDocument(
            client,
            contentType,
            contentKey
        )
    };
}

async function loadSupabaseContentCatalog(
    client: DinoBackendClient,
    contentType: CanonicalContentType,
    level: string | null
): Promise<ContentCatalogEntry[]> {
    const {
        data,
        error
    } = await client.rpc(
        "get_published_content_catalog",
        {
            p_content_type:
                contentType,
            p_level:
                level
        }
    );

    if (error) {
        throw error;
    }

    return data.map(
        row => mapCatalogEntry(
            row,
            contentType
        )
    );
}

async function loadSupabaseContentDocument(
    client: DinoBackendClient,
    contentType: CanonicalContentType,
    contentKey: string
): Promise<ContentDocument | null> {
    assertContentIdentity(
        contentKey
    );

    const {
        data,
        error
    } = await client.rpc(
        "get_published_content",
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

    if (data.length === 0) {
        return null;
    }

    if (data.length !== 1) {
        throw new ContentContractError(
            `Server returned multiple revisions for ${contentType}:${contentKey}`
        );
    }

    return mapContentDocument(
        data[0],
        contentType,
        contentKey
    );
}

function mapCatalogEntry(
    row: PublishedContentCatalogRpcRow,
    expectedType: CanonicalContentType
): ContentCatalogEntry {
    if (
        row.content_type
        !== expectedType
    ) {
        throw new ContentContractError(
            `Unexpected content type ${row.content_type}`
        );
    }

    assertContentIdentity(
        row.content_key
    );

    const catalog =
        asContentJsonObject(
            row.catalog,
            `${row.content_type}:${row.content_key}.catalog`
        );

    assertPayloadIdentity(
        catalog,
        row.content_key,
        "catalog"
    );

    return {
        catalog,
        contentKey:
            row.content_key,
        contentType:
            row.content_type,
        level:
            row.level,
        publishedAt:
            row.published_at,
        revisionNumber:
            row.revision_number,
        schemaVersion:
            row.schema_version,
        titleFa:
            row.title_fa,
        titleFr:
            row.title_fr
    };
}

function mapContentDocument(
    row: PublishedContentRpcRow,
    expectedType: CanonicalContentType,
    expectedKey: string
): ContentDocument {
    if (
        row.content_type
            !== expectedType
        || row.content_key
            !== expectedKey
    ) {
        throw new ContentContractError(
            `Unexpected content identity ${row.content_type}:${row.content_key}`
        );
    }

    const payload =
        asContentJsonObject(
            row.payload,
            `${expectedType}:${expectedKey}.payload`
        );
    const catalog =
        asContentJsonObject(
            payload.catalog,
            `${expectedType}:${expectedKey}.catalog`
        );
    const document =
        asContentJsonObject(
            payload.document,
            `${expectedType}:${expectedKey}.document`
        );

    assertPayloadIdentity(
        catalog,
        expectedKey,
        "catalog"
    );
    assertPayloadIdentity(
        document,
        expectedKey,
        "document"
    );

    return {
        catalog,
        contentKey:
            row.content_key,
        contentType:
            row.content_type,
        document,
        exerciseSections:
            asContentJsonObjectArray(
                payload.exerciseSections,
                `${expectedType}:${expectedKey}.exerciseSections`
            ),
        level:
            row.level,
        publishedAt:
            row.published_at,
        revisionNumber:
            row.revision_number,
        schemaVersion:
            row.schema_version,
        titleFa:
            row.title_fa,
        titleFr:
            row.title_fr
    };
}

function assertPayloadIdentity(
    value: ContentJsonObject,
    expectedKey: string,
    context: string
): void {
    if (value.id !== expectedKey) {
        throw new ContentContractError(
            `${context}.id must match ${expectedKey}`
        );
    }
}

export {
    createSupabaseContentRepository,
    loadSupabaseContentCatalog,
    loadSupabaseContentDocument
};
