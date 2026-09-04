import assert from "node:assert/strict";
import {
    mkdir,
    mkdtemp,
    rm,
    writeFile
} from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";

import {
    buildSearchIndex
} from "../../tools/build-search-index.js";

async function writeJson(
    path: string,
    value: unknown
): Promise<void> {
    await writeFile(
        path,
        JSON.stringify(
            value
        ),
        "utf8"
    );
}

test(
    "buildSearchIndex flattens existing corpus files without changing them",
    async () => {
        const root =
            await mkdtemp(
                join(
                    tmpdir(),
                    "dino-search-index-"
                )
            );

        try {
            const vocabularyRoot =
                join(
                    root,
                    "data",
                    "vocabulary"
                );
            const levelRoot =
                join(
                    vocabularyRoot,
                    "A1"
                );
            const newsRoot =
                join(
                    root,
                    "data",
                    "news"
                );

            await Promise.all([
                mkdir(
                    levelRoot,
                    {
                        recursive: true
                    }
                ),
                mkdir(
                    newsRoot,
                    {
                        recursive: true
                    }
                )
            ]);

            await Promise.all([
                writeJson(
                    join(
                        vocabularyRoot,
                        "vocab-A1.json"
                    ),
                    [
                        {
                            id: "school",
                            title: "École",
                            title_fa: "مدرسه",
                            words: 1
                        }
                    ]
                ),
                writeJson(
                    join(
                        levelRoot,
                        "school.json"
                    ),
                    {
                        id: "school",
                        words: [
                            {
                                fr: "livre",
                                fa: "کتاب"
                            }
                        ]
                    }
                ),
                writeJson(
                    join(
                        root,
                        "data",
                        "grammar-A1.json"
                    ),
                    [
                        {
                            id: "A1-G-001",
                            level: "A1",
                            module: "Base",
                            icon: "📚",
                            title: "Être",
                            estimatedTime: 5,
                            exercises: 2
                        }
                    ]
                ),
                writeJson(
                    join(
                        newsRoot,
                        "news-index.json"
                    ),
                    [
                        {
                            id: "demo",
                            title: "Paris",
                            image: "paris.jpg",
                            level: "A1",
                            publishedDate: "2026-09-01"
                        }
                    ]
                )
            ]);

            const index =
                await buildSearchIndex(
                    root
                );

            assert.equal(
                index.version,
                1
            );
            assert.deepEqual(
                index.vocab,
                [
                    {
                        fr: "livre",
                        fa: "کتاب",
                        ex: undefined,
                        ex_fa: undefined,
                        level: "A1",
                        packId: "school",
                        packTitle: "École",
                        packTitleFa: "مدرسه"
                    }
                ]
            );
            assert.equal(
                index.grammar.length,
                1
            );
            assert.equal(
                index.news.length,
                1
            );
        } finally {
            await rm(
                root,
                {
                    recursive: true,
                    force: true
                }
            );
        }
    }
);
