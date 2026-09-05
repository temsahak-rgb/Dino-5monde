import {
    Link
} from "react-router";

import {
    getStaticDataUrl
} from "../../core/staticData.js";

import {
    useI18n
} from "../../i18n/I18nProvider.js";

import type {
    NewsIndexItem
} from "../../types/global.js";

interface NewsCatalogProps {
    articles:
        readonly NewsIndexItem[];
}

/**
 * Editorial Journal catalog.
 *
 * The card component is exported separately because the same presentation can
 * later be reused by HomePage for the current weekly article.
 */
function NewsCatalog({
    articles
}: NewsCatalogProps) {
    return (
        <div
            className="
                grid
                gap-6
            "
        >
            {articles.map(
                article => (
                    <NewsCard
                        key={
                            article.id
                        }
                        article={
                            article
                        }
                    />
                )
            )}
        </div>
    );
}

/* -------------------------------------------------------------------------- */
/* Card                                                                        */
/* -------------------------------------------------------------------------- */

interface NewsCardProps {
    article:
        NewsIndexItem;

    /**
     * Compact mode is useful when embedding the card outside the Journal.
     */
    compact?: boolean;
}

function NewsCard({
    article,
    compact = false
}: NewsCardProps) {
    const {
        localizedTextClass,
        localizedValue,
        t
    } = useI18n();

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

    const imageUrl =
        resolveNewsImage(
            article.image
        );

    return (
        <Link
            to={
                `/journal/${encodeURIComponent(
                    article.id
                )}`
            }
            className="
                group
                block
                overflow-hidden
                rounded-card
                bg-surface
                text-inherit
                no-underline
                shadow-md
                transition
                hover:-translate-y-0.5
                hover:shadow-lg
                focus-visible:outline-none
                focus-visible:ring-2
                focus-visible:ring-dino-500
                focus-visible:ring-offset-2
            "
        >
            <article>
                <div
                    className={`
                        relative
                        overflow-hidden
                        bg-neutral-100
                        ${
                            compact
                                ? "h-[230px]"
                                : "h-[280px] sm:h-[350px]"
                        }
                    `}
                >
                    <img
                        src={
                            imageUrl
                        }
                        alt={
                            title
                        }
                        loading="lazy"
                        className="
                            h-full
                            w-full
                            object-cover
                            transition
                            duration-300
                            group-hover:scale-[1.02]
                        "
                    />

                    {/* ------------------------------------------------------ */}
                    {/* Metadata badges                                       */}
                    {/* ------------------------------------------------------ */}

                    <div
                        className="
                            absolute
                            end-3
                            top-3
                            flex
                            flex-wrap
                            justify-end
                            gap-2
                        "
                    >
                        {article.level ? (
                            <span
                                className="
                                    rounded-control
                                    bg-dino-600
                                    px-2.5
                                    py-1.5
                                    text-xs
                                    font-bold
                                    text-white
                                    shadow-sm
                                "
                            >
                                {article.level}
                            </span>
                        ) : null}

                        <span
                            className="
                                rounded-control
                                bg-black/70
                                px-2.5
                                py-1.5
                                text-xs
                                font-bold
                                text-white
                                backdrop-blur-sm
                            "
                        >
                            📰
                            {" "}
                            {t(
                                "news.weekly"
                            )}
                        </span>
                    </div>

                    {/* ------------------------------------------------------ */}
                    {/* Overlay                                                */}
                    {/* ------------------------------------------------------ */}

                    <div
                        className="
                            absolute
                            inset-x-0
                            bottom-0
                            bg-gradient-to-t
                            from-black/90
                            via-black/55
                            to-transparent
                            px-4
                            pb-4
                            pt-16
                            text-white
                            sm:px-6
                            sm:pb-6
                        "
                    >
                        <h2
                            className={`
                                font-bold
                                leading-tight
                                text-white
                                ${
                                    compact
                                        ? "text-xl"
                                        : "text-xl sm:text-2xl"
                                }
                                ${localizedTextClass()}
                            `}
                        >
                            {title}
                        </h2>

                        {subtitle ? (
                            <p
                                className={`
                                    mt-2
                                    line-clamp-2
                                    text-sm
                                    leading-6
                                    text-white/90
                                    ${localizedTextClass()}
                                `}
                            >
                                {subtitle}
                            </p>
                        ) : null}

                        <span
                            className="
                                mt-4
                                inline-block
                                text-sm
                                font-bold
                                text-white
                                underline
                                decoration-white/70
                                underline-offset-4
                            "
                        >
                            {t(
                                "news.readMore"
                            )}
                        </span>
                    </div>
                </div>

                {/* ---------------------------------------------------------- */}
                {/* Footer                                                     */}
                {/* ---------------------------------------------------------- */}

                <footer
                    className="
                        flex
                        flex-wrap
                        items-center
                        gap-x-4
                        gap-y-2
                        border-t
                        border-line
                        px-4
                        py-3
                        text-sm
                        text-muted
                        sm:px-6
                    "
                >
                    <span>
                        📅
                        {" "}
                        {article.publishedDate}
                    </span>
                </footer>
            </article>
        </Link>
    );
}

/* -------------------------------------------------------------------------- */
/* Static resources                                                            */
/* -------------------------------------------------------------------------- */

/**
 * News images in the current corpus use paths such as:
 *
 * ./data/news/images/azadi-tower.jpg
 *
 * Resolving them through staticData prevents `/journal/:articleId` from
 * turning that relative URL into `/journal/data/...`.
 */
function resolveNewsImage(
    source: string
): string {
    const normalized =
        source.trim();

    if (!normalized) {
        return "";
    }

    if (
        /^https?:\/\//i.test(
            normalized
        )
        || normalized.startsWith(
            "data:"
        )
        || normalized.startsWith(
            "blob:"
        )
    ) {
        return normalized;
    }

    return getStaticDataUrl(
        normalized
    );
}

export {
    NewsCard,
    NewsCatalog,
    resolveNewsImage
};
