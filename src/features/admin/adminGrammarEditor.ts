import type {
    Json
} from "../../services/backend/database.types.js";

import type {
    ExerciseQuestion,
    GrammarLevel,
    LessonData,
    LessonExample,
    LessonTable
} from "../../types/global.js";

import type {
    AdminContentEditorValue
} from "./adminContentEditor.js";

type AdminGrammarQuestionType =
    | "mcq"
    | "binary"
    | "fill_blank"
    | "ordering";

interface AdminGrammarTableValue {
    headers: string[];
    originalPayload: Json | null;
    rows: string[][];
}

interface AdminGrammarExampleValue {
    fa: string;
    fr: string;
    originalPayload: Json | null;
}

interface AdminGrammarLessonSectionValue {
    content: string;
    examples: AdminGrammarExampleValue[];
    id: string;
    note: string;
    noteFa: string;
    originalPayload: Json | null;
    table: AdminGrammarTableValue | null;
    table2: AdminGrammarTableValue | null;
    titleFa: string;
    titleFr: string;
}

interface AdminGrammarQuestionValue {
    answer: string;
    correctIndex: string;
    correctOrder: string[];
    explanation: string;
    explanationFa: string;
    options: string[];
    originalPayload: Json | null;
    question: string;
    type: AdminGrammarQuestionType;
    words: string[];
}

interface AdminGrammarExerciseSectionValue {
    displayCount: string;
    id: string;
    originalPayload: Json | null;
    questions: AdminGrammarQuestionValue[];
    titleFa: string;
    titleFr: string;
    type: "exercise" | "quiz";
}

interface AdminGrammarEditorValue {
    catalogEstimatedTime: string;
    catalogIcon: string;
    catalogTitleFa: string;
    catalogTitleFr: string;
    category: string;
    contentKey: string;
    estimatedTime: string;
    exerciseCount: string;
    exercises: AdminGrammarExerciseSectionValue[];
    icon: string;
    importance: string;
    lessonCount: string;
    lessons: AdminGrammarLessonSectionValue[];
    level: string;
    module: string;
    originalPayload: Json | null;
    prerequisites: string[];
    recommended: boolean;
    titleFa: string;
    titleFr: string;
}

const grammarLevels = [
    "A1",
    "A2",
    "B1",
    "B2",
    "C1"
] as const satisfies readonly GrammarLevel[];

function readAdminGrammarEditor(
    editor: AdminContentEditorValue
): AdminGrammarEditorValue {
    const payload = parseObject(editor.payloadText);
    const catalog = asObject(payload?.catalog);
    const document = asObject(payload?.document);

    return {
        catalogEstimatedTime: firstNumberString(catalog?.estimatedTime),
        catalogIcon: firstString(catalog?.icon),
        catalogTitleFa: firstString(catalog?.title_fa, editor.titleFa),
        catalogTitleFr: firstString(catalog?.title, editor.titleFr),
        category: firstString(catalog?.category),
        contentKey: firstString(document?.id, catalog?.id, editor.contentKey),
        estimatedTime: firstNumberString(document?.estimatedTime),
        exerciseCount: firstNumberString(catalog?.exercises),
        exercises: readExerciseSections(payload?.exerciseSections),
        icon: firstString(document?.icon),
        importance: firstNumberString(catalog?.importance),
        lessonCount: firstNumberString(catalog?.lessons),
        lessons: readLessonSections(document?.sections),
        level: firstString(document?.level, catalog?.level, editor.level),
        module: firstString(catalog?.module),
        originalPayload: payload,
        prerequisites: readStringArray(catalog?.prerequisites),
        recommended: catalog?.recommended === true,
        titleFa: firstString(document?.title_fa),
        titleFr: firstString(document?.title)
    };
}

function updateAdminGrammarEditor(
    editor: AdminContentEditorValue,
    grammar: AdminGrammarEditorValue
): AdminContentEditorValue {
    return {
        ...editor,
        contentKey: grammar.contentKey,
        contentType: "grammar_lesson",
        level: grammar.level,
        payloadText: JSON.stringify(buildAdminGrammarPayload(grammar), null, 2),
        sourcePath: editor.sourcePath || "admin-panel",
        titleFa: grammar.catalogTitleFa,
        titleFr: grammar.catalogTitleFr
    };
}

