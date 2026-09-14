import type {
    Page,
    Route
} from "@playwright/test";

const publishedAt =
    "2026-09-14T12:00:00.000Z";

const levelIds = {
    A1: "A1-G-001",
    A2: "A2-G-001",
    B1: "B1-G-001",
    B2: "B2-G-001",
    C1: "C1-G-001"
} as const;

const grammarCatalog = {
    A1: createGrammarCatalogEntry(
        "A1",
        "Les pronoms sujets",
        "👤"
    ),
    A2: createGrammarCatalogEntry(
        "A2",
        "Exprimer la comparaison",
        "⚖️"
    ),
    B1: createGrammarCatalogEntry(
        "B1",
        "Raconter au passé",
        "🕰️"
    ),
    B2: createGrammarCatalogEntry(
        "B2",
        "Nuancer son opinion",
        "🎚️"
    ),
    C1: createGrammarCatalogEntry(
        "C1",
        "Raconter au passé : les temps du récit",
        "📖"
    )
} as const;

async function installContentBackendMock(
    page: Page
): Promise<void> {
    await page.route(
        "https://supabase.test/rest/v1/rpc/get_published_content**",
        async route => {
            if (
                !await fulfillContentBackendRequest(
                    route
                )
            ) {
                await route.fallback();
            }
        }
    );
}

async function fulfillContentBackendRequest(
    route: Route
): Promise<boolean> {
    const request =
        route.request();
    const path =
        new URL(
            request.url()
        ).pathname;

    if (
        path
        !== "/rest/v1/rpc/get_published_content_catalog"
        && path
        !== "/rest/v1/rpc/get_published_content"
    ) {
        return false;
    }

    if (
        request.method()
        === "OPTIONS"
    ) {
        await route.fulfill({
            body: "",
            headers:
                jsonHeaders(),
            status: 204
        });
        return true;
    }

    const body =
        request.postDataJSON() as Record<
            string,
            unknown
        >;

    if (
        path
        === "/rest/v1/rpc/get_published_content_catalog"
    ) {
        const level =
            body.p_level;
        const entry =
            typeof level === "string"
                ? grammarCatalog[
                    level as keyof typeof grammarCatalog
                ]
                : undefined;

        await route.fulfill({
            headers:
                jsonHeaders(),
            json:
                body.p_content_type
                    === "grammar_lesson"
                    && entry
                    ? [toCatalogRow(entry)]
                    : [],
            status: 200
        });
        return true;
    }

    const contentKey =
        body.p_content_key;
    const entry =
        Object.values(
            grammarCatalog
        ).find(
            candidate =>
                candidate.id
                === contentKey
        );

    await route.fulfill({
        headers:
            jsonHeaders(),
        json:
            body.p_content_type
                === "grammar_lesson"
                && entry
                ? [toDocumentRow(entry)]
                : [],
        status: 200
    });
    return true;
}

function createGrammarCatalogEntry(
    level: keyof typeof levelIds,
    title: string,
    icon: string
) {
    const id =
        levelIds[level];

    return {
        category: "playwright",
        estimatedTime: 10,
        exercises:
            level === "A1"
                ? 2
                : 0,
        icon,
        id,
        importance: 5,
        lessons: 2,
        level,
        module: "Parcours Playwright",
        prerequisites: [],
        recommended: true,
        title
    };
}

type GrammarCatalogFixture =
    ReturnType<
        typeof createGrammarCatalogEntry
    >;

function toCatalogRow(
    catalog: GrammarCatalogFixture
) {
    return {
        catalog,
        content_key:
            catalog.id,
        content_type:
            "grammar_lesson",
        item_id:
            `playwright-${catalog.id}`,
        level:
            catalog.level,
        published_at:
            publishedAt,
        revision_id:
            `playwright-revision-${catalog.id}`,
        revision_number: 1,
        schema_version: 2,
        title_fa: null,
        title_fr:
            catalog.title
    };
}

function toDocumentRow(
    catalog: GrammarCatalogFixture
) {
    return {
        content_hash:
            `playwright-hash-${catalog.id}`,
        content_key:
            catalog.id,
        content_type:
            "grammar_lesson",
        item_id:
            `playwright-${catalog.id}`,
        level:
            catalog.level,
        payload: {
            catalog,
            document: {
                estimatedTime:
                    catalog.estimatedTime,
                icon:
                    catalog.icon,
                id:
                    catalog.id,
                level:
                    catalog.level,
                sections: [
                    {
                        content:
                            "Une leçon servie par le dépôt de contenu de test.",
                        id:
                            `${catalog.id}-1`,
                        title:
                            "Comprendre la règle",
                        type: "lesson"
                    },
                    {
                        content:
                            "Une seconde section pour vérifier la navigation locale.",
                        id:
                            `${catalog.id}-2`,
                        title:
                            "Mettre en pratique",
                        type: "lesson"
                    }
                ],
                title:
                    catalog.title
            },
            exerciseSections:
                catalog.level === "A1"
                    ? [
                        {
                            displayCount: 1,
                            id:
                                `${catalog.id}-quiz`,
                            questions: [
                                {
                                    correct: 0,
                                    options: [
                                        "Je",
                                        "Tu"
                                    ],
                                    question:
                                        "Quel pronom parle de soi ?",
                                    type: "mcq"
                                }
                            ],
                            title:
                                "Quiz de validation",
                            type: "quiz"
                        }
                    ]
                    : []
        },
        published_at:
            publishedAt,
        revision_id:
            `playwright-revision-${catalog.id}`,
        revision_number: 1,
        schema_version: 2,
        title_fa: null,
        title_fr:
            catalog.title
    };
}

function jsonHeaders(): Record<
    string,
    string
> {
    return {
        "access-control-allow-headers":
            "authorization,apikey,content-type,x-client-info",
        "access-control-allow-methods":
            "GET,POST,OPTIONS",
        "access-control-allow-origin":
            "*",
        "content-type":
            "application/json"
    };
}

export {
    fulfillContentBackendRequest,
    installContentBackendMock
};
