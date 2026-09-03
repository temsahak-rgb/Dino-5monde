import assert from "node:assert/strict";
import {
    basename,
    join
} from "node:path";
import test from "node:test";

import {
    assertCefrLevel,
    assertNonEmptyString,
    assertOptionalNonEmptyString,
    assertUnique,
    collectFiles,
    dataDirectory,
    fileExists,
    readJson,
    repositoryPath
} from "./data-test-utils.js";

interface VocabIndexEntry {
    id: string;
    title: string;
    title_fa?: string;
    icon?: string;
    words: number;
}

interface VocabWord {
    fr: string;
    fa: string;
    difficulty?: number;
    ex?: string;
    ex_fa?: string;
}

interface StoryBlank {
    id: number;
    answer?: string;
    options: string[];
    correctIndex: number;
}

interface VocabStory {
    title?: string;
    title_fa?: string;
    text?: string;
    text_fa?: string;
    blanks?: StoryBlank[];
    paragraphs?: unknown[];
    questions?: unknown[];
}

interface VocabPack {
    id: string;
    level: string;
    title?: string;
    title_fa?: string;
    theme?: string;
    theme_fa?: string;
    icon?: string;
    words: VocabWord[];
    stories?: Record<
        string,
        VocabStory | undefined
    >;
    quiz?: VocabQuiz;
    exercise?: VocabQuiz;
}

interface VocabQuizQuestion {
    question: string;
    options: string[];
    correct?: number;
    correctIndex?: number;
}

interface VocabQuiz {
    questions: VocabQuizQuestion[];
    displayCount?: number;
}

function assertVocabQuiz(
    quiz: VocabQuiz,
    context: string
): void {
    assert.ok(
        Array.isArray(
            quiz.questions
        )
        && quiz.questions.length > 0,
        `${context}.questions must be a non-empty array`
    );

    if (
        quiz.displayCount !== undefined
    ) {
        assert.ok(
            Number.isInteger(
                quiz.displayCount
            )
            && quiz.displayCount > 0
            && quiz.displayCount
                <= quiz.questions.length,
            `${context}.displayCount must be between 1 and questions.length`
        );
    }

    quiz.questions.forEach(
        (
            question,
            questionIndex
        ) => {
            const questionContext =
                `${context}.questions[${questionIndex}]`;

            assertNonEmptyString(
                question.question,
                `${questionContext}.question`
            );

            assert.ok(
                Array.isArray(
                    question.options
                )
                && question.options.length >= 2,
                `${questionContext}.options must contain at least two choices`
            );

            question.options.forEach(
                (
                    option,
                    optionIndex
                ) =>
                    assertNonEmptyString(
                        option,
                        `${questionContext}.options[${optionIndex}]`
                    )
            );

            assertUnique(
                question.options,
                `${questionContext}.options`
            );

            const correctIndex =
                question.correctIndex
                ?? question.correct;

            assert.ok(
                Number.isInteger(
                    correctIndex
                )
                && correctIndex !== undefined
                && correctIndex >= 0
                && correctIndex
                    < question.options.length,
                `${questionContext} must define a valid correct/correctIndex`
            );

            if (
                question.correct !== undefined
                && question.correctIndex
                    !== undefined
            ) {
                assert.equal(
                    question.correct,
                    question.correctIndex,
                    `${questionContext}.correct and correctIndex must agree`
                );
            }
        }
    );
}

function assertStory(
    story: VocabStory,
    context: string
): void {
    assertOptionalNonEmptyString(
        story.title,
        `${context}.title`
    );

    if (
        story.blanks
    ) {
        assert.ok(
            Array.isArray(
                story.blanks
            ),
            `${context}.blanks must be an array`
        );

        const ids =
            story.blanks.map(
                blank =>
                    String(
                        blank.id
                    )
            );

        assertUnique(
            ids,
            `${context}.blank ids`
        );

        for (
            const [
                blankIndex,
                blank
            ]
            of story.blanks.entries()
        ) {
            const blankContext =
                `${context}.blanks[${blankIndex}]`;

            assert.ok(
                Number.isInteger(
                    blank.id
                )
                && blank.id > 0,
                `${blankContext}.id must be a positive integer`
            );

            assert.ok(
                Array.isArray(
                    blank.options
                )
                && blank.options.length >= 2,
                `${blankContext}.options must contain at least two choices`
            );

            blank.options.forEach(
                (
                    option,
                    optionIndex
                ) =>
                    assertNonEmptyString(
                        option,
                        `${blankContext}.options[${optionIndex}]`
                    )
            );

            assertUnique(
                blank.options,
                `${blankContext}.options`
            );

            assert.ok(
                Number.isInteger(
                    blank.correctIndex
                )
                && blank.correctIndex >= 0
                && blank.correctIndex
                    < blank.options.length,
                `${blankContext}.correctIndex must point to an existing option`
            );

            if (
                blank.answer !== undefined
            ) {
                assertNonEmptyString(
                    blank.answer,
                    `${blankContext}.answer`
                );

                assert.equal(
                    blank.answer
                        .trim()
                        .toLocaleLowerCase("fr"),
                    blank.options[
                        blank.correctIndex
                    ]
                        .trim()
                        .toLocaleLowerCase("fr"),
                    `${blankContext}.answer must match options[correctIndex]`
                );
            }
        }

        if (
            story.text
        ) {
            const placeholderIds =
                [
                    ...story.text.matchAll(
                        /____\s*\((\d+)\)/g
                    )
                ].map(
                    match =>
                        Number.parseInt(
                            match[1],
                            10
                        )
                );

            assert.deepEqual(
                [
                    ...placeholderIds
                ].sort(
                    (
                        first,
                        second
                    ) =>
                        first - second
                ),
                story.blanks
                    .map(
                        blank =>
                            blank.id
                    )
                    .sort(
                        (
                            first,
                            second
                        ) =>
                            first - second
                    ),
                `${context} placeholders must match blank ids`
            );
        }
    }

    if (
        story.questions
    ) {
        assert.ok(
            Array.isArray(
                story.questions
            ),
            `${context}.questions must be an array`
        );
    }
}

