import type { Json } from "../../services/backend/database.types.js";
import type { AdminContentEditorValue } from "./adminContentEditor.js";

type VocabularyLevel = "A1" | "A2" | "B1" | "B2" | "C1" | "C2";
type StorySlot = "simple" | "literary";

interface AdminVocabularyWordValue {
    difficulty: string;
    emoji: string;
    exampleFa: string;
    exampleFaKey: "ex_fa" | "exfa";
    exampleFr: string;
    fa: string;
    fr: string;
    image: string;
    originalPayload: Json | null;
}

interface AdminVocabularyBlankValue {
    correctIndex: string;
    id: string;
    options: string[];
    originalPayload: Json | null;
}

interface AdminVocabularyStoryValue {
    alias: "simple" | "easy" | "literary" | "hard";
    blanks: AdminVocabularyBlankValue[];
    inspiration: string;
    originalPayload: Json | null;
    textFa: string;
    textFr: string;
    titleFa: string;
    titleFr: string;
}

interface AdminVocabularyQuestionValue {
    correctIndex: string;
    correctKey: "correct" | "correctIndex";
    explanation: string;
    explanationFa: string;
    options: string[];
    originalPayload: Json | null;
    question: string;
    type: "mcq" | "binary";
}

interface AdminVocabularyQuizValue {
    displayCount: string;
    originalPayload: Json | null;
    questions: AdminVocabularyQuestionValue[];
    titleFa: string;
    titleFr: string;
}

interface AdminVocabularyEditorValue {
    assessmentKey: "quiz" | "exercise";
    catalogHasLevel: boolean;
    catalogIcon: string;
    catalogTitleFa: string;
    catalogTitleFr: string;
    contentKey: string;
    detailIcon: string;
    detailTitleFa: string;
    detailTitleFr: string;
    inspiration: string;
    level: string;
    literaryStory: AdminVocabularyStoryValue | null;
    originalPayload: Json | null;
    simpleStory: AdminVocabularyStoryValue | null;
    titleKey: "title" | "theme";
    words: AdminVocabularyWordValue[];
    quiz: AdminVocabularyQuizValue | null;
}

const vocabularyLevels = ["A1", "A2", "B1", "B2", "C1", "C2"] as const satisfies readonly VocabularyLevel[];

function readAdminVocabularyEditor(editor: AdminContentEditorValue): AdminVocabularyEditorValue {
    const payload = parseObject(editor.payloadText);
    const catalog = asObject(payload?.catalog);
    const document = asObject(payload?.document);
    const stories = asObject(document?.stories);
    const titleKey = document && ("theme" in document || "theme_fa" in document) ? "theme" : "title";
    const assessmentKey = document && "exercise" in document ? "exercise" : "quiz";

    return {
        assessmentKey,
        catalogHasLevel: catalog ? "level" in catalog : true,
        catalogIcon: stringValue(catalog?.icon),
        catalogTitleFa: stringValue(catalog?.title_fa, editor.titleFa),
        catalogTitleFr: stringValue(catalog?.title, editor.titleFr),
        contentKey: stringValue(document?.id, catalog?.id, editor.contentKey),
        detailIcon: stringValue(document?.icon),
        detailTitleFa: titleKey === "theme" ? stringValue(document?.theme_fa) : stringValue(document?.title_fa),
        detailTitleFr: titleKey === "theme" ? stringValue(document?.theme) : stringValue(document?.title),
        inspiration: stringValue(document?.inspiration),
        level: stringValue(document?.level, catalog?.level, editor.level),
        literaryStory: readStory(stories, "literary"),
        originalPayload: payload,
        quiz: readQuiz(document?.[assessmentKey]),
        simpleStory: readStory(stories, "simple"),
        titleKey,
        words: objectArray(document?.words).map(readWord)
    };
}

function updateAdminVocabularyEditor(editor: AdminContentEditorValue, vocabulary: AdminVocabularyEditorValue): AdminContentEditorValue {
    return {
        ...editor,
        contentKey: vocabulary.contentKey,
        contentType: "vocabulary_pack",
        level: vocabulary.level,
        payloadText: JSON.stringify(buildAdminVocabularyPayload(vocabulary), null, 2),
        schemaVersion: editor.contentType === "vocabulary_pack" ? editor.schemaVersion : "1",
        sourcePath: editor.sourcePath || "admin-panel",
        titleFa: vocabulary.catalogTitleFa,
        titleFr: vocabulary.catalogTitleFr
    };
}

