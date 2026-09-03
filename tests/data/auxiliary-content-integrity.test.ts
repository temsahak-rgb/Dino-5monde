import assert from "node:assert/strict";
import {
    join,
    resolve
} from "node:path";
import test from "node:test";

import {
    assertCefrLevel,
    assertNonEmptyString,
    assertUnique,
    dataDirectory,
    fileExists,
    readJson,
    repositoryPath,
    repositoryRoot
} from "./data-test-utils.js";

interface NewsIndexEntry {
    id: string;
    title: string;
    title_fa?: string;
    subtitle?: string;
    subtitle_fa?: string;
    level: string;
    publishedDate: string;
    image: string;
}

interface NewsDetail {
    id: string;
    title: string;
    level: string;
    publishedDate: string;
    image: string;
    content: {
        fullText: string;
        simpleText: string;
        vocabulary?: Array<{
            fr: string;
            fa: string;
            level?: string;
        }>;
        grammar?: Array<{
            title: string;
            example: string;
            level?: string;
        }>;
    };
}

interface PollOption {
    id: string;
    labelFa: string;
    labelFr: string;
}

interface PollFile {
    activePoll?: {
        id: string;
        question: string;
        question_fr: string;
        options: PollOption[];
        publishedDate?: string;
        endDate?: string;
    };
}

function assertIsoDate(
    value: string,
    context: string
): void {
    assert.match(
        value,
        /^\d{4}-\d{2}-\d{2}$/,
        `${context} must use YYYY-MM-DD`
    );

    assert.ok(
        !Number.isNaN(
            Date.parse(
                `${value}T00:00:00Z`
            )
        ),
        `${context} must be a valid calendar date`
    );
}

test(
    "news index entries resolve to coherent article files and images",
    async () => {
        const newsDirectory =
            join(
                dataDirectory,
                "news"
            );

        const index =
            await readJson<
                NewsIndexEntry[]
            >(
                join(
                    newsDirectory,
                    "news-index.json"
                )
            );

        assert.ok(
            Array.isArray(
                index
            ),
            "news-index.json must contain an array"
        );

        assertUnique(
            index.map(
                item =>
                    item.id
            ),
            "news ids"
        );

        for (
            const [
                indexPosition,
                item
            ]
            of index.entries()
        ) {
            const context =
                `news-index[${indexPosition}]`;

            assertNonEmptyString(
                item.id,
                `${context}.id`
            );

            assertNonEmptyString(
                item.title,
                `${context}.title`
            );

            assertNonEmptyString(
                item.level,
                `${context}.level`
            );

            assertIsoDate(
                item.publishedDate,
                `${context}.publishedDate`
            );

            assertNonEmptyString(
                item.image,
                `${context}.image`
            );

            const articlePath =
                join(
                    newsDirectory,
                    `${item.id}.json`
                );

            assert.ok(
                await fileExists(
                    articlePath
                ),
                `${item.id} is indexed but ${repositoryPath(articlePath)} is missing`
            );

            const article =
                await readJson<
                    NewsDetail
                >(
                    articlePath
                );

            assert.equal(
                article.id,
                item.id,
                `${repositoryPath(articlePath)} id must match the news index`
            );

            assert.equal(
                article.publishedDate,
                item.publishedDate,
                `${repositoryPath(articlePath)} publishedDate must match the news index`
            );

            assertNonEmptyString(
                article.content.fullText,
                `${repositoryPath(articlePath)}.content.fullText`
            );

            assertNonEmptyString(
                article.content.simpleText,
                `${repositoryPath(articlePath)}.content.simpleText`
            );

            const imagePath =
                resolve(
                    repositoryRoot,
                    item.image.replace(
                        /^\.\//,
                        ""
                    )
                );

            assert.ok(
                await fileExists(
                    imagePath
                ),
                `${context}.image points to missing ${repositoryPath(imagePath)}`
            );

            article.content.vocabulary
                ?.forEach(
                    (
                        vocabulary,
                        vocabularyIndex
                    ) => {
                        const vocabularyContext =
                            `${repositoryPath(articlePath)}.content.vocabulary[${vocabularyIndex}]`;

                        assertNonEmptyString(
                            vocabulary.fr,
                            `${vocabularyContext}.fr`
                        );

                        assertNonEmptyString(
                            vocabulary.fa,
                            `${vocabularyContext}.fa`
                        );

                        if (
                            vocabulary.level !== undefined
                        ) {
                            assertCefrLevel(
                                vocabulary.level,
                                `${vocabularyContext}.level`
                            );
                        }
                    }
                );

            article.content.grammar
                ?.forEach(
                    (
                        grammar,
                        grammarIndex
                    ) => {
                        const grammarContext =
                            `${repositoryPath(articlePath)}.content.grammar[${grammarIndex}]`;

                        assertNonEmptyString(
                            grammar.title,
                            `${grammarContext}.title`
                        );

                        assertNonEmptyString(
                            grammar.example,
                            `${grammarContext}.example`
                        );

                        if (
                            grammar.level !== undefined
                        ) {
                            assertCefrLevel(
                                grammar.level,
                                `${grammarContext}.level`
                            );
                        }
                    }
                );
        }
    }
);

test(
    "active poll has unique answer options and coherent dates",
    async () => {
        const polls =
            await readJson<
                PollFile
            >(
                join(
                    dataDirectory,
                    "polls",
                    "polls.json"
                )
            );

        if (
            !polls.activePoll
        ) {
            return;
        }

        const poll =
            polls.activePoll;

        assertNonEmptyString(
            poll.id,
            "activePoll.id"
        );

        assertNonEmptyString(
            poll.question,
            "activePoll.question"
        );

        assertNonEmptyString(
            poll.question_fr,
            "activePoll.question_fr"
        );

        assert.ok(
            Array.isArray(
                poll.options
            )
            && poll.options.length >= 2,
            "activePoll.options must contain at least two options"
        );

        assertUnique(
            poll.options.map(
                option =>
                    option.id
            ),
            "activePoll option ids"
        );

        poll.options.forEach(
            (
                option,
                optionIndex
            ) => {
                const context =
                    `activePoll.options[${optionIndex}]`;

                assertNonEmptyString(
                    option.id,
                    `${context}.id`
                );

                assertNonEmptyString(
                    option.labelFa,
                    `${context}.labelFa`
                );

                assertNonEmptyString(
                    option.labelFr,
                    `${context}.labelFr`
                );
            }
        );

        if (
            poll.publishedDate
        ) {
            assertIsoDate(
                poll.publishedDate,
                "activePoll.publishedDate"
            );
        }

        if (
            poll.endDate
        ) {
            assertIsoDate(
                poll.endDate,
                "activePoll.endDate"
            );
        }

        if (
            poll.publishedDate
            && poll.endDate
        ) {
            assert.ok(
                Date.parse(
                    `${poll.endDate}T00:00:00Z`
                )
                >= Date.parse(
                    `${poll.publishedDate}T00:00:00Z`
                ),
                "activePoll.endDate must not precede publishedDate"
            );
        }
    }
);
