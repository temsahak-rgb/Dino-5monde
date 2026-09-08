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
    const header =
        Buffer.from(
            JSON.stringify({
                alg: "HS256",
                typ: "JWT"
            })
        ).toString("base64url");
    const payload =
        Buffer.from(
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

async function prepareCompletedOnboarding(
    page: Page,
    language = "fr"
): Promise<void> {
    await page.addInitScript(
        ({ selectedLanguage }) => {
            localStorage.setItem(
                "language",
                selectedLanguage
            );
            localStorage.setItem(
                "currentPath",
                "general"
            );
        },
        {
            selectedLanguage: language
        }
    );
}

function createUser() {
    const now =
        "2026-09-08T10:00:00.000Z";

    return {
        app_metadata: {
            provider: "email",
            providers: [
                "email"
            ]
        },
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

async function prepareSignedInTravelLesson(
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
            localStorage.setItem(
                "language",
                "fr"
            );
            localStorage.setItem(
                "currentPath",
                "travel"
            );
            localStorage.setItem(
                "dino_lessons_progress",
                JSON.stringify({
                    "TR-006": {
                        completedSections: [
                            "TR-006-1",
                            "TR-006-3",
                            "TR-006-4"
                        ],
                        currentSection: 0,
                        lastAccessed:
                            "2026-09-08T10:00:00.000Z",
                        status: "completed"
                    }
                })
            );
            localStorage.setItem(
                "sb-supabase-auth-token",
                JSON.stringify({
                    access_token:
                        sessionToken,
                    expires_at:
                        Math.floor(
                            Date.now()
                            / 1000
                        ) + 3600,
                    expires_in: 3600,
                    refresh_token:
                        "playwright-refresh-token",
                    token_type: "bearer",
                    user: sessionUser
                })
            );
        },
        {
            sessionToken:
                accessToken,
            sessionUser:
                user
        }
    );
}

test.describe(
    "email authentication and learner profile",
    () => {
        test(
            "signs in with an email OTP and creates a Saurus profile",
            async ({ page }) => {
                await prepareCompletedOnboarding(page);

                let requestedEmail = "";
                let savedDisplayName = "";

                await page.route(
                    "**/auth/v1/**",
                    async route => {
                        if (await fulfillPreflight(route)) {
                            return;
                        }

                        const request =
                            route.request();
                        const body =
                            request.postDataJSON() as Record<string, unknown>;
                        const requestUrl =
                            new URL(request.url());

                        if (requestUrl.pathname.endsWith("/otp")) {
                            requestedEmail =
                                String(body.email);
                            expect(body.create_user).toBe(true);
                            expect(
                                requestUrl.searchParams.get("redirect_to")
                            ).toBe(
                                "http://127.0.0.1:4173/profile"
                            );

                            await route.fulfill({
                                body: "{}",
                                headers: jsonHeaders(),
                                status: 200
                            });
                            return;
                        }

                        if (requestUrl.pathname.endsWith("/verify")) {
                            expect(body).toMatchObject({
                                email: "learner@example.com",
                                token: "123456",
                                type: "email"
                            });

                            const now =
                                new Date().toISOString();

                            await route.fulfill({
                                headers: jsonHeaders(),
                                json: {
                                    access_token:
                                        createAccessToken(),
                                    expires_in: 3600,
                                    refresh_token:
                                        "playwright-refresh-token",
                                    token_type: "bearer",
                                    user: {
                                        app_metadata: {
                                            provider: "email",
                                            providers: [
                                                "email"
                                            ]
                                        },
                                        aud: "authenticated",
                                        confirmed_at: now,
                                        created_at: now,
                                        email:
                                            "learner@example.com",
                                        email_confirmed_at: now,
                                        id: learnerId,
                                        identities: [],
                                        is_anonymous: false,
                                        role: "authenticated",
                                        updated_at: now,
                                        user_metadata: {}
                                    }
                                },
                                status: 200
                            });
                            return;
                        }

                        await route.abort();
                    }
                );

                await page.route(
                    "**/rest/v1/learner_profiles**",
                    async route => {
                        if (await fulfillPreflight(route)) {
                            return;
                        }

                        const request =
                            route.request();

                        if (request.method() === "GET") {
                            await route.fulfill({
                                headers: jsonHeaders(),
                                json: [],
                                status: 200
                            });
                            return;
                        }

                        const body =
                            request.postDataJSON() as Record<string, unknown>;
                        savedDisplayName =
                            String(body.display_name);
                        const now =
                            new Date().toISOString();

                        await route.fulfill({
                            headers: jsonHeaders(),
                            json: {
                                assigned_saurus: null,
                                avatar_key: body.avatar_key,
                                created_at: now,
                                display_name: body.display_name,
                                show_saurus_suffix:
                                    body.show_saurus_suffix,
                                updated_at: now,
                                user_id: learnerId
                            },
                            status: 200
                        });
                    }
                );

                await page.route(
                    "**/rest/v1/shop_lessons**",
                    async route => {
                        if (await fulfillPreflight(route)) {
                            return;
                        }

                        await route.fulfill({
                            headers: jsonHeaders(),
                            json: [],
                            status: 200
                        });
                    }
                );

                await page.route(
                    "**/rest/v1/learner_wallets**",
                    async route => {
                        if (await fulfillPreflight(route)) {
                            return;
                        }

                        const now =
                            new Date().toISOString();

                        await route.fulfill({
                            headers: jsonHeaders(),
                            json: [
                                {
                                    created_at: now,
                                    credits: 100,
                                    updated_at: now,
                                    user_id: learnerId
                                }
                            ],
                            status: 200
                        });
                    }
                );

                await page.route(
                    "**/rest/v1/lesson_entitlements**",
                    async route => {
                        if (await fulfillPreflight(route)) {
                            return;
                        }

                        await route.fulfill({
                            headers: jsonHeaders(),
                            json: [],
                            status: 200
                        });
                    }
                );

                await page.route(
                    "**/rest/v1/learning_reward_rules**",
                    async route => {
                        if (await fulfillPreflight(route)) {
                            return;
                        }

                        await route.fulfill({
                            headers: jsonHeaders(),
                            json: [],
                            status: 200
                        });
                    }
                );

                await page.route(
                    "**/rest/v1/learner_activity_rewards**",
                    async route => {
                        if (await fulfillPreflight(route)) {
                            return;
                        }

                        await route.fulfill({
                            headers: jsonHeaders(),
                            json: [],
                            status: 200
                        });
                    }
                );

                await page.route(
                    "**/rest/v1/learner_lesson_progress**",
                    async route => {
                        if (await fulfillPreflight(route)) {
                            return;
                        }

                        await route.fulfill({
                            headers: jsonHeaders(),
                            json: [],
                            status: 200
                        });
                    }
                );

                await page.route(
                    "**/rest/v1/learner_review_signals**",
                    async route => {
                        if (await fulfillPreflight(route)) {
                            return;
                        }

                        await route.fulfill({
                            headers: jsonHeaders(),
                            json: [],
                            status: 200
                        });
                    }
                );

                await page.goto("/profile");
                await expect(page).toHaveURL(
                    /\/auth\?returnTo=%2Fprofile$/
                );

                await page.getByLabel("Adresse email").fill(
                    " Learner@Example.com "
                );
                await page.getByRole("button", {
                    name: "Recevoir mon lien"
                }).click();

                await expect(
                    page.getByRole("heading", {
                        name: "Consultez votre messagerie"
                    })
                ).toBeVisible();
                expect(requestedEmail).toBe(
                    "learner@example.com"
                );

                await page.getByLabel(
                    "Code à 6 chiffres (si affiché)"
                ).fill("123456");
                await page.getByRole("button", {
                    name: "Valider le code"
                }).click();

                await expect(page).toHaveURL(/\/profile$/);
                await expect(
                    page.getByRole("heading", {
                        name: "Mon profil"
                    })
                ).toBeVisible();
                await expect(
                    page.getByLabel("Mes crédits")
                ).toContainText("100 crédits");
                await expect(
                    page.getByLabel(
                        "Récompenses obtenues"
                    )
                ).toContainText(
                    "Terminez une leçon Voyage"
                );
                await expect(
                    page.getByLabel(
                        "Progression multi-appareils"
                    )
                ).toContainText(
                    "synchronisées sur ce compte"
                );

                await page.getByLabel("Nom affiché").fill("Mina");
                await expect(
                    page.getByText(
                        "Mina Saurus",
                        { exact: true }
                    )
                ).toBeVisible();
                await page.getByRole("button", {
                    name: "Créer mon profil"
                }).click();

                await expect(
                    page.getByRole("status")
                ).toHaveText("Profil enregistré.");
                expect(savedDisplayName).toBe("Mina");

                await page.getByLabel(
                    "Ajouter « Saurus » à mon nom"
                ).uncheck();
                await expect(
                    page.getByText("Mina", { exact: true })
                ).toBeVisible();
            }
        );

        test(
            "awards one completed Travel lesson once and lists it in the profile",
            async ({ page }) => {
                await prepareSignedInTravelLesson(
                    page
                );

                let balance = 100;
                let claimed = false;
                let rpcCalls = 0;
                let progressRpcCalls = 0;
                const unexpectedRequests:
                    string[] = [];
                const awardedAt =
                    "2026-09-08T10:00:00.000Z";
                const remoteSections = new Set([
                    "TR-006-1",
                    "TR-006-3",
                    "TR-006-4"
                ]);

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

                        if (
                            path
                            === "/auth/v1/user"
                        ) {
                            await route.fulfill({
                                headers:
                                    jsonHeaders(),
                                json:
                                    createUser(),
                                status: 200
                            });
                            return;
                        }

                        if (
                            path
                            === "/rest/v1/learner_profiles"
                        ) {
                            await route.fulfill({
                                headers:
                                    jsonHeaders(),
                                json: [],
                                status: 200
                            });
                            return;
                        }

                        if (
                            path
                            === "/rest/v1/learner_lesson_progress"
                        ) {
                            await route.fulfill({
                                headers:
                                    jsonHeaders(),
                                json: [
                                    {
                                        completed_sections: [
                                            ...remoteSections
                                        ],
                                        content_type:
                                            "travel",
                                        current_section:
                                            1,
                                        last_accessed:
                                            awardedAt,
                                        lesson_id:
                                            "TR-006",
                                        status:
                                            "completed",
                                        updated_at:
                                            awardedAt
                                    }
                                ],
                                status: 200
                            });
                            return;
                        }

                        if (
                            path
                            === "/rest/v1/learner_review_signals"
                        ) {
                            await route.fulfill({
                                headers:
                                    jsonHeaders(),
                                json: [],
                                status: 200
                            });
                            return;
                        }

                        if (
                            path
                            === "/rest/v1/rpc/sync_lesson_progress"
                        ) {
                            progressRpcCalls += 1;
                            const body = request.postDataJSON() as Record<
                                string,
                                unknown
                            >;

                            expect(body).toMatchObject({
                                p_content_type:
                                    "travel",
                                p_lesson_id:
                                    "TR-006",
                                p_status:
                                    "completed"
                            });
                            for (
                                const section
                                of body.p_completed_sections as string[]
                            ) {
                                remoteSections.add(section);
                            }

                            await route.fulfill({
                                headers:
                                    jsonHeaders(),
                                json: [
                                    {
                                        completed_sections: [
                                            ...remoteSections
                                        ],
                                        content_type:
                                            "travel",
                                        current_section:
                                            1,
                                        last_accessed:
                                            awardedAt,
                                        lesson_id:
                                            "TR-006",
                                        status:
                                            "completed",
                                        updated_at:
                                            awardedAt
                                    }
                                ],
                                status: 200
                            });
                            return;
                        }

                        if (
                            path
                            === "/rest/v1/learning_reward_rules"
                        ) {
                            await route.fulfill({
                                headers:
                                    jsonHeaders(),
                                json: [
                                    {
                                        activity_id:
                                            "TR-006",
                                        activity_type:
                                            "travel_lesson",
                                        reward_credits:
                                            5
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
                                headers:
                                    jsonHeaders(),
                                json:
                                    claimed
                                        ? [
                                            {
                                                activity_id:
                                                    "TR-006",
                                                activity_type:
                                                    "travel_lesson",
                                                awarded_at:
                                                    awardedAt,
                                                credits_awarded:
                                                    5
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
                                headers:
                                    jsonHeaders(),
                                json: [
                                    {
                                        created_at:
                                            awardedAt,
                                        credits:
                                            balance,
                                        updated_at:
                                            awardedAt,
                                        user_id:
                                            learnerId
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
                            rpcCalls += 1;

                            expect(
                                request.postDataJSON()
                            ).toEqual({
                                p_activity_id:
                                    "TR-006",
                                p_activity_type:
                                    "travel_lesson"
                            });
                            expect(
                                [...remoteSections].sort()
                            ).toEqual([
                                "TR-006-1",
                                "TR-006-2",
                                "TR-006-3",
                                "TR-006-4"
                            ]);

                            const awarded =
                                !claimed;

                            if (awarded) {
                                claimed = true;
                                balance += 5;
                            }

                            await route.fulfill({
                                headers:
                                    jsonHeaders(),
                                json: [
                                    {
                                        activity_id:
                                            "TR-006",
                                        activity_type:
                                            "travel_lesson",
                                        awarded,
                                        awarded_at:
                                            awardedAt,
                                        credits_awarded:
                                            5,
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
                    "/travel/TR-006"
                );
                await expect(
                    page.getByText("3 / 4")
                ).toBeVisible();
                expect(balance).toBe(100);
                expect(rpcCalls).toBe(0);
                await expect.poll(
                    () => progressRpcCalls
                ).toBe(1);

                await page.getByRole(
                    "button",
                    {
                        name: /Mini-Dialogue : À la réception/u
                    }
                ).click();
                await page.getByRole(
                    "button",
                    { name: /Continuer/u }
                ).click();
                await expect(
                    page.getByText("4 / 4")
                ).toBeVisible();
                await expect(
                    page.getByText(
                        "🎉 5 crédits gagnés"
                    )
                ).toBeVisible();
                expect(balance).toBe(105);
                expect(rpcCalls).toBe(1);
                await expect.poll(
                    () => progressRpcCalls
                ).toBe(2);

                await page.reload();
                await expect(
                    page.getByText(
                        "🎉 5 crédits gagnés"
                    )
                ).toBeVisible();
                expect(balance).toBe(105);
                expect(rpcCalls).toBe(1);
                expect(progressRpcCalls).toBe(3);

                await page.goto("/profile");
                await expect(
                    page.getByLabel("Mes crédits")
                ).toContainText(
                    "105 crédits"
                );
                await expect(
                    page.getByLabel(
                        "Récompenses obtenues"
                    ).getByRole(
                        "link",
                        {
                            name: "À l'hôtel"
                        }
                    )
                ).toHaveAttribute(
                    "href",
                    "/travel/TR-006"
                );
                await expect(
                    page.getByLabel(
                        "Progression multi-appareils"
                    )
                ).toContainText(
                    "synchronisées sur ce compte"
                );
                expect(
                    unexpectedRequests
                ).toEqual([]);
            }
        );

        test(
            "keeps the authentication screen localized in Persian",
            async ({ page }) => {
                await prepareCompletedOnboarding(page, "fa");
                await page.goto("/auth");

                await expect(page.locator("html")).toHaveAttribute(
                    "dir",
                    "rtl"
                );
                await expect(
                    page.getByRole("heading", {
                        name: "ورود با ایمیل"
                    })
                ).toBeVisible();
                await expect(
                    page.getByLabel("نشانی ایمیل")
                ).toBeVisible();
            }
        );
    }
);