function buildAdminVocabularyPayload(value: AdminVocabularyEditorValue): Json {
    const original = asObject(value.originalPayload ?? undefined);
    const originalCatalog = asObject(original?.catalog);
    const originalDocument = asObject(original?.document);
    const document: Record<string, Json | undefined> = {
        ...originalDocument,
        exercise: undefined,
        icon: optional(value.detailIcon),
        id: value.contentKey.trim(),
        inspiration: optional(value.inspiration),
        level: value.level.trim(),
        quiz: undefined,
        stories: buildStories(value),
        theme: undefined,
        theme_fa: undefined,
        title: undefined,
        title_fa: undefined,
        words: value.words.map(buildWord)
    };
    document[value.titleKey] = value.detailTitleFr.trim();
    document[`${value.titleKey}_fa`] = optional(value.detailTitleFa);
    document[value.assessmentKey] = value.quiz ? buildQuiz(value.quiz) : undefined;

    return compact({
        ...Object.fromEntries(Object.entries(original ?? {}).filter(([key]) => key !== "catalog" && key !== "document")),
        catalog: compact({
            ...originalCatalog,
            icon: optional(value.catalogIcon),
            id: value.contentKey.trim(),
            level: value.catalogHasLevel ? value.level.trim() : undefined,
            title: value.catalogTitleFr.trim(),
            title_fa: optional(value.catalogTitleFa),
            words: value.words.length
        }),
        document: compact(document)
    });
}

function buildWord(value: AdminVocabularyWordValue): Json {
    const original = asObject(value.originalPayload ?? undefined);
    return compact({
        ...original,
        difficulty: optionalNumber(value.difficulty),
        emoji: optionalKnown(original, "emoji", value.emoji),
        ex: optionalKnown(original, "ex", value.exampleFr),
        ex_fa: undefined,
        exfa: undefined,
        fa: value.fa.trim(),
        fr: value.fr.trim(),
        img: optional(value.image),
        [value.exampleFaKey]: optionalKnown(original, value.exampleFaKey, value.exampleFa)
    });
}

function buildStories(value: AdminVocabularyEditorValue): Json | undefined {
    const originalDocument = asObject(asObject(value.originalPayload ?? undefined)?.document);
    const originalStories = asObject(originalDocument?.stories);
    const result: Record<string, Json | undefined> = {
        ...originalStories,
        easy: undefined,
        hard: undefined,
        literary: undefined,
        simple: undefined
    };
    if (value.simpleStory) result[value.simpleStory.alias] = buildStory(value.simpleStory);
    if (value.literaryStory) result[value.literaryStory.alias] = buildStory(value.literaryStory);
    const compacted = compact(result);
    return Object.keys(compacted).length ? compacted : undefined;
}

function buildStory(value: AdminVocabularyStoryValue): Json {
    const original = asObject(value.originalPayload ?? undefined);
    return compact({
        ...original,
        blanks: value.blanks.length ? value.blanks.map(buildBlank) : undefined,
        inspiration: optionalKnown(original, "inspiration", value.inspiration),
        text: optionalKnown(original, "text", value.textFr),
        text_fa: optionalKnown(original, "text_fa", value.textFa),
        title: optionalKnown(original, "title", value.titleFr),
        title_fa: optionalKnown(original, "title_fa", value.titleFa)
    });
}

function buildBlank(value: AdminVocabularyBlankValue): Json {
    const index = parseInteger(value.correctIndex);
    const original = asObject(value.originalPayload ?? undefined);
    const originalOptions = stringArray(original?.options);
    const preserveAnswer = typeof original?.answer === "string"
        && numberString(original.correctIndex) === value.correctIndex
        && JSON.stringify(originalOptions) === JSON.stringify(value.options);
    return compact({
        ...original,
        answer: preserveAnswer ? original?.answer : index === null ? undefined : value.options[index],
        correctIndex: index ?? undefined,
        id: parseInteger(value.id) ?? undefined,
        options: [...value.options]
    });
}

function buildQuiz(value: AdminVocabularyQuizValue): Json {
    const original = asObject(value.originalPayload ?? undefined);
    return compact({
        ...original,
        displayCount: optionalNumber(value.displayCount),
        questions: value.questions.map(buildQuestion),
        title: optionalKnown(original, "title", value.titleFr),
        title_fa: optionalKnown(original, "title_fa", value.titleFa)
    });
}

function buildQuestion(value: AdminVocabularyQuestionValue): Json {
    const original = asObject(value.originalPayload ?? undefined);
    return compact({
        ...original,
        correct: undefined,
        correctIndex: undefined,
        explanation: optionalKnown(original, "explanation", value.explanation),
        explanation_fa: optionalKnown(original, "explanation_fa", value.explanationFa),
        options: [...value.options],
        question: value.question,
        type: value.type,
        [value.correctKey]: parseInteger(value.correctIndex) ?? undefined
    });
}

function readWord(word: Record<string, Json | undefined>): AdminVocabularyWordValue {
    return {
        difficulty: numberString(word.difficulty), emoji: stringValue(word.emoji),
        exampleFa: stringValue(word.ex_fa, word.exfa), exampleFaKey: typeof word.exfa === "string" && typeof word.ex_fa !== "string" ? "exfa" : "ex_fa", exampleFr: stringValue(word.ex),
        fa: stringValue(word.fa), fr: stringValue(word.fr), image: stringValue(word.img),
        originalPayload: compact(word)
    };
}

