import assert from "node:assert/strict";
import test from "node:test";

import {
    buildProjectVigieReport,
    normalizeCheckState,
    progressBar,
    readFeatureMeasurement,
    type ProjectVigieInput
} from "../../tools/build-project-vigie.js";
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

function createInput():
    ProjectVigieInput {
    return {
        sha: "1234567890abcdef",
        updatedAt:
            "2026-09-05T12:00:00.000Z",
        data: {
            required: false,
            check: {
                label:
                    "Corpus pédagogique",
                state:
                    "not_required",
                policy:
                    "blocking"
            }
        },
        technical: [
            {
                label:
                    "Qualité applicative",
                state:
                    "success",
                policy:
                    "blocking"
            },
            {
                label:
                    "Playwright E2E",
                state:
                    "success",
                policy:
                    "blocking",
                url:
                    "https://example.test/e2e"
            },
            {
                label:
                    "Knip + jscpd",
                state:
                    "reported",
                policy:
                    "informative"
            }
        ],
        feature: {
            check: {
                label:
                    "Contrats Cucumber",
                state:
                    "success",
                policy:
                    "blocking",
                url:
                    "https://example.test/features"
            },
            implemented: 9,
            planned: 5,
            invalid: 0,
            total: 14
        }
    };
}

test(
    "project Vigie renders one sticky comment with three collapsible panels",
    () => {
        const report =
            buildProjectVigieReport(
                createInput()
            );

        assert.match(
            report,
            /<!-- dino-project-vigie -->/
        );
        assert.equal(
            report.match(
                /<details/g
            )?.length,
            3
        );
        assert.match(
            report,
            /Vigie Data/
        );
        assert.match(
            report,
            /Vigie Technique/
        );
        assert.match(
            report,
            /Vigie Features/
        );
        assert.match(
            report,
            /🟩🟩🟩🟩🟩🟩🟩🟩🟩🟩 \*\*100%\*\*/
        );
        assert.match(
            report,
            /Aucun changement Data/
        );
        assert.match(
            report,
            /9 livrés · 5 planifiés/
        );
        assert.match(
            report,
            /Cucumber vérifie les contrats métier/
        );
        assert.match(
            report,
            /\[🟢 OK\]\(https:\/\/example\.test\/features\)/
        );
        assert.match(
            report,
            /`12345678`/
        );
    }
);

test(
    "project Vigie opens failing panels and keeps check links actionable",
    () => {
        const input =
            createInput();

        input.data = {
            required: true,
            check: {
                label:
                    "Corpus pédagogique",
                state:
                    "failure",
                policy:
                    "blocking",
                url:
                    "https://example.test/corpus"
            }
        };
        input.technical[0] = {
            label:
                "Qualité applicative",
            state:
                "failure",
            policy:
                "blocking",
            url:
                "https://example.test/quality"
        };
        input.feature.check.state =
            "failure";
        input.feature.invalid =
            1;

        const report =
            buildProjectVigieReport(
                input
            );

        assert.match(
            report,
            /Un voyant rouge est allumé/
        );
        assert.match(
            report,
            /<details open>\n<summary><strong>🧬 Vigie Data/
        );
        assert.match(
            report,
            /<details open>\n<summary><strong>⚙️ Vigie Technique/
        );
        assert.match(
            report,
            /<details open>\n<summary><strong>🥒 Vigie Features/
        );
        assert.match(
            report,
            /\[🔴 À corriger\]\(https:\/\/example\.test\/corpus\)/
        );
        assert.match(
            report,
            /1\/2 portes bloquantes validées/
        );
        assert.match(
            report,
            /🔴 Contrats invalides \| 1/
        );
    }
);

test(
    "Vigie status normalization distinguishes gates and waits",
    () => {
        assert.equal(
            normalizeCheckState(
                "success"
            ),
            "success"
        );
        assert.equal(
            normalizeCheckState(
                "timed_out"
            ),
            "failure"
        );
        assert.equal(
            normalizeCheckState(
                "queued"
            ),
            "in_progress"
        );
        assert.equal(
            normalizeCheckState(
                "unknown"
            ),
            "missing"
        );
        assert.equal(
            progressBar(
                1,
                2
            ),
            "🟩🟩🟩🟩🟩⬜⬜⬜⬜⬜ **50%**"
        );
    }
);

test(
    "Vigie reads measured feature counts without executing feature code",
    async () => {
        const measurement =
            await readFeatureMeasurement(
                resolve(
                    currentDirectory,
                    "../fixtures/features/progress.json"
                )
            );

        assert.deepEqual(
            measurement,
            {
                implemented: 2,
                planned: 1,
                invalid: 2,
                total: 4
            }
        );
    }
);
