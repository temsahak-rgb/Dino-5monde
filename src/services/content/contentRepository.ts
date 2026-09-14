import type {
    CanonicalContentType,
    Json
} from "../backend/database.types.js";

type ContentSource =
    | "server"
    | "legacy-static";

interface ContentJsonObject {
    [key: string]: Json | undefined;
}

interface ContentCatalogEntry {
    catalog: ContentJsonObject;
    contentKey: string;
    contentType: CanonicalContentType;
    level: string | null;
    publishedAt: string | null;
    revisionNumber: number;
    schemaVersion: number;
    titleFa: string | null;
    titleFr: string;
}

interface ContentDocument
    extends Omit<
        ContentCatalogEntry,
        "catalog"
    > {
    catalog: ContentJsonObject;
    document: ContentJsonObject;
    exerciseSections:
        ContentJsonObject[];
}

interface ContentRepository {
    readonly source: ContentSource;

    listCatalog:
        (
            contentType:
                CanonicalContentType,
            level?: string | null
        ) => Promise<ContentCatalogEntry[]>;

    loadDocument:
        (
            contentType:
                CanonicalContentType,
            contentKey: string,
            levelHint?: string | null
        ) => Promise<ContentDocument | null>;
}

class ContentContractError
    extends Error {
    constructor(
        message: string,
        options?: ErrorOptions
    ) {
        super(
            message,
            options
        );
        this.name =
            "ContentContractError";
    }
}

function assertContentIdentity(
    contentKey: string
): void {
    if (
        contentKey.length === 0
        || contentKey.length > 160
        || contentKey.trim()
            !== contentKey
        || contentKey === "."
        || contentKey === ".."
        || /[\\/\u0000-\u001f\u007f]/u.test(
            contentKey
        )
    ) {
        throw new TypeError(
            "Invalid content identity"
        );
    }
}

function asContentJsonObject(
    value: Json | undefined,
    context: string
): ContentJsonObject {
    if (
        typeof value !== "object"
        || value === null
        || Array.isArray(value)
    ) {
        throw new ContentContractError(
            `${context} must be a JSON object`
        );
    }

    return value;
}

function asContentJsonObjectArray(
    value: Json | undefined,
    context: string
): ContentJsonObject[] {
    if (value === undefined) {
        return [];
    }

    if (!Array.isArray(value)) {
        throw new ContentContractError(
            `${context} must be a JSON array`
        );
    }

    return value.map(
        (item, index) =>
            asContentJsonObject(
                item,
                `${context}[${index}]`
            )
    );
}

export {
    ContentContractError,
    asContentJsonObject,
    asContentJsonObjectArray,
    assertContentIdentity
};

export type {
    ContentCatalogEntry,
    ContentDocument,
    ContentJsonObject,
    ContentRepository,
    ContentSource
};
