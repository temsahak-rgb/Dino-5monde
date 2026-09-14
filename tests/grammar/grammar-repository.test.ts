import assert from "node:assert/strict";
import test from "node:test";

import {
    loadGrammarCatalog,
    loadGrammarLesson
} from "../../src/features/grammar/grammarRepository.js";

import {
    ContentContractError
} from "../../src/services/content/contentRepository.js";

import {
    createStaticContentRepository
} from "../../src/services/content/staticContentRepository.js";

test(
    "the transitional static repository exposes the same complete Grammar contract",
    async () => {
        const originalFetch =
            globalThis.fetch;
        const payloads =
            new Map<string, unknown>([
                [
                    "./data/grammar-A1.json",
                    [{
                        exercises: 1,
                        estimatedTime: 10,
                        icon: "👋",
                        id: "A1-G-001",
                        level: "A1",
                        module: "Premiers pas",
                        title: "Les pronoms sujets"
                    }]
                ],
                [
                    "./data/lessons/A1/A1-G-001.json",
                    {
                        id: "A1-G-001",
                        level: "A1",
                        sections: [{
                            id: "A1-G-001-1",
                            title: "Comprendre",
                            type: "lesson"
                        }],
                        title:
                            "Les pronoms personnels sujets"
                    }
                ],
                [
                    "./data/exercises/A1/A1-G-001-ex1.json",
                    {
                        id: "A1-G-001-ex1",
                        questions: [],
                        title: "Exercice",
                        type: "exercise"
                    }
                ],
                [
                    "./data/exercises/A1/A1-G-001-quiz.json",
                    {
                        id: "A1-G-001-quiz",
                        questions: [],
                        title: "Quiz",
                        type: "quiz"
                    }
                ]
            ]);

        globalThis.fetch = (async input => {
            const path =
                String(input);

            if (
                path.endsWith(
                    "A1-G-001-ex2.json"
                )
            ) {
                return new Response(
                    null,
                    { status: 404 }
                );
            }

            const payload =
                payloads.get(path);

            return payload === undefined
                ? new Response(
                    null,
                    { status: 404 }
                )
                : Response.json(
                    payload
                );
        }) as typeof fetch;

        try {
            const repository =
                createStaticContentRepository();
            const catalog =
                await loadGrammarCatalog(
                    repository,
                    "A1"
                );
            const lesson =
                await loadGrammarLesson(
                    repository,
                    "A1",
                    "A1-G-001"
                );

            assert.equal(
                repository.source,
                "legacy-static"
            );
            assert.equal(
                catalog[0]?.title,
                "Les pronoms sujets"
            );
            assert.deepEqual(
                lesson?.sections.map(
                    section =>
                        section.id
                ),
                [
                    "A1-G-001-1",
                    "A1-G-001-ex1",
                    "A1-G-001-quiz"
                ]
            );
        } finally {
            globalThis.fetch =
                originalFetch;
        }
    }
);

test(
    "Grammar rejects a catalog whose declared level differs from its route",
    async () => {
        const repository = {
            source:
                "server" as const,
            listCatalog: async () => [{
                catalog: {
                    exercises: 0,
                    estimatedTime: 5,
                    icon: "📚",
                    id: "A1-G-001",
                    level: "B1",
                    module: "Base",
                    title: "Titre"
                },
                contentKey:
                    "A1-G-001",
                contentType:
                    "grammar_lesson" as const,
                level: "A1",
                publishedAt: null,
                revisionNumber: 1,
                schemaVersion: 2,
                titleFa: null,
                titleFr: "Titre"
            }],
            loadDocument: async () =>
                null
        };

        await assert.rejects(
            loadGrammarCatalog(
                repository,
                "A1"
            ),
            ContentContractError
        );
    }
);
