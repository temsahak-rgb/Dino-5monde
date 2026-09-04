import {
    useCallback
} from "react";

import {
    useNavigate,
    useSearchParams
} from "react-router";

import {
    OnboardingFlow
} from "../features/onboarding/OnboardingFlow.js";

/**
 * Restricts onboarding return destinations to internal application routes.
 */
function getSafeReturnTo(
    value: string | null
): string {
    if (
        !value
        || !value.startsWith("/")
        || value.startsWith("//")
        || value.includes("\\")
    ) {
        return "/";
    }

    return value;
}

/**
 * Route-level onboarding page.
 *
 * The actual onboarding and placement state machine lives in
 * `OnboardingFlow`. This page only owns routing concerns.
 */
function OnboardingPage() {
    const navigate =
        useNavigate();

    const [
        searchParams
    ] = useSearchParams();

    const returnTo =
        getSafeReturnTo(
            searchParams.get(
                "returnTo"
            )
        );

    const handleComplete =
        useCallback(
            (): void => {
                navigate(
                    returnTo,
                    {
                        replace: true
                    }
                );
            },
            [
                navigate,
                returnTo
            ]
        );

    return (
        <main
            className="
                min-h-screen
                bg-page
                text-ink
            "
        >
            <OnboardingFlow
                onComplete={
                    handleComplete
                }
            />
        </main>
    );
}

export {
    OnboardingPage,
    getSafeReturnTo
};