import {
    getStaticDataUrl
} from "../../core/staticData.js";

import type {
    CanonicalContentType,
    Json
} from "../backend/database.types.js";

import {
    ContentContractError,
    asContentJsonObject,
    assertContentIdentity
} from "./contentRepository.js";

import type {
    ContentCatalogEntry,
    ContentDocument,
    ContentJsonObject,
    ContentRepository
} from "./contentRepository.js";

interface StaticCatalogSource {
    level: string | null;
    path: string;
}

const grammarLevels = [
    "A1",
    "A2",
    "B1",
    "B2",
    "C1"
] as const;

const vocabularyLevels = [
    ...grammarLevels,
    "C2"
] as const;

function createStaticContentRepository():
ContentRepository {
    const catalogCache =
        new Map<
            string,
            ContentCatalogEntry[]
        >();
    const documentCache =
        new Map<
            string,
            ContentDocument
        >();

    async function listCatalog(
        contentType:
            CanonicalContentType,
        level: string | null = null
    ): Promise<ContentCatalogEntry[]> {
        const cacheKey =
            `${contentType}:${level ?? "all"}`;
        const cached =
            catalogCache.get(
                cacheKey
            );

        if (cached) {
            return [...cached];
        }

        const sources =
            getStaticCatalogSources(
                contentType,
                level
            );
        const catalogs =
            await Promise.all(
                sources.map(
                    source =>
                        loadStaticCatalogSource(
                            contentType,
                            source
                        )
                )
            );
        const entries =
            catalogs.flat();

        catalogCache.set(
            cacheKey,
            entries
        );

        return [...entries];
    }

    async function loadDocument(
        contentType:
            CanonicalContentType,
        contentKey: string,
        levelHint: string | null = null
    ): Promise<ContentDocument | null> {
        assertContentIdentity(
            contentKey
        );

        const cacheKey =
            `${contentType}:${contentKey}`;
        const cached =
            documentCache.get(
                cacheKey
            );

        if (cached) {
            return cached;
        }

        const detailPath =
            getStaticDetailPath(
                contentType,
                contentKey,
                levelHint
            );
        const document =
            await loadOptionalStaticObject(
                detailPath
            );

        if (!document) {
            return null;
        }

        if (document.id !== contentKey) {
            throw new ContentContractError(
                `${detailPath}.id must match ${contentKey}`
            );
        }

        const catalogEntries =
            await listCatalog(
                contentType,
                levelHint
            );
        const catalogEntry =
            catalogEntries.find(
                entry =>
                    entry.contentKey
                    === contentKey
            );

        if (!catalogEntry) {
            throw new ContentContractError(
                `${contentType}:${contentKey} is missing from its catalog`
            );
        }

        const exerciseSections =
            contentType
            === "grammar_lesson"
                ? await loadStaticGrammarExercises(
                    levelHint,
                    contentKey
                )
                : [];
        const result: ContentDocument = {
            ...catalogEntry,
            document,
            exerciseSections
        };

        documentCache.set(
            cacheKey,
            result
        );

        return result;
    }

    return {
        listCatalog,
        loadDocument,
        source: "legacy-static"
    };
}

function getStaticCatalogSources(
    contentType: CanonicalContentType,
    level: string | null
): StaticCatalogSource[] {
    switch (contentType) {
        case "grammar_lesson":
            return filterLevelSources(
                grammarLevels.map(
                    grammarLevel => ({
                        level:
                            grammarLevel,
                        path:
                            `data/grammar-${grammarLevel}.json`
                    })
                ),
                level
            );

        case "vocabulary_pack":
            return filterLevelSources(
                vocabularyLevels.map(
                    vocabularyLevel => ({
                        level:
                            vocabularyLevel,
                        path:
                            `data/vocabulary/vocab-${vocabularyLevel}.json`
                    })
                ),
                level
            );

        case "travel_lesson":
            return filterLevelSources(
                [{
                    level: null,
                    path:
                        "data/travel/lessons.json"
                }],
                level
            );

        case "news_article":
            return filterLevelSources(
                [{
                    level: null,
                    path:
                        "data/news/news-index.json"
                }],
                level
            );
    }
}

function filterLevelSources(
    sources: StaticCatalogSource[],
    level: string | null
): StaticCatalogSource[] {
    if (!level) {
        return sources;
    }

    const exact = sources.filter(
        source =>
            source.level === level
    );

    if (exact.length === 0) {
        throw new TypeError(
            `Unsupported content level ${level}`
        );
    }

    return exact;
}

