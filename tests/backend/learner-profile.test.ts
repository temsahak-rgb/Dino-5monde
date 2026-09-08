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
    assignLearnerSaurus,
    formatLearnerDisplayName,
    isLearnerAvatarKey,
    normalizeLearnerProfileDraft
} from "../../src/services/backend/learnerProfileRepository.js";
import type {
    DinoBackendClient
} from "../../src/services/backend/supabaseClient.js";

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

test(
    "Saurus assignment sends only quiz answers and the optional final choice",
    async () => {
        const calls: unknown[] = [];
        const assignedProfile = {
            assigned_saurus:
                "triceratops-perseverant",
            avatar_key: "dino-green",
            created_at:
                "2026-09-08T10:00:00.000Z",
            display_name: "Mina",
            saurus_assigned_at:
                "2026-09-08T10:01:00.000Z",
            saurus_assignment_source:
                "learner-choice" as const,
            saurus_quiz_answers: [
                "velociraptor-explorer",
                "triceratops-perseverant",
                "brachiosaurus-curious"
            ],
            saurus_recommendation:
                "brachiosaurus-curious",
            show_saurus_suffix: true,
            updated_at:
                "2026-09-08T10:01:00.000Z",
            user_id:
                "11111111-1111-4111-8111-111111111111"
        };
        const client = {
            rpc: async (
                name: string,
                args: unknown
            ) => {
                calls.push({ args, name });
                return {
                    data: [assignedProfile],
                    error: null
                };
            }
        } as unknown as DinoBackendClient;

        assert.equal(
            (
                await assignLearnerSaurus(
                    client,
                    {
                        answers: [
                            "velociraptor-explorer",
                            "triceratops-perseverant",
                            "brachiosaurus-curious"
                        ],
                        selectedSaurus:
                            "triceratops-perseverant"
                    }
                )
            ).assigned_saurus,
            "triceratops-perseverant"
        );
        assert.deepEqual(
            calls,
            [
                {
                    args: {
                        p_answers: [
                            "velociraptor-explorer",
                            "triceratops-perseverant",
                            "brachiosaurus-curious"
                        ],
                        p_selected_saurus:
                            "triceratops-perseverant"
                    },
                    name:
                        "assign_learner_saurus"
                }
            ]
        );
    }
);
