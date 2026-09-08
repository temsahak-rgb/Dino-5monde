import assert from "node:assert/strict";

import {
    Given,
    Then,
    When
} from "@cucumber/cucumber";

import {
    buildCompletedLessonArchive
} from "../../src/features/archive/archiveEngine.js";
import type {
    ProductWorld
} from "../support/productWorld.js";

Given(
    "the learner has one completed lesson and one lesson in progress",
    function (this: ProductWorld): void {
        this.learningProgressRecords = [
            {
                contentType:
                    "grammar",
                lessonId:
                    "A1-G-001",
                progress: {
                    completedSections:
                        ["intro"],
                    currentSection:
                        1,
                    lastAccessed:
                        "2026-09-08T10:00:00.000Z",
                    status:
                        "completed"
                }
            },
            {
                contentType:
                    "travel",
                lessonId:
                    "TR-006",
                progress: {
                    completedSections:
                        ["arrival"],
                    currentSection:
                        1,
                    lastAccessed:
                        "2026-09-08T11:00:00.000Z",
                    status:
                        "in_progress"
                }
            }
        ];
    }
);

When(
    "the learning archive is prepared from the current catalog",
    function (this: ProductWorld): void {
        this.completedLessonArchive =
            buildCompletedLessonArchive(
                this.learningProgressRecords
                ?? [],
                [
                    {
                        href:
                            "/grammar/lesson/A1-G-001",
                        icon:
                            "📐",
                        id:
                            "A1-G-001",
                        title:
                            "Subject pronouns"
                    },
                    {
                        href:
                            "/travel/TR-006",
                        icon:
                            "✈️",
                        id:
                            "TR-006",
                        title:
                            "At the hotel"
                    }
                ]
            );
    }
);

Then(
    "the archive contains only the completed lesson with its direct link",
    function (this: ProductWorld): void {
        assert.deepEqual(
            this.completedLessonArchive?.map(
                item => ({
                    href:
                        item.href,
                    id:
                        item.id
                })
            ),
            [{
                href:
                    "/grammar/lesson/A1-G-001",
                id:
                    "A1-G-001"
            }]
        );
    }
);
