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

type LearningActivityType =
    "travel_lesson";

type LearningRewardRuleRow = {
    active: boolean;
    activity_id: string;
    activity_type: LearningActivityType;
    created_at: string;
    reward_credits: number;
};

type LearningRewardRuleInsert = {
    active?: never;
    activity_id?: never;
    activity_type?: never;
    created_at?: never;
    reward_credits?: never;
};

type LearningRewardRuleUpdate =
    LearningRewardRuleInsert;

type LearnerActivityRewardRow = {
    activity_id: string;
    activity_type: LearningActivityType;
    awarded_at: string;
    credits_awarded: number;
    user_id: string;
};

type LearnerActivityRewardInsert = {
    activity_id?: never;
    activity_type?: never;
    awarded_at?: never;
    credits_awarded?: never;
    user_id?: never;
};

type LearnerActivityRewardUpdate =
    LearnerActivityRewardInsert;

type LessonProgressContentType =
    | "grammar"
    | "travel";

type LearnerLessonProgressRow = {
    completed_sections: string[];
    content_type: LessonProgressContentType;
    current_section: number;
    last_accessed: string;
    lesson_id: string;
    status:
        | "not_started"
        | "in_progress"
        | "completed";
    updated_at: string;
    user_id: string;
};

type LearnerLessonProgressInsert = {
    completed_sections?: never;
    content_type?: never;
    current_section?: never;
    last_accessed?: never;
    lesson_id?: never;
    status?: never;
    updated_at?: never;
    user_id?: never;
};

type LearnerLessonProgressUpdate =
    LearnerLessonProgressInsert;

type SyncLessonProgressRpcRow = Omit<
    LearnerLessonProgressRow,
    "user_id"
>;

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
        | "lesson_purchase"
        | "learning_reward";
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

type ClaimLearningRewardRpcRow = {
    activity_id: string;
    activity_type: LearningActivityType;
    awarded: boolean;
    awarded_at: string;
    credits_awarded: number;
    credits_remaining: number;
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
            learning_reward_rules: {
                Row: LearningRewardRuleRow;
                Insert: LearningRewardRuleInsert;
                Update: LearningRewardRuleUpdate;
                Relationships: [];
            };
            learner_activity_rewards: {
                Row: LearnerActivityRewardRow;
                Insert: LearnerActivityRewardInsert;
                Update: LearnerActivityRewardUpdate;
                Relationships: [];
            };
            learner_credit_transactions: {
                Row: LearnerCreditTransactionRow;
                Insert: LearnerCreditTransactionInsert;
                Update: LearnerCreditTransactionUpdate;
                Relationships: [];
            };
            learner_lesson_progress: {
                Row: LearnerLessonProgressRow;
                Insert: LearnerLessonProgressInsert;
                Update: LearnerLessonProgressUpdate;
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
            claim_learning_reward: {
                Args: {
                    p_activity_id: string;
                    p_activity_type: LearningActivityType;
                };
                Returns: ClaimLearningRewardRpcRow[];
            };
            purchase_shop_lesson: {
                Args: {
                    p_shop_lesson_id: string;
                };
                Returns: PurchaseShopLessonRpcRow[];
            };
            sync_lesson_progress: {
                Args: {
                    p_completed_sections: string[];
                    p_content_type: LessonProgressContentType;
                    p_current_section: number;
                    p_last_accessed: string;
                    p_lesson_id: string;
                    p_status: LearnerLessonProgressRow["status"];
                };
                Returns: SyncLessonProgressRpcRow[];
            };
        };
        Enums: Record<string, never>;
        CompositeTypes: Record<string, never>;
    };
};

export {
    type ClaimLearningRewardRpcRow,
    type Database,
    type Json,
    type LearnerActivityRewardRow,
    type LearnerCreditTransactionRow,
    type LearnerLessonProgressRow,
    type LearnerWalletRow,
    type LearningActivityType,
    type LearningRewardRuleRow,
    type LessonProgressContentType,
    type LessonEntitlementRow,
    type LearnerProfileInsert,
    type LearnerProfileRow,
    type LearnerProfileUpdate,
    type PurchaseShopLessonRpcRow,
    type ShopLessonContentType,
    type ShopLessonLevel,
    type ShopLessonRow,
    type SyncLessonProgressRpcRow
};