function buildAdminGrammarPayload(
    grammar: AdminGrammarEditorValue
): Json {
    const original = asObject(grammar.originalPayload ?? undefined);
    const originalCatalog = asObject(original?.catalog);
    const originalDocument = asObject(original?.document);
    return {
        catalog: compactJsonObject({
            ...originalCatalog,
            category: optionalString(grammar.category),
            estimatedTime: parseNumber(grammar.catalogEstimatedTime),
            exercises: parseNumber(grammar.exerciseCount),
            icon: grammar.catalogIcon.trim(),
            id: grammar.contentKey.trim(),
            importance: optionalNumber(grammar.importance),
            lessons: parseNumber(grammar.lessonCount),
            level: grammar.level.trim(),
            module: grammar.module.trim(),
            prerequisites: uniqueStrings(grammar.prerequisites),
            recommended: grammar.recommended,
            title: grammar.catalogTitleFr.trim(),
            title_fa: optionalString(grammar.catalogTitleFa)
        }),
        document: compactJsonObject({
            ...originalDocument,
            estimatedTime: parseNumber(grammar.estimatedTime),
            icon: grammar.icon.trim(),
            id: grammar.contentKey.trim(),
            level: grammar.level.trim(),
            sections: grammar.lessons.map(buildLessonSection),
            title: grammar.titleFr.trim(),
            title_fa: optionalString(grammar.titleFa)
        }),
        exerciseSections: grammar.exercises.map(buildExerciseSection),
        ...Object.fromEntries(
            Object.entries(original ?? {}).filter(([key]) =>
                key !== "catalog"
                && key !== "document"
                && key !== "exerciseSections"
            )
        )
    };
}

function createGrammarLessonPreview(
    grammar: AdminGrammarEditorValue
): LessonData {
    const level = grammarLevels.includes(grammar.level as GrammarLevel)
        ? grammar.level as GrammarLevel
        : undefined;

    return {
        estimatedTime: parseOptionalFiniteNumber(grammar.estimatedTime),
        icon: grammar.icon || undefined,
        id: grammar.contentKey || "nouvelle-lecon",
        level,
        sections: [
            ...grammar.lessons.map(section => ({
                content: section.content || undefined,
                examples: section.examples
                    .filter(example => example.fr.trim())
                    .map(toLessonExample),
                id: section.id || "nouvelle-section",
                note: section.note || undefined,
                note_fa: section.noteFa || undefined,
                table: section.table ? toLessonTable(section.table) : undefined,
                table2: section.table2 ? toLessonTable(section.table2) : undefined,
                title: section.titleFr || "Nouvelle section",
                title_fa: section.titleFa || undefined,
                type: "lesson" as const
            })),
            ...grammar.exercises.map(section => ({
                displayCount: parseOptionalFiniteNumber(section.displayCount),
                id: section.id || "nouvel-exercice",
                questions: section.questions.map(toExerciseQuestion),
                title: section.titleFr || "Nouvel exercice",
                title_fa: section.titleFa || undefined,
                type: section.type
            }))
        ],
        title: grammar.titleFr || "Nouvelle leçon de grammaire",
        title_fa: grammar.titleFa || undefined
    };
}

function createEmptyGrammarLessonSection(
    contentKey: string,
    index: number
): AdminGrammarLessonSectionValue {
    return {
        content: "",
        examples: [],
        id: contentKey ? `${contentKey}-${index}` : "",
        note: "",
        noteFa: "",
        originalPayload: null,
        table: null,
        table2: null,
        titleFa: "",
        titleFr: ""
    };
}

function createEmptyGrammarExerciseSection(
    contentKey: string,
    index: number,
    type: "exercise" | "quiz" = "exercise"
): AdminGrammarExerciseSectionValue {
    return {
        displayCount: "",
        id: contentKey
            ? type === "quiz"
                ? `${contentKey}-quiz`
                : `${contentKey}-ex${index}`
            : "",
        originalPayload: null,
        questions: [],
        titleFa: "",
        titleFr: "",
        type
    };
}

function createEmptyGrammarQuestion(): AdminGrammarQuestionValue {
    return {
        answer: "",
        correctIndex: "0",
        correctOrder: [],
        explanation: "",
        explanationFa: "",
        options: ["", ""],
        originalPayload: null,
        question: "",
        type: "mcq",
        words: []
    };
}

