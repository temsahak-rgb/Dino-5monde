import type {
    AppSection,
    GrammarLevel,
    InstitutionalPage,
    Level
} from "../types/global.js";

export type AppRoute =
    | Readonly<{
        view: "home";
    }>
    | Readonly<{
        view: "grammar";
        target: "index";
    }>
    | Readonly<{
        view: "grammar";
        target: "level";
        level: GrammarLevel;
    }>
    | Readonly<{
        view: "grammar";
        target: "lesson";
        lessonId: string;
    }>
    | Readonly<{
        view: "vocabulary";
        target: "index";
    }>
    | Readonly<{
        view: "vocabulary";
        target: "level";
        level: Level;
    }>
    | Readonly<{
        view: "vocabulary";
        target: "pack";
        level: Level;
        packId: string;
    }>
    | Readonly<{
        view: "travel";
        target: "index";
    }>
    | Readonly<{
        view: "travel";
        target: "lesson";
        lessonId: string;
    }>
    | Readonly<{
        view: "journal";
        target: "index";
    }>
    | Readonly<{
        view: "journal";
        target: "article";
        articleId: string;
    }>
    | Readonly<{
        view: "info";
        page: InstitutionalPage;
    }>;

export {
    createSectionRoute,
    getRouteSection,
    parseAppRoute,
    serializeAppRoute
};

const grammarLessonIdPattern =
    /^(?:A1|A2|B1|B2|C1)-G-[0-9]{3}(?:-[A-Z])?$/;
const vocabularyPackIdPattern =
    /^(?=.{1,120}$)[A-Za-z0-9]+(?:[_-][A-Za-z0-9]+)*$/;
const travelLessonIdPattern =
    /^[A-Za-z0-9](?:[A-Za-z0-9 _-]{0,118}[A-Za-z0-9])?$/;
const newsArticleIdPattern =
    /^(?=.{1,160}$)[0-9]{4}-w[0-9]{2}-[a-z0-9]+(?:-[a-z0-9]+)*$/;

/**
 * Reads an unambiguous query parameter.
 *
 * `undefined` means the parameter appeared more than once and is therefore
 * rejected. `null` means it is absent.
 */
function readSingleParameter(
    params: URLSearchParams,
    name: string
): string | null | undefined {
    const values = params.getAll(name);

    if (values.length === 0) {
        return null;
    }

    if (values.length > 1) {
        return undefined;
    }

    return values[0];
}

