import { getPlacementResult } from "../../core/placementEngine.js";
import { navigateToSection } from "../../core/navigation.js";
import { showGrammarLesson } from "../grammar/grammar.js";
import type {
    AppSection,
    Level,
    NewsArticle,
    NewsIndexItem
} from "../../types/global.js";
import {
    app,
    getRequiredElement,
    queryElements
} from "../../ui/ui.js";
import {
    renderNewsDetailView,
    renderNewsHomeCardView,
    renderNewsJournalView,
    renderNewsNotFoundView
} from "../../ui/views/newsView.js";

export {
    initializeNews,
    renderNewsSection,
    showJournalPage,
    showNewsDetail
};

/**
 * News feature controller.
 *
 * This file owns:
 * - News loading
 * - CEFR visibility filtering
 * - navigation
 * - interaction binding
 * - full/simple article mode
 *
 * All HTML generation is delegated to `src/ui/views/newsView.ts`.
 */

const cefrRank: Record<Level, number> = {
    A1: 1,
    A2: 2,
    B1: 3,
    B2: 4,
    C1: 5,
    C2: 6
};

let newsDelegatedEventsBound = false;

/**
 * Returns whether learning content is suitable for the learner's current
 * level.
 *
 * Content one CEFR level above the learner is intentionally kept visible, as
 * in the historical News behavior.
 *
 * @param contentLevel - Optional CEFR level attached to the content.
 * @param userLevelRank - Numeric CEFR rank of the learner.
 * @returns True when the content may be displayed.
 */
function isNewsContentVisible(
    contentLevel: Level | undefined,
    userLevelRank: number
): boolean {
    if (!contentLevel) {
        return true;
    }

    return (
        cefrRank[contentLevel]
        <= userLevelRank + 1
    );
}

/**
 * Loads and renders the current News card displayed on the home page.
 *
 * The returned HTML is inserted later by the Home controller. Navigation is
 * therefore handled through delegated events attached to the persistent
 * application root.
 *
 * @returns Current News card HTML, or an empty string when unavailable.
 */
async function renderNewsSection(): Promise<string> {
    try {
        const response = await fetch(
            `./data/news/news-index.json?v=${Date.now()}`
        );

        if (!response.ok) {
            return "";
        }

        const allNews = (await response.json()) as NewsIndexItem[];

        const currentNews =
            allNews[0];

        if (!currentNews) {
            return "";
        }

        return renderNewsHomeCardView(
            currentNews
        );
    } catch (error) {
        console.warn(
            "News section skipped:",
            error
        );

        return "";
    }
}

/**
 * Displays the complete editorial journal using the existing news index.
 */
async function showJournalPage(): Promise<void> {
    let news:
        NewsIndexItem[] = [];

    try {
        const response = await fetch(
            `./data/news/news-index.json?v=${Date.now()}`
        );

        if (!response.ok) {
            throw new Error(
                `News index failed with status ${response.status}`
            );
        }

        news =
            (await response.json()) as NewsIndexItem[];
    } catch (error) {
        console.error(
            "Journal loading error:",
            error
        );
    }

    app.innerHTML =
        renderNewsJournalView(
            news
        );

    window.scrollTo(
        0,
        0
    );
}

/**
 * Resolves the meaningful parent screen of a News detail.
 */
function getNewsReturnSection(): AppSection {
    return localStorage.getItem(
        "currentSection"
    ) === "journal"
        ? "journal"
        : "home";
}

/**
 * Loads and displays a complete News article.
 *
 * Vocabulary and grammar content are filtered according to the learner's CEFR
 * level before being passed to the view.
 *
 * @param newsId - News article identifier.
 */
