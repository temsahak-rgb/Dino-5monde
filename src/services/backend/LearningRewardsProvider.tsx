import {
    createContext,
    type ReactNode,
    useCallback,
    useContext,
    useEffect,
    useMemo,
    useRef,
    useState
} from "react";

import {
    useAuth
} from "./AuthProvider.js";
import {
    useBackend
} from "./BackendProvider.js";
import {
    claimLearningReward as claimLearningRewardRequest,
    createLearningRewardKey,
    loadLearnerActivityRewards,
    loadLearningRewardRules,
    type ClaimLearningRewardResult,
    type LearnerActivityReward,
    type LearningActivityType,
    type LearningRewardRule
} from "./learningRewardRepository.js";

type LearningRewardsStatus =
    | "backend-disabled"
    | "signed-out"
    | "loading"
    | "ready"
    | "error";

interface LearningRewardValue {
    awardedAt: string | null;
    awardedCredits: number | null;
    claim: () => Promise<ClaimLearningRewardResult>;
    claiming: boolean;
    eligibleCredits: number | null;
    error: Error | null;
    retry: () => void;
    status: LearningRewardsStatus;
}

interface LearningRewardHistoryValue {
    error: Error | null;
    rewards: readonly LearnerActivityReward[];
    retry: () => void;
    status: LearningRewardsStatus;
}

interface LearningRewardsProviderProps {
    children: ReactNode;
}

type ResourceStatus =
    | "idle"
    | "loading"
    | "ready"
    | "error";

interface LearningRewardsContextValue {
    claimReward: (
        activityType: LearningActivityType,
        activityId: string
    ) => Promise<ClaimLearningRewardResult>;
    claimingKeys: ReadonlySet<string>;
    error: Error | null;
    registerConsumer: () => () => void;
    retry: () => void;
    rewards: readonly LearnerActivityReward[];
    rules: readonly LearningRewardRule[];
    status: LearningRewardsStatus;
}

const LearningRewardsContext =
    createContext<LearningRewardsContextValue | null>(
        null
    );

/**
 * Loads the server-owned reward catalogue and a learner's immutable claims.
 *
 * The provider stays dormant until a lesson or the profile requests reward
 * data. Credit amounts are never accepted from browser code.
 */
