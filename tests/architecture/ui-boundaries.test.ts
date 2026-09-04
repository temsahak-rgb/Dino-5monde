/**
 * Architecture regression tests.
 *
 * These tests protect the UI-layer migration against accidental rollback.
 *
 * Invariants:
 * - controllers, pages and engines must not generate HTML templates
 * - inline DOM event attributes are forbidden everywhere in TypeScript
 * - interface-language branching must not return to business/controller code
 * - required view files must remain present
 * - the legacy Travel renderer must not return
 * - index.html must expose one ES-module entry point and no classic scripts
 */

import assert from "node:assert/strict";
import {
    readdir,
    readFile,
    stat
} from "node:fs/promises";
import test from "node:test";
import {
    dirname,
    join,
    relative,
    resolve
} from "node:path";
import {
    fileURLToPath
} from "node:url";
import ts from "typescript";

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

const srcDirectory =
    join(
        root,
        "src"
    );

const viewsDirectory =
    join(
        srcDirectory,
        "ui",
        "views"
    );

const indexPath =
    join(
        root,
        "index.html"
    );

/**
 * Source areas that must remain presentation-free.
 */
const presentationFreeRoots = [
    join(
        root,
        "app.ts"
    ),
    join(
        srcDirectory,
        "core"
    ),
    join(
        srcDirectory,
        "features"
    ),
    join(
        srcDirectory,
        "pages"
    )
];

/**
 * Areas in which direct interface-language branching is forbidden.
 *
 * `app.ts` is intentionally excluded because bootstrap validation is allowed
 * to validate persisted language codes.
 */
const languageNeutralRoots = [
    join(
        srcDirectory,
        "core"
    ),
    join(
        srcDirectory,
        "features"
    ),
    join(
        srcDirectory,
        "pages"
    )
];

/**
 * Views introduced by the UI-layer migration.
 *
 * Their presence is an explicit architectural invariant: deleting one and
 * moving its markup back into a controller must make CI fail.
 */
const requiredViews = [
    "navbarView.ts",
    "homeView.ts",
    "pathsView.ts",
    "grammarView.ts",
    "travelView.ts",
    "vocabularyView.ts",
    "newsView.ts",
    "pollsView.ts",
    "onboardingView.ts",
    "searchView.ts",
    "notFoundView.ts"
];

/**
 * HTML elements that indicate structural presentation markup.
 *
 * Controllers may manipulate an already-rendered DOM element, but they must
 * not construct structural HTML strings.
 */
const structuralHtmlPattern =
    /<(?:div|nav|button|input|article|section|main|header|footer|h[1-6]|p|span|img|style|ul|ol|li|table|thead|tbody|tr|td|th)\b/i;

/**
 * Inline DOM handlers are forbidden even inside view templates.
 */
const inlineHandlerPattern =
    /\bon(?:click|dblclick|mouseover|mouseout|mouseenter|mouseleave|focus|blur|change|input|submit|keydown|keyup)\s*=/i;

/**
 * Returns a repository-relative path using forward slashes for stable CI
 * messages on Windows, Linux and macOS.
 */
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

/**
 * Recursively returns TypeScript source files.
 */
async function collectTypeScriptFiles(
    entryPath: string
): Promise<string[]> {
    const entryStats =
        await stat(
            entryPath
        );

    if (
        entryStats.isFile()
    ) {
        return entryPath.endsWith(
            ".ts"
        )
            && !entryPath.endsWith(
                ".d.ts"
            )
            ? [
                entryPath
            ]
            : [];
    }

    const entries =
        await readdir(
            entryPath,
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
        const childPath =
            join(
                entryPath,
                entry.name
            );

        if (
            entry.isDirectory()
        ) {
            files.push(
                ...await collectTypeScriptFiles(
                    childPath
                )
            );

            continue;
        }

        if (
            entry.isFile()
            && entry.name.endsWith(
                ".ts"
            )
            && !entry.name.endsWith(
                ".d.ts"
            )
        ) {
            files.push(
                childPath
            );
        }
    }

    return files;
}

