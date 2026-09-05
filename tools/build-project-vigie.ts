import {
    readFile,
    writeFile
} from "node:fs/promises";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";

type CheckState =
    | "success"
    | "failure"
    | "cancelled"
    | "skipped"
    | "not_required"
    | "in_progress"
    | "missing"
    | "reported";

interface VigieCheck {
    label: string;
    state: CheckState;
    policy: "blocking" | "informative";
    url?: string;
}

interface ProjectVigieInput {
    sha?: string;
    updatedAt: string;
    data: {
        required: boolean;
        check: VigieCheck;
    };
    technical: VigieCheck[];
    feature: {
        check: VigieCheck;
        implemented: number;
        planned: number;
        invalid: number;
        total: number;
    };
}

const reportMarker =
    "<!-- dino-project-vigie -->";

function normalizeCheckState(
    value: string | undefined
): CheckState {
    switch (value) {
        case "success":
        case "failure":
        case "cancelled":
        case "skipped":
        case "in_progress":
        case "not_required":
        case "reported":
            return value;
        case "neutral":
            return "success";
        case "timed_out":
        case "action_required":
        case "startup_failure":
            return "failure";
        case "queued":
        case "pending":
        case "waiting":
        case "requested":
            return "in_progress";
        default:
            return "missing";
    }
}

function stateLabel(
    state: CheckState
): string {
    switch (state) {
        case "success":
            return "🟢 OK";
        case "failure":
            return "🔴 À corriger";
        case "cancelled":
            return "⚫ Annulé";
        case "skipped":
            return "⚪ Ignoré";
        case "not_required":
            return "⚪ Non sollicitée";
        case "in_progress":
            return "🟡 En cours";
        case "missing":
            return "🟡 En attente";
        case "reported":
            return "🔎 Voir le rapport";
    }
}

function statusLink(
    check: VigieCheck
): string {
    const label =
        stateLabel(
            check.state
        );

    return check.url
        ? `[${label}](${check.url})`
        : label;
}

function progressBar(
    completed: number,
    total: number
): string {
    if (total <= 0) {
        return "—";
    }

    const safeCompleted =
        Math.min(
            Math.max(
                completed,
                0
            ),
            total
        );

    const percentage =
        Math.round(
            safeCompleted
            / total
            * 100
        );

    const filled =
        Math.round(
            percentage
            / 10
        );

    return `${"🟩".repeat(filled)}${"⬜".repeat(10 - filled)} **${percentage}%**`;
}

function worstBlockingState(
    checks: VigieCheck[]
): CheckState {
    const blocking =
        checks.filter(
            check =>
                check.policy
                === "blocking"
        );

    if (
        blocking.some(
            check =>
                check.state
                === "failure"
        )
    ) {
        return "failure";
    }

    if (
        blocking.some(
            check => [
                "in_progress",
                "missing",
                "cancelled"
            ].includes(
                check.state
            )
        )
    ) {
        return "in_progress";
    }

    return "success";
}

function blockingProgress(
    checks: VigieCheck[]
): {
    completed: number;
    total: number;
} {
    const blocking =
        checks.filter(
            check =>
                check.policy
                === "blocking"
        );

    return {
        completed:
            blocking.filter(
                check =>
                    check.state
                    === "success"
            ).length,
        total:
            blocking.length
    };
}

function checkTable(
    checks: VigieCheck[]
): string {
    return [
        "| Contrôle | Politique | Voyant |",
        "| --- | --- | --- |",
        ...checks.map(
            check =>
                `| ${check.label} | ${check.policy === "blocking" ? "Bloquant" : "Informatif"} | ${statusLink(check)} |`
        )
    ].join("\n");
}

