import {
    useEffect,
    useState
} from "react";

import {
    Link
} from "react-router";

import {
    getPlacementResult
} from "../core/placementEngine.js";

import {
    NewsCard
} from "../features/news/NewsCatalog.js";

import {
    loadCurrentNews
} from "../features/news/newsRepository.js";

import {
    useI18n
} from "../i18n/I18nProvider.js";

import type {
    Level,
    NewsIndexItem
} from "../types/global.js";

import {
    Page
} from "../ui/components/Layout.js";

/**
 * Application home page.
 *
 * Responsibilities:
 *
 * - display the learner's current CEFR level
 * - display the latest editorial article when available
 * - expose the principal learning sections
 *
 * News loading now uses newsRepository instead of the historical DOM
 * controller.
 */
function HomePage() {
    const {
        t
    } = useI18n();

    const level:
        Level =
        getPlacementResult()
        ?? "A1";

    const [
        currentNews,
        setCurrentNews
    ] =
        useState<
            NewsIndexItem
            | null
        >(
            null
        );

    useEffect(
        () => {
            let active =
                true;

            async function load():
                Promise<void> {
                try {
                    const news =
                        await loadCurrentNews();

                    if (!active) {
                        return;
                    }

                    setCurrentNews(
                        news
                    );
                } catch (error) {
                    /*
                     * News is optional on Home. A network/editorial-data error
                     * must not prevent access to the learning application.
                     */
                    console.warn(
                        "Home news skipped:",
                        error
                    );
                }
            }

            void load();

            return () => {
                active =
                    false;
            };
        },
        []
    );

    return (
        <Page>
            {/* -------------------------------------------------------------- */}
            {/* Learner header                                                 */}
            {/* -------------------------------------------------------------- */}

            <header
                className="
                    mb-7
                    sm:mb-9
                "
            >
                <div
                    className="
                        flex
                        items-start
                        gap-3
                        sm:items-center
                        sm:gap-4
                    "
                >
                    <span
                        className="
                            text-4xl
                            leading-none
                            sm:text-5xl
                        "
                        aria-hidden="true"
                    >
                        🦖
                    </span>

                    <h1
                        className="
                            text-2xl
                            font-bold
                            leading-tight
                            text-ink
                            sm:text-3xl
                        "
                    >
                        {t(
                            "home.greeting"
                        )}
                    </h1>
                </div>

                <p
                    className="
                        mt-3
                        text-base
                        text-muted
                    "
                >
                    <strong
                        className="
                            font-bold
                            text-dino-700
                        "
                    >
                        {level}
                    </strong>

                    {" · "}

                    {t(
                        "home.currentLevel"
                    )}
                </p>
            </header>

            {/* -------------------------------------------------------------- */}
            {/* Current article                                                */}
            {/* -------------------------------------------------------------- */}

            {currentNews ? (
                <section
                    className="
                        mb-10
                    "
                >
                    <NewsCard
                        article={
                            currentNews
                        }
                    />
                </section>
            ) : null}

            {/* -------------------------------------------------------------- */}
            {/* Learning highlights                                            */}
            {/* -------------------------------------------------------------- */}

            <section>
                <div
                    className="
                        mb-5
                        flex
                        items-center
                        justify-between
                        gap-4
                    "
                >
                    <h2
                        className="
                            text-lg
                            font-bold
                            text-ink
                            sm:text-xl
                        "
                    >
                        {t(
                            "home.newsAdvice"
                        )}
                    </h2>

                    <Link
                        to="/journal"
                        className="
                            text-sm
                            font-bold
                            inline-flex
                            min-h-11
                            items-center
                            text-dino-700
                            no-underline
                            hover:underline
                            hover:underline-offset-4
                        "
                    >
                        {t(
                            "news.journalTitle"
                        )}
                        {" "}
                        →
                    </Link>
                </div>

                <div
                    className="
                        grid
                        gap-4
                        md:grid-cols-2
                    "
                >
                    <HomeHighlightCard
                        to="/grammar"
                        icon="📖"
                        label={
                            t(
                                "home.grammarLabel"
                            )
                        }
                        title={
                            t(
                                "home.grammarTitle"
                            )
                        }
                        meta={
                            t(
                                "home.grammarMeta"
                            )
                        }
                        featured
                    />

                    <HomeHighlightCard
                        to="/vocabulary"
                        icon="🏦"
                        label={
                            t(
                                "home.dailyLabel"
                            )
                        }
                        title={
                            t(
                                "home.dailyTitle"
                            )
                        }
                        meta={
                            t(
                                "home.dailyMeta"
                            )
                        }
                    />

                    <HomeHighlightCard
                        to="/travel"
                        icon="✈️"
                        label={
                            t(
                                "home.travelLabel"
                            )
                        }
                        title={
                            t(
                                "home.travelTitle"
                            )
                        }
                        meta={
                            t(
                                "home.travelMeta"
                            )
                        }
                    />

                    <HomeHighlightCard
                        to="/journal"
                        icon="✨"
                        label={
                            t(
                                "home.tipLabel"
                            )
                        }
                        title={
                            t(
                                "home.tipTitle"
                            )
                        }
                        meta={
                            t(
                                "home.tipMeta"
                            )
                        }
                    />
                </div>
            </section>
        </Page>
    );
}

/* -------------------------------------------------------------------------- */
/* Highlight card                                                             */
/* -------------------------------------------------------------------------- */

interface HomeHighlightCardProps {
    to:
        string;

    icon:
        string;

    label:
        string;

    title:
        string;

    meta:
        string;

    featured?:
        boolean;
}

function HomeHighlightCard({
    to,
    icon,
    label,
    title,
    meta,
    featured = false
}: HomeHighlightCardProps) {
    return (
        <Link
            to={
                to
            }
            className={`
                group
                overflow-hidden
                rounded-card
                border
                border-line
                bg-surface
                text-inherit
                no-underline
                shadow-sm
                transition
                hover:-translate-y-0.5
                hover:border-dino-300
                hover:shadow-md
                focus-visible:outline-none
                focus-visible:ring-2
                focus-visible:ring-dino-500
                focus-visible:ring-offset-2
                ${
                    featured
                        ? "md:col-span-2"
                        : ""
                }
            `}
        >
            <div
                className={`
                    flex
                    items-center
                    justify-center
                    bg-dino-50
                    ${
                        featured
                            ? "h-36 sm:h-44"
                            : "h-24 sm:h-28"
                    }
                `}
            >
                <span
                    className={`
                        leading-none
                        transition
                        group-hover:scale-105
                        ${
                            featured
                                ? "text-6xl"
                                : "text-5xl"
                        }
                    `}
                    aria-hidden="true"
                >
                    {icon}
                </span>
            </div>

            <div
                className="
                    p-4
                    sm:p-5
                "
            >
                <p
                    className="
                        text-xs
                        font-bold
                        uppercase
                        tracking-wider
                        text-dino-700
                    "
                >
                    {label}
                </p>

                <h3
                    className={`
                        mt-2
                        font-semibold
                        leading-snug
                        text-ink
                        ${
                            featured
                                ? "text-lg"
                                : "text-base"
                        }
                    `}
                >
                    {title}
                </h3>

                <p
                    className="
                        mt-2
                        text-sm
                        text-muted
                    "
                >
                    {meta}
                </p>
            </div>
        </Link>
    );
}

export {
    HomeHighlightCard,
    HomePage
};
