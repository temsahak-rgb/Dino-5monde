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
                            new Date(
                                Date.now()
                                - 86_400_000
                            ).toISOString(),
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

test(
    "daily session stops proposing tasks once today's goal is reached",
    async ({ page }) => {
        await page.addInitScript(
            () => {
                const completedAt =
                    new Date().toISOString();

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
                    "dino_exercise_attempts",
                    JSON.stringify(
                        [
                            [
                                "grammar",
                                "A1-G-001"
                            ],
                            [
                                "travel",
                                "TR-006"
                            ],
                            [
                                "vocabulary",
                                "salutations_expressions_quotidiennes"
                            ]
                        ].map(
                            (
                                [
                                    contentType,
                                    activityId
                                ],
                                index
                            ) => ({
                                activityId,
                                attemptId:
                                    "33333333-3333-4333-8333-33333333333"
                                    + index,
                                completedAt,
                                contentType,
                                correctAnswers:
                                    4,
                                exerciseId:
                                    "daily-"
                                    + index,
                                level:
                                    contentType
                                    === "vocabulary"
                                        ? "A1"
                                        : undefined,
                                totalQuestions:
                                    5
                            })
                        )
                    )
                );
            }
        );

        await page.goto("/daily");

        await expect(
            page.getByRole(
                "heading",
                {
                    name:
                        "Objectif du jour atteint !"
                }
            )
        ).toBeVisible();
        await expect(
            page.locator(
                "[data-daily-task]"
            )
        ).toHaveCount(0);
        await expect(
            page.getByRole(
                "progressbar",
                {
                    name:
                        "Objectif quotidien"
                }
            )
        ).toHaveAttribute(
            "aria-valuenow",
            "3"
        );
        await expect(
            page.getByRole(
                "link",
                {
                    name:
                        "Voir mes révisions →"
                }
            )
        ).toHaveAttribute(
            "href",
            "/practice/review"
        );
    }
);

test(
    "Home shows today's progress and opens only the remaining daily step",
    async ({ page }) => {
        await page.addInitScript(
            () => {
                const completedAt =
                    new Date().toISOString();

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
                    "dino_exercise_attempts",
                    JSON.stringify([
                        {
                            activityId:
                                "A1-G-001",
                            attemptId:
                                "55555555-5555-4555-8555-555555555551",
                            completedAt,
                            contentType:
                                "grammar",
                            correctAnswers:
                                4,
                            exerciseId:
                                "grammar-daily",
                            totalQuestions:
                                5
                        },
                        {
                            activityId:
                                "TR-006",
                            attemptId:
                                "55555555-5555-4555-8555-555555555552",
                            completedAt,
                            contentType:
                                "travel",
                            correctAnswers:
                                5,
                            exerciseId:
                                "travel-daily",
                            totalQuestions:
                                5
                        }
                    ])
                );
            }
        );

        await page.goto("/");

        const callout =
            page.getByRole(
                "link",
                {
                    name:
                        "Ouvrir ma session du jour"
                }
            );

        await expect(
            callout
        ).toContainText(
            "2/3 aujourd’hui"
        );
        await expect(
            callout.getByRole(
                "progressbar",
                {
                    name:
                        "Objectif quotidien"
                }
            )
        ).toHaveAttribute(
            "aria-valuenow",
            "2"
        );

        await callout.click();

        await expect(page).toHaveURL(
            /\/daily$/u
        );
        await expect(
            page.locator(
                "[data-daily-task]"
            )
        ).toHaveCount(1);
    }
);
