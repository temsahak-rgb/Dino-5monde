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
    loadLearnerWallet,
    loadLessonEntitlements,
    loadShopLessons,
    purchaseShopLesson,
    type ShopLesson
} from "./shopRepository.js";

type ShopStatus =
    | "backend-disabled"
    | "loading"
    | "ready"
    | "error";

interface ShopContextValue {
    balance: number | null;
    error: Error | null;
    ownedProductIds: readonly string[];
    products: readonly ShopLesson[];
    purchaseLesson: (
        shopLessonId: string
    ) => Promise<void>;
    retry: () => void;
    status: ShopStatus;
}

interface ShopWalletContextValue {
    balance: number | null;
    error: Error | null;
    retry: () => void;
    status: ShopStatus;
}

interface LessonAccessContextValue {
    error: Error | null;
    ownedProductIds: readonly string[];
    products: readonly ShopLesson[];
    retry: () => void;
    status: ShopStatus;
}

interface ShopProviderProps {
    children: ReactNode;
}

type ShopConsumer =
    | "access"
    | "shop"
    | "wallet";

type ResourceStatus =
    | "idle"
    | "loading"
    | "ready"
    | "error";

interface ShopContextInternalValue {
    accessStatus: ShopStatus;
    balance: number | null;
    error: Error | null;
    ownedProductIds: readonly string[];
    products: readonly ShopLesson[];
    purchaseLesson: (
        shopLessonId: string
    ) => Promise<void>;
    registerConsumer: (
        consumer: ShopConsumer
    ) => () => void;
    retry: () => void;
    shopStatus: ShopStatus;
    walletStatus: ShopStatus;
}

const ShopContext =
    createContext<ShopContextInternalValue | null>(
        null
    );

/**
 * Owns the public lesson catalogue and the authenticated learner economy.
 *
 * Credits never live in browser storage. Every purchase is delegated to the
 * atomic database function and this provider only reflects its result.
 */
