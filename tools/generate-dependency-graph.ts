/**
 * Generates the application dependency graph from explicit TypeScript imports.
 *
 * The output is deterministic and rendered natively by GitHub through Mermaid.
 * Both runtime and type-only dependencies are represented.
 */

import {
    access,
    mkdir,
    readFile,
    writeFile
} from "node:fs/promises";
import {
    dirname,
    relative,
    resolve
} from "node:path";
import ts from "typescript";

type DependencyKind =
    | "runtime"
    | "type";

interface Dependency {
    kind: DependencyKind;
    source: string;
    target: string;
}

interface GraphGroup {
    label: string;
    matches: (modulePath: string) => boolean;
}

const root = resolve(
    import.meta.dirname,
    ".."
);
const entryPath = resolve(
    root,
    "app.ts"
);
const outputPath = resolve(
    root,
    "docs",
    "dependency-graph.md"
);

const graphGroups: GraphGroup[] = [
    {
        label: "Bootstrap",
        matches: modulePath => modulePath === "app.ts"
    },
    {
        label: "Router",
        matches: modulePath => modulePath === "src/core/router.ts"
    },
    {
        label: "Navigation API",
        matches: modulePath => modulePath === "src/core/navigation.ts"
    },
    {
        label: "Core engines",
        matches: modulePath => modulePath.startsWith("src/core/")
    },
    {
        label: "Feature engines",
        matches: modulePath =>
            modulePath.startsWith("src/features/")
            && modulePath.endsWith("Engine.ts")
    },
    {
        label: "Feature controllers",
        matches: modulePath => modulePath.startsWith("src/features/")
    },
    {
        label: "Pages",
        matches: modulePath => modulePath.startsWith("src/pages/")
    },
    {
        label: "Views",
        matches: modulePath => modulePath.startsWith("src/ui/views/")
    },
    {
        label: "Shared UI",
        matches: modulePath => modulePath === "src/ui/ui.ts"
    },
    {
        label: "Internationalization",
        matches: modulePath => modulePath.startsWith("src/i18n/")
    },
    {
        label: "Types",
        matches: modulePath => modulePath.startsWith("src/types/")
    }
];

function repositoryPath(
    filePath: string
): string {
    return relative(
        root,
        filePath
    ).replace(
        /\\/g,
        "/"
    );
}

async function fileExists(
    filePath: string
): Promise<boolean> {
    try {
        await access(
            filePath
        );
        return true;
    } catch {
        return false;
    }
}

async function resolveLocalImport(
    sourcePath: string,
    specifier: string
): Promise<string | null> {
    if (
        !specifier.startsWith(".")
    ) {
        return null;
    }

    const absoluteSpecifier = resolve(
        dirname(sourcePath),
        specifier
    );
    const extensionlessPath = absoluteSpecifier.replace(
        /\.(?:js|mjs|cjs)$/,
        ""
    );
    const candidates = [
        `${extensionlessPath}.ts`,
        `${extensionlessPath}.d.ts`,
        resolve(
            extensionlessPath,
            "index.ts"
        )
    ];

    for (
        const candidate
        of candidates
    ) {
        if (
            await fileExists(
                candidate
            )
        ) {
            return candidate;
        }
    }

    throw new Error(
        `Unable to resolve ${specifier} imported by ${repositoryPath(sourcePath)}`
    );
}

function getDependencyKind(
    declaration: ts.ImportDeclaration
): DependencyKind {
    const clause =
        declaration.importClause;

    if (
        !clause
        || clause.isTypeOnly
    ) {
        return clause
            ? "type"
            : "runtime";
    }

    if (
        !clause.name
        && clause.namedBindings
        && ts.isNamedImports(
            clause.namedBindings
        )
        && clause.namedBindings.elements.length > 0
        && clause.namedBindings.elements.every(
            element => element.isTypeOnly
        )
    ) {
        return "type";
    }

    return "runtime";
}

