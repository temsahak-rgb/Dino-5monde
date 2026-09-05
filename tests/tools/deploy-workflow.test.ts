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
    "deployment waits for quality, backend, Cucumber and the successful E2E trigger",
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
            /requiredChecks = \[\s*'Quality report',\s*'Backend schema',\s*'Executable feature contracts'/
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

test(
    "backend CI rebuilds migrations only when backend inputs change",
    async () => {
        const workflow =
            await readFile(
                resolve(
                    root,
                    ".github/workflows/quality.yml"
                ),
                "utf8"
            );

        assert.match(
            workflow,
            /name: Backend schema/
        );
        assert.match(
            workflow,
            /git diff --quiet[\s\S]*supabase\//
        );
        assert.match(
            workflow,
            /supabase start[\s\S]*backend:reset[\s\S]*supabase db lint[\s\S]*backend:test/
        );
        assert.match(
            workflow,
            /if: always\(\)[\s\S]*backend:stop/
        );
    }
);
