/** React presentation and bootstrap regression guards. */
import assert from "node:assert/strict";
import {
    readdir,
    readFile,
    stat
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
const indexPath = resolve(root, "index.html");

const requiredReactSurfaces = [
    "src/main.tsx",
    "src/app/App.tsx",
    "src/app/AppLayout.tsx",
    "src/app/AppRouter.tsx",
    "src/app/routes.ts",
    "src/ui/components/Navbar.tsx",
    "src/ui/components/Footer.tsx",
    "src/ui/components/Layout.tsx",
    "src/features/search/SearchDialog.tsx",
    "src/pages/HomePage.tsx",
    "src/pages/GrammarIndexPage.tsx",
    "src/pages/GrammarLevelPage.tsx",
    "src/pages/GrammarLessonPage.tsx",
    "src/pages/VocabularyIndexPage.tsx",
    "src/pages/VocabularyLevelPage.tsx",
    "src/pages/VocabularyPackPage.tsx",
    "src/pages/TravelIndexPage.tsx",
    "src/pages/TravelLessonPage.tsx",
    "src/pages/JournalIndexPage.tsx",
    "src/pages/JournalArticlePage.tsx",
    "src/pages/OnboardingPage.tsx",
    "src/pages/NotFoundPage.tsx"
] as const;

const forbiddenLegacySurfaces = [
    "app.ts",
    "src/core/navigation.ts",
    "src/core/routeEngine.ts",
    "src/core/router.ts",
    "src/ui/ui.ts",
    "src/ui/views"
] as const;

const structuralHtmlPattern =
    /<(?:div|nav|button|input|article|section|main|header|footer|h[1-6]|p|span|img|style|ul|ol|li|table|thead|tbody|tr|td|th)\b/iu;
const inlineHandlerPattern =
    /\bon(?:click|dblclick|mouseover|mouseout|mouseenter|mouseleave|focus|blur|change|input|submit|keydown|keyup)\s*=/iu;

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

function walkAst(
    node: ts.Node,
    visitor: (node: ts.Node) => void
): void {
    visitor(node);
    node.forEachChild(child => walkAst(child, visitor));
}

function getLiteralFragment(
    node: ts.Node
): string | null {
    if (
        ts.isStringLiteral(node)
        || ts.isNoSubstitutionTemplateLiteral(node)
    ) {
        return node.text;
    }

    if (
        node.kind === ts.SyntaxKind.TemplateHead
        || node.kind === ts.SyntaxKind.TemplateMiddle
        || node.kind === ts.SyntaxKind.TemplateTail
    ) {
        return (node as ts.TemplateLiteralLikeNode).text;
    }

    return null;
}

async function parseSourceFile(
    filePath: string
): Promise<ts.SourceFile> {
    return ts.createSourceFile(
        filePath,
        await readFile(filePath, "utf8"),
        ts.ScriptTarget.ES2022,
        true,
        filePath.endsWith(".tsx")
            ? ts.ScriptKind.TSX
            : ts.ScriptKind.TS
    );
}

async function pathExists(
    path: string
): Promise<boolean> {
    try {
        await stat(path);
        return true;
    } catch {
        return false;
    }
}

test(
    "the complete React application surface remains present",
    async () => {
        const missing: string[] = [];

        for (const path of requiredReactSurfaces) {
            if (!await pathExists(resolve(root, path))) {
                missing.push(path);
            }
        }

        assert.deepEqual(
            missing,
            [],
            `React architecture rollback detected:\n${missing.join("\n")}`
        );
    }
);

test(
    "legacy imperative router and template surfaces cannot return",
    async () => {
        const restored: string[] = [];

        for (const path of forbiddenLegacySurfaces) {
            if (await pathExists(resolve(root, path))) {
                restored.push(path);
            }
        }

        assert.deepEqual(
            restored,
            [],
            `Legacy architecture restored:\n${restored.join("\n")}`
        );
    }
);

test(
    "pure TypeScript modules remain free of React and HTML templates",
    async () => {
        const files = (await collectSourceFiles(srcDirectory)).filter(
            file =>
                file.endsWith(".ts")
                && !file.endsWith(".d.ts")
        );
        const violations: string[] = [];

        for (const file of files) {
            const sourceFile = await parseSourceFile(file);

            for (const statement of sourceFile.statements) {
                if (
                    ts.isImportDeclaration(statement)
                    && ts.isStringLiteral(statement.moduleSpecifier)
                    && /^(?:react|react-dom|react-router)(?:\/|$)/u.test(
                        statement.moduleSpecifier.text
                    )
                ) {
                    violations.push(
                        `${repositoryPath(file)} imports ${statement.moduleSpecifier.text}`
                    );
                }
            }

            walkAst(sourceFile, node => {
                const fragment = getLiteralFragment(node);

                if (fragment && structuralHtmlPattern.test(fragment)) {
                    violations.push(
                        `${repositoryPath(file)} contains structural HTML`
                    );
                }
            });
        }

        assert.deepEqual(
            [...new Set(violations)],
            [],
            `Pure modules leaked presentation concerns:\n${violations.join("\n")}`
        );
    }
);

test(
    "source strings never use inline DOM event attributes",
    async () => {
        const violations: string[] = [];

        for (const file of await collectSourceFiles(srcDirectory)) {
            const sourceFile = await parseSourceFile(file);

            walkAst(sourceFile, node => {
                const fragment = getLiteralFragment(node);

                if (fragment && inlineHandlerPattern.test(fragment)) {
                    violations.push(repositoryPath(file));
                }
            });
        }

        assert.deepEqual(
            [...new Set(violations)],
            [],
            `Inline DOM handlers are forbidden:\n${violations.join("\n")}`
        );
    }
);

test(
    "index.html exposes one React ES-module entry point",
    async () => {
        const indexHtml = await readFile(indexPath, "utf8");
        const scriptSources = [
            ...indexHtml.matchAll(
                /<script\s+[^>]*src=["']([^"']+)["'][^>]*><\/script>/giu
            )
        ].map(match => match[1]?.split("?")[0]);

        assert.deepEqual(scriptSources, ["/src/main.tsx"]);
        assert.match(
            indexHtml,
            /<script\b(?=[^>]*\btype=["']module["'])(?=[^>]*\bsrc=["']\/src\/main\.tsx["'])[^>]*>\s*<\/script>/iu
        );
        assert.equal(
            /<script(?![^>]*\bsrc\s*=)[^>]*>/iu.test(indexHtml),
            false,
            "Inline script blocks are forbidden"
        );
        assert.doesNotMatch(indexHtml, /\bapp\.js\b/iu);
    }
);