function ShopProvider({
    children
}: ShopProviderProps) {
    const {
        client,
        connectionStatus,
        error: backendError
    } = useBackend();
    const {
        status: authStatus,
        user
    } = useAuth();

    const [products, setProducts] =
        useState<ShopLesson[]>([]);
    const [balance, setBalance] =
        useState<number | null>(null);
    const [ownedProductIds, setOwnedProductIds] =
        useState<string[]>([]);
    const [catalogStatus, setCatalogStatus] =
        useState<ResourceStatus>("idle");
    const [walletResourceStatus, setWalletResourceStatus] =
        useState<ResourceStatus>("idle");
    const [
        entitlementResourceStatus,
        setEntitlementResourceStatus
    ] = useState<ResourceStatus>("idle");
    const [error, setError] =
        useState<Error | null>(null);
    const [consumerCounts, setConsumerCounts] =
        useState<Record<ShopConsumer, number>>({
            access: 0,
            shop: 0,
            wallet: 0
        });
    const [reloadCount, setReloadCount] =
        useState(0);
    const loadedCatalogClient =
        useRef<typeof client>(
            null
        );

    const registerConsumer =
        useCallback(
            (
                consumer: ShopConsumer
            ) => {
                let registered = true;

                setConsumerCounts(
                    current => ({
                        ...current,
                        [consumer]:
                            current[consumer] + 1
                    })
                );

                return () => {
                    if (!registered) {
                        return;
                    }

                    registered = false;
                    setConsumerCounts(
                        current => ({
                            ...current,
                            [consumer]:
                                Math.max(
                                    0,
                                    current[consumer] - 1
                                )
                        })
                    );
                };
            },
            []
        );

    const retry =
        useCallback(
            () => {
                loadedCatalogClient.current =
                    null;
                setError(null);
                setReloadCount(
                    current =>
                        current + 1
                );
            },
            []
        );

    const catalogNeeded =
        consumerCounts.shop > 0
        || consumerCounts.access > 0;
    const walletNeeded =
        consumerCounts.shop > 0
        || consumerCounts.wallet > 0;
    const entitlementsNeeded =
        consumerCounts.shop > 0
        || consumerCounts.access > 0;

    useEffect(
        () => {
            let active = true;

            if (!client) {
                setProducts([]);
                loadedCatalogClient.current =
                    null;
                setCatalogStatus(
                    connectionStatus === "error"
                        ? "error"
                        : "idle"
                );

                return () => {
                    active = false;
                };
            }

            if (!catalogNeeded) {
                return () => {
                    active = false;
                };
            }

            if (
                loadedCatalogClient.current
                === client
            ) {
                return () => {
                    active = false;
                };
            }

            setProducts([]);
            setCatalogStatus("loading");
            setError(null);

            void loadShopLessons(client).then(
                loadedProducts => {
                    if (!active) {
                        return;
                    }

                    setProducts(loadedProducts);
                    loadedCatalogClient.current =
                        client;
                    setCatalogStatus("ready");
                },
                reason => {
                    if (!active) {
                        return;
                    }

                    setError(
                        asError(
                            reason,
                            "Unable to load the lesson shop"
                        )
                    );
                    loadedCatalogClient.current =
                        null;
                    setCatalogStatus("error");
                }
            );

            return () => {
                active = false;
            };
        },
        [
            catalogNeeded,
            client,
            connectionStatus,
            reloadCount
        ]
    );

    useEffect(
        () => {
            let active = true;

            setBalance(null);

            if (
                !client
                || !walletNeeded
                || authStatus !== "signed-in"
                || !user
            ) {
                setWalletResourceStatus("idle");

                return () => {
                    active = false;
                };
            }

            setWalletResourceStatus("loading");
            setError(null);

            void loadLearnerWallet(
                client,
                user.id
            ).then(
                wallet => {
                    if (!active) {
                        return;
                    }

                    if (!wallet) {
                        throw new Error(
                            "Authenticated learner wallet is missing"
                        );
                    }

                    setBalance(wallet.credits);
                    setWalletResourceStatus("ready");
                }
            ).catch(reason => {
                if (!active) {
                    return;
                }

                setError(
                    asError(
                        reason,
                        "Unable to load the learner wallet"
                    )
                );
                setWalletResourceStatus("error");
            });

            return () => {
                active = false;
            };
        },
        [
            authStatus,
            client,
            reloadCount,
            user,
            walletNeeded
        ]
    );

    useEffect(
        () => {
            let active = true;

            setOwnedProductIds([]);

            if (
                !client
                || !entitlementsNeeded
                || authStatus !== "signed-in"
                || !user
            ) {
                setEntitlementResourceStatus("idle");

                return () => {
                    active = false;
                };
            }

            setEntitlementResourceStatus("loading");
            setError(null);

            void loadLessonEntitlements(
                client,
                user.id
            ).then(
                entitlements => {
                    if (!active) {
                        return;
                    }

                    setOwnedProductIds(
                        entitlements.map(
                            entitlement =>
                                entitlement.shop_lesson_id
                        )
                    );
                    setEntitlementResourceStatus("ready");
                }
            ).catch(reason => {
                if (!active) {
                    return;
                }

                setError(
                    asError(
                        reason,
                        "Unable to load lesson entitlements"
                    )
                );
                setEntitlementResourceStatus("error");
            });

            return () => {
                active = false;
            };
        },
        [
            authStatus,
            client,
            entitlementsNeeded,
            reloadCount,
            user
        ]
    );

    const purchaseLesson =
        useCallback(
            async (
                shopLessonId: string
            ): Promise<void> => {
                if (
                    !client
                    || authStatus !== "signed-in"
                    || !user
                ) {
                    throw new Error(
                        "An authenticated learner is required to purchase a lesson"
                    );
                }

                try {
                    const result =
                        await purchaseShopLesson(
                            client,
                            shopLessonId
                        );

                    setBalance(result.balance);
                    setOwnedProductIds(current =>
                        current.includes(result.shopLessonId)
                            ? current
                            : [
                                ...current,
                                result.shopLessonId
                            ]
                    );
                    setWalletResourceStatus("ready");
                    setEntitlementResourceStatus("ready");
                    setError(null);
                } catch (reason) {
                    retry();
                    throw reason;
                }
            },
            [
                authStatus,
                client,
                retry,
                user
            ]
        );

    const accountStatuses =
        authStatus === "signed-in"
            ? [
                walletResourceStatus,
                entitlementResourceStatus
            ]
            : [];

    const shopStatus =
        resolveShopStatus(
            connectionStatus,
            authStatus,
            [
                catalogStatus,
                ...accountStatuses
            ]
        );

    const walletStatus =
        resolveShopStatus(
            connectionStatus,
            authStatus,
            authStatus === "signed-in"
                ? [
                    walletResourceStatus
                ]
                : []
        );

    const accessStatus =
        resolveShopStatus(
            connectionStatus,
            authStatus,
            [
                catalogStatus,
                ...(
                    authStatus === "signed-in"
                        ? [
                            entitlementResourceStatus
                        ]
                        : []
                )
            ]
        );

    const value =
        useMemo<ShopContextInternalValue>(
            () => ({
                accessStatus,
                balance,
                error:
                    backendError
                    ?? error,
                ownedProductIds,
                products,
                purchaseLesson,
                registerConsumer,
                retry,
                shopStatus,
                walletStatus
            }),
            [
                accessStatus,
                backendError,
                balance,
                error,
                ownedProductIds,
                products,
                purchaseLesson,
                registerConsumer,
                retry,
                shopStatus,
                walletStatus
            ]
        );

    return (
        <ShopContext.Provider value={value}>
            {children}
        </ShopContext.Provider>
    );
}

