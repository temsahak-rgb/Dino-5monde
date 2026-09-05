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
    "deployment waits for quality, Cucumber and the successful E2E trigger",
    async () => {
        const workflow =
            await readFile(
                resolve(
                    root,
                    ".github/workflows/pages.yml"
                ),
                "utf8"
            );

        assert.match(
            workflow,
            /workflows:\s*\n\s*- Browser E2E/
        );
        assert.match(
            workflow,
            /github\.event\.workflow_run\.conclusion != 'success'/
        );
        assert.match(
            workflow,
            /requiredChecks = \[\s*'Quality report',\s*'Executable feature contracts'/
        );
        assert.match(
            workflow,
            /optionalChecks = \['Validate educational corpus'\]/
        );
        assert.doesNotMatch(
            workflow,
            /Dependency graph/
        );
        assert.doesNotMatch(
            workflow,
            /npm run test:features|cucumber-js/
        );
    }
);
