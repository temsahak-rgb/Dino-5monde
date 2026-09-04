import {
    readFile,
    writeFile
} from "node:fs/promises";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";

export {
    buildCorpusReport,
    extractCorpusCounts,
    extractCorpusDetails,
    extractCorpusLinkDebt,
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

interface CorpusCounts {
    tests: number | null;
    passed: number | null;
    failed: number | null;
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

/** Reads test totals from either the local or GitHub Actions TAP reporter. */
function extractCorpusCounts(
    output: string
): CorpusCounts {
    const clean = stripAnsi(output);

    const readCount = (
        label: "tests" | "pass" | "fail"
    ): number | null => {
        const match = clean.match(
            new RegExp(
                `(?:ℹ|#)\\s*${label}\\s+(\\d+)`,
                "m"
            )
        );

        return match
            ? Number.parseInt(
                match[1],
                10
            )
            : null;
    };

    return {
        tests: readCount("tests"),
        passed: readCount("pass"),
        failed: readCount("fail")
    };
}

/** Extracts the explicit known-link debt emitted by relational corpus tests. */
function extractCorpusLinkDebt(
    output: string
): string | null {
    const clean = stripAnsi(output).replace(
        /^#\s?/gm,
        ""
    );
    const match = clean.match(
        /^DINO_LINK_DEBT_BEGIN\r?\n([\s\S]*?)\r?\nDINO_LINK_DEBT_END$/m
    );

    return match?.[1]?.trim() || null;
}

/** Builds the sticky PR comment and GitHub Actions step summary. */
function buildCorpusReport(
    output: string,
    passed: boolean,
    runUrl?: string
): string {
    const result = passed
        ? "✅ Prêt à fusionner"
        : "❌ Corrections requises";

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

    const counts =
        extractCorpusCounts(output);
    const linkDebt =
        extractCorpusLinkDebt(output);

    const score =
        counts.tests !== null
        && counts.passed !== null
            ? `${counts.passed}/${counts.tests} réussis`
            : "Voir le journal";

    const lead = passed
        ? "🌿 **Tout est propre.** Les contenus pédagogiques sont cohérents et prêts à embarquer."
        : "🚨 **Quelques fossiles dépassent.** Le corpus a besoin d'une retouche avant fusion.";

    const action = passed
        ? linkDebt
            ? [
                "### 🎉 Feu vert",
                "",
                "Aucune nouvelle anomalie. La dette historique ci-dessous est figée : tout nouveau lien orphelin fera échouer la CI.",
                "",
                "### 🔗 Liens à créer",
                "",
                linkDebt
            ].join("\n")
            : "### 🎉 Feu vert\n\nAucune anomalie de structure ou de cohérence détectée."
        : `### 🧭 À corriger\n\n${counts.failed ?? "Des"} test(s) signalent les fichiers et champs à reprendre ci-dessous.`;

    return [
        reportMarker,
        "## 🦕 Vigie du corpus",
        "",
        `> ${lead}`,
        "",
        "| Contrôle | Statut | Score | Exécution |",
        "| --- | --- | ---: | --- |",
        `| \`npm run test:data\` | ${result} | **${score}** | ${execution} |`,
        "",
        action,
        "",
        "<details>",
        `<summary>${passed ? "🔎 Voir le journal de validation" : "🧩 Voir les erreurs par fichier et champ"}</summary>`,
        "",
        "```text",
        details || "Aucun détail disponible.",
        "```",
        "",
        "</details>",
        "",
        "_🤖 Ce commentaire est mis à jour automatiquement : une PR, un seul rapport, toujours à jour._",
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
