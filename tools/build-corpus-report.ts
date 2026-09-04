import {
    readFile,
    writeFile
} from "node:fs/promises";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";

export {
    buildCorpusReport,
    extractCorpusDetails,
    stripAnsi
};

const reportMarker =
    "<!-- dino-corpus-quality-report -->";

const defaultMaxDetailsLength =
    50_000;

interface CliOptions {
    input: string;
    output: string;
    passed: boolean;
}

/** Removes terminal color sequences before text is embedded in Markdown. */
function stripAnsi(
    value: string
): string {
    return value.replace(
        /\u001B\[[0-9;]*m/g,
        ""
    );
}

/**
 * Keeps the actionable failure section emitted by Node's test reporter.
 * That section includes repository paths and assertion field contexts.
 */
function extractCorpusDetails(
    output: string,
    passed: boolean,
    maxLength = defaultMaxDetailsLength
): string {
    const clean = stripAnsi(
        output
    );

    const failureIndex =
        clean.indexOf(
            "✖ failing tests:"
        );

    const details =
        !passed
        && failureIndex >= 0
            ? clean.slice(
                failureIndex
            )
            : clean;

    if (
        details.length
        <= maxLength
    ) {
        return details.trim();
    }

    return `${details.slice(0, maxLength).trim()}\n\n… report truncated; download the artifact for the complete output.`;
}

/** Builds the sticky PR comment and GitHub Actions step summary. */
function buildCorpusReport(
    output: string,
    passed: boolean,
    runUrl?: string
): string {
    const result = passed
        ? "✅ Corpus valide"
        : "❌ Corpus invalide";

    const execution = runUrl
        ? `[GitHub Actions](${runUrl})`
        : "Exécution locale";

    const details =
        extractCorpusDetails(
            output,
            passed
        ).replace(
            /```/g,
            "``​`"
        );

    return [
        reportMarker,
        "## Rapport qualité du corpus",
        "",
        "| Commande | Résultat | Exécution |",
        "| --- | --- | --- |",
        `| \`npm run test:data\` | ${result} | ${execution} |`,
        "",
        "Les erreurs ci-dessous identifient le fichier et le champ concernés.",
        "",
        "<details>",
        `<summary>${passed ? "Détails de la validation" : "Erreurs du corpus"}</summary>`,
        "",
        "```text",
        details || "Aucun détail disponible.",
        "```",
        "",
        "</details>",
        ""
    ].join(
        "\n"
    );
}

function readOption(
    args: string[],
    name: string
): string {
    const index = args.indexOf(
        name
    );

    const value =
        index >= 0
            ? args[index + 1]
            : undefined;

    if (!value) {
        throw new Error(
            `Missing required option ${name}`
        );
    }

    return value;
}

function parseCliOptions(
    args: string[]
): CliOptions {
    return {
        input: readOption(
            args,
            "--input"
        ),
        output: readOption(
            args,
            "--output"
        ),
        passed: readOption(
            args,
            "--status"
        ) === "0"
    };
}

async function main(): Promise<void> {
    const options =
        parseCliOptions(
            process.argv.slice(2)
        );

    const output = await readFile(
        resolve(options.input),
        "utf8"
    );

    const serverUrl =
        process.env.GITHUB_SERVER_URL;

    const repository =
        process.env.GITHUB_REPOSITORY;

    const runId =
        process.env.GITHUB_RUN_ID;

    const runUrl =
        serverUrl
        && repository
        && runId
            ? `${serverUrl}/${repository}/actions/runs/${runId}`
            : undefined;

    await writeFile(
        resolve(options.output),
        buildCorpusReport(
            output,
            options.passed,
            runUrl
        ),
        "utf8"
    );
}

const entryPoint = process.argv[1];

if (
    entryPoint
    && import.meta.url
        === pathToFileURL(
            resolve(entryPoint)
        ).href
) {
    await main();
}
