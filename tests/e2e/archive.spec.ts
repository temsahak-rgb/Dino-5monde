import {
    expect,
    test
} from "@playwright/test";

test(
    "archive reopens completed local lessons and scored exercises after reload",
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
                    "dino_lessons_progress",
                    JSON.stringify({
                        "A1-G-001": {
                            completedSections: [
                                "introduction"
                            ],
                            currentSection:
                                1,
                            lastAccessed:
                                "2026-09-08T10:00:00.000Z",
                            status:
                                "completed"
                        },
                        "TR-006": {
                            completedSections: [
                                "TR-006-1"
                            ],
                            currentSection:
                                1,
                            lastAccessed:
                                "2026-09-08T11:00:00.000Z",
                            status:
                                "in_progress"
                        }
                    })
                );
                localStorage.setItem(
                    "dino_lesson_progress_content_types",
                    JSON.stringify({
                        "A1-G-001":
                            "grammar",
                        "TR-006":
                            "travel"
                    })
                );
                localStorage.setItem(
                    "dino_exercise_attempts",
                    JSON.stringify([{
                        activityId:
                            "TR-006",
                        attemptId:
                            "44444444-4444-4444-8444-444444444444",
                        completedAt:
                            "2026-09-08T11:30:00.000Z",
                        contentType:
                            "travel",
                        correctAnswers:
                            3,
                        exerciseId:
                            "TR-006-4",
                        totalQuestions:
                            5
                    }])
                );
            }
        );

        await page.setViewportSize({
            height: 760,
            width: 360
        });
        await page.goto("/archive");

        await expect(
            page.getByRole(
                "heading",
                {
                    name:
                        "Mon archive",
                    exact:
                        true
                }
            )
        ).toBeVisible();
        await expect(page).toHaveURL(
            /\/archive$/u
        );

        const archivedLessons =
            page.locator(
                "[data-archive-lesson]"
            );

        await expect(
            archivedLessons
        ).toHaveCount(1);
        await expect(
            archivedLessons.first()
        ).toContainText(
            "Les pronoms sujets"
        );
        await expect(
            archivedLessons
                .first()
                .getByRole("link")
        ).toHaveAttribute(
            "href",
            "/grammar/lesson/A1-G-001"
        );

        const exerciseHistory =
            page.getByLabel(
                "Mes exercices"
            );

        await expect(
            exerciseHistory
        ).toContainText(
            "Voyage · TR-006"
        );
        await expect(
            exerciseHistory
        ).toContainText(
            "60%"
        );

        await page.reload();

        await expect(page).toHaveURL(
            /\/archive$/u
        );
        await expect(
            page.locator(
                "[data-archive-lesson]"
            )
        ).toHaveCount(1);

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
