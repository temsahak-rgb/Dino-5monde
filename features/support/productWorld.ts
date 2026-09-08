import type {
    IWorld
} from "@cucumber/cucumber";

import type {
    AppRoute
} from "../../src/app/routes.js";
import type {
    VocabWord
} from "../../src/types/global.js";
import type {
    MistakeRecord
} from "../../src/types/global.js";
import type {
    LessonProgress
} from "../../src/types/global.js";
import type {
    MistakeReviewItem
} from "../../src/core/reviewEngine.js";
import type {
    ReviewSignal
} from "../../src/core/reviewSignalEngine.js";
import type {
    LessonProgressSnapshot
} from "../../src/core/progressEngine.js";
import type {
    LearningProgressOverview
} from "../../src/features/profile/learningProgressOverview.js";
import type {
    ExerciseAttemptSummary
} from "../../src/features/profile/exerciseAttemptSummary.js";
import type {
    DailyPracticeSummary
} from "../../src/features/profile/dailyPracticeSummary.js";
import type {
    ExerciseScoreReviewItem
} from "../../src/core/reviewEngine.js";
import type {
    ExerciseAttempt
} from "../../src/types/global.js";
import type {
    LearnerActivityReward
} from "../../src/services/backend/learningRewardRepository.js";

import type {
    LearnerProfileDraft
} from "../../src/services/backend/learnerProfileRepository.js";

interface ProductWorld extends IWorld {
    grammarLevels?: readonly string[];
    grammarLessonId?: string;
    grammarLevel?: string | null;
    destination?: AppRoute;
    publicPath?: string;
    resolvedDestination?: AppRoute | null;
    vocabularyWords?: VocabWord[];
    availableGames?: string[];
    reviewMistakes?: MistakeRecord[];
    reviewItems?: MistakeReviewItem[];
    authenticatedUserId?: string;
    email?: string;
    learnerProfile?: LearnerProfileDraft;
    displayedLearnerName?: string;
    shopAuthenticated?: boolean;
    shopCredits?: number;
    shopLessonId?: string;
    shopLessonPrice?: number;
    shopOwnedLessonIds?: string[];
    learningActivityId?: string;
    learningActivityComplete?: boolean;
    learningGameAttemptStarted?: boolean;
    learningRewardCredits?: number;
    learningRewardGranted?: boolean;
    learningRewardLedgerEntries?: number;
    learningRewardStatus?:
        | "awarded"
        | "incomplete";
    learningProgressRecords?: LessonProgressSnapshot[];
    learningProgressRewards?: LearnerActivityReward[];
    learningProgressOverview?: LearningProgressOverview;
    exerciseAttempt?: ExerciseAttempt;
    exerciseAttemptHistory?: ExerciseAttempt[];
    exerciseAttemptSummary?: ExerciseAttemptSummary;
    dailyPracticeSummary?: DailyPracticeSummary;
    exerciseScoreRecommendations?: ExerciseScoreReviewItem[];
    localLessonProgress?: LessonProgress;
    remoteLessonProgress?: LessonProgress;
    mergedLessonProgress?: LessonProgress;
    olderReviewSignal?: ReviewSignal;
    newerReviewSignal?: ReviewSignal;
    mergedReviewSignal?: ReviewSignal;
    shopPurchaseStatus?:
        | "already-owned"
        | "insufficient-credits"
        | "purchased"
        | "sign-in-required";
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
