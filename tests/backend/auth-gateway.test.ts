import assert from "node:assert/strict";
import test from "node:test";

import type {
    Session
} from "@supabase/supabase-js";

import {
    createSupabaseAuthGateway,
    normalizeEmail,
    normalizeEmailOtp
} from "../../src/services/backend/authGateway.js";
import type {
    DinoBackendClient
} from "../../src/services/backend/supabaseClient.js";

const session = {
    user: {
        email: "learner@example.com",
        id: "11111111-1111-4111-8111-111111111111"
    }
} as Session;

test(
    "email OTP input is normalized and rejects malformed values",
    () => {
        assert.equal(
            normalizeEmail("  Learner@Example.COM "),
            "learner@example.com"
        );
        assert.equal(
            normalizeEmailOtp("123 456"),
            "123456"
        );
        assert.throws(
            () => normalizeEmail("missing-at.example.com"),
            TypeError
        );
        assert.throws(
            () => normalizeEmailOtp("12345"),
            TypeError
        );
    }
);

test(
    "Supabase gateway requests and verifies one email OTP",
    async () => {
        const calls: unknown[] = [];
        let unsubscribed = false;
        let listenerSession: Session | null = null;

        const client = {
            auth: {
                getSession: async () => ({
                    data: { session },
                    error: null
                }),
                onAuthStateChange: (
                    listener: (
                        event: string,
                        nextSession: Session | null
                    ) => void
                ) => {
                    listener("SIGNED_IN", session);

                    return {
                        data: {
                            subscription: {
                                unsubscribe: () => {
                                    unsubscribed = true;
                                }
                            }
                        }
                    };
                },
                signInWithOtp: async (input: unknown) => {
                    calls.push(input);
                    return { error: null };
                },
                signOut: async () => ({ error: null }),
                verifyOtp: async (input: unknown) => {
                    calls.push(input);
                    return {
                        data: { session },
                        error: null
                    };
                }
            }
        } as unknown as DinoBackendClient;

        const gateway =
            createSupabaseAuthGateway(client);

        assert.equal(
            await gateway.getSession(),
            session
        );

        const unsubscribe =
            gateway.subscribe(
                nextSession => {
                    listenerSession = nextSession;
                }
            );

        assert.equal(
            listenerSession,
            session
        );

        await gateway.requestEmailOtp(
            " Learner@Example.com ",
            "https://dino.example/profile"
        );
        await gateway.verifyEmailOtp(
            "Learner@Example.com",
            "123 456"
        );

        assert.deepEqual(
            calls,
            [
                {
                    email: "learner@example.com",
                    options: {
                        emailRedirectTo:
                            "https://dino.example/profile",
                        shouldCreateUser: true
                    }
                },
                {
                    email: "learner@example.com",
                    token: "123456",
                    type: "email"
                }
            ]
        );

        unsubscribe();
        assert.equal(
            unsubscribed,
            true
        );
    }
);