test(
    "vocabulary indexes match their pack files and declared word counts",
    async () => {
        const vocabularyDirectory =
            join(
                dataDirectory,
                "vocabulary"
            );

        const allJson =
            await collectFiles(
                vocabularyDirectory
            );

        const indexFiles =
            allJson.filter(
                filePath =>
                    /^vocab-[A-C][12]\.json$/.test(
                        basename(
                            filePath
                        )
                    )
            );

        assert.ok(
            indexFiles.length > 0,
            "No vocabulary index files were found"
        );

        for (
            const indexPath
            of indexFiles
        ) {
            const level =
                basename(
                    indexPath
                )
                    .replace(
                        "vocab-",
                        ""
                    )
                    .replace(
                        ".json",
                        ""
                    );

            assertCefrLevel(
                level,
                repositoryPath(
                    indexPath
                )
            );

            const index =
                await readJson<
                    VocabIndexEntry[]
                >(
                    indexPath
                );

            assert.ok(
                Array.isArray(
                    index
                ),
                `${repositoryPath(indexPath)} must contain an array`
            );

            assertUnique(
                index.map(
                    pack =>
                        pack.id
                ),
                `${repositoryPath(indexPath)} pack ids`
            );

            for (
                const [
                    packIndex,
                    entry
                ]
                of index.entries()
            ) {
                const context =
                    `${repositoryPath(indexPath)}[${packIndex}]`;

                assertNonEmptyString(
                    entry.id,
                    `${context}.id`
                );

                assertNonEmptyString(
                    entry.title,
                    `${context}.title`
                );

                assert.ok(
                    Number.isInteger(
                        entry.words
                    )
                    && entry.words >= 0,
                    `${context}.words must be a non-negative integer`
                );

                const packPath =
                    join(
                        vocabularyDirectory,
                        level,
                        `${entry.id}.json`
                    );

                assert.ok(
                    await fileExists(
                        packPath
                    ),
                    `${entry.id} is indexed but ${repositoryPath(packPath)} is missing`
                );

                const pack =
                    await readJson<
                        VocabPack
                    >(
                        packPath
                    );

                assert.equal(
                    pack.id,
                    entry.id,
                    `${repositoryPath(packPath)} id must match its index`
                );

                assert.equal(
                    pack.level,
                    level,
                    `${repositoryPath(packPath)} level must match its parent index`
                );

                assert.ok(
                    Array.isArray(
                        pack.words
                    ),
                    `${repositoryPath(packPath)}.words must be an array`
                );

                assert.equal(
                    pack.words.length,
                    entry.words,
                    `${repositoryPath(packPath)} contains ${pack.words.length} word(s) but the index declares ${entry.words}`
                );

                const normalizedWords:
                    string[] = [];

                pack.words.forEach(
                    (
                        word,
                        wordIndex
                    ) => {
                        const wordContext =
                            `${repositoryPath(packPath)}.words[${wordIndex}]`;

                        assertNonEmptyString(
                            word.fr,
                            `${wordContext}.fr`
                        );

                        assertNonEmptyString(
                            word.fa,
                            `${wordContext}.fa`
                        );

                        assertOptionalNonEmptyString(
                            word.ex,
                            `${wordContext}.ex`
                        );

                        assertOptionalNonEmptyString(
                            word.ex_fa,
                            `${wordContext}.ex_fa`
                        );

                        if (
                            word.difficulty !== undefined
                        ) {
                            assert.ok(
                                Number.isFinite(
                                    word.difficulty
                                )
                                && word.difficulty > 0,
                                `${wordContext}.difficulty must be positive`
                            );
                        }

                        normalizedWords.push(
                            word.fr
                                .trim()
                                .toLocaleLowerCase(
                                    "fr"
                                )
                        );
                    }
                );

                assertUnique(
                    normalizedWords,
                    `${repositoryPath(packPath)} French words`
                );

                if (
                    pack.stories
                ) {
                    for (
                        const [
                            storyKey,
                            story
                        ]
                        of Object.entries(
                            pack.stories
                        )
                    ) {
                        if (!story) {
                            continue;
                        }

                        assertStory(
                            story,
                            `${repositoryPath(packPath)}.stories.${storyKey}`
                        );
                    }
                }

                if (
                    pack.quiz
                ) {
                    assertVocabQuiz(
                        pack.quiz,
                        `${repositoryPath(packPath)}.quiz`
                    );
                }

                if (
                    pack.exercise
                ) {
                    assertVocabQuiz(
                        pack.exercise,
                        `${repositoryPath(packPath)}.exercise`
                    );
                }
            }
        }
    }
);
