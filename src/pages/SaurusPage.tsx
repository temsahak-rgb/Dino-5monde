import {
    useMemo,
    useState
} from "react";
import {
    Link,
    Navigate
} from "react-router";

import {
    isSaurusKey,
    recommendSaurus,
    saurusQuizQuestions,
    type SaurusKey
} from "../core/saurusAllocation.js";
import {
    SaurusIdentityCard
} from "../features/profile/SaurusIdentityCard.js";
import {
    SaurusChoice
} from "../features/profile/SaurusChoice.js";
import {
    SaurusQuizQuestion
} from "../features/profile/SaurusQuizQuestion.js";
import {
    countCompletedSaurusActivities
} from "../features/profile/saurusProgress.js";
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
    useLearningRewardHistory
} from "../services/backend/LearningRewardsProvider.js";
import {
    useLessonProgressSync
} from "../services/backend/LessonProgressSyncProvider.js";
import {
    BackButton,
    Card
} from "../ui/components/Controls.js";
import {
    Page,
    PageHeader
} from "../ui/components/Layout.js";

function SaurusPage() {
    const { t } = useI18n();
    const { status: authStatus } =
        useAuth();
    const {
        assignSaurus,
        profile,
        status: profileStatus
    } = useLearnerProfile();
    const { rewards } =
        useLearningRewardHistory();
    const { progress } =
        useLessonProgressSync();
    const [answers, setAnswers] =
        useState<SaurusKey[]>([]);
    const [selectedSaurus, setSelectedSaurus] =
        useState<SaurusKey | null>(null);
    const [busy, setBusy] =
        useState(false);
    const [error, setError] =
        useState(false);

    const assignedSaurus =
        profile?.assigned_saurus
        && isSaurusKey(
            profile.assigned_saurus
        )
            ? profile.assigned_saurus
            : null;
    const completedActivities =
        useMemo(
            () =>
                countCompletedSaurusActivities(
                    progress,
                    rewards
                ),
            [
                progress,
                rewards
            ]
        );

    if (authStatus === "signed-out") {
        return (
            <Navigate
                replace
                to="/auth?returnTo=%2Fsaurus"
            />
        );
    }

    if (
        authStatus === "loading"
        || profileStatus === "loading"
    ) {
        return (
            <Page>
                <Card className="p-6" role="status">
                    {t("common.loading")}
                </Card>
            </Page>
        );
    }

    if (profileStatus === "missing") {
        return (
            <Navigate
                replace
                to="/profile"
            />
        );
    }

    if (
        authStatus === "backend-disabled"
        || authStatus === "error"
        || profileStatus === "backend-disabled"
        || profileStatus === "error"
        || !profile
    ) {
        return (
            <Page>
                <BackButton fallback="/profile">
                    ← {t("common.back")}
                </BackButton>
                <Card
                    className="border-warning bg-warning-soft p-6 text-amber-900"
                    role="alert"
                >
                    <strong>
                        {t("saurus.error.title")}
                    </strong>
                    <p className="mt-2 text-sm leading-6">
                        {t("saurus.error.body")}
                    </p>
                </Card>
            </Page>
        );
    }

    if (assignedSaurus) {
        return (
            <Page>
                <BackButton fallback="/profile">
                    ← {t("common.back")}
                </BackButton>
                <PageHeader
                    eyebrow={t("saurus.eyebrow")}
                    icon="🌟"
                    title={t("saurus.assigned.title")}
                    description={t(
                        "saurus.assigned.introduction"
                    )}
                />
                <SaurusIdentityCard
                    completedActivities={
                        completedActivities
                    }
                    species={assignedSaurus}
                />
                <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:justify-end">
                    <Link
                        className="inline-flex min-h-11 items-center justify-center rounded-control border border-line bg-surface px-4 py-2.5 text-sm font-bold text-ink no-underline hover:bg-dino-50"
                        to="/profile"
                    >
                        {t("saurus.assigned.profile")}
                    </Link>
                    <Link
                        className="inline-flex min-h-11 items-center justify-center rounded-control bg-dino-600 px-4 py-2.5 text-sm font-bold text-white no-underline hover:bg-dino-700"
                        to="/"
                    >
                        {t("saurus.assigned.home")}
                    </Link>
                </div>
            </Page>
        );
    }

    const questionIndex =
        answers.length;
    const question =
        saurusQuizQuestions[
            questionIndex
        ];
    const recommendation =
        answers.length === 3
            ? recommendSaurus(answers)
            : null;

    function answerQuestion(
        answer: SaurusKey
    ): void {
        const nextAnswers = [
            ...answers,
            answer
        ];

        setAnswers(nextAnswers);
        setError(false);

        if (
            nextAnswers.length ===
                saurusQuizQuestions.length
        ) {
            setSelectedSaurus(
                recommendSaurus(nextAnswers)
            );
        }
    }

    async function confirmChoice():
    Promise<void> {
        if (
            answers.length !== 3
            || !selectedSaurus
        ) {
            return;
        }

        setBusy(true);
        setError(false);

        try {
            await assignSaurus({
                answers,
                selectedSaurus
            });
        } catch {
            setError(true);
        } finally {
            setBusy(false);
        }
    }

    return (
        <Page>
            <BackButton fallback="/profile">
                ← {t("common.back")}
            </BackButton>
            <PageHeader
                eyebrow={t("saurus.eyebrow")}
                icon="🦕"
                title={t("saurus.title")}
                description={t("saurus.introduction")}
            />

            {question ? (
                <SaurusQuizQuestion
                    onAnswer={answerQuestion}
                    questionIndex={questionIndex}
                />
            ) : recommendation ? (
                <SaurusChoice
                    busy={busy}
                    error={error}
                    onChange={species => {
                        setSelectedSaurus(species);
                        setError(false);
                    }}
                    onConfirm={() => {
                        void confirmChoice();
                    }}
                    onRestart={() => {
                        setAnswers([]);
                        setSelectedSaurus(null);
                        setError(false);
                    }}
                    recommendation={recommendation}
                    selectedSaurus={selectedSaurus}
                />
            ) : null}
        </Page>
    );
}

export {
    SaurusPage
};