/**
 * Returns every TypeScript file contained in a collection of roots.
 */
async function collectFromRoots(
    roots: string[]
): Promise<string[]> {
    const files:
        string[] = [];

    for (
        const sourceRoot
        of roots
    ) {
        files.push(
            ...await collectTypeScriptFiles(
                sourceRoot
            )
        );
    }

    return files;
}

/**
 * Parses a TypeScript file.
 */
async function parseTypeScriptFile(
    filePath: string
): Promise<{
    source: string;
    sourceFile: ts.SourceFile;
}> {
    const source =
        await readFile(
            filePath,
            "utf8"
        );

    return {
        source,
        sourceFile:
            ts.createSourceFile(
                filePath,
                source,
                ts.ScriptTarget.ES2022,
                true,
                ts.ScriptKind.TS
            )
    };
}

/**
 * Returns textual content carried by a string/template AST node.
 */
function getLiteralFragment(
    node: ts.Node
): string | null {
    if (
        ts.isStringLiteral(
            node
        )
        || ts.isNoSubstitutionTemplateLiteral(
            node
        )
    ) {
        return node.text;
    }

    switch (
        node.kind
    ) {
        case ts.SyntaxKind.TemplateHead:
        case ts.SyntaxKind.TemplateMiddle:
        case ts.SyntaxKind.TemplateTail:
            return (
                node as ts.TemplateLiteralLikeNode
            ).text;

        default:
            return null;
    }
}

/**
 * Walks every node in a TypeScript AST.
 */
function walkAst(
    node: ts.Node,
    visitor: (
        node: ts.Node
    ) => void
): void {
    visitor(
        node
    );

    node.forEachChild(
        child =>
            walkAst(
                child,
                visitor
            )
    );
}

/**
 * Returns whether a node is the string literal "fa".
 */
function isPersianLanguageLiteral(
    node: ts.Node
): boolean {
    return (
        ts.isStringLiteral(
            node
        )
        && node.text
            === "fa"
    );
}

/**
 * Returns whether a binary expression directly branches on the Persian
 * interface-language code.
 */
function isDirectPersianLanguageBranch(
    node: ts.Node
): boolean {
    if (
        !ts.isBinaryExpression(
            node
        )
    ) {
        return false;
    }

    const operator =
        node.operatorToken.kind;

    if (
        operator
            !== ts.SyntaxKind.EqualsEqualsEqualsToken
        && operator
            !== ts.SyntaxKind.ExclamationEqualsEqualsToken
        && operator
            !== ts.SyntaxKind.EqualsEqualsToken
        && operator
            !== ts.SyntaxKind.ExclamationEqualsToken
    ) {
        return false;
    }

    return (
        isPersianLanguageLiteral(
            node.left
        )
        || isPersianLanguageLiteral(
            node.right
        )
    );
}

test(
    "all migrated UI views remain present",
    async () => {
        const existingViews =
            new Set(
                await readdir(
                    viewsDirectory
                )
            );

        const missingViews =
            requiredViews.filter(
                view =>
                    !existingViews.has(
                        view
                    )
            );

        assert.deepEqual(
            missingViews,
            [],
            [
                "UI architecture rollback detected.",
                "Required view files are missing:",
                ...missingViews.map(
                    view =>
                        `- src/ui/views/${view}`
                )
            ].join(
                "\n"
            )
        );
    }
);

test(
    "controllers engines and pages do not generate structural HTML",
    async () => {
        const files =
            await collectFromRoots(
                presentationFreeRoots
            );

        const violations:
            string[] = [];

        for (
            const filePath
            of files
        ) {
            const {
                sourceFile
            } =
                await parseTypeScriptFile(
                    filePath
                );

            walkAst(
                sourceFile,
                node => {
                    const fragment =
                        getLiteralFragment(
                            node
                        );

                    if (
                        fragment
                        && structuralHtmlPattern.test(
                            fragment
                        )
                    ) {
                        violations.push(
                            repositoryPath(
                                filePath
                            )
                        );
                    }
                }
            );
        }

        assert.deepEqual(
            [
                ...new Set(
                    violations
                )
            ],
            [],
            [
                "Presentation markup escaped the view layer.",
                "Structural HTML is only allowed under src/ui/views/",
                ...[
                    ...new Set(
                        violations
                    )
                ].map(
                    file =>
                        `- ${file}`
                )
            ].join(
                "\n"
            )
        );
    }
);

