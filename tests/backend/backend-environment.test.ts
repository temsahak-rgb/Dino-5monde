import assert from "node:assert/strict";
import test from "node:test";

import {
    readBackendConfiguration
} from "../../src/services/backend/backendEnvironment.js";

const publishableKey =
    "sb_publishable_12345678901234567890";

test(
    "backend remains disabled when no environment is configured",
    () => {
        assert.deepEqual(
            readBackendConfiguration({}),
            {
                status: "disabled",
                reason: "missing-environment"
            }
        );
    }
);

test(
    "backend rejects partial and malformed environments",
    () => {
        assert.throws(
            () => readBackendConfiguration({
                VITE_SUPABASE_URL:
                    "https://example.supabase.co"
            }),
            /VITE_SUPABASE_PUBLISHABLE_KEY/u
        );

        assert.throws(
            () => readBackendConfiguration({
                VITE_SUPABASE_URL:
                    "http://example.supabase.co",
                VITE_SUPABASE_PUBLISHABLE_KEY:
                    publishableKey
            }),
            /must use HTTPS/u
        );

        assert.throws(
            () => readBackendConfiguration({
                VITE_SUPABASE_URL:
                    "https://example.supabase.co/project",
                VITE_SUPABASE_PUBLISHABLE_KEY:
                    publishableKey
            }),
            /must be an origin/u
        );
    }
);

test(
    "backend accepts HTTPS hosting and loopback development",
    () => {
        assert.deepEqual(
            readBackendConfiguration({
                VITE_SUPABASE_URL:
                    "https://example.supabase.co/",
                VITE_SUPABASE_PUBLISHABLE_KEY:
                    publishableKey
            }),
            {
                status: "configured",
                supabaseUrl:
                    "https://example.supabase.co",
                publishableKey
            }
        );

        assert.equal(
            readBackendConfiguration({
                VITE_SUPABASE_URL:
                    "http://127.0.0.1:54321",
                VITE_SUPABASE_PUBLISHABLE_KEY:
                    publishableKey
            }).status,
            "configured"
        );
    }
);
