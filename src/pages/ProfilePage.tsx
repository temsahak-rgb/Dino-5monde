import {
    type FormEvent,
    useEffect,
    useState
} from "react";
import {
    Navigate
} from "react-router";

import {
    useI18n
} from "../i18n/I18nProvider.js";
import {
    useAuth
} from "../services/backend/AuthProvider.js";
import {
    useLearnerProfile
} from "../services/backend/LearnerProfileProvider.js";
import {
    formatLearnerDisplayName,
    isLearnerAvatarKey,
    type LearnerAvatarKey
} from "../services/backend/learnerProfileRepository.js";
import {
    BackButton,
    Button,
    Card
} from "../ui/components/Controls.js";
import {
    Page,
    PageHeader
} from "../ui/components/Layout.js";

const avatarOptions = [
    {
        icon: "🦖",
        key: "dino-green",
        labelKey: "profile.avatar.green"
    },
    {
        icon: "🦕",
        key: "dino-blue",
        labelKey: "profile.avatar.blue"
    },
    {
        icon: "🦖",
        key: "dino-coral",
        labelKey: "profile.avatar.coral"
    }
] as const;

const inputClassName = `
    min-h-12 w-full rounded-control border border-line bg-surface px-3.5
    py-2.5 text-base text-ink outline-none transition focus:border-dino-500
    focus:ring-2 focus:ring-dino-200
`;

