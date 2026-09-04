import { showGrammarLesson } from "../grammar/grammar.js";
import { showNewsDetail } from "../news/news.js";
import { showVocabPack } from "../vocabulary/vocabulary.js";
import {
    isSearchQueryReady,
    searchContent
} from "./searchEngine.js";
import {
    loadSearchIndex
} from "./searchRepository.js";
import type {
    Level
} from "../../types/global.js";
import { getRequiredElement } from "../../ui/ui.js";
import {
    getSearchModalStyle,
    renderSearchErrorView,
    renderSearchLoadingView,
    renderSearchMinimumCharactersView,
    renderSearchModalView,
    renderSearchNoResultsView,
    renderSearchResultsView
} from "../../ui/views/searchView.js";

export {
    openSearch
};

/**
 * Site-wide search controller.
 *
 * The immutable index is generated during the production build and loaded
 * through one shared request. Matching and HTML rendering live in their
 * dedicated engine and view modules.
 */

let searchKeydownHandler:
    ((event: KeyboardEvent) => void)
    | null = null;
let searchReturnFocus:
    HTMLElement
    | null = null;
let activeSearchRequest = 0;

/**
 * Opens the site-wide search modal and starts warming its single index request.
 */
function openSearch(): void {
    const existingModal =
        document.getElementById(
            "search-modal"
        );

    if (existingModal) {
        getRequiredElement<HTMLInputElement>(
            "search-input"
        ).focus();

        return;
    }

    searchReturnFocus =
        document.activeElement
            instanceof HTMLElement
            ? document.activeElement
            : null;

    const modal =
        document.createElement(
            "div"
        );

    modal.id =
        "search-modal";
    modal.style.cssText =
        getSearchModalStyle();
    modal.innerHTML =
        renderSearchModalView();

    document.body.appendChild(
        modal
    );

    bindSearchModalEvents(
        modal
    );

    getRequiredElement<HTMLInputElement>(
        "search-input"
    ).focus();

    void loadSearchIndex()
        .catch(
            error => {
                console.warn(
                    "Search index warm-up failed:",
                    error
                );
            }
        );
}

function getSearchResultButtons(
    results: HTMLElement
): HTMLButtonElement[] {
    return Array.from(
        results.querySelectorAll<HTMLButtonElement>(
            ".search-result-item"
        )
    );
}

function moveSearchResultFocus(
    event: KeyboardEvent,
    input: HTMLInputElement,
    results: HTMLElement
): void {
    if (
        event.key !== "ArrowDown"
        && event.key !== "ArrowUp"
    ) {
        return;
    }

    const buttons =
        getSearchResultButtons(
            results
        );

    if (buttons.length === 0) {
        return;
    }

    const activeButton =
        document.activeElement
            instanceof HTMLButtonElement
            ? document.activeElement
            : null;
    const currentIndex =
        activeButton
            ? buttons.indexOf(
                activeButton
            )
            : -1;

    if (
        event.key === "ArrowUp"
        && (
            currentIndex <= 0
        )
    ) {
        input.focus();
        event.preventDefault();
        return;
    }

    const nextIndex =
        event.key === "ArrowDown"
            ? Math.min(
                currentIndex + 1,
                buttons.length - 1
            )
            : currentIndex - 1;

    buttons[
        Math.max(
            nextIndex,
            0
        )
    ].focus();
    event.preventDefault();
}

/**
 * Binds mouse, input and keyboard interaction for one modal instance.
 */
function bindSearchModalEvents(
    modal: HTMLDivElement
): void {
    const input =
        getRequiredElement<HTMLInputElement>(
            "search-input"
        );
    const closeButton =
        getRequiredElement<HTMLButtonElement>(
            "search-close"
        );
    const results =
        getRequiredElement<HTMLElement>(
            "search-results"
        );

    closeButton.onclick = () => {
        closeSearch();
    };

    modal.onclick = event => {
        if (
            event.target
            === modal
        ) {
            closeSearch();
        }
    };

    input.oninput = () => {
        void performSearch(
            input.value
        );
    };
    input.onfocus = () => {
        input.style.borderColor =
            "#087F5B";
    };
    input.onblur = () => {
        input.style.borderColor =
            "#e0e0e0";
    };

    results.onclick = event => {
        handleSearchResultClick(
            event
        );
    };

    searchKeydownHandler =
        event => {
            if (
                event.key
                === "Escape"
            ) {
                closeSearch();
                return;
            }

            moveSearchResultFocus(
                event,
                input,
                results
            );
        };

    document.addEventListener(
        "keydown",
        searchKeydownHandler
    );
}

