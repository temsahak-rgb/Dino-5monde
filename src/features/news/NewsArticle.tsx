import {
    useState
} from "react";

import {
    Link
} from "react-router";

import {
    useI18n
} from "../../i18n/I18nProvider.js";

import type {
    NewsArticle as NewsArticleData,
    NewsGrammarItem,
    NewsSource,
    NewsVocabularyItem
} from "../../types/global.js";

import {
    BackButton,
    Badge,
    Card
} from "../../ui/components/Controls.js";

import {
    resolveNewsImage
} from "./NewsCatalog.js";

interface NewsArticleProps {
    article:
        NewsArticleData;

    vocabulary:
        readonly NewsVocabularyItem[];

    grammar:
        readonly NewsGrammarItem[];

    hasHiddenGrammar:
        boolean;
}

type NewsTextMode =
    "full"
    | "simple";

/**
 * Complete editorial article.
 *
 * CEFR filtering is already performed by JournalArticlePage /
 * newsRepository before this component is rendered.
 */
function NewsArticle({
    article,
    vocabulary,
    grammar,
    hasHiddenGrammar
}: NewsArticleProps) {
    const {
        localizedTextClass,
        localizedValue,
        t
    } = useI18n();

    const [
        textMode,
        setTextMode
    ] =
        useState<NewsTextMode>(
            "full"
        );

    const title =
        localizedValue(
            article.title,
            article.title_fa,
            article.id
        );

    const subtitle =
        localizedValue(
            article.subtitle,
            article.subtitle_fa
        );

    const image =
        resolveNewsImage(
            article.image
        );

    const displayedText =
        textMode === "full"
            ? article.content.fullText
            : article.content.simpleText;

    return (
        <article
            className="
                mx-auto
                w-full
                max-w-[900px]
            "
        >
            <BackButton
                fallback="/journal"
            >
                ←
                {" "}
                {t(
                    "common.back"
                )}
            </BackButton>

            {/* -------------------------------------------------------------- */}
            {/* Hero                                                           */}
            {/* -------------------------------------------------------------- */}

            {image ? (
                <img
                    src={
                        image
                    }
                    alt={
                        article.imageAlt
                        || title
                    }
                    className="
                        mt-5
                        max-h-[500px]
                        w-full
                        rounded-card
                        object-cover
                    "
                />
            ) : null}

            <div
                className="
                    mt-5
                    flex
                    flex-wrap
                    items-center
                    gap-3
                "
            >
                {article.level ? (
                    <Badge>
                        {article.level}
                    </Badge>
                ) : null}

                <span
                    className="
                        text-sm
                        text-muted
                    "
                >
                    📅
                    {" "}
                    {article.publishedDate}
                </span>
            </div>

            <h1
                className={`
                    mt-4
                    text-2xl
                    font-bold
                    leading-tight
                    text-ink
                    sm:text-3xl
                    ${localizedTextClass()}
                `}
            >
                {title}
            </h1>

            {subtitle ? (
                <p
                    className={`
                        mt-3
                        text-base
                        leading-7
                        text-neutral-600
                        ${localizedTextClass()}
                    `}
                >
                    {subtitle}
                </p>
            ) : null}

            {/* -------------------------------------------------------------- */}
            {/* Text mode                                                      */}
            {/* -------------------------------------------------------------- */}

            <div
                className="
                    mt-7
                    grid
                    grid-cols-2
                    gap-2
                    rounded-card
                    bg-neutral-50
                    p-2
                "
            >
                <NewsModeButton
                    active={
                        textMode
                        === "full"
                    }
                    onClick={() => {
                        setTextMode(
                            "full"
                        );
                    }}
                >
                    📖
                    {" "}
                    {t(
                        "news.fullText"
                    )}
                </NewsModeButton>

                <NewsModeButton
                    active={
                        textMode
                        === "simple"
                    }
                    onClick={() => {
                        setTextMode(
                            "simple"
                        );
                    }}
                >
                    🌱
                    {" "}
                    {t(
                        "news.simpleText"
                    )}
                </NewsModeButton>
            </div>

            {/* -------------------------------------------------------------- */}
            {/* Article                                                        */}
            {/* -------------------------------------------------------------- */}

            <Card
                className={`
                    mt-5
                    p-5
                    sm:p-7
                    ${
                        textMode
                            === "simple"
                            ? `
                                border-dino-300
                                bg-dino-50
                            `
                            : ""
                    }
                `}
            >
                {textMode
                    === "simple" ? (
                    <p
                        className="
                            mb-3
                            text-sm
                            font-bold
                            text-dino-700
                        "
                    >
                        🌱
                        {" "}
                        {t(
                            "news.simplifiedVersion"
                        )}
                    </p>
                ) : null}

                <div
                    className="
                        ltr-lock
                        whitespace-pre-line
                        text-base
                        leading-8
                        text-neutral-700
                    "
                >
                    {displayedText}
                </div>
            </Card>

            {/* -------------------------------------------------------------- */}
            {/* Vocabulary                                                     */}
            {/* -------------------------------------------------------------- */}

            {vocabulary.length > 0 ? (
                <NewsVocabulary
                    vocabulary={
                        vocabulary
                    }
                />
            ) : null}

            {/* -------------------------------------------------------------- */}
            {/* Grammar                                                        */}
            {/* -------------------------------------------------------------- */}

            {grammar.length > 0 ? (
                <NewsGrammar
                    grammar={
                        grammar
                    }
                />
            ) : hasHiddenGrammar ? (
                <div
                    className="
                        mt-5
                        rounded-card
                        border
                        border-amber-200
                        bg-amber-50
                        p-4
                        text-center
                        text-sm
                        text-amber-900
                    "
                >
                    {t(
                        "news.advancedGrammarHidden"
                    )}
                </div>
            ) : null}

            {/* -------------------------------------------------------------- */}
            {/* Sources                                                        */}
            {/* -------------------------------------------------------------- */}

            {article.sources?.length ? (
                <NewsSources
                    sources={
                        article.sources
                    }
                />
            ) : null}
        </article>
    );
}

