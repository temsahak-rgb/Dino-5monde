import {
    readFile,
    writeFile
} from "node:fs/promises";
import {
    resolve
} from "node:path";

import type {
    GrammarLessonIndex,
    Level,
    NewsIndexItem,
    SearchIndex,
    SearchVocabWord,
    VocabPack,
    VocabPackIndex
} from "../src/types/global.js";

export {
    buildSearchIndex,
    writeSearchIndex
};

const searchLevels: Level[] = [
    "A1",
    "A2",
    "B1",
    "B2",
    "C1",
    "C2"
];

async function readJson<T>(
    path: string
): Promise<T> {
    return JSON.parse(
        await readFile(
            path,
            "utf8"
        )
    ) as T;
}

async function readOptionalJson<T>(
    path: string
): Promise<T | null> {
    try {
        return await readJson<T>(
            path
        );
    } catch (error) {
        if (
            error instanceof Error
            && "code" in error
            && error.code === "ENOENT"
        ) {
            return null;
        }

        throw error;
    }
}

async function buildVocabularyIndex(
    root: string
): Promise<SearchVocabWord[]> {
    const words:
        SearchVocabWord[] = [];

    for (
        const level
        of searchLevels
    ) {
        const catalog =
            await readOptionalJson<VocabPackIndex[]>(
                resolve(
                    root,
                    "data",
                    "vocabulary",
                    `vocab-${level}.json`
                )
            );

        if (!catalog) {
            continue;
        }

        for (
            const catalogPack
            of catalog
        ) {
            const pack =
                await readOptionalJson<VocabPack>(
                    resolve(
                        root,
                        "data",
                        "vocabulary",
                        level,
                        `${catalogPack.id}.json`
                    )
                );

            if (!pack) {
                continue;
            }

            if (!Array.isArray(pack.words)) {
                throw new Error(
                    `Vocabulary pack ${level}/${catalogPack.id} has no words array.`
                );
            }

            words.push(
                ...pack.words.map(
                    word => ({
                        fr: word.fr,
                        fa: word.fa,
                        ex: word.ex,
                        ex_fa: word.ex_fa,
                        level,
                        packId: catalogPack.id,
                        packTitle:
                            pack.title
                            ?? catalogPack.title,
                        packTitleFa:
                            pack.title_fa
                            ?? catalogPack.title_fa
                    })
                )
            );
        }
    }

    return words;
}

async function buildGrammarIndex(
    root: string
): Promise<GrammarLessonIndex[]> {
    const lessons:
        GrammarLessonIndex[] = [];

    for (
        const level
        of searchLevels
    ) {
        const levelLessons =
            await readOptionalJson<GrammarLessonIndex[]>(
                resolve(
                    root,
                    "data",
                    `grammar-${level}.json`
                )
            );

        if (levelLessons) {
            lessons.push(
                ...levelLessons
            );
        }
    }

    return lessons;
}

/**
 * Builds the browser-ready search index from the immutable source corpus.
 */
async function buildSearchIndex(
    root: string
): Promise<SearchIndex> {
    const [
        vocab,
        grammar,
        news
    ] = await Promise.all([
        buildVocabularyIndex(
            root
        ),
        buildGrammarIndex(
            root
        ),
        readOptionalJson<NewsIndexItem[]>(
            resolve(
                root,
                "data",
                "news",
                "news-index.json"
            )
        ).then(
            items => items ?? []
        )
    ]);

    return {
        version: 1,
        vocab,
        grammar,
        news
    };
}

/**
 * Writes the generated index into the build output without touching data/.
 */
async function writeSearchIndex(
    root: string,
    outputPath: string
): Promise<SearchIndex> {
    const index =
        await buildSearchIndex(
            root
        );

    await writeFile(
        outputPath,
        `${JSON.stringify(index)}\n`,
        "utf8"
    );

    return index;
}
