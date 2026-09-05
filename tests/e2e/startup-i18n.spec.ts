import {
    expect,
    test,
    type Page
} from "@playwright/test";

type RuntimeFailureLog = {
    readonly failures: string[];
};

function watchRuntimeFailures(
    page: Page
): RuntimeFailureLog {
    const failures: string[] = [];

    page.on("pageerror", error => {
        failures.push(`pageerror: ${error.message}`);
    });
    page.on("console", message => {
        if (message.type() === "error") {
            failures.push(`console: ${message.text()}`);
        }
    });
    page.on("requestfailed", request => {
        if ([
            "document",
            "fetch",
            "script",
            "stylesheet"
        ].includes(request.resourceType())) {
            failures.push(
                `request: ${request.method()} ${request.url()} (${request.failure()?.errorText ?? "failed"})`
            );
        }
    });

    return { failures };
}

async function openApplication(
    page: Page
): Promise<RuntimeFailureLog> {
    const runtime =
        watchRuntimeFailures(page);

    await page.goto("/");
    await expect(
        page.locator("#root")
    ).toBeVisible();

    return runtime;
}

test.describe(
    "React application startup and interface language",
    () => {
        test(
            "starts without fatal runtime errors and renders onboarding",
            async ({ page }) => {
                const runtime =
                    await openApplication(page);

                await expect(page).toHaveURL(
                    /\/onboarding\?returnTo=%2F$/
                );
                await expect(
                    page.getByRole("heading", {
                        name: "Français avec Dino"
                    })
                ).toBeVisible();
                await expect(
                    page.getByText(
                        "Choisissez la langue",
                        { exact: true }
                    )
                ).toBeVisible();
                await expect(
                    page.getByRole("button", {
                        name: /Français/
                    })
                ).toBeVisible();

                expect(runtime.failures).toEqual([]);
            }
        );

        test(
            "switches from French to Persian and back with document metadata",
            async ({ page }) => {
                const runtime =
                    await openApplication(page);
                const documentRoot =
                    page.locator("html");

                await expect(documentRoot)
                    .toHaveAttribute("lang", "fr");
                await expect(documentRoot)
                    .toHaveAttribute("dir", "ltr");

                await page.getByRole("button", {
                    name: /فارسی/
                }).click();

                await expect(documentRoot)
                    .toHaveAttribute("lang", "fa");
                await expect(documentRoot)
                    .toHaveAttribute("dir", "rtl");
                await expect(
                    page.getByRole("heading", {
                        name: "مسیر یادگیری خود را انتخاب کنید"
                    })
                ).toBeVisible();

                await page.getByRole("button", {
                    name: /بازگشت/
                }).click();
                await page.getByRole("button", {
                    name: /Français/
                }).click();

                await expect(documentRoot)
                    .toHaveAttribute("lang", "fr");
                await expect(documentRoot)
                    .toHaveAttribute("dir", "ltr");
                await expect(
                    page.getByRole("heading", {
                        name: "Choisissez votre parcours"
                    })
                ).toBeVisible();

                expect(runtime.failures).toEqual([]);
            }
        );

        test(
            "keeps Persian through React Router navigation and reload",
            async ({ page }) => {
                const runtime =
                    await openApplication(page);

                await page.getByRole("button", {
                    name: /فارسی/
                }).click();
                await page.getByRole("button", {
                    name: /فرانسوی در سفر/
                }).click();

                await expect(
                    page.getByRole("heading", {
                        name: "سلام، ادامه بده!"
                    })
                ).toBeVisible();

                await page.getByRole("button", {
                    name: "منو",
                    exact: true
                }).click();
                await page.getByRole("link", {
                    name: "گرامر",
                    exact: true
                }).click();

                await expect(page).toHaveURL(/\/grammar$/);
                await expect(
                    page.getByRole("heading", {
                        name: "گرامر",
                        exact: true
                    })
                ).toBeVisible();

                await page.reload();

                await expect(page.locator("html"))
                    .toHaveAttribute("lang", "fa");
                await expect(page.locator("html"))
                    .toHaveAttribute("dir", "rtl");
                await expect(page).toHaveURL(/\/grammar$/);
                expect(
                    await page.evaluate(
                        () => localStorage.getItem("language")
                    )
                ).toBe("fa");
                expect(runtime.failures).toEqual([]);
            }
        );
    }
);