async function loadStaticCatalogSource(
    contentType: CanonicalContentType,
    source: StaticCatalogSource
): Promise<ContentCatalogEntry[]> {
    const response = await fetch(
        getStaticDataUrl(
            source.path
        ),
        {
            cache: "no-store"
        }
    );

    if (!response.ok) {
        throw new Error(
            `${source.path} failed with status ${response.status}`
        );
    }

    const payload =
        await response.json() as Json;

    if (!Array.isArray(payload)) {
        throw new ContentContractError(
            `${source.path} must contain an array`
        );
    }

    return payload.map(
        (value, index) => {
            const catalog =
                asContentJsonObject(
                    value,
                    `${source.path}[${index}]`
                );
            const contentKey =
                requiredString(
                    catalog.id,
                    `${source.path}[${index}].id`
                );
            const titleFr =
                requiredString(
                    catalog.title,
                    `${source.path}[${index}].title`
                );
            const level =
                optionalString(
                    catalog.level
                )
                ?? source.level;

            assertContentIdentity(
                contentKey
            );

            return {
                catalog,
                contentKey,
                contentType,
                level,
                publishedAt: null,
                revisionNumber: 0,
                schemaVersion:
                    contentType
                    === "grammar_lesson"
                        ? 2
                        : 1,
                titleFa:
                    optionalString(
                        catalog.title_fa
                    ),
                titleFr
            };
        }
    );
}

function getStaticDetailPath(
    contentType: CanonicalContentType,
    contentKey: string,
    level: string | null
): string {
    const encodedKey =
        encodeURIComponent(
            contentKey
        );

    switch (contentType) {
        case "grammar_lesson":
            return `data/lessons/${requireLevel(level)}/${encodedKey}.json`;

        case "vocabulary_pack":
            return `data/vocabulary/${requireLevel(level)}/${encodedKey}.json`;

        case "travel_lesson":
            return `data/travel/lessons/${encodedKey}.json`;

        case "news_article":
            return `data/news/${encodedKey}.json`;
    }
}

async function loadStaticGrammarExercises(
    level: string | null,
    lessonId: string
): Promise<ContentJsonObject[]> {
    const grammarLevel =
        requireLevel(level);
    const sections:
        ContentJsonObject[] = [];
    let exerciseNumber = 1;

    while (true) {
        const exercise =
            await loadOptionalStaticObject(
                `data/exercises/${grammarLevel}/${encodeURIComponent(
                    `${lessonId}-ex${exerciseNumber}`
                )}.json`
            );

        if (!exercise) {
            break;
        }

        sections.push(
            exercise
        );
        exerciseNumber += 1;
    }

    const quiz =
        await loadOptionalStaticObject(
            `data/exercises/${grammarLevel}/${encodeURIComponent(
                `${lessonId}-quiz`
            )}.json`
        );

    if (quiz) {
        sections.push(
            quiz
        );
    }

    return sections;
}

async function loadOptionalStaticObject(
    path: string
): Promise<ContentJsonObject | null> {
    const response = await fetch(
        getStaticDataUrl(path),
        {
            cache: "no-store"
        }
    );

    if (response.status === 404) {
        return null;
    }

    if (!response.ok) {
        throw new Error(
            `${path} failed with status ${response.status}`
        );
    }

    return asContentJsonObject(
        await response.json() as Json,
        path
    );
}

function requireLevel(
    level: string | null
): string {
    if (
        !level
        || !vocabularyLevels.includes(
            level as typeof vocabularyLevels[number]
        )
    ) {
        throw new TypeError(
            "A supported CEFR level is required"
        );
    }

    return level;
}

function requiredString(
    value: Json | undefined,
    context: string
): string {
    const normalized =
        optionalString(value);

    if (!normalized) {
        throw new ContentContractError(
            `${context} must be a non-empty string`
        );
    }

    return normalized;
}

function optionalString(
    value: Json | undefined
): string | null {
    if (
        value === null
        || value === undefined
    ) {
        return null;
    }

    if (typeof value !== "string") {
        throw new ContentContractError(
            "Expected an optional string"
        );
    }

    const normalized =
        value.trim();

    return normalized || null;
}

export {
    createStaticContentRepository,
    getStaticCatalogSources
};
