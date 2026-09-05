/**
 * Dependency guards for the React application.
 *
 * The graph is expected to flow from the entry point and app composition
 * toward route pages, reusable UI/features, and finally pure domain/data
 * modules. Runtime cycles and upward dependencies make that graph unreadable
 * and are rejected here.
 */
import assert from "node:assert/strict";
import {
    readdir,
    readFile
} from "node:fs/promises";
import {
    dirname,
    relative,
    resolve
} from "node:path";
import test from "node:test";
import {
    fileURLToPath
} from "node:url";
import ts from "typescript";

const root = resolve(
    dirname(fileURLToPath(import.meta.url)),
    "../.."
);
const srcDirectory = resolve(root, "src");

async function collectSourceFiles(
    directory: string
): Promise<string[]> {
    const entries = await readdir(directory, { withFileTypes: true });
    const files: string[] = [];

    for (const entry of entries) {
        const entryPath = resolve(directory, entry.name);

        if (entry.isDirectory()) {
            files.push(...await collectSourceFiles(entryPath));
        } else if (
            entry.isFile()
            && /\.tsx?$/u.test(entry.name)
            && !entry.name.endsWith(".d.ts")
        ) {
            files.push(entryPath);
        }
    }

    return files.sort();
}

function repositoryPath(
    filePath: string
): string {
    return relative(root, filePath).replace(/\\/gu, "/");
}

function moduleStem(
    filePath: string
): string {
    return repositoryPath(filePath).replace(/\.tsx?$/u, "");
}

function isTypeOnlyImport(
    declaration: ts.ImportDeclaration
): boolean {
    const clause = declaration.importClause;

    return Boolean(
        clause?.isTypeOnly
        || (
            clause
            && !clause.name
            && clause.namedBindings
            && ts.isNamedImports(clause.namedBindings)
            && clause.namedBindings.elements.length > 0
            && clause.namedBindings.elements.every(
                element => element.isTypeOnly
            )
        )
    );
}

function parseSource(
    filePath: string,
    source: string
): ts.SourceFile {
    return ts.createSourceFile(
        filePath,
        source,
        ts.ScriptTarget.ES2022,
        true,
        filePath.endsWith(".tsx")
            ? ts.ScriptKind.TSX
            : ts.ScriptKind.TS
    );
}

function isPureDomainModule(
    sourceModule: string
): boolean {
    return sourceModule.endsWith(".ts")
        && (
            sourceModule.startsWith("src/core/")
            || sourceModule.startsWith("src/features/")
        );
}

function resolveImportedModule(
    sourcePath: string,
    specifier: string,
    modulesByStem: ReadonlyMap<string, string>
): string | null {
    const resolvedStem = repositoryPath(
        resolve(
            dirname(sourcePath),
            specifier.replace(/\.(?:js|jsx)$/u, "")
        )
    );

    return modulesByStem.get(resolvedStem)
        ?? modulesByStem.get(`${resolvedStem}/index`)
        ?? null;
}

function collectCycles(
    graph: ReadonlyMap<string, ReadonlySet<string>>
): string[] {
    const state = new Map<string, "visiting" | "visited">();
    const stack: string[] = [];
    const cycles = new Set<string>();

    function visit(modulePath: string): void {
        state.set(modulePath, "visiting");
        stack.push(modulePath);

        for (const target of graph.get(modulePath) ?? []) {
            if (state.get(target) === "visiting") {
                const start = stack.indexOf(target);
                cycles.add(
                    [
                        ...stack.slice(start),
                        target
                    ].join(" -> ")
                );
            } else if (!state.has(target)) {
                visit(target);
            }
        }

        stack.pop();
        state.set(modulePath, "visited");
    }

    for (const modulePath of graph.keys()) {
        if (!state.has(modulePath)) {
            visit(modulePath);
        }
    }

    return [...cycles].sort();
}

test(
    "runtime imports follow the React application layers",
    async () => {
        const sourcePaths = await collectSourceFiles(srcDirectory);
        const modulesByStem = new Map(
            sourcePaths.map(path => [moduleStem(path), repositoryPath(path)])
        );
        const graph = new Map<string, Set<string>>();
        const violations: string[] = [];

        for (const sourcePath of sourcePaths) {
            const sourceModule = repositoryPath(sourcePath);
            const source = await readFile(sourcePath, "utf8");
            const sourceFile = parseSource(sourcePath, source);
            const edges = new Set<string>();
            graph.set(sourceModule, edges);

            for (const statement of sourceFile.statements) {
                if (
                    !ts.isImportDeclaration(statement)
                    || isTypeOnlyImport(statement)
                    || !ts.isStringLiteral(statement.moduleSpecifier)
                ) {
                    continue;
                }

                const specifier = statement.moduleSpecifier.text;

                if (
                    isPureDomainModule(sourceModule)
                    && /^(?:react|react-dom|react-router)(?:\/|$)/u.test(
                        specifier
                    )
                ) {
                    violations.push(
                        `${sourceModule} -> ${specifier}: pure domain/data modules cannot depend on React`
                    );
                }

                if (!specifier.startsWith(".")) {
                    continue;
                }

                const targetModule = resolveImportedModule(
                    sourcePath,
                    specifier,
                    modulesByStem
                );

                if (!targetModule) {
                    continue;
                }

                edges.add(targetModule);
                const reasons: string[] = [];

                if (
                    sourceModule.startsWith("src/core/")
                    && /src\/(?:app|pages|features|ui|i18n)\//u.test(
                        targetModule
                    )
                ) {
                    reasons.push(
                        "core cannot depend on application, presentation, feature, or i18n modules"
                    );
                }

                if (
                    sourceModule.startsWith("src/features/")
                    && /src\/(?:app|pages)\//u.test(targetModule)
                ) {
                    reasons.push("features cannot depend on route composition or pages");
                }

                if (
                    sourceModule.startsWith("src/ui/")
                    && /src\/(?:app|pages)\//u.test(targetModule)
                ) {
                    reasons.push("shared UI cannot depend on route composition or pages");
                }

                if (
                    sourceModule.startsWith("src/pages/")
                    && targetModule.startsWith("src/app/")
                ) {
                    reasons.push("pages cannot depend upward on application composition");
                }

                if (
                    sourceModule.startsWith("src/services/")
                    && /src\/(?:app|pages|features|ui)\//u.test(targetModule)
                ) {
                    reasons.push(
                        "services cannot depend on application or presentation modules"
                    );
                }

                if (
                    isPureDomainModule(sourceModule)
                    && targetModule.endsWith(".tsx")
                ) {
                    reasons.push("pure domain/data modules cannot depend on React components");
                }

                if (
                    sourceModule === "src/app/routes.ts"
                ) {
                    reasons.push("the durable route contract must remain dependency-free");
                }

                for (const reason of reasons) {
                    violations.push(
                        `${sourceModule} -> ${targetModule}: ${reason}`
                    );
                }
            }
        }

        assert.deepEqual(
            violations,
            [],
            [
                "React module boundary violations detected:",
                ...violations.map(violation => `- ${violation}`)
            ].join("\n")
        );

        const cycles = collectCycles(graph);
        assert.deepEqual(
            cycles,
            [],
            [
                "Runtime import cycles make the React dependency graph ambiguous:",
                ...cycles.map(cycle => `- ${cycle}`)
            ].join("\n")
        );
    }
);
