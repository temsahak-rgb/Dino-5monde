import { loadPlacementQuestions } from "./src/core/placementEngine.js";
import { restoreRequestedRoute } from "./src/core/navigation.js";
import { initializeRouter } from "./src/core/router.js";
import { initializeNews } from "./src/features/news/news.js";
import { initializeInstitutionalNavigation } from "./src/features/institutional/institutional.js";
import {
    showLanguage,
    showPath
} from "./src/features/onboarding/onboarding.js";
import { initializePolls } from "./src/features/polls/polls.js";
import {
    applyDocumentLanguage,
    getI18nLanguage
} from "./src/i18n/i18n.js";
import type {
    Language,
    PathId
} from "./src/types/global.js";

/**
 * Browser application bootstrap.
 *
 * Responsibilities:
 * - restore the persisted interface language
 * - synchronize document language/direction
 * - initialize placement-test data
 * - restore the appropriate onboarding/application screen
 */

/**
 * Returns whether a persisted value is a supported interface language.
 *
 * @param value - Raw localStorage value.
 * @returns Whether the value is a valid application language.
 */
function isPersistedLanguage(
    value: string | null
): value is Language {
    return (
        value === "fr"
        || value === "fa"
    );
}

/**
 * Returns whether a persisted value is a shipped MVP learning path.
 */
function isPersistedPath(
    value: string | null
): value is PathId {
    return (
        value === "general"
        || value === "travel"
    );
}

/**
 * Restores the persisted user flow and initializes application data required
 * during onboarding.
 */
async function bootstrap(): Promise<void> {
    const savedLanguage =
        localStorage.getItem(
            "language"
        );

    const savedPath =
        localStorage.getItem(
            "currentPath"
        );

    const hasLanguage =
        isPersistedLanguage(
            savedLanguage
        );

    /*
     * Keep the document metadata synchronized before rendering any screen.
     * When no valid language exists yet, the i18n runtime falls back to French.
     */
    applyDocumentLanguage(
        hasLanguage
            ? savedLanguage
            : getI18nLanguage()
    );

    /*
     * Placement questions are loaded before onboarding becomes interactive,
     * avoiding a race where the learner could start the test before its data
     * is available.
     */
    await loadPlacementQuestions();

    if (
        hasLanguage
        && isPersistedPath(savedPath)
    ) {
        await restoreRequestedRoute();

        return;
    }

    /*
     * A language may already have been selected while the learning path was
     * never completed. Resume directly at the path selection instead of asking
     * for the language again.
     */
    if (hasLanguage) {
        showPath();
        return;
    }

    showLanguage();
}

initializeRouter();
initializeInstitutionalNavigation();
initializeNews();
initializePolls();

void bootstrap();
