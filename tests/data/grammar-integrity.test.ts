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
    assertLessonTable,
    assertNonEmptyString,
    assertNonNegativeInteger,
    assertPositiveNumber,
    assertUnique,
    collectFiles,
    dataDirectory,
    fileExists,
    fileStem,
    readJson,
    repositoryPath
} from "./data-test-utils.js";

interface GrammarIndexEntry {
    id: string;
    level: string;
    module: string;
    category?: string;
    icon: string;
    title: string;
    title_fa?: string;
    estimatedTime: number;
    importance?: number;
    recommended?: boolean;
    prerequisites?: string[];
    lessons?: number;
    exercises: number;
}

interface LessonFile {
    id: string;
    level?: string;
    title: string;
    title_fa?: string;
    icon?: string;
    estimatedTime?: number;
    sections: unknown[];
}

async function loadGrammarIndexes(): Promise<
    Map<string, GrammarIndexEntry>
> {
    const files =
        (
            await collectFiles(
                dataDirectory
            )
        ).filter(
            filePath =>
                /^grammar-[A-C][12]\.json$/.test(
                    basename(
                        filePath
                    )
                )
        );

    assert.ok(
        files.length > 0,
        "No grammar index files were found"
    );

    const byId =
        new Map<
            string,
            GrammarIndexEntry
        >();

    for (
        const filePath
        of files
    ) {
        const fileName =
            basename(
                filePath
            );

        const level =
            fileName
                .replace(
                    "grammar-",
                    ""
                )
                .replace(
                    ".json",
                    ""
                );

        assertCefrLevel(
            level,
            fileName
        );

        const entries =
            await readJson<
                GrammarIndexEntry[]
            >(
                filePath
            );

        assert.ok(
            Array.isArray(
                entries
            ),
            `${fileName} must contain an array`
        );

        for (
            const [
                index,
                entry
            ]
            of entries.entries()
        ) {
            const context =
                `${fileName}[${index}]`;

            assertNonEmptyString(
                entry.id,
                `${context}.id`
            );

            assert.equal(
                entry.level,
                level,
                `${context}.level must match ${fileName}`
            );

            assert.ok(
                entry.id.startsWith(
                    `${level}-G-`
                ),
                `${context}.id must start with ${level}-G-`
            );

            assertNonEmptyString(
                entry.module,
                `${context}.module`
            );

            assertNonEmptyString(
                entry.icon,
                `${context}.icon`
            );

            assertNonEmptyString(
                entry.title,
                `${context}.title`
            );

            assertPositiveNumber(
                entry.estimatedTime,
                `${context}.estimatedTime`
            );

            assertNonNegativeInteger(
                entry.exercises,
                `${context}.exercises`
            );

            if (
                entry.lessons !== undefined
            ) {
                assertNonNegativeInteger(
                    entry.lessons,
                    `${context}.lessons`
                );
            }

            if (
                entry.importance !== undefined
            ) {
                assert.ok(
                    Number.isInteger(
                        entry.importance
                    )
                    && entry.importance >= 1
                    && entry.importance <= 5,
                    `${context}.importance must be between 1 and 5`
                );
            }

            if (
                entry.recommended !== undefined
            ) {
                assert.equal(
                    typeof entry.recommended,
                    "boolean",
                    `${context}.recommended must be boolean`
                );
            }

            const prerequisites =
                entry.prerequisites
                ?? [];

            assert.ok(
                Array.isArray(
                    prerequisites
                ),
                `${context}.prerequisites must be an array`
            );

            prerequisites.forEach(
                (
                    prerequisite,
                    prerequisiteIndex
                ) =>
                    assertNonEmptyString(
                        prerequisite,
                        `${context}.prerequisites[${prerequisiteIndex}]`
                    )
            );

            assertUnique(
                prerequisites,
                `${context}.prerequisites`
            );

            assert.ok(
                !prerequisites.includes(
                    entry.id
                ),
                `${context} cannot depend on itself`
            );

            assert.ok(
                !byId.has(
                    entry.id
                ),
                `Duplicate grammar lesson id: ${entry.id}`
            );

            byId.set(
                entry.id,
                entry
            );
        }
    }

    return byId;
}

test(
    "grammar catalogs have unique ids and valid prerequisite references",
    async () => {
        const byId =
            await loadGrammarIndexes();

        for (
            const entry
            of byId.values()
        ) {
            for (
                const prerequisite
                of entry.prerequisites
                    ?? []
            ) {
                assert.ok(
                    byId.has(
                        prerequisite
                    ),
                    `${entry.id} references missing prerequisite ${prerequisite}`
                );
            }
        }
    }
);

test(
    "every grammar catalog entry points to a real lesson file",
    async () => {
        const byId =
            await loadGrammarIndexes();

        for (
            const entry
            of byId.values()
        ) {
            const lessonPath =
                join(
                    dataDirectory,
                    "lessons",
                    entry.level,
                    `${entry.id}.json`
                );

            assert.ok(
                await fileExists(
                    lessonPath
                ),
                `${entry.id} is indexed but ${repositoryPath(lessonPath)} is missing`
            );
        }
    }
);

test(
    "grammar lesson files are structurally valid and indexed",
    async () => {
        const byId =
            await loadGrammarIndexes();

        const lessonDirectory =
            join(
                dataDirectory,
                "lessons"
            );

        const lessonFiles =
            await collectFiles(
                lessonDirectory
            );

        for (
            const filePath
            of lessonFiles
        ) {
            const lesson =
                await readJson<
                    LessonFile
                >(
                    filePath
                );

            const id =
                fileStem(
                    filePath
                );

            const level =
                basename(
                    dirname(
                        filePath
                    )
                );

            assert.equal(
                lesson.id,
                id,
                `${repositoryPath(filePath)} id must match its filename`
            );

            assert.ok(
                byId.has(
                    id
                ),
                `${repositoryPath(filePath)} exists but ${id} is absent from grammar indexes`
            );

            if (
                lesson.level !== undefined
            ) {
                assert.equal(
                    lesson.level,
                    byId.get(id)?.level,
                    `${repositoryPath(filePath)} level must match its grammar index`
                );
            }

            assertNonEmptyString(
                lesson.title,
                `${repositoryPath(filePath)}.title`
            );

            assert.ok(
                Array.isArray(
                    lesson.sections
                )
                && lesson.sections.length > 0,
                `${repositoryPath(filePath)}.sections must be a non-empty array`
            );

            const sectionIds:
                string[] = [];

            lesson.sections.forEach(
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
                        `${repositoryPath(filePath)}.sections[${sectionIndex}] must be an object`
                    );

                    const section =
                        rawSection as Record<
                            string,
                            unknown
                        >;

                    const context =
                        `${repositoryPath(filePath)}.sections[${sectionIndex}]`;

                    assertNonEmptyString(
                        section.id,
                        `${context}.id`
                    );

                    sectionIds.push(
                        section.id
                    );

                    assertNonEmptyString(
                        section.type,
                        `${context}.type`
                    );

                    assertNonEmptyString(
                        section.title,
                        `${context}.title`
                    );

                    switch (
                        section.type
                    ) {
                        case "lesson":
                            if (
                                section.content !== undefined
                            ) {
                                assertNonEmptyString(
                                    section.content,
                                    `${context}.content`
                                );
                            }

                            assertLessonTable(
                                section.table,
                                `${context}.table`
                            );

                            assertLessonTable(
                                section.table2,
                                `${context}.table2`
                            );

                            break;

                        case "exercise":
                        case "quiz":
                            assert.ok(
                                Array.isArray(
                                    section.questions
                                )
                                && section.questions.length > 0,
                                `${context}.questions must be a non-empty array`
                            );

                            section.questions.forEach(
                                (
                                    question,
                                    questionIndex
                                ) =>
                                    assertExerciseQuestion(
                                        question,
                                        `${context}.questions[${questionIndex}]`
                                    )
                            );

                            break;

                        default:
                            assert.fail(
                                `${context}.type has unsupported value ${String(section.type)}`
                            );
                    }
                }
            );

            assertUnique(
                sectionIds,
                `${repositoryPath(filePath)} section ids`
            );
        }
    }
);
