/**
 * Controllers for application sections that are not implemented yet.
 *
 * These functions only select the appropriate translated title and delegate
 * presentation to `src/ui/views/miscView.ts`.
 */

/**
 * Displays the educational games placeholder.
 */
function showGamesPage(): void {
    app.innerHTML = renderPlaceholderView(
        "🎮",
        t("placeholder.games")
    );
}

/**
 * Displays the exercises placeholder.
 */
function showExercisesPage(): void {
    app.innerHTML = renderPlaceholderView(
        "📝",
        t("placeholder.exercises")
    );
}

/**
 * Displays the user profile placeholder.
 */
function showProfile(): void {
    app.innerHTML = renderPlaceholderView(
        "👤",
        t("placeholder.profile")
    );
}