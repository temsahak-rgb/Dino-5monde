import assert from "node:assert/strict";
import {
    basename,
    dirname,
    join
} from "node:path";
import test from "node:test";

import {
    createAppPath,
    matchAppPath
} from "../../src/app/routes.js";
import {
    knownNewsContentLinkDebt,
    type NewsContentLinkDebt
} from "./known-content-link-debt.js";
import {
    collectFiles,
    dataDirectory,
    readJson,
    repositoryPath
} from "./data-test-utils.js";

interface GrammarIndexEntry {
    id: string;
}

interface NewsIndexEntry {
    id: string;
}

interface NewsArticle {
    content: {
        grammar?: Array<{
            grammarId?: string;
        }>;
        vocabulary?: Array<{
            fr: string;
        }>;
    };
}

interface VocabularyPack {
    words?: Array<{
        fr: string;
    }>;
}

function normalizeFrenchTerm(
    value: string
): string {
    return value
        .normalize("NFKC")
        .trim()
        .toLocaleLowerCase("fr");
}

async function loadGrammarLessonIds(): Promise<Set<string>> {
    const ids = new Set<string>();
    const files = (await collectFiles(dataDirectory)).filter(
        filePath =>
            /^grammar-[A-C][12]\.json$/.test(basename(filePath))
    );

    for (const filePath of files) {
        const entries = await readJson<GrammarIndexEntry[]>(filePath);
        entries.forEach(entry => ids.add(entry.id));
    }

    return ids;
}

async function loadVocabularyTerms(): Promise<Set<string>> {
    const vocabularyDirectory = join(dataDirectory, "vocabulary");
    const terms = new Set<string>();
    const packFiles = (await collectFiles(vocabularyDirectory)).filter(
        filePath =>
            /^(?:A1|A2|B1|B2|C1|C2)$/.test(
                basename(dirname(filePath))
            )
    );

    for (const filePath of packFiles) {
        const pack = await readJson<VocabularyPack>(filePath);

        for (const word of pack.words ?? []) {
            terms.add(normalizeFrenchTerm(word.fr));
        }
    }

    return terms;
}

function isSafeGrammarReference(
    grammarId: string
): boolean {
    try {
        const route = matchAppPath(
            createAppPath({
                name: "grammar-lesson",
                lessonId: grammarId
            })
        );

        return route?.name === "grammar-lesson"
            && route.lessonId === grammarId;
    } catch {
        return false;
    }
}

function printKnownDebt(
    debt: Readonly<Record<string, NewsContentLinkDebt>>
): void {
    const lines = ["DINO_LINK_DEBT_BEGIN"];

    for (const [articleId, links] of Object.entries(debt)) {
        lines.push(
            `- data/news/${articleId}.json — ${links.grammar.length} leçon(s) de grammaire à relier : ${links.grammar.map(id => `\`${id}\``).join(", ")}`,
            `- data/news/${articleId}.json — ${links.vocabulary.length} mot(s) à relier à un pack : ${links.vocabulary.map(word => `\`${word}\``).join(", ")}`
        );
    }

    lines.push("DINO_LINK_DEBT_END");
    console.log(lines.join("\n"));
}

test(
    "news cross-content links match React routes and real corpus targets",
    async () => {
        const grammarLessonIds = await loadGrammarLessonIds();
        const vocabularyTerms = await loadVocabularyTerms();
        const newsDirectory = join(dataDirectory, "news");
        const newsIndex = await readJson<NewsIndexEntry[]>(
            join(newsDirectory, "news-index.json")
        );
        const actualDebt: Record<string, NewsContentLinkDebt> = {};

        for (const entry of newsIndex) {
            const articlePath = join(newsDirectory, `${entry.id}.json`);
            const article = await readJson<NewsArticle>(articlePath);
            const missingGrammar: string[] = [];
            const missingVocabulary: string[] = [];

            for (const [index, item] of (
                article.content.grammar ?? []
            ).entries()) {
                if (!item.grammarId) {
                    continue;
                }

                assert.ok(
                    isSafeGrammarReference(item.grammarId),
                    `${repositoryPath(articlePath)}.content.grammar[${index}].grammarId is not a safe React route reference`
                );

                if (!grammarLessonIds.has(item.grammarId)) {
                    missingGrammar.push(item.grammarId);
                }
            }

            for (const item of article.content.vocabulary ?? []) {
                if (!vocabularyTerms.has(normalizeFrenchTerm(item.fr))) {
                    missingVocabulary.push(item.fr);
                }
            }

            if (
                missingGrammar.length > 0
                || missingVocabulary.length > 0
            ) {
                actualDebt[entry.id] = {
                    grammar: missingGrammar,
                    vocabulary: missingVocabulary
                };
            }
        }

        assert.deepEqual(
            actualDebt,
            knownNewsContentLinkDebt,
            "Cross-content debt changed. Create missing targets, remove resolved entries, or document every new orphan explicitly."
        );

        printKnownDebt(actualDebt);
    }
);
