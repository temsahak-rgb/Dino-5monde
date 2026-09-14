import { createStaticContentRepository } from "../../services/content/staticContentRepository.js";
import type { AdminContentDraft } from "./adminContentRepository.js";

const vocabularyExportLevels = ["A1", "A2", "B1", "B2", "C1", "C2"] as const;

async function loadVocabularyExportDrafts(): Promise<AdminContentDraft[]> {
    const repository = createStaticContentRepository();
    const drafts: AdminContentDraft[] = [];
    for (const level of vocabularyExportLevels) {
        const catalog = await repository.listCatalog("vocabulary_pack", level);
        for (const entry of catalog) {
            const document = await repository.loadDocument("vocabulary_pack", entry.contentKey, level);
            if (!document) throw new Error(`Missing exported document ${entry.contentKey}`);
            drafts.push({
                contentKey: entry.contentKey,
                contentType: "vocabulary_pack",
                level,
                payload: { catalog: document.catalog, document: document.document },
                schemaVersion: 1,
                sourcePath: `data/vocabulary/${level}/${entry.contentKey}.json`,
                titleFa: entry.titleFa,
                titleFr: entry.titleFr
            });
        }
    }
    return drafts;
}

export { loadVocabularyExportDrafts, vocabularyExportLevels };
