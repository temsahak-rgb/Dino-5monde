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
    saurus_assigned_at: string | null;
    saurus_assignment_source:
        SaurusAssignmentSource | null;
    saurus_quiz_answers: string[] | null;
    saurus_recommendation: string | null;
    show_saurus_suffix: boolean;
    updated_at: string;
    user_id: string;
};

type LearnerProfileInsert = {
    assigned_saurus?: never;
    avatar_key?: string;
    created_at?: never;
    display_name: string;
    saurus_assigned_at?: never;
    saurus_assignment_source?: never;
    saurus_quiz_answers?: never;
    saurus_recommendation?: never;
    show_saurus_suffix?: boolean;
    updated_at?: never;
    user_id: string;
};

type LearnerProfileUpdate = {
    assigned_saurus?: never;
    avatar_key?: string;
    created_at?: never;
    display_name?: string;
    saurus_assigned_at?: never;
    saurus_assignment_source?: never;
    saurus_quiz_answers?: never;
    saurus_recommendation?: never;
    show_saurus_suffix?: boolean;
    updated_at?: never;
    user_id?: never;
};

type SaurusAssignmentSource =
    | "recommendation"
    | "learner-choice";

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
    | "travel_lesson"
    | "hangman_game"
    | "word_search_game"
    | "crossword_game";

type LearningGameActivityType =
    Exclude<
        LearningActivityType,
        "travel_lesson"
    >;

type LearningGameLevel =
    | "A1"
    | "A2"
    | "B1"
    | "B2"
    | "C1"
    | "C2";

type LearningRewardCompletionKind =
    | "lesson_sections"
    | "game_attempt";

type LearningRewardRuleRow = {
    active: boolean;
    activity_id: string;
    activity_type: LearningActivityType;
    completion_kind: LearningRewardCompletionKind;
    created_at: string;
    required_sections: string[] | null;
    reward_credits: number;
};