/** Returns a supported CEFR level or null. */
function parseLevel(
    value: string | null
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

/** Returns a shipped Grammar level or null. */
function parseGrammarLevel(
    value: string | null
): GrammarLevel | null {
    const level = parseLevel(value);

    return level === "C2"
        ? null
        : level;
}

/** Returns a supported institutional page or null. */
function parseInstitutionalPage(
    value: string | null
): InstitutionalPage | null {
    switch (value) {
        case "about":
        case "contact":
        case "work-with-us":
            return value;

        default:
            return null;
    }
}

/** Parses the Grammar branch of the canonical query contract. */
function parseGrammarRoute(
    params: URLSearchParams
): AppRoute | null {
    const levelValue =
        readSingleParameter(
            params,
            "level"
        );
    const lessonId =
        readSingleParameter(
            params,
            "lesson"
        );

    if (
        levelValue === undefined
        || lessonId === undefined
        || (
            levelValue !== null
            && lessonId !== null
        )
    ) {
        return null;
    }

    if (lessonId !== null) {
        return grammarLessonIdPattern.test(
            lessonId
        )
            ? {
                view: "grammar",
                target: "lesson",
                lessonId
            }
            : null;
    }

    if (levelValue !== null) {
        const level =
            parseGrammarLevel(
                levelValue
            );

        return level
            ? {
                view: "grammar",
                target: "level",
                level
            }
            : null;
    }

    return {
        view: "grammar",
        target: "index"
    };
}

/** Parses the Vocabulary branch of the canonical query contract. */
function parseVocabularyRoute(
    params: URLSearchParams
): AppRoute | null {
    const levelValue =
        readSingleParameter(
            params,
            "level"
        );
    const packId =
        readSingleParameter(
            params,
            "pack"
        );

    if (
        levelValue === undefined
        || packId === undefined
    ) {
        return null;
    }

    if (levelValue === null) {
        return packId === null
            ? {
                view: "vocabulary",
                target: "index"
            }
            : null;
    }

    const level =
        parseLevel(
            levelValue
        );

    if (!level) {
        return null;
    }

    if (packId === null) {
        return {
            view: "vocabulary",
            target: "level",
            level
        };
    }

    return vocabularyPackIdPattern.test(
        packId
    )
        ? {
            view: "vocabulary",
            target: "pack",
            level,
            packId
        }
        : null;
}

/** Parses the Travel branch of the canonical query contract. */
function parseTravelRoute(
    params: URLSearchParams
): AppRoute | null {
    const lessonId =
        readSingleParameter(
            params,
            "lesson"
        );

    if (lessonId === undefined) {
        return null;
    }

    if (lessonId === null) {
        return {
            view: "travel",
            target: "index"
        };
    }

    return travelLessonIdPattern.test(
        lessonId
    )
        ? {
            view: "travel",
            target: "lesson",
            lessonId
        }
        : null;
}

/** Parses the Journal branch of the canonical query contract. */
function parseJournalRoute(
    params: URLSearchParams
): AppRoute | null {
    const articleId =
        readSingleParameter(
            params,
            "article"
        );

    if (articleId === undefined) {
        return null;
    }

    if (articleId === null) {
        return {
            view: "journal",
            target: "index"
        };
    }

    return newsArticleIdPattern.test(
        articleId
    )
        ? {
            view: "journal",
            target: "article",
            articleId
        }
        : null;
}

/** Parses the institutional-information branch. */
function parseInformationRoute(
    params: URLSearchParams
): AppRoute | null {
    const pageValue =
        readSingleParameter(
            params,
            "page"
        );

    if (
        pageValue === undefined
        || pageValue === null
    ) {
        return null;
    }

    const page =
        parseInstitutionalPage(
            pageValue
        );

    return page
        ? {
            view: "info",
            page
        }
        : null;
}

/**
 * Parses a query string into one trusted durable application route.
 *
 * Unknown parameters are ignored and later removed by serialization. Duplicate
 * or invalid route parameters reject the route so the router can replace it
 * with the canonical Home URL without interpolating untrusted paths.
 */
function parseAppRoute(
    search: string
): AppRoute | null {
    const params = new URLSearchParams(
        search.startsWith("?")
            ? search.slice(1)
            : search
    );
    const view =
        readSingleParameter(
            params,
            "view"
        );

    if (view === undefined) {
        return null;
    }

    if (view === null) {
        return params.size === 0
            ? { view: "home" }
            : null;
    }

    switch (view) {
        case "home":
            return { view: "home" };

        case "grammar":
            return parseGrammarRoute(
                params
            );

        case "vocabulary":
            return parseVocabularyRoute(
                params
            );

        case "travel":
            return parseTravelRoute(
                params
            );

        case "journal":
            return parseJournalRoute(
                params
            );

        case "info":
            return parseInformationRoute(
                params
            );

        default:
            return null;
    }
}

/**
 * Serializes a trusted route with one deterministic parameter order.
 */
function serializeAppRoute(
    route: AppRoute
): string {
    const params = new URLSearchParams();

    params.set(
        "view",
        route.view
    );

    switch (route.view) {
        case "home":
            break;

        case "grammar":
            if (route.target === "level") {
                params.set(
                    "level",
                    route.level
                );
            } else if (
                route.target === "lesson"
            ) {
                params.set(
                    "lesson",
                    route.lessonId
                );
            }
            break;

        case "vocabulary":
            if (route.target !== "index") {
                params.set(
                    "level",
                    route.level
                );
            }

            if (route.target === "pack") {
                params.set(
                    "pack",
                    route.packId
                );
            }
            break;

        case "travel":
            if (route.target === "lesson") {
                params.set(
                    "lesson",
                    route.lessonId
                );
            }
            break;

        case "journal":
            if (route.target === "article") {
                params.set(
                    "article",
                    route.articleId
                );
            }
            break;

        case "info":
            params.set(
                "page",
                route.page
            );
            break;
    }

    return `?${params.toString()}`;
}

/** Maps a top-level menu destination to its canonical route. */
function createSectionRoute(
    section: AppSection
): AppRoute {
    switch (section) {
        case "home":
            return { view: "home" };

        case "grammar":
            return {
                view: "grammar",
                target: "index"
            };

        case "vocabulary":
            return {
                view: "vocabulary",
                target: "index"
            };

        case "travel":
            return {
                view: "travel",
                target: "index"
            };

        case "journal":
            return {
                view: "journal",
                target: "index"
            };
    }
}

/** Returns the active navbar section associated with a route. */
function getRouteSection(
    route: AppRoute
): AppSection | null {
    return route.view === "info"
        ? null
        : route.view;
}
