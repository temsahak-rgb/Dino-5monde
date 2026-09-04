/**
 * Module dependency boundary guards.
 *
 * These rules keep the explicit import graph directional and prevent the
 * controller/view/router cycles that existed before the ES-module migration.
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

const root =
    resolve(
        dirname(
            fileURLToPath(
                import.meta.url
            )
        ),
        "../.."
    );
const srcDirectory =
    resolve(
        root,
        "src"
    );

async function collectTypeScriptFiles(
    directory: string
): Promise<string[]> {
    const entries =
        await readdir(
            directory,
            {
                withFileTypes: true
            }
        );
    const files:
        string[] = [];

    for (
        const entry
        of entries
    ) {
        const entryPath =
            resolve(
                directory,
                entry.name
            );

        if (
            entry.isDirectory()
        ) {
            files.push(
                ...await collectTypeScriptFiles(
                    entryPath
                )
            );
        } else if (
            entry.isFile()
            && entry.name.endsWith(".ts")
            && !entry.name.endsWith(".d.ts")
        ) {
            files.push(
                entryPath
            );
        }
    }

    return files.sort();
}

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

function isTypeOnlyImport(
    declaration: ts.ImportDeclaration
): boolean {
    const clause =
        declaration.importClause;

    return Boolean(
        clause?.isTypeOnly
        || (
            clause
            && !clause.name
            && clause.namedBindings
            && ts.isNamedImports(
                clause.namedBindings
            )
            && clause.namedBindings.elements.length > 0
            && clause.namedBindings.elements.every(
                element => element.isTypeOnly
            )
        )
    );
}

function isFeatureController(
    modulePath: string
): boolean {
    return modulePath.startsWith(
        "src/features/"
    )
        && !modulePath.endsWith(
            "Engine.ts"
        );
}

function isEngine(
    modulePath: string
): boolean {
    return modulePath.endsWith(
        "Engine.ts"
    );
}

test(
    "runtime imports respect module boundaries",
    async () => {
        const sourcePaths = [
            resolve(
                root,
                "app.ts"
            ),
            ...await collectTypeScriptFiles(
                srcDirectory
            )
        ];
        const violations:
            string[] = [];

        for (
            const sourcePath
            of sourcePaths
        ) {
            const sourceModule =
                repositoryPath(
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
                    || isTypeOnlyImport(
                        statement
                    )
                    || !ts.isStringLiteral(
                        statement.moduleSpecifier
                    )
                    || !statement.moduleSpecifier.text.startsWith(
                        "."
                    )
                ) {
                    continue;
                }

                const targetModule =
                    repositoryPath(
                        resolve(
                            dirname(
                                sourcePath
                            ),
                            statement.moduleSpecifier.text.replace(
                                /\.js$/,
                                ".ts"
                            )
                        )
                    );
                const reasons:
                    string[] = [];

                if (
                    targetModule === "src/core/router.ts"
                    && sourceModule !== "app.ts"
                ) {
                    reasons.push(
                        "only app.ts may depend on the concrete router"
                    );
                }

                if (
                    sourceModule.startsWith("src/ui/views/")
                    && (
                        targetModule.startsWith("src/pages/")
                        || targetModule.startsWith("src/features/")
                    )
                ) {
                    reasons.push(
                        "views cannot depend on pages or feature modules"
                    );
                }

                if (
                    isFeatureController(
                        sourceModule
                    )
                    && targetModule.startsWith("src/pages/")
                ) {
                    reasons.push(
                        "feature controllers cannot depend on pages"
                    );
                }

                if (
                    isEngine(
                        sourceModule
                    )
                    && (
                        targetModule.startsWith("src/pages/")
                        || targetModule.startsWith("src/ui/")
                        || isFeatureController(
                            targetModule
                        )
                    )
                ) {
                    reasons.push(
                        "engines cannot depend on pages, UI, or controllers"
                    );
                }

                for (
                    const reason
                    of reasons
                ) {
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
                "Module boundary violations detected:",
                ...violations.map(
                    violation =>
                        `- ${violation}`
                )
            ].join(
                "\n"
            )
        );
    }
);
