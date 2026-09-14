import type {
    AdminContentItemRpcRow
} from "../../services/backend/database.types.js";

import {
    grammarLevels
} from "./adminGrammarEditor.js";

import type {
    AdminGrammarEditorValue,
    AdminGrammarQuestionValue,
    AdminGrammarTableValue
} from "./adminGrammarEditor.js";

interface AdminGrammarValidationIssue {
    field: string;
    message: string;
    severity: "error" | "warning";
}

const grammarIdPattern =
    /^(A1|A2|B1|B2|C1)-G-\d{3}(?:-[A-Z])?$/u;

function validateAdminGrammarEditor(
    grammar: AdminGrammarEditorValue,
    availableItems?: readonly AdminContentItemRpcRow[]
): AdminGrammarValidationIssue[] {
    const issues: AdminGrammarValidationIssue[] = [];

    requireMatch(
        issues,
        "Identifiant",
        grammar.contentKey,
        grammarIdPattern,
        "Utilisez la forme A1-G-001 ou A1-G-001-B."
    );
    if (
        grammarLevels.includes(grammar.level as typeof grammarLevels[number])
        && !grammar.contentKey.startsWith(`${grammar.level}-G-`)
    ) {
        issues.push(errorIssue(
            "Niveau",
            "Le niveau doit correspondre au préfixe de l’identifiant."
        ));
    }
    if (!grammarLevels.includes(grammar.level as typeof grammarLevels[number])) {
        issues.push(errorIssue("Niveau", "Choisissez un niveau de A1 à C1."));
    }

    requireText(issues, "Titre du catalogue", grammar.catalogTitleFr, 3);
    requireText(issues, "Titre de la leçon", grammar.titleFr, 3);
    requireText(issues, "Module", grammar.module, 2);
    requireText(issues, "Catégorie", grammar.category, 2);
    requireText(issues, "Icône du catalogue", grammar.catalogIcon, 1);
    requireText(issues, "Icône de la leçon", grammar.icon, 1);
    requireInteger(issues, "Durée du catalogue", grammar.catalogEstimatedTime, 1, 240);
    requireInteger(issues, "Durée", grammar.estimatedTime, 1, 240);
    if (grammar.catalogEstimatedTime !== grammar.estimatedTime) {
        issues.push(errorIssue(
            "Durée",
            "La carte du catalogue et la leçon doivent annoncer la même durée."
        ));
    }
    requireInteger(issues, "Importance", grammar.importance, 1, 5);
    requireInteger(issues, "Nombre de parties", grammar.lessonCount, 0, 100);
    requireInteger(issues, "Exercices annoncés", grammar.exerciseCount, 0, 10_000);

    if (grammar.lessons.length === 0) {
        issues.push(errorIssue(
            "Sections pédagogiques",
            "Ajoutez au moins une section de cours."
        ));
    }

    const declaredLessonCount = parseInteger(grammar.lessonCount);
    if (
        declaredLessonCount !== null
        && declaredLessonCount !== grammar.lessons.length
    ) {
        issues.push(warningIssue(
            "Nombre de parties",
            `${declaredLessonCount} annoncé(s), ${grammar.lessons.length} section(s) structurée(s).`
        ));
    }

    validatePrerequisites(issues, grammar, availableItems);
    validateSectionIds(issues, grammar);

    grammar.lessons.forEach((section, index) => {
        const field = `Section ${index + 1}`;
        requireText(issues, field, section.id, 3);
        requireText(issues, field, section.titleFr, 2);
        requireText(issues, field, section.content, 10);

        if (
            grammar.contentKey
            && section.id
            && !section.id.startsWith(`${grammar.contentKey}-`)
        ) {
            issues.push(warningIssue(
                field,
                "Identifiant legacy hors préfixe : conservez-le pour ne pas casser la progression existante."
            ));
        }

        validateTable(issues, section.table, `${field} · tableau 1`);
        validateTable(issues, section.table2, `${field} · tableau 2`);
        section.examples.forEach((example, exampleIndex) => {
            requireText(
                issues,
                `${field} · exemple ${exampleIndex + 1}`,
                example.fr,
                2
            );
        });
    });

    grammar.exercises.forEach((section, index) => {
        const field = section.type === "quiz"
            ? `Quiz ${index + 1}`
            : `Exercice ${index + 1}`;
        requireText(issues, field, section.id, 3);
        requireText(issues, field, section.titleFr, 2);

        if (
            grammar.contentKey
            && section.id
            && !section.id.startsWith(`${grammar.contentKey}-`)
        ) {
            issues.push(warningIssue(
                field,
                "Identifiant legacy hors préfixe : conservez-le pour ne pas casser la progression existante."
            ));
        }
        if (section.questions.length === 0) {
            issues.push(errorIssue(field, "Ajoutez au moins une question."));
        }
        if (section.displayCount.trim()) {
            requireInteger(
                issues,
                `${field} · questions affichées`,
                section.displayCount,
                1,
                Math.max(1, section.questions.length)
            );
        }
        section.questions.forEach((question, questionIndex) => {
            validateQuestion(
                issues,
                question,
                `${field} · question ${questionIndex + 1}`
            );
        });
    });

    if (Number(grammar.exerciseCount) > 0 && grammar.exercises.length === 0) {
        issues.push(warningIssue(
            "Exercices",
            "Des exercices sont annoncés dans le catalogue mais aucun exercice jouable n’est joint."
        ));
    }
    if (!grammar.catalogTitleFa.trim() || !grammar.titleFa.trim()) {
        issues.push(warningIssue(
            "Titres persans",
            "Ajoutez les titres persans du catalogue et de la leçon."
        ));
    }
    if (grammar.lessons.some(section => !section.titleFa.trim())) {
        issues.push(warningIssue(
            "Sections persanes",
            "Certaines sections n’ont pas encore de titre persan."
        ));
    }

    return issues;
}