function buildProjectVigieReport(
    input: ProjectVigieInput
): string {
    const dataChecks = [
        input.data.check
    ];

    const technicalState =
        worstBlockingState(
            input.technical
        );

    const dataState =
        input.data.required
            ? worstBlockingState(
                dataChecks
            )
            : "not_required";

    const featureState =
        worstBlockingState([
            input.feature.check
        ]);

    const requiredChecks = [
        ...input.technical,
        input.feature.check,
        ...(
            input.data.required
                ? dataChecks
                : []
        )
    ];

    const overallState =
        worstBlockingState(
            requiredChecks
        );

    const technicalProgress =
        blockingProgress(
            input.technical
        );

    const dataProgress =
        input.data.required
            ? progressBar(
                input.data.check.state
                    === "success"
                    ? 1
                    : 0,
                1
            )
            : "— Aucun changement Data";

    const featureProgress =
        progressBar(
            input.feature.implemented,
            input.feature.total
        );

    const overallLead =
        overallState === "success"
            ? "🌿 **La piste est libre.** Tous les contrôles bloquants sont au vert."
            : overallState === "failure"
                ? "🚨 **Un voyant rouge est allumé.** Ouvre le panneau concerné avant de fusionner."
                : "🦕 **La vigie observe encore la piste.** Certains contrôles ne sont pas terminés.";

    const revision =
        input.sha
            ? `\`${input.sha.slice(0, 8)}\``
            : "révision courante";

    return [
        reportMarker,
        "## 🦕 Vigie de la PR",
        "",
        `> ${overallLead}`,
        "",
        "| Espace | Voyant | Progression | Lecture rapide |",
        "| --- | --- | --- | --- |",
        `| 🧬 **Data** | ${stateLabel(dataState)} | ${dataProgress} | ${input.data.required ? "Corpus contrôlé" : "Hors périmètre de cette PR"} |`,
        `| ⚙️ **Technique** | ${stateLabel(technicalState)} | ${progressBar(technicalProgress.completed, technicalProgress.total)} | ${technicalProgress.completed}/${technicalProgress.total} portes bloquantes validées |`,
        `| 🥒 **Features** | ${stateLabel(featureState)} | ${featureProgress} | ${input.feature.implemented} livrés · ${input.feature.planned} planifiés |`,
        "",
        `<details${input.data.required ? " open" : ""}>`,
        '<summary><strong>🧬 Vigie Data</strong> — cohérence du corpus et des liens</summary>',
        "",
        input.data.required
            ? checkTable(dataChecks)
            : "⚪ Aucun fichier de données, test de corpus ou contrat de route n’a changé : cette vigie n’a pas consommé de job CI.",
        "",
        input.data.required
            ? "Les erreurs détaillées par fichier et champ restent disponibles dans le résumé et l’artefact **Corpus quality**."
            : "Le contrôle sera automatiquement requis dès qu’un fichier entrant dans le périmètre Data sera modifié.",
        "",
        "</details>",
        "",
        `<details${technicalState === "failure" ? " open" : ""}>`,
        '<summary><strong>⚙️ Vigie Technique</strong> — qualité, compilation et navigateur</summary>',
        "",
        checkTable(
            input.technical
        ),
        "",
        "Le rapport **Code quality** détaille les tests, TypeScript, le build, Knip et jscpd. La Vigie réutilise son résultat sans les rejouer.",
        "",
        "</details>",
        "",
        `<details${featureState === "failure" ? " open" : ""}>`,
        '<summary><strong>🥒 Vigie Features</strong> — avancement fonctionnel exécutable</summary>',
        "",
        `**Progression actuelle :** ${featureProgress}`,
        "",
        checkTable([
            input.feature.check
        ]),
        "",
        "| Cycle de vie | Scénarios | Lecture |",
        "| --- | ---: | --- |",
        `| ✅ \`@implemented\` | ${input.feature.implemented} | Exécutés et bloquants |`,
        `| 🟣 \`@planned\` | ${input.feature.planned} | Visibles, non exécutés |`,
        `| ${input.feature.invalid === 0 ? "🟢" : "🔴"} Contrats invalides | ${input.feature.invalid} | Chaque scénario doit avoir un seul état |`,
        "",
        "Cucumber vérifie les contrats métier. Playwright reste seul responsable des parcours dans le navigateur.",
        "",
        "</details>",
        "",
        "---",
        "",
        `_🤖 Mise à jour automatique pour ${revision}, le ${input.updatedAt}. Un seul commentaire, trois angles de lecture._`,
        ""
    ].join("\n");
}