function createEmptyGrammarTable(): AdminGrammarTableValue {
    return {
        headers: [""],
        originalPayload: null,
        rows: [[""]]
    };
}

function buildLessonSection(
    section: AdminGrammarLessonSectionValue
): Json {
    const original = asObject(section.originalPayload ?? undefined);

    return compactJsonObject({
        ...original,
        content: optionalString(section.content),
        examples: section.examples.length
            ? section.examples.map(example => compactJsonObject({
                ...asObject(example.originalPayload ?? undefined),
                fa: optionalString(example.fa),
                fr: example.fr.trim()
            }))
            : undefined,
        id: section.id.trim(),
        note: optionalString(section.note),
        note_fa: optionalString(section.noteFa),
        table: section.table ? buildTable(section.table) : undefined,
        table2: section.table2 ? buildTable(section.table2) : undefined,
        title: section.titleFr.trim(),
        title_fa: optionalString(section.titleFa),
        type: "lesson"
    });
}

function buildExerciseSection(
    section: AdminGrammarExerciseSectionValue
): Json {
    const original = asObject(section.originalPayload ?? undefined);

    return compactJsonObject({
        ...original,
        displayCount: optionalNumber(section.displayCount),
        id: section.id.trim(),
        questions: section.questions.map(buildQuestion),
        title: section.titleFr.trim(),
        title_fa: optionalString(section.titleFa),
        type: section.type
    });
}

function buildQuestion(
    question: AdminGrammarQuestionValue
): Json {
    const original = asObject(question.originalPayload ?? undefined);
    const base: Record<string, Json | undefined> = {
        ...original,
        correct: undefined,
        explanation: optionalString(question.explanation),
        explanation_fa: optionalString(question.explanationFa),
        options: undefined,
        question: question.question.trim(),
        type: question.type,
        words: undefined
    };

    switch (question.type) {
        case "mcq":
        case "binary":
            return compactJsonObject({
                ...base,
                correct: parseNumber(question.correctIndex),
                options: question.options.map(value => value.trim())
            });
        case "fill_blank":
            return compactJsonObject({
                ...base,
                correct: question.answer.trim()
            });
        case "ordering":
            return compactJsonObject({
                ...base,
                correct: question.correctOrder.map(value => value.trim()),
                words: question.words.map(value => value.trim())
            });
    }
}

function buildTable(table: AdminGrammarTableValue): Json {
    return compactJsonObject({
        ...asObject(table.originalPayload ?? undefined),
        headers: table.headers.map(value => value.trim()),
        rows: table.rows.map(row => row.map(value => value.trim()))
    });
}

function readLessonSections(
    value: Json | undefined
): AdminGrammarLessonSectionValue[] {
    return readObjectArray(value)
        .filter(section => section.type === "lesson" || section.type === undefined)
        .map(section => ({
            content: firstString(section.content),
            examples: readExamples(section.examples),
            id: firstString(section.id),
            note: firstString(section.note),
            noteFa: firstString(section.note_fa),
            originalPayload: compactJsonObject(section),
            table: readTable(section.table),
            table2: readTable(section.table2),
            titleFa: firstString(section.title_fa),
            titleFr: firstString(section.title)
        }));
}

function readExerciseSections(
    value: Json | undefined
): AdminGrammarExerciseSectionValue[] {
    return readObjectArray(value).map(section => ({
        displayCount: firstNumberString(section.displayCount),
        id: firstString(section.id),
        originalPayload: compactJsonObject(section),
        questions: readObjectArray(section.questions).map(readQuestion),
        titleFa: firstString(section.title_fa),
        titleFr: firstString(section.title),
        type: section.type === "quiz" ? "quiz" : "exercise"
    }));
}

function readQuestion(
    question: Record<string, Json | undefined>
): AdminGrammarQuestionValue {
    const type = isQuestionType(question.type)
        ? question.type
        : "mcq";

    return {
        answer: typeof question.correct === "string" ? question.correct : "",
        correctIndex: typeof question.correct === "number"
            ? String(question.correct)
            : "0",
        correctOrder: readStringArray(question.correct),
        explanation: firstString(question.explanation),
        explanationFa: firstString(question.explanation_fa),
        options: readStringArray(question.options),
        originalPayload: compactJsonObject(question),
        question: firstString(question.question),
        type,
        words: readStringArray(question.words)
    };
}

