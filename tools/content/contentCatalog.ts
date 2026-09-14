import {
    createHash
} from "node:crypto";
import {
    readFile
} from "node:fs/promises";
import {
    dirname,
    resolve
} from "node:path";
import {
    fileURLToPath
} from "node:url";

type CanonicalContentType =
    | "grammar_lesson"
    | "vocabulary_pack"
    | "travel_lesson"
    | "news_article";

interface CanonicalContentDocument {
    contentKey: string;
    contentType: CanonicalContentType;
    level: string | null;
    payload: {
        catalog: JsonObject;
        document: JsonObject;
        exerciseSections?: JsonObject[];
    };
    schemaVersion: number;
    sourcePath: string;
    titleFa: string | null;
    titleFr: string;
}

type JsonValue =
    | boolean
    | null
    | number
    | string
    | JsonValue[]
    | JsonObject;

interface JsonObject {
    [key: string]: JsonValue;
}

interface CatalogSource {
    contentType: CanonicalContentType;
    detailDirectory: string;
    indexPath: string;
    level: string | null;
}

const repositoryRoot = resolve(
    dirname(
        fileURLToPath(import.meta.url)
    ),
    "../.."
);

const catalogSources: readonly CatalogSource[] = [
    ...[
        "A1",
        "A2",
        "B1",
        "B2",
        "C1"
    ].map(
        level => ({
            contentType:
                "grammar_lesson" as const,
            detailDirectory:
                `data/lessons/${level}`,
            indexPath:
                `data/grammar-${level}.json`,
            level
        })
    ),
    ...[
        "A1",
        "A2",
        "B1",
        "B2",
        "C1",
        "C2"
    ].map(
        level => ({
            contentType:
                "vocabulary_pack" as const,
            detailDirectory:
                `data/vocabulary/${level}`,
            indexPath:
                `data/vocabulary/vocab-${level}.json`,
            level
        })
    ),
    {
        contentType: "travel_lesson",
        detailDirectory:
            "data/travel/lessons",
        indexPath:
            "data/travel/lessons.json",
        level: null
    },
    {
        contentType: "news_article",
        detailDirectory:
            "data/news",
        indexPath:
            "data/news/news-index.json",
        level: null
    }
];

async function loadCanonicalContentCatalog():
Promise<CanonicalContentDocument[]> {
    const documents = (
        await Promise.all(
            catalogSources.map(
                source =>
                    loadCatalogSource(source)
            )
        )
    ).flat();

    documents.sort(
        (left, right) =>
            `${left.contentType}:${left.contentKey}`
                .localeCompare(
                    `${right.contentType}:${right.contentKey}`
                )
    );

    const identities = documents.map(
        document =>
            `${document.contentType}:${document.contentKey}`
    );

    if (
        new Set(identities).size
        !== identities.length
    ) {
        throw new Error(
            "Canonical content identities must be unique"
        );
    }

    return documents;
}

async function loadCatalogSource(
    source: CatalogSource
): Promise<CanonicalContentDocument[]> {
    const index = await readJsonArray(
        source.indexPath
    );

    return Promise.all(
        index.map(
            async entry => {
                const contentKey =
                    requiredString(
                        entry.id,
                        `${source.indexPath}.id`
                    );
                const sourcePath =
                    `${source.detailDirectory}/${contentKey}.json`;
                const document =
                    await readJsonObject(
                        sourcePath
                    );
                const documentId =
                    requiredString(
                        document.id,
                        `${sourcePath}.id`
                    );

                if (documentId !== contentKey) {
                    throw new Error(
                        `${sourcePath}.id must match ${contentKey}`
                    );
                }

                const titleFr =
                    requiredString(
                        document.title
                        ?? entry.title,
                        `${sourcePath}.title`
                    );
                const titleFa =
                    optionalString(
                        document.title_fa
                        ?? entry.title_fa
                    );
                const level =
                    optionalString(
                        document.level
                        ?? entry.level
                        ?? source.level
                    );
                const exerciseSections =
                    source.contentType
                    === "grammar_lesson"
                        ? await loadGrammarExerciseSections(
                            source.level,
                            contentKey
                        )
                        : null;

                return {
                    contentKey,
                    contentType:
                        source.contentType,
                    level,
                    payload: {
                        catalog: entry,
                        document,
                        ...(exerciseSections
                            ? {
                                exerciseSections
                            }
                            : {})
                    },
                    schemaVersion:
                        source.contentType
                        === "grammar_lesson"
                            ? 2
                            : 1,
                    sourcePath,
                    titleFa,
                    titleFr
                };
            }
        )
    );
}

