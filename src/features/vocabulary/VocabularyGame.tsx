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
}

/**
 * React entry point for Vocabulary mini-games.
 *
 * The game engines remain framework-independent. This component only routes
 * the selected activity to its React presentation/orchestration layer.
 */
function VocabularyGame({
    pack,
    game,
    onBack
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
                />
            );
    }
}

export {
    VocabularyGame
};
