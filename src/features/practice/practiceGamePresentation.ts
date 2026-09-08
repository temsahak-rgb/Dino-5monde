import type {
    PracticeGameKind
} from "../../core/practiceRoutes.js";

const practiceGamePresentations = {
    hangman: {
        icon: "🦖",
        titleKey: "vocab.game.hangman",
        descriptionKey: "vocab.game.hangmanMeta"
    },
    "word-search": {
        icon: "🔎",
        titleKey: "vocab.game.wordSearch",
        descriptionKey: "vocab.game.wordSearchMeta"
    },
    crossword: {
        icon: "✏️",
        titleKey: "vocab.game.crossword",
        descriptionKey: "vocab.game.crosswordMeta"
    }
} as const satisfies Record<
    PracticeGameKind,
    {
        icon: string;
        titleKey: string;
        descriptionKey: string;
    }
>;

function getPracticeGamePresentation(
    game: PracticeGameKind
) {
    return practiceGamePresentations[
        game
    ];
}

export {
    getPracticeGamePresentation,
    practiceGamePresentations
};
