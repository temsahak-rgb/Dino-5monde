import type {
    Session
} from "@supabase/supabase-js";

import type {
    DinoBackendClient
} from "./supabaseClient.js";

type AuthSessionListener =
    (session: Session | null) => void;

interface AuthGateway {
    getSession: () => Promise<Session | null>;
    requestEmailOtp: (
        email: string,
        redirectTo?: string
    ) => Promise<void>;
    verifyEmailOtp: (
        email: string,
        token: string
    ) => Promise<Session>;
    signOut: () => Promise<void>;
    subscribe: (
        listener: AuthSessionListener
    ) => () => void;
}

function normalizeEmail(
    value: string
): string {
    const email =
        value
            .trim()
            .toLocaleLowerCase("en-US");

    if (
        email.length > 254
        || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/u.test(
            email
        )
    ) {
        throw new TypeError(
            "A valid email address is required"
        );
    }

    return email;
}

function normalizeEmailOtp(
    value: string
): string {
    const token =
        value.replace(
            /\s/gu,
            ""
        );

    if (!/^\d{6}$/u.test(token)) {
        throw new TypeError(
            "The email OTP must contain exactly 6 digits"
        );
    }

    return token;
}

function createSupabaseAuthGateway(
    client: DinoBackendClient
): AuthGateway {
    return {
        async getSession() {
            const {
                data,
                error
            } = await client.auth.getSession();

            if (error) {
                throw error;
            }

            return data.session;
        },

        async requestEmailOtp(
            email,
            redirectTo
        ) {
            const {
                error
            } = await client.auth.signInWithOtp({
                email:
                    normalizeEmail(
                        email
                    ),
                options: {
                    emailRedirectTo:
                        redirectTo,
                    shouldCreateUser: true
                }
            });

            if (error) {
                throw error;
            }
        },

        async verifyEmailOtp(
            email,
            token
        ) {
            const {
                data,
                error
            } = await client.auth.verifyOtp({
                email:
                    normalizeEmail(
                        email
                    ),
                token:
                    normalizeEmailOtp(
                        token
                    ),
                type: "email"
            });

            if (
                error
                || !data.session
            ) {
                throw error
                    ?? new Error(
                        "Email OTP verification did not create a session"
                    );
            }

            return data.session;
        },

        async signOut() {
            const {
                error
            } = await client.auth.signOut();

            if (error) {
                throw error;
            }
        },

        subscribe(
            listener
        ) {
            const {
                data
            } = client.auth.onAuthStateChange(
                (
                    _event,
                    session
                ) => {
                    listener(
                        session
                    );
                }
            );

            return () => {
                data.subscription.unsubscribe();
            };
        }
    };
}

export {
    createSupabaseAuthGateway,
    normalizeEmail,
    normalizeEmailOtp,
    type AuthGateway,
    type AuthSessionListener
};
