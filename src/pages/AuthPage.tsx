import {
    type FormEvent,
    useEffect,
    useState
} from "react";

import {
    Link,
    Navigate,
    useSearchParams
} from "react-router";

import {
    createDeploymentUrl,
    getSafeReturnTo
} from "../core/returnTo.js";
import {
    useI18n
} from "../i18n/I18nProvider.js";
import {
    useAuth
} from "../services/backend/AuthProvider.js";
import {
    Button,
    Card
} from "../ui/components/Controls.js";
import {
    DinoMascot
} from "../ui/components/DinoMascot.js";

type AuthStep = "email" | "code";

const inputClassName = `
    min-h-12 w-full rounded-control border border-line bg-surface
    px-3.5 py-2.5 text-base text-ink outline-none transition
    placeholder:text-muted focus:border-dino-500 focus:ring-2
    focus:ring-dino-200
`;

function AuthPage() {
    const {
        t
    } = useI18n();
    const {
        requestEmailOtp,
        status,
        verifyEmailOtp
    } = useAuth();
    const [
        searchParams
    ] = useSearchParams();

    const returnTo =
        getSafeReturnTo(
            searchParams.get("returnTo"),
            {
                blockedPaths: [
                    "/auth",
                    "/onboarding"
                ],
                fallback: "/profile"
            }
        );

    const [step, setStep] =
        useState<AuthStep>("email");
    const [email, setEmail] =
        useState("");
    const [code, setCode] =
        useState("");
    const [busy, setBusy] =
        useState(false);
    const [error, setError] =
        useState<string | null>(null);
    const [resendSeconds, setResendSeconds] =
        useState(0);

    useEffect(
        () => {
            if (resendSeconds <= 0) {
                return;
            }

            const timeout =
                window.setTimeout(
                    () => setResendSeconds(
                        current => Math.max(
                            current - 1,
                            0
                        )
                    ),
                    1000
                );

            return () => window.clearTimeout(timeout);
        },
        [resendSeconds]
    );

    if (status === "signed-in") {
        return (
            <Navigate
                to={returnTo}
                replace
            />
        );
    }

    async function sendCode(): Promise<void> {
        setBusy(true);
        setError(null);

        try {
            const emailRedirectTo =
                createDeploymentUrl(
                    window.location.origin,
                    import.meta.env.BASE_URL,
                    returnTo
                );

            await requestEmailOtp(
                email,
                emailRedirectTo
            );
            setStep("code");
            setCode("");
            setResendSeconds(60);
        } catch (reason) {
            setError(
                reason instanceof TypeError
                    ? t("auth.invalidEmail")
                    : t("auth.genericError")
            );
        } finally {
            setBusy(false);
        }
    }

    async function submit(
        event: FormEvent<HTMLFormElement>
    ): Promise<void> {
        event.preventDefault();

        if (step === "email") {
            await sendCode();
            return;
        }

        setBusy(true);
        setError(null);

        try {
            await verifyEmailOtp(email, code);
        } catch (reason) {
            setError(
                reason instanceof TypeError
                    ? t("auth.invalidCode")
                    : t("auth.genericError")
            );
        } finally {
            setBusy(false);
        }
    }

    const unavailable =
        status === "backend-disabled"
        || status === "error";

    return (
        <main
            className="flex min-h-screen items-center justify-center bg-page px-4 py-8 text-ink sm:py-12"
        >
            <div className="w-full max-w-[520px]">
                <Link
                    to="/"
                    className="mx-auto mb-6 flex w-fit items-center gap-2 rounded-control px-2 py-1 text-lg font-extrabold text-dino-800 no-underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-dino-500"
                >
                    <DinoMascot size={42} />
                    {t("app.title")}
                </Link>

                <Card className="p-5 shadow-card sm:p-8">
                    <p className="text-xs font-extrabold uppercase tracking-[0.08em] text-dino-700">
                        {t("auth.eyebrow")}
                    </p>
                    <h1 className="mt-2 text-2xl font-extrabold text-ink sm:text-3xl">
                        {t(
                            step === "email"
                                ? "auth.title"
                                : "auth.codeTitle"
                        )}
                    </h1>
                    <p className="mt-3 text-sm leading-6 text-muted">
                        {step === "email"
                            ? t("auth.introduction")
                            : t(
                                "auth.codeSent",
                                { email }
                            )}
                    </p>

                    {unavailable ? (
                        <div
                            className="mt-6 rounded-control border border-warning bg-warning-soft p-4 text-sm leading-6 text-amber-900"
                            role="alert"
                        >
                            <strong>
                                {t("auth.unavailableTitle")}
                            </strong>
                            <p className="mt-1">
                                {t("auth.unavailableBody")}
                            </p>
                        </div>
                    ) : (
                        <form
                            className="mt-7 grid gap-5"
                            onSubmit={submit}
                            noValidate
                        >
                            {step === "email" ? (
                                <label className="grid gap-2 text-sm font-bold text-ink">
                                    {t("auth.emailLabel")}
                                    <input
                                        className={inputClassName}
                                        type="email"
                                        name="email"
                                        autoComplete="email"
                                        inputMode="email"
                                        dir="ltr"
                                        placeholder={t("auth.emailPlaceholder")}
                                        value={email}
                                        onChange={event => {
                                            setEmail(event.target.value);
                                            setError(null);
                                        }}
                                        disabled={busy}
                                        required
                                    />
                                </label>
                            ) : (
                                <label className="grid gap-2 text-sm font-bold text-ink">
                                    {t("auth.codeLabel")}
                                    <input
                                        className={`${inputClassName} text-center text-xl tracking-[0.35em]`}
                                        type="text"
                                        name="otp"
                                        autoComplete="one-time-code"
                                        inputMode="numeric"
                                        dir="ltr"
                                        pattern="[0-9]{6}"
                                        maxLength={6}
                                        value={code}
                                        onChange={event => {
                                            setCode(
                                                event.target.value
                                                    .replace(/\D/gu, "")
                                                    .slice(0, 6)
                                            );
                                            setError(null);
                                        }}
                                        disabled={busy}
                                        required
                                    />
                                </label>
                            )}

                            {error ? (
                                <p
                                    className="rounded-control border border-danger bg-danger-soft px-3.5 py-3 text-sm font-semibold text-danger"
                                    role="alert"
                                >
                                    {error}
                                </p>
                            ) : null}

                            <Button
                                type="submit"
                                fullWidth
                                disabled={busy || status === "loading"}
                            >
                                {status === "loading"
                                    ? t("common.loading")
                                    : t(
                                        step === "email"
                                            ? "auth.requestCode"
                                            : "auth.verifyCode"
                                    )}
                            </Button>

                            {step === "code" ? (
                                <div className="grid gap-2 sm:grid-cols-2">
                                    <Button
                                        variant="ghost"
                                        fullWidth
                                        disabled={busy}
                                        onClick={() => {
                                            setStep("email");
                                            setCode("");
                                            setError(null);
                                        }}
                                    >
                                        {t("auth.changeEmail")}
                                    </Button>
                                    <Button
                                        variant="secondary"
                                        fullWidth
                                        disabled={busy || resendSeconds > 0}
                                        onClick={() => {
                                            void sendCode();
                                        }}
                                    >
                                        {resendSeconds > 0
                                            ? t(
                                                "auth.resendIn",
                                                { seconds: resendSeconds }
                                            )
                                            : t("auth.resend")}
                                    </Button>
                                </div>
                            ) : null}
                        </form>
                    )}

                    <p className="mt-6 text-xs leading-5 text-muted">
                        {t("auth.privacy")}
                    </p>
                </Card>
            </div>
        </main>
    );
}

export {
    AuthPage
};
