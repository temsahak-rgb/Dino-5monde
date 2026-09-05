import {
    expect,
    test,
    type Locator,
    type Page
} from "@playwright/test";

const mobileViewport = {
    width: 390,
    height: 844
};

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

async function expectTouchHeight(
    locator: Locator
): Promise<void> {
    const box =
        await locator.boundingBox();

    expect(box).not.toBeNull();
    expect(box?.height).toBeGreaterThanOrEqual(
        44
    );
}

test.describe(
    "phone ergonomics",
    () => {
        test.beforeEach(
            async ({ page }) => {
                await page.setViewportSize(
                    mobileViewport
                );
                await seedCompletedOnboarding(
                    page
                );
            }
        );

        test(
            "keeps primary routes inside a narrow viewport",
            async ({ page }) => {
                for (
                    const path
                    of [
                        "/",
                        "/grammar",
                        "/vocabulary",
                        "/travel/TR-006"
                    ]
                ) {
                    await page.goto(path);

                    const widths =
                        await page.evaluate(
                            () => ({
                                viewport:
                                    document.documentElement.clientWidth,
                                content:
                                    document.documentElement.scrollWidth
                            })
                        );

                    expect(widths.content).toBeLessThanOrEqual(
                        widths.viewport
                    );
                }
            }
        );

        test(
            "provides a real mascot and touch-sized navbar actions",
            async ({ page }) => {
                await page.goto("/");

                const brand =
                    page.getByRole(
                        "link",
                        {
                            name:
                                "Français avec Dino"
                        }
                    );

                await expect(
                    brand.locator(
                        "[data-dino-mascot='true']"
                    )
                ).toBeVisible();

                await expectTouchHeight(
                    brand
                );
                await expectTouchHeight(
                    page.getByRole(
                        "button",
                        {
                            name:
                                "Rechercher"
                        }
                    )
                );
                await expectTouchHeight(
                    page.getByRole(
                        "button",
                        {
                            name:
                                "Menu"
                        }
                    )
                );
            }
        );

        test(
            "keeps the navigation panel scrollable and on screen",
            async ({ page }) => {
                await page.goto("/");
                await page.getByRole(
                    "button",
                    {
                        name: "Menu"
                    }
                ).click();

                const menu =
                    page.locator(
                        "#main-navigation-menu"
                    );

                await expect(menu).toBeVisible();

                const box =
                    await menu.boundingBox();

                expect(box).not.toBeNull();
                expect(box?.x).toBeGreaterThanOrEqual(0);
                expect(
                    (box?.x ?? 0)
                    + (box?.width ?? 0)
                ).toBeLessThanOrEqual(
                    mobileViewport.width
                );
                expect(box?.height).toBeLessThan(
                    mobileViewport.height
                );

                for (
                    const link
                    of await menu.locator("a").all()
                ) {
                    await expectTouchHeight(
                        link
                    );
                }
            }
        );

        test(
            "turns search into a usable phone-sized panel",
            async ({ page }) => {
                await page.goto("/");
                await page.getByRole(
                    "button",
                    {
                        name:
                            "Rechercher"
                    }
                ).click();

                const dialog =
                    page.getByRole(
                        "dialog",
                        {
                            name:
                                "Rechercher"
                        }
                    );

                await expect(dialog).toBeVisible();

                const box =
                    await dialog.boundingBox();

                expect(box).not.toBeNull();
                expect(box?.width).toBeLessThanOrEqual(
                    mobileViewport.width
                );
                expect(box?.height).toBeGreaterThanOrEqual(
                    mobileViewport.height
                    - 32
                );

                await expectTouchHeight(
                    page.getByRole(
                        "button",
                        {
                            name:
                                "Fermer la recherche"
                        }
                    )
                );

                const fontSize =
                    await page.getByRole(
                        "searchbox"
                    ).evaluate(
                        element =>
                            Number.parseFloat(
                                getComputedStyle(
                                    element
                                ).fontSize
                            )
                    );

                expect(fontSize).toBeGreaterThanOrEqual(
                    16
                );

                await page.getByRole(
                    "searchbox"
                ).fill(
                    "Azadi"
                );

                await expect(
                    page.locator(
                        "a[href='/journal/2026-w34-azadi-tower']"
                    )
                ).toBeVisible();
            }
        );
    }
);
