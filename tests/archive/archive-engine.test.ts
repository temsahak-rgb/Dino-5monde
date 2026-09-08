import assert from "node:assert/strict";
import test from "node:test";

import {
    buildCompletedLessonArchive
} from "../../src/features/archive/archiveEngine.js";

const catalog = [
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
];

test(
    "archive resolves only completed lessons to durable catalog links",
    () => {
        const archive =
            buildCompletedLessonArchive(
                [
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
                ],
                catalog
            );

        assert.deepEqual(
            archive.map(
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

test(
    "archive keeps the newest completions first and ignores missing catalog entries",
    () => {
        const archive =
            buildCompletedLessonArchive(
                [
                    {
                        contentType:
                            "grammar",
                        lessonId:
                            "A1-G-001",
                        progress: {
                            completedSections:
                                [],
                            currentSection:
                                0,
                            lastAccessed:
                                "2026-09-07T10:00:00.000Z",
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
                                [],
                            currentSection:
                                0,
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
                            "missing",
                        progress: {
                            completedSections:
                                [],
                            currentSection:
                                0,
                            lastAccessed:
                                "2026-09-09T10:00:00.000Z",
                            status:
                                "completed"
                        }
                    }
                ],
                catalog
            );

        assert.deepEqual(
            archive.map(
                item =>
                    item.id
            ),
            [
                "TR-006",
                "A1-G-001"
            ]
        );
    }
);