async function collectGraph(): Promise<{
    dependencies: Dependency[];
    modules: string[];
}> {
    const visited =
        new Set<string>();
    const dependencies:
        Dependency[] = [];

    async function visit(
        sourcePath: string
    ): Promise<void> {
        if (
            visited.has(
                sourcePath
            )
        ) {
            return;
        }

        visited.add(
            sourcePath
        );

        const source =
            await readFile(
                sourcePath,
                "utf8"
            );
        const sourceFile =
            ts.createSourceFile(
                sourcePath,
                source,
                ts.ScriptTarget.ES2022,
                true,
                ts.ScriptKind.TS
            );

        for (
            const statement
            of sourceFile.statements
        ) {
            if (
                !ts.isImportDeclaration(
                    statement
                )
                || !ts.isStringLiteral(
                    statement.moduleSpecifier
                )
            ) {
                continue;
            }

            const targetPath =
                await resolveLocalImport(
                    sourcePath,
                    statement.moduleSpecifier.text
                );

            if (
                !targetPath
            ) {
                continue;
            }

            dependencies.push(
                {
                    kind:
                        getDependencyKind(
                            statement
                        ),
                    source:
                        repositoryPath(
                            sourcePath
                        ),
                    target:
                        repositoryPath(
                            targetPath
                        )
                }
            );

            await visit(
                targetPath
            );
        }
    }

    await visit(
        entryPath
    );

    return {
        dependencies:
            dependencies.sort(
                (left, right) =>
                    left.source.localeCompare(
                        right.source
                    )
                    || left.target.localeCompare(
                        right.target
                    )
                    || left.kind.localeCompare(
                        right.kind
                    )
            ),
        modules:
            [...visited]
                .map(
                    repositoryPath
                )
                .sort()
    };
}

function getModuleLabel(
    modulePath: string
): string {
    return modulePath
        .replace(
            /^src\/ui\/views\//,
            "views/"
        )
        .replace(
            /^src\//,
            ""
        )
        .replace(
            /(?:\.d)?\.ts$/,
            ""
        );
}

function getGraphGroupIndex(
    modulePath: string
): number {
    const groupIndex =
        graphGroups.findIndex(
            group =>
                group.matches(
                    modulePath
                )
        );

    if (
        groupIndex < 0
    ) {
        throw new Error(
            `No graph group configured for ${modulePath}`
        );
    }

    return groupIndex;
}

function findRuntimeCycles(
    modules: string[],
    dependencies: Dependency[]
): string[][] {
    const adjacency =
        new Map(
            modules.map(
                modulePath => [
                    modulePath,
                    [] as string[]
                ]
            )
        );

    for (
        const dependency
        of dependencies
    ) {
        if (
            dependency.kind === "runtime"
        ) {
            adjacency.get(
                dependency.source
            )?.push(
                dependency.target
            );
        }
    }

    let nextIndex = 0;
    const indices =
        new Map<string, number>();
    const lowLinks =
        new Map<string, number>();
    const stack:
        string[] = [];
    const onStack =
        new Set<string>();
    const cycles:
        string[][] = [];

    function visit(
        modulePath: string
    ): void {
        const currentIndex =
            nextIndex++;
        indices.set(
            modulePath,
            currentIndex
        );
        lowLinks.set(
            modulePath,
            currentIndex
        );
        stack.push(
            modulePath
        );
        onStack.add(
            modulePath
        );

        for (
            const target
            of adjacency.get(
                modulePath
            ) ?? []
        ) {
            if (
                !indices.has(
                    target
                )
            ) {
                visit(
                    target
                );
                lowLinks.set(
                    modulePath,
                    Math.min(
                        lowLinks.get(modulePath)!,
                        lowLinks.get(target)!
                    )
                );
            } else if (
                onStack.has(
                    target
                )
            ) {
                lowLinks.set(
                    modulePath,
                    Math.min(
                        lowLinks.get(modulePath)!,
                        indices.get(target)!
                    )
                );
            }
        }

        if (
            lowLinks.get(modulePath)
            !== indices.get(modulePath)
        ) {
            return;
        }

        const component:
            string[] = [];
        let member:
            string;

        do {
            member = stack.pop()!;
            onStack.delete(
                member
            );
            component.push(
                member
            );
        } while (
            member !== modulePath
        );

        if (
            component.length > 1
            || adjacency.get(modulePath)?.includes(modulePath)
        ) {
            cycles.push(
                component.sort()
            );
        }
    }

    for (
        const modulePath
        of modules
    ) {
        if (
            !indices.has(
                modulePath
            )
        ) {
            visit(
                modulePath
            );
        }
    }

    return cycles.sort(
        (left, right) =>
            left[0].localeCompare(
                right[0]
            )
    );
}

