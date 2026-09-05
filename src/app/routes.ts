/**
 * Durable URL contract for the React application.
 *
 * This module deliberately has no React or browser dependency. It gives the
 * router, integrity checks and tooling one shared description of public paths
 * without reintroducing the historical query-string router.
 */
const appRoutePatterns = {
    auth: "/auth",
    onboarding: "/onboarding",
    home: "/",
    profile: "/profile",
    shop: "/shop",
    grammarIndex: "/grammar",
    grammarLevel: "/grammar/:level",
    grammarLesson: "/grammar/lesson/:lessonId",
    vocabularyIndex: "/vocabulary",
    vocabularyLevel: "/vocabulary/:level",
    vocabularyPack: "/vocabulary/:level/:packId",
    travelIndex: "/travel",
    travelLesson: "/travel/:lessonId",
    journalIndex: "/journal",
    journalArticle: "/journal/:articleId",
    about: "/info/about",
    contact: "/info/contact",
    workWithUs: "/info/work-with-us",
    notFound: "*"
} as const;

const grammarLevels = [
    "A1",
    "A2",
    "B1",
    "B2",
    "C1"
] as const;

const vocabularyLevels = [
    ...grammarLevels,
    "C2"
] as const;

type GrammarLevel =
    typeof grammarLevels[number];

type VocabularyLevel =
    typeof vocabularyLevels[number];

type AppRoute =
    | { name: "auth" }
    | { name: "onboarding" }
    | { name: "home" }
    | { name: "profile" }
    | { name: "shop" }
    | { name: "grammar-index" }
    | { name: "grammar-level"; level: GrammarLevel }
    | { name: "grammar-lesson"; lessonId: string }
    | { name: "vocabulary-index" }
    | { name: "vocabulary-level"; level: VocabularyLevel }
    | {
        name: "vocabulary-pack";
        level: VocabularyLevel;
        packId: string;
    }
    | { name: "travel-index" }
    | { name: "travel-lesson"; lessonId: string }
    | { name: "journal-index" }
    | { name: "journal-article"; articleId: string }
    | { name: "about" }
    | { name: "contact" }
    | { name: "work-with-us" };

type AppRouteSection =
    | "home"
    | "shop"
    | "grammar"
    | "vocabulary"
    | "travel"
    | "journal";

/** Builds one canonical React location from a typed route description. */
function createAppPath(
    route: AppRoute
): string {
    switch (route.name) {
        case "auth":
            return appRoutePatterns.auth;
        case "onboarding":
            return appRoutePatterns.onboarding;
        case "home":
            return appRoutePatterns.home;
        case "profile":
            return appRoutePatterns.profile;
        case "shop":
            return appRoutePatterns.shop;
        case "grammar-index":
            return appRoutePatterns.grammarIndex;
        case "grammar-level":
            return `/grammar/${route.level}`;
        case "grammar-lesson":
            return `/grammar/lesson/${encodeRouteSegment(route.lessonId)}`;
        case "vocabulary-index":
            return appRoutePatterns.vocabularyIndex;
        case "vocabulary-level":
            return `/vocabulary/${route.level}`;
        case "vocabulary-pack":
            return `/vocabulary/${route.level}/${encodeRouteSegment(route.packId)}`;
        case "travel-index":
            return appRoutePatterns.travelIndex;
        case "travel-lesson":
            return `/travel/${encodeRouteSegment(route.lessonId)}`;
        case "journal-index":
            return appRoutePatterns.journalIndex;
        case "journal-article":
            return `/journal/${encodeRouteSegment(route.articleId)}`;
        case "about":
            return appRoutePatterns.about;
        case "contact":
            return appRoutePatterns.contact;
        case "work-with-us":
            return appRoutePatterns.workWithUs;
    }
}

/**
 * Parses a pathname into the same typed route descriptions used to build
 * links. Query strings and hashes are intentionally not part of route identity.
 */
