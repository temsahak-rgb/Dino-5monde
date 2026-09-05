type Json =
    | string
    | number
    | boolean
    | null
    | { [key: string]: Json | undefined }
    | Json[];

type LearnerProfileRow = {
    assigned_saurus: string | null;
    avatar_key: string;
    created_at: string;
    display_name: string;
    show_saurus_suffix: boolean;
    updated_at: string;
    user_id: string;
};

type LearnerProfileInsert = {
    assigned_saurus?: never;
    avatar_key?: string;
    created_at?: never;
    display_name: string;
    show_saurus_suffix?: boolean;
    updated_at?: never;
    user_id: string;
};

type LearnerProfileUpdate = {
    assigned_saurus?: never;
    avatar_key?: string;
    created_at?: never;
    display_name?: string;
    show_saurus_suffix?: boolean;
    updated_at?: never;
    user_id?: never;
};

type LearnerWalletRow = {
    created_at: string;
    credits: number;
    updated_at: string;
    user_id: string;
};

type LearnerWalletInsert = {
    created_at?: never;
    credits?: never;
    updated_at?: never;
    user_id?: never;
};

type LearnerWalletUpdate = {
    created_at?: never;
    credits?: never;
    updated_at?: never;
    user_id?: never;
};

type ShopLessonContentType =
    | "grammar"
    | "vocabulary";

type ShopLessonLevel =
    | "A1"
    | "A2"
    | "B1"
    | "B2"
    | "C1"
    | "C2";

type ShopLessonRow = {
    active: boolean;
    cefr_level: ShopLessonLevel;
    content_id: string;
    content_type: ShopLessonContentType;
    created_at: string;
    description_fa: string;
    description_fr: string;
    display_order: number;
    id: string;
    price_credits: number;
    title_fa: string;
    title_fr: string;
    updated_at: string;
};

type ShopLessonInsert = {
    active?: never;
    cefr_level?: never;
    content_id?: never;
    content_type?: never;
    created_at?: never;
    description_fa?: never;
    description_fr?: never;
    display_order?: never;
    id?: never;
    price_credits?: never;
    title_fa?: never;
    title_fr?: never;
    updated_at?: never;
};

type ShopLessonUpdate =
    ShopLessonInsert;

type LessonEntitlementRow = {
    price_paid: number;
    purchased_at: string;
    shop_lesson_id: string;
    user_id: string;
};

type LessonEntitlementInsert = {
    price_paid?: never;
    purchased_at?: never;
    shop_lesson_id?: never;
    user_id?: never;
};

type LessonEntitlementUpdate =
    LessonEntitlementInsert;

type LearnerCreditTransactionRow = {
    balance_after: number;
    created_at: string;
    delta: number;
    id: number;
    reason:
        | "starter_grant"
        | "lesson_purchase";
    reference_id: string | null;
    user_id: string;
};

type LearnerCreditTransactionInsert = {
    balance_after?: never;
    created_at?: never;
    delta?: never;
    id?: never;
    reason?: never;
    reference_id?: never;
    user_id?: never;
};

type LearnerCreditTransactionUpdate =
    LearnerCreditTransactionInsert;

type PurchaseShopLessonRpcRow = {
    credits_remaining: number;
    purchased: boolean;
    shop_lesson_id: string;
};

type Database = {
    public: {
        Tables: {
            learner_profiles: {
                Row: LearnerProfileRow;
                Insert: LearnerProfileInsert;
                Update: LearnerProfileUpdate;
                Relationships: [];
            };
            learner_wallets: {
                Row: LearnerWalletRow;
                Insert: LearnerWalletInsert;
                Update: LearnerWalletUpdate;
                Relationships: [];
            };
            learner_credit_transactions: {
                Row: LearnerCreditTransactionRow;
                Insert: LearnerCreditTransactionInsert;
                Update: LearnerCreditTransactionUpdate;
                Relationships: [];
            };
            lesson_entitlements: {
                Row: LessonEntitlementRow;
                Insert: LessonEntitlementInsert;
                Update: LessonEntitlementUpdate;
                Relationships: [];
            };
            shop_lessons: {
                Row: ShopLessonRow;
                Insert: ShopLessonInsert;
                Update: ShopLessonUpdate;
                Relationships: [];
            };
        };
        Views: Record<string, never>;
        Functions: {
            purchase_shop_lesson: {
                Args: {
                    p_shop_lesson_id: string;
                };
                Returns: PurchaseShopLessonRpcRow[];
            };
        };
        Enums: Record<string, never>;
        CompositeTypes: Record<string, never>;
    };
};

export {
    type Database,
    type Json,
    type LearnerCreditTransactionRow,
    type LearnerWalletRow,
    type LessonEntitlementRow,
    type LearnerProfileInsert,
    type LearnerProfileRow,
    type LearnerProfileUpdate,
    type PurchaseShopLessonRpcRow,
    type ShopLessonContentType,
    type ShopLessonLevel,
    type ShopLessonRow
};
