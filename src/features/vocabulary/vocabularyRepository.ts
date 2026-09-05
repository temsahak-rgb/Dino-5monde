import {
    getStaticDataUrl
} from "../../core/staticData.js";

import type {
    Level,
    VocabPack,
    VocabPackIndex,
    VocabWeakMap
} from "../../types/global.js";

export {
    clearVocabularyCache,
    getWeakWords,
    loadVocabularyIndex,
    loadVocabularyPack,
    setWeakWord
};

/**
 * Vocabulary data access and local persistence.
 *
 * This module replaces the data-management responsibilities previously mixed
 * into `vocabulary.ts`.
 *
 * React components should not perform direct Vocabulary fetches or manipulate
 * the weak-word localStorage structure themselves.
 */

type VocabularyCacheEntry =
    | VocabPackIndex[]
    | VocabPack;

const vocabularyCache =
    new Map<
        string,
        VocabularyCacheEntry
    >();

const WEAK_WORDS_STORAGE_KEY =
    "dino_vocab_weak";

/* -------------------------------------------------------------------------- */
/* Vocabulary index                                                           */
/* -------------------------------------------------------------------------- */

/**
 * Loads and caches the vocabulary pack index for one CEFR level.
 *
 * Existing corpus contract:
 *
 * data/vocabulary/vocab-A1.json
 * data/vocabulary/vocab-A2.json
 * ...
 */
async function loadVocabularyIndex(
    level: Level
): Promise<VocabPackIndex[]> {
    const cacheKey =
        getIndexCacheKey(
            level
        );

    const cached =
        vocabularyCache.get(
            cacheKey
        );

    if (
        Array.isArray(
            cached
        )
    ) {
        return cached;
    }

    try {
        const response =
            await fetch(
                createFreshDataUrl(
                    `data/vocabulary/vocab-${level}.json`
                ),
                {
                    cache:
                        "no-store"
                }
            );

        if (!response.ok) {
            throw new Error(
                `HTTP ${response.status}`
            );
        }

        const packs =
            (
                await response.json()
            ) as VocabPackIndex[];

        vocabularyCache.set(
            cacheKey,
            packs
        );

        return packs;
    } catch (error) {
        console.warn(
            `Vocabulary index unavailable for ${level}:`,
            error
        );

        return [];
    }
}

/* -------------------------------------------------------------------------- */
/* Vocabulary packs                                                           */
/* -------------------------------------------------------------------------- */

/**
 * Loads and caches one complete vocabulary pack.
 *
 * Existing corpus contract:
 *
 * data/vocabulary/{level}/{packId}.json
 */
async function loadVocabularyPack(
    level: Level,
    packId: string
): Promise<VocabPack | null> {
    const cacheKey =
        getPackCacheKey(
            level,
            packId
        );

    const cached =
        vocabularyCache.get(
            cacheKey
        );

    if (
        cached
        && !Array.isArray(
            cached
        )
    ) {
        return cached;
    }

    try {
        const encodedPackId =
            encodeURIComponent(
                packId
            );

        const response =
            await fetch(
                createFreshDataUrl(
                    `data/vocabulary/${level}/${encodedPackId}.json`
                ),
                {
                    cache:
                        "no-store"
                }
            );

        if (!response.ok) {
            throw new Error(
                `HTTP ${response.status}`
            );
        }

        const rawPack =
            (
                await response.json()
            ) as VocabPack;

        /*
         * Historical pack files do not all need to repeat their parent CEFR
         * level. Keep the runtime contract explicit.
         */
        const pack: VocabPack = {
            ...rawPack,
            level
        };

        vocabularyCache.set(
            cacheKey,
            pack
        );

        return pack;
    } catch (error) {
        console.warn(
            `Vocabulary pack unavailable: ${level}/${packId}`,
            error
        );

        return null;
    }
}

/* -------------------------------------------------------------------------- */
/* Weak-word persistence                                                       */
/* -------------------------------------------------------------------------- */

/**
 * Returns the persisted French words currently marked as weak for a pack.
 *
 * A copy is returned so consumers cannot mutate storage-backed state
 * accidentally.
 */
function getWeakWords(
    packId: string
): string[] {
    const weakMap =
        readWeakWordMap();

    return [
        ...(
            weakMap[
                packId
            ]
            ?? []
        )
    ];
}

/**
 * Adds or removes one French word from the persisted weak-word collection.
 *
 * This intentionally preserves the historical storage schema:
 *
 * {
 *   "pack-id": ["mot", "autre mot"]
 * }
 */
function setWeakWord(
    packId: string,
    frenchWord: string,
    weak: boolean
): void {
    const weakMap =
        readWeakWordMap();

    const current =
        (
            weakMap[
                packId
            ]
            ?? []
        ).filter(
            word =>
                word
                !== frenchWord
        );

    weakMap[
        packId
    ] =
        weak
            ? [
                ...current,
                frenchWord
            ]
            : current;

    localStorage.setItem(
        WEAK_WORDS_STORAGE_KEY,
        JSON.stringify(
            weakMap
        )
    );
}

/**
 * Reads weak-word persistence defensively.
 *
 * A malformed localStorage value should not prevent the Vocabulary feature
 * from opening.
 */
function readWeakWordMap():
    VocabWeakMap {
    const raw =
        localStorage.getItem(
            WEAK_WORDS_STORAGE_KEY
        );

    if (!raw) {
        return {};
    }

    try {
        const parsed =
            JSON.parse(
                raw
            ) as unknown;

        if (
            !parsed
            || typeof parsed
                !== "object"
            || Array.isArray(
                parsed
            )
        ) {
            return {};
        }

        const safeMap:
            VocabWeakMap = {};

        for (
            const [
                packId,
                value
            ]
            of Object.entries(
                parsed
            )
        ) {
            if (
                !Array.isArray(
                    value
                )
            ) {
                continue;
            }

            safeMap[
                packId
            ] =
                value.filter(
                    (
                        word
                    ): word is string =>
                        typeof word
                            === "string"
                );
        }

        return safeMap;
    } catch {
        return {};
    }
}

/* -------------------------------------------------------------------------- */
/* Cache                                                                       */
/* -------------------------------------------------------------------------- */

/**
 * Clears the in-memory Vocabulary cache.
 *
 * Useful for tests, corpus refreshes and future developer tooling.
 * Persisted weak words are intentionally unaffected.
 */
function clearVocabularyCache():
    void {
    vocabularyCache.clear();
}

function getIndexCacheKey(
    level: Level
): string {
    return `index:${level}`;
}

function getPackCacheKey(
    level: Level,
    packId: string
): string {
    return (
        `pack:${level}:${packId}`
    );
}

/* -------------------------------------------------------------------------- */
/* Static URLs                                                                 */
/* -------------------------------------------------------------------------- */

/**
 * Keeps the previous cache-busting behavior while resolving data from the
 * application base rather than the active React Router URL.
 */
function createFreshDataUrl(
    path: string
): string {
    const url =
        new URL(
            getStaticDataUrl(
                path
            )
        );

    url.searchParams.set(
        "v",
        Date.now()
            .toString()
    );

    return url.href;
}