function useShop(): ShopContextValue {
    const value =
        useShopContext("shop");

    return {
        balance: value.balance,
        error: value.error,
        ownedProductIds:
            value.ownedProductIds,
        products: value.products,
        purchaseLesson:
            value.purchaseLesson,
        retry: value.retry,
        status: value.shopStatus
    };
}

function useShopWallet():
    ShopWalletContextValue {
    const value =
        useShopContext("wallet");

    return {
        balance: value.balance,
        error: value.error,
        retry: value.retry,
        status: value.walletStatus
    };
}

function useLessonAccess():
    LessonAccessContextValue {
    const value =
        useShopContext("access");

    return {
        error: value.error,
        ownedProductIds:
            value.ownedProductIds,
        products: value.products,
        retry: value.retry,
        status: value.accessStatus
    };
}

function useShopContext(
    consumer: ShopConsumer
): ShopContextInternalValue {
    const value =
        useContext(ShopContext);

    useEffect(
        () => {
            if (!value) {
                return;
            }

            return value.registerConsumer(
                consumer
            );
        },
        [
            consumer,
            value
                ?.registerConsumer
        ]
    );

    if (!value) {
        throw new Error(
            "useShop must be used within ShopProvider"
        );
    }

    return value;
}

function resolveShopStatus(
    connectionStatus:
        ReturnType<
            typeof useBackend
        >["connectionStatus"],
    authStatus:
        ReturnType<
            typeof useAuth
        >["status"],
    resourceStatuses:
        readonly ResourceStatus[]
): ShopStatus {
    if (
        connectionStatus === "disabled"
        || authStatus === "backend-disabled"
    ) {
        return "backend-disabled";
    }

    if (
        connectionStatus === "error"
        || authStatus === "error"
        || resourceStatuses.includes(
            "error"
        )
    ) {
        return "error";
    }

    if (
        connectionStatus !== "ready"
        || authStatus === "loading"
        || resourceStatuses.some(
            status =>
                status !== "ready"
        )
    ) {
        return "loading";
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
    ShopProvider,
    useLessonAccess,
    useShop,
    useShopWallet,
    type LessonAccessContextValue,
    type ShopContextValue,
    type ShopProviderProps,
    type ShopStatus,
    type ShopWalletContextValue
};
