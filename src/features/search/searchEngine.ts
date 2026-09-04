import type {
    NewsIndexItem,
    SearchGrammarItem,
    SearchIndex,
    SearchResults,
    SearchVocabWord
} from "../../types/global.js";

export {
    isSearchQueryReady,
    normalizeSearchText,
    searchContent
};

/**
 * Pure matching rules for the site-wide bilingual search.
 *
 * Loading and rendering deliberately stay outside this module so the same
 * search semantics can be covered without a browser or the corpus filesystem.
 */

const minimumSearchLength = 2;

/**
 * Normalizes French and Persian text before matching.
 *
 * Besides case and accents, this aligns the Arabic and Persian variants of
 * yeh and kaf that are commonly mixed by mobile keyboards.
 */
function normalizeSearchText(
    value: string
): string {
    return value
        .normalize("NFKD")
        .replace(
            /\p{M}/gu,
            ""
        )
        .replace(
            /[يى]/g,
            "ی"
        )
        .replace(
            /ك/g,
            "ک"
        )
        .toLocaleLowerCase()
        .replace(
            /[^\p{L}\p{N}]+/gu,
            " "
        )
        .trim();
}

/**
 * Returns whether a query contains enough searchable characters.
 */
function isSearchQueryReady(
    query: string
): boolean {
    return normalizeSearchText(
        query
    ).length >= minimumSearchLength;
}

/**
 * Returns whether any candidate field contains the normalized query.
 */
function containsQuery(
    values: Array<string | undefined>,
    normalizedQuery: string
): boolean {
    return values.some(
        value =>
            typeof value === "string"
            && normalizeSearchText(
                value
            ).includes(
                normalizedQuery
            )
    );
}

function searchVocabulary(
    words: SearchVocabWord[],
    normalizedQuery: string
): SearchVocabWord[] {
    return words.filter(
        word => containsQuery(
            [
                word.fr,
                word.fa,
                word.ex,
                word.ex_fa,
                word.packTitle,
                word.packTitleFa
            ],
            normalizedQuery
        )
    );
}

function searchGrammar(
    lessons: SearchGrammarItem[],
    normalizedQuery: string
): SearchGrammarItem[] {
    return lessons.filter(
        lesson => containsQuery(
            [
                lesson.title,
                lesson.title_fa,
                lesson.module,
                lesson.category,
                lesson.content,
                lesson.example
            ],
            normalizedQuery
        )
    );
}

function searchNews(
    newsItems: NewsIndexItem[],
    normalizedQuery: string
): NewsIndexItem[] {
    return newsItems.filter(
        news => containsQuery(
            [
                news.title,
                news.title_fa,
                news.subtitle,
                news.subtitle_fa
            ],
            normalizedQuery
        )
    );
}

/**
 * Searches every indexed content family with the same bilingual semantics.
 */
function searchContent(
    index: SearchIndex,
    query: string
): SearchResults {
    const normalizedQuery =
        normalizeSearchText(
            query
        );

    if (
        normalizedQuery.length
        < minimumSearchLength
    ) {
        return {
            vocab: [],
            grammar: [],
            news: []
        };
    }

    return {
        vocab:
            searchVocabulary(
                index.vocab,
                normalizedQuery
            ),
        grammar:
            searchGrammar(
                index.grammar,
                normalizedQuery
            ),
        news:
            searchNews(
                index.news,
                normalizedQuery
            )
    };
}