function readOption(
    args: string[],
    name: string
): string {
    const index =
        args.indexOf(
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

function checkFromEnvironment(
    label: string,
    state: string | undefined,
    policy: VigieCheck["policy"],
    url?: string
): VigieCheck {
    return {
        label,
        state:
            normalizeCheckState(
                state
            ),
        policy,
        url:
            url
            || undefined
    };
}

function projectVigieFromEnvironment(
    measuredFeature?: Pick<
        ProjectVigieInput["feature"],
        "implemented" | "planned" | "invalid" | "total"
    >
):
    ProjectVigieInput {
    const corpusRequired =
        process.env.VIGIE_CORPUS_REQUIRED
        === "true";

    const qualityUrl =
        process.env.VIGIE_QUALITY_URL;

    return {
        sha:
            process.env.VIGIE_SHA,
        updatedAt:
            process.env.VIGIE_UPDATED_AT
            ?? new Date().toISOString(),
        data: {
            required:
                corpusRequired,
            check: {
                label:
                    "Corpus pédagogique",
                state:
                    corpusRequired
                        ? normalizeCheckState(
                            process.env.VIGIE_CORPUS_STATE
                        )
                        : "not_required",
                policy:
                    "blocking",
                url:
                    process.env.VIGIE_CORPUS_URL
                    || undefined
            }
        },
        technical: [
            checkFromEnvironment(
                "Qualité applicative",
                process.env.VIGIE_QUALITY_STATE,
                "blocking",
                qualityUrl
            ),
            checkFromEnvironment(
                "Playwright E2E",
                process.env.VIGIE_E2E_STATE,
                "blocking",
                process.env.VIGIE_E2E_URL
            ),
            {
                label:
                    "Knip + jscpd",
                state:
                    "reported",
                policy:
                    "informative",
                url:
                    qualityUrl
            }
        ],
        feature: {
            check:
                checkFromEnvironment(
                    "Contrats Cucumber",
                    process.env.VIGIE_FEATURE_STATE,
                    "blocking",
                    process.env.VIGIE_FEATURE_URL
                ),
            implemented:
                measuredFeature?.implemented
                ?? environmentCount(
                    "VIGIE_FEATURE_IMPLEMENTED"
                ),
            planned:
                measuredFeature?.planned
                ?? environmentCount(
                    "VIGIE_FEATURE_PLANNED"
                ),
            invalid:
                measuredFeature?.invalid
                ?? environmentCount(
                    "VIGIE_FEATURE_INVALID"
                ),
            total:
                measuredFeature?.total
                ?? environmentCount(
                    "VIGIE_FEATURE_TOTAL"
                )
        }
    };
}

function environmentCount(
    name: string
): number {
    const value =
        Number(
            process.env[name]
            ?? 0
        );

    return Number.isSafeInteger(value)
        && value >= 0
        ? value
        : 0;
}

async function readFeatureMeasurement(
    path: string | undefined
): Promise<Pick<
    ProjectVigieInput["feature"],
    "implemented" | "planned" | "invalid" | "total"
> | undefined> {
    if (!path) {
        return undefined;
    }

    const parsed = JSON.parse(
        await readFile(
            resolve(path),
            "utf8"
        )
    ) as Record<string, unknown>;

    const implemented =
        measuredCount(
            parsed,
            "implemented",
            true
        );

    const planned =
        measuredCount(
            parsed,
            "planned",
            true
        );

    return {
        implemented,
        planned,
        invalid:
            measuredCount(
                parsed,
                "invalid",
                true
            )
            + measuredCount(
                parsed,
                "errors",
                true
            ),
        total:
            measuredCount(
                parsed,
                "total"
            )
    };
}

function measuredCount(
    value: Record<string, unknown>,
    name: string,
    array = false
): number {
    const candidate =
        value[name];

    if (
        array
        && Array.isArray(candidate)
    ) {
        return candidate.length;
    }

    if (
        typeof candidate === "number"
        && Number.isSafeInteger(candidate)
        && candidate >= 0
    ) {
        return candidate;
    }

    throw new TypeError(
        `Invalid feature report field: ${name}`
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

    const featureReport =
        await readFeatureMeasurement(
            optionalOption(
                args,
                "--feature-report"
            )
        );

    await writeFile(
        resolve(output),
        buildProjectVigieReport(
            projectVigieFromEnvironment(
                featureReport
            )
        ),
        "utf8"
    );
}

function optionalOption(
    args: string[],
    name: string
): string | undefined {
    const index =
        args.lastIndexOf(name);

    return index >= 0
        ? args[index + 1]
        : undefined;
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
    buildProjectVigieReport,
    environmentCount,
    normalizeCheckState,
    progressBar,
    projectVigieFromEnvironment,
    readFeatureMeasurement
};

export type {
    CheckState,
    ProjectVigieInput,
    VigieCheck
};
