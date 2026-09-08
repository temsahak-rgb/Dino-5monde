import assert from "node:assert/strict";
import test from "node:test";

import {
    loadRemoteLessonProgress,
    syncRemoteLessonProgress,
    toLocalLessonProgress
} from "../../src/services/backend/lessonProgressRepository.js";
import type {
    DinoBackendClient
} from "../../src/services/backend/supabaseClient.js";
import type {
    LessonProgress
} from "../../src/types/global.js";

const remoteProgress = {
    completed_sections: ["exercise", "intro"],
    content_type: "grammar" as const,
    current_section: 2,
    last_accessed: "2026-09-08T10:00:00.000Z",
    lesson_id: "A1-G-001",
    status: "completed" as const,
    updated_at: "2026-09-08T10:00:01.000Z"
};

test(
    "lesson progress loads only the authenticated learner records",
    async () => {
        const calls: unknown[][] = [];
        const query = {
            data: [remoteProgress],
            error: null,
            eq: (field: string, value: unknown) => {
                calls.push(["eq", field, value]);
                return query;
            },
            order: (field: string, options: unknown) => {
                calls.push(["order", field, options]);
                return query;
            },
            select: (columns: string) => {
                calls.push(["select", columns]);
                return query;
            }
        };
        const client = {
            from: (table: string) => {
                calls.push(["from", table]);
                return query;
            }
        } as unknown as DinoBackendClient;

        assert.deepEqual(
            await loadRemoteLessonProgress(client, "learner-id"),
            [remoteProgress]
        );
        assert.deepEqual(
            calls,
            [
                ["from", "learner_lesson_progress"],
                [
                    "select",
                    "content_type,lesson_id,status,completed_sections,current_section,last_accessed,updated_at"
                ],
                ["eq", "user_id", "learner-id"],
                ["order", "last_accessed", { ascending: false }]
            ]
        );
    }
);

test(
    "lesson progress sync delegates monotonic merging to the server",
    async () => {
        const calls: unknown[] = [];
        const client = {
            rpc: async (name: string, args: unknown) => {
                calls.push({ args, name });
                return {
                    data: [remoteProgress],
                    error: null
                };
            }
        } as unknown as DinoBackendClient;
        const progress: LessonProgress = {
            completedSections: ["intro", "exercise"],
            currentSection: 2,
            lastAccessed: "2026-09-08T10:00:00.000Z",
            status: "completed"
        };

        assert.deepEqual(
            await syncRemoteLessonProgress(
                client,
                "grammar",
                "A1-G-001",
                progress
            ),
            remoteProgress
        );
        assert.deepEqual(
            calls,
            [{
                args: {
                    p_completed_sections: ["intro", "exercise"],
                    p_content_type: "grammar",
                    p_current_section: 2,
                    p_last_accessed: "2026-09-08T10:00:00.000Z",
                    p_lesson_id: "A1-G-001",
                    p_status: "completed"
                },
                name: "sync_lesson_progress"
            }]
        );
        assert.deepEqual(
            toLocalLessonProgress(remoteProgress),
            {
                ...progress,
                completedSections: ["exercise", "intro"]
            }
        );
    }
);

test(
    "malformed browser progress never reaches the server",
    async () => {
        let calls = 0;
        const client = {
            rpc: async () => {
                calls += 1;
                return { data: [], error: null };
            }
        } as unknown as DinoBackendClient;
        const valid: LessonProgress = {
            completedSections: ["intro"],
            currentSection: 1,
            lastAccessed: "2026-09-08T10:00:00.000Z",
            status: "in_progress"
        };

        await assert.rejects(
            syncRemoteLessonProgress(
                client,
                "travel",
                " TR-006",
                valid
            ),
            TypeError
        );
        await assert.rejects(
            syncRemoteLessonProgress(
                client,
                "travel",
                "TR-006",
                { ...valid, currentSection: 1.5 }
            ),
            TypeError
        );
        await assert.rejects(
            syncRemoteLessonProgress(
                client,
                "travel",
                "TR-006",
                {
                    ...valid,
                    status: "erased" as LessonProgress["status"]
                }
            ),
            TypeError
        );
        assert.equal(calls, 0);
    }
);
