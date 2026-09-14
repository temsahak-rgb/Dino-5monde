import {
    useEffect,
    useState
} from "react";

import {
    GrammarSectionContent
} from "../grammar/GrammarLessonContent.js";

import type {
    Language,
    LessonContentSection
} from "../../types/global.js";

import {
    Badge,
    Button
} from "../../ui/components/Controls.js";

import {
    AdminEditorialQuality
} from "./AdminEditorialQuality.js";

import {
    createGrammarLessonPreview
} from "./adminGrammarEditor.js";

import type {
    AdminGrammarEditorValue
} from "./adminGrammarEditor.js";

import {
    getAdminGrammarCompletion
} from "./adminGrammarValidation.js";

import type {
    AdminGrammarValidationIssue
} from "./adminGrammarValidation.js";

function AdminGrammarPreview({
    issues,
    value
}: {
    issues: readonly AdminGrammarValidationIssue[];
    value: AdminGrammarEditorValue;
}) {
    const [language, setLanguage] = useState<Language>("fr");
    const [sectionIndex, setSectionIndex] = useState(0);
    const lesson = createGrammarLessonPreview(value);
    const instructionalSections = lesson.sections.filter(
        (section): section is LessonContentSection => section.type === "lesson"
    );
    const currentSection = instructionalSections[Math.min(
        sectionIndex,
        Math.max(0, instructionalSections.length - 1)
    )];

    useEffect(() => {
        if (sectionIndex >= instructionalSections.length) {
            setSectionIndex(Math.max(0, instructionalSections.length - 1));
        }
    }, [instructionalSections.length, sectionIndex]);

    return (
        <div className="space-y-4">
            <AdminEditorialQuality
                completion={getAdminGrammarCompletion(issues)}
                issues={issues}
                label="de la leçon de grammaire"
                readyMessage="Cette leçon est prête à être publiée."
            />

            <details className="rounded-card border border-line bg-surface p-4">
                <summary className="cursor-pointer font-bold text-ink">
                    Aperçu de la leçon
                </summary>
                <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
                    <div className="flex gap-2" aria-label="Langue de l’aperçu">
                        <Button
                            aria-pressed={language === "fr"}
                            variant={language === "fr" ? "primary" : "secondary"}
                            onClick={() => setLanguage("fr")}
                        >
                            Français
                        </Button>
                        <Button
                            aria-pressed={language === "fa"}
                            variant={language === "fa" ? "primary" : "secondary"}
                            onClick={() => setLanguage("fa")}
                        >
                            فارسی
                        </Button>
                    </div>
                    <div className="flex flex-wrap gap-2">
                        <Badge>{value.level || "—"}</Badge>
                        <Badge>{value.estimatedTime || "—"} min</Badge>
                        <Badge>{value.exercises.length} bloc(s) jouable(s)</Badge>
                    </div>
                </div>

                <div
                    className="mt-4 rounded-card border border-line bg-page p-3 sm:p-5"
                    dir={language === "fa" ? "rtl" : "ltr"}
                >
                    <div className="mb-5 border-b border-line pb-4">
                        <p className="text-3xl" aria-hidden="true">{value.icon || "📘"}</p>
                        <h3 className="mt-2 text-xl font-bold text-ink">
                            {language === "fa"
                                ? value.titleFa || value.titleFr || "Nouvelle leçon"
                                : value.titleFr || "Nouvelle leçon"}
                        </h3>
                    </div>

                    {instructionalSections.length > 1 ? (
                        <div className="mb-4 flex flex-wrap gap-2" aria-label="Section à prévisualiser">
                            {instructionalSections.map((section, index) => (
                                <Button
                                    aria-pressed={sectionIndex === index}
                                    key={section.id}
                                    variant={sectionIndex === index ? "primary" : "secondary"}
                                    onClick={() => setSectionIndex(index)}
                                >
                                    {index + 1}
                                </Button>
                            ))}
                        </div>
                    ) : null}

                    {currentSection ? (
                        <section>
                            <h4 className="mb-3 text-lg font-bold text-ink">
                                {language === "fa"
                                    ? currentSection.title_fa || currentSection.title
                                    : currentSection.title}
                            </h4>
                            <GrammarSectionContent section={currentSection} />
                        </section>
                    ) : (
                        <p className="text-sm text-muted">
                            Ajoutez une section pédagogique pour voir le rendu réel.
                        </p>
                    )}
                </div>
            </details>
        </div>
    );
}

export { AdminGrammarPreview };
