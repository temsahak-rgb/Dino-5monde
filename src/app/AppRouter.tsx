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
    appRoutePatterns
} from "./routes.js";

import {
    getSafeReturnTo as getSafeInternalReturnTo
} from "../core/returnTo.js";

import {
    AuthPage
} from "../pages/AuthPage.js";

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
    ProfilePage
} from "../pages/ProfilePage.js";

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
 * /auth
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
 * /profile
 */
const routerBasename =
    import.meta.env.BASE_URL;

const router =
    createBrowserRouter([
        {
            path:
                appRoutePatterns.auth,

            Component:
                AuthPage
        },

        {
            path:
                appRoutePatterns.onboarding,

            loader:
                onboardingLoader,

            Component:
                OnboardingPage
        },

        {
            path:
                appRoutePatterns.home,

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

                {
                    path:
                        appRoutePatterns.profile,

                    Component:
                        ProfilePage
                },

                /* ---------------------------------------------------------- */
                /* Grammar                                                    */
                /* ---------------------------------------------------------- */

                {
                    path:
                        appRoutePatterns.grammarIndex,

                    Component:
                        GrammarIndexPage
                },

                {
                    path:
                        appRoutePatterns.grammarLevel,

                    Component:
                        GrammarLevelPage
                },

                {
                    path:
                        appRoutePatterns.grammarLesson,

                    Component:
                        GrammarLessonPage
                },

                /* ---------------------------------------------------------- */
                /* Vocabulary                                                 */
                /* ---------------------------------------------------------- */

                {
                    path:
                        appRoutePatterns.vocabularyIndex,

                    Component:
                        VocabularyIndexPage
                },

                {
                    path:
                        appRoutePatterns.vocabularyLevel,

                    Component:
                        VocabularyLevelPage
                },

                {
                    path:
                        appRoutePatterns.vocabularyPack,

                    Component:
                        VocabularyPackPage
                },

                /* ---------------------------------------------------------- */
                /* Travel                                                     */
                /* ---------------------------------------------------------- */

                {
                    path:
                        appRoutePatterns.travelIndex,

                    Component:
                        TravelIndexPage
                },

                {
                    path:
                        appRoutePatterns.travelLesson,

                    Component:
                        TravelLessonPage
                },

                /* ---------------------------------------------------------- */
                /* Journal                                                    */
                /* ---------------------------------------------------------- */

                {
                    path:
                        appRoutePatterns.journalIndex,

                    Component:
                        JournalIndexPage
                },

                {
                    path:
                        appRoutePatterns.journalArticle,

                    Component:
                        JournalArticlePage
                },

                /* ---------------------------------------------------------- */
                /* Institutional                                              */
                /* ---------------------------------------------------------- */

                {
                    path:
                        appRoutePatterns.about,

                    Component:
                        AboutPage
                },

                {
                    path:
                        appRoutePatterns.contact,

                    Component:
                        ContactPage
                },

                {
                    path:
                        appRoutePatterns.workWithUs,

                    Component:
                        WorkWithUsPage
                },

                /* ---------------------------------------------------------- */
                /* Fallback                                                   */
                /* ---------------------------------------------------------- */

                {
                    path:
                        appRoutePatterns.notFound,

                    Component:
                        NotFoundPage
                }
            ]
        }
    ], {
        basename:
            routerBasename
    });

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
        getRouterRelativeLocation(
            url
        );

    return redirect(
        `/onboarding?returnTo=${encodeURIComponent(
            returnTo
        )}`
    );
}

/**
 * Removes the deployment basename from a browser URL before persisting an
 * onboarding return target. React Router adds the basename back when it
 * navigates, preventing duplicated `/Dino-5monde` segments on GitHub Pages.
 */
function getRouterRelativeLocation(
    url: URL
): string {
    const normalizedBasename =
        routerBasename === "/"
            ? ""
            : routerBasename.replace(
                /\/$/,
                ""
            );

    const pathname =
        normalizedBasename
        && (
            url.pathname === normalizedBasename
            || url.pathname.startsWith(
                `${normalizedBasename}/`
            )
        )
            ? url.pathname.slice(
                normalizedBasename.length
            ) || "/"
            : url.pathname;

    return `${pathname}${url.search}${url.hash}`;
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
    return getSafeInternalReturnTo(
        value,
        {
            blockedPaths: [
                "/onboarding"
            ]
        }
    );
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
