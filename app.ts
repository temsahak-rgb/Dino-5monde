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
        && savedPath
    ) {
        await switchSection(
            "home"
        );

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

void bootstrap();