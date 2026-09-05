import type {
    LearnerWalletRow,
    LessonEntitlementRow,
    ShopLessonContentType,
    ShopLessonLevel,
    ShopLessonRow
} from "./database.types.js";

import type {
    DinoBackendClient
} from "./supabaseClient.js";

type ShopLesson = Pick<
    ShopLessonRow,
    | "active"
    | "cefr_level"
    | "content_id"
    | "content_type"
    | "description_fa"
    | "description_fr"
    | "display_order"
    | "id"
    | "price_credits"
    | "title_fa"
    | "title_fr"
>;

type LearnerWallet = Pick<
    LearnerWalletRow,
    | "credits"
    | "user_id"
>;

type LessonEntitlement = Pick<
    LessonEntitlementRow,
    "shop_lesson_id"
>;

const shopLessonProjection =
    "active,cefr_level,content_id,content_type,description_fa,description_fr,display_order,id,price_credits,title_fa,title_fr";
const learnerWalletProjection =
    "credits,user_id";
const lessonEntitlementProjection =
    "shop_lesson_id";

interface PurchaseShopLessonResult {
    balance: number;
    purchased: boolean;
    shopLessonId: string;
}

async function loadShopLessons(
    client: DinoBackendClient
): Promise<ShopLesson[]> {
    const {
        data,
        error
    } = await client
        .from(
            "shop_lessons"
        )
        .select(
            shopLessonProjection
        )
        .eq(
            "active",
            true
        )
        .order(
            "display_order",
            { ascending: true }
        )
        .order(
            "id",
            { ascending: true }
        );

    if (error) {
        throw error;
    }

    return data;
}

async function loadLearnerWallet(
    client: DinoBackendClient,
    userId: string
): Promise<LearnerWallet | null> {
    const {
        data,
        error
    } = await client
        .from(
            "learner_wallets"
        )
        .select(
            learnerWalletProjection
        )
        .eq(
            "user_id",
            userId
        )
        .limit(
            1
        );

    if (error) {
        throw error;
    }

    return data[0]
        ?? null;
}

async function loadLessonEntitlements(
    client: DinoBackendClient,
    userId: string
): Promise<LessonEntitlement[]> {
    const {
        data,
        error
    } = await client
        .from(
            "lesson_entitlements"
        )
        .select(
            lessonEntitlementProjection
        )
        .eq(
            "user_id",
            userId
        )
        .order(
            "purchased_at",
            { ascending: false }
        );

    if (error) {
        throw error;
    }

    return data;
}

async function purchaseShopLesson(
    client: DinoBackendClient,
    shopLessonId: string
): Promise<PurchaseShopLessonResult> {
    if (
        shopLessonId.trim()
        !== shopLessonId
        || shopLessonId.length === 0
        || shopLessonId.length > 160
    ) {
        throw new TypeError(
            "Invalid shop lesson identifier"
        );
    }

    const {
        data,
        error
    } = await client.rpc(
        "purchase_shop_lesson",
        {
            p_shop_lesson_id:
                shopLessonId
        }
    );

    if (error) {
        throw error;
    }

    const result = data[0];

    if (!result) {
        throw new Error(
            "Purchase returned no result"
        );
    }

    return {
        balance:
            result.credits_remaining,
        purchased:
            result.purchased,
        shopLessonId:
            result.shop_lesson_id
    };
}

function createShopLessonPath(
    lesson: Pick<
        ShopLesson,
        "cefr_level"
        | "content_id"
        | "content_type"
    >
): string {
    assertSafeContentId(
        lesson.content_id
    );

    if (
        lesson.content_type
        === "grammar"
    ) {
        if (
            lesson.cefr_level
            === "C2"
        ) {
            throw new TypeError(
                "Grammar lessons cannot use level C2"
            );
        }

        return `/grammar/lesson/${encodeURIComponent(lesson.content_id)}`;
    }

    if (
        lesson.content_type
        === "vocabulary"
    ) {
        return `/vocabulary/${lesson.cefr_level}/${encodeURIComponent(lesson.content_id)}`;
    }

    throw new TypeError(
        "Unknown shop lesson content type"
    );
}

function assertSafeContentId(
    value: string
): void {
    if (
        value.length === 0
        || value.length > 160
        || value.trim() !== value
        || value === "."
        || value === ".."
        || /[\\/\u0000-\u001f\u007f]/u.test(
            value
        )
    ) {
        throw new TypeError(
            "Invalid shop lesson content identifier"
        );
    }
}

export {
    createShopLessonPath,
    loadLearnerWallet,
    loadLessonEntitlements,
    loadShopLessons,
    purchaseShopLesson,
    type LearnerWalletRow,
    type LearnerWallet,
    type LessonEntitlementRow,
    type LessonEntitlement,
    type PurchaseShopLessonResult,
    type ShopLessonContentType,
    type ShopLessonLevel,
    type ShopLesson,
    type ShopLessonRow
};