/* -------------------------------------------------------------------------- */
/* Mode selector                                                               */
/* -------------------------------------------------------------------------- */

interface NewsModeButtonProps {
    active:
        boolean;

    onClick:
        () => void;

    children:
        React.ReactNode;
}

function NewsModeButton({
    active,
    onClick,
    children
}: NewsModeButtonProps) {
    return (
        <button
            type="button"
            aria-pressed={
                active
            }
            onClick={
                onClick
            }
            className={`
                rounded-control
                border-2
                px-3
                py-2.5
                text-sm
                font-bold
                transition
                focus-visible:outline-none
                focus-visible:ring-2
                focus-visible:ring-dino-500
                focus-visible:ring-offset-1
                ${
                    active
                        ? `
                            border-dino-600
                            bg-dino-600
                            text-white
                        `
                        : `
                            border-line
                            bg-surface
                            text-ink
                            hover:border-dino-300
                            hover:bg-dino-50
                        `
                }
            `}
        >
            {children}
        </button>
    );
}

/* -------------------------------------------------------------------------- */
/* Vocabulary                                                                  */
/* -------------------------------------------------------------------------- */

interface NewsVocabularyProps {
    vocabulary:
        readonly NewsVocabularyItem[];
}

function NewsVocabulary({
    vocabulary
}: NewsVocabularyProps) {
    const {
        t
    } = useI18n();

    return (
        <details
            className="
                mt-5
                overflow-hidden
                rounded-card
                border
                border-line
                bg-surface
            "
        >
            <summary
                className="
                    flex
                    cursor-pointer
                    items-center
                    justify-between
                    gap-4
                    bg-neutral-50
                    px-5
                    py-4
                    font-bold
                    text-dino-700
                "
            >
                <span>
                    📚
                    {" "}
                    {t(
                        "news.keyVocabulary"
                    )}
                </span>
            </summary>

            <div
                className="
                    grid
                    gap-3
                    border-t
                    border-line
                    p-5
                    sm:grid-cols-2
                "
            >
                {vocabulary.map(
                    (
                        word,
                        index
                    ) => (
                        <div
                            key={
                                `${word.fr}:${index}`
                            }
                            className="
                                border-e-4
                                border-dino-500
                                bg-neutral-50
                                px-4
                                py-3
                            "
                        >
                            <div
                                className="
                                    ltr-lock
                                    flex
                                    flex-wrap
                                    items-center
                                    gap-2
                                    text-[15px]
                                    font-bold
                                    text-ink
                                "
                            >
                                <span>
                                    {word.fr}
                                </span>

                                {word.level ? (
                                    <Badge>
                                        {word.level}
                                    </Badge>
                                ) : null}
                            </div>

                            <p
                                className="
                                    persian-text
                                    mt-1
                                    text-sm
                                    text-muted
                                "
                            >
                                {word.fa}
                            </p>
                        </div>
                    )
                )}
            </div>
        </details>
    );
}

/* -------------------------------------------------------------------------- */
/* Grammar                                                                     */
/* -------------------------------------------------------------------------- */

interface NewsGrammarProps {
    grammar:
        readonly NewsGrammarItem[];
}

