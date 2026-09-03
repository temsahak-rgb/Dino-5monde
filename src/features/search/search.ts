/**
 * Cross-feature search controller.
 *
 * This file owns:
 * - search data loading and caching
 * - query matching
 * - modal lifecycle
 * - keyboard interaction
 * - result navigation
 *
 * All HTML generation is delegated to `src/ui/views/searchView.ts`.
 */

interface SearchCache {
    vocab: VocabPack[] | null;
    grammar: SearchGrammarItem[] | null;
    news: NewsIndexItem[] | null;
}

const searchCache: SearchCache = {
    vocab: null,
    grammar: null,
    news: null
};

let searchKeydownHandler:
    ((event: KeyboardEvent) => void)
    | null = null;

/**
 * Returns a readable message for an unknown caught value.
 *
 * @param error - Unknown caught value.
 * @returns Human-readable error message.
 */
function searchErrorMessage(
    error: unknown
): string {
    return error instanceof Error
        ? error.message
        : String(error);
}

/**
 * Opens the site-wide search modal.
 *
 * Calling this function while the modal is already open simply restores focus
 * to the search input.
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

    const input =
        getRequiredElement<HTMLInputElement>(
            "search-input"
        );

    input.focus();
}

/**
 * Binds search-modal interaction.
 *
 * @param modal - Search modal backdrop element.
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
            }
        };

    document.addEventListener(
        "keydown",
        searchKeydownHandler
    );
}

/**
 * Closes the search modal and removes the temporary keyboard listener.
 */
function closeSearch(): void {
    document.getElementById(
        "search-modal"
    )?.remove();

    if (
        searchKeydownHandler
    ) {
        document.removeEventListener(
            "keydown",
            searchKeydownHandler
        );

        searchKeydownHandler =
            null;
    }
}

/**
 * Searches every indexed content family and renders matching results.
 *
 * @param query - User-provided search query.
 */
async function performSearch(
    query: string
): Promise<void> {
    const resultsDiv =
        getRequiredElement<HTMLElement>(
            "search-results"
        );

    const normalizedQuery =
        query.trim();

    if (
        normalizedQuery.length < 2
    ) {
        resultsDiv.innerHTML =
            renderSearchMinimumCharactersView();

        return;
    }

    resultsDiv.innerHTML =
        renderSearchLoadingView();

    try {
        const [
            vocabData,
            grammarData,
            newsData
        ] = await Promise.all([
            loadAllVocab()
                .catch(
                    error => {
                        console.warn(
                            "Vocab load error:",
                            error
                        );

                        return [];
                    }
                ),

            loadAllGrammar()
                .catch(
                    error => {
                        console.warn(
                            "Grammar load error:",
                            error
                        );

                        return [];
                    }
                ),

            loadAllNews()
                .catch(
                    error => {
                        console.warn(
                            "News load error:",
                            error
                        );

                        return [];
                    }
                )
        ]);

        const lowerQuery =
            normalizedQuery
                .toLowerCase();

        const vocabResults =
            searchVocabulary(
                vocabData,
                lowerQuery
            );

        const grammarResults =
            searchGrammar(
                grammarData,
                lowerQuery
            );

        const newsResults =
            searchNews(
                newsData,
                lowerQuery
            );

        if (
            vocabResults.length
            + grammarResults.length
            + newsResults.length
            === 0
        ) {
            resultsDiv.innerHTML =
                renderSearchNoResultsView();

            return;
        }

        resultsDiv.innerHTML =
            renderSearchResultsView(
                {
                    vocab:
                        vocabResults,

                    grammar:
                        grammarResults,

                    news:
                        newsResults
                },
                normalizedQuery
            );
    } catch (error) {
        console.error(
            "Search error:",
            error
        );

        resultsDiv.innerHTML =
            renderSearchErrorView(
                searchErrorMessage(
                    error
                )
            );
    }
}

/**
 * Searches vocabulary packs.
 *
 * @param packs - Loaded vocabulary packs.
 * @param lowerQuery - Lower-cased query.
 * @returns Matching vocabulary words.
 */
function searchVocabulary(
    packs: VocabPack[],
    lowerQuery: string
): SearchVocabWord[] {
    const results:
        SearchVocabWord[] = [];

    packs.forEach(pack => {
        pack.words.forEach(
            word => {
                const searchable =
                    [
                        word.fr,
                        word.fa,
                        word.ex,
                        word.ex_fa
                    ]
                        .filter(
                            Boolean
                        )
                        .join(" ")
                        .toLowerCase();

                if (
                    !searchable.includes(
                        lowerQuery
                    )
                ) {
                    return;
                }

                results.push({
                    ...word,
                    level:
                        pack.level,
                    packId:
                        pack.id
                });
            }
        );
    });

    return results;
}

/**
 * Searches grammar metadata.
 *
 * @param lessons - Searchable grammar lessons.
 * @param lowerQuery - Lower-cased query.
 * @returns Matching grammar lessons.
 */
function searchGrammar(
    lessons: SearchGrammarItem[],
    lowerQuery: string
): SearchGrammarItem[] {
    return lessons.filter(
        lesson => {
            const searchable =
                [
                    lesson.title,
                    lesson.title_fa,
                    lesson.content,
                    lesson.example
                ]
                    .filter(
                        Boolean
                    )
                    .join(" ")
                    .toLowerCase();

            return searchable.includes(
                lowerQuery
            );
        }
    );
}

