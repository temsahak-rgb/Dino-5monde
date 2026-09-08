import assert from "node:assert/strict";
import test from "node:test";

import {
    getAllLessonProgress,
    markSectionCompleted,
    mergeLessonProgress,
    mergeRemoteLessonProgress
} from "../../src/core/progressEngine.js";
import {
    setActiveLearnerAccount
} from "../../src/core/learnerStorage.js";
import {
    getAllWeakWords,
    getAllMistakes,
    saveMistake,
    setWeakWord
} from "../../src/core/reviewSignalEngine.js";

class MemoryStorage {
    private readonly values = new Map<string, string>();

    clear(): void {
        this.values.clear();
    }

    getItem(key: string): string | null {
        return this.values.get(key) ?? null;
    }

    removeItem(key: string): void {
        this.values.delete(key);
    }

    setItem(key: string, value: string): void {
        this.values.set(key, value);
    }
}

const memoryStorage = new MemoryStorage();
Object.defineProperty(
    globalThis,
    "localStorage",
    {
        configurable: true,
        value: memoryStorage
    }
);

test(
    "cross-device merge keeps the most advanced lesson state",
    () => {
        const merged = mergeLessonProgress(
            {
                completedSections: ["intro", "exercise"],
                currentSection: 2,
                lastAccessed: "2026-09-08T10:00:00.000Z",
                status: "completed"
            },
            {
                completedSections: ["summary"],
                currentSection: 1,
                lastAccessed: "2026-09-07T10:00:00.000Z",
                status: "in_progress"
            }
        );

        assert.deepEqual(
            merged,
            {
                completedSections: ["intro", "exercise", "summary"],
                currentSection: 2,
                lastAccessed: "2026-09-08T10:00:00.000Z",
                status: "completed"
            }
        );
    }
);

test(
    "local progress records their explicit content type before upload",
    () => {
        memoryStorage.clear();
        markSectionCompleted("A1-G-001", "intro", "grammar");
        markSectionCompleted("TR-006", "arrival", "travel");

        assert.deepEqual(
            getAllLessonProgress().map(record => ({
                contentType: record.contentType,
                lessonId: record.lessonId
            })),
            [
                { contentType: "grammar", lessonId: "A1-G-001" },
                { contentType: "travel", lessonId: "TR-006" }
            ]
        );
    }
);

test(
    "remote grammar progress also updates the historical grammar index",
    () => {
        memoryStorage.clear();
        mergeRemoteLessonProgress(
            "grammar",
            "A1-G-001",
            {
                completedSections: ["intro"],
                currentSection: 1,
                lastAccessed: "2026-09-08T10:00:00.000Z",
                status: "completed"
            }
        );

        assert.deepEqual(
            JSON.parse(memoryStorage.getItem("dino_progress") ?? "{}"),
            { "A1-G-001": "completed" }
        );
    }
);

test(
    "two accounts on one device keep isolated lesson progress",
    () => {
        memoryStorage.clear();
        markSectionCompleted("TR-006", "arrival", "travel");

        setActiveLearnerAccount("learner-one");
        assert.equal(
            getAllLessonProgress()[0]?.lessonId,
            "TR-006"
        );
        markSectionCompleted("A1-G-001", "intro", "grammar");

        setActiveLearnerAccount("learner-two");
        assert.deepEqual(getAllLessonProgress(), []);
        markSectionCompleted("TR-010", "menu", "travel");

        setActiveLearnerAccount("learner-one");
        assert.deepEqual(
            getAllLessonProgress().map(record => record.lessonId),
            ["TR-006", "A1-G-001"]
        );
    }
);

test(
    "completing another section never regresses a completed lesson",
    () => {
        memoryStorage.clear();
        mergeRemoteLessonProgress(
            "travel",
            "TR-006",
            {
                completedSections: ["TR-006-1"],
                currentSection: 1,
                lastAccessed: "2026-09-08T10:00:00.000Z",
                status: "completed"
            }
        );
        markSectionCompleted(
            "TR-006",
            "TR-006-2",
            "travel"
        );

        assert.equal(
            getAllLessonProgress()[0]?.progress.status,
            "completed"
        );
    }
);

test(
    "mistakes and weak words stay isolated between local accounts",
    () => {
        memoryStorage.clear();
        saveMistake(
            "A1-G-001",
            "exercise",
            0,
            1,
            0
        );
        setWeakWord("pack-one", "bonjour", true);

        setActiveLearnerAccount("learner-one");
        assert.equal(getAllMistakes().length, 1);
        assert.deepEqual(
            getAllWeakWords(),
            { "pack-one": ["bonjour"] }
        );

        setActiveLearnerAccount("learner-two");
        assert.deepEqual(getAllMistakes(), []);
        assert.deepEqual(getAllWeakWords(), {});
        setWeakWord("pack-two", "merci", true);

        setActiveLearnerAccount("learner-one");
        assert.equal(getAllMistakes().length, 1);
        assert.deepEqual(
            getAllWeakWords(),
            { "pack-one": ["bonjour"] }
        );
    }
);
