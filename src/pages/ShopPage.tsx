import {
    useEffect,
    useRef,
    useState
} from "react";

import {
    Link
} from "react-router";

import {
    useI18n
} from "../i18n/I18nProvider.js";

import {
    useAuth
} from "../services/backend/AuthProvider.js";

import {
    useShop
} from "../services/backend/ShopProvider.js";

import {
    createShopLessonPath
} from "../services/backend/shopRepository.js";

import {
    Badge,
    Button,
    Card
} from "../ui/components/Controls.js";

import {
    Alert,
    EmptyState,
    ErrorState,
    LoadingState
} from "../ui/components/Feedback.js";

import {
    Grid,
    Page,
    PageHeader,
    Section,
    SectionHeader
} from "../ui/components/Layout.js";

type ShopProduct =
    ReturnType<
        typeof useShop
    >["products"][number];

/**
 * Public catalog and authenticated lesson-purchase surface.
 *
 * Products remain visible before sign-in. Purchases and the private credit
 * balance are only exposed to the authenticated learner.
 */
function ShopPage() {
    const {
        localizedValue,
        t
    } = useI18n();

    const {
        status: authStatus
    } = useAuth();

    const {
        balance,
        ownedProductIds,
        products,
        purchaseLesson,
        retry,
        status: shopStatus
    } = useShop();

    const [
        purchasingProductId,
        setPurchasingProductId
    ] = useState<string | null>(
        null
    );

    const [
        purchaseError,
        setPurchaseError
    ] = useState<string | null>(
        null
    );

    const [
        purchaseConfirmation,
        setPurchaseConfirmation
    ] = useState<string | null>(
        null
    );

    const ownedProducts =
        new Set(
            ownedProductIds
        );

    const signedIn =
        authStatus === "signed-in";

    const loading =
        shopStatus === "loading"
        || authStatus === "loading";

    const unavailable =
        shopStatus === "backend-disabled"
        || authStatus === "backend-disabled";

    const failed =
        shopStatus === "error"
        || authStatus === "error";

    async function purchase(
        product: ShopProduct
    ): Promise<void> {
        if (
            !signedIn
            || purchasingProductId
        ) {
            return;
        }

        setPurchasingProductId(
            product.id
        );
        setPurchaseError(
            null
        );
        setPurchaseConfirmation(
            null
        );

        try {
            await purchaseLesson(
                product.id
            );

            setPurchaseConfirmation(
                t(
                    "shop.purchaseSuccess",
                    {
                        title:
                            localizedValue(
                                product.title_fr,
                                product.title_fa
                            )
                    }
                )
            );
        } catch {
            setPurchaseError(
                t(
                    "shop.purchaseError"
                )
            );
        } finally {
            setPurchasingProductId(
                null
            );
        }
    }

    return (
        <Page>
            <PageHeader
                eyebrow={
                    t(
                        "shop.eyebrow"
                    )
                }
                icon="🛍️"
                title={
                    t(
                        "shop.title"
                    )
                }
                description={
                    t(
                        "shop.introduction"
                    )
                }
                actions={
                    signedIn ? (
                        <Card
                            className="
                                min-w-40
                                px-4
                                py-3
                                text-center
                            "
                            aria-label={
                                t(
                                    "shop.balance"
                                )
                            }
                            aria-live="polite"
                        >
                            <span
                                className="
                                    block
                                    text-xs
                                    font-bold
                                    uppercase
                                    tracking-[0.08em]
                                    text-muted
                                "
                            >
                                {t(
                                    "shop.balance"
                                )}
                            </span>

                            <strong
                                className="
                                    mt-1
                                    block
                                    text-xl
                                    text-dino-800
                                "
                            >
                                {balance === null
                                    ? t(
                                        "shop.balanceUnavailable"
                                    )
                                    : formatCredits(
                                        balance,
                                        t
                                    )}
                            </strong>
                        </Card>
                    ) : undefined
                }
            />

            {loading ? (
                <LoadingState
                    label={
                        t(
                            "shop.loading"
                        )
                    }
                />
            ) : unavailable ? (
                <ErrorState
                    title={
                        t(
                            "shop.unavailableTitle"
                        )
                    }
                    description={
                        t(
                            "shop.unavailableBody"
                        )
                    }
                    onRetry={retry}
                    retryLabel={t("common.retry")}
                />
            ) : failed ? (
                <ErrorState
                    title={
                        t(
                            "shop.errorTitle"
                        )
                    }
                    description={
                        t(
                            "shop.errorBody"
                        )
                    }
                />
            ) : (
                <>
                    {!signedIn ? (
                        <Alert
                            className="
                                mb-6
                                flex
                                flex-col
                                gap-4
                                sm:flex-row
                                sm:items-center
                                sm:justify-between
                            "
                            title={
                                t(
                                    "shop.signInTitle"
                                )
                            }
                        >
                            <div
                                className="
                                    flex
                                    flex-col
                                    gap-4
                                    sm:flex-row
                                    sm:items-center
                                "
                            >
                                <p
                                    className="
                                        flex-1
                                    "
                                >
                                    {t(
                                        "shop.signInBody"
                                    )}
                                </p>

                                <Link
                                    to="/auth?returnTo=%2Fshop"
                                    className="
                                        inline-flex
                                        min-h-11
                                        shrink-0
                                        items-center
                                        justify-center
                                        rounded-control
                                        bg-dino-600
                                        px-4
                                        py-2.5
                                        text-sm
                                        font-bold
                                        text-white
                                        no-underline
                                        transition
                                        hover:bg-dino-700
                                        focus-visible:outline-none
                                        focus-visible:ring-2
                                        focus-visible:ring-dino-500
                                        focus-visible:ring-offset-2
                                    "
                                >
                                    {t(
                                        "shop.signIn"
                                    )}
                                </Link>
                            </div>
                        </Alert>
                    ) : null}

                    {purchaseError ? (
                        <Alert
                            className="mb-6"
                            variant="danger"
                        >
                            {purchaseError}
                        </Alert>
                    ) : null}

                    {purchaseConfirmation ? (
                        <Alert
                            className="mb-6"
                            variant="success"
                        >
                            {purchaseConfirmation}
                        </Alert>
                    ) : null}

                    <Section>
                        <SectionHeader
                            title={
                                t(
                                    "shop.catalogTitle"
                                )
                            }
                            description={
                                t(
                                    "shop.catalogDescription"
                                )
                            }
                        />

                        {products.length === 0 ? (
                            <EmptyState
                                icon="📚"
                                title={
                                    t(
                                        "shop.emptyTitle"
                                    )
                                }
                                description={
                                    t(
                                        "shop.emptyBody"
                                    )
                                }
                            />
                        ) : (
                            <Grid
                                variant="wide"
                                aria-label={
                                    t(
                                        "shop.catalogTitle"
                                    )
                                }
                            >
                                {products.map(
                                    product => (
                                        <ShopProductCard
                                            key={
                                                product.id
                                            }
                                            product={
                                                product
                                            }
                                            owned={
                                                ownedProducts.has(
                                                    product.id
                                                )
                                            }
                                            signedIn={
                                                signedIn
                                            }
                                            balance={
                                                balance
                                            }
                                            purchasing={
                                                purchasingProductId
                                                === product.id
                                            }
                                            purchaseBlocked={
                                                purchasingProductId
                                                !== null
                                            }
                                            onPurchase={
                                                purchase
                                            }
                                        />
                                    )
                                )}
                            </Grid>
                        )}
                    </Section>
                </>
            )}
        </Page>
    );
}

