import type {
    ReactNode
} from "react";

import {
    Link,
    useLocation
} from "react-router";

import {
    useI18n
} from "../../i18n/I18nProvider.js";

import {
    useAuth
} from "../../services/backend/AuthProvider.js";

import {
    useLessonAccess
} from "../../services/backend/ShopProvider.js";

import type {
    ShopLessonContentType
} from "../../services/backend/shopRepository.js";

import {
    BackButton
} from "../../ui/components/Controls.js";

import {
    EmptyState,
    LoadingState
} from "../../ui/components/Feedback.js";

import {
    Page
} from "../../ui/components/Layout.js";

import {
    findShopOffer
} from "./shopOfferManifest.js";

interface LessonAccessBoundaryProps {
    children: ReactNode;
    contentId: string;
    contentType: ShopLessonContentType;
    level?: string;
}

/**
 * Applies the shop entitlement to catalogue-backed lessons only.
 *
 * Lessons absent from the shop remain free. If the optional account backend is
 * unavailable, the educational application fails open so an outage never
 * removes previously public content. Private delivery will replace that
 * fallback before real-money products are introduced.
 */
function LessonAccessBoundary({
    children,
    contentId,
    contentType,
    level
}: LessonAccessBoundaryProps) {
    const offer =
        findShopOffer(
            contentType,
            contentId,
            level
        );

    if (!offer) {
        return children;
    }

    return (
        <RemoteLessonAccessBoundary
            contentId={contentId}
            contentType={contentType}
            level={level}
        >
            {children}
        </RemoteLessonAccessBoundary>
    );
}

function RemoteLessonAccessBoundary({
    children,
    contentId,
    contentType,
    level
}: LessonAccessBoundaryProps) {
    const {
        pathname,
        search
    } = useLocation();

    const {
        t
    } = useI18n();

    const {
        status: authStatus
    } = useAuth();

    const {
        ownedProductIds,
        products,
        status: shopStatus
    } = useLessonAccess();

    if (
        shopStatus === "backend-disabled"
        || shopStatus === "error"
    ) {
        return children;
    }

    if (shopStatus === "loading") {
        return (
            <Page>
                <LoadingState
                    label={t("common.loading")}
                />
            </Page>
        );
    }

    const product =
        products.find(candidate =>
            candidate.content_type === contentType
            && candidate.content_id === contentId
            && (
                !level
                || candidate.cefr_level === level
            )
        );

    if (
        !product
        || ownedProductIds.includes(product.id)
    ) {
        return children;
    }

    const signedIn =
        authStatus === "signed-in";

    const returnTo =
        `${pathname}${search}`;

    return (
        <Page>
            <BackButton fallback="/shop">
                ← {t("common.back")}
            </BackButton>

            <EmptyState
                icon="🔐"
                title={t("shop.lockedTitle")}
                description={t("shop.lockedBody")}
                action={
                    <Link
                        to={
                            signedIn
                                ? "/shop"
                                : `/auth?returnTo=${encodeURIComponent(returnTo)}`
                        }
                        className="inline-flex min-h-11 items-center justify-center rounded-control border border-dino-600 bg-dino-600 px-4 py-2.5 text-sm font-bold text-white no-underline transition hover:bg-dino-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-dino-500 focus-visible:ring-offset-2"
                    >
                        {t(
                            signedIn
                                ? "profile.openShop"
                                : "shop.lockedSignIn"
                        )}
                    </Link>
                }
            />
        </Page>
    );
}

export {
    LessonAccessBoundary,
    type LessonAccessBoundaryProps
};
