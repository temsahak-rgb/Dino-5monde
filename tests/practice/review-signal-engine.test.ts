import assert from "node:assert/strict";
import test from "node:test";

import {
    chooseLatestReviewSignal,
    clearMistakesForLesson,
    getAllMistakes,
    getAllWeakWords,
    initializeLocalReviewSignals,
    mergeRemoteReviewSignal,
    saveMistake,
    setWeakWord
} from "../../src/core/reviewSignalEngine.js";
import type {
    WeakWordReviewSignal
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
    { configurable: true, value: memoryStorage }
);

function weakWordSignal(
    active: boolean,
    changedAt: string
): WeakWordReviewSignal {
    return {
        active,
        changedAt,
        payload: { word: "bonjour" },
        signalKey: "bonjour",
        signalType: "weak_word",
        subjectId: "pack-one"
    };
}

test(
    "a newer tombstone wins over stale and tied active signals",
    () => {
        const active = weakWordSignal(
            true,
            "2026-09-08T09:00:00.000Z"
        );
        const deleted = weakWordSignal(
            false,
            "2026-09-08T10:00:00.000Z"
        );

        assert.equal(
            chooseLatestReviewSignal(active, deleted).active,
            false
        );
        assert.equal(
            chooseLatestReviewSignal(
                weakWordSignal(true, deleted.changedAt),
                deleted
            ).active,
            false
        );
        assert.equal(
            chooseLatestReviewSignal(deleted, active).active,
            false
        );
    }
);

test(
    "known words persist tombstones and can be reactivated later",
    () => {
        memoryStorage.clear();
        setWeakWord("pack-one", "bonjour", true);
        setWeakWord("pack-one", "bonjour", false);

        assert.deepEqual(getAllWeakWords(), { "pack-one": [] });
        const [tombstone] = initializeLocalReviewSignals();
        assert.equal(tombstone?.active, false);

        mergeRemoteReviewSignal({
            ...weakWordSignal(true, "2020-01-01T00:00:00.000Z")
        });
        assert.deepEqual(getAllWeakWords(), { "pack-one": [] });

        mergeRemoteReviewSignal({
            ...weakWordSignal(true, "2090-01-01T00:00:00.000Z")
        });
        assert.deepEqual(
            getAllWeakWords(),
            { "pack-one": ["bonjour"] }
        );
    }
);

test(
    "reviewed mistakes remain deleted when a stale device returns",
    () => {
        memoryStorage.clear();
        saveMistake(
            "A1-G-001",
            "exercise",
            0,
            1,
            0
        );
        const [active] = initializeLocalReviewSignals();
        assert.ok(active?.signalType === "mistake");

        clearMistakesForLesson("A1-G-001");
        assert.deepEqual(getAllMistakes(), []);
        const tombstone = initializeLocalReviewSignals()[0];
        assert.equal(tombstone?.active, false);

        mergeRemoteReviewSignal(active);
        assert.deepEqual(getAllMistakes(), []);
    }
);

test(
    "historical local review data receives stable sync metadata",
    () => {
        memoryStorage.clear();
        localStorage.setItem(
            "dino_mistakes",
            JSON.stringify([{
                correctAnswer: 0,
                lessonId: "A1-G-001",
                questionIndex: 0,
                sectionId: "exercise",
                timestamp: "2026-09-08T10:00:00.000Z",
                userAnswer: 1
            }])
        );
        localStorage.setItem(
            "dino_vocab_weak",
            JSON.stringify({ "pack-one": ["bonjour"] })
        );

        const first = initializeLocalReviewSignals();
        const second = initializeLocalReviewSignals();

        assert.equal(first.length, 2);
        assert.deepEqual(second, first);
        assert.ok(
            first.some(signal => signal.signalType === "mistake")
        );
        assert.ok(
            first.some(signal => signal.signalType === "weak_word")
        );
    }
);