function getAdminGrammarCompletion(
    issues: readonly AdminGrammarValidationIssue[]
): number {
    const errors = issues.filter(issue => issue.severity === "error").length;
    const warnings = issues.length - errors;
    return Math.max(0, 100 - errors * 8 - warnings * 3);
}

function validatePrerequisites(
    issues: AdminGrammarValidationIssue[],
    grammar: AdminGrammarEditorValue,
    availableItems: readonly AdminContentItemRpcRow[] | undefined
): void {
    const normalized = grammar.prerequisites.map(value => value.trim());

    if (new Set(normalized).size !== normalized.length) {
        issues.push(errorIssue("Prérequis", "Chaque prérequis doit être unique."));
    }
    if (normalized.includes(grammar.contentKey.trim())) {
        issues.push(errorIssue("Prérequis", "Une leçon ne peut pas dépendre d’elle-même."));
    }

    if (!availableItems) {
        return;
    }

    normalized.filter(Boolean).forEach(contentKey => {
        const target = availableItems.find(item =>
            item.content_type === "grammar_lesson"
            && item.content_key === contentKey
            && item.archived_at === null
        );

        if (!target) {
            issues.push(errorIssue(
                "Prérequis",
                `La leçon ${contentKey} n’existe pas dans l’inventaire.`
            ));
        } else if (target.published_revision_number === null) {
            issues.push(errorIssue(
                "Prérequis",
                `Publiez d’abord la leçon prérequise ${contentKey}.`
            ));
        }
    });
}

function validateSectionIds(
    issues: AdminGrammarValidationIssue[],
    grammar: AdminGrammarEditorValue
): void {
    const ids = [
        ...grammar.lessons.map(section => section.id.trim()),
        ...grammar.exercises.map(section => section.id.trim())
    ].filter(Boolean);

    if (new Set(ids).size !== ids.length) {
        issues.push(errorIssue(
            "Identifiants de sections",
            "Les sections, exercices et quiz doivent avoir des identifiants uniques."
        ));
    }
}