function matchAppPath(
    value: string
): AppRoute | null {
    const pathname = getPathname(value);

    if (!pathname) {
        return null;
    }

    const segments = pathname === "/"
        ? []
        : pathname.slice(1).split("/");

    if (segments.length === 0) {
        return { name: "home" };
    }

    if (segments.length === 1) {
        switch (segments[0]) {
            case "auth":
                return { name: "auth" };
            case "onboarding":
                return { name: "onboarding" };
            case "profile":
                return { name: "profile" };
            case "shop":
                return { name: "shop" };
            case "grammar":
                return { name: "grammar-index" };
            case "vocabulary":
                return { name: "vocabulary-index" };
            case "travel":
                return { name: "travel-index" };
            case "journal":
                return { name: "journal-index" };
        }
    }

    if (
        segments.length === 2
        && segments[0] === "grammar"
        && isGrammarLevel(segments[1])
    ) {
        return {
            name: "grammar-level",
            level: segments[1]
        };
    }

    if (
        segments.length === 3
        && segments[0] === "grammar"
        && segments[1] === "lesson"
    ) {
        return decodedRoute(
            segments[2],
            lessonId => ({ name: "grammar-lesson", lessonId })
        );
    }

    if (
        segments.length === 2
        && segments[0] === "vocabulary"
        && isVocabularyLevel(segments[1])
    ) {
        return {
            name: "vocabulary-level",
            level: segments[1]
        };
    }

    if (
        segments.length === 3
        && segments[0] === "vocabulary"
        && isVocabularyLevel(segments[1])
    ) {
        const level = segments[1];

        return decodedRoute(
            segments[2],
            packId => ({ name: "vocabulary-pack", level, packId })
        );
    }

    if (
        segments.length === 2
        && segments[0] === "travel"
    ) {
        return decodedRoute(
            segments[1],
            lessonId => ({ name: "travel-lesson", lessonId })
        );
    }

    if (
        segments.length === 2
        && segments[0] === "journal"
    ) {
        return decodedRoute(
            segments[1],
            articleId => ({ name: "journal-article", articleId })
        );
    }

    if (
        segments.length === 2
        && segments[0] === "info"
    ) {
        switch (segments[1]) {
            case "about":
                return { name: "about" };
            case "contact":
                return { name: "contact" };
            case "work-with-us":
                return { name: "work-with-us" };
        }
    }

    return null;
}

/** Returns the primary navigation section owning a matched React route. */
function getAppRouteSection(
    route: AppRoute
): AppRouteSection | null {
    if (route.name === "home") {
        return "home";
    }

    if (route.name === "shop") {
        return "shop";
    }

    for (
        const section
        of [
            "grammar",
            "vocabulary",
            "travel",
            "journal"
        ] as const
    ) {
        if (route.name.startsWith(`${section}-`)) {
            return section;
        }
    }

    return null;
}

function getPathname(
    value: string
): string | null {
    if (
        !value.startsWith("/")
        || value.startsWith("//")
        || value.includes("\\")
    ) {
        return null;
    }

    const pathname = value.split(/[?#]/u, 1)[0];

    if (
        !pathname
        || (
            pathname.length > 1
            && pathname.endsWith("/")
        )
    ) {
        return null;
    }

    return pathname;
}

function encodeRouteSegment(
    value: string
): string {
    if (!isSafeRouteSegment(value)) {
        throw new TypeError(
            `Invalid route segment: ${JSON.stringify(value)}`
        );
    }

    return encodeURIComponent(value);
}

function decodedRoute(
    value: string | undefined,
    create: (decoded: string) => AppRoute
): AppRoute | null {
    if (!value) {
        return null;
    }

    try {
        const decoded = decodeURIComponent(value);

        return isSafeRouteSegment(decoded)
            ? create(decoded)
            : null;
    } catch {
        return null;
    }
}

function isSafeRouteSegment(
    value: string
): boolean {
    return (
        value.length > 0
        && value.length <= 160
        && value.trim() === value
        && value !== "."
        && value !== ".."
        && !/[\\/\u0000-\u001f\u007f]/u.test(value)
    );
}

function isGrammarLevel(
    value: string | undefined
): value is GrammarLevel {
    return grammarLevels.some(level => level === value);
}

function isVocabularyLevel(
    value: string | undefined
): value is VocabularyLevel {
    return vocabularyLevels.some(level => level === value);
}

export {
    appRoutePatterns,
    createAppPath,
    getAppRouteSection,
    matchAppPath
};

export type {
    AppRoute,
    AppRouteSection,
    GrammarLevel,
    VocabularyLevel
};