/**
 * Searches News metadata.
 *
 * @param newsItems - Searchable News index.
 * @param lowerQuery - Lower-cased query.
 * @returns Matching News articles.
 */
function searchNews(
    newsItems: NewsIndexItem[],
    lowerQuery: string
): NewsIndexItem[] {
    return newsItems.filter(
        news => {
            const searchable =
                [
                    news.title,
                    news.title_fa,
                    news.subtitle,
                    news.subtitle_fa
                ]
                    .filter(
                        Boolean
                    )
                    .join(" ")
                    .toLowerCase();

            return searchable.includes(
                lowerQuery
            );
        }
    );
}

/**
 * Handles navigation from a rendered search result.
 *
 * Result type and destination metadata are provided by the Search view through
 * CSS classes and data attributes.
 *
 * @param event - Search-results click event.
 */
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
            goToVocab(
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
    ) {
        const grammarId =
            result.dataset.grammarId;

        if (grammarId) {
            goToGrammar(
                grammarId
            );
        }

        return;
    }

    if (
        result.classList.contains(
            "search-news-result"
        )
    ) {
        const newsId =
            result.dataset.newsId;

        if (newsId) {
            goToNews(
                newsId
            );
        }
    }
}

/**
 * Validates a search-result CEFR level before using it for navigation.
 *
 * @param value - Raw DOM data attribute.
 * @returns Valid CEFR level or null.
 */
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

/**
 * Navigates from a search result to a vocabulary pack.
 *
 * @param level - Vocabulary level.
 * @param packId - Vocabulary pack identifier.
 */
function goToVocab(
    level: Level,
    packId: string
): void {
    closeSearch();

    void showVocabPack(
        level,
        packId
    );
}

/**
 * Navigates from a search result to a grammar lesson.
 *
 * @param id - Grammar lesson identifier.
 */
function goToGrammar(
    id: string
): void {
    closeSearch();

    void showGrammarLesson(
        id
    );
}

/**
 * Navigates from a search result to a News article.
 *
 * @param id - News article identifier.
 */
function goToNews(
    id: string
): void {
    closeSearch();

    void showNewsDetail(
        id
    );
}

/**
 * Loads every vocabulary pack used by global search.
 *
 * Results are cached for the current browser session.
 *
 * @returns All searchable vocabulary packs.
 */
async function loadAllVocab(): Promise<VocabPack[]> {
    if (searchCache.vocab) {
        return searchCache.vocab;
    }

    const levels: Level[] = [
        "A1",
        "A2",
        "B1",
        "B2",
        "C1",
        "C2"
    ];

    const allPacks:
        VocabPack[] = [];

    for (
        const level
        of levels
    ) {
        try {
            const indexResponse =
                await fetch(
                    `./data/vocabulary/vocab-${level}.json`
                );

            if (
                !indexResponse.ok
            ) {
                continue;
            }

            const index = (await indexResponse.json()) as VocabPackIndex[];

            for (
                const pack
                of index
            ) {
                try {
                    const packResponse =
                        await fetch(
                            `./data/vocabulary/${level}/${pack.id}.json`
                        );

                    if (
                        !packResponse.ok
                    ) {
                        continue;
                    }

                    const packData = (await packResponse.json()) as VocabPack;

                    packData.level =
                        level;

                    allPacks.push(
                        packData
                    );
                } catch {
                    /*
                     * One invalid pack must not disable global search.
                     */
                }
            }
        } catch {
            /*
             * One unavailable level must not disable global search.
             */
        }
    }

    searchCache.vocab =
        allPacks;

    return allPacks;
}

/**
 * Loads grammar indexes from the level-based catalog files.
 *
 * @returns All searchable grammar metadata.
 */
async function loadAllGrammar(): Promise<SearchGrammarItem[]> {
    if (
        searchCache.grammar
    ) {
        return searchCache.grammar;
    }

    const levels: Level[] = [
        "A1",
        "A2",
        "B1",
        "B2",
        "C1",
        "C2"
    ];

    const allLessons:
        SearchGrammarItem[] = [];

    for (
        const level
        of levels
    ) {
        try {
            const response =
                await fetch(
                    `./data/grammar-${level}.json`
                );

            if (
                !response.ok
            ) {
                continue;
            }

            const lessons = (await response.json()) as GrammarLessonIndex[];

            allLessons.push(
                ...lessons
            );
        } catch {
            /*
             * Missing grammar levels are ignored by global search.
             */
        }
    }

    searchCache.grammar =
        allLessons;

    return allLessons;
}

/**
 * Loads the complete News index used by global search.
 *
 * @returns Searchable News metadata.
 */
async function loadAllNews(): Promise<NewsIndexItem[]> {
    if (searchCache.news) {
        return searchCache.news;
    }

    try {
        const response =
            await fetch(
                "./data/news/news-index.json"
            );

        if (!response.ok) {
            searchCache.news = [];
            return [];
        }

        const news = (await response.json()) as NewsIndexItem[];

        searchCache.news =
            news;

        return news;
    } catch (error) {
        console.warn(
            "News load failed:",
            error
        );

        searchCache.news = [];

        return [];
    }
}