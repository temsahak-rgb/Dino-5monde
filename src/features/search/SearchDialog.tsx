import {
    useEffect,
    useMemo,
    useRef,
    useState
} from "react";

import {
    createPortal
} from "react-dom";

import {
    Link
} from "react-router";

import {
    isSearchQueryReady,
    searchContent
} from "./searchEngine.js";

import {
    loadSearchIndex
} from "./searchRepository.js";

import {
    useI18n
} from "../../i18n/I18nProvider.js";

import type {
    NewsIndexItem,
    SearchGrammarItem,
    SearchIndex,
    SearchResults,
    SearchVocabWord
} from "../../types/global.js";

interface SearchDialogProps {
    open:
        boolean;

    onClose:
        () => void;

    /**
     * Keeps the dialog in the current React tree for deterministic server
     * rendering. Browser usage continues to render through document.body.
     */
    renderInline?:
        boolean;
}

type SearchLoadState =
    "idle"
    | "loading"
    | "ready"
    | "error";

const emptySearchResults:
    SearchResults = {
        vocab: [],
        grammar: [],
        news: []
    };

/**
 * Site-wide search dialog.
 *
 * The immutable search index is generated during the Vite build.
 *
 * Matching remains delegated to searchEngine.ts so French / Persian
 * normalization stays identical to the historical implementation.
 */
function SearchDialog({
    open,
    onClose,
    renderInline = false
}: SearchDialogProps) {
    const {
        t
    } = useI18n();

    const inputRef =
        useRef<HTMLInputElement | null>(
            null
        );

    const dialogRef =
        useRef<HTMLDivElement | null>(
            null
        );

    const returnFocusRef =
        useRef<HTMLElement | null>(
            null
        );

    const [
        query,
        setQuery
    ] =
        useState(
            ""
        );

    const [
        index,
        setIndex
    ] =
        useState<SearchIndex | null>(
            null
        );

    const [
        loadState,
        setLoadState
    ] =
        useState<SearchLoadState>(
            "idle"
        );

    /* ---------------------------------------------------------------------- */
    /* Opening / closing                                                      */
    /* ---------------------------------------------------------------------- */

    useEffect(
        () => {
            if (!open) {
                return;
            }

            returnFocusRef.current =
                document.activeElement
                    instanceof HTMLElement
                    ? document.activeElement
                    : null;

            const previousOverflow =
                document.body.style
                    .overflow;

            document.body.style.overflow =
                "hidden";

            const focusFrame =
                requestAnimationFrame(
                    () => {
                        inputRef.current
                            ?.focus();
                    }
                );

            return () => {
                cancelAnimationFrame(
                    focusFrame
                );

                document.body.style.overflow =
                    previousOverflow;

                const returnFocus =
                    returnFocusRef.current;

                returnFocusRef.current =
                    null;

                if (
                    returnFocus
                    ?.isConnected
                ) {
                    requestAnimationFrame(
                        () => {
                            returnFocus.focus();
                        }
                    );
                }
            };
        },
        [
            open
        ]
    );

    /* ---------------------------------------------------------------------- */
    /* Index loading                                                          */
    /* ---------------------------------------------------------------------- */

    useEffect(
        () => {
            if (
                !open
                || index
            ) {
                return;
            }

            let active =
                true;

            setLoadState(
                "loading"
            );

            void loadSearchIndex()
                .then(
                    loadedIndex => {
                        if (!active) {
                            return;
                        }

                        setIndex(
                            loadedIndex
                        );

                        setLoadState(
                            "ready"
                        );
                    }
                )
                .catch(
                    error => {
                        console.error(
                            "Search index loading error:",
                            error
                        );

                        if (!active) {
                            return;
                        }

                        setLoadState(
                            "error"
                        );
                    }
                );

            return () => {
                active =
                    false;
            };
        },
        [
            index,
            open
        ]
    );

    /* ---------------------------------------------------------------------- */
    /* Search                                                                 */
    /* ---------------------------------------------------------------------- */

    const trimmedQuery =
        query.trim();

    const queryReady =
        isSearchQueryReady(
            trimmedQuery
        );

    const results =
        useMemo(
            () => {
                if (
                    !index
                    || !queryReady
                ) {
                    return (
                        emptySearchResults
                    );
                }

                return searchContent(
                    index,
                    trimmedQuery
                );
            },
            [
                index,
                queryReady,
                trimmedQuery
            ]
        );

    const resultCount =
        results.vocab.length
        + results.grammar.length
        + results.news.length;

    if (!open) {
        return null;
    }

    const dialog = (
        <div
            className="
                fixed
                inset-0
                z-[9999]
                overflow-y-auto
                bg-black/85
                px-4
                py-10
                backdrop-blur-sm
                max-[560px]:p-3
            "
            onMouseDown={
                event => {
                    if (
                        event.target
                        === event.currentTarget
                    ) {
                        onClose();
                    }
                }
            }
        >
            <div
                ref={
                    dialogRef
                }
                role="dialog"
                aria-modal="true"
                aria-labelledby="search-dialog-title"
                onKeyDown={
                    handleDialogKeyDown
                }
                className="
                    mx-auto
                    w-full
                    max-w-[800px]
                    overflow-hidden
                    rounded-card
                    bg-surface
                    shadow-2xl
                    max-[560px]:flex
                    max-[560px]:min-h-[calc(100dvh-1.5rem)]
                    max-[560px]:flex-col
                "
            >
                {/* ---------------------------------------------------------- */}
                {/* Header                                                     */}
                {/* ---------------------------------------------------------- */}

                <header
                    className="
                        flex
                        items-center
                        justify-between
                        gap-4
                        bg-dino-600
                        px-5
                        py-4
                        max-[560px]:px-4
                        max-[560px]:py-3
                    "
                >
                    <h2
                        id="search-dialog-title"
                        className="
                            text-lg
                            font-bold
                            text-white
                        "
                    >
                        🔍
                        {" "}
                        {t(
                            "search.title"
                        )}
                    </h2>

                    <button
                        type="button"
                        aria-label={
                            t(
                                "search.close"
                            )
                        }
                        onClick={
                            onClose
                        }
                        className="
                            flex
                            size-11
                            items-center
                            justify-center
                            rounded-control
                            border-0
                            bg-white/15
                            text-lg
                            text-white
                            transition
                            hover:bg-white/25
                            focus-visible:outline-none
                            focus-visible:ring-2
                            focus-visible:ring-white
                        "
                    >
                        ✕
                    </button>
                </header>

                {/* ---------------------------------------------------------- */}
                {/* Input                                                      */}
                {/* ---------------------------------------------------------- */}

                <div
                    className="
                        border-b
                        border-line
                        p-5
                        max-[560px]:p-4
                    "
                >
                    <input
                        ref={
                            inputRef
                        }
                        type="search"
                        autoComplete="off"
                        value={
                            query
                        }
                        placeholder={
                            t(
                                "search.placeholder"
                            )
                        }
                        aria-label={
                            t(
                                "search.title"
                            )
                        }
                        aria-controls="search-results"
                        aria-autocomplete="list"
                        onChange={
                            event => {
                                setQuery(
                                    event.target
                                        .value
                                );
                            }
                        }
                        className="
                            w-full
                            rounded-control
                            border-2
                            border-line
                            bg-surface
                            px-4
                            py-3
                            text-base
                            text-ink
                            outline-none
                            transition
                            placeholder:text-muted
                            focus:border-dino-500
                            focus:ring-2
                            focus:ring-dino-100
                        "
                    />
                </div>

                {/* ---------------------------------------------------------- */}
                {/* Results                                                    */}
                {/* ---------------------------------------------------------- */}

                <div
                    id="search-results"
                    role="region"
                    aria-live="polite"
                    aria-busy={
                        loadState
                        === "loading"
                    }
                    className="
                        max-h-[60vh]
                        overflow-y-auto
                        p-5
                        max-[560px]:max-h-none
                        max-[560px]:flex-1
                        max-[560px]:p-4
                    "
                >
                    {!queryReady ? (
                        <SearchMessage>
                            {t(
                                "search.minCharacters"
                            )}
                        </SearchMessage>
                    ) : loadState
                        === "loading"
                        || loadState
                            === "idle" ? (
                        <SearchMessage>
                            🔄
                            {" "}
                            {t(
                                "search.loading"
                            )}
                        </SearchMessage>
                    ) : loadState
                        === "error" ? (
                        <SearchMessage
                            error
                        >
                            ❌
                            {" "}
                            {t(
                                "search.error"
                            )}
                        </SearchMessage>
                    ) : resultCount
                        === 0 ? (
                        <SearchMessage>
                            {t(
                                "search.noResults"
                            )}
                        </SearchMessage>
                    ) : (
                        <SearchResultGroups
                            results={
                                results
                            }
                            query={
                                trimmedQuery
                            }
                            onNavigate={
                                onClose
                            }
                        />
                    )}
                </div>
            </div>
        </div>
    );

    return renderInline
        ? dialog
        : createPortal(
            dialog,
            document.body
        );

    /* ---------------------------------------------------------------------- */
    /* Keyboard navigation                                                    */
    /* ---------------------------------------------------------------------- */

    function handleDialogKeyDown(
        event:
            React.KeyboardEvent<
                HTMLDivElement
            >
    ): void {
        if (
            event.key
            === "Escape"
        ) {
            event.preventDefault();

            onClose();

            return;
        }

        if (
            event.key
                !== "ArrowDown"
            && event.key
                !== "ArrowUp"
        ) {
            return;
        }

        const dialogElement =
            dialogRef.current;

        if (!dialogElement) {
            return;
        }

        const resultElements =
            Array.from(
                dialogElement
                    .querySelectorAll<HTMLElement>(
                        "[data-search-result]"
                    )
            );

        if (
            resultElements.length
            === 0
        ) {
            return;
        }

        const activeElement =
            document.activeElement;

        const currentIndex =
            activeElement
                instanceof HTMLElement
                ? resultElements
                    .indexOf(
                        activeElement
                    )
                : -1;

        if (
            event.key
            === "ArrowDown"
        ) {
            const nextIndex =
                currentIndex < 0
                    ? 0
                    : Math.min(
                        currentIndex + 1,
                        resultElements.length
                            - 1
                    );

            resultElements[
                nextIndex
            ]?.focus();

            event.preventDefault();

            return;
        }

        if (
            currentIndex
            <= 0
        ) {
            inputRef.current
                ?.focus();

            event.preventDefault();

            return;
        }

        resultElements[
            currentIndex - 1
        ]?.focus();

        event.preventDefault();
    }
}

/* -------------------------------------------------------------------------- */
/* Results                                                                    */
/* -------------------------------------------------------------------------- */

interface SearchResultGroupsProps {
    results:
        SearchResults;

    query:
        string;

    onNavigate:
        () => void;
}

function SearchResultGroups({
    results,
    query,
    onNavigate
}: SearchResultGroupsProps) {
    const {
        t
    } = useI18n();

    return (
        <div>
            {results.vocab.length > 0 ? (
                <SearchGroup
                    icon="📖"
                    title={
                        t(
                            "search.vocabulary"
                        )
                    }
                    count={
                        results.vocab
                            .length
                    }
                >
                    {results.vocab
                        .slice(
                            0,
                            15
                        )
                        .map(
                            item => (
                                <VocabularySearchResult
                                    key={
                                        `${item.level}:${item.packId}:${item.fr}`
                                    }
                                    item={
                                        item
                                    }
                                    query={
                                        query
                                    }
                                    onNavigate={
                                        onNavigate
                                    }
                                />
                            )
                        )}
                </SearchGroup>
            ) : null}

            {results.grammar.length > 0 ? (
                <SearchGroup
                    icon="📚"
                    title={
                        t(
                            "search.grammar"
                        )
                    }
                    count={
                        results.grammar
                            .length
                    }
                    separated={
                        results.vocab
                            .length > 0
                    }
                >
                    {results.grammar
                        .slice(
                            0,
                            15
                        )
                        .map(
                            item => (
                                <GrammarSearchResult
                                    key={
                                        item.id
                                    }
                                    item={
                                        item
                                    }
                                    query={
                                        query
                                    }
                                    onNavigate={
                                        onNavigate
                                    }
                                />
                            )
                        )}
                </SearchGroup>
            ) : null}

            {results.news.length > 0 ? (
                <SearchGroup
                    icon="📰"
                    title={
                        t(
                            "search.news"
                        )
                    }
                    count={
                        results.news
                            .length
                    }
                    separated={
                        results.vocab
                            .length > 0
                        || results.grammar
                            .length > 0
                    }
                >
                    {results.news
                        .slice(
                            0,
                            10
                        )
                        .map(
                            item => (
                                <NewsSearchResult
                                    key={
                                        item.id
                                    }
                                    item={
                                        item
                                    }
                                    query={
                                        query
                                    }
                                    onNavigate={
                                        onNavigate
                                    }
                                />
                            )
                        )}
                </SearchGroup>
            ) : null}
        </div>
    );
}

