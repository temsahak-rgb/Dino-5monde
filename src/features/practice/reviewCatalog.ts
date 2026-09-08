import {
    practiceLevels
} from "../../core/practiceRoutes.js";
import type {
    ExerciseScoreReviewCatalogItem,
    ReviewCatalogItem
} from "../../core/reviewEngine.js";
import type {
    Level
} from "../../types/global.js";
import {
    loadGrammar
} from "../grammar/grammarEngine.js";
import {
    getGrammarLevels
} from "../grammar/grammarLevels.js";
import {
    loadTravelIndex
} from "../travel/travelEngine.js";
import {
    loadVocabularyIndex
} from "../vocabulary/vocabularyRepository.js";

interface ReviewCatalogs {
    exercises: ExerciseScoreReviewCatalogItem[];
    lessons: ReviewCatalogItem[];
    vocabulary: ReviewCatalogItem[];
}

interface LevelledReviewCatalogItem
    extends ReviewCatalogItem {
    level: Level;
}

async function loadReviewCatalog():
    Promise<ReviewCatalogs> {
    const [
        grammarCatalogs,
        travelCatalog,
        vocabularyCatalogs
    ] = await Promise.all([
        Promise.all(
            getGrammarLevels().map(
                level => loadGrammar(level)
            )
        ),
        loadTravelIndex(),
        Promise.all(
            practiceLevels.map(
                level =>
                    loadVocabularyIndex(level)
            )
        )
    ]);
    const grammar =
        grammarCatalogs
            .flat()
            .map(lesson => ({
                href:
                    `/grammar/lesson/${encodeURIComponent(
                        lesson.id
                    )}`,
                icon: lesson.icon || "📐",
                id: lesson.id,
                title: lesson.title,
                titleFa: lesson.title_fa
            }));
    const travel =
        travelCatalog.map(lesson => ({
            href:
                `/travel/${encodeURIComponent(
                    lesson.id
                )}`,
            icon: lesson.icon || "✈️",
            id: lesson.id,
            title: lesson.title,
            titleFa: lesson.title_fa
        }));
    const vocabulary =
        vocabularyCatalogs.flatMap(
            (packs, index) => {
                const level =
                    practiceLevels[index];

                return level
                    ? packs.map(pack => ({
                        href:
                            `/vocabulary/${level}/${encodeURIComponent(
                                pack.id
                            )}`,
                        icon:
                            pack.icon
                            || "📖",
                        id: pack.id,
                        level,
                        title: pack.title,
                        titleFa:
                            pack.title_fa
                    }))
                    : [];
            }
        );

    return {
        exercises: [
            ...withContentType(
                grammar,
                "grammar"
            ),
            ...withContentType(
                travel,
                "travel"
            ),
            ...withContentType(
                vocabulary,
                "vocabulary"
            )
        ],
        lessons: [
            ...grammar,
            ...travel
        ],
        vocabulary:
            vocabulary.map(item => ({
                ...item,
                href: `${item.href}/review`
            }))
    };
}

function withContentType(
    items:
        readonly (
            ReviewCatalogItem
            | LevelledReviewCatalogItem
        )[],
    contentType:
        ExerciseScoreReviewCatalogItem["contentType"]
): ExerciseScoreReviewCatalogItem[] {
    return items.map(item => ({
        ...item,
        contentType
    }));
}

export {
    loadReviewCatalog
};

export type {
    ReviewCatalogs
};
