import assert from "node:assert/strict";
import {
    basename,
    dirname,
    join
} from "node:path";
import test from "node:test";

import {
    assertCefrLevel,
    assertExerciseQuestion,
    assertNonEmptyString,
    assertUnique,
    collectFiles,
    dataDirectory,
    fileStem,
    readJson,
    repositoryPath
} from "./data-test-utils.js";

interface ExerciseFile {
    id: string;
    type: string;
    title: string;
    title_fa?: string;
    questions: unknown[];
    displayCount?: number;
}

test(
    "standalone exercise files are valid playable sections",
    async () => {
        const exercisesDirectory =
            join(
                dataDirectory,
                "exercises"
            );

        const files =
            await collectFiles(
                exercisesDirectory
            );

        for (
            const filePath
            of files
        ) {
            const exercise =
                await readJson<
                    ExerciseFile
                >(
                    filePath
                );

            const context =
                repositoryPath(
                    filePath
                );

            const level =
                basename(
                    dirname(
                        filePath
                    )
                );

            assertCefrLevel(
                level,
                `${context} parent directory`
            );

            assertNonEmptyString(
                exercise.id,
                `${context}.id`
            );

            assert.equal(
                exercise.id,
                fileStem(
                    filePath
                ),
                `${context}.id must match the filename`
            );

            assert.ok(
                exercise.type === "exercise"
                || exercise.type === "quiz",
                `${context}.type must be exercise or quiz`
            );

            assertNonEmptyString(
                exercise.title,
                `${context}.title`
            );

            assert.ok(
                Array.isArray(
                    exercise.questions
                )
                && exercise.questions.length > 0,
                `${context}.questions must be a non-empty array`
            );

            if (
                exercise.displayCount !== undefined
            ) {
                assert.ok(
                    Number.isInteger(
                        exercise.displayCount
                    )
                    && exercise.displayCount > 0
                    && exercise.displayCount
                        <= exercise.questions.length,
                    `${context}.displayCount must be between 1 and questions.length`
                );
            }

            exercise.questions.forEach(
                (
                    question,
                    index
                ) =>
                    assertExerciseQuestion(
                        question,
                        `${context}.questions[${index}]`
                    )
            );
        }
    }
);

test(
    "standalone exercise ids are unique",
    async () => {
        const files =
            await collectFiles(
                join(
                    dataDirectory,
                    "exercises"
                )
            );

        const ids:
            string[] = [];

        for (
            const filePath
            of files
        ) {
            const exercise =
                await readJson<
                    ExerciseFile
                >(
                    filePath
                );

            ids.push(
                exercise.id
            );
        }

        assertUnique(
            ids,
            "standalone exercise ids"
        );
    }
);