test(
    "TypeScript templates never use inline DOM event handlers",
    async () => {
        const files =
            await collectTypeScriptFiles(
                srcDirectory
            );

        const violations:
            string[] = [];

        for (
            const filePath
            of files
        ) {
            const {
                sourceFile
            } =
                await parseTypeScriptFile(
                    filePath
                );

            walkAst(
                sourceFile,
                node => {
                    const fragment =
                        getLiteralFragment(
                            node
                        );

                    if (
                        fragment
                        && inlineHandlerPattern.test(
                            fragment
                        )
                    ) {
                        violations.push(
                            repositoryPath(
                                filePath
                            )
                        );
                    }
                }
            );
        }

        assert.deepEqual(
            [
                ...new Set(
                    violations
                )
            ],
            [],
            [
                "Inline DOM handlers are forbidden.",
                "Bind interactions from controllers instead.",
                ...[
                    ...new Set(
                        violations
                    )
                ].map(
                    file =>
                        `- ${file}`
                )
            ].join(
                "\n"
            )
        );
    }
);

test(
    "business and controller layers do not branch directly on interface language",
    async () => {
        const files =
            await collectFromRoots(
                languageNeutralRoots
            );

        const violations:
            string[] = [];

        for (
            const filePath
            of files
        ) {
            const {
                sourceFile
            } =
                await parseTypeScriptFile(
                    filePath
                );

            walkAst(
                sourceFile,
                node => {
                    if (
                        isDirectPersianLanguageBranch(
                            node
                        )
                    ) {
                        violations.push(
                            repositoryPath(
                                filePath
                            )
                        );
                    }
                }
            );
        }

        assert.deepEqual(
            [
                ...new Set(
                    violations
                )
            ],
            [],
            [
                "Direct language branching returned outside the i18n/view layer.",
                "Use t(), localizedValue() or a view helper instead.",
                ...[
                    ...new Set(
                        violations
                    )
                ].map(
                    file =>
                        `- ${file}`
                )
            ].join(
                "\n"
            )
        );
    }
);

test(
    "legacy Travel renderer cannot return",
    async () => {
        const legacyTypeScriptPath =
            join(
                srcDirectory,
                "features",
                "travel",
                "travelRenderers.ts"
            );

        let legacyRendererExists =
            true;

        try {
            await stat(
                legacyTypeScriptPath
            );
        } catch {
            legacyRendererExists =
                false;
        }

        assert.equal(
            legacyRendererExists,
            false,
            "src/features/travel/travelRenderers.ts must stay deleted"
        );

        const indexHtml =
            await readFile(
                indexPath,
                "utf8"
            );

        assert.equal(
            indexHtml.includes(
                "travelRenderers"
            ),
            false,
            "index.html must never load the legacy Travel renderer"
        );
    }
);

test(
    "index.html exposes a single ES-module entry point",
    async () => {
        const indexHtml =
            await readFile(
                indexPath,
                "utf8"
            );

        const scriptSources =
            [
                ...indexHtml.matchAll(
                    /<script\s+[^>]*src=["']([^"']+)["'][^>]*><\/script>/gi
                )
            ].map(
                match =>
                    match[1]
                        .split("?")[0]
            );

        assert.deepEqual(
            scriptSources,
            [
                "app.js"
            ],
            "index.html must load only the application entry point"
        );

        assert.match(
            indexHtml,
            /<script\s+type=["']module["']\s+src=["']app\.js["']><\/script>/i,
            "app.js must be loaded as an ES module"
        );

        assert.equal(
            /<script(?![^>]*\bsrc\s*=)[^>]*>/i.test(
                indexHtml
            ),
            false,
            "Inline <script> blocks are forbidden in index.html"
        );
    }
);