type LearningRewardRuleInsert = {
    active?: never;
    activity_id?: never;
    activity_type?: never;
    completion_kind?: never;
    created_at?: never;
    required_sections?: never;
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

type LearnerGameAttemptRow = {
    activity_id: LearningGameLevel;
    activity_type: LearningGameActivityType;
    completed_at: string | null;
    id: string;
    pack_id: string;
    started_at: string;
    user_id: string;
};

type LearnerGameAttemptInsert = {
    activity_id?: never;
    activity_type?: never;
    completed_at?: never;
    id?: never;
    pack_id?: never;
    started_at?: never;
    user_id?: never;
};

type LearnerGameAttemptUpdate =
    LearnerGameAttemptInsert;

type LearningGameAttemptRpcRow = Omit<
    LearnerGameAttemptRow,
    | "id"
    | "user_id"
> & {
    attempt_id: string;
};

type LessonProgressContentType =
    | "grammar"
    | "travel";

type ExerciseAttemptContentType =
    | "grammar"
    | "travel"
    | "vocabulary";

type LearnerExerciseAttemptRow = {
    activity_id: string;
    completed_at: string;
    content_type: ExerciseAttemptContentType;
    correct_answers: number;
    created_at: string;
    exercise_id: string;
    id: string;
    level: LearningGameLevel | null;
    total_questions: number;
    user_id: string;
};

type LearnerExerciseAttemptInsert = {
    activity_id: string;
    completed_at: string;
    content_type: ExerciseAttemptContentType;
    correct_answers: number;
    created_at?: string;
    exercise_id: string;
    id: string;
    level?: LearningGameLevel | null;
    total_questions: number;
    user_id: string;
};

type LearnerExerciseAttemptUpdate =
    never;

type RecordExerciseAttemptRpcRow = Omit<
    LearnerExerciseAttemptRow,
    "created_at" | "id" | "user_id"
> & {
    attempt_id: string;
};

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

type ReviewSignalType =
    | "mistake"
    | "weak_word";

type LearnerReviewSignalRow = {
    active: boolean;
    changed_at: string;
    payload: Json;
    signal_key: string;
    signal_type: ReviewSignalType;
    subject_id: string;
    updated_at: string;
    user_id: string;
};

type LearnerReviewSignalInsert = {
    active?: never;
    changed_at?: never;
    payload?: never;
    signal_key?: never;
    signal_type?: never;
    subject_id?: never;
    updated_at?: never;
    user_id?: never;
};

type LearnerReviewSignalUpdate =
    LearnerReviewSignalInsert;

type SyncReviewSignalRpcRow = Omit<
    LearnerReviewSignalRow,
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
            learner_game_attempts: {
                Row: LearnerGameAttemptRow;
                Insert: LearnerGameAttemptInsert;
                Update: LearnerGameAttemptUpdate;
                Relationships: [];
            };
            learner_exercise_attempts: {
                Row: LearnerExerciseAttemptRow;
                Insert: LearnerExerciseAttemptInsert;
                Update: LearnerExerciseAttemptUpdate;
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
            learner_review_signals: {
                Row: LearnerReviewSignalRow;
                Insert: LearnerReviewSignalInsert;
                Update: LearnerReviewSignalUpdate;
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
            assign_learner_saurus: {
                Args: {
                    p_answers: string[];
                    p_selected_saurus: string | null;
                };
                Returns: LearnerProfileRow[];
            };
            claim_learning_reward: {
                Args: {
                    p_activity_id: string;
                    p_activity_type: LearningActivityType;
                };
                Returns: ClaimLearningRewardRpcRow[];
            };
            complete_learning_game: {
                Args: {
                    p_attempt_id: string;
                };
                Returns: LearningGameAttemptRpcRow[];
            };
            record_exercise_attempt: {
                Args: {
                    p_activity_id: string;
                    p_attempt_id: string;
                    p_completed_at: string;
                    p_content_type: ExerciseAttemptContentType;
                    p_correct_answers: number;
                    p_exercise_id: string;
                    p_level: LearningGameLevel | null;
                    p_total_questions: number;
                };
                Returns: RecordExerciseAttemptRpcRow[];
            };
            purchase_shop_lesson: {
                Args: {
                    p_shop_lesson_id: string;
                };
                Returns: PurchaseShopLessonRpcRow[];
            };
            start_learning_game: {
                Args: {
                    p_activity_id: LearningGameLevel;
                    p_activity_type: LearningGameActivityType;
                    p_pack_id: string;
                };
                Returns: LearningGameAttemptRpcRow[];
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
            sync_review_signal: {
                Args: {
                    p_active: boolean;
                    p_changed_at: string;
                    p_payload: Json;
                    p_signal_key: string;
                    p_signal_type: ReviewSignalType;
                    p_subject_id: string;
                };
                Returns: SyncReviewSignalRpcRow[];
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
    type LearnerGameAttemptRow,
    type LearnerLessonProgressRow,
    type LearnerReviewSignalRow,
    type LearnerWalletRow,
    type LearningActivityType,
    type LearningGameActivityType,
    type LearningGameAttemptRpcRow,
    type LearningGameLevel,
    type LearningRewardCompletionKind,
    type ExerciseAttemptContentType,
    type LearnerExerciseAttemptInsert,
    type LearnerExerciseAttemptRow,
    type LearnerExerciseAttemptUpdate,
    type LearningRewardRuleRow,
    type LessonProgressContentType,
    type LessonEntitlementRow,
    type LearnerProfileInsert,
    type LearnerProfileRow,
    type LearnerProfileUpdate,
    type PurchaseShopLessonRpcRow,
    type ReviewSignalType,
    type SaurusAssignmentSource,
    type ShopLessonContentType,
    type ShopLessonLevel,
    type ShopLessonRow,
    type SyncLessonProgressRpcRow,
    type RecordExerciseAttemptRpcRow,
    type SyncReviewSignalRpcRow
};
