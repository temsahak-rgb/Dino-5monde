const test = require("node:test");
const assert = require("node:assert/strict");

const fs = require("node:fs");
const path = require("node:path");

const ROOT = path.resolve(__dirname, "../..");

const INDEX_PATH = path.join(
    ROOT,
    "data",
    "travel",
    "lessons.json"
);

const LESSONS_DIR = path.join(
    ROOT,
    "data",
    "travel",
    "lessons"
);

function readJson(filePath) {
    return JSON.parse(
        fs.readFileSync(filePath, "utf8")
    );
}

test("travel lesson ids are coherent", () => {
    const index = readJson(INDEX_PATH);

    assert.ok(
        Array.isArray(index),
        "data/travel/lessons.json must contain an array"
    );

    const ids = index.map(lesson => lesson.id);

    // ---------------------------------
    // Aucun ID vide
    // ---------------------------------

    for (const id of ids) {
        assert.ok(
            typeof id === "string" && id.length > 0,
            "Every travel lesson must have an id"
        );
    }

    // ---------------------------------
    // Aucun doublon dans l'index
    // ---------------------------------

    assert.equal(
        new Set(ids).size,
        ids.length,
        "Duplicate ids found in data/travel/lessons.json"
    );

    // ---------------------------------
    // Chaque ID possède son fichier
    // et l'id interne doit correspondre
    // ---------------------------------

    for (const lessonIndex of index) {
        const lessonFile = path.join(
            LESSONS_DIR,
            `${lessonIndex.id}.json`
        );

        assert.ok(
            fs.existsSync(lessonFile),
            `Missing travel lesson file: ${lessonIndex.id}.json`
        );

        const lesson = readJson(lessonFile);

        assert.equal(
            lesson.id,
            lessonIndex.id,
            [
                `Travel lesson id mismatch:`,
                `index: ${lessonIndex.id}`,
                `file: ${lesson.id}`,
                `path: ${lessonFile}`
            ].join("\n")
        );
    }
});