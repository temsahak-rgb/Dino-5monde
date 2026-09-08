import {
    useEffect,
    useRef,
    useState
} from "react";

import type {
    PracticeGameKind
} from "../../core/practiceRoutes.js";
import {
    getLearningGameActivityType
} from "./practiceGameRewards.js";
import {
    useI18n
} from "../../i18n/I18nProvider.js";
import {
    useAuth
} from "../../services/backend/AuthProvider.js";
import {
    useBackend
} from "../../services/backend/BackendProvider.js";
import {
    completeLearningGame,
    startLearningGame
} from "../../services/backend/learningGameRepository.js";
import type {
    LearningGameAttempt
} from "../../services/backend/learningGameRepository.js";
import {
    useLearningReward
} from "../../services/backend/LearningRewardsProvider.js";
import type {
    LearningGameActivityType
} from "../../services/backend/database.types.js";
import type {
    Level
} from "../../types/global.js";
import {
    Button,
    Card
} from "../../ui/components/Controls.js";

interface PracticeGameRewardProps {
    completed: boolean;
    game: PracticeGameKind;
    level: Level;
    packId: string;
}

type AttemptRequest = {
    key: string;
    promise: Promise<LearningGameAttempt>;
};

type CompletionRequest = {
    key: string;
    promise: Promise<void>;
};

type GameRewardStatus =
    | "idle"
    | "preparing"
    | "ready"
    | "claiming"
    | "error";

/**
 * Bridges one client-side game victory to a server-issued attempt and the
 * shared, idempotent learning-reward ledger.
 */
function PracticeGameReward({
    completed,
    game,
    level,
    packId
}: PracticeGameRewardProps) {
    const {
        t
    } = useI18n();
    const {
        status: authStatus
    } = useAuth();
    const {
        client
    } = useBackend();
    const activityType =
        getLearningGameActivityType(game);
    const reward =
        useLearningReward(
            activityType,
            level
        );
    const [
        attempt,
        setAttempt
    ] = useState<LearningGameAttempt | null>(
        null
    );
    const [
        gameRewardStatus,
        setGameRewardStatus
    ] = useState<GameRewardStatus>("idle");
    const [
        retryVersion,
        setRetryVersion
    ] = useState(0);
    const startRequest =
        useRef<AttemptRequest | null>(null);
    const completionRequest =
        useRef<CompletionRequest | null>(null);
    const identity =
        `${activityType}:${level}:${packId}`;

    useEffect(
        () => {
            setAttempt(null);
            setGameRewardStatus("idle");
            startRequest.current = null;
            completionRequest.current = null;
        },
        [
            identity
        ]
    );

    useEffect(
        () => {
            if (
                !client
                || authStatus !== "signed-in"
                || reward.status !== "ready"
                || reward.eligibleCredits === null
                || reward.awardedCredits !== null
            ) {
                return;
            }

            if (
                attempt
                && isCurrentAttempt(
                    attempt,
                    activityType,
                    level
                )
            ) {
                return;
            }

            const requestKey =
                `${identity}:${retryVersion}`;
            let pending =
                startRequest.current;

            if (
                !pending
                || pending.key !== requestKey
            ) {
                pending = {
                    key: requestKey,
                    promise: startLearningGame(
                        client,
                        activityType,
                        level,
                        packId
                    )
                };
                startRequest.current = pending;
            }

            let active = true;
            setGameRewardStatus("preparing");

            void pending.promise.then(
                startedAttempt => {
                    if (!active) {
                        return;
                    }

                    setAttempt(startedAttempt);
                    setGameRewardStatus("ready");
                },
                () => {
                    if (active) {
                        setGameRewardStatus("error");
                    }
                }
            );

            return () => {
                active = false;
            };
        },
        [
            activityType,
            attempt,
            authStatus,
            client,
            identity,
            level,
            packId,
            retryVersion,
            reward.awardedCredits,
            reward.eligibleCredits,
            reward.status
        ]
    );

    useEffect(
        () => {
            if (
                !completed
                || !client
                || !attempt
                || !isCurrentAttempt(
                    attempt,
                    activityType,
                    level
                )
                || reward.awardedCredits !== null
            ) {
                return;
            }

            const requestKey =
                `${identity}:${attempt.attemptId}:${retryVersion}`;
            let pending =
                completionRequest.current;

            if (
                !pending
                || pending.key !== requestKey
            ) {
                pending = {
                    key: requestKey,
                    promise: (
                        attempt.completedAt
                            ? Promise.resolve(attempt)
                            : completeLearningGame(
                                client,
                                attempt.attemptId
                            )
                    )
                        .then(completedAttempt => {
                            setAttempt(completedAttempt);
                            return reward.claim();
                        })
                        .then(() => undefined)
                };
                completionRequest.current = pending;
            }

            let active = true;
            setGameRewardStatus("claiming");

            void pending.promise.then(
                () => {
                    if (active) {
                        setGameRewardStatus("ready");
                    }
                },
                () => {
                    if (active) {
                        setGameRewardStatus("error");
                    }
                }
            );

            return () => {
                active = false;
            };
        },
        [
            activityType,
            attempt,
            client,
            completed,
            identity,
            level,
            retryVersion,
            reward.awardedCredits,
            reward.claim
        ]
    );

    if (
        reward.eligibleCredits === null
        && reward.awardedCredits === null
    ) {
        return null;
    }

    const credits =
        reward.awardedCredits
        ?? reward.eligibleCredits
        ?? 0;
    const failed =
        gameRewardStatus === "error";
    const claiming =
        reward.claiming
        || (
            completed
            && (
                gameRewardStatus === "preparing"
                || gameRewardStatus === "claiming"
            )
        );
    const message =
        reward.awardedCredits !== null
            ? credits === 1
                ? t("rewards.awardedOne")
                : t(
                    "rewards.awarded",
                    { count: credits }
                )
            : failed
                ? t("rewards.claimError")
                : completed
                    && authStatus !== "signed-in"
                    ? t(
                        "rewards.gameSignIn",
                        { count: credits }
                    )
                    : claiming
                        ? t("rewards.claiming")
                        : t(
                            "rewards.gameAvailable",
                            {
                                count: credits,
                                level
                            }
                        );

    return (
        <Card
            className={`
                mx-auto
                mb-5
                flex
                w-full
                max-w-[960px]
                flex-wrap
                items-center
                justify-between
                gap-3
                p-4
                text-sm
                ${
                    reward.awardedCredits !== null
                        ? "border-emerald-200 bg-emerald-50 text-emerald-950"
                        : failed
                            ? "border-rose-200 bg-rose-50 text-rose-950"
                            : "border-amber-200 bg-amber-50 text-amber-950"
                }
            `}
            role="status"
            aria-live="polite"
        >
            <strong>
                {message}
            </strong>

            {failed ? (
                <Button
                    variant="secondary"
                    onClick={() => {
                        startRequest.current = null;
                        completionRequest.current = null;
                        setGameRewardStatus("idle");
                        setRetryVersion(
                            current => current + 1
                        );
                        reward.retry();
                    }}
                >
                    {t("common.retry")}
                </Button>
            ) : null}
        </Card>
    );
}

function isCurrentAttempt(
    attempt: LearningGameAttempt,
    activityType: LearningGameActivityType,
    level: Level
): boolean {
    return (
        attempt.activityType === activityType
        && attempt.activityId === level
    );
}

export {
    PracticeGameReward
};
