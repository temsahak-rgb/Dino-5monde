import type { GrammarLevel } from "../../types/global.js";

export {
    getGrammarLevelFromLessonId,
    getGrammarLevels
};

const grammarLevels:
    readonly GrammarLevel[] = [
        "A1",
        "A2",
        "B1",
        "B2",
        "C1"
    ];

/** Returns the CEFR levels currently exposed by the Grammar catalog. */
function getGrammarLevels(): readonly GrammarLevel[] {
    return grammarLevels;
}

/**
 * Derives the owning CEFR level from a grammar lesson identifier.
 *
 * @param lessonId - Identifier such as `B1-G-004`.
 * @returns Supported Grammar level or null for an invalid identifier.
 */
function getGrammarLevelFromLessonId(
    lessonId: string
): GrammarLevel | null {
    const match =
        /^(A1|A2|B1|B2|C1)-G-/.exec(
            lessonId
        );

    return match
        ? match[1] as GrammarLevel
        : null;
}
