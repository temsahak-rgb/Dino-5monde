import {
    expect,
    test,
    type Page
} from "@playwright/test";

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
                "level",
                "A1"
            );
        },
        language
    );
}

test.describe(
    "shareable application navigation",
    () => {
        test(
            "opens and reloads a real deep link",
            async ({ page }) => {
                await seedCompletedOnboarding(page);
                await page.goto(
                    "/?view=travel&lesson=TR-006"
                );

                await expect(
                    page.locator("#travel-back")
                ).toBeVisible();
                await expect(page).toHaveURL(
                    /\?view=travel&lesson=TR-006$/
                );

                await page.reload();

                await expect(
                    page.locator("#travel-back")
                ).toBeVisible();
                await expect(page).toHaveURL(
                    /\?view=travel&lesson=TR-006$/
                );
            }
        );

        test(
            "does not duplicate the active destination in browser history",
            async ({ page }) => {
                await seedCompletedOnboarding(page);
                await page.goto("/?view=home");

                await page.getByRole(
                    "button",
                    {
                        name: "Menu",
                        exact: true
                    }
                ).click();
                await page.getByRole(
                    "button",
                    {
                        name: "Grammaire",
                        exact: true
                    }
                ).click();
                await expect(page).toHaveURL(
                    /\?view=grammar$/
                );

                const historyLength =
                    await page.evaluate(
                        () => history.length
                    );

                await page.getByRole(
                    "button",
                    {
                        name: "Menu",
                        exact: true
                    }
                ).click();
                await page.getByRole(
                    "button",
                    {
                        name: "Grammaire",
                        exact: true
                    }
                ).click();
                await expect(
                    page.getByRole(
                        "heading",
                        {
                            name: "Grammaire",
                            exact: true
                        }
                    )
                ).toBeVisible();
                expect(
                    await page.evaluate(
                        () => history.length
                    )
                ).toBe(historyLength);

                await page.goBack();

                await expect(page).toHaveURL(
                    /\?view=home$/
                );
                await expect(
                    page.getByRole(
                        "heading",
                        {
                            name: "Bonjour, continuez !",
                            exact: true
                        }
                    )
                ).toBeVisible();
            }
        );

        test(
            "keeps catalog history and excludes lesson-local state from the URL",
            async ({ page }) => {
                await seedCompletedOnboarding(page);
                await page.goto("/?view=grammar");

                await page.locator(
                    '.grammar-level-card[data-level="A1"]'
                ).click();
                await expect(page).toHaveURL(
                    /\?view=grammar&level=A1$/
                );
                await expect(
                    page.locator("#app h1")
                ).toBeFocused();

                await page.locator(
                    '.grammar-lesson-card[data-lesson-id="A1-G-001"]'
                ).first().click();
                await expect(page).toHaveURL(
                    /\?view=grammar&lesson=A1-G-001$/
                );
                await expect(
                    page.locator("#back")
                ).toBeVisible();

                const lessonUrl = page.url();

                await page.locator(
                    ".grammar-section-card"
                ).first().click();
                await expect(page).toHaveURL(
                    lessonUrl
                );

                await page.locator("#back").click();
                await expect(page).toHaveURL(
                    lessonUrl
                );
                await page.locator("#back").click();
                await expect(page).toHaveURL(
                    /\?view=grammar&level=A1$/
                );
                await expect(
                    page.locator("#grammar-level-back")
                ).toBeVisible();

                await page.goBack();
                await expect(page).toHaveURL(
                    /\?view=grammar$/
                );
                await expect(
                    page.locator(
                        '.grammar-level-card[data-level="A1"]'
                    )
                ).toBeVisible();

                await page.goForward();
                await expect(page).toHaveURL(
                    /\?view=grammar&level=A1$/
                );
                await page.goForward();
                await expect(page).toHaveURL(
                    /\?view=grammar&lesson=A1-G-001$/
                );
                await expect(
                    page.locator("#back")
                ).toBeVisible();
            }
        );

        test(
            "preserves the requested deep link until onboarding completes",
            async ({ page }) => {
                await page.goto(
                    "/?view=travel&lesson=TR-006"
                );

                await expect(page).toHaveURL(
                    /\?view=travel&lesson=TR-006$/
                );
                await page.getByRole(
                    "button",
                    { name: /Français/ }
                ).click();
                await expect(page).toHaveURL(
                    /\?view=travel&lesson=TR-006$/
                );
                await page.getByRole(
                    "button",
                    {
                        name: /Français Voyage/
                    }
                ).click();

                await expect(
                    page.locator("#travel-back")
                ).toBeVisible();
                await expect(page).toHaveURL(
                    /\?view=travel&lesson=TR-006$/
                );
            }
        );

        test(
            "opens vocabulary and journal detail URLs directly",
            async ({ page }) => {
                await seedCompletedOnboarding(page);
                await page.goto(
                    "/?view=vocabulary&level=B1&pack=arrival-office"
                );

                await expect(
                    page.locator("#vocab-pack-back")
                ).toBeVisible();
                await expect(page).toHaveURL(
                    /\?view=vocabulary&level=B1&pack=arrival-office$/
                );

                await page.goto(
                    "/?view=journal&article=2026-w34-azadi-tower"
                );

                await expect(
                    page.locator("#news-back")
                ).toBeVisible();
                await expect(page).toHaveURL(
                    /\?view=journal&article=2026-w34-azadi-tower$/
                );
            }
        );

        test(
            "distinguishes unsafe identifiers from missing safe resources",
            async ({ page }) => {
                await seedCompletedOnboarding(page);
                await page.goto(
                    "/?view=travel&lesson=%20TR-006"
                );

                await expect(page).toHaveURL(
                    /\?view=home$/
                );
                await expect(
                    page.locator("#main-navbar")
                ).toBeVisible();

                await page.goto(
                    "/?view=travel&lesson=TR-999"
                );

                await expect(
                    page.locator("#travel-error-back")
                ).toBeVisible();
                await expect(page).toHaveURL(
                    /\?view=travel&lesson=TR-999$/
                );
            }
        );

        test(
            "reloads an institutional route in Persian",
            async ({ page }) => {
                await seedCompletedOnboarding(
                    page,
                    "fa"
                );
                await page.goto(
                    "/?view=info&page=about"
                );

                await expect(
                    page.locator("html")
                ).toHaveAttribute("lang", "fa");
                await expect(
                    page.getByRole(
                        "heading",
                        {
                            name: "درباره ما",
                            exact: true
                        }
                    )
                ).toBeVisible();
                await expect(
                    page.locator(
                        '[data-institutional-page="about"]'
                    )
                ).toHaveAttribute(
                    "href",
                    "?view=info&page=about"
                );

                await page.reload();

                await expect(
                    page.locator("html")
                ).toHaveAttribute("dir", "rtl");
                await expect(page).toHaveURL(
                    /\?view=info&page=about$/
                );
            }
        );
    }
);