function renderArchitectureOverview(
    modules: string[],
    dependencies: Dependency[]
): string[] {
    const activeGroupIndexes =
        graphGroups
            .map(
                (_, index) => index
            )
            .filter(
                groupIndex =>
                    modules.some(
                        modulePath =>
                            getGraphGroupIndex(modulePath)
                            === groupIndex
                    )
            );
    const edgeCounts =
        new Map<string, number>();

    for (
        const dependency
        of dependencies
    ) {
        if (
            dependency.kind !== "runtime"
        ) {
            continue;
        }

        const sourceGroup =
            getGraphGroupIndex(
                dependency.source
            );
        const targetGroup =
            getGraphGroupIndex(
                dependency.target
            );

        if (
            sourceGroup === targetGroup
        ) {
            continue;
        }

        const key =
            `${sourceGroup}:${targetGroup}`;
        edgeCounts.set(
            key,
            (edgeCounts.get(key) ?? 0) + 1
        );
    }

    const lines = [
        "```mermaid",
        "flowchart LR"
    ];

    for (
        const groupIndex
        of activeGroupIndexes
    ) {
        lines.push(
            `    G${groupIndex}["${graphGroups[groupIndex].label}"]`
        );
    }

    for (
        const [key, count]
        of [...edgeCounts].sort()
    ) {
        const [sourceGroup, targetGroup] =
            key.split(":");
        lines.push(
            `    G${sourceGroup} -->|${count}| G${targetGroup}`
        );
    }

    lines.push(
        "```"
    );
    return lines;
}

function renderFocusedGraph(
    modules: string[],
    dependencies: Dependency[],
    matches: (modulePath: string) => boolean
): string[] {
    const focusModules =
        modules.filter(
            matches
        );
    const focusSet =
        new Set(
            focusModules
        );
    const edges =
        dependencies.filter(
            dependency =>
                dependency.kind === "runtime"
                && focusSet.has(
                    dependency.source
                )
        );
    const dependencyModules =
        [...new Set(
            edges
                .map(
                    dependency =>
                        dependency.target
                )
                .filter(
                    modulePath =>
                        !focusSet.has(
                            modulePath
                        )
                )
        )].sort();
    const graphModules = [
        ...focusModules,
        ...dependencyModules
    ];
    const nodeIds =
        new Map(
            graphModules.map(
                (modulePath, index) => [
                    modulePath,
                    `M${index}`
                ]
            )
        );
    const lines = [
        "```mermaid",
        "flowchart LR",
        "    subgraph S[\"Selected area\"]"
    ];

    for (
        const modulePath
        of focusModules
    ) {
        lines.push(
            `        ${nodeIds.get(modulePath)}["${getModuleLabel(modulePath)}"]`
        );
    }

    lines.push(
        "    end"
    );

    if (
        dependencyModules.length > 0
    ) {
        lines.push(
            "    subgraph D[\"Direct dependencies\"]"
        );

        for (
            const modulePath
            of dependencyModules
        ) {
            lines.push(
                `        ${nodeIds.get(modulePath)}["${getModuleLabel(modulePath)}"]`
            );
        }

        lines.push(
            "    end"
        );
    }

    for (
        const dependency
        of edges
    ) {
        lines.push(
            `    ${nodeIds.get(dependency.source)} --> ${nodeIds.get(dependency.target)}`
        );
    }

    lines.push(
        "```"
    );
    return lines;
}

