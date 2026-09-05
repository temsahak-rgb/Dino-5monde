import assert from "node:assert/strict";
import {
    readFile
} from "node:fs/promises";
import {
    dirname,
    resolve
} from "node:path";
import test from "node:test";
import {
    fileURLToPath
} from "node:url";

import {
    formatLearnerDisplayName,
    isLearnerAvatarKey,
    normalizeLearnerProfileDraft
} from "../../src/services/backend/learnerProfileRepository.js";

const root = resolve(
    dirname(fileURLToPath(import.meta.url)),
    "../.."
);

test(
    "learner profile validation keeps identity inside database constraints",
    () => {
        assert.deepEqual(
            normalizeLearnerProfileDraft({
                avatarKey: "dino-blue",
                displayName: "  Mina  ",
                showSaurusSuffix: true
            }),
            {
                avatarKey: "dino-blue",
                displayName: "Mina",
                showSaurusSuffix: true
            }
        );
        assert.equal(
            isLearnerAvatarKey("dino-coral"),
            true
        );
        assert.equal(
            isLearnerAvatarKey("uploaded-photo"),
            false
        );
        assert.throws(
            () => normalizeLearnerProfileDraft({
                avatarKey: "dino-green",
                displayName: "x",
                showSaurusSuffix: true
            }),
            TypeError
        );
    }
);

test(
    "Saurus suffix is optional and never duplicated",
    () => {
        assert.equal(
            formatLearnerDisplayName({
                display_name: "Mina",
                show_saurus_suffix: true
            }),
            "Mina Saurus"
        );
        assert.equal(
            formatLearnerDisplayName({
                display_name: "Mina Saurus",
                show_saurus_suffix: true
            }),
            "Mina Saurus"
        );
        assert.equal(
            formatLearnerDisplayName({
                display_name: "Mina",
                show_saurus_suffix: false
            }),
            "Mina"
        );
    }
);

test(
    "profile persistence upserts only learner-managed fields",
    async () => {
        const source = await readFile(
            resolve(
                root,
                "src/services/backend/learnerProfileRepository.ts"
            ),
            "utf8"
        );

        assert.match(
            source,
            /\.upsert\([\s\S]*onConflict:[\s\S]*"user_id"/u
        );
        assert.doesNotMatch(
            source,
            /assigned_saurus\s*:/u
        );
    }
);
