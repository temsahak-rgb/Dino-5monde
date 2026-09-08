import type {
    PracticeGameKind
} from "../../core/practiceRoutes.js";
import type {
    LearningGameActivityType
} from "../../services/backend/database.types.js";

const learningGameActivityTypes = {
    crossword:
        "crossword_game",
    hangman:
        "hangman_game",
    "word-search":
        "word_search_game"
} as const satisfies Record<
    PracticeGameKind,
    LearningGameActivityType
>;

function getLearningGameActivityType(
    game: PracticeGameKind
): LearningGameActivityType {
    return learningGameActivityTypes[game];
}

export {
    getLearningGameActivityType
};