function ProfilePage() {
    const {
        t
    } = useI18n();
    const {
        signOut,
        status: authStatus,
        user
    } = useAuth();
    const {
        profile,
        saveProfile,
        status: profileStatus
    } = useLearnerProfile();

    const [displayName, setDisplayName] =
        useState("");
    const [avatarKey, setAvatarKey] =
        useState<LearnerAvatarKey>("dino-green");
    const [showSaurusSuffix, setShowSaurusSuffix] =
        useState(true);
    const [busy, setBusy] =
        useState(false);
    const [saved, setSaved] =
        useState(false);
    const [error, setError] =
        useState<string | null>(null);

    useEffect(
        () => {
            if (!profile) {
                return;
            }

            setDisplayName(profile.display_name);
            setAvatarKey(
                isLearnerAvatarKey(profile.avatar_key)
                    ? profile.avatar_key
                    : "dino-green"
            );
            setShowSaurusSuffix(
                profile.show_saurus_suffix
            );
        },
        [profile]
    );

    if (authStatus === "signed-out") {
        return (
            <Navigate
                to="/auth?returnTo=%2Fprofile"
                replace
            />
        );
    }

    async function submit(
        event: FormEvent<HTMLFormElement>
    ): Promise<void> {
        event.preventDefault();
        setBusy(true);
        setSaved(false);
        setError(null);

        try {
            await saveProfile({
                avatarKey,
                displayName,
                showSaurusSuffix
            });
            setSaved(true);
        } catch (reason) {
            setError(
                reason instanceof TypeError
                    ? t("profile.invalid")
                    : t("profile.saveError")
            );
        } finally {
            setBusy(false);
        }
    }

    const loading =
        authStatus === "loading"
        || profileStatus === "loading";
    const unavailable =
        authStatus === "backend-disabled"
        || authStatus === "error"
        || profileStatus === "backend-disabled"
        || profileStatus === "error";
    const preview =
        displayName.trim()
            ? formatLearnerDisplayName({
                display_name: displayName,
                show_saurus_suffix: showSaurusSuffix
            })
            : t("profile.previewPlaceholder");

    return (
        <Page>
            <BackButton fallback="/">
                ← {t("common.back")}
            </BackButton>
            <PageHeader
                eyebrow={t("profile.eyebrow")}
                icon="👤"
                title={t("profile.title")}
                description={t(
                    profile
                        ? "profile.editIntroduction"
                        : "profile.createIntroduction"
                )}
            />

            {loading ? (
                <Card className="p-6" role="status">
                    {t("common.loading")}
                </Card>
            ) : unavailable ? (
                <Card
                    className="border-warning bg-warning-soft p-6 text-amber-900"
                    role="alert"
                >
                    <strong>
                        {t("profile.unavailableTitle")}
                    </strong>
                    <p className="mt-2 text-sm leading-6">
                        {t("profile.unavailableBody")}
                    </p>
                </Card>
            ) : (
                <form
                    className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_280px]"
                    onSubmit={submit}
                    noValidate
                >
                    <Card className="grid gap-6 p-5 sm:p-6">
                        <div>
                            <p className="text-xs font-bold uppercase tracking-[0.08em] text-muted">
                                {t("profile.email")}
                            </p>
                            <p
                                className="ltr-lock mt-1 break-all text-sm font-semibold text-ink"
                                dir="ltr"
                            >
                                {user?.email}
                            </p>
                        </div>

                        <label className="grid gap-2 text-sm font-bold text-ink">
                            {t("profile.displayName")}
                            <input
                                className={inputClassName}
                                type="text"
                                name="displayName"
                                autoComplete="nickname"
                                minLength={2}
                                maxLength={40}
                                value={displayName}
                                onChange={event => {
                                    setDisplayName(event.target.value);
                                    setSaved(false);
                                    setError(null);
                                }}
                                disabled={busy}
                                required
                            />
                            <span className="text-xs font-normal leading-5 text-muted">
                                {t("profile.displayNameHint")}
                            </span>
                        </label>

                        <fieldset>
                            <legend className="text-sm font-bold text-ink">
                                {t("profile.avatar")}
                            </legend>
                            <div className="mt-3 grid grid-cols-3 gap-2 sm:gap-3">
                                {avatarOptions.map(option => (
                                    <label
                                        className={`grid min-h-24 cursor-pointer place-items-center gap-1 rounded-card border p-2 text-center transition ${avatarKey === option.key ? "border-dino-500 bg-dino-50 ring-2 ring-dino-200" : "border-line bg-neutral-50 hover:border-dino-300"}`}
                                        key={option.key}
                                    >
                                        <input
                                            className="sr-only"
                                            type="radio"
                                            name="avatar"
                                            value={option.key}
                                            checked={avatarKey === option.key}
                                            onChange={() => {
                                                setAvatarKey(option.key);
                                                setSaved(false);
                                            }}
                                            disabled={busy}
                                        />
                                        <span
                                            aria-hidden="true"
                                            className={`text-3xl ${option.key === "dino-coral" ? "hue-rotate-[300deg]" : option.key === "dino-blue" ? "hue-rotate-[150deg]" : ""}`}
                                        >
                                            {option.icon}
                                        </span>
                                        <span className="text-xs font-bold text-ink-soft">
                                            {t(option.labelKey)}
                                        </span>
                                    </label>
                                ))}
                            </div>
                        </fieldset>

                        <label className="flex min-h-11 items-start gap-3 rounded-control border border-line bg-neutral-50 p-3">
                            <input
                                className="mt-1 size-4 accent-dino-600"
                                type="checkbox"
                                name="showSaurusSuffix"
                                checked={showSaurusSuffix}
                                onChange={event => {
                                    setShowSaurusSuffix(event.target.checked);
                                    setSaved(false);
                                }}
                                disabled={busy}
                            />
                            <span>
                                <strong className="block text-sm text-ink">
                                    {t("profile.saurusSuffix")}
                                </strong>
                                <span className="mt-1 block text-xs leading-5 text-muted">
                                    {t("profile.saurusSuffixHint")}
                                </span>
                            </span>
                        </label>

                        {error ? (
                            <p
                                className="rounded-control border border-danger bg-danger-soft p-3 text-sm font-semibold text-danger"
                                role="alert"
                            >
                                {error}
                            </p>
                        ) : null}
                        {saved ? (
                            <p
                                className="rounded-control border border-dino-200 bg-dino-50 p-3 text-sm font-semibold text-dino-800"
                                role="status"
                            >
                                {t("profile.saved")}
                            </p>
                        ) : null}

                        <Button
                            type="submit"
                            fullWidth
                            disabled={busy}
                        >
                            {busy
                                ? t("common.loading")
                                : t(
                                    profile
                                        ? "profile.save"
                                        : "profile.create"
                                )}
                        </Button>
                    </Card>

                    <aside className="grid content-start gap-4">
                        <Card className="p-5 text-center">
                            <p className="text-xs font-bold uppercase tracking-[0.08em] text-muted">
                                {t("profile.preview")}
                            </p>
                            <span
                                className="mt-4 block text-5xl"
                                aria-hidden="true"
                            >
                                {avatarOptions.find(
                                    option => option.key === avatarKey
                                )?.icon}
                            </span>
                            <strong className="mt-3 block break-words text-lg text-dino-800">
                                {preview}
                            </strong>
                        </Card>

                        <Button
                            variant="secondary"
                            fullWidth
                            disabled={busy}
                            onClick={() => {
                                setBusy(true);
                                setSaved(false);
                                setError(null);
                                void signOut()
                                    .catch(() => {
                                        setError(
                                            t("profile.signOutError")
                                        );
                                    })
                                    .finally(
                                        () => setBusy(false)
                                    );
                            }}
                        >
                            {t("profile.signOut")}
                        </Button>
                    </aside>
                </form>
            )}
        </Page>
    );
}

export {
    ProfilePage
};