function LearningRewardsProvider({
    children
}: LearningRewardsProviderProps) {
    const {
        client,
        connectionStatus,
        error: backendError
    } = useBackend();
    const {
        status: authStatus,
        user
    } = useAuth();

    const [rules, setRules] =
        useState<LearningRewardRule[]>([]);
    const [rewards, setRewards] =
        useState<LearnerActivityReward[]>([]);
    const [rulesStatus, setRulesStatus] =
        useState<ResourceStatus>("idle");
    const [rewardsStatus, setRewardsStatus] =
        useState<ResourceStatus>("idle");
    const [error, setError] =
        useState<Error | null>(null);
    const [consumerCount, setConsumerCount] =
        useState(0);
    const [reloadCount, setReloadCount] =
        useState(0);
    const [claimingKeys, setClaimingKeys] =
        useState<Set<string>>(
            () => new Set()
        );

    const loadedRulesClient =
        useRef<typeof client>(null);
    const loadedRewardsIdentity =
        useRef<string | null>(null);
    const inFlightClaims =
        useRef<Map<
            string,
            Promise<ClaimLearningRewardResult>
        >>(new Map());

    const registerConsumer =
        useCallback(
            () => {
                let registered = true;

                setConsumerCount(
                    current =>
                        current + 1
                );

                return () => {
                    if (!registered) {
                        return;
                    }

                    registered = false;
                    setConsumerCount(
                        current =>
                            Math.max(
                                0,
                                current - 1
                            )
                    );
                };
            },
            []
        );

    const retry =
        useCallback(
            () => {
                loadedRulesClient.current =
                    null;
                loadedRewardsIdentity.current =
                    null;
                setError(null);
                setReloadCount(
                    current =>
                        current + 1
                );
            },
            []
        );

    const resourcesNeeded =
        consumerCount > 0;

    useEffect(
        () => {
            let active = true;

            if (!client) {
                setRules([]);
                loadedRulesClient.current =
                    null;
                setRulesStatus(
                    connectionStatus === "error"
                        ? "error"
                        : "idle"
                );

                return () => {
                    active = false;
                };
            }

            if (
                !resourcesNeeded
                || loadedRulesClient.current
                    === client
            ) {
                return () => {
                    active = false;
                };
            }

            setRulesStatus("loading");
            setError(null);

            void loadLearningRewardRules(
                client
            ).then(
                loadedRules => {
                    if (!active) {
                        return;
                    }

                    setRules(loadedRules);
                    loadedRulesClient.current =
                        client;
                    setRulesStatus("ready");
                },
                reason => {
                    if (!active) {
                        return;
                    }

                    loadedRulesClient.current =
                        null;
                    setError(
                        asError(
                            reason,
                            "Unable to load learning reward rules"
                        )
                    );
                    setRulesStatus("error");
                }
            );

            return () => {
                active = false;
            };
        },
        [
            client,
            connectionStatus,
            reloadCount,
            resourcesNeeded
        ]
    );

    useEffect(
        () => {
            let active = true;
            const identity =
                client
                && user
                    ? `${user.id}`
                    : null;

            if (
                !client
                || !resourcesNeeded
                || authStatus
                    !== "signed-in"
                || !user
            ) {
                setRewards([]);
                loadedRewardsIdentity.current =
                    null;
                setRewardsStatus("idle");

                return () => {
                    active = false;
                };
            }

            if (
                loadedRewardsIdentity.current
                === identity
            ) {
                return () => {
                    active = false;
                };
            }

            setRewardsStatus("loading");
            setError(null);

            void loadLearnerActivityRewards(
                client,
                user.id
            ).then(
                loadedRewards => {
                    if (!active) {
                        return;
                    }

                    setRewards(loadedRewards);
                    loadedRewardsIdentity.current =
                        identity;
                    setRewardsStatus("ready");
                },
                reason => {
                    if (!active) {
                        return;
                    }

                    loadedRewardsIdentity.current =
                        null;
                    setError(
                        asError(
                            reason,
                            "Unable to load learner rewards"
                        )
                    );
                    setRewardsStatus("error");
                }
            );

            return () => {
                active = false;
            };
        },
        [
            authStatus,
            client,
            reloadCount,
            resourcesNeeded,
            user
        ]
    );

    const claimReward =
        useCallback(
            (
                activityType: LearningActivityType,
                activityId: string
            ): Promise<ClaimLearningRewardResult> => {
                if (
                    !client
                    || authStatus
                        !== "signed-in"
                    || !user
                ) {
                    return Promise.reject(
                        new Error(
                            "An authenticated learner is required to claim a learning reward"
                        )
                    );
                }

                const key =
                    createLearningRewardKey(
                        activityType,
                        activityId
                    );
                const pending =
                    inFlightClaims.current.get(
                        key
                    );

                if (pending) {
                    return pending;
                }

                const request =
                    claimLearningRewardRequest(
                        client,
                        activityType,
                        activityId
                    ).then(
                        result => {
                            setRewards(
                                current => [
                                    {
                                        activity_id:
                                            result.activityId,
                                        activity_type:
                                            result.activityType,
                                        awarded_at:
                                            result.awardedAt,
                                        credits_awarded:
                                            result.creditsAwarded
                                    },
                                    ...current.filter(
                                        reward =>
                                            createLearningRewardKey(
                                                reward.activity_type,
                                                reward.activity_id
                                            ) !== key
                                    )
                                ]
                            );
                            setRewardsStatus("ready");
                            setError(null);

                            return result;
                        }
                    ).catch(
                        reason => {
                            /*
                             * The request may have reached PostgreSQL before a
                             * network failure. Force a read reconciliation;
                             * the RPC itself remains safe to retry.
                             */
                            loadedRewardsIdentity.current =
                                null;
                            setReloadCount(
                                current =>
                                    current + 1
                            );

                            throw reason;
                        }
                    ).finally(
                        () => {
                            inFlightClaims.current.delete(
                                key
                            );
                            setClaimingKeys(
                                current => {
                                    const next =
                                        new Set(current);

                                    next.delete(key);
                                    return next;
                                }
                            );
                        }
                    );

                inFlightClaims.current.set(
                    key,
                    request
                );
                setClaimingKeys(
                    current => {
                        const next =
                            new Set(current);

                        next.add(key);
                        return next;
                    }
                );

                return request;
            },
            [
                authStatus,
                client,
                user
            ]
        );

    const status =
        resolveLearningRewardsStatus(
            connectionStatus,
            authStatus,
            rulesStatus,
            rewardsStatus
        );

    const value =
        useMemo<LearningRewardsContextValue>(
            () => ({
                claimReward,
                claimingKeys,
                error:
                    backendError
                    ?? error,
                registerConsumer,
                retry,
                rewards,
                rules,
                status
            }),
            [
                backendError,
                claimReward,
                claimingKeys,
                error,
                registerConsumer,
                retry,
                rewards,
                rules,
                status
            ]
        );

    return (
        <LearningRewardsContext.Provider
            value={value}
        >
            {children}
        </LearningRewardsContext.Provider>
    );
}