/* -------------------------------------------------------------------------- */
/* Group                                                                      */
/* -------------------------------------------------------------------------- */

interface SearchGroupProps {
    icon:
        string;

    title:
        string;

    count:
        number;

    separated?:
        boolean;

    children:
        React.ReactNode;
}

function SearchGroup({
    icon,
    title,
    count,
    separated = false,
    children
}: SearchGroupProps) {
    return (
        <section
            className={
                separated
                    ? "mt-6"
                    : ""
            }
        >
            <h3
                className="
                    mb-3
                    border-b-2
                    border-dino-500
                    pb-2
                    text-sm
                    font-bold
                    text-dino-700
                "
            >
                {icon}
                {" "}
                {title}
                {" "}
                (
                {count}
                )
            </h3>

            <div
                className="
                    grid
                    gap-2
                "
            >
                {children}
            </div>
        </section>
    );
}

/* -------------------------------------------------------------------------- */
/* Vocabulary result                                                         */
/* -------------------------------------------------------------------------- */

interface VocabularySearchResultProps {
    item:
        SearchVocabWord;

    query:
        string;

    onNavigate:
        () => void;
}

function VocabularySearchResult({
    item,
    query,
    onNavigate
}: VocabularySearchResultProps) {
    return (
        <Link
            to={
                `/vocabulary/${item.level}/${encodeURIComponent(
                    item.packId
                )}`
            }
            data-search-result
            onClick={
                onNavigate
            }
            className="
                flex
                items-start
                justify-between
                gap-3
                rounded-control
                border
                border-line
                bg-neutral-50
                p-3
                text-inherit
                no-underline
                transition
                hover:border-dino-300
                hover:bg-dino-50
                focus-visible:outline-none
                focus-visible:ring-2
                focus-visible:ring-dino-500
            "
        >
            <div
                className="
                    min-w-0
                    flex-1
                "
            >
                <p
                    className="
                        ltr-lock
                        text-[15px]
                        font-bold
                        text-ink
                    "
                >
                    <HighlightedText
                        text={
                            item.fr
                        }
                        query={
                            query
                        }
                    />
                </p>

                <p
                    className="
                        persian-text
                        mt-1
                        text-sm
                        text-muted
                    "
                >
                    <HighlightedText
                        text={
                            item.fa
                        }
                        query={
                            query
                        }
                    />
                </p>

                {item.ex ? (
                    <p
                        className="
                            ltr-lock
                            mt-2
                            text-xs
                            italic
                            text-muted
                        "
                    >
                        <HighlightedText
                            text={
                                item.ex
                            }
                            query={
                                query
                            }
                        />
                    </p>
                ) : null}
            </div>

            <SearchResultLevel
                level={
                    item.level
                }
            />
        </Link>
    );
}

/* -------------------------------------------------------------------------- */
/* Grammar result                                                            */
/* -------------------------------------------------------------------------- */

interface GrammarSearchResultProps {
    item:
        SearchGrammarItem;

    query:
        string;

    onNavigate:
        () => void;
}

function GrammarSearchResult({
    item,
    query,
    onNavigate
}: GrammarSearchResultProps) {
    const {
        localizedTextClass,
        localizedValue
    } = useI18n();

    const title =
        localizedValue(
            item.title,
            item.title_fa,
            item.id
        );

    return (
        <Link
            to={
                `/grammar/lesson/${encodeURIComponent(
                    item.id
                )}`
            }
            data-search-result
            onClick={
                onNavigate
            }
            className="
                flex
                items-start
                justify-between
                gap-3
                rounded-control
                border
                border-line
                bg-neutral-50
                p-3
                text-inherit
                no-underline
                transition
                hover:border-dino-300
                hover:bg-dino-50
                focus-visible:outline-none
                focus-visible:ring-2
                focus-visible:ring-dino-500
            "
        >
            <div
                className="
                    min-w-0
                    flex-1
                "
            >
                <p
                    className={`
                        text-[15px]
                        font-bold
                        text-ink
                        ${localizedTextClass()}
                    `}
                >
                    <HighlightedText
                        text={
                            title
                        }
                        query={
                            query
                        }
                    />
                </p>

                {item.example ? (
                    <p
                        className="
                            ltr-lock
                            mt-2
                            text-xs
                            italic
                            text-muted
                        "
                    >
                        <HighlightedText
                            text={
                                item.example
                            }
                            query={
                                query
                            }
                        />
                    </p>
                ) : null}
            </div>

            <span
                className="
                    shrink-0
                    rounded
                    bg-amber-100
                    px-2
                    py-1
                    text-xs
                    font-bold
                    text-amber-700
                "
            >
                {item.level}
            </span>
        </Link>
    );
}

