import {
    createBrowserRouter,
    redirect,
    type LoaderFunctionArgs
} from "react-router";

import {
    RouterProvider
} from "react-router/dom";

import {
    AppLayout
} from "./AppLayout.js";

import {
    GrammarIndexPage
} from "../pages/GrammarIndexPage.js";

import {
    GrammarLessonPage
} from "../pages/GrammarLessonPage.js";

import {
    GrammarLevelPage
} from "../pages/GrammarLevelPage.js";

import {
    HomePage
} from "../pages/HomePage.js";

import {
    JournalArticlePage
} from "../pages/JournalArticlePage.js";

import {
    JournalIndexPage
} from "../pages/JournalIndexPage.js";

import {
    NotFoundPage
} from "../pages/NotFoundPage.js";

import {
    OnboardingPage
} from "../pages/OnboardingPage.js";

import {
    AboutPage
} from "../pages/AboutPage.js";

import {
    ContactPage
} from "../pages/ContactPage.js";

import {
    WorkWithUsPage
} from "../pages/WorkWithUsPage.js";

import {
    TravelIndexPage
} from "../pages/TravelIndexPage.js";

import {
    TravelLessonPage
} from "../pages/TravelLessonPage.js";

import {
    VocabularyIndexPage
} from "../pages/VocabularyIndexPage.js";

import {
    VocabularyLevelPage
} from "../pages/VocabularyLevelPage.js";

import {
    VocabularyPackPage
} from "../pages/VocabularyPackPage.js";

/**
 * Dino application router.
 *
 * Navigation now uses durable React routes instead of the historical custom
 * query-string router.
 *
 * Public route:
 *
 * /onboarding
 *
 * Application routes:
 *
 * /
 *
 * /grammar
 * /grammar/:level
 * /grammar/lesson/:lessonId
 *
 * /vocabulary
 * /vocabulary/:level
 * /vocabulary/:level/:packId
 *
 * /travel
 * /travel/:lessonId
 *
 * /journal
 * /journal/:articleId
 *
 * /info/about
 * /info/contact
 * /info/work-with-us
 */
const router =
    createBrowserRouter([
        {
            path:
                "/onboarding",

            loader:
                onboardingLoader,

            Component:
                OnboardingPage
        },

        {
            path:
                "/",

            loader:
                requireCompletedOnboarding,

            Component:
                AppLayout,

            children: [
                {
                    index:
                        true,

                    Component:
                        HomePage
                },

                /* ---------------------------------------------------------- */
                /* Grammar                                                    */
                /* ---------------------------------------------------------- */

                {
                    path:
                        "grammar",

                    Component:
                        GrammarIndexPage
                },

                {
                    path:
                        "grammar/:level",

                    Component:
                        GrammarLevelPage
                },

                {
                    path:
                        "grammar/lesson/:lessonId",

                    Component:
                        GrammarLessonPage
                },

                /* ---------------------------------------------------------- */
                /* Vocabulary                                                 */
                /* ---------------------------------------------------------- */

                {
                    path:
                        "vocabulary",

                    Component:
                        VocabularyIndexPage
                },

                {
                    path:
                        "vocabulary/:level",

                    Component:
                        VocabularyLevelPage
                },

                {
                    path:
                        "vocabulary/:level/:packId",

                    Component:
                        VocabularyPackPage
                },

                /* ---------------------------------------------------------- */
                /* Travel                                                     */
                /* ---------------------------------------------------------- */

                {
                    path:
                        "travel",

                    Component:
                        TravelIndexPage
                },

                {
                    path:
                        "travel/:lessonId",

                    Component:
                        TravelLessonPage
                },

                /* ---------------------------------------------------------- */
                /* Journal                                                    */
                /* ---------------------------------------------------------- */

                {
                    path:
                        "journal",

                    Component:
                        JournalIndexPage
                },

                {
                    path:
                        "journal/:articleId",

                    Component:
                        JournalArticlePage
                },

                /* ---------------------------------------------------------- */
                /* Institutional                                              */
                /* ---------------------------------------------------------- */

                {
                    path:
                        "info/about",

                    Component:
                        AboutPage
                },

                {
                    path:
                        "info/contact",

                    Component:
                        ContactPage
                },

                {
                    path:
                        "info/work-with-us",

                    Component:
                        WorkWithUsPage
                },

                /* ---------------------------------------------------------- */
                /* Fallback                                                   */
                /* ---------------------------------------------------------- */

                {
                    path:
                        "*",

                    Component:
                        NotFoundPage
                }
            ]
        }
    ]);

/**
 * Protects the learning application until onboarding has enough persisted
 * information to operate.
 *
 * The complete requested location is stored in `returnTo`, allowing links such
 * as:
 *
 * /grammar/lesson/A1-G-001
 *
 * to continue to their original target after onboarding.
 */
function requireCompletedOnboarding({
    request
}: LoaderFunctionArgs) {
    if (
        hasCompletedOnboarding()
    ) {
        return null;
    }

    const url =
        new URL(
            request.url
        );

    const returnTo =
        `${url.pathname}${url.search}${url.hash}`;

    return redirect(
        `/onboarding?returnTo=${encodeURIComponent(
            returnTo
        )}`
    );
}

/**
 * Prevents users with completed onboarding from being sent through the flow
 * again.
 */
function onboardingLoader({
    request
}: LoaderFunctionArgs) {
    if (
        !hasCompletedOnboarding()
    ) {
        return null;
    }

    const url =
        new URL(
            request.url
        );

    const returnTo =
        getSafeReturnTo(
            url.searchParams.get(
                "returnTo"
            )
        );

    return redirect(
        returnTo
    );
}

/**
 * Dino currently considers onboarding complete when:
 *
 * - a supported interface language is persisted
 * - a supported learning path is persisted
 *
 * Placement remains optional because the learner may explicitly choose to
 * postpone the test.
 */
function hasCompletedOnboarding():
    boolean {
    const language =
        localStorage.getItem(
            "language"
        );

    const path =
        localStorage.getItem(
            "currentPath"
        );

    const languageValid =
        language === "fr"
        || language === "fa";

    const pathValid =
        path === "general"
        || path === "travel";

    return (
        languageValid
        && pathValid
    );
}

/**
 * Sanitizes a post-onboarding destination.
 *
 * Only internal absolute application paths are accepted.
 *
 * This prevents:
 *
 * - external redirects
 * - protocol-relative `//example.com`
 * - malformed values
 * - redirect loops back to onboarding
 */
function getSafeReturnTo(
    value:
        string | null
): string {
    if (!value) {
        return "/";
    }

    let decoded =
        value;

    try {
        decoded =
            decodeURIComponent(
                value
            );
    } catch {
        /*
         * React Router / URLSearchParams normally already provides a decoded
         * value. A malformed manual URL simply falls back to the home page.
         */
        return "/";
    }

    if (
        !decoded.startsWith(
            "/"
        )
        || decoded.startsWith(
            "//"
        )
        || decoded.includes(
            "\\"
        )
    ) {
        return "/";
    }

    try {
        const candidate =
            new URL(
                decoded,
                window.location.origin
            );

        if (
            candidate.origin
            !== window.location.origin
        ) {
            return "/";
        }

        if (
            candidate.pathname
            === "/onboarding"
        ) {
            return "/";
        }

        return (
            `${candidate.pathname}${candidate.search}${candidate.hash}`
        );
    } catch {
        return "/";
    }
}

function AppRouter() {
    return (
        <RouterProvider
            router={
                router
            }
        />
    );
}

export {
    AppRouter,
    getSafeReturnTo,
    hasCompletedOnboarding
};