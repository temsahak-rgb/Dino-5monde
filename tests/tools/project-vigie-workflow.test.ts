import assert from "node:assert/strict";
import {
    readFile
} from "node:fs/promises";
import test from "node:test";
import {
    dirname,
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

const root =
    resolve(
        currentDirectory,
        "../.."
    );

test(
    "Project Vigie reports from trusted code without replaying CI suites",
    async () => {
        const workflow =
            await readFile(
                resolve(
                    root,
                    ".github/workflows/project-vigie.yml"
                ),
                "utf8"
            );

        assert.match(
            workflow,
            /pull_request_target:/
        );
        assert.match(
            workflow,
            /types:\s*\n\s*- opened\s*\n\s*- synchronize\s*\n\s*- reopened\s*\n\s*- ready_for_review/
        );
        assert.doesNotMatch(
            workflow,
            /workflow_run:/
        );
        assert.match(
            workflow,
            /ref: develop/
        );
        assert.match(
            workflow,
            /persist-credentials: false/
        );
        assert.match(
            workflow,
            /never checks out the pull request head/
        );
        assert.match(
            workflow,
            /PR feature files are\s*\n\s*# downloaded later as untrusted data and are never executed/
        );
        assert.doesNotMatch(
            workflow,
            /ref:\s*\$\{\{[^\n]*head/
        );
        assert.doesNotMatch(
            workflow,
            /npm run (?:test|test:data|test:e2e|typecheck|build|knip|duplication)/
        );
        assert.match(
            workflow,
            /npm run vigie:report/
        );
        assert.match(
            workflow,
            /Executable feature contracts/
        );
        assert.match(
            workflow,
            /Materialize PR feature files as untrusted data/
        );
        assert.match(
            workflow,
            /Measure feature progress without executing PR code/
        );
        assert.doesNotMatch(
            workflow,
            /npm run test:features|cucumber-js/
        );
        assert.match(
            workflow,
            /pull-requests: write/
        );
        assert.doesNotMatch(
            workflow,
            /issues: write|contents: write|actions: write/
        );
        assert.match(
            workflow,
            /context\.payload\.pull_request\?\.number/
        );
        assert.doesNotMatch(
            workflow,
            /pull\.head\.ref|github\.head_ref|github\.event\.pull_request\.head\.ref/
        );
    }
);

test(
    "ordinary pull request checks retain read-only permissions",
    async () => {
        const [
            qualityWorkflow,
            corpusWorkflow,
            featureWorkflow
        ] = await Promise.all([
            readFile(
                resolve(
                    root,
                    ".github/workflows/quality.yml"
                ),
                "utf8"
            ),
            readFile(
                resolve(
                    root,
                    ".github/workflows/corpus-quality.yml"
                ),
                "utf8"
            ),
            readFile(
                resolve(
                    root,
                    ".github/workflows/feature-contracts.yml"
                ),
                "utf8"
            )
        ]);

        for (
            const workflow
            of [
                qualityWorkflow,
                corpusWorkflow,
                featureWorkflow
            ]
        ) {
            assert.doesNotMatch(
                workflow,
                /issues: write|pull-requests: write/
            );
        }

        assert.doesNotMatch(
            corpusWorkflow,
            /Update sticky pull request report/
        );
        assert.match(
            featureWorkflow,
            /name: Executable feature contracts/
        );
        assert.match(
            featureWorkflow,
            /npm run test:features/
        );
        assert.match(
            featureWorkflow,
            /cache: npm/
        );
    }
);
