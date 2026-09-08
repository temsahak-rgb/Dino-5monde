const LEARNER_ACCOUNT_CHANGE_EVENT =
    "dino:learneraccountchange";
const ACTIVE_LEARNER_ACCOUNT_STORAGE_KEY =
    "dino_lesson_progress_active_account";
const ANONYMOUS_DATA_ADOPTED_STORAGE_KEY =
    "dino_learner_data_adopted_v2";

const accountScopedStorageKeys = [
    "dino_lessons_progress",
    "dino_lesson_progress_content_types",
    "dino_progress",
    "dino_mistakes",
    "dino_vocab_weak",
    "dino_review_signal_changes"
] as const;

/** Returns the private localStorage key for the active learner account. */
function getAccountScopedStorageKey(
    baseKey: string
): string {
    const accountId = localStorage.getItem(
        ACTIVE_LEARNER_ACCOUNT_STORAGE_KEY
    );

    return accountId
        ? `${baseKey}:${accountId}`
        : baseKey;
}

/** Selects one local learner namespace and adopts anonymous data once. */
function setActiveLearnerAccount(
    accountId: string | null
): void {
    assertAccountId(accountId);

    const previousAccount = localStorage.getItem(
        ACTIVE_LEARNER_ACCOUNT_STORAGE_KEY
    );

    if (accountId === null) {
        localStorage.removeItem(
            ACTIVE_LEARNER_ACCOUNT_STORAGE_KEY
        );
    } else {
        adoptAnonymousLearnerData(accountId);
        localStorage.setItem(
            ACTIVE_LEARNER_ACCOUNT_STORAGE_KEY,
            accountId
        );
    }

    if (previousAccount !== accountId) {
        dispatchLearnerAccountChange();
    }
}

function adoptAnonymousLearnerData(
    accountId: string
): void {
    if (
        localStorage.getItem(
            ANONYMOUS_DATA_ADOPTED_STORAGE_KEY
        ) === "true"
    ) {
        return;
    }

    for (const baseKey of accountScopedStorageKeys) {
        const anonymousValue = localStorage.getItem(baseKey);

        if (anonymousValue !== null) {
            localStorage.setItem(
                `${baseKey}:${accountId}`,
                anonymousValue
            );
            localStorage.removeItem(baseKey);
        }
    }

    localStorage.setItem(
        ANONYMOUS_DATA_ADOPTED_STORAGE_KEY,
        "true"
    );
}

function assertAccountId(
    accountId: string | null
): void {
    if (
        accountId !== null
        && (
            !accountId
            || accountId.trim() !== accountId
            || accountId.length > 160
        )
    ) {
        throw new TypeError("Invalid learner account");
    }
}

function dispatchLearnerAccountChange(): void {
    if (
        typeof window === "undefined"
        || typeof Event === "undefined"
    ) {
        return;
    }

    window.dispatchEvent(
        new Event(LEARNER_ACCOUNT_CHANGE_EVENT)
    );
}

export {
    LEARNER_ACCOUNT_CHANGE_EVENT,
    getAccountScopedStorageKey,
    setActiveLearnerAccount
};