function readStory(stories: Record<string, Json | undefined> | null, slot: StorySlot): AdminVocabularyStoryValue | null {
    const aliases = slot === "simple" ? ["simple", "easy"] as const : ["literary", "hard"] as const;
    const alias = aliases.find(key => asObject(stories?.[key]) !== null);
    if (!alias) return null;
    const story = asObject(stories?.[alias]);
    if (!story) return null;
    return {
        alias, blanks: objectArray(story.blanks).map(blank => ({
            correctIndex: numberString(blank.correctIndex), id: numberString(blank.id),
            options: stringArray(blank.options), originalPayload: compact(blank)
        })),
        inspiration: stringValue(story.inspiration), originalPayload: compact(story),
        textFa: stringValue(story.text_fa), textFr: stringValue(story.text),
        titleFa: stringValue(story.title_fa), titleFr: stringValue(story.title)
    };
}

function readQuiz(input: Json | undefined): AdminVocabularyQuizValue | null {
    const quiz = asObject(input);
    if (!quiz) return null;
    return {
        displayCount: numberString(quiz.displayCount), originalPayload: compact(quiz),
        questions: objectArray(quiz.questions).map(question => ({
            correctIndex: numberString(question.correct ?? question.correctIndex),
            correctKey: typeof question.correct === "number" ? "correct" : "correctIndex",
            explanation: stringValue(question.explanation), explanationFa: stringValue(question.explanation_fa),
            options: stringArray(question.options), originalPayload: compact(question),
            question: stringValue(question.question), type: question.type === "binary" ? "binary" : "mcq"
        })),
        titleFa: stringValue(quiz.title_fa), titleFr: stringValue(quiz.title)
    };
}

function createEmptyVocabularyWord(): AdminVocabularyWordValue {
    return { difficulty: "1", emoji: "", exampleFa: "", exampleFaKey: "ex_fa", exampleFr: "", fa: "", fr: "", image: "", originalPayload: null };
}
function createEmptyVocabularyStory(slot: StorySlot): AdminVocabularyStoryValue {
    return { alias: slot, blanks: [], inspiration: "", originalPayload: null, textFa: "", textFr: "", titleFa: "", titleFr: "" };
}
function createEmptyVocabularyBlank(index: number): AdminVocabularyBlankValue {
    return { correctIndex: "0", id: String(index + 1), options: ["", ""], originalPayload: null };
}
function createEmptyVocabularyQuiz(): AdminVocabularyQuizValue {
    return { displayCount: "1", originalPayload: null, questions: [], titleFa: "", titleFr: "" };
}
function createEmptyVocabularyQuestion(): AdminVocabularyQuestionValue {
    return { correctIndex: "0", correctKey: "correctIndex", explanation: "", explanationFa: "", options: ["", ""], originalPayload: null, question: "", type: "mcq" };
}

function parseObject(value: string): Record<string, Json | undefined> | null { try { return asObject(JSON.parse(value) as Json); } catch { return null; } }
function asObject(value: Json | undefined): Record<string, Json | undefined> | null { return typeof value === "object" && value !== null && !Array.isArray(value) ? value : null; }
function objectArray(value: Json | undefined): Array<Record<string, Json | undefined>> { return Array.isArray(value) ? value.map(asObject).filter((item): item is Record<string, Json | undefined> => item !== null) : []; }
function stringArray(value: Json | undefined): string[] { return Array.isArray(value) ? value.filter((item): item is string => typeof item === "string") : []; }
function stringValue(...values: unknown[]): string { return values.find(value => typeof value === "string") as string | undefined ?? ""; }
function numberString(value: unknown): string { return typeof value === "number" && Number.isFinite(value) ? String(value) : ""; }
function optional(value: string): string | undefined { return value.trim() ? value : undefined; }
function optionalKnown(original: Record<string, Json | undefined> | null, key: string, value: string): string | undefined { return value.trim() || (original && key in original) ? value : undefined; }
function optionalNumber(value: string): number | undefined { return value.trim() ? Number(value) : undefined; }
function parseInteger(value: string): number | null { return /^\d+$/u.test(value.trim()) && Number.isSafeInteger(Number(value)) ? Number(value) : null; }
function compact(value: Record<string, Json | undefined>): Record<string, Json> { return Object.fromEntries(Object.entries(value).filter(([, item]) => item !== undefined)) as Record<string, Json>; }

export {
    buildAdminVocabularyPayload, createEmptyVocabularyBlank, createEmptyVocabularyQuestion,
    createEmptyVocabularyQuiz, createEmptyVocabularyStory, createEmptyVocabularyWord,
    readAdminVocabularyEditor, updateAdminVocabularyEditor, vocabularyLevels
};
export type {
    AdminVocabularyBlankValue, AdminVocabularyEditorValue, AdminVocabularyQuestionValue,
    AdminVocabularyQuizValue, AdminVocabularyStoryValue, AdminVocabularyWordValue
};
