import type {
    Level
} from "../../types/global.js";

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
    parseVocabularyLevel
};
