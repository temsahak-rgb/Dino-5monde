import assert from "node:assert/strict";
import test from "node:test";

import {
    getSaurusEvolution,
    recommendSaurus
} from "../../src/core/saurusAllocation.js";

test(
    "Saurus allocation recommends the learner's dominant learning style",
    () => {
        assert.equal(
            recommendSaurus([
                "velociraptor-explorer",
                "triceratops-perseverant",
                "velociraptor-explorer"
            ]),
            "velociraptor-explorer"
        );
        assert.equal(
            recommendSaurus([
                "triceratops-perseverant",
                "triceratops-perseverant",
                "brachiosaurus-curious"
            ]),
            "triceratops-perseverant"
        );
        assert.equal(
            recommendSaurus([
                "brachiosaurus-curious",
                "brachiosaurus-curious",
                "velociraptor-explorer"
            ]),
            "brachiosaurus-curious"
        );
    }
);

test(
    "the preferred session rhythm breaks a three-way tie",
    () => {
        assert.equal(
            recommendSaurus([
                "velociraptor-explorer",
                "triceratops-perseverant",
                "brachiosaurus-curious"
            ]),
            "brachiosaurus-curious"
        );
    }
);

test(
    "incomplete Saurus quizzes are rejected",
    () => {
        assert.throws(
            () => recommendSaurus([
                "velociraptor-explorer"
            ]),
            TypeError
        );
    }
);

test(
    "Saurus evolution uses stable five and fifteen activity thresholds",
    () => {
        assert.deepEqual(
            getSaurusEvolution(0),
            {
                completedActivities: 0,
                currentThreshold: 0,
                nextThreshold: 5,
                phase: "hatchling",
                progressToNextPhase: 0
            }
        );
        assert.equal(
            getSaurusEvolution(5).phase,
            "explorer"
        );
        assert.deepEqual(
            getSaurusEvolution(15),
            {
                completedActivities: 15,
                currentThreshold: 15,
                nextThreshold: null,
                phase: "guide",
                progressToNextPhase: 100
            }
        );
        assert.throws(
            () => getSaurusEvolution(-1),
            TypeError
        );
    }
);