function useLearningReward(
    activityType: LearningActivityType,
    activityId: string
): LearningRewardValue {
    const value =
        useLearningRewardsContext();
    const key =
        createLearningRewardKey(
            activityType,
            activityId
        );
    const rule =
        value.rules.find(
            candidate =>
                candidate.activity_type
                    === activityType
                && candidate.activity_id
                    === activityId
        );
    const reward =
        value.rewards.find(
            candidate =>
                candidate.activity_type
                    === activityType
                && candidate.activity_id
                    === activityId
        );

    const claim =
        useCallback(
            () =>
                value.claimReward(
                    activityType,
                    activityId
                ),
            [
                activityId,
                activityType,
                value.claimReward
            ]
        );

    return {
        awardedAt:
            reward?.awarded_at
            ?? null,
        awardedCredits:
            reward?.credits_awarded
            ?? null,
        claim,
        claiming:
            value.claimingKeys.has(key),
        eligibleCredits:
            rule?.reward_credits
            ?? null,
        error:
            value.error,
        retry:
            value.retry,
        status:
            value.status
    };
}

function useLearningRewardHistory():
    LearningRewardHistoryValue {
    const value =
        useLearningRewardsContext();

    return {
        error:
            value.error,
        rewards:
            value.rewards,
        retry:
            value.retry,
        status:
            value.status
    };
}

function useLearningRewardsContext():
    LearningRewardsContextValue {
    const value =
        useContext(
            LearningRewardsContext
        );

    useEffect(
        () => {
            if (!value) {
                return;
            }

            return value.registerConsumer();
        },
        [
            value
                ?.registerConsumer
        ]
    );

    if (!value) {
        throw new Error(
            "Learning reward hooks must be used within LearningRewardsProvider"
        );
    }

    return value;
}

function resolveLearningRewardsStatus(
    connectionStatus:
        ReturnType<
            typeof useBackend
        >["connectionStatus"],
    authStatus:
        ReturnType<
            typeof useAuth
        >["status"],
    rulesStatus: ResourceStatus,
    rewardsStatus: ResourceStatus
): LearningRewardsStatus {
    if (
        connectionStatus === "disabled"
        || authStatus
            === "backend-disabled"
    ) {
        return "backend-disabled";
    }

    if (
        connectionStatus === "error"
        || authStatus === "error"
        || rulesStatus === "error"
        || rewardsStatus === "error"
    ) {
        return "error";
    }

    if (
        connectionStatus
            !== "ready"
        || authStatus === "loading"
        || rulesStatus
            !== "ready"
        || (
            authStatus === "signed-in"
            && rewardsStatus
                !== "ready"
        )
    ) {
        return "loading";
    }

    if (authStatus === "signed-out") {
        return "signed-out";
    }

    return "ready";
}

function asError(
    reason: unknown,
    fallback: string
): Error {
    return reason instanceof Error
        ? reason
        : new Error(fallback);
}

export {
    LearningRewardsProvider,
    useLearningReward,
    useLearningRewardHistory,
    type LearningRewardHistoryValue,
    type LearningRewardsProviderProps,
    type LearningRewardsStatus,
    type LearningRewardValue
};
