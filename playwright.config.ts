import {
    defineConfig,
    devices
} from "@playwright/test";

const e2ePort = 4173;
const e2eBaseUrl =
    `http://127.0.0.1:${e2ePort}`;

export default defineConfig({
    testDir: "./tests/e2e",
    testMatch: "**/*.spec.ts",
    fullyParallel: true,
    forbidOnly: Boolean(process.env.CI),
    retries: process.env.CI ? 1 : 0,
    workers: process.env.CI ? 1 : undefined,
    timeout: 20_000,
    expect: {
        timeout: 5_000
    },
    reporter: process.env.CI
        ? [
            ["line"],
            [
                "html",
                {
                    open: "never",
                    outputFolder:
                        "playwright-report"
                }
            ]
        ]
        : "list",
    use: {
        ...devices["Desktop Chrome"],
        baseURL: e2eBaseUrl,
        trace: "retain-on-failure",
        screenshot: "off",
        video: "off"
    },
    webServer: {
        command:
            "npm run build && npm run serve:e2e",
        url: e2eBaseUrl,
        reuseExistingServer:
            !process.env.CI,
        timeout: 120_000,
        stdout: "pipe",
        stderr: "pipe"
    }
});
