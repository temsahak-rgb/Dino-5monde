import type {
    MistakeRecord,
    VocabWeakMap
} from "../types/global.js";

interface ReviewCatalogItem {
    href: string;
    icon: string;
    id: string;
    title: string;
    titleFa?: string;
}

interface MistakeReviewItem
    extends ReviewCatalogItem {
    count: number;
    lastMistakeAt: string;
}

interface WeakWordReviewItem
    extends ReviewCatalogItem {
    words: readonly string[];
}

function buildMistakeReviewItems(
    mistakes: readonly MistakeRecord[],
    catalog: readonly ReviewCatalogItem[]
): MistakeReviewItem[] {
    const catalogById =
        new Map(
            catalog.map(item => [item.id, item])
        );

    const groups =
        new Map<string, MistakeReviewItem>();

    for (const mistake of mistakes) {
        if (
            !mistake
            || typeof mistake.lessonId !== "string"
            || typeof mistake.timestamp !== "string"
            || !Number.isFinite(
                Date.parse(mistake.timestamp)
            )
        ) {
            continue;
        }

        const source =
            catalogById.get(mistake.lessonId);

        if (!source) {
            continue;
        }

        const current =
            groups.get(mistake.lessonId);

        groups.set(
            mistake.lessonId,
            {
                ...source,
                count: (current?.count ?? 0) + 1,
                lastMistakeAt:
                    !current
                    || mistake.timestamp > current.lastMistakeAt
                        ? mistake.timestamp
                        : current.lastMistakeAt
            }
        );
    }

    return [...groups.values()].sort(
        (left, right) =>
            right.lastMistakeAt.localeCompare(
                left.lastMistakeAt
            )
    );
}

function buildWeakWordReviewItems(
    weakWords: VocabWeakMap,
    catalog: readonly ReviewCatalogItem[]
): WeakWordReviewItem[] {
    const catalogById =
        new Map(
            catalog.map(item => [item.id, item])
        );

    return Object.entries(weakWords)
        .flatMap(([packId, words]) => {
            const source =
                catalogById.get(packId);

            return source && words.length > 0
                ? [{
                    ...source,
                    words: [...new Set(words)]
                }]
                : [];
        })
        .sort(
            (left, right) =>
                right.words.length - left.words.length
        );
}

export {
    buildMistakeReviewItems,
    buildWeakWordReviewItems
};

export type {
    MistakeReviewItem,
    ReviewCatalogItem,
    WeakWordReviewItem
};
