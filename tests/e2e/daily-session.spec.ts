import {
    expect,
    test
} from "@playwright/test";

test(
    "daily session keeps its shareable URL and prioritizes recent learning signals",
    async ({ page }) => {
        await page.addInitScript(
            () => {
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
                    "A1"
                );
                localStorage.setItem(
                    "dino_mistakes",
                    JSON.stringify([{
                        lessonId:
                            "A1-G-001",
                        sectionId:
                            "exercise",
                        questionIndex:
                            0,
                        userAnswer:
                            1,
                        correctAnswer:
                            0,
                        timestamp:
                            "2026-09-08T10:00:00.000Z"
                    }])
                );
                localStorage.setItem(
                    "dino_vocab_weak",
                    JSON.stringify({
                        salutations_expressions_quotidiennes: [
                            "à bientôt"
                        ]
                    })
                );
                localStorage.setItem(
                    "dino_exercise_attempts",
                    JSON.stringify([{
                        activityId:
                            "TR-006",
                        attemptId:
                            "11111111-1111-4111-8111-111111111111",
                        completedAt:
                            "2026-09-08T11:00:00.000Z",
                        contentType:
                            "travel",
                        correctAnswers:
                            1,
                        exerciseId:
                            "TR-006-4",
                        totalQuestions:
                            3
                    }])
                );
            }
        );

        await page.setViewportSize({
            height: 760,
            width: 360
        });
        await page.goto("/daily");

        await expect(
            page.getByRole(
                "heading",
                {
                    name:
                        "Ma session du jour",
                    exact:
                        true
                }
            )
        ).toBeVisible();
        await expect(page).toHaveURL(
            /\/daily$/u
        );

        const tasks =
            page.locator(
                "[data-daily-task]"
            );

        await expect(tasks).toHaveCount(3);

        const firstTask =
            tasks.first();

        await expect(firstTask).toHaveAttribute(
            "data-daily-reason",
            "score"
        );
        await expect(firstTask).toContainText(
            "À l'hôtel"
        );
        await expect(firstTask).toContainText(
            "33%"
        );
        await expect(
            firstTask.getByRole("link")
        ).toHaveAttribute(
            "href",
            "/travel/TR-006"
        );

        const initialDestinations =
            await tasks
                .getByRole("link")
                .evaluateAll(
                    links =>
                        links.map(
                            link =>
                                link.getAttribute(
                                    "href"
                                )
                        )
                );

        await page.reload();

        await expect(page).toHaveURL(
            /\/daily$/u
        );
        await expect(
            page.locator(
                "[data-daily-task]"
            )
        ).toHaveCount(3);
        const reloadedDestinations =
            await page.locator(
                "[data-daily-task] a"
            ).evaluateAll(
                links =>
                    links.map(
                        link =>
                            link.getAttribute(
                                "href"
                            )
                    )
            );

        expect(
            reloadedDestinations
        ).toEqual(
            initialDestinations
        );

        const hasHorizontalOverflow =
            await page.evaluate(
                () =>
                    document.documentElement
                        .scrollWidth
                    > document.documentElement
                        .clientWidth
            );

        expect(
            hasHorizontalOverflow
        ).toBe(false);
    }
);
