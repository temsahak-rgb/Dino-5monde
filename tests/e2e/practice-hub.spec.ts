import {
    expect,
    test,
    type Page,
    type Route
} from "@playwright/test";

const learnerId =
    "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb";
const attemptId =
    "cccccccc-cccc-4ccc-8ccc-cccccccccccc";
const backendTimestamp =
    "2026-09-08T21:00:00.000Z";

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

function createAccessToken(): string {
    const header = Buffer.from(
        JSON.stringify({
            alg: "HS256",
            typ: "JWT"
        })
    ).toString("base64url");
    const payload = Buffer.from(
        JSON.stringify({
            aud: "authenticated",
            exp:
                Math.floor(Date.now() / 1000)
                + 3600,
            role: "authenticated",
            sub: learnerId
        })
    ).toString("base64url");

    return `${header}.${payload}.playwright-signature`;
}

function createUser() {
    return {
        app_metadata: {
            provider: "email",
            providers: ["email"]
        },
        aud: "authenticated",
        confirmed_at: backendTimestamp,
        created_at: backendTimestamp,
        email: "game@example.test",
        email_confirmed_at: backendTimestamp,
        id: learnerId,
        identities: [],
        is_anonymous: false,
        role: "authenticated",
        updated_at: backendTimestamp,
        user_metadata: {}
    };
}

async function seedCompletedOnboarding(
    page: Page
): Promise<void> {
    await page.addInitScript(() => {
        localStorage.setItem("language", "fr");
        localStorage.setItem("currentPath", "general");
        localStorage.setItem("placementResult", "A1");
    });
}

async function seedSignedInOnboarding(
    page: Page
): Promise<void> {
    const accessToken =
        createAccessToken();
    const user =
        createUser();

    await page.addInitScript(
        ({
            sessionToken,
            sessionUser
        }) => {
            Math.random = () => 0;
            localStorage.setItem("language", "fr");
            localStorage.setItem("currentPath", "general");
            localStorage.setItem("placementResult", "A1");
            localStorage.setItem(
                "sb-supabase-auth-token",
                JSON.stringify({
                    access_token: sessionToken,
                    expires_at:
                        Math.floor(Date.now() / 1000)
                        + 3600,
                    expires_in: 3600,
                    refresh_token:
                        "playwright-refresh-token",
                    token_type: "bearer",
                    user: sessionUser
                })
            );
        },
        {
            sessionToken: accessToken,
            sessionUser: user
        }
    );
}

test(
    "a learner launches and reloads a mini-game from the practice hub",
    async ({ page }) => {
        await seedCompletedOnboarding(page);
        await page.goto("/practice");

        await expect(
            page.getByRole("heading", {
                name: "Jeux et exercices",
                exact: true
            })
        ).toBeVisible();

        await page
            .locator('[data-practice-game="hangman"]')
            .getByRole("link", {
                name: "Jouer au niveau A1"
            })
            .click();

        await expect(page).toHaveURL(
            /\/practice\/hangman\/A1$/
        );

        await page
            .locator(
                'a[href="/practice/hangman/A1/salutations_expressions_quotidiennes"]'
            )
            .click();

        await expect(
            page.getByRole("heading", {
                name: "Pendu",
                exact: true
            })
        ).toBeVisible();
        await expect(page).toHaveURL(
            /\/practice\/hangman\/A1\/salutations_expressions_quotidiennes$/
        );

        await page.reload();

        await expect(
            page.getByRole("heading", {
                name: "Pendu",
                exact: true
            })
        ).toBeVisible();
    }
);