function NewsGrammar({
    grammar
}: NewsGrammarProps) {
    const {
        t
    } = useI18n();

    return (
        <details
            className="
                mt-5
                overflow-hidden
                rounded-card
                border
                border-line
                bg-surface
            "
        >
            <summary
                className="
                    cursor-pointer
                    bg-neutral-50
                    px-5
                    py-4
                    font-bold
                    text-dino-700
                "
            >
                📐
                {" "}
                {t(
                    "news.grammarPoints"
                )}
            </summary>

            <div
                className="
                    grid
                    gap-4
                    border-t
                    border-line
                    p-5
                "
            >
                {grammar.map(
                    (
                        item,
                        index
                    ) => (
                        <NewsGrammarItemView
                            key={
                                `${item.title}:${index}`
                            }
                            item={
                                item
                            }
                            index={
                                index
                            }
                        />
                    )
                )}
            </div>
        </details>
    );
}

interface NewsGrammarItemViewProps {
    item:
        NewsGrammarItem;

    index:
        number;
}

function NewsGrammarItemView({
    item,
    index
}: NewsGrammarItemViewProps) {
    const {
        t
    } = useI18n();

    return (
        <div
            className="
                rounded-card
                border
                border-line
                bg-neutral-50
                p-4
                sm:p-5
            "
        >
            <div
                className="
                    flex
                    flex-wrap
                    items-center
                    gap-2
                "
            >
                <h3
                    className="
                        text-base
                        font-bold
                        text-ink
                    "
                >
                    {index + 1}.
                    {" "}
                    {item.title}
                </h3>

                {item.level ? (
                    <Badge>
                        {item.level}
                    </Badge>
                ) : null}
            </div>

            <div
                className="
                    ltr-lock
                    mt-3
                    border-s-4
                    border-dino-500
                    bg-surface
                    px-4
                    py-3
                    text-[15px]
                    italic
                    leading-7
                    text-neutral-700
                "
            >
                {item.example}
            </div>

            {item.translation ? (
                <p
                    className="
                        persian-text
                        mt-3
                        text-sm
                        leading-6
                        text-neutral-600
                    "
                >
                    {item.translation}
                </p>
            ) : null}

            {item.explanation ? (
                <p
                    className="
                        persian-text
                        mt-2
                        text-sm
                        leading-6
                        text-muted
                    "
                >
                    💡
                    {" "}
                    {item.explanation}
                </p>
            ) : null}

            {item.grammarId ? (
                <Link
                    to={
                        `/grammar/lesson/${encodeURIComponent(
                            item.grammarId
                        )}`
                    }
                    className="
                        mt-4
                        inline-block
                        rounded-control
                        bg-dino-50
                        px-3
                        py-2
                        text-sm
                        font-bold
                        text-dino-700
                        no-underline
                        transition
                        hover:bg-dino-100
                    "
                >
                    🔗
                    {" "}
                    {t(
                        "news.viewGrammarLesson"
                    )}
                </Link>
            ) : item.level ? (
                <p
                    className="
                        mt-3
                        text-xs
                        text-muted
                    "
                >
                    {t(
                        "news.grammarLevel",
                        {
                            level:
                                item.level
                        }
                    )}
                </p>
            ) : null}
        </div>
    );
}

/* -------------------------------------------------------------------------- */
/* Sources                                                                     */
/* -------------------------------------------------------------------------- */

interface NewsSourcesProps {
    sources:
        readonly NewsSource[];
}

function NewsSources({
    sources
}: NewsSourcesProps) {
    const {
        t
    } = useI18n();

    return (
        <details
            className="
                mt-5
                overflow-hidden
                rounded-card
                border
                border-line
                bg-surface
            "
        >
            <summary
                className="
                    cursor-pointer
                    bg-neutral-50
                    px-5
                    py-4
                    font-bold
                    text-ink
                "
            >
                📖
                {" "}
                {t(
                    "news.sources"
                )}
            </summary>

            <div
                className="
                    grid
                    gap-2
                    border-t
                    border-line
                    p-5
                "
            >
                {sources.map(
                    (
                        source,
                        index
                    ) => (
                        <a
                            key={
                                `${source.url}:${index}`
                            }
                            href={
                                source.url
                            }
                            target="_blank"
                            rel="noopener noreferrer"
                            className="
                                flex
                                items-center
                                justify-between
                                gap-4
                                rounded-control
                                border
                                border-line
                                bg-surface
                                px-4
                                py-3
                                font-semibold
                                text-dino-700
                                no-underline
                                transition
                                hover:border-dino-300
                                hover:bg-dino-50
                            "
                        >
                            <span>
                                {source.title}
                            </span>

                            <span
                                aria-hidden="true"
                            >
                                ↗
                            </span>
                        </a>
                    )
                )}
            </div>
        </details>
    );
}

export {
    NewsArticle,
    NewsGrammar,
    NewsGrammarItemView,
    NewsModeButton,
    NewsSources,
    NewsVocabulary
};