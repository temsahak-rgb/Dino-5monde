import assert from "node:assert/strict";
import {
    access,
    readFile,
    readdir,
    stat
} from "node:fs/promises";
import {
    basename,
    dirname,
    extname,
    join,
    relative,
    resolve
} from "node:path";
import {
    fileURLToPath
} from "node:url";

const currentDirectory =
    dirname(
        fileURLToPath(
            import.meta.url
        )
    );

export const repositoryRoot =
    resolve(
        currentDirectory,
        "../.."
    );

export const dataDirectory =
    join(
        repositoryRoot,
        "data"
    );

export const cefrLevels = [
    "A1",
    "A2",
    "B1",
    "B2",
    "C1",
    "C2"
] as const;

export type CefrLevel =
    typeof cefrLevels[number];

export function repositoryPath(
    filePath: string
): string {
    return relative(
        repositoryRoot,
        filePath
    ).replace(
        /\\/g,
        "/"
    );
}

export async function fileExists(
    filePath: string
): Promise<boolean> {
    try {
        await access(
            filePath
        );

        return true;
    } catch {
        return false;
    }
}

export async function collectFiles(
    directory: string,
    extension = ".json"
): Promise<string[]> {
    const entries =
        await readdir(
            directory,
            {
                withFileTypes: true
            }
        );

    const files:
        string[] = [];

    for (
        const entry
        of entries
    ) {
        const childPath =
            join(
                directory,
                entry.name
            );

        if (
            entry.isDirectory()
        ) {
            files.push(
                ...await collectFiles(
                    childPath,
                    extension
                )
            );

            continue;
        }

        if (
            entry.isFile()
            && extname(
                entry.name
            ) === extension
        ) {
            files.push(
                childPath
            );
        }
    }

    return files.sort();
}

export async function readJson<T>(
    filePath: string
): Promise<T> {
    const source =
        await readFile(
            filePath,
            "utf8"
        );

    assert.ok(
        source.trim().length > 0,
        `${repositoryPath(filePath)} must not be empty`
    );

    try {
        return JSON.parse(
            source
        ) as T;
    } catch (error) {
        const message =
            error instanceof Error
                ? error.message
                : String(error);

        assert.fail(
            `${repositoryPath(filePath)} contains invalid JSON: ${message}`
        );
    }
}

export function assertRecord(
    value: unknown,
    context: string
): asserts value is Record<string, unknown> {
    assert.ok(
        typeof value === "object"
        && value !== null
        && !Array.isArray(value),
        `${context} must be an object`
    );
}

export function assertNonEmptyString(
    value: unknown,
    context: string
): asserts value is string {
    assert.ok(
        typeof value === "string"
        && value.trim().length > 0,
        `${context} must be a non-empty string`
    );
}

export function assertOptionalNonEmptyString(
    value: unknown,
    context: string
): void {
    if (
        value === undefined
        || value === null
    ) {
        return;
    }

    assertNonEmptyString(
        value,
        context
    );
}

export function assertPositiveNumber(
    value: unknown,
    context: string
): asserts value is number {
    assert.ok(
        typeof value === "number"
        && Number.isFinite(value)
        && value > 0,
        `${context} must be a positive number`
    );
}

export function assertNonNegativeInteger(
    value: unknown,
    context: string
): asserts value is number {
    assert.ok(
        typeof value === "number"
        && Number.isInteger(value)
        && value >= 0,
        `${context} must be a non-negative integer`
    );
}

export function assertUnique(
    values: readonly string[],
    context: string
): void {
    const duplicates =
        values.filter(
            (
                value,
                index
            ) =>
                values.indexOf(value)
                !== index
        );

    assert.deepEqual(
        [
            ...new Set(
                duplicates
            )
        ],
        [],
        `${context} contains duplicate value(s): ${[
            ...new Set(
                duplicates
            )
        ].join(", ")}`
    );
}

export function isCefrLevel(
    value: unknown
): value is CefrLevel {
    return (
        typeof value === "string"
        && (
            cefrLevels as readonly string[]
        ).includes(
            value
        )
    );
}

export function assertCefrLevel(
    value: unknown,
    context: string
): asserts value is CefrLevel {
    assert.ok(
        isCefrLevel(
            value
        ),
        `${context} must be one of ${cefrLevels.join(", ")}`
    );
}

export interface ChoiceQuestionLike {
    type:
        | "mcq"
        | "binary";
    question: string;
    options: string[];
    correct: number;
}

export interface FillBlankQuestionLike {
    type: "fill_blank";
    question: string;
    correct: string;
}

export interface OrderingQuestionLike {
    type: "ordering";
    question: string;
    words: string[];
    correct: string[];
}

export type ExerciseQuestionLike =
    | ChoiceQuestionLike
    | FillBlankQuestionLike
    | OrderingQuestionLike;

export function assertExerciseQuestion(
    value: unknown,
    context: string
): void {
    assertRecord(
        value,
        context
    );

    assertNonEmptyString(
        value.question,
        `${context}.question`
    );

    assertNonEmptyString(
        value.type,
        `${context}.type`
    );

    switch (
        value.type
    ) {
        case "mcq":
        case "binary": {
            assert.ok(
                Array.isArray(
                    value.options
                ),
                `${context}.options must be an array`
            );

            assert.ok(
                value.options.length >= 2,
                `${context}.options must contain at least two choices`
            );

            const options =
                value.options.map(
                    (
                        option,
                        index
                    ) => {
                        assertNonEmptyString(
                            option,
                            `${context}.options[${index}]`
                        );

                        return option;
                    }
                );

            assertUnique(
                options,
                `${context}.options`
            );

            assert.ok(
                typeof value.correct === "number"
                && Number.isInteger(
                    value.correct
                )
                && value.correct >= 0
                && value.correct
                    < options.length,
                `${context}.correct must point to an existing option`
            );

            return;
        }

        case "fill_blank":
            assertNonEmptyString(
                value.correct,
                `${context}.correct`
            );

            return;

        case "ordering":
            assert.ok(
                Array.isArray(
                    value.words
                ),
                `${context}.words must be an array`
            );

            assert.ok(
                Array.isArray(
                    value.correct
                ),
                `${context}.correct must be an array`
            );

            assert.ok(
                value.words.length > 0,
                `${context}.words must not be empty`
            );

            assert.ok(
                value.correct.length > 0,
                `${context}.correct must not be empty`
            );

            value.words.forEach(
                (
                    word,
                    index
                ) =>
                    assertNonEmptyString(
                        word,
                        `${context}.words[${index}]`
                    )
            );

            value.correct.forEach(
                (
                    word,
                    index
                ) =>
                    assertNonEmptyString(
                        word,
                        `${context}.correct[${index}]`
                    )
            );

            return;

        default:
            assert.fail(
                `${context}.type has unsupported value: ${String(value.type)}`
            );
    }
}

export function assertLessonTable(
    value: unknown,
    context: string
): void {
    if (
        value === undefined
        || value === null
    ) {
        return;
    }

    assertRecord(
        value,
        context
    );

    assert.ok(
        Array.isArray(
            value.headers
        ),
        `${context}.headers must be an array`
    );

    assert.ok(
        Array.isArray(
            value.rows
        ),
        `${context}.rows must be an array`
    );

    const headers =
        value.headers.map(
            (
                header,
                index
            ) => {
                assertNonEmptyString(
                    header,
                    `${context}.headers[${index}]`
                );

                return header;
            }
        );

    assert.ok(
        headers.length > 0,
        `${context}.headers must not be empty`
    );

    value.rows.forEach(
        (
            row,
            rowIndex
        ) => {
            assert.ok(
                Array.isArray(
                    row
                ),
                `${context}.rows[${rowIndex}] must be an array`
            );

            assert.equal(
                row.length,
                headers.length,
                `${context}.rows[${rowIndex}] must contain ${headers.length} cell(s)`
            );

            row.forEach(
                (
                    cell,
                    cellIndex
                ) =>
                    assertNonEmptyString(
                        cell,
                        `${context}.rows[${rowIndex}][${cellIndex}]`
                    )
            );
        }
    );
}

export function fileStem(
    filePath: string
): string {
    return basename(
        filePath,
        extname(
            filePath
        )
    );
}

export async function assertRegularFile(
    filePath: string,
    context: string
): Promise<void> {
    assert.ok(
        await fileExists(
            filePath
        ),
        `${context}: missing file ${repositoryPath(filePath)}`
    );

    const metadata =
        await stat(
            filePath
        );

    assert.ok(
        metadata.isFile(),
        `${context}: ${repositoryPath(filePath)} must be a file`
    );
}