function validateTable(
    issues: AdminGrammarValidationIssue[],
    table: AdminGrammarTableValue | null,
    field: string
): void {
    if (!table) {
        return;
    }
    if (table.headers.length === 0 || table.headers.some(value => !value.trim())) {
        issues.push(errorIssue(field, "Chaque colonne doit avoir un en-tête."));
    }
    if (table.rows.length === 0) {
        issues.push(errorIssue(field, "Ajoutez au moins une ligne."));
    }
    if (table.rows.some(row =>
        row.length !== table.headers.length
        || row.some(value => !value.trim())
    )) {
        issues.push(errorIssue(
            field,
            "Chaque ligne doit remplir exactement toutes les colonnes."
        ));
    }
}

function validateQuestion(
    issues: AdminGrammarValidationIssue[],
    question: AdminGrammarQuestionValue,
    field: string
): void {
    requireText(issues, field, question.question, 3);

    switch (question.type) {
        case "mcq":
        case "binary": {
            const options = question.options.map(value => value.trim());
            if (
                options.length < 2
                || options.some(value => !value)
                || new Set(options).size !== options.length
            ) {
                issues.push(errorIssue(
                    field,
                    "Les réponses proposées doivent être non vides et uniques."
                ));
            }
            if (question.type === "binary" && options.length !== 2) {
                issues.push(errorIssue(field, "Une question binaire doit avoir deux choix."));
            }
            const correct = parseInteger(question.correctIndex);
            if (correct === null || correct < 0 || correct >= options.length) {
                issues.push(errorIssue(field, "Choisissez une réponse correcte valide."));
            }
            return;
        }
        case "fill_blank":
            requireText(issues, field, question.answer, 1);
            return;
        case "ordering":
            if (
                question.words.length < 2
                || question.words.some(value => !value.trim())
                || !sameMultiset(question.words, question.correctOrder)
            ) {
                issues.push(errorIssue(
                    field,
                    "L’ordre correct doit être une permutation exacte des mots proposés."
                ));
            }
    }
}

function sameMultiset(left: readonly string[], right: readonly string[]): boolean {
    if (left.length !== right.length) {
        return false;
    }
    const normalize = (values: readonly string[]) =>
        [...values].map(value => value.trim()).sort();
    return JSON.stringify(normalize(left)) === JSON.stringify(normalize(right));
}

function requireText(
    issues: AdminGrammarValidationIssue[],
    field: string,
    value: string,
    minimum: number
): void {
    if (value.trim().length < minimum) {
        issues.push(errorIssue(
            field,
            `Ce champ doit contenir au moins ${minimum} caractère(s).`
        ));
    }
}

function requireMatch(
    issues: AdminGrammarValidationIssue[],
    field: string,
    value: string,
    pattern: RegExp,
    message: string
): void {
    if (!pattern.test(value.trim())) {
        issues.push(errorIssue(field, message));
    }
}

function requireInteger(
    issues: AdminGrammarValidationIssue[],
    field: string,
    value: string,
    minimum: number,
    maximum: number
): void {
    const parsed = parseInteger(value);
    if (parsed === null || parsed < minimum || parsed > maximum) {
        issues.push(errorIssue(
            field,
            `Saisissez un nombre entier entre ${minimum} et ${maximum}.`
        ));
    }
}

function parseInteger(value: string): number | null {
    if (!/^\d+$/u.test(value.trim())) {
        return null;
    }
    const parsed = Number(value);
    return Number.isSafeInteger(parsed) ? parsed : null;
}

function errorIssue(field: string, message: string): AdminGrammarValidationIssue {
    return { field, message, severity: "error" };
}

function warningIssue(field: string, message: string): AdminGrammarValidationIssue {
    return { field, message, severity: "warning" };
}

export {
    getAdminGrammarCompletion,
    grammarIdPattern,
    validateAdminGrammarEditor
};

export type {
    AdminGrammarValidationIssue
};
