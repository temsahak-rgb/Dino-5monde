type Json =
    | string
    | number
    | boolean
    | null
    | { [key: string]: Json | undefined }
    | Json[];

interface LearnerProfileRow {
    assigned_saurus: string | null;
    avatar_key: string;
    created_at: string;
    display_name: string;
    show_saurus_suffix: boolean;
    updated_at: string;
    user_id: string;
}

interface LearnerProfileInsert {
    assigned_saurus?: never;
    avatar_key?: string;
    created_at?: never;
    display_name: string;
    show_saurus_suffix?: boolean;
    updated_at?: never;
    user_id: string;
}

interface LearnerProfileUpdate {
    assigned_saurus?: never;
    avatar_key?: string;
    created_at?: never;
    display_name?: string;
    show_saurus_suffix?: boolean;
    updated_at?: never;
    user_id?: never;
}

interface Database {
    public: {
        Tables: {
            learner_profiles: {
                Row: LearnerProfileRow;
                Insert: LearnerProfileInsert;
                Update: LearnerProfileUpdate;
                Relationships: [];
            };
        };
        Views: Record<string, never>;
        Functions: Record<string, never>;
        Enums: Record<string, never>;
        CompositeTypes: Record<string, never>;
    };
}

export {
    type Database,
    type Json,
    type LearnerProfileInsert,
    type LearnerProfileRow,
    type LearnerProfileUpdate
};
