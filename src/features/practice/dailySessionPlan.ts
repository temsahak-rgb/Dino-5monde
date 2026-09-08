import {
    findShopOffer
} from "../shop/shopOfferManifest.js";
import {
    buildExerciseScoreReviewItems,
    buildMistakeReviewItems,
    buildWeakWordReviewItems
} from "../../core/reviewEngine.js";
import type {
    ExerciseScoreReviewCatalogItem
} from "../../core/reviewEngine.js";
import type {
    ExerciseAttempt,
    Level,
    MistakeRecord,
    VocabWeakMap
} from "../../types/global.js";

const DAILY_SESSION_SIZE = 3;

type DailySessionReason =
    | "discovery"
    | "mistake"
    | "score"
    | "weak-word";

interface DailySessionTask
    extends ExerciseScoreReviewCatalogItem {
    detailCount?: number;
    percentage?: number;
    reason: DailySessionReason;
}

interface DailySessionPlanInput {
    attempts: readonly ExerciseAttempt[];
    catalog:
        readonly ExerciseScoreReviewCatalogItem[];
    dayKey: string;
    learnerLevel: Level;
    mistakes: readonly MistakeRecord[];
    weakWords: VocabWeakMap;
    limit?: number;
}

function createDailySessionPlan({
    attempts,
    catalog,
    dayKey,
    learnerLevel,
    mistakes,
    weakWords,
    limit = DAILY_SESSION_SIZE
}: DailySessionPlanInput): DailySessionTask[] {
    if (
        !/^\d{4}-\d{2}-\d{2}$/u.test(
            dayKey
        )
        || !Number.isInteger(limit)
        || limit < 1
        || limit > 12
    ) {
        throw new TypeError(
            "Invalid daily session inputs"
        );
    }

    const tasks: DailySessionTask[] = [];
    const selectedActivities =
        new Set<string>();
    const addTask = (
        task: DailySessionTask
    ): void => {
        const identity =
            createActivityIdentity(task);

        if (
            tasks.length >= limit
            || selectedActivities.has(
                identity
            )
        ) {
            return;
        }

        selectedActivities.add(identity);
        tasks.push(task);
    };

    for (
        const item
        of buildExerciseScoreReviewItems(
            attempts,
            catalog
        )
    ) {
        addTask({
            ...item,
            reason: "score"
        });
    }

    const lessonCatalog =
        catalog.filter(
            item =>
                item.contentType
                !== "vocabulary"
        );

    for (
        const item
        of buildMistakeReviewItems(
            mistakes,
            lessonCatalog
        )
    ) {
        const source =
            lessonCatalog.find(
                candidate =>
                    candidate.id
                    === item.id
            );

        if (source) {
            addTask({
                ...source,
                detailCount:
                    item.count,
                reason: "mistake"
            });
        }
    }

    const vocabularyCatalog =
        catalog
            .filter(
                item =>
                    item.contentType
                    === "vocabulary"
            )
            .map(item => ({
                ...item,
                href: `${item.href}/review`
            }));

    for (
        const item
        of buildWeakWordReviewItems(
            weakWords,
            vocabularyCatalog
        )
    ) {
        const source =
            vocabularyCatalog.find(
                candidate =>
                    candidate.href
                    === item.href
            );

        if (source) {
            addTask({
                ...source,
                detailCount:
                    item.words.length,
                reason: "weak-word"
            });
        }
    }

    if (tasks.length < limit) {
        for (
            const item
            of selectDailyDiscoveries(
                catalog,
                learnerLevel,
                dayKey
            )
        ) {
            addTask({
                ...item,
                reason: "discovery"
            });
        }
    }

    return tasks;
}

function selectDailyDiscoveries(
    catalog:
        readonly ExerciseScoreReviewCatalogItem[],
    learnerLevel: Level,
    dayKey: string
): ExerciseScoreReviewCatalogItem[] {
    const freeCatalog =
        catalog.filter(
            item => {
                if (
                    item.contentType
                    === "travel"
                ) {
                    return true;
                }

                return !findShopOffer(
                    item.contentType,
                    item.id,
                    item.level
                );
            }
        );
    const relevantCatalog =
        freeCatalog.filter(
            item =>
                matchesLearnerLevel(
                    item,
                    learnerLevel
                )
        );
    const source =
        relevantCatalog.length > 0
            ? relevantCatalog
            : freeCatalog;
    const seed =
        hashDayKey(dayKey);
    const contentTypes = [
        "grammar",
        "vocabulary",
        "travel"
    ] as const;
    const balanced =
        contentTypes.flatMap(
            (contentType, index) => {
                const candidates =
                    source.filter(
                        item =>
                            item.contentType
                            === contentType
                    );

                if (candidates.length === 0) {
                    return [];
                }

                return [
                    candidates[
                        (
                            seed
                            + index
                        )
                        % candidates.length
                    ]
                ];
            }
        ).filter(
            (
                item
            ): item is ExerciseScoreReviewCatalogItem =>
                Boolean(item)
        );
    const balancedIds =
        new Set(
            balanced.map(
                createActivityIdentity
            )
        );

    return [
        ...balanced,
        ...rotate(
            source.filter(
                item =>
                    !balancedIds.has(
                        createActivityIdentity(
                            item
                        )
                    )
            ),
            seed
        )
    ];
}

function matchesLearnerLevel(
    item: ExerciseScoreReviewCatalogItem,
    learnerLevel: Level
): boolean {
    switch (item.contentType) {
        case "grammar":
            return item.id.startsWith(
                `${
                    learnerLevel === "C2"
                        ? "C1"
                        : learnerLevel
                }-`
            );
        case "vocabulary":
            return item.level
                === learnerLevel;
        case "travel":
            return true;
    }
}

function rotate<T>(
    values: readonly T[],
    seed: number
): T[] {
    if (values.length === 0) {
        return [];
    }

    const offset =
        seed % values.length;

    return [
        ...values.slice(offset),
        ...values.slice(0, offset)
    ];
}

function hashDayKey(
    value: string
): number {
    return [...value].reduce(
        (hash, character) =>
            (
                hash * 31
                + character.charCodeAt(0)
            ) >>> 0,
        0
    );
}

function createActivityIdentity(
    item:
        Pick<
            ExerciseScoreReviewCatalogItem,
            "contentType" | "id" | "level"
        >
): string {
    return [
        item.contentType,
        item.level ?? "",
        item.id
    ].join(":");
}

export {
    DAILY_SESSION_SIZE,
    createDailySessionPlan
};

export type {
    DailySessionPlanInput,
    DailySessionReason,
    DailySessionTask
};