async function loadGrammarExerciseSections(
    level: string | null,
    lessonId: string
): Promise<JsonObject[]> {
    if (!level) {
        throw new Error(
            `Grammar lesson ${lessonId} requires a level`
        );
    }

    const sections: JsonObject[] = [];
    let exerciseNumber = 1;

    while (true) {
        const exercise =
            await readOptionalJsonObject(
                `data/exercises/${level}/${lessonId}-ex${exerciseNumber}.json`
            );

        if (!exercise) {
            break;
        }

        sections.push(exercise);
        exerciseNumber += 1;
    }

    const quiz =
        await readOptionalJsonObject(
            `data/exercises/${level}/${lessonId}-quiz.json`
        );

    if (quiz) {
        sections.push(quiz);
    }

    return sections;
}

async function readOptionalJsonObject(
    relativePath: string
): Promise<JsonObject | null> {
    try {
        return await readJsonObject(
            relativePath
        );
    } catch (error) {
        if (
            isFileNotFoundError(error)
        ) {
            return null;
        }

        throw error;
    }
}

function isFileNotFoundError(
    error: unknown
): error is NodeJS.ErrnoException {
    return (
        error instanceof Error
        && "code" in error
        && error.code === "ENOENT"
    );
}

function createContentCatalogDigest(
    documents:
        readonly CanonicalContentDocument[]
): string {
    return createHash("sha256")
        .update(
            stableStringify(documents)
        )
        .digest("hex");
}

function summarizeContentCatalog(
    documents:
        readonly CanonicalContentDocument[]
): Record<CanonicalContentType, number> {
    return {
        grammar_lesson:
            countType(
                documents,
                "grammar_lesson"
            ),
        news_article:
            countType(
                documents,
                "news_article"
            ),
        travel_lesson:
            countType(
                documents,
                "travel_lesson"
            ),
        vocabulary_pack:
            countType(
                documents,
                "vocabulary_pack"
            )
    };
}

function countType(
    documents:
        readonly CanonicalContentDocument[],
    contentType: CanonicalContentType
): number {
    return documents.filter(
        document =>
            document.contentType
            === contentType
    ).length;
}

async function readJsonArray(
    relativePath: string
): Promise<JsonObject[]> {
    const value = await readJson(
        relativePath
    );

    if (
        !Array.isArray(value)
        || value.some(
            entry => !isJsonObject(entry)
        )
    ) {
        throw new TypeError(
            `${relativePath} must contain an array of objects`
        );
    }

    return value as JsonObject[];
}

async function readJsonObject(
    relativePath: string
): Promise<JsonObject> {
    const value = await readJson(
        relativePath
    );

    if (!isJsonObject(value)) {
        throw new TypeError(
            `${relativePath} must contain an object`
        );
    }

    return value;
}

async function readJson(
    relativePath: string
): Promise<JsonValue> {
    const source = await readFile(
        resolve(
            repositoryRoot,
            relativePath
        ),
        "utf8"
    );

    return JSON.parse(source) as JsonValue;
}

function isJsonObject(
    value: JsonValue
): value is JsonObject {
    return (
        typeof value === "object"
        && value !== null
        && !Array.isArray(value)
    );
}

function requiredString(
    value: JsonValue | undefined,
    context: string
): string {
    const normalized =
        optionalString(value);

    if (!normalized) {
        throw new TypeError(
            `${context} must be a non-empty string`
        );
    }

    return normalized;
}

function optionalString(
    value: JsonValue | undefined
): string | null {
    if (
        value === null
        || value === undefined
    ) {
        return null;
    }

    if (typeof value !== "string") {
        throw new TypeError(
            "Expected an optional string"
        );
    }

    const normalized = value.trim();

    return normalized || null;
}

function stableStringify(
    value: unknown
): string {
    if (
        value === null
        || typeof value !== "object"
    ) {
        return JSON.stringify(value);
    }

    if (Array.isArray(value)) {
        return `[${value.map(
            item => stableStringify(item)
        ).join(",")}]`;
    }

    const record =
        value as Record<string, unknown>;

    return `{${Object.keys(record)
        .sort()
        .map(
            key =>
                `${JSON.stringify(key)}:${stableStringify(record[key])}`
        )
        .join(",")}}`;
}

export {
    catalogSources,
    createContentCatalogDigest,
    loadCanonicalContentCatalog,
    repositoryRoot,
    stableStringify,
    summarizeContentCatalog
};

export type {
    CanonicalContentDocument,
    CanonicalContentType,
    JsonObject,
    JsonValue
};