/* -------------------------------------------------------------------------- */
/* News result                                                               */
/* -------------------------------------------------------------------------- */

interface NewsSearchResultProps {
    item:
        NewsIndexItem;

    query:
        string;

    onNavigate:
        () => void;
}

function NewsSearchResult({
    item,
    query,
    onNavigate
}: NewsSearchResultProps) {
    const {
        localizedTextClass,
        localizedValue
    } = useI18n();

    const title =
        localizedValue(
            item.title,
            item.title_fa,
            item.id
        );

    return (
        <Link
            to={
                `/journal/${encodeURIComponent(
                    item.id
                )}`
            }
            data-search-result
            onClick={
                onNavigate
            }
            className="
                block
                rounded-control
                border
                border-line
                bg-neutral-50
                p-3
                text-inherit
                no-underline
                transition
                hover:border-dino-300
                hover:bg-dino-50
                focus-visible:outline-none
                focus-visible:ring-2
                focus-visible:ring-dino-500
            "
        >
            <p
                className={`
                    text-[15px]
                    font-bold
                    text-ink
                    ${localizedTextClass()}
                `}
            >
                <HighlightedText
                    text={
                        title
                    }
                    query={
                        query
                    }
                />
            </p>

            <p
                className="
                    mt-1
                    text-xs
                    text-muted
                "
            >
                {item.publishedDate}

                {" · "}

                {item.level}
            </p>
        </Link>
    );
}

/* -------------------------------------------------------------------------- */
/* Small components                                                          */
/* -------------------------------------------------------------------------- */

interface SearchResultLevelProps {
    level:
        string;
}

function SearchResultLevel({
    level
}: SearchResultLevelProps) {
    return (
        <span
            className="
                shrink-0
                rounded
                bg-dino-50
                px-2
                py-1
                text-xs
                font-bold
                text-dino-700
            "
        >
            {level}
        </span>
    );
}

interface SearchMessageProps {
    children:
        React.ReactNode;

    error?:
        boolean;
}

function SearchMessage({
    children,
    error = false
}: SearchMessageProps) {
    return (
        <p
            className={`
                px-4
                py-10
                text-center
                text-sm
                ${
                    error
                        ? "text-red-700"
                        : "text-muted"
                }
            `}
        >
            {children}
        </p>
    );
}

/* -------------------------------------------------------------------------- */
/* Highlighting                                                              */
/* -------------------------------------------------------------------------- */

interface HighlightedTextProps {
    text:
        string;

    query:
        string;
}

/**
 * Highlighting is presentation-only.
 *
 * Actual matching continues to use searchEngine.ts, including accent removal
 * and Arabic/Persian yeh/kaf normalization.
 */
function HighlightedText({
    text,
    query
}: HighlightedTextProps) {
    const trimmedQuery =
        query.trim();

    if (!trimmedQuery) {
        return text;
    }

    const escapedQuery =
        escapeRegularExpression(
            trimmedQuery
        );

    let expression:
        RegExp;

    try {
        expression =
            new RegExp(
                `(${escapedQuery})`,
                "giu"
            );
    } catch {
        return text;
    }

    const parts =
        text.split(
            expression
        );

    return (
        <>
            {parts.map(
                (
                    part,
                    index
                ) =>
                    part.localeCompare(
                        trimmedQuery,
                        undefined,
                        {
                            sensitivity:
                                "accent"
                        }
                    ) === 0 ? (
                        <mark
                            key={
                                index
                            }
                            className="
                                rounded
                                bg-amber-200
                                px-0.5
                                text-inherit
                            "
                        >
                            {part}
                        </mark>
                    ) : (
                        <span
                            key={
                                index
                            }
                        >
                            {part}
                        </span>
                    )
            )}
        </>
    );
}

function escapeRegularExpression(
    value:
        string
): string {
    return value.replace(
        /[.*+?^${}()|[\]\\]/g,
        "\\$&"
    );
}

export {
    HighlightedText,
    SearchDialog,
    SearchGroup
};
