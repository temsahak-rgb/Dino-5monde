import {
    expect,
    test,
    type Page,
    type Route
} from "@playwright/test";

const learnerId =
    "11111111-1111-4111-8111-111111111111";

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
            sub: learnerId
        })
    ).toString("base64url");

    return `${header}.${payload}.playwright-signature`;
}

function createUser() {
    const now = "2026-09-08T10:00:00.000Z";
    return {
        app_metadata: { provider: "email", providers: ["email"] },
        aud: "authenticated",
        confirmed_at: now,
        created_at: now,
        email: "learner@example.com",
        email_confirmed_at: now,
        id: learnerId,
        identities: [],
        is_anonymous: false,
        role: "authenticated",
        updated_at: now,
        user_metadata: {}
    };
}

async function prepareSignedInBrowser(
    page: Page
): Promise<void> {
    await page.addInitScript(
        ({ accessToken, user }) => {
            localStorage.setItem("language", "fr");
            localStorage.setItem("currentPath", "general");
            localStorage.setItem("placementResult", "A1");
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
            user: createUser()
        }
    );
}

async function fulfillPreflight(
    route: Route
): Promise<boolean> {
    if (route.request().method() !== "OPTIONS") {
        return false;
    }

    await route.fulfill({
        body: "",
        headers: jsonHeaders(),
        status: 204
    });
    return true;
}

test(
    "local difficulties become actionable lesson and weak-word reviews",
    async ({ page }) => {
        await page.addInitScript(() => {
            localStorage.setItem("language", "fr");
            localStorage.setItem("currentPath", "general");
            localStorage.setItem("placementResult", "A1");
            localStorage.setItem(
                "dino_mistakes",
                JSON.stringify([{
                    lessonId: "A1-G-001",
                    sectionId: "exercise",
                    questionIndex: 0,
                    userAnswer: 1,
                    correctAnswer: 0,
                    timestamp: "2026-09-08T10:00:00.000Z"
                }])
            );
            localStorage.setItem(
                "dino_vocab_weak",
                JSON.stringify({
                    salutations_expressions_quotidiennes: ["à bientôt"]
                })
            );
        });

        await page.goto("/practice/review");

        await expect(
            page.getByRole("heading", { name: "Mes révisions", exact: true })
        ).toBeVisible();
        await expect(page.getByText("Les pronoms sujets")).toBeVisible();
        await expect(
            page.getByText("Salutations et Expressions Quotidiennes")
        ).toBeVisible();

        await page.getByRole("link", { name: "Réviser 1 mot(s) →" }).click();

        await expect(page).toHaveURL(
            /\/vocabulary\/A1\/salutations_expressions_quotidiennes\/review$/
        );
        await expect(
            page.getByRole("heading", { name: "Mots faibles", exact: true })
        ).toBeVisible();
        await expect(page.getByText("à bientôt", { exact: true })).toBeVisible();
    }
);

test(
    "remote review signals stay removed after a tombstone and reload",
    async ({ page }) => {
        await prepareSignedInBrowser(page);

        const rows = new Map<string, Record<string, unknown>>([
            [
                "mistake|A1-G-001|mistake-remote",
                {
                    active: true,
                    changed_at: "2026-09-08T10:00:00.000Z",
                    payload: {
                        correctAnswer: 0,
                        id: "mistake-remote",
                        lessonId: "A1-G-001",
                        questionIndex: 0,
                        sectionId: "exercise",
                        timestamp: "2026-09-08T10:00:00.000Z",
                        userAnswer: 1
                    },
                    signal_key: "mistake-remote",
                    signal_type: "mistake",
                    subject_id: "A1-G-001",
                    updated_at: "2026-09-08T10:00:01.000Z"
                }
            ],
            [
                "weak_word|salutations_expressions_quotidiennes|à bientôt",
                {
                    active: true,
                    changed_at: "2026-09-08T10:00:00.000Z",
                    payload: { word: "à bientôt" },
                    signal_key: "à bientôt",
                    signal_type: "weak_word",
                    subject_id: "salutations_expressions_quotidiennes",
                    updated_at: "2026-09-08T10:00:01.000Z"
                }
            ]
        ]);
        const writes: Array<Record<string, unknown>> = [];
        const unexpectedRequests: string[] = [];

        await page.route(
            "https://supabase.test/**",
            async route => {
                if (await fulfillPreflight(route)) {
                    return;
                }

                const request = route.request();
                const path = new URL(request.url()).pathname;

                if (path === "/auth/v1/user") {
                    await route.fulfill({
                        headers: jsonHeaders(),
                        json: createUser(),
                        status: 200
                    });
                    return;
                }

                if (path === "/rest/v1/learner_review_signals") {
                    await route.fulfill({
                        headers: jsonHeaders(),
                        json: [...rows.values()],
                        status: 200
                    });
                    return;
                }

                if (path === "/rest/v1/learner_exercise_attempts") {
                    await route.fulfill({
                        headers: jsonHeaders(),
                        json: [],
                        status: 200
                    });
                    return;
                }

                if (path === "/rest/v1/rpc/sync_review_signal") {
                    const body = request.postDataJSON() as Record<
                        string,
                        unknown
                    >;
                    writes.push(body);
                    const key = [
                        body.p_signal_type,
                        body.p_subject_id,
                        body.p_signal_key
                    ].join("|");
                    const existing = rows.get(key);
                    const existingChangedAt = String(
                        existing?.changed_at ?? ""
                    );
                    const changedAt = String(body.p_changed_at);

                    if (!existing || changedAt >= existingChangedAt) {
                        rows.set(key, {
                            active: body.p_active,
                            changed_at: changedAt,
                            payload: body.p_payload,
                            signal_key: body.p_signal_key,
                            signal_type: body.p_signal_type,
                            subject_id: body.p_subject_id,
                            updated_at: changedAt
                        });
                    }

                    await route.fulfill({
                        headers: jsonHeaders(),
                        json: [rows.get(key)],
                        status: 200
                    });
                    return;
                }

                if (
                    [
                        "/rest/v1/learner_activity_rewards",
                        "/rest/v1/learner_lesson_progress",
                        "/rest/v1/learner_profiles",
                        "/rest/v1/learner_wallets",
                        "/rest/v1/learning_reward_rules",
                        "/rest/v1/lesson_entitlements",
                        "/rest/v1/shop_lessons"
                    ].includes(path)
                ) {
                    await route.fulfill({
                        headers: jsonHeaders(),
                        json: [],
                        status: 200
                    });
                    return;
                }

                unexpectedRequests.push(`${request.method()} ${path}`);
                await route.abort();
            }
        );

        await page.goto("/practice/review");
        await expect(page.getByText("Les pronoms sujets")).toBeVisible();
        await expect(
            page.getByText("Salutations et Expressions Quotidiennes")
        ).toBeVisible();
        await expect(
            page.getByText(/sont synchronisés sur ce compte/u)
        ).toBeVisible();

        await page.getByRole(
            "button",
            { name: "Marquer comme révisé" }
        ).click();
        await expect(page.getByText("Les pronoms sujets")).toHaveCount(0);
        await expect.poll(
            () => writes.filter(write =>
                write.p_signal_type === "mistake"
                && write.p_active === false
            ).length
        ).toBe(1);

        await page.reload();
        await expect(page.getByText("Les pronoms sujets")).toHaveCount(0);
        await expect(
            page.getByText("Salutations et Expressions Quotidiennes")
        ).toBeVisible();
        expect(
            rows.get("mistake|A1-G-001|mistake-remote")?.active
        ).toBe(false);
        expect(unexpectedRequests).toEqual([]);
    }
);
