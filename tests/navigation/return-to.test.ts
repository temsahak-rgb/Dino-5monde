import assert from "node:assert/strict";
import test from "node:test";

import {
    createDeploymentUrl,
    getSafeReturnTo
} from "../../src/core/returnTo.js";

test(
    "return targets preserve internal routes and transient URL state",
    () => {
        assert.equal(
            getSafeReturnTo(
                "/profile?tab=identity#avatar"
            ),
            "/profile?tab=identity#avatar"
        );
    }
);

test(
    "deployment URLs preserve the GitHub Pages repository basename",
    () => {
        assert.equal(
            createDeploymentUrl(
                "https://temsahak-rgb.github.io",
                "/Dino-5monde/",
                "/profile?tab=identity"
            ),
            "https://temsahak-rgb.github.io/Dino-5monde/profile?tab=identity"
        );
        assert.equal(
            createDeploymentUrl(
                "http://127.0.0.1:4173",
                "/",
                "/profile"
            ),
            "http://127.0.0.1:4173/profile"
        );
    }
);

test(
    "return targets reject external, malformed and looping destinations",
    () => {
        for (
            const value
            of [
                null,
                "https://example.test/profile",
                "//example.test/profile",
                "/profile\\escape"
            ]
        ) {
            assert.equal(
                getSafeReturnTo(
                    value,
                    {
                        fallback: "/profile"
                    }
                ),
                "/profile"
            );
        }

        assert.equal(
            getSafeReturnTo(
                "/auth?returnTo=/auth",
                {
                    blockedPaths: [
                        "/auth"
                    ],
                    fallback: "/profile"
                }
            ),
            "/profile"
        );
    }
);