async function showNewsDetail(
    newsId: string
): Promise<void> {
    const userLevel =
        getPlacementResult()
        || "A1";

    const userLevelRank =
        cefrRank[userLevel];

    try {
        const response = await fetch(
            `./data/news/${newsId}.json?v=${Date.now()}`
        );

        if (!response.ok) {
            throw new Error(
                `News article not found: ${newsId}`
            );
        }

        const news = (await response.json()) as NewsArticle;

        const vocabulary =
            (
                news.content.vocabulary
                ?? []
            ).filter(
                item =>
                    isNewsContentVisible(
                        item.level,
                        userLevelRank
                    )
            );

        const allGrammar =
            news.content.grammar
            ?? [];

        const grammar =
            allGrammar.filter(
                item =>
                    isNewsContentVisible(
                        item.level,
                        userLevelRank
                    )
            );

        const hasHiddenGrammar =
            allGrammar.length > 0
            && grammar.length === 0;

        app.innerHTML =
            renderNewsDetailView(
                news,
                vocabulary,
                grammar,
                hasHiddenGrammar
            );

        bindNewsDetailEvents();

        window.scrollTo(
            0,
            0
        );
    } catch (error) {
        console.error(
            "News detail error:",
            error
        );

        app.innerHTML =
            renderNewsNotFoundView();

        getRequiredElement<HTMLButtonElement>(
            "news-error-back"
        ).onclick = () => {
            void navigateToSection(
                getNewsReturnSection()
            );
        };
    }
}

/**
 * Binds controls belonging to a rendered News article.
 */
function bindNewsDetailEvents(): void {
    getRequiredElement<HTMLButtonElement>(
        "news-back"
    ).onclick = () => {
        void navigateToSection(
            getNewsReturnSection()
        );
    };

    getRequiredElement<HTMLButtonElement>(
        "btn-full"
    ).onclick = () => {
        switchNewsText(
            "full"
        );
    };

    getRequiredElement<HTMLButtonElement>(
        "btn-simple"
    ).onclick = () => {
        switchNewsText(
            "simple"
        );
    };

    const grammarLinks =
        queryElements<HTMLButtonElement>(
            ".news-grammar-link"
        );

    grammarLinks.forEach(button => {
        button.onclick = () => {
            const grammarId =
                button.dataset.grammarId;

            if (!grammarId) {
                return;
            }

            void showGrammarLesson(
                grammarId
            );
        };
    });
}

/**
 * Switches between the complete and simplified article text.
 *
 * This function only manages transient DOM interaction state. The structural
 * HTML remains owned by the News view.
 *
 * @param mode - Article text mode to display.
 */
function switchNewsText(
    mode: "full" | "simple"
): void {
    const fullDiv =
        getRequiredElement<HTMLElement>(
            "news-full-text"
        );

    const simpleDiv =
        getRequiredElement<HTMLElement>(
            "news-simple-text"
        );

    const fullButton =
        getRequiredElement<HTMLButtonElement>(
            "btn-full"
        );

    const simpleButton =
        getRequiredElement<HTMLButtonElement>(
            "btn-simple"
        );

    const fullMode =
        mode === "full";

    fullDiv.style.display =
        fullMode
            ? "block"
            : "none";

    simpleDiv.style.display =
        fullMode
            ? "none"
            : "block";

    fullButton.style.background =
        fullMode
            ? "#087F5B"
            : "#fff";

    fullButton.style.color =
        fullMode
            ? "#fff"
            : "#1a1a1a";

    fullButton.style.borderColor =
        fullMode
            ? "#087F5B"
            : "#e0e0e0";

    simpleButton.style.background =
        fullMode
            ? "#fff"
            : "#087F5B";

    simpleButton.style.color =
        fullMode
            ? "#1a1a1a"
            : "#fff";

    simpleButton.style.borderColor =
        fullMode
            ? "#e0e0e0"
            : "#087F5B";
}

/**
 * Installs the delegated navigation handler used by News cards embedded in
 * other pages, especially the Home page.
 *
 * The application root itself is never replaced, only its `innerHTML`, so the
 * listener remains valid across screen changes.
 */
function bindNewsDelegatedEvents(): void {
    if (newsDelegatedEventsBound) {
        return;
    }

    app.addEventListener(
        "click",
        event => {
            const target =
                event.target;

            if (
                !(target instanceof Element)
            ) {
                return;
            }

            const card =
                target.closest<HTMLButtonElement>(
                    ".news-home-card"
                );

            if (
                !card
                || !app.contains(card)
            ) {
                return;
            }

            const newsId =
                card.dataset.newsId;

            if (!newsId) {
                return;
            }

            void showNewsDetail(
                newsId
            );
        }
    );

    newsDelegatedEventsBound = true;
}

/**
 * Installs delegated interactions used by news cards and articles.
 */
function initializeNews(): void {
    bindNewsDelegatedEvents();
}
