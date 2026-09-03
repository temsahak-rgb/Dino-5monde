
/**
 * Structural consistency tests for the Travel lesson catalog.
 */

import assert from "node:assert/strict";
import { readdir, readFile } from "node:fs/promises";
import test from "node:test";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

interface TravelIndexEntry {
    id: string;
}

interface TravelLessonFile {
    id: string;
}

const currentDirectory = dirname(fileURLToPath(import.meta.url));
const root = resolve(currentDirectory, "../..");
const indexPath = join(root, "data", "travel", "lessons.json");
const lessonsDirectory = join(root, "data", "travel", "lessons");

/** Reads and parses one UTF-8 JSON file. */
async function readJson<T>(filePath: string): Promise<T> {
    return JSON.parse(await readFile(filePath, "utf8")) as T;
}

test("travel lesson ids are coherent", async () => {
    const index = await readJson<TravelIndexEntry[]>(indexPath);

    assert.ok(Array.isArray(index), "data/travel/lessons.json must contain an array");

    const ids = index.map(lesson => lesson.id);
    for (const id of ids) {
        assert.ok(id.trim().length > 0, "Every travel lesson must have a non-empty id");
    }

    assert.equal(
        new Set(ids).size,
        ids.length,
        "Duplicate ids found in data/travel/lessons.json"
    );

    for (const lessonIndex of index) {
        const lessonPath = join(lessonsDirectory, `${lessonIndex.id}.json`);
        const lesson = await readJson<TravelLessonFile>(lessonPath);

        assert.equal(
            lesson.id,
            lessonIndex.id,
            [
                "Travel lesson id mismatch:",
                `index: ${lessonIndex.id}`,
                `file: ${lesson.id}`,
                `path: ${lessonPath}`
            ].join("\n")
        );
    }

    const indexedFiles = new Set(ids.map(id => `${id}.json`));
    const lessonFiles = (await readdir(lessonsDirectory))
        .filter(fileName => fileName.endsWith(".json"));

    const orphanFiles = lessonFiles.filter(fileName => !indexedFiles.has(fileName));
    assert.deepEqual(
        orphanFiles,
        [],
        `Travel lesson files missing from lessons.json: ${orphanFiles.join(", ")}`
    );
});
