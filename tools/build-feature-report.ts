import {
    mkdir,
    writeFile
} from "node:fs/promises";
import {
    dirname,
    resolve
} from "node:path";
import {
    pathToFileURL
} from "node:url";

import {
    loadSources
} from "@cucumber/cucumber/api";
import type {
    IPlannedPickle,
    ISourcesCoordinates,
    ISourcesError
} from "@cucumber/cucumber/api";

interface FeatureScenario {
    name: string;
    uri: string;
    line: number;
}

interface FeatureProgress {
    implemented: FeatureScenario[];
    planned: FeatureScenario[];
    invalid: FeatureScenario[];
    errors: string[];
    completed: number;
    total: number;
    percentage: number;
}

const defaultFeaturePaths = [
    "features/**/*.feature"
];

async function inspectFeatureProgress(
    paths: string[] = defaultFeaturePaths
): Promise<FeatureProgress> {
    const base = {
        defaultDialect: "en",
        paths,
        names: [],
        order: "defined"
    } satisfies Omit<
        ISourcesCoordinates,
        "tagExpression"
    >;

    const [
        all,
        implemented,
        planned,
        conflicting,
        unclassified
    ] = await Promise.all([
        loadSources({
            ...base,
            tagExpression: ""
        }),
        loadSources({
            ...base,
            tagExpression:
                "@implemented and not @planned"
        }),
        loadSources({
            ...base,
            tagExpression:
                "@planned and not @implemented"
        }),
        loadSources({
            ...base,
            tagExpression:
                "@implemented and @planned"
        }),
        loadSources({
            ...base,
            tagExpression:
                "not @implemented and not @planned"
        })
    ]);

    const invalid = [
        ...conflicting.plan,
        ...unclassified.plan
    ].map(toFeatureScenario);

    const completed =
        implemented.plan.length;

    const total =
        all.plan.length;

    return {
        implemented:
            implemented.plan.map(
                toFeatureScenario
            ),
        planned:
            planned.plan.map(
                toFeatureScenario
            ),
        invalid,
        errors:
            uniqueErrors(
                all.errors
            ),
        completed,
        total,
        percentage:
            total === 0
                ? 0
                : Math.round(
                    completed
                    / total
                    * 100
                )
    };
}

function assertFeaturePolicy(
    progress: FeatureProgress
): void {
    const failures: string[] = [];

    if (progress.total === 0) {
        failures.push(
            "No Cucumber scenarios were found."
        );
    }

    failures.push(
        ...progress.errors
    );

    if (progress.invalid.length > 0) {
        failures.push(
            ...progress.invalid.map(
                scenario =>
                    `${scenario.uri}:${scenario.line} — ${scenario.name} must inherit exactly one of @implemented or @planned.`
            )
        );
    }

    if (failures.length > 0) {
        throw new Error(
            [
                "Feature contract policy failed:",
                ...failures.map(
                    failure =>
                        `- ${failure}`
                )
            ].join("\n")
        );
    }
}

function buildFeatureMarkdown(
    progress: FeatureProgress
): string {
    const invalidLabel =
        progress.invalid.length === 0
            && progress.errors.length === 0
            ? "🟢 0"
            : `🔴 ${progress.invalid.length + progress.errors.length}`;

    return [
        "# 🥒 Feature contract report",
        "",
        `**Progress:** ${progressBar(progress.completed, progress.total)} **${progress.percentage}%** (${progress.completed}/${progress.total} executable scenarios)`,
        "",
        "| Contract state | Scenarios | CI policy |",
        "| --- | ---: | --- |",
        `| ✅ Implemented | ${progress.implemented.length} | Executed and blocking |`,
        `| 🟣 Planned | ${progress.planned.length} | Counted, not executed |`,
        `| Contract errors | ${invalidLabel} | Blocking |`,
        "",
        "Every scenario must inherit exactly one lifecycle tag: `@implemented` or `@planned`.",
        "Playwright remains responsible for browser behavior; these scenarios exercise product contracts.",
        ""
    ].join("\n");
}

function progressBar(
    completed: number,
    total: number
): string {
    if (total <= 0) {
        return "⬜⬜⬜⬜⬜⬜⬜⬜⬜⬜";
    }

    const filled =
        Math.round(
            completed
            / total
            * 10
        );

    return `${"🟩".repeat(filled)}${"⬜".repeat(10 - filled)}`;
}

function toFeatureScenario(
    pickle: IPlannedPickle
): FeatureScenario {
    return {
        name: pickle.name,
        uri: pickle.uri,
        line: pickle.location.line
    };
}

function uniqueErrors(
    errors: ISourcesError[]
): string[] {
    return [
        ...new Set(
            errors.map(
                error =>
                    `${error.uri}:${error.location.line} — ${error.message}`
            )
        )
    ];
}

function readOption(
    args: string[],
    name: string
): string | undefined {
    const index =
        args.lastIndexOf(name);

    return index >= 0
        ? args[index + 1]
        : undefined;
}

async function writeReport(
    output: string,
    content: string
): Promise<void> {
    const path =
        resolve(output);

    await mkdir(
        dirname(path),
        { recursive: true }
    );

    await writeFile(
        path,
        content,
        "utf8"
    );
}

async function main(): Promise<void> {
    const args =
        process.argv.slice(2);

    const output =
        readOption(
            args,
            "--output"
        );

    const markdown =
        readOption(
            args,
            "--markdown"
        );

    const features =
        readOption(
            args,
            "--features"
        );

    if (!output) {
        throw new Error(
            "Missing required option --output"
        );
    }

    const progress =
        await inspectFeatureProgress(
            features
                ? [features]
                : defaultFeaturePaths
        );

    await writeReport(
        output,
        `${JSON.stringify(progress, null, 2)}\n`
    );

    if (markdown) {
        await writeReport(
            markdown,
            buildFeatureMarkdown(
                progress
            )
        );
    }

    if (!args.includes("--allow-invalid")) {
        assertFeaturePolicy(
            progress
        );
    }
}

const entryPoint =
    process.argv[1];

if (
    entryPoint
    && import.meta.url
        === pathToFileURL(
            resolve(entryPoint)
        ).href
) {
    await main();
}

export {
    assertFeaturePolicy,
    buildFeatureMarkdown,
    inspectFeatureProgress
};

export type {
    FeatureProgress,
    FeatureScenario
};
