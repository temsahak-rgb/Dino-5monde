import assert from "node:assert/strict";
import {
    join
} from "node:path";
import test from "node:test";

import {
    assertExerciseQuestion,
    assertLessonTable,
    assertNonEmptyString,
    assertOptionalNonEmptyString,
    assertPositiveNumber,
    assertUnique,
    collectFiles,
    dataDirectory,
    fileExists,
    fileStem,
    readJson,
    repositoryPath
} from "./data-test-utils.js";

interface TravelIndexEntry {
    id: string;
    title: string;
    title_fa?: string;
    icon?: string;
    estimatedTime?: number;
}

interface TravelLesson {
    id: string;
    title: string;
    title_fa?: string;
    icon?: string;
    estimatedTime?: number;
    miniLessons?: unknown[];
    sections?: unknown[];
}

test(
    "travel index and lesson files form a one-to-one catalog",
    async () => {
        const travelDirectory =
            join(
                dataDirectory,
                "travel"
            );

        const lessonsDirectory =
            join(
                travelDirectory,
                "lessons"
            );

        const index =
            await readJson<
                TravelIndexEntry[]
            >(
                join(
                    travelDirectory,
                    "lessons.json"
                )
            );

        assert.ok(
            Array.isArray(
                index
            )
            && index.length > 0,
            "data/travel/lessons.json must contain a non-empty array"
        );

        const ids =
            index.map(
                lesson =>
                    lesson.id
            );

        assertUnique(
            ids,
            "travel index ids"
        );

        for (
            const [
                indexPosition,
                item
            ]
            of index.entries()
        ) {
            const context =
                `travel index[${indexPosition}]`;

            assertNonEmptyString(
                item.id,
                `${context}.id`
            );

            assertNonEmptyString(
                item.title,
                `${context}.title`
            );

            assertOptionalNonEmptyString(
                item.title_fa,
                `${context}.title_fa`
            );

            if (
                item.estimatedTime !== undefined
            ) {
                assertPositiveNumber(
                    item.estimatedTime,
                    `${context}.estimatedTime`
                );
            }

            const lessonPath =
                join(
                    lessonsDirectory,
                    `${item.id}.json`
                );

            assert.ok(
                await fileExists(
                    lessonPath
                ),
                `${item.id} is indexed but ${repositoryPath(lessonPath)} is missing`
            );

            const lesson =
                await readJson<
                    TravelLesson
                >(
                    lessonPath
                );

            assert.equal(
                lesson.id,
                item.id,
                `${repositoryPath(lessonPath)} id must match the travel index`
            );
        }

        const lessonFiles =
            await collectFiles(
                lessonsDirectory
            );

        const indexedFiles =
            new Set(
                ids.map(
                    id =>
                        `${id}.json`
                )
            );

        const orphanFiles =
            lessonFiles.filter(
                filePath =>
                    !indexedFiles.has(
                        `${fileStem(filePath)}.json`
                    )
            );

        assert.deepEqual(
            orphanFiles.map(
                repositoryPath
            ),
            [],
            "Travel lesson files must all be present in data/travel/lessons.json"
        );
    }
);

test(
    "travel lesson sections contain usable content",
    async () => {
        const lessonsDirectory =
            join(
                dataDirectory,
                "travel",
                "lessons"
            );

        const files =
            await collectFiles(
                lessonsDirectory
            );

        for (
            const filePath
            of files
        ) {
            const lesson =
                await readJson<
                    TravelLesson
                >(
                    filePath
                );

            const context =
                repositoryPath(
                    filePath
                );

            assert.equal(
                lesson.id,
                fileStem(
                    filePath
                ),
                `${context}.id must match the filename`
            );

            assertNonEmptyString(
                lesson.title,
                `${context}.title`
            );

            const sections =
                Array.isArray(
                    lesson.miniLessons
                )
                    ? lesson.miniLessons
                    : Array.isArray(
                        lesson.sections
                    )
                        ? lesson.sections
                        : [];

            assert.ok(
                sections.length > 0,
                `${context} must contain miniLessons or sections`
            );

            const sectionIds:
                string[] = [];

            sections.forEach(
                (
                    rawSection,
                    sectionIndex
                ) => {
                    assert.ok(
                        typeof rawSection === "object"
                        && rawSection !== null
                        && !Array.isArray(
                            rawSection
                        ),
                        `${context}.sections[${sectionIndex}] must be an object`
                    );

                    const section =
                        rawSection as Record<
                            string,
                            unknown
                        >;

                    const sectionContext =
                        `${context}.sections[${sectionIndex}]`;

                    assertNonEmptyString(
                        section.id,
                        `${sectionContext}.id`
                    );

                    sectionIds.push(
                        section.id
                    );

                    assertNonEmptyString(
                        section.type,
                        `${sectionContext}.type`
                    );

                    switch (
                        section.type
                    ) {
                        case "vocab":
                            assert.ok(
                                Array.isArray(
                                    section.words
                                )
                                && section.words.length > 0,
                                `${sectionContext}.words must be a non-empty array`
                            );

                            section.words.forEach(
                                (
                                    rawWord,
                                    wordIndex
                                ) => {
                                    assert.ok(
                                        typeof rawWord === "object"
                                        && rawWord !== null
                                        && !Array.isArray(
                                            rawWord
                                        ),
                                        `${sectionContext}.words[${wordIndex}] must be an object`
                                    );

                                    const word =
                                        rawWord as Record<
                                            string,
                                            unknown
                                        >;

                                    assertNonEmptyString(
                                        word.fr,
                                        `${sectionContext}.words[${wordIndex}].fr`
                                    );

                                    assertOptionalNonEmptyString(
                                        word.fa,
                                        `${sectionContext}.words[${wordIndex}].fa`
                                    );

                                    assertOptionalNonEmptyString(
                                        word.phonetic,
                                        `${sectionContext}.words[${wordIndex}].phonetic`
                                    );
                                }
                            );

                            break;

                        case "tips":
                            assert.ok(
                                Array.isArray(
                                    section.tips
                                )
                                && section.tips.length > 0,
                                `${sectionContext}.tips must be a non-empty array`
                            );

                            break;

                        case "lesson":
                            assertOptionalNonEmptyString(
                                section.content,
                                `${sectionContext}.content`
                            );

                            assertLessonTable(
                                section.table,
                                `${sectionContext}.table`
                            );

                            assertLessonTable(
                                section.table2,
                                `${sectionContext}.table2`
                            );

                            break;

                        case "exercise":
                            assert.ok(
                                Array.isArray(
                                    section.questions
                                )
                                && section.questions.length > 0,
                                `${sectionContext}.questions must be a non-empty array`
                            );

                            section.questions.forEach(
                                (
                                    question,
                                    questionIndex
                                ) =>
                                    assertExerciseQuestion(
                                        question,
                                        `${sectionContext}.questions[${questionIndex}]`
                                    )
                            );

                            break;

                        default:
                            assert.fail(
                                `${sectionContext}.type has unsupported value ${String(section.type)}`
                            );
                    }
                }
            );

            assertUnique(
                sectionIds,
                `${context} section ids`
            );
        }
    }
);
