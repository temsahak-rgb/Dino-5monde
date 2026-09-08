import assert from "node:assert/strict";
import test from "node:test";

import {
    countCompletedSaurusActivities
} from "../../src/features/profile/saurusProgress.js";

test(
    "Saurus evolution counts a rewarded Travel completion only once",
    () => {
        assert.equal(
            countCompletedSaurusActivities(
                [
                    {
                        contentType: "travel",
                        lessonId: "TR-006",
                        progress: {
                            completedSections: [
                                "TR-006-1"
                            ],
                            currentSection: 1,
                            lastAccessed:
                                "2026-09-08T10:00:00.000Z",
                            status: "completed"
                        }
                    }
                ],
                [
                    {
                        activity_id: "TR-006",
                        activity_type:
                            "travel_lesson",
                        awarded_at:
                            "2026-09-08T10:01:00.000Z",
                        credits_awarded: 5
                    },
                    {
                        activity_id: "A1",
                        activity_type:
                            "hangman_game",
                        awarded_at:
                            "2026-09-08T10:02:00.000Z",
                        credits_awarded: 1
                    }
                ]
            ),
            2
        );
    }
);
