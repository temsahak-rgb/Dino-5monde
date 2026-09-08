import assert from "node:assert/strict";
import test from "node:test";

import {
    createLearningProgressOverview
} from "../../src/features/profile/learningProgressOverview.js";

test(
    "learning progress counts only completed catalog lessons and eligible game rewards",
    () => {
        const overview =
            createLearningProgressOverview({
                grammarLessonIds: [
                    "A1-G-001",
                    "A1-G-002"
                ],
                progress: [
                    {
                        contentType: "grammar",
                        lessonId: "A1-G-001",
                        progress: {
                            completedSections: ["intro"],
                            currentSection: 1,
                            lastAccessed:
                                "2026-09-08T10:00:00.000Z",
                            status: "completed"
                        }
                    },
                    {
                        contentType: "grammar",
                        lessonId: "A1-G-001",
                        progress: {
                            completedSections: [],
                            currentSection: 0,
                            lastAccessed: null,
                            status: "in_progress"
                        }
                    },
                    {
                        contentType: "travel",
                        lessonId: "TR-001",
                        progress: {
                            completedSections: ["dialogue"],
                            currentSection: 1,
                            lastAccessed:
                                "2026-09-08T10:00:00.000Z",
                            status: "completed"
                        }
                    },
                    {
                        contentType: "travel",
                        lessonId: "TR-REMOVED",
                        progress: {
                            completedSections: ["dialogue"],
                            currentSection: 1,
                            lastAccessed:
                                "2026-09-08T10:00:00.000Z",
                            status: "completed"
                        }
                    }
                ],
                rewards: [
                    {
                        activity_id: "A1",
                        activity_type: "hangman_game",
                        awarded_at:
                            "2026-09-08T10:00:00.000Z",
                        credits_awarded: 1
                    },
                    {
                        activity_id: "A1",
                        activity_type: "hangman_game",
                        awarded_at:
                            "2026-09-08T10:00:00.000Z",
                        credits_awarded: 1
                    },
                    {
                        activity_id: "TR-001",
                        activity_type: "travel_lesson",
                        awarded_at:
                            "2026-09-08T10:00:00.000Z",
                        credits_awarded: 5
                    }
                ],
                travelLessonIds: [
                    "TR-001",
                    "TR-002"
                ]
            });

        assert.deepEqual(
            overview,
            {
                games: {
                    area: "games",
                    completed: 1,
                    total: 18
                },
                grammar: {
                    area: "grammar",
                    completed: 1,
                    total: 2
                },
                travel: {
                    area: "travel",
                    completed: 1,
                    total: 2
                }
            }
        );
    }
);

test(
    "learning progress exposes stable zero states",
    () => {
        const overview =
            createLearningProgressOverview({
                grammarLessonIds: [
                    "A1-G-001"
                ],
                progress: [],
                rewards: [],
                travelLessonIds: [
                    "TR-001"
                ]
            });

        assert.equal(
            overview.grammar.completed,
            0
        );
        assert.equal(
            overview.travel.completed,
            0
        );
        assert.equal(
            overview.games.completed,
            0
        );
        assert.equal(
            overview.games.total,
            18
        );
    }
);
