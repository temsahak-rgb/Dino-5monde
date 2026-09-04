import {
    getRouteSection,
    type AppRoute
} from "./routeEngine.js";
import {
    showGrammarLesson,
    showGrammarLevel,
    showGrammarPage
} from "../features/grammar/grammar.js";
import {
    setInstitutionalActivePage,
    showInstitutionalPage
} from "../features/institutional/institutional.js";
import {
    showJournalPage,
    showNewsDetail
} from "../features/news/news.js";
import {
    showTravelLesson,
    showTravelPage
} from "../features/travel/travel.js";
import {
    showVocabLevel,
    showVocabPack,
    showVocabularyPage
} from "../features/vocabulary/vocabulary.js";
import { showHome } from "../pages/home.js";
import { app } from "../ui/ui.js";

export {
    presentRoute
};

/** Renders a durable route while feature-local interactions remain ephemeral. */
async function renderRoute(
    route: AppRoute
): Promise<void> {
    const section = getRouteSection(route);

    if (section) {
        localStorage.setItem(
            "currentSection",
            section
        );
    }

    setInstitutionalActivePage(
        route.view === "info"
            ? route.page
            : null
    );

    switch (route.view) {
        case "home":
            await showHome();
            break;

        case "grammar":
            if (route.target === "index") {
                await showGrammarPage();
            } else if (route.target === "level") {
                await showGrammarLevel(route.level);
            } else {
                await showGrammarLesson(route.lessonId);
            }
            break;

        case "vocabulary":
            if (route.target === "index") {
                await showVocabularyPage();
            } else if (route.target === "level") {
                await showVocabLevel(route.level);
            } else {
                await showVocabPack(
                    route.level,
                    route.packId
                );
            }
            break;

        case "travel":
            if (route.target === "index") {
                await showTravelPage();
            } else {
                await showTravelLesson(route.lessonId);
            }
            break;

        case "journal":
            if (route.target === "index") {
                await showJournalPage();
            } else {
                await showNewsDetail(route.articleId);
            }
            break;

        case "info":
            showInstitutionalPage(route.page);
            break;
    }
}

function prefersReducedMotion(): boolean {
    return window.matchMedia(
        "(prefers-reduced-motion: reduce)"
    ).matches;
}

async function renderWithTransition(
    route: AppRoute
): Promise<void> {
    if (
        prefersReducedMotion()
        || typeof document.startViewTransition !== "function"
    ) {
        await renderRoute(route);
        return;
    }

    const transition = document.startViewTransition(
        () => renderRoute(route)
    );

    await transition.finished;
}

/** Resets reading position and optionally focuses the destination title. */
function finalizeRouteChange(
    focus: boolean
): void {
    window.scrollTo({
        top: 0,
        left: 0,
        behavior: "auto"
    });

    if (!focus) {
        return;
    }

    const heading = app.querySelector<HTMLElement>(
        "h1"
    );

    if (!heading) {
        return;
    }

    heading.setAttribute(
        "tabindex",
        "-1"
    );
    heading.focus({
        preventScroll: true
    });
    heading.addEventListener(
        "blur",
        () => heading.removeAttribute("tabindex"),
        { once: true }
    );
}

/** Presents a route with progressive motion and accessible focus management. */
async function presentRoute(
    route: AppRoute,
    focus: boolean
): Promise<void> {
    await renderWithTransition(route);
    finalizeRouteChange(focus);
}
