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
            /workflow_run:/
        );
        assert.match(
            workflow,
            /workflows:\s*\n\s*- Browser E2E/
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
    }
);

test(
    "ordinary pull request checks retain read-only permissions",
    async () => {
        const [
            qualityWorkflow,
            corpusWorkflow
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
            )
        ]);

        for (
            const workflow
            of [
                qualityWorkflow,
                corpusWorkflow
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
    }
);
