import type {
    ReviewCatalogItem
} from "../../core/reviewEngine.js";
import type {
    LessonContentType,
    LessonProgressSnapshot
} from "../../core/progressEngine.js";

interface CompletedLessonArchiveItem
    extends ReviewCatalogItem {
    completedAt: string | null;
    contentType: LessonContentType;
}

/**
 * Resolves completed progress records against the current catalog so every
 * archive item owns a real title and a durable destination.
 */
function buildCompletedLessonArchive(
    progress:
        readonly LessonProgressSnapshot[],
    catalog:
        readonly ReviewCatalogItem[]
): CompletedLessonArchiveItem[] {
    const catalogById =
        new Map(
            catalog.map(
                item => [
                    item.id,
                    item
                ]
            )
        );
    const seen =
        new Set<string>();
    const completed:
        CompletedLessonArchiveItem[] = [];

    for (const record of progress) {
        const identity = [
            record.contentType,
            record.lessonId
        ].join(":");
        const source =
            catalogById.get(
                record.lessonId
            );

        if (
            record.progress.status
                !== "completed"
            || !source
            || seen.has(identity)
        ) {
            continue;
        }

        seen.add(identity);
        completed.push({
            ...source,
            completedAt:
                isValidTimestamp(
                    record.progress.lastAccessed
                )
                    ? record.progress.lastAccessed
                    : null,
            contentType:
                record.contentType
        });
    }

    return completed.sort(
        (left, right) =>
            (
                right.completedAt
                ?? ""
            ).localeCompare(
                left.completedAt
                ?? ""
            )
            || left.id.localeCompare(
                right.id
            )
    );
}

function isValidTimestamp(
    value: string | null
): value is string {
    return (
        typeof value === "string"
        && Number.isFinite(
            Date.parse(value)
        )
    );
}

export {
    buildCompletedLessonArchive
};

export type {
    CompletedLessonArchiveItem
};
