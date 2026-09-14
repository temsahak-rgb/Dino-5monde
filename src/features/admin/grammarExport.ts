import {
    createStaticContentRepository
} from "../../services/content/staticContentRepository.js";

import type {
    GrammarLevel
} from "../../types/global.js";

import type {
    DinoBackendClient
} from "../../services/backend/supabaseClient.js";

import {
    saveAdminContentDraft
} from "./adminContentRepository.js";

import type {
    AdminContentDraft
} from "./adminContentRepository.js";

const grammarLevels: readonly GrammarLevel[] = [
    "A1",
    "A2",
    "B1",
    "B2",
    "C1"
];

async function loadGrammarExportDrafts():
Promise<AdminContentDraft[]> {
    const repository =
        createStaticContentRepository();
    const drafts:
        AdminContentDraft[] = [];

    for (
        const level
        of grammarLevels
    ) {
        const catalog =
            await repository.listCatalog(
                "grammar_lesson",
                level
            );

        for (
            const entry
            of catalog
        ) {
            const document =
                await repository.loadDocument(
                    "grammar_lesson",
                    entry.contentKey,
                    level
                );

            if (!document) {
                throw new Error(
                    `Missing exported document ${entry.contentKey}`
                );
            }

            drafts.push({
                contentKey:
                    entry.contentKey,
                contentType:
                    "grammar_lesson",
                level,
                payload: {
                    catalog:
                        document.catalog,
                    document:
                        document.document,
                    exerciseSections:
                        document.exerciseSections
                },
                schemaVersion: 2,
                sourcePath:
                    `data/lessons/${level}/${entry.contentKey}.json`,
                titleFa:
                    entry.titleFa,
                titleFr:
                    entry.titleFr
            });
        }
    }

    return drafts;
}

async function importAdminContentDrafts(
    client: DinoBackendClient,
    drafts:
        readonly AdminContentDraft[],
    onProgress?: (
        completed: number,
        total: number
    ) => void,
    concurrency = 4
): Promise<void> {
    if (
        !Number.isInteger(concurrency)
        || concurrency < 1
        || concurrency > 8
    ) {
        throw new TypeError(
            "Import concurrency must be between 1 and 8"
        );
    }

    let nextIndex = 0;
    let completed = 0;

    async function worker(): Promise<void> {
        while (
            nextIndex
            < drafts.length
        ) {
            const draftIndex =
                nextIndex;
            nextIndex += 1;

            await saveAdminContentDraft(
                client,
                drafts[
                    draftIndex
                ]
            );

            completed += 1;
            onProgress?.(
                completed,
                drafts.length
            );
        }
    }

    const workerCount =
        Math.min(
            concurrency,
            drafts.length
        );

    await Promise.all(
        Array.from(
            {
                length:
                    workerCount
            },
            () => worker()
        )
    );
}

export {
    grammarLevels,
    importAdminContentDrafts,
    loadGrammarExportDrafts
};