test(
    "a signed-in learner earns the A1 Hangman reward once",
    async ({ page }) => {
        await seedSignedInOnboarding(page);

        let attemptStarted = false;
        let attemptCompleted = false;
        let claimed = false;
        let balance = 100;
        let startCalls = 0;
        let completeCalls = 0;
        let claimCalls = 0;
        const unexpectedRequests:
            string[] = [];

        await page.route(
            "https://supabase.test/**",
            async route => {
                if (await fulfillPreflight(route)) {
                    return;
                }

                const request =
                    route.request();
                const path =
                    new URL(
                        request.url()
                    ).pathname;

                if (path === "/auth/v1/user") {
                    await route.fulfill({
                        headers: jsonHeaders(),
                        json: createUser(),
                        status: 200
                    });
                    return;
                }

                if (
                    path
                    === "/rest/v1/learner_profiles"
                ) {
                    await route.fulfill({
                        headers: jsonHeaders(),
                        json: [],
                        status: 200
                    });
                    return;
                }

                if (
                    path
                    === "/rest/v1/learner_lesson_progress"
                    || path
                    === "/rest/v1/learner_review_signals"
                ) {
                    await route.fulfill({
                        headers: jsonHeaders(),
                        json: [],
                        status: 200
                    });
                    return;
                }

                if (
                    path
                    === "/rest/v1/learning_reward_rules"
                ) {
                    await route.fulfill({
                        headers: jsonHeaders(),
                        json: [
                            {
                                activity_id: "A1",
                                activity_type:
                                    "hangman_game",
                                reward_credits: 1
                            }
                        ],
                        status: 200
                    });
                    return;
                }

                if (
                    path
                    === "/rest/v1/learner_activity_rewards"
                ) {
                    await route.fulfill({
                        headers: jsonHeaders(),
                        json:
                            claimed
                                ? [
                                    {
                                        activity_id: "A1",
                                        activity_type:
                                            "hangman_game",
                                        awarded_at:
                                            backendTimestamp,
                                        credits_awarded: 1
                                    }
                                ]
                                : [],
                        status: 200
                    });
                    return;
                }

                if (
                    path
                    === "/rest/v1/learner_wallets"
                ) {
                    await route.fulfill({
                        headers: jsonHeaders(),
                        json: [
                            {
                                created_at:
                                    backendTimestamp,
                                credits: balance,
                                updated_at:
                                    backendTimestamp,
                                user_id: learnerId
                            }
                        ],
                        status: 200
                    });
                    return;
                }

                if (
                    path
                    === "/rest/v1/rpc/start_learning_game"
                ) {
                    startCalls += 1;
                    expect(
                        request.postDataJSON()
                    ).toEqual({
                        p_activity_id: "A1",
                        p_activity_type:
                            "hangman_game",
                        p_pack_id:
                            "salutations_expressions_quotidiennes"
                    });
                    attemptStarted = true;

                    await route.fulfill({
                        headers: jsonHeaders(),
                        json: [
                            {
                                activity_id: "A1",
                                activity_type:
                                    "hangman_game",
                                attempt_id: attemptId,
                                completed_at:
                                    attemptCompleted
                                        ? backendTimestamp
                                        : null,
                                pack_id:
                                    "salutations_expressions_quotidiennes",
                                started_at:
                                    backendTimestamp
                            }
                        ],
                        status: 200
                    });
                    return;
                }

                if (
                    path
                    === "/rest/v1/rpc/complete_learning_game"
                ) {
                    completeCalls += 1;
                    expect(attemptStarted).toBe(true);
                    expect(
                        request.postDataJSON()
                    ).toEqual({
                        p_attempt_id: attemptId
                    });
                    attemptCompleted = true;

                    await route.fulfill({
                        headers: jsonHeaders(),
                        json: [
                            {
                                activity_id: "A1",
                                activity_type:
                                    "hangman_game",
                                attempt_id: attemptId,
                                completed_at:
                                    backendTimestamp,
                                pack_id:
                                    "salutations_expressions_quotidiennes",
                                started_at:
                                    backendTimestamp
                            }
                        ],
                        status: 200
                    });
                    return;
                }

                if (
                    path
                    === "/rest/v1/rpc/claim_learning_reward"
                ) {
                    claimCalls += 1;
                    expect(attemptCompleted).toBe(true);
                    expect(
                        request.postDataJSON()
                    ).toEqual({
                        p_activity_id: "A1",
                        p_activity_type:
                            "hangman_game"
                    });
                    const awarded =
                        !claimed;

                    if (awarded) {
                        claimed = true;
                        balance += 1;
                    }

                    await route.fulfill({
                        headers: jsonHeaders(),
                        json: [
                            {
                                activity_id: "A1",
                                activity_type:
                                    "hangman_game",
                                awarded,
                                awarded_at:
                                    backendTimestamp,
                                credits_awarded: 1,
                                credits_remaining:
                                    balance
                            }
                        ],
                        status: 200
                    });
                    return;
                }

                unexpectedRequests.push(
                    `${request.method()} ${path}`
                );
                await route.abort();
            }
        );

        await page.goto(
            "/practice/hangman/A1/salutations_expressions_quotidiennes"
        );
        await expect(
            page.getByText(
                "🏆 Gagnez une partie au niveau A1 : +1 crédits"
            )
        ).toBeVisible();
        await expect.poll(
            () => startCalls
        ).toBe(1);

        for (
            const letter
            of [
                "A",
                "B",
                "I",
                "E",
                "N",
                "T",
                "O"
            ]
        ) {
            await page.getByRole(
                "button",
                {
                    exact: true,
                    name: letter
                }
            ).click();
        }

        await expect(
            page.getByText(
                "🎉 1 crédit gagné"
            )
        ).toBeVisible();
        expect(balance).toBe(101);
        expect(completeCalls).toBe(1);
        expect(claimCalls).toBe(1);

        await page.reload();
        await expect(
            page.getByText(
                "🎉 1 crédit gagné"
            )
        ).toBeVisible();
        expect(startCalls).toBe(1);
        expect(completeCalls).toBe(1);
        expect(claimCalls).toBe(1);

        await page.goto("/profile");
        await expect(
            page.getByLabel("Mes crédits")
        ).toContainText("101 crédits");
        await expect(
            page.getByLabel(
                "Récompenses obtenues"
            ).getByRole(
                "link",
                {
                    name:
                        "Pendu · niveau A1"
                }
            )
        ).toHaveAttribute(
            "href",
            "/practice/hangman/A1"
        );
        expect(unexpectedRequests).toEqual([]);
    }
);
