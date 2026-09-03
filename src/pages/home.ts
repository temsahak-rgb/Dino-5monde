import { getPlacementResult } from "../core/placementEngine.js";
import { renderNewsSection } from "../features/news/news.js";
import { app } from "../ui/ui.js";
import { renderHomeView } from "../ui/views/homeView.js";

export {
    showHome
};

/**
 * Application home-page controller.
 *
 * This file owns data loading and screen orchestration only.
 * HTML rendering is delegated to `src/ui/views/homeView.ts`.
 */

/**
 * Displays the personalized home page and current news highlight.
 */
async function showHome(): Promise<void> {
    const level = getPlacementResult() || "A1";
    const newsHtml = await renderNewsSection();

    app.innerHTML = renderHomeView(
        level,
        newsHtml
    );
}
