import {
    type FormEvent,
    useEffect,
    useState
} from "react";
import {
    Link,
    Navigate,
    useNavigate
} from "react-router";

import {
    useI18n
} from "../i18n/I18nProvider.js";
import {
    createPracticeCatalogPath,
    practiceLevels
} from "../core/practiceRoutes.js";
import type {
    PracticeGameKind
} from "../core/practiceRoutes.js";
import {
    loadTravelIndex
} from "../features/travel/travelEngine.js";
import {
    LearningProgressDashboard
} from "../features/profile/LearningProgressDashboard.js";
import {
    ExerciseHistoryCard
} from "../features/profile/ExerciseHistoryCard.js";
import {
    DailyPracticeCard
} from "../features/profile/DailyPracticeCard.js";
import {
    SaurusIdentityCard
} from "../features/profile/SaurusIdentityCard.js";
import {
    countCompletedSaurusActivities
} from "../features/profile/saurusProgress.js";
import {
    isSaurusKey
} from "../core/saurusAllocation.js";
import {
    useAuth
} from "../services/backend/AuthProvider.js";
import {
    useLearnerProfile
} from "../services/backend/LearnerProfileProvider.js";
import {
    useLearningRewardHistory
} from "../services/backend/LearningRewardsProvider.js";
import {
    useLessonProgressSync
} from "../services/backend/LessonProgressSyncProvider.js";
import {
    useShopWallet
} from "../services/backend/ShopProvider.js";
import {
    formatLearnerDisplayName,
    isLearnerAvatarKey,
    type LearnerAvatarKey
} from "../services/backend/learnerProfileRepository.js";
import type {
    TravelLessonIndex
} from "../types/global.js";
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
    const navigate =
        useNavigate();
    const {
        language,
        localizedValue,
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
    const {
        balance,
        status: shopStatus
    } = useShopWallet();
    const {
        rewards,
        status: rewardsStatus
    } = useLearningRewardHistory();
    const {
        progress,
        status: lessonProgressSyncStatus
    } = useLessonProgressSync();

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
    const [
        travelLessons,
        setTravelLessons
    ] = useState<TravelLessonIndex[]>([]);

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

    useEffect(
        () => {
            let active = true;

            if (rewards.length === 0) {
                setTravelLessons([]);

                return () => {
                    active = false;
                };
            }

            void loadTravelIndex()
                .then(
                    lessons => {
                        if (active) {
                            setTravelLessons(
                                lessons
                            );
                        }
                    }
                );

            return () => {
                active = false;
            };
        },
        [
            rewards.length
        ]
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

        const creatingProfile =
            !profile;

        try {
            const savedProfile =
                await saveProfile({
                avatarKey,
                displayName,
                showSaurusSuffix
            });

            if (
                creatingProfile
                && !savedProfile.assigned_saurus
            ) {
                navigate("/saurus");
                return;
            }

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
    const assignedSaurus =
        profile?.assigned_saurus
        && isSaurusKey(
            profile.assigned_saurus
        )
            ? profile.assigned_saurus
            : null;
    const completedSaurusActivities =
        countCompletedSaurusActivities(
            progress,
            rewards
        );

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

            <LearningProgressDashboard
                progress={progress}
                rewards={rewards}
            />

            {assignedSaurus ? (
                <div className="mb-5">
                    <SaurusIdentityCard
                        completedActivities={
                            completedSaurusActivities
                        }
                        species={assignedSaurus}
                    />
                </div>
            ) : profile ? (
                <Card className="mb-5 flex flex-col items-start justify-between gap-4 border-dino-300 bg-dino-50 p-5 sm:flex-row sm:items-center sm:p-6">
                    <div>
                        <h2 className="text-lg font-bold text-ink">
                            {t(
                                "profile.saurusRequiredTitle"
                            )}
                        </h2>
                        <p className="mt-1 text-sm leading-6 text-muted">
                            {t(
                                "profile.saurusRequiredBody"
                            )}
                        </p>
                    </div>
                    <Link
                        className="inline-flex min-h-11 shrink-0 items-center justify-center rounded-control bg-dino-600 px-4 py-2.5 text-sm font-bold text-white no-underline hover:bg-dino-700"
                        to="/saurus"
                    >
                        {t(
                            "profile.saurusRequiredAction"
                        )}
                    </Link>
                </Card>
            ) : null}

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

                        <Card
                            className="p-5"
                            aria-label={t("profile.progressSyncTitle")}
                            aria-live="polite"
                        >
                            <div className="flex items-start gap-3">
                                <span
                                    className={`mt-1 size-3 shrink-0 rounded-full ${lessonProgressSyncStatus === "ready" ? "bg-emerald-500" : lessonProgressSyncStatus === "syncing" ? "animate-pulse bg-amber-400" : "bg-rose-500"}`}
                                    aria-hidden="true"
                                />
                                <div>
                                    <p className="text-xs font-bold uppercase tracking-[0.08em] text-muted">
                                        {t("profile.progressSyncTitle")}
                                    </p>
                                    <p className="mt-2 text-sm leading-6 text-ink-soft">
                                        {t(
                                            lessonProgressSyncStatus === "ready"
                                                ? "profile.progressSyncReady"
                                                : lessonProgressSyncStatus === "syncing"
                                                    ? "profile.progressSyncing"
                                                    : "profile.progressSyncError"
                                        )}
                                    </p>
                                </div>
                            </div>
                        </Card>

                        <Card
                            className="p-5 text-center"
                            aria-label={t("profile.credits")}
                            aria-live="polite"
                        >
                            <p className="text-xs font-bold uppercase tracking-[0.08em] text-muted">
                                {t("profile.credits")}
                            </p>
                            <strong className="mt-3 block text-2xl text-dino-800">
                                {shopStatus === "loading"
                                    ? t("common.loading")
                                    : shopStatus === "ready"
                                        && balance !== null
                                        ? t(
                                            balance === 1
                                                ? "shop.credit"
                                                : "shop.credits",
                                            { count: balance }
                                        )
                                        : t("profile.creditsUnavailable")}
                            </strong>
                            <Link
                                to="/shop"
                                className="mt-4 inline-flex min-h-11 items-center justify-center rounded-control border border-dino-600 px-4 py-2 text-sm font-bold text-dino-700 no-underline transition hover:bg-dino-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-dino-500 focus-visible:ring-offset-2"
                            >
                                {t("profile.openShop")}
                            </Link>
                        </Card>

                        <DailyPracticeCard />

                        <ExerciseHistoryCard />

                        <Card
                            className="p-5"
                            aria-label={t(
                                "profile.rewardsTitle"
                            )}
                        >
                            <p className="text-xs font-bold uppercase tracking-[0.08em] text-muted">
                                {t(
                                    "profile.rewardsTitle"
                                )}
                            </p>
                            <p className="mt-2 text-sm text-muted">
                                {t(
                                    "profile.rewardsDescription"
                                )}
                            </p>

                            {rewardsStatus
                                === "loading"
                                ? (
                                    <p
                                        className="mt-4 text-sm font-semibold"
                                        role="status"
                                    >
                                        {t(
                                            "common.loading"
                                        )}
                                    </p>
                                )
                                : rewardsStatus
                                    === "ready"
                                    && rewards.length
                                        === 0
                                    ? (
                                        <p className="mt-4 text-sm text-muted">
                                            {t(
                                                "profile.rewardsEmpty"
                                            )}
                                        </p>
                                    )
                                    : rewardsStatus
                                        === "ready"
                                        ? (
                                            <ul className="mt-4 grid gap-3">
                                                {rewards
                                                    .slice(
                                                        0,
                                                        5
                                                    )
                                                    .map(
                                                        reward => {
                                                            const lesson =
                                                                reward.activity_type
                                                                    === "travel_lesson"
                                                                    ? travelLessons.find(
                                                                        candidate =>
                                                                            candidate.id
                                                                                === reward.activity_id
                                                                    )
                                                                    : undefined;
                                                            const game =
                                                                getRewardGameKind(
                                                                    reward.activity_type
                                                                );
                                                            const title = game
                                                                ? getRewardGameTitle(
                                                                    game,
                                                                    reward.activity_id,
                                                                    t
                                                                )
                                                                : localizedValue(
                                                                    lesson?.title,
                                                                    lesson?.title_fa,
                                                                    t(
                                                                        "profile.rewardFallback"
                                                                    )
                                                                );
                                                            const rewardPath =
                                                                game
                                                                && isPracticeLevel(
                                                                    reward.activity_id
                                                                )
                                                                    ? createPracticeCatalogPath(
                                                                        game,
                                                                        reward.activity_id
                                                                    )
                                                                    : reward.activity_type
                                                                        === "travel_lesson"
                                                                        ? `/travel/${encodeURIComponent(
                                                                            reward.activity_id
                                                                        )}`
                                                                        : "/practice";

                                                            return (
                                                                <li
                                                                    key={
                                                                        `${reward.activity_type}:${reward.activity_id}`
                                                                    }
                                                                    className="rounded-control border border-line bg-canvas p-3"
                                                                >
                                                                    <Link
                                                                        to={
                                                                            rewardPath
                                                                        }
                                                                        className="font-bold text-dino-800 no-underline hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-dino-500"
                                                                    >
                                                                        {title}
                                                                    </Link>
                                                                    <span className="mt-1 flex flex-wrap items-center justify-between gap-2 text-xs text-muted">
                                                                        <span>
                                                                            {formatRewardDate(
                                                                                reward.awarded_at,
                                                                                language
                                                                            )}
                                                                        </span>
                                                                        <strong className="text-emerald-700">
                                                                            {t(
                                                                                "profile.rewardCredits",
                                                                                {
                                                                                    count:
                                                                                        reward.credits_awarded
                                                                                }
                                                                            )}
                                                                        </strong>
                                                                    </span>
                                                                </li>
                                                            );
                                                        }
                                                    )}
                                            </ul>
                                        )
                                        : (
                                            <p className="mt-4 text-sm text-muted">
                                                {t(
                                                    "profile.rewardsUnavailable"
                                                )}
                                            </p>
                                        )}
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

type TranslationFunction =
    ReturnType<typeof useI18n>["t"];

function getRewardGameKind(
    activityType: string
): PracticeGameKind | null {
    switch (activityType) {
        case "hangman_game":
            return "hangman";
        case "word_search_game":
            return "word-search";
        case "crossword_game":
            return "crossword";
        default:
            return null;
    }
}

function getRewardGameTitle(
    game: PracticeGameKind,
    level: string,
    t: TranslationFunction
): string {
    switch (game) {
        case "hangman":
            return t(
                "profile.rewardHangman",
                { level }
            );
        case "word-search":
            return t(
                "profile.rewardWordSearch",
                { level }
            );
        case "crossword":
            return t(
                "profile.rewardCrossword",
                { level }
            );
    }
}

function isPracticeLevel(
    value: string
): value is typeof practiceLevels[number] {
    return practiceLevels.some(
        level => level === value
    );
}

function formatRewardDate(
    value: string,
    language: "fa" | "fr"
): string {
    const date =
        new Date(value);

    if (
        Number.isNaN(
            date.getTime()
        )
    ) {
        return "";
    }

    return new Intl.DateTimeFormat(
        language === "fa"
            ? "fa-IR"
            : "fr-FR",
        {
            dateStyle: "medium"
        }
    ).format(date);
}

export {
    ProfilePage
};
