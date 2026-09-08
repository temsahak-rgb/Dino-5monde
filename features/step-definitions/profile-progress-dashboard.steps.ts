import assert from "node:assert/strict";

import {
    Given,
    Then,
    When
} from "@cucumber/cucumber";

import {
    createLearningProgressOverview
} from "../../src/features/profile/learningProgressOverview.js";
import type {
    ProductWorld
} from "../support/productWorld.js";

Given(
    "a learner has completed one Grammar lesson and one Travel lesson",
    function (this: ProductWorld): void {
        this.learningProgressRecords = [
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
                contentType: "travel",
                lessonId: "TR-001",
                progress: {
                    completedSections: ["dialogue"],
                    currentSection: 1,
                    lastAccessed:
                        "2026-09-08T10:00:00.000Z",
                    status: "completed"
                }
            }
        ];
    }
);

Given(
    "the learner has earned two different game-level rewards",
    function (this: ProductWorld): void {
        this.learningProgressRewards = [
            {
                activity_id: "A1",
                activity_type: "hangman_game",
                awarded_at:
                    "2026-09-08T10:00:00.000Z",
                credits_awarded: 1
            },
            {
                activity_id: "B1",
                activity_type: "word_search_game",
                awarded_at:
                    "2026-09-08T10:00:00.000Z",
                credits_awarded: 3
            }
        ];
    }
);

When(
    "the learner opens the progress dashboard",
    function (this: ProductWorld): void {
        this.learningProgressOverview =
            createLearningProgressOverview({
                grammarLessonIds: [
                    "A1-G-001",
                    "A1-G-002"
                ],
                progress:
                    this.learningProgressRecords
                    ?? [],
                rewards:
                    this.learningProgressRewards
                    ?? [],
                travelLessonIds: [
                    "TR-001",
                    "TR-002"
                ]
            });
    }
);

Then(
    "Grammar, Travel and Games show their completed totals",
    function (this: ProductWorld): void {
        assert.deepEqual(
            this.learningProgressOverview,
            {
                games: {
                    area: "games",
                    completed: 2,
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
