import {
    expect,
    test,
    type Page,
    type Route
} from "@playwright/test";

const adminId =
    "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";
const now =
    "2026-09-15T10:00:00.000Z";

function jsonHeaders(): Record<string, string> {
    return {
        "access-control-allow-headers":
            "authorization,apikey,content-type,x-client-info",
        "access-control-allow-methods":
            "GET,POST,OPTIONS",
        "access-control-allow-origin": "*",
        "content-type": "application/json"
    };
}

function createAccessToken(): string {
    const header = Buffer.from(
        JSON.stringify({ alg: "HS256", typ: "JWT" })
    ).toString("base64url");
    const payload = Buffer.from(
        JSON.stringify({
            aud: "authenticated",
            exp: Math.floor(Date.now() / 1000) + 3600,
            role: "authenticated",
            sub: adminId
        })
    ).toString("base64url");

    return `${header}.${payload}.playwright-signature`;
}

function createAdminUser() {
    return {
        app_metadata: {
            provider: "email",
            providers: ["email"]
        },
        aud: "authenticated",
        confirmed_at: now,
        created_at: now,
        email: "editor@example.test",
        email_confirmed_at: now,
        id: adminId,
        identities: [],
        is_anonymous: false,
        role: "authenticated",
        updated_at: now,
        user_metadata: {}
    };
}

async function prepareAdminSession(page: Page): Promise<void> {
    await page.addInitScript(
        ({ accessToken, user }) => {
            localStorage.setItem("language", "fr");
            localStorage.setItem("currentPath", "general");
            localStorage.setItem(
                "sb-supabase-auth-token",
                JSON.stringify({
                    access_token: accessToken,
                    expires_at: Math.floor(Date.now() / 1000) + 3600,
                    expires_in: 3600,
                    refresh_token: "playwright-refresh-token",
                    token_type: "bearer",
                    user
                })
            );
        },
        {
            accessToken: createAccessToken(),
            user: createAdminUser()
        }
    );
}

interface AdminBackendState {
    draftBodies: Array<Record<string, unknown>>;
    publicationBodies: Array<Record<string, unknown>>;
    unexpectedRequests: string[];
}

async function installAdminBackendMock(
    page: Page,
    isAdmin = true
): Promise<AdminBackendState> {
    const state: AdminBackendState = {
        draftBodies: [],
        publicationBodies: [],
        unexpectedRequests: []
    };
    let latestRevision = 2;
    let publishedRevision = 1;
    let latestTitle = "Le présent";
    const revisions: Array<Record<string, unknown>> = [
        createRevision(2, false, latestTitle),
        createRevision(1, true, latestTitle)
    ];

    await page.route(
        "https://supabase.test/**",
        async route => {
            const request = route.request();
            const path = new URL(request.url()).pathname;

            if (request.method() === "OPTIONS") {
                await fulfillPreflight(route);
                return;
            }

            if (path === "/auth/v1/user") {
                await route.fulfill({
                    headers: jsonHeaders(),
                    json: createAdminUser(),
                    status: 200
                });
                return;
            }

            if (path === "/rest/v1/rpc/get_content_admin_status") {
                await route.fulfill({
                    headers: jsonHeaders(),
                    json: [{ is_admin: isAdmin }],
                    status: 200
                });
                return;
            }

            if (path === "/rest/v1/rpc/admin_list_content_items") {
                await route.fulfill({
                    headers: jsonHeaders(),
                    json: [{
                        archived_at: null,
                        content_key: "A1-G-ADMIN-001",
                        content_type: "grammar_lesson",
                        item_id: "11111111-1111-4111-8111-111111111111",
                        latest_revision_number: latestRevision,
                        level: "A1",
                        published_at: now,
                        published_revision_number: publishedRevision,
                        revision_count: latestRevision,
                        title_fa: null,
                        title_fr: latestTitle,
                        updated_at: now
                    }],
                    status: 200
                });
                return;
            }

            if (path === "/rest/v1/rpc/admin_get_content_revisions") {
                await route.fulfill({
                    headers: jsonHeaders(),
                    json: revisions.map(revision => ({
                        ...revision,
                        published:
                            revision.revision_number === publishedRevision
                    })),
                    status: 200
                });
                return;
            }

            if (path === "/rest/v1/rpc/admin_import_content_draft") {
                const body = request.postDataJSON() as Record<string, unknown>;
                state.draftBodies.push(body);
                latestRevision += 1;
                latestTitle = String(body.p_title_fr);
                revisions.unshift({
                    ...createRevision(latestRevision, false, latestTitle),
                    level: body.p_level,
                    payload: body.p_payload,
                    schema_version: body.p_schema_version,
                    source_path: body.p_source_path,
                    title_fa: body.p_title_fa
                });
                await route.fulfill({
                    headers: jsonHeaders(),
                    json: [{
                        content_hash: "c".repeat(64),
                        content_key: "A1-G-ADMIN-001",
                        content_type: "grammar_lesson",
                        published: false,
                        revision_number: latestRevision
                    }],
                    status: 200
                });
                return;
            }

            if (path === "/rest/v1/rpc/admin_publish_content_revision") {
                const body = request.postDataJSON() as Record<string, unknown>;
                state.publicationBodies.push(body);
                publishedRevision = Number(body.p_revision_number);
                await route.fulfill({
                    headers: jsonHeaders(),
                    json: [{
                        content_key: body.p_content_key,
                        content_type: body.p_content_type,
                        published_at: now,
                        revision_number: publishedRevision
                    }],
                    status: 200
                });
                return;
            }

            if ([
                "/rest/v1/learner_exercise_attempts",
                "/rest/v1/learner_lesson_progress",
                "/rest/v1/learner_profiles",
                "/rest/v1/learner_review_signals"
            ].includes(path)) {
                await route.fulfill({
                    headers: jsonHeaders(),
                    json: [],
                    status: 200
                });
                return;
            }

            state.unexpectedRequests.push(`${request.method()} ${path}`);
            await route.abort();
        }
    );

    return state;
}

