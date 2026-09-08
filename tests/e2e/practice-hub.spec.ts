import {
    expect,
    test,
    type Page
} from "@playwright/test";

async function seedCompletedOnboarding(
    page: Page
): Promise<void> {
    await page.addInitScript(() => {
        localStorage.setItem("language", "fr");
        localStorage.setItem("currentPath", "general");
        localStorage.setItem("placementResult", "A1");
    });
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
