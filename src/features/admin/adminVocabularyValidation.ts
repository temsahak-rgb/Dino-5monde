import type { AdminEditorialIssue } from "./AdminEditorialQuality.js";
import type {
    AdminVocabularyEditorValue,
    AdminVocabularyStoryValue
} from "./adminVocabularyEditor.js";
import { vocabularyLevels } from "./adminVocabularyEditor.js";

function validateAdminVocabularyEditor(value: AdminVocabularyEditorValue): AdminEditorialIssue[] {
    const issues: AdminEditorialIssue[] = [];
    const id = value.contentKey.trim();
    if (!/^[\p{L}\p{N}]+(?:[_-][\p{L}\p{N}]+)*$/u.test(id)) {
        issues.push(error("Identifiant", "Utilisez uniquement des lettres, chiffres, tirets ou underscores, sans espace."));
    }
    if (!vocabularyLevels.includes(value.level as typeof vocabularyLevels[number])) {
        issues.push(error("Niveau", "Choisissez un niveau de A1 à C2."));
    }
    requireText(issues, "Titre catalogue", value.catalogTitleFr);
    requireText(issues, "Titre du pack", value.detailTitleFr);
    if (!value.words.length) issues.push(error("Mots", "Ajoutez au moins un mot."));

    const seen = new Set<string>();
    value.words.forEach((word, index) => {
        const field = `Mot ${index + 1}`;
        requireText(issues, `${field} · français`, word.fr);
        requireText(issues, `${field} · persan`, word.fa);
        const normalized = word.fr.normalize("NFKC").trim().toLocaleLowerCase("fr");
        if (normalized && seen.has(normalized)) issues.push(error(field, "Ce mot français apparaît déjà dans le pack."));
        seen.add(normalized);
        if (word.difficulty.trim() && !/^[1-6]$/u.test(word.difficulty.trim())) {
            issues.push(error(`${field} · difficulté`, "Utilisez un entier de 1 à 6, ou laissez le champ vide."));
        }
    });

    validateStory(value.simpleStory, "Histoire simple", issues);
    validateStory(value.literaryStory, "Histoire littéraire", issues);
    if (!value.simpleStory && !value.literaryStory) {
        issues.push(warning("Histoires", "Aucune histoire n’est encore proposée dans ce pack."));
    }
    if (value.words.length < 3) {
        issues.push(warning("Jeux", "Trois mots au minimum sont nécessaires pour rendre les mini-jeux intéressants."));
    }

    if (value.quiz) {
        const quiz = value.quiz;
        if (!quiz.questions.length) issues.push(error("Quiz", "Ajoutez au moins une question ou désactivez le quiz."));
        const displayCount = parseInteger(quiz.displayCount);
        if (displayCount === null || displayCount < 1 || displayCount > quiz.questions.length) {
            issues.push(error("Quiz · nombre affiché", "Choisissez un entier compris dans le nombre de questions."));
        }
        quiz.questions.forEach((question, index) => {
            const field = `Quiz · question ${index + 1}`;
            requireText(issues, field, question.question);
            const options = question.options.map(option => option.trim());
            if (options.length < 2 || options.some(option => !option) || new Set(options).size !== options.length) {
                issues.push(error(field, "Les réponses doivent être non vides, distinctes et au moins deux."));
            }
            if (question.type === "binary" && options.length !== 2) {
                issues.push(error(field, "Une question Vrai/Faux doit contenir exactement deux réponses."));
            }
            const correct = parseInteger(question.correctIndex);
            if (correct === null || correct < 0 || correct >= options.length) {
                issues.push(error(field, "Choisissez une réponse correcte valide."));
            }
        });
    } else {
        issues.push(warning("Quiz", "Aucun quiz n’est encore proposé dans ce pack."));
    }

    if (!value.catalogTitleFa.trim() || !value.detailTitleFa.trim()) {
        issues.push(warning("Persan", "Complétez les titres persans avant la mise en avant du pack."));
    }
    if (!value.catalogIcon.trim() || !value.detailIcon.trim()) {
        issues.push(warning("Icône", "Une icône rend le pack plus facile à repérer."));
    }
    return issues;
}

function validateStory(story: AdminVocabularyStoryValue | null, label: string, issues: AdminEditorialIssue[]): void {
    if (!story) return;
    requireText(issues, `${label} · titre`, story.titleFr);
    const legacyMarkers = [...story.textFr.matchAll(/____\s*\((\d+)\)/gu)].map(match => Number(match[1]));
    const modernMarkers = [...story.textFr.matchAll(/\{\{BLANK_(\d+)\}\}/gu)].map(match => Number(match[1]));
    if (legacyMarkers.length) issues.push(warning(label, "Format historique détecté : il est conservé sans conversion automatique."));

    const ids = new Set<number>();
    story.blanks.forEach((blank, index) => {
        const field = `${label} · blanc ${index + 1}`;
        const id = parseInteger(blank.id);
        if (id === null || id < 1 || ids.has(id)) issues.push(error(field, "L’identifiant doit être un entier positif unique."));
        if (id !== null) ids.add(id);
        const options = blank.options.map(option => option.trim());
        if (options.length < 2 || options.some(option => !option) || new Set(options).size !== options.length) {
            issues.push(error(field, "Ajoutez au moins deux réponses non vides et distinctes."));
        }
        const correct = parseInteger(blank.correctIndex);
        if (correct === null || correct < 0 || correct >= options.length) issues.push(error(field, "Choisissez une bonne réponse valide."));
    });
    const markers = modernMarkers.length ? modernMarkers : legacyMarkers;
    if (markers.length && (markers.length !== story.blanks.length || markers.some(marker => !ids.has(marker)))) {
        issues.push(warning(label, "Les marqueurs du texte et les blancs ne correspondent pas exactement ; vérifiez-les avant une future normalisation."));
    }
}

function getAdminVocabularyCompletion(issues: readonly AdminEditorialIssue[]): number {
    return Math.max(0, 100 - issues.filter(issue => issue.severity === "error").length * 12 - issues.filter(issue => issue.severity === "warning").length * 4);
}
function requireText(issues: AdminEditorialIssue[], field: string, value: string): void { if (!value.trim()) issues.push(error(field, "Ce champ est obligatoire.")); }
function parseInteger(value: string): number | null { return /^\d+$/u.test(value.trim()) && Number.isSafeInteger(Number(value)) ? Number(value) : null; }
function error(field: string, message: string): AdminEditorialIssue { return { field, message, severity: "error" }; }
function warning(field: string, message: string): AdminEditorialIssue { return { field, message, severity: "warning" }; }

export { getAdminVocabularyCompletion, validateAdminVocabularyEditor };