function createRevision(
    revisionNumber: number,
    published: boolean,
    title: string
) {
    return {
        created_at: now,
        created_by: adminId,
        level: "A1",
        payload: {
            catalog: {
                id: "A1-G-ADMIN-001",
                title
            },
            document: {
                id: "A1-G-ADMIN-001",
                sections: [],
                title
            },
            exerciseSections: []
        },
        published,
        revision_id: `22222222-2222-4222-8222-${String(revisionNumber).padStart(12, "0")}`,
        revision_number: revisionNumber,
        schema_version: 2,
        source_path: "admin-panel",
        title_fa: null,
        title_fr: title
    };
}

async function fulfillPreflight(route: Route): Promise<void> {
    await route.fulfill({
        body: "",
        headers: jsonHeaders(),
        status: 204
    });
}

test(
    "admin reviews a draft before explicitly publishing its revision",
    async ({ page }) => {
        await prepareAdminSession(page);
        const backend = await installAdminBackendMock(page);

        await page.goto("/admin/content");

        await expect(page).toHaveURL(/\/admin\/content$/u);
        await expect(page.getByRole("heading", {
            name: "Atelier des contenus"
        })).toBeVisible();
        await expect(page.getByRole("progressbar", {
            name: "Couverture publiée"
        })).toHaveAttribute("aria-valuemax", "1");

        await page.getByPlaceholder("Titre ou identifiant…").fill("présent");
        await page.getByRole("button", { name: /Le présent/u }).click();
        await expect(page.getByRole("heading", {
            name: "Modifier A1-G-ADMIN-001"
        })).toBeVisible();

        await page.getByLabel("Titre français").fill("Le présent révisé");
        await page.getByRole("button", {
            name: "Enregistrer en brouillon"
        }).click();

        await expect(page.getByText(
            "Révision 3 enregistrée en brouillon."
        )).toBeVisible();
        expect(backend.draftBodies).toHaveLength(1);
        expect(backend.draftBodies[0]).toMatchObject({
            p_content_key: "A1-G-ADMIN-001",
            p_content_type: "grammar_lesson",
            p_title_fr: "Le présent révisé"
        });
        expect(backend.publicationBodies).toHaveLength(0);

        await page.getByRole("button", {
            name: "Publier la révision 3"
        }).click();
        await expect(page.getByText("Révision 3 publiée.")).toBeVisible();
        expect(backend.publicationBodies).toEqual([{
            p_content_key: "A1-G-ADMIN-001",
            p_content_type: "grammar_lesson",
            p_revision_number: 3
        }]);

        await page.setViewportSize({ height: 844, width: 390 });
        const widths = await page.evaluate(() => ({
            content: document.documentElement.scrollWidth,
            viewport: document.documentElement.clientWidth
        }));
        expect(widths.content).toBeLessThanOrEqual(widths.viewport);
        expect(backend.unexpectedRequests).toEqual([]);
    }
);

test(
    "an authenticated learner cannot open the private editorial inventory",
    async ({ page }) => {
        await prepareAdminSession(page);
        const backend = await installAdminBackendMock(page, false);

        await page.goto("/admin/content");

        await expect(page.getByRole("heading", {
            name: "Accès administrateur requis"
        })).toBeVisible();
        await expect(page.getByText(`Identifiant : ${adminId}`)).toBeVisible();
        await expect(page.getByRole("heading", {
            name: "Inventaire serveur"
        })).toHaveCount(0);
        expect(backend.draftBodies).toEqual([]);
        expect(backend.publicationBodies).toEqual([]);
        expect(backend.unexpectedRequests).toEqual([]);
    }
);
