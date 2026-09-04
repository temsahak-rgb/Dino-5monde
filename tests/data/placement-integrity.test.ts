import assert from "node:assert/strict";
import {
    join
} from "node:path";
import test from "node:test";

import {
    assertCefrLevel,
    assertNonEmptyString,
    assertUnique,
    dataDirectory,
    readJson
} from "./data-test-utils.js";

interface PlacementQuestionData {
    id: string;
    level: string;
    isPlacement?: boolean;
    difficulty: number;
    type: string;
    skill?: string;
    topic?: string;
    question: string;
    options: string[];
    correctIndex: number;
}

test(
    "placement questions are valid and answerable",
    async () => {
        const questions =
            await readJson<
                PlacementQuestionData[]
            >(
                join(
                    dataDirectory,
                    "placement.json"
                )
            );

        assert.ok(
            Array.isArray(
                questions
            ),
            "data/placement.json must contain an array"
        );

        assert.ok(
            questions.length > 0,
            "Placement test must contain questions"
        );

        assertUnique(
            questions.map(
                question =>
                    question.id
            ),
            "placement question ids"
        );

        for (
            const [
                index,
                question
            ]
            of questions.entries()
        ) {
            const context =
                `placement[${index}]`;

            assertNonEmptyString(
                question.id,
                `${context}.id`
            );

            assertCefrLevel(
                question.level,
                `${context}.level`
            );

            assert.ok(
                question.id.startsWith(
                    `${question.level}-`
                ),
                `${context}.id must start with ${question.level}-`
            );

            assert.equal(
                question.type,
                "mcq",
                `${context}.type must currently be mcq`
            );

            assert.ok(
                Number.isFinite(
                    question.difficulty
                )
                && question.difficulty >= 0
                && question.difficulty <= 100,
                `${context}.difficulty must be between 0 and 100`
            );

            assertNonEmptyString(
                question.question,
                `${context}.question`
            );

            assert.ok(
                Array.isArray(
                    question.options
                )
                && question.options.length >= 2,
                `${context}.options must contain at least two choices`
            );

            question.options.forEach(
                (
                    option,
                    optionIndex
                ) =>
                    assertNonEmptyString(
                        option,
                        `${context}.options[${optionIndex}]`
                    )
            );

            assertUnique(
                question.options,
                `${context}.options`
            );

            assert.ok(
                Number.isInteger(
                    question.correctIndex
                )
                && question.correctIndex >= 0
                && question.correctIndex
                    < question.options.length,
                `${context}.correctIndex must point to an existing option`
            );

            if (
                question.skill !== undefined
            ) {
                assertNonEmptyString(
                    question.skill,
                    `${context}.skill`
                );
            }

            if (
                question.topic !== undefined
            ) {
                assertNonEmptyString(
                    question.topic,
                    `${context}.topic`
                );
            }
        }
    }
);

test(
    "placement difficulties increase consistently across the catalog",
    async () => {
        const questions =
            await readJson<
                PlacementQuestionData[]
            >(
                join(
                    dataDirectory,
                    "placement.json"
                )
            );

        const difficulties =
            questions.map(
                question =>
                    question.difficulty
            );

        for (
            let index = 1;
            index < difficulties.length;
            index++
        ) {
            assert.ok(
                difficulties[index]
                >= difficulties[index - 1],
                [
                    "Placement questions should stay ordered by difficulty.",
                    `Question ${questions[index - 1].id}: ${difficulties[index - 1]}`,
                    `Question ${questions[index].id}: ${difficulties[index]}`
                ].join("\n")
            );
        }
    }
);
