import {
    expect,
    test
} from "@playwright/test";

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
