import {
    expect,
    test,
    type Page
} from "@playwright/test";

async function seedCompletedOnboarding(
    page: Page
): Promise<void> {
    await page.addInitScript(
        () => {
            localStorage.setItem(
                "language",
                "fr"
            );
            localStorage.setItem(
                "currentPath",
                "travel"
            );
            localStorage.setItem(
                "placementResult",
                "A1"
            );
        }
    );
}

test.describe(
    "site search",
    () => {
        test(
            "finishes a delayed index load and opens the selected result",
            async ({ page }) => {
                await seedCompletedOnboarding(
                    page
                );

                await page.route(
                    "**/search-index.json",
                    async route => {
                        const response =
                            await route.fetch();

                        await new Promise(
                            resolve =>
                                setTimeout(
                                    resolve,
                                    250
                                )
                        );

                        await route.fulfill({
                            response
                        });
                    }
                );

                await page.goto("/");
                await page.getByRole(
                    "button",
                    {
                        name:
                            "Rechercher"
                    }
                ).click();

                const searchbox =
                    page.getByRole(
                        "searchbox"
                    );

                await searchbox.fill(
                    "Azadi"
                );

                await expect(
                    page.locator(
                        "#search-results"
                    )
                ).toContainText(
                    "Recherche..."
                );

                const article =
                    page.locator(
                        'a[data-search-result][href="/journal/2026-w34-azadi-tower"]'
                    );

                await expect(
                    article
                ).toBeVisible();

                await article.click();

                await expect(page).toHaveURL(
                    /\/journal\/2026-w34-azadi-tower$/
                );
                await expect(
                    page.getByRole(
                        "heading",
                        {
                            name:
                                /La tour Azadi/
                        }
                    )
                ).toBeVisible();
                await expect(
                    page.getByRole(
                        "dialog",
                        {
                            name:
                                "Rechercher"
                        }
                    )
                ).toBeHidden();
            }
        );
    }
);
