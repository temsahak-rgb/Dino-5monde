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