function renderGraph(
    modules: string[],
    dependencies: Dependency[]
): string {
    const runtimeDependencies =
        dependencies.filter(
            dependency =>
                dependency.kind === "runtime"
        );
    const typeDependencyCount =
        dependencies.length
        - runtimeDependencies.length;
    const cycles =
        findRuntimeCycles(
            modules,
            dependencies
        );

    if (
        cycles.length > 0
    ) {
        throw new Error(
            [
                "Runtime dependency cycles detected:",
                ...cycles.map(
                    cycle =>
                        `- ${cycle.join(" -> ")}`
                )
            ].join(
                "\n"
            )
        );
    }

    const slices: Array<{
        label: string;
        matches: (modulePath: string) => boolean;
    }> = [
        {
            label: "Bootstrap and navigation",
            matches: modulePath =>
                modulePath === "app.ts"
                || modulePath === "src/core/navigation.ts"
                || modulePath === "src/core/router.ts"
        },
        ...[
            "exercises",
            "grammar",
            "news",
            "onboarding",
            "polls",
            "search",
            "travel",
            "vocabulary"
        ].map(
            feature => ({
                label:
                    feature[0].toUpperCase()
                    + feature.slice(1),
                matches: (modulePath: string) =>
                    modulePath.startsWith(
                        `src/features/${feature}/`
                    )
                    || modulePath.endsWith(
                        `/views/${feature}View.ts`
                    )
            })
        ),
        {
            label: "Pages and shared services",
            matches: modulePath =>
                modulePath.startsWith("src/pages/")
                || (
                    modulePath.startsWith("src/core/")
                    && modulePath !== "src/core/navigation.ts"
                    && modulePath !== "src/core/router.ts"
                )
                || modulePath === "src/ui/ui.ts"
                || modulePath === "src/ui/views/navbarView.ts"
                || modulePath.startsWith("src/i18n/")
        }
    ];
    const lines = [
        "<!-- This file is generated by npm run graph:dependencies. Do not edit manually. -->",
        "",
        "# Application dependency maps",
        "",
        `The application contains ${modules.length} reachable modules, ${runtimeDependencies.length} runtime imports and ${typeDependencyCount} type-only imports.`,
        "The generator rejects runtime dependency cycles.",
        "",
        "## Architecture overview",
        "",
        "Numbers on arrows are runtime import counts between layers. Imports inside one layer are collapsed.",
        "",
        ...renderArchitectureOverview(
            modules,
            dependencies
        ),
        "",
        "## Focused maps",
        "",
        "Open only the area you need. Each map shows outgoing runtime imports; type-only imports are intentionally omitted.",
        ""
    ];

    for (
        const slice
        of slices
    ) {
        lines.push(
            "<details>",
            `<summary>${slice.label}</summary>`,
            "",
            ...renderFocusedGraph(
                modules,
                dependencies,
                slice.matches
            ),
            "",
            "</details>",
            ""
        );
    }

    lines.push(
        "## Enforced invariants",
        "",
        "- No runtime dependency cycle.",
        `- ${typeDependencyCount} type-only imports are tracked but hidden from diagrams to avoid visual noise.`,
        "- Every module and edge is derived from the imports reachable from `app.ts`.",
        ""
    );

    return lines.join(
        "\n"
    );
}

async function main(): Promise<void> {
    const {
        dependencies,
        modules
    } =
        await collectGraph();
    const output =
        renderGraph(
            modules,
            dependencies
        );
    const checkOnly =
        process.argv.includes(
            "--check"
        );

    if (
        checkOnly
    ) {
        const currentOutput =
            await readFile(
                outputPath,
                "utf8"
            ).catch(
                () => ""
            );

        if (
            currentOutput !== output
        ) {
            console.error(
                "Dependency graph is out of date. Run npm run graph:dependencies."
            );
            process.exitCode = 1;
            return;
        }

        console.log(
            `Dependency graph is current: ${modules.length} modules, ${dependencies.length} dependencies.`
        );
        return;
    }

    await mkdir(
        dirname(
            outputPath
        ),
        {
            recursive: true
        }
    );
    await writeFile(
        outputPath,
        output,
        "utf8"
    );

    console.log(
        `Dependency graph generated: ${repositoryPath(outputPath)} (${modules.length} modules, ${dependencies.length} dependencies).`
    );
}

await main();
