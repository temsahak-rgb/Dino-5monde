import type {
    IWorld
} from "@cucumber/cucumber";

import type {
    AppRoute
} from "../../src/app/routes.js";
import type {
    VocabWord
} from "../../src/types/global.js";

interface ProductWorld extends IWorld {
    grammarLevels?: readonly string[];
    grammarLessonId?: string;
    grammarLevel?: string | null;
    destination?: AppRoute;
    publicPath?: string;
    resolvedDestination?: AppRoute | null;
    vocabularyWords?: VocabWord[];
    availableGames?: string[];
}

function splitList(
    value: string
): string[] {
    return value
        .split(",")
        .map(item => item.trim());
}

export {
    splitList
};

export type {
    ProductWorld
};
