import type {
    LearnerProfileRow
} from "./database.types.js";

import type {
    DinoBackendClient
} from "./supabaseClient.js";

const learnerAvatarKeys = [
    "dino-green",
    "dino-blue",
    "dino-coral"
] as const;

type LearnerAvatarKey =
    typeof learnerAvatarKeys[number];

interface LearnerProfileDraft {
    avatarKey: LearnerAvatarKey;
    displayName: string;
    showSaurusSuffix: boolean;
}

function isLearnerAvatarKey(
    value: string
): value is LearnerAvatarKey {
    return learnerAvatarKeys.some(
        avatarKey =>
            avatarKey === value
    );
}

function normalizeLearnerProfileDraft(
    draft: LearnerProfileDraft
): LearnerProfileDraft {
    const displayName =
        draft.displayName.trim();

    if (
        displayName.length < 2
        || displayName.length > 40
    ) {
        throw new TypeError(
            "Display name must contain between 2 and 40 characters"
        );
    }

    if (
        !isLearnerAvatarKey(
            draft.avatarKey
        )
    ) {
        throw new TypeError(
            "Unknown learner avatar"
        );
    }

    return {
        avatarKey:
            draft.avatarKey,
        displayName,
        showSaurusSuffix:
            draft.showSaurusSuffix
    };
}

function formatLearnerDisplayName(
    profile: Pick<
        LearnerProfileRow,
        "display_name"
        | "show_saurus_suffix"
    >
): string {
    const displayName =
        profile.display_name.trim();

    if (
        !profile.show_saurus_suffix
        || /(?:^|\s)saurus$/iu.test(
            displayName
        )
    ) {
        return displayName;
    }

    return `${displayName} Saurus`;
}

async function loadLearnerProfile(
    client: DinoBackendClient,
    userId: string
): Promise<LearnerProfileRow | null> {
    const {
        data,
        error
    } = await client
        .from(
            "learner_profiles"
        )
        .select(
            "*"
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

async function saveLearnerProfile(
    client: DinoBackendClient,
    userId: string,
    draft: LearnerProfileDraft
): Promise<LearnerProfileRow> {
    const normalized =
        normalizeLearnerProfileDraft(
            draft
        );

    const {
        data,
        error
    } = await client
        .from(
            "learner_profiles"
        )
        .upsert(
            {
                avatar_key:
                    normalized.avatarKey,
                display_name:
                    normalized.displayName,
                show_saurus_suffix:
                    normalized.showSaurusSuffix,
                user_id:
                    userId
            },
            {
                onConflict:
                    "user_id"
            }
        )
        .select(
            "*"
        )
        .single();

    if (error) {
        throw error;
    }

    return data;
}

export {
    formatLearnerDisplayName,
    isLearnerAvatarKey,
    learnerAvatarKeys,
    loadLearnerProfile,
    normalizeLearnerProfileDraft,
    saveLearnerProfile,
    type LearnerAvatarKey,
    type LearnerProfileDraft
};
