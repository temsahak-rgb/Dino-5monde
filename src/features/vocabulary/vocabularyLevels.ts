import type {
    Level
} from "../../types/global.js";

const vocabularyLevels:
    readonly Level[] = [
        "A1",
        "A2",
        "B1",
        "B2",
        "C1",
        "C2"
    ];

/**
 * Returns every CEFR level exposed by the Vocabulary feature.
 */
function getVocabularyLevels():
    readonly Level[] {
    return vocabularyLevels;
}

/**
 * Validates a Vocabulary CEFR value coming from a route, DOM state or stored
 * application state.
 */
function parseVocabularyLevel(
    value: string | undefined | null
): Level | null {
    switch (value) {
        case "A1":
        case "A2":
        case "B1":
        case "B2":
        case "C1":
        case "C2":
            return value;

        default:
            return null;
    }
}

export {
    getVocabularyLevels,
    parseVocabularyLevel
};