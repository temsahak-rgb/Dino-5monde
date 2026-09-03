/**
 * Browser application bootstrap.
 */

/** Restores the persisted user flow and initializes placement-test data. */
async function bootstrap(): Promise<void> {
    const savedLanguage = localStorage.getItem("language");
    const savedPath = localStorage.getItem("currentPath");

    if (savedLanguage && savedPath) {
        await switchSection("home");
    } else {
        showLanguage();
    }

    await loadPlacementQuestions();
    console.log("✅ موتور آماده. سوالات:", getPlacementQuestions().length);
}

void bootstrap();
