import type {
    Level
} from "../types/global.js";

/** Builds a durable path to one grammar lesson without depending on React. */
function createGrammarLessonPath(
    lessonId: string
): string {
    return `/grammar/lesson/${encodeContentId(lessonId)}`;
}

/** Builds a durable path to one vocabulary pack without depending on React. */
function createVocabularyPackPath(
    level: Level,
    packId: string
): string {
    return `/vocabulary/${level}/${encodeContentId(packId)}`;
}

function encodeContentId(
    value: string
): string {
    if (
        !value
        || value.length > 160
        || value.trim() !== value
        || value === "."
        || value === ".."
        || /[\\/\u0000-\u001f\u007f]/u.test(value)
    ) {
        throw new TypeError(
            `Invalid content identifier: ${JSON.stringify(value)}`
        );
    }

    return encodeURIComponent(value);
}

export {
    createGrammarLessonPath,
    createVocabularyPackPath
};
