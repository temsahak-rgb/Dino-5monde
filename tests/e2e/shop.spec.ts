import {
    expect,
    test,
    type Page,
    type Route
} from "@playwright/test";

const learnerId =
    "11111111-1111-4111-8111-111111111111";

const shopLesson = {
    active: true,
    cefr_level: "C1",
    content_id: "C1-G-001",
    content_type: "grammar",
    created_at: "2026-09-05T12:00:00.000Z",
    description_fa: "درس پیشرفتهٔ دستور زبان",
    description_fr:
        "Maîtrisez les temps du récit pour raconter avec précision et nuance.",
    display_order: 1,
    id: "grammar-c1-g-001",
    price_credits: 30,
    title_fa: "دستور زبان پیشرفته",
    title_fr:
        "Raconter au passé : les temps du récit",
    updated_at: "2026-09-05T12:00:00.000Z"
} as const;

interface ShopBackendState {
    balance: number;
    catalogReads: number;
    owned: boolean;
    rpcCalls: number;
    unexpectedRequests: string[];
    walletReads: number;
}

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

function createUser() {
    const now =
        "2026-09-05T12:00:00.000Z";

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

async function prepareBrowser(
    page: Page,
    signedIn: boolean
): Promise<void> {
    const accessToken =
        createAccessToken();
    const user =
        createUser();

    await page.addInitScript(
        ({
            authenticated,
            sessionToken,
            sessionUser
        }) => {
            localStorage.setItem(
                "language",
                "fr"
            );
            localStorage.setItem(
                "currentPath",
                "general"
            );
            localStorage.setItem(
                "placementResult",
                "C1"
            );

            if (!authenticated) {
                localStorage.removeItem(
                    "sb-supabase-auth-token"
                );
                return;
            }

            localStorage.setItem(
                "sb-supabase-auth-token",
                JSON.stringify({
                    access_token:
                        sessionToken,
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
            authenticated: signedIn,
            sessionToken: accessToken,
            sessionUser: user
        }
    );
}

async function installShopBackendMock(
    page: Page,
    initialState: Pick<
        ShopBackendState,
        "balance" | "owned"
    >
): Promise<ShopBackendState> {
    const state: ShopBackendState = {
        ...initialState,
        catalogReads: 0,
        rpcCalls: 0,
        unexpectedRequests: [],
        walletReads: 0
    };

    await page.route(
        "https://supabase.test/**",
        async route => {
            const request =
                route.request();
            const requestUrl =
                new URL(request.url());
            const path =
                requestUrl.pathname;

            if (request.method() === "OPTIONS") {
                await route.fulfill({
                    body: "",
                    headers: jsonHeaders(),
                    status: 204
                });
                return;
            }

            if (path === "/auth/v1/user") {
                await route.fulfill({
                    headers: jsonHeaders(),
                    json: createUser(),
                    status: 200
                });
                return;
            }

            if (path === "/rest/v1/shop_lessons") {
                state.catalogReads += 1;

                await route.fulfill({
                    headers: jsonHeaders(),
                    json: [
                        shopLesson
                    ],
                    status: 200
                });
                return;
            }

            if (path === "/rest/v1/learner_profiles") {
                await route.fulfill({
                    headers: jsonHeaders(),
                    json: [],
                    status: 200
                });
                return;
            }

            if (path === "/rest/v1/learner_wallets") {
                state.walletReads += 1;

                await route.fulfill({
                    headers: jsonHeaders(),
                    json: [
                        {
                            created_at:
                                "2026-09-05T12:00:00.000Z",
                            credits:
                                state.balance,
                            updated_at:
                                "2026-09-05T12:00:00.000Z",
                            user_id: learnerId
                        }
                    ],
                    status: 200
                });
                return;
            }

            if (path === "/rest/v1/lesson_entitlements") {
                await route.fulfill({
                    headers: jsonHeaders(),
                    json: state.owned
                        ? [
                            {
                                price_paid: 30,
                                purchased_at:
                                    "2026-09-05T12:00:00.000Z",
                                shop_lesson_id:
                                    shopLesson.id,
                                user_id: learnerId
                            }
                        ]
                        : [],
                    status: 200
                });
                return;
            }

            if (
                path
                === "/rest/v1/rpc/purchase_shop_lesson"
            ) {
                state.rpcCalls += 1;

                const body =
                    request.postDataJSON() as Record<
                        string,
                        unknown
                    >;

                if (
                    request.method() !== "POST"
                    || body.p_shop_lesson_id
                        !== shopLesson.id
                ) {
                    state.unexpectedRequests.push(
                        `${request.method()} ${path}`
                    );
                    await route.abort();
                    return;
                }

                const purchased =
                    !state.owned
                    && state.balance
                        >= shopLesson.price_credits;

                if (purchased) {
                    state.balance -=
                        shopLesson.price_credits;
                    state.owned = true;
                }

                await route.fulfill({
                    headers: jsonHeaders(),
                    json: [
                        {
                            credits_remaining:
                                state.balance,
                            purchased,
                            shop_lesson_id:
                                shopLesson.id
                        }
                    ],
                    status: 200
                });
                return;
            }

            state.unexpectedRequests.push(
                `${request.method()} ${path}`
            );
            await route.abort();
        }
    );

    return state;
}

test.describe(
    "lesson Shop",
    () => {
        test(
            "starts with 100 credits and purchases an unowned lesson atomically",
            async ({ page }) => {
                await prepareBrowser(
                    page,
                    true
                );
                const backend =
                    await installShopBackendMock(
                        page,
                        {
                            balance: 100,
                            owned: false
                        }
                    );

                await page.goto("/shop");

                await expect(
                    page.getByRole("heading", {
                        name: "Boutique",
                        exact: true
                    })
                ).toBeVisible();
                await expect(
                    page.getByLabel("Mon solde")
                ).toContainText("100 crédits");

                await page.getByRole("button", {
                    name: "Acheter · 30 crédits",
                    exact: true
                }).click();

                await expect(
                    page.getByLabel("Mon solde")
                ).toContainText("70 crédits");
                const openLesson =
                    page.getByRole("link", {
                        name: "Ouvrir la leçon",
                        exact: true
                    });

                await expect(
                    openLesson
                ).toBeVisible();

                await openLesson.click();
                await expect(
                    page
                ).toHaveURL(
                    /\/grammar\/lesson\/C1-G-001$/u
                );
                await expect(
                    page.getByText(
                        "Cette leçon est à débloquer",
                        { exact: true }
                    )
                ).toHaveCount(0);

                expect(backend.rpcCalls).toBe(1);
                expect(backend.balance).toBe(70);
                expect(backend.owned).toBe(true);
                expect(
                    backend.unexpectedRequests
                ).toEqual([]);
            }
        );

        test(
            "does not offer a second debit for an owned lesson",
            async ({ page }) => {
                await prepareBrowser(
                    page,
                    true
                );
                const backend =
                    await installShopBackendMock(
                        page,
                        {
                            balance: 70,
                            owned: true
                        }
                    );

                await page.goto("/shop");

                await expect(
                    page.getByLabel("Mon solde")
                ).toContainText("70 crédits");
                await expect(
                    page.getByRole("link", {
                        name: "Ouvrir la leçon",
                        exact: true
                    })
                ).toBeVisible();
                await expect(
                    page.getByRole("button", {
                        name: /Acheter/u
                    })
                ).toHaveCount(0);

                expect(backend.rpcCalls).toBe(0);
                expect(backend.balance).toBe(70);
                expect(
                    backend.unexpectedRequests
                ).toEqual([]);
            }
        );

        test(
            "refuses a purchase when the learner lacks credits",
            async ({ page }) => {
                await prepareBrowser(
                    page,
                    true
                );
                const backend =
                    await installShopBackendMock(
                        page,
                        {
                            balance: 20,
                            owned: false
                        }
                    );

                await page.goto("/shop");

                const disabledPurchase =
                    page.getByRole("button", {
                        name: "Crédits insuffisants",
                        exact: true
                    });

                await expect(
                    disabledPurchase
                ).toBeDisabled();
                expect(backend.rpcCalls).toBe(0);
                expect(backend.balance).toBe(20);
                expect(
                    backend.unexpectedRequests
                ).toEqual([]);
            }
        );

        test(
            "asks an unauthenticated visitor to sign in",
            async ({ page }) => {
                await prepareBrowser(
                    page,
                    false
                );
                const backend =
                    await installShopBackendMock(
                        page,
                        {
                            balance: 100,
                            owned: false
                        }
                    );

                await page.goto("/shop");

                await expect(
                    page.getByRole("link", {
                        name:
                            "Se connecter pour acheter",
                        exact: true
                    })
                ).toHaveAttribute(
                    "href",
                    "/auth?returnTo=%2Fshop"
                );

                expect(backend.walletReads).toBe(0);
                expect(backend.rpcCalls).toBe(0);
                expect(
                    backend.unexpectedRequests
                ).toEqual([]);
            }
        );

        test(
            "protects a paid lesson reached through a shared URL",
            async ({ page }) => {
                await prepareBrowser(
                    page,
                    false
                );
                const backend =
                    await installShopBackendMock(
                        page,
                        {
                            balance: 100,
                            owned: false
                        }
                    );

                await page.goto(
                    "/grammar/lesson/C1-G-001"
                );

                await expect(
                    page.getByText(
                        "Cette leçon est à débloquer",
                        { exact: true }
                    )
                ).toBeVisible();
                await expect(
                    page.getByRole("link", {
                        name:
                            "Se connecter pour la débloquer",
                        exact: true
                    })
                ).toHaveAttribute(
                    "href",
                    "/auth?returnTo=%2Fgrammar%2Flesson%2FC1-G-001"
                );

                expect(backend.walletReads).toBe(0);
                expect(backend.rpcCalls).toBe(0);
                expect(
                    backend.unexpectedRequests
                ).toEqual([]);
            }
        );

        test(
            "marks paid catalog cards without querying the backend for free navigation",
            async ({ page }) => {
                await prepareBrowser(
                    page,
                    false
                );
                const backend =
                    await installShopBackendMock(
                        page,
                        {
                            balance: 100,
                            owned: false
                        }
                    );

                await page.goto("/grammar/C1");

                await expect(
                    page.getByText(
                        "Boutique · 30 crédits",
                        { exact: true }
                    ).first()
                ).toBeVisible();
                expect(backend.catalogReads).toBe(0);

                await page.goto(
                    "/vocabulary/B1/arrival-office"
                );
                await expect(
                    page.getByRole("button", {
                        name: /Retour/u
                    }).first()
                ).toBeVisible();
                expect(backend.catalogReads).toBe(0);
                expect(
                    backend.unexpectedRequests
                ).toEqual([]);
            }
        );
    }
);
