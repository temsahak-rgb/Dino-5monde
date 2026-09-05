import {
    expect,
    test,
    type Page
} from "@playwright/test";

test.beforeEach(
    async ({ context }) => {
        await context.route(
            "https://supabase.test/rest/v1/shop_lessons**",
            async route => {
                if (
                    route.request().method()
                    === "OPTIONS"
                ) {
                    await route.fulfill({
                        body: "",
                        headers: {
                            "access-control-allow-origin":
                                "*"
                        },
                        status: 204
                    });
                    return;
                }

                await route.fulfill({
                    headers: {
                        "access-control-allow-origin":
                            "*",
                        "content-type":
                            "application/json"
                    },
                    json: [],
                    status: 200
                });
            }
        );
    }
);

async function seedCompletedOnboarding(
    page: Page,
    language: "fr" | "fa" = "fr"
): Promise<void> {
    await page.addInitScript(
        selectedLanguage => {
            localStorage.setItem(
                "language",
                selectedLanguage
            );
            localStorage.setItem(
                "currentPath",
                "travel"
            );
            localStorage.setItem(
                "placementResult",
                "A1"
            );
        },
        language
    );
}

test.describe(
    "shareable React Router navigation",
    () => {
        test(
            "opens and reloads a real Travel deep link",
            async ({ page }) => {
                await seedCompletedOnboarding(page);
                await page.goto("/travel/TR-006");

                await expect(
                    page.getByRole("heading", {
                        name: "À l'hôtel",
                        exact: true
                    })
                ).toBeVisible();
                await expect(page).toHaveURL(
                    /\/travel\/TR-006$/
                );

                await page.reload();

                await expect(
                    page.getByRole("heading", {
                        name: "À l'hôtel",
                        exact: true
                    })
                ).toBeVisible();
                await expect(page).toHaveURL(
                    /\/travel\/TR-006$/
                );
            }
        );

        test(
            "exposes real Home links and navigates without reload",
            async ({ page }) => {
                await seedCompletedOnboarding(page);
                await page.goto("/");

                const articleLink =
                    page.locator(
                        'a[href="/journal/2026-w34-azadi-tower"]'
                    );

                await expect(articleLink).toBeVisible();
                await articleLink.click();
                await expect(page).toHaveURL(
                    /\/journal\/2026-w34-azadi-tower$/
                );

                await page.goBack();

                await expect(
                    page.getByRole("link", {
                        name: "Journal →",
                        exact: true
                    })
                ).toHaveAttribute("href", "/journal");

                const expectedLinks = [
                    [
                        "Comment bien utiliser le passé composé ?",
                        "/grammar"
                    ],
                    [
                        "10 expressions pour ouvrir un compte bancaire",
                        "/vocabulary"
                    ],
                    [
                        "Guide complet de l'aéroport CDG",
                        "/travel"
                    ],
                    [
                        "En France, dites toujours Bonjour en premier !",
                        "/journal"
                    ]
                ] as const;

                for (
                    const [name, href]
                    of expectedLinks
                ) {
                    await expect(
                        page.getByRole("link", {
                            name: new RegExp(name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"))
                        })
                    ).toHaveAttribute("href", href);
                }

                await page.getByRole("link", {
                    name: /Comment bien utiliser le passé composé/
                }).click();
                await expect(page).toHaveURL(/\/grammar$/);
            }
        );

        test(
            "does not duplicate an active destination in browser history",
            async ({ page }) => {
                await seedCompletedOnboarding(page);
                await page.goto("/");

                await page.getByRole("button", {
                    name: "Menu",
                    exact: true
                }).click();
                await page.getByRole("link", {
                    name: "Grammaire",
                    exact: true
                }).click();
                await expect(page).toHaveURL(/\/grammar$/);

                const historyLength =
                    await page.evaluate(
                        () => history.length
                    );

                await page.getByRole("button", {
                    name: "Menu",
                    exact: true
                }).click();
                await page.getByRole("link", {
                    name: "Grammaire",
                    exact: true
                }).click();

                expect(
                    await page.evaluate(
                        () => history.length
                    )
                ).toBe(historyLength);

                await page.goBack();
                await expect(page).toHaveURL(/\/$/);
            }
        );

        test(
            "keeps catalog history and lesson-local state outside the URL",
            async ({ page }) => {
                await seedCompletedOnboarding(page);
                await page.goto("/grammar");

                await page.locator(
                    'a[href="/grammar/A1"]'
                ).click();
                await expect(page).toHaveURL(/\/grammar\/A1$/);
                await expect(
                    page.locator("#main-content")
                ).toBeFocused();

                await page.locator(
                    'a[href="/grammar/lesson/A1-G-001"]'
                ).first().click();
                await expect(page).toHaveURL(
                    /\/grammar\/lesson\/A1-G-001$/
                );

                const lessonUrl = page.url();

                await page.locator(
                    "main button:has(h2)"
                ).first().click();
                await expect(page).toHaveURL(lessonUrl);

                await page.getByRole("button", {
                    name: /Retour/
                }).last().click();
                await expect(page).toHaveURL(lessonUrl);

                await page.getByRole("button", {
                    name: /Retour/
                }).first().click();
                await expect(page).toHaveURL(/\/grammar\/A1$/);

                await page.goBack();
                await expect(page).toHaveURL(/\/grammar$/);
                await page.goForward();
                await expect(page).toHaveURL(/\/grammar\/A1$/);
                await page.goForward();
                await expect(page).toHaveURL(
                    /\/grammar\/lesson\/A1-G-001$/
                );
            }
        );

        test(
            "preserves a requested deep link until onboarding completes",
            async ({ page }) => {
                await page.goto("/travel/TR-006");

                await expect(page).toHaveURL(
                    /\/onboarding\?returnTo=%2Ftravel%2FTR-006$/
                );
                await page.getByRole("button", {
                    name: /Français/
                }).click();
                await page.getByRole("button", {
                    name: /Français Voyage/
                }).click();

                await expect(page).toHaveURL(
                    /\/travel\/TR-006$/
                );
                await expect(
                    page.getByRole("heading", {
                        name: "À l'hôtel",
                        exact: true
                    })
                ).toBeVisible();
            }
        );

        test(
            "opens Vocabulary and Journal detail URLs directly",
            async ({ page }) => {
                await seedCompletedOnboarding(page);
                await page.goto(
                    "/vocabulary/B1/arrival-office"
                );

                await expect(page).toHaveURL(
                    /\/vocabulary\/B1\/arrival-office$/
                );
                await expect(
                    page.getByRole("button", {
                        name: /Retour/
                    }).first()
                ).toBeVisible();

                await page.goto(
                    "/journal/2026-w34-azadi-tower"
                );

                await expect(page).toHaveURL(
                    /\/journal\/2026-w34-azadi-tower$/
                );
                await expect(
                    page.getByRole("heading", {
                        name: /La tour Azadi/
                    })
                ).toBeVisible();
            }
        );

        test(
            "keeps invalid and missing resources on explicit error pages",
            async ({ page }) => {
                await seedCompletedOnboarding(page);
                await page.goto("/travel/%20");

                await expect(
                    page.getByText(
                        "Leçon introuvable.",
                        { exact: true }
                    )
                ).toBeVisible();
                await expect(page).toHaveURL(/\/travel\/%20$/);

                await page.goto("/travel/TR-999");

                await expect(
                    page.getByText(
                        "Leçon introuvable.",
                        { exact: true }
                    )
                ).toBeVisible();
                await expect(page).toHaveURL(/\/travel\/TR-999$/);

                await page.goto("/route-inconnue");

                await expect(
                    page.locator(
                        '[data-error-page="not-found"]'
                    )
                ).toBeVisible();
                await expect(page).toHaveURL(/\/route-inconnue$/);
            }
        );

        test(
            "keeps a missing Grammar link from an article on an explicit error",
            async ({ page }) => {
                await seedCompletedOnboarding(page);
                await page.goto(
                    "/journal/2026-w34-azadi-tower"
                );

                await page.locator("summary").filter({
                    hasText: "Points de grammaire"
                }).click();
                await page.getByRole("link", {
                    name: /Voir la leçon de grammaire/
                }).first().click();

                await expect(page).toHaveURL(
                    /\/grammar\/lesson\/a1-se-trouver$/
                );
                await expect(
                    page.getByRole("heading", {
                        name: "Contenu introuvable",
                        exact: true
                    })
                ).toBeVisible();

                await page.getByRole("button", {
                    name: /Retour/
                }).click();
                await expect(page).toHaveURL(
                    /\/journal\/2026-w34-azadi-tower$/
                );
            }
        );

        test(
            "reloads an institutional React route in Persian",
            async ({ page }) => {
                await seedCompletedOnboarding(page, "fa");
                await page.goto("/info/about");

                await expect(page.locator("html"))
                    .toHaveAttribute("lang", "fa");
                await expect(
                    page.getByRole("heading", {
                        name: "درباره ما",
                        exact: true
                    })
                ).toBeVisible();
                await expect(page).toHaveURL(/\/info\/about$/);

                await page.reload();

                await expect(page.locator("html"))
                    .toHaveAttribute("dir", "rtl");
                await expect(page).toHaveURL(/\/info\/about$/);
            }
        );
    }
);