function readExamples(value: Json | undefined): AdminGrammarExampleValue[] {
    return readObjectArray(value).map(example => ({
        fa: firstString(example.fa),
        fr: firstString(example.fr),
        originalPayload: compactJsonObject(example)
    }));
}

function readTable(value: Json | undefined): AdminGrammarTableValue | null {
    const table = asObject(value);

    return table
        ? {
            headers: readStringArray(table.headers),
            originalPayload: compactJsonObject(table),
            rows: Array.isArray(table.rows)
                ? table.rows.map(readStringArray)
                : []
        }
        : null;
}

function toLessonExample(value: AdminGrammarExampleValue): LessonExample {
    return {
        fa: value.fa || undefined,
        fr: value.fr
    };
}

function toLessonTable(value: AdminGrammarTableValue): LessonTable {
    return {
        headers: value.headers,
        rows: value.rows
    };
}

function toExerciseQuestion(value: AdminGrammarQuestionValue): ExerciseQuestion {
    const shared = {
        explanation: value.explanation || undefined,
        explanation_fa: value.explanationFa || undefined,
        question: value.question
    };

    switch (value.type) {
        case "mcq":
        case "binary":
            return {
                ...shared,
                correct: parseOptionalFiniteNumber(value.correctIndex) ?? 0,
                options: value.options,
                type: value.type
            };
        case "fill_blank":
            return {
                ...shared,
                correct: value.answer,
                type: value.type
            };
        case "ordering":
            return {
                ...shared,
                correct: value.correctOrder,
                type: value.type,
                words: value.words
            };
    }
}

function parseObject(value: string): Record<string, Json | undefined> | null {
    try {
        return asObject(JSON.parse(value) as Json);
    } catch {
        return null;
    }
}

function asObject(
    value: Json | undefined
): Record<string, Json | undefined> | null {
    return typeof value === "object"
        && value !== null
        && !Array.isArray(value)
        ? value
        : null;
}

function readObjectArray(
    value: Json | undefined
): Array<Record<string, Json | undefined>> {
    return Array.isArray(value)
        ? value.map(asObject).filter(
            (item): item is Record<string, Json | undefined> => item !== null
        )
        : [];
}

function readStringArray(value: Json | undefined): string[] {
    return Array.isArray(value)
        ? value.filter((item): item is string => typeof item === "string")
        : [];
}

function firstString(...values: unknown[]): string {
    return values.find(value => typeof value === "string") as string | undefined
        ?? "";
}

function firstNumberString(...values: unknown[]): string {
    const value = values.find(item =>
        typeof item === "number" && Number.isFinite(item)
    );

    return typeof value === "number" ? String(value) : "";
}

function parseNumber(value: string): number {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : 0;
}

function parseOptionalFiniteNumber(value: string): number | undefined {
    if (!value.trim()) {
        return undefined;
    }

    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : undefined;
}

function optionalNumber(value: string): number | undefined {
    return value.trim() ? parseNumber(value) : undefined;
}

function optionalString(value: string): string | undefined {
    return value.trim() || undefined;
}

function uniqueStrings(values: readonly string[]): string[] {
    return [...new Set(values.map(value => value.trim()).filter(Boolean))];
}

function compactJsonObject(
    value: Record<string, Json | undefined>
): Record<string, Json> {
    return Object.fromEntries(
        Object.entries(value).filter(([, item]) => item !== undefined)
    ) as Record<string, Json>;
}

function isQuestionType(value: Json | undefined): value is AdminGrammarQuestionType {
    return value === "mcq"
        || value === "binary"
        || value === "fill_blank"
        || value === "ordering";
}

export {
    buildAdminGrammarPayload,
    createEmptyGrammarExerciseSection,
    createEmptyGrammarLessonSection,
    createEmptyGrammarQuestion,
    createEmptyGrammarTable,
    createGrammarLessonPreview,
    grammarLevels,
    readAdminGrammarEditor,
    updateAdminGrammarEditor
};

export type {
    AdminGrammarEditorValue,
    AdminGrammarExampleValue,
    AdminGrammarExerciseSectionValue,
    AdminGrammarLessonSectionValue,
    AdminGrammarQuestionType,
    AdminGrammarQuestionValue,
    AdminGrammarTableValue
};