interface ShopProductCardProps {
    balance: number | null;
    onPurchase: (
        product: ShopProduct
    ) => Promise<void>;
    owned: boolean;
    product: ShopProduct;
    purchaseBlocked: boolean;
    purchasing: boolean;
    signedIn: boolean;
}

function ShopProductCard({
    balance,
    onPurchase,
    owned,
    product,
    purchaseBlocked,
    purchasing,
    signedIn
}: ShopProductCardProps) {
    const {
        localizedValue,
        t
    } = useI18n();

    const openLessonRef =
        useRef<HTMLAnchorElement | null>(
            null
        );
    const wasOwned =
        useRef(owned);

    useEffect(
        () => {
            if (
                owned
                && !wasOwned.current
            ) {
                openLessonRef.current
                    ?.focus();
            }

            wasOwned.current =
                owned;
        },
        [
            owned
        ]
    );

    const title =
        localizedValue(
            product.title_fr,
            product.title_fa
        );

    const description =
        localizedValue(
            product.description_fr,
            product.description_fa
        );

    const insufficientCredits =
        balance !== null
        && balance < product.price_credits;

    return (
        <article
            className="h-full"
        >
            <Card
                className="
                    flex
                    h-full
                    flex-col
                    overflow-hidden
                    p-5
                "
            >
                <div
                    className="
                        flex
                        items-start
                        justify-between
                        gap-3
                    "
                >
                    <div
                        className="
                            flex
                            flex-wrap
                            items-center
                            gap-2
                        "
                    >
                        <Badge
                            variant="info"
                        >
                            {t(
                                "shop.lesson"
                            )}
                        </Badge>

                        <Badge>
                            {t(
                                "shop.level",
                                {
                                    level:
                                        product.cefr_level
                                }
                            )}
                        </Badge>
                    </div>

                    {owned ? (
                        <Badge
                            variant="success"
                        >
                            {t(
                                "shop.owned"
                            )}
                        </Badge>
                    ) : null}
                </div>

                <h3
                    className="
                        mt-4
                        text-lg
                        font-bold
                        leading-snug
                        text-ink
                    "
                >
                    {title}
                </h3>

                <p
                    className="
                        mt-2
                        flex-1
                        text-sm
                        leading-6
                        text-muted
                    "
                >
                    {description}
                </p>

                <div
                    className="
                        mt-5
                        border-t
                        border-line
                        pt-4
                    "
                >
                    <p
                        className="
                            mb-3
                            text-center
                            text-lg
                            font-extrabold
                            text-dino-800
                        "
                    >
                        {formatCredits(
                            product.price_credits,
                            t
                        )}
                    </p>

                    {owned ? (
                        <Link
                            ref={openLessonRef}
                            to={
                                createShopLessonPath(
                                    product
                                )
                            }
                            className="
                                inline-flex
                                min-h-11
                                w-full
                                items-center
                                justify-center
                                rounded-control
                                border
                                border-dino-600
                                bg-dino-600
                                px-4
                                py-2.5
                                text-sm
                                font-bold
                                text-white
                                no-underline
                                transition
                                hover:bg-dino-700
                                focus-visible:outline-none
                                focus-visible:ring-2
                                focus-visible:ring-dino-500
                                focus-visible:ring-offset-2
                            "
                        >
                            {t(
                                "shop.openLesson"
                            )}
                        </Link>
                    ) : !signedIn ? (
                        <Link
                            to="/auth?returnTo=%2Fshop"
                            className="
                                inline-flex
                                min-h-11
                                w-full
                                items-center
                                justify-center
                                rounded-control
                                border
                                border-line
                                bg-surface
                                px-4
                                py-2.5
                                text-center
                                text-sm
                                font-bold
                                text-dino-700
                                no-underline
                                transition
                                hover:border-dino-300
                                hover:bg-dino-50
                                focus-visible:outline-none
                                focus-visible:ring-2
                                focus-visible:ring-dino-500
                                focus-visible:ring-offset-2
                            "
                        >
                            {t(
                                "shop.signInToBuy"
                            )}
                        </Link>
                    ) : (
                        <Button
                            fullWidth
                            disabled={
                                purchaseBlocked
                                || balance === null
                                || insufficientCredits
                            }
                            onClick={() => {
                                void onPurchase(
                                    product
                                );
                            }}
                        >
                            {purchasing
                                ? t(
                                    "shop.buying"
                                )
                                : balance === null
                                    ? t(
                                        "shop.balanceUnavailable"
                                    )
                                    : insufficientCredits
                                        ? t(
                                            "shop.insufficientCredits"
                                        )
                                        : t(
                                            "shop.buyPrice",
                                            {
                                                price:
                                                    formatCredits(
                                                        product.price_credits,
                                                        t
                                                    )
                                            }
                                        )}
                        </Button>
                    )}
                </div>
            </Card>
        </article>
    );
}

type TranslationFunction =
    ReturnType<
        typeof useI18n
    >["t"];

function formatCredits(
    credits: number,
    t: TranslationFunction
): string {
    return t(
        credits === 1
            ? "shop.credit"
            : "shop.credits",
        {
            count:
                credits
        }
    );
}

export {
    ShopPage
};
