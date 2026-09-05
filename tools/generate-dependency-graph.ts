/**
 * Generates the application dependency graph from explicit local imports.
 *
 * The output is deterministic and rendered natively by GitHub through Mermaid.
 * Both runtime and type-only dependencies are represented.
 */

import {
    mkdir,
    readFile,
    stat,
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
    "src",
    "main.tsx"
);
const outputPath = resolve(
    root,
    "docs",
    "dependency-graph.md"
);

const graphGroups: GraphGroup[] = [
    {
        label: "Entry point",
        matches: modulePath => modulePath === "src/main.tsx"
    },
    {
        label: "App",
        matches: modulePath => modulePath === "src/app/App.tsx"
    },
    {
        label: "Backend boundary (React + Supabase)",
        matches: modulePath => modulePath.startsWith("src/services/backend/")
    },
    {
        label: "React router and routes",
        matches: modulePath =>
            modulePath === "src/app/AppRouter.tsx"
            || modulePath === "src/app/routes.ts"
    },
    {
        label: "App layout",
        matches: modulePath => modulePath === "src/app/AppLayout.tsx"
    },
    {
        label: "Route pages",
        matches: modulePath => modulePath.startsWith("src/pages/")
    },
    {
        label: "Shared React components",
        matches: modulePath => modulePath.startsWith("src/ui/components/")
    },
    {
        label: "Feature React components",
        matches: modulePath =>
            modulePath.startsWith("src/features/")
            && modulePath.endsWith(".tsx")
    },
    {
        label: "Feature engines and modules",
        matches: modulePath => modulePath.startsWith("src/features/")
    },
    {
        label: "Core engines and modules",
        matches: modulePath => modulePath.startsWith("src/core/")
    },
    {
        label: "Internationalization",
        matches: modulePath => modulePath.startsWith("src/i18n/")
    },
    {
        label: "Types",
        matches: modulePath => modulePath.startsWith("src/types/")
    },
    {
        label: "Styles",
        matches: modulePath => modulePath.startsWith("src/styles/")
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

/** Makes generated-text comparisons independent from Git's checkout EOLs. */
function normalizeLineEndings(
    value: string
): string {
    return value.replace(
        /\r\n/g,
        "\n"
    );
}

async function fileExists(
    filePath: string
): Promise<boolean> {
    try {
        const fileStat =
            await stat(
                filePath
            );
        return fileStat.isFile();
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
        absoluteSpecifier,
        `${extensionlessPath}.ts`,
        `${extensionlessPath}.tsx`,
        `${extensionlessPath}.d.ts`,
        resolve(
            extensionlessPath,
            "index.ts"
        ),
        resolve(
            extensionlessPath,
            "index.tsx"
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

        if (
            sourcePath.endsWith(
                ".css"
            )
        ) {
            return;
        }

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
                sourcePath.endsWith(".tsx")
                    ? ts.ScriptKind.TSX
                    : ts.ScriptKind.TS
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
            /^src\/ui\/components\//,
            "components/"
        )
        .replace(
            /^src\//,
            ""
        )
        .replace(
            /(?:\.d)?\.tsx?$/,
            ""
        )
        .replace(
            /\.css$/,
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

    const connectedGroupIndexes =
        new Set<number>();

    for (
        const key
        of edgeCounts.keys()
    ) {
        const [
            sourceGroup,
            targetGroup
        ] = key
            .split(":")
            .map(Number);

        connectedGroupIndexes.add(
            sourceGroup
        );
        connectedGroupIndexes.add(
            targetGroup
        );
    }

    const sections = [
        {
            id: "R",
            label: "React application tree",
            groupIndexes: [
                0,
                1,
                2,
                3,
                4,
                5,
                6,
                7
            ]
        },
        {
            id: "L",
            label: "Engines and source modules",
            groupIndexes: [
                8,
                9
            ]
        },
        {
            id: "C",
            label: "Cross-cutting modules",
            groupIndexes: [
                10,
                12
            ]
        }
    ];

    const lines = [
        "```mermaid",
        "%%{init: {\"flowchart\": {\"curve\": \"stepAfter\", \"nodeSpacing\": 28, \"rankSpacing\": 48}}}%%",
        "flowchart TB"
    ];

    for (
        const section
        of sections
    ) {
        const activeGroupIndexes =
            section.groupIndexes.filter(
                groupIndex =>
                    connectedGroupIndexes.has(
                        groupIndex
                    )
                    && modules.some(
                        modulePath =>
                            getGraphGroupIndex(modulePath)
                            === groupIndex
                    )
            );

        if (
            activeGroupIndexes.length === 0
        ) {
            continue;
        }

        lines.push(
            `    subgraph ${section.id}["${section.label}"]`,
            "        direction TB"
        );

        for (
            const groupIndex
            of activeGroupIndexes
        ) {
            lines.push(
                `        G${groupIndex}["${graphGroups[groupIndex].label}"]`
            );
        }

        lines.push(
            "    end"
        );
    }

    for (
        const [
            key,
            count
        ]
        of [...edgeCounts].sort(
            (
                [left],
                [right]
            ) => left.localeCompare(
                right,
                undefined,
                {
                    numeric: true
                }
            )
        )
    ) {
        const [sourceGroup, targetGroup] =
            key.split(":");
        lines.push(
            count > 1
                ? `    G${sourceGroup} -->|${count} imports| G${targetGroup}`
                : `    G${sourceGroup} --> G${targetGroup}`
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
    ].sort(
        (left, right) =>
            getGraphGroupIndex(left)
            - getGraphGroupIndex(right)
            || left.localeCompare(
                right
            )
    );
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
        "%%{init: {\"flowchart\": {\"curve\": \"stepAfter\", \"nodeSpacing\": 24, \"rankSpacing\": 42}}}%%",
        "flowchart TB",
        "    classDef focus stroke-width:2px"
    ];

    for (
        let groupIndex = 0;
        groupIndex < graphGroups.length;
        groupIndex++
    ) {
        const groupModules =
            graphModules.filter(
                modulePath =>
                    getGraphGroupIndex(modulePath)
                    === groupIndex
            );

        if (
            groupModules.length === 0
        ) {
            continue;
        }

        lines.push(
            `    subgraph S${groupIndex}["${graphGroups[groupIndex].label}"]`,
            "        direction TB"
        );

        for (
            const modulePath
            of groupModules
        ) {
            const focusClass =
                focusSet.has(
                    modulePath
                )
                    ? ":::focus"
                    : "";

            lines.push(
                `        ${nodeIds.get(modulePath)}["${getModuleLabel(modulePath)}"]${focusClass}`
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

    const routeSlices: Array<{
        label: string;
        matches: (modulePath: string) => boolean;
    }> = [
        {
            label: "Home, navigation and search",
            matches: modulePath =>
                modulePath === "src/pages/HomePage.tsx"
                || modulePath.startsWith("src/ui/components/")
                || modulePath.startsWith("src/features/search/")
        },
        ...[
            "grammar",
            "onboarding",
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
                    || modulePath.startsWith(
                        `src/pages/${feature[0].toUpperCase()}${feature.slice(1)}`
                    )
                    || (
                        (
                            feature === "grammar"
                            || feature === "travel"
                        )
                        && modulePath.startsWith("src/features/exercises/")
                    )
            })
        ),
        {
            label: "Journal",
            matches: modulePath =>
                modulePath.startsWith("src/pages/Journal")
                || modulePath.startsWith("src/features/news/")
        },
        {
            label: "Institutional pages",
            matches: modulePath => [
                "src/pages/AboutPage.tsx",
                "src/pages/ContactPage.tsx",
                "src/pages/NotFoundPage.tsx",
                "src/pages/WorkWithUsPage.tsx"
            ].includes(
                modulePath
            )
        }
    ];
    const lines = [
        "<!-- This file is generated by npm run graph:dependencies. Do not edit manually. -->",
        "",
        "# React application dependency maps",
        "",
        `The application contains ${modules.length} local modules reachable from \`src/main.tsx\`, ${runtimeDependencies.length} runtime imports and ${typeDependencyCount} type-only imports.`,
        "The generator rejects runtime dependency cycles.",
        "",
        "## React architecture overview",
        "",
        "Arrows follow runtime imports from the React entry point down to routes, layouts, pages, components, features, engines and source modules. Counts are shown only when several imports cross the same two layers; imports inside one layer are collapsed.",
        "",
        ...renderArchitectureOverview(
            modules,
            dependencies
        ),
        "",
        "## React root and route tree",
        "",
        "This is the concrete top of the import tree. A thicker node border marks the files selected for this view; their direct local dependencies remain visible in the layer where they belong.",
        "",
        ...renderFocusedGraph(
            modules,
            dependencies,
            modulePath =>
                modulePath === "src/main.tsx"
                || modulePath.startsWith("src/app/")
        ),
        "",
        "## Focused route branches",
        "",
        "Open only the branch you need. Each map follows outgoing runtime imports from its highlighted React pages and feature components into shared components, engines and modules. Type-only imports are intentionally omitted.",
        ""
    ];

    for (
        const slice
        of routeSlices
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
        "- Every module and edge is derived from the local imports reachable from `src/main.tsx`.",
        "- External packages are intentionally excluded so the diagrams stay focused on application architecture.",
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
            normalizeLineEndings(currentOutput)
            !== normalizeLineEndings(output)
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