/**
 * Closes Search, cancels pending rendering and restores the caller's focus.
 */
function closeSearch(): void {
    activeSearchRequest += 1;

    document.getElementById(
        "search-modal"
    )?.remove();

    if (searchKeydownHandler) {
        document.removeEventListener(
            "keydown",
            searchKeydownHandler
        );
        searchKeydownHandler =
            null;
    }

    if (searchReturnFocus?.isConnected) {
        searchReturnFocus.focus();
    }

    searchReturnFocus =
        null;
}

function renderSearchState(
    results: HTMLElement,
    html: string,
    busy: boolean
): void {
    results.setAttribute(
        "aria-busy",
        String(busy)
    );
    results.innerHTML =
        html;
}

/**
 * Searches the generated index and ignores any response superseded by newer
 * input, preventing slower earlier queries from overwriting current results.
 */
async function performSearch(
    query: string
): Promise<void> {
    const requestId =
        ++activeSearchRequest;
    const resultsDiv =
        getRequiredElement<HTMLElement>(
            "search-results"
        );
    const trimmedQuery =
        query.trim();

    if (
        !isSearchQueryReady(
            trimmedQuery
        )
    ) {
        renderSearchState(
            resultsDiv,
            renderSearchMinimumCharactersView(),
            false
        );
        return;
    }

    renderSearchState(
        resultsDiv,
        renderSearchLoadingView(),
        true
    );

    try {
        const index =
            await loadSearchIndex();

        if (
            requestId
            !== activeSearchRequest
            || !resultsDiv.isConnected
        ) {
            return;
        }

        const results =
            searchContent(
                index,
                trimmedQuery
            );
        const resultCount =
            results.vocab.length
            + results.grammar.length
            + results.news.length;

        renderSearchState(
            resultsDiv,
            resultCount === 0
                ? renderSearchNoResultsView()
                : renderSearchResultsView(
                    results,
                    trimmedQuery
                ),
            false
        );
    } catch (error) {
        if (
            requestId
            !== activeSearchRequest
            || !resultsDiv.isConnected
        ) {
            return;
        }

        console.error(
            "Search error:",
            error
        );
        renderSearchState(
            resultsDiv,
            renderSearchErrorView(),
            false
        );
    }
}

function handleSearchResultClick(
    event: MouseEvent
): void {
    const target =
        event.target;

    if (
        !(target instanceof Element)
    ) {
        return;
    }

    const result =
        target.closest<HTMLButtonElement>(
            ".search-result-item"
        );

    if (!result) {
        return;
    }

    if (
        result.classList.contains(
            "search-vocab-result"
        )
    ) {
        const level =
            parseSearchLevel(
                result.dataset.level
            );
        const packId =
            result.dataset.packId;

        if (
            level
            && packId
        ) {
            closeSearch();
            void showVocabPack(
                level,
                packId
            );
        }
        return;
    }

    if (
        result.classList.contains(
            "search-grammar-result"
        )
        && result.dataset.grammarId
    ) {
        closeSearch();
        void showGrammarLesson(
            result.dataset.grammarId
        );
        return;
    }

    if (
        result.classList.contains(
            "search-news-result"
        )
        && result.dataset.newsId
    ) {
        closeSearch();
        void showNewsDetail(
            result.dataset.newsId
        );
    }
}

function parseSearchLevel(
    value: string | undefined
): Level | null {
    switch (value) {
        case "A1":
        case "A2":
        case "B1":
        case "B2":
        case "C1":
        case "C2":
            return value;

        default:
            return null;
    }
}
