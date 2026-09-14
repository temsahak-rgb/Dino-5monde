import {
    ContentContractError
} from "../../services/content/contentRepository.js";

import type {
    ContentDocument,
    ContentJsonObject,
    ContentRepository
} from "../../services/content/contentRepository.js";

import type {
    ExerciseSection,
    GrammarLessonIndex,
    GrammarLevel,
    LessonData,
    LessonSection
} from "../../types/global.js";

async function loadGrammarCatalog(
    repository: ContentRepository,
    level: GrammarLevel
): Promise<GrammarLessonIndex[]> {
    const entries =
        await repository.listCatalog(
            "grammar_lesson",
            level
        );

    return entries.map(
        entry => {
            if (entry.level !== level) {
                throw new ContentContractError(
                    `Grammar ${entry.contentKey} belongs to ${entry.level ?? "no level"}`
                );
            }

            return parseGrammarCatalogEntry(
                entry.catalog,
                entry.contentKey,
                level
            );
        }
    );
}

async function loadGrammarLesson(
    repository: ContentRepository,
    level: GrammarLevel,
    lessonId: string
): Promise<LessonData | null> {
    const content =
        await repository.loadDocument(
            "grammar_lesson",
            lessonId,
            level
        );

    if (!content) {
        return null;
    }

    return parseGrammarLesson(
        content,
        level,
        lessonId
    );
}

function parseGrammarCatalogEntry(
    catalog: ContentJsonObject,
    expectedId: string,
    expectedLevel: GrammarLevel
): GrammarLessonIndex {
    assertEqualString(
        catalog.id,
        expectedId,
        "grammar catalog id"
    );
    assertEqualString(
        catalog.level,
        expectedLevel,
        `${expectedId}.level`
    );
    assertRequiredString(
        catalog.module,
        `${expectedId}.module`
    );
    assertRequiredString(
        catalog.icon,
        `${expectedId}.icon`
    );
    assertRequiredString(
        catalog.title,
        `${expectedId}.title`
    );
    assertNonNegativeNumber(
        catalog.estimatedTime,
        `${expectedId}.estimatedTime`
    );
    assertNonNegativeNumber(
        catalog.exercises,
        `${expectedId}.exercises`
    );

    return catalog as unknown as
        GrammarLessonIndex;
}

function parseGrammarLesson(
    content: ContentDocument,
    expectedLevel: GrammarLevel,
    expectedId: string
): LessonData {
    if (
        content.level
        !== expectedLevel
    ) {
        throw new ContentContractError(
            `${expectedId} belongs to ${content.level ?? "no level"}`
        );
    }

    const document =
        content.document;

    assertEqualString(
        document.id,
        expectedId,
        "grammar lesson id"
    );
    assertRequiredString(
        document.title,
        `${expectedId}.title`
    );

    if (
        document.level !== undefined
        && document.level !== expectedLevel
    ) {
        throw new ContentContractError(
            `${expectedId}.level must be ${expectedLevel}`
        );
    }

    const lessonSections =
        parseLessonSections(
            document.sections,
            expectedId
        );
    const exerciseSections =
        content.exerciseSections.map(
            section =>
                parseExerciseSection(
                    section,
                    expectedId
                )
        );

    return {
        ...document,
        id: expectedId,
        level: expectedLevel,
        sections: [
            ...lessonSections,
            ...exerciseSections
        ],
        title:
            document.title
    } as LessonData;
}

function parseLessonSections(
    value: ContentJsonObject[string],
    lessonId: string
): LessonSection[] {
    if (!Array.isArray(value)) {
        throw new ContentContractError(
            `${lessonId}.sections must be an array`
        );
    }

    return value.map(
        (section, index) => {
            if (
                typeof section !== "object"
                || section === null
                || Array.isArray(section)
            ) {
                throw new ContentContractError(
                    `${lessonId}.sections[${index}] must be an object`
                );
            }

            assertRequiredString(
                section.id,
                `${lessonId}.sections[${index}].id`
            );
            assertRequiredString(
                section.title,
                `${lessonId}.sections[${index}].title`
            );

            if (
                section.type !== "lesson"
            ) {
                throw new ContentContractError(
                    `${lessonId}.sections[${index}] must be instructional content`
                );
            }

            return section as unknown as
                LessonSection;
        }
    );
}

function parseExerciseSection(
    section: ContentJsonObject,
    lessonId: string
): ExerciseSection {
    assertRequiredString(
        section.id,
        `${lessonId}.exercise.id`
    );
    assertRequiredString(
        section.title,
        `${lessonId}.exercise.title`
    );

    if (
        section.type !== "exercise"
        && section.type !== "quiz"
    ) {
        throw new ContentContractError(
            `${lessonId}.exercise.type is invalid`
        );
    }

    if (!Array.isArray(section.questions)) {
        throw new ContentContractError(
            `${lessonId}.exercise.questions must be an array`
        );
    }

    return section as unknown as
        ExerciseSection;
}

function assertRequiredString(
    value: ContentJsonObject[string],
    context: string
): asserts value is string {
    if (
        typeof value !== "string"
        || value.trim().length === 0
    ) {
        throw new ContentContractError(
            `${context} must be a non-empty string`
        );
    }
}

function assertEqualString(
    value: ContentJsonObject[string],
    expected: string,
    context: string
): void {
    if (value !== expected) {
        throw new ContentContractError(
            `${context} must be ${expected}`
        );
    }
}

function assertNonNegativeNumber(
    value: ContentJsonObject[string],
    context: string
): void {
    if (
        typeof value !== "number"
        || !Number.isFinite(value)
        || value < 0
    ) {
        throw new ContentContractError(
            `${context} must be a non-negative number`
        );
    }
}

export {
    loadGrammarCatalog,
    loadGrammarLesson,
    parseGrammarCatalogEntry,
    parseGrammarLesson
};
