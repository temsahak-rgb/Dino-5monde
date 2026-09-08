import type {
    VocabPack
} from "../../types/global.js";

import {
    VocabularyCrossword
} from "./VocabularyCrossword.js";

import {
    VocabularyHangman
} from "./VocabularyHangman.js";

import type {
    VocabularyGameKind
} from "./vocabularyGameEngine.js";

import {
    VocabularyWordSearch
} from "./VocabularyWordSearch.js";

interface VocabularyGameProps {
    pack: VocabPack;
    game:
        VocabularyGameKind;
    onBack: () => void;
    onComplete?: () => void;
}

const ignoreCompletion =
    (): void => undefined;

/**
 * React entry point for Vocabulary mini-games.
 *
 * The game engines remain framework-independent. This component only routes
 * the selected activity to its React presentation/orchestration layer.
 */
function VocabularyGame({
    pack,
    game,
    onBack,
    onComplete = ignoreCompletion
}: VocabularyGameProps) {
    switch (game) {
        case "hangman":
            return (
                <VocabularyHangman
                    pack={
                        pack
                    }
                    onBack={
                        onBack
                    }
                    onComplete={
                        onComplete
                    }
                />
            );

        case "word-search":
            return (
                <VocabularyWordSearch
                    pack={
                        pack
                    }
                    onBack={
                        onBack
                    }
                    onComplete={
                        onComplete
                    }
                />
            );

        case "crossword":
            return (
                <VocabularyCrossword
                    pack={
                        pack
                    }
                    onBack={
                        onBack
                    }
                    onComplete={
                        onComplete
                    }
                />
            );
    }
}

export {
    VocabularyGame
};
