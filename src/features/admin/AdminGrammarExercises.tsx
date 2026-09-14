import { useId } from "react";

import { Button, Input, Select, Textarea } from "../../ui/components/Controls.js";

import { AdminEditorField } from "./AdminEditorField.js";
import { moveAdminItem } from "./adminEditorCollection.js";
import {
    createEmptyGrammarExerciseSection,
    createEmptyGrammarQuestion
} from "./adminGrammarEditor.js";

import type {
    AdminGrammarEditorValue,
    AdminGrammarExerciseSectionValue,
    AdminGrammarQuestionType,
    AdminGrammarQuestionValue
} from "./adminGrammarEditor.js";

interface AdminGrammarExercisesProps {
    lockedSectionIds: ReadonlySet<string>;
    value: AdminGrammarEditorValue;
    onChange: (value: AdminGrammarEditorValue) => void;
}

const questionTypeLabels: Record<AdminGrammarQuestionType, string> = {
    binary: "Vrai / faux",
    fill_blank: "Texte à compléter",
    mcq: "Choix multiple",
    ordering: "Remise en ordre"
};

function AdminGrammarExercises({
    lockedSectionIds,
    value,
    onChange
}: AdminGrammarExercisesProps) {
    function updateSection(index: number, next: AdminGrammarExerciseSectionValue): void {
        onChange({
            ...value,
            exercises: value.exercises.map((section, sectionIndex) =>
                sectionIndex === index ? next : section
            )
        });
    }

    function append(type: "exercise" | "quiz"): void {
        onChange({
            ...value,
            exercises: [
                ...value.exercises,
                createEmptyGrammarExerciseSection(
                    value.contentKey,
                    value.exercises.length + 1,
                    type
                )
            ]
        });
    }

    return (
        <details className="rounded-card border border-line bg-surface p-4">
            <summary className="cursor-pointer text-base font-bold text-ink">
                Exercices jouables · {value.exercises.length}
            </summary>
            <p className="mt-3 text-xs leading-5 text-muted">
                Ces blocs sont réellement jouables. Le nombre annoncé dans le catalogue reste un objectif éditorial distinct.
            </p>
            <div className="mt-4 space-y-4">
                {value.exercises.map((section, index) => (
                    <GrammarExerciseSectionEditor
                        index={index}
                        key={index}
                        lockId={lockedSectionIds.has(section.id)}
                        section={section}
                        total={value.exercises.length}
                        onChange={next => updateSection(index, next)}
                        onMove={direction => onChange({
                            ...value,
                            exercises: moveAdminItem(value.exercises, index, direction)
                        })}
                        onRemove={lockedSectionIds.has(section.id) ? undefined : () => onChange({
                            ...value,
                            exercises: value.exercises.filter((_, itemIndex) => itemIndex !== index)
                        })}
                    />
                ))}
                <div className="flex flex-wrap gap-2">
                    <Button variant="secondary" onClick={() => append("exercise")}>
                        + Ajouter un exercice
                    </Button>
                    <Button variant="secondary" onClick={() => append("quiz")}>
                        + Ajouter un quiz
                    </Button>
                </div>
            </div>
        </details>
    );
}

function GrammarExerciseSectionEditor({
    index,
    lockId,
    section,
    total,
    onChange,
    onMove,
    onRemove
}: {
    index: number;
    lockId: boolean;
    section: AdminGrammarExerciseSectionValue;
    total: number;
    onChange: (section: AdminGrammarExerciseSectionValue) => void;
    onMove: (direction: -1 | 1) => void;
    onRemove?: () => void;
}) {
    const update = (
        field: keyof AdminGrammarExerciseSectionValue,
        nextValue: string
    ): void => onChange({ ...section, [field]: nextValue });

    return (
        <details className="rounded-card border border-line bg-line-soft p-3 sm:p-4">
            <summary className="cursor-pointer font-semibold text-ink">
                {index + 1}. {section.titleFr || (section.type === "quiz" ? "Nouveau quiz" : "Nouvel exercice")}
            </summary>
            <div className="mt-4 space-y-4">
                <div className="grid gap-3 sm:grid-cols-2">
                    <AdminEditorField label="Type" required>
                        <Select
                            aria-label={`Type du bloc d’exercices ${index + 1}`}
                            value={section.type}
                            onChange={event => onChange({
                                ...section,
                                type: event.target.value as "exercise" | "quiz"
                            })}
                        >
                            <option value="exercise">Exercice</option>
                            <option value="quiz">Quiz</option>
                        </Select>
                    </AdminEditorField>
                    <AdminEditorField
                        hint={lockId ? "stable après publication" : undefined}
                        label="Identifiant"
                        required
                    >
                        <Input
                            aria-label={`Identifiant du bloc d’exercices ${index + 1}`}
                            className="font-mono"
                            disabled={lockId}
                            value={section.id}
                            onChange={event => update("id", event.target.value)}
                        />
                    </AdminEditorField>
                    <AdminEditorField label="Titre français" required>
                        <Input
                            aria-label={`Titre français du bloc d’exercices ${index + 1}`}
                            value={section.titleFr}
                            onChange={event => update("titleFr", event.target.value)}
                        />
                    </AdminEditorField>
                    <AdminEditorField label="Titre persan">
                        <Input
                            aria-label={`Titre persan du bloc d’exercices ${index + 1}`}
                            dir="rtl"
                            value={section.titleFa}
                            onChange={event => update("titleFa", event.target.value)}
                        />
                    </AdminEditorField>
                    <AdminEditorField hint="vide = toutes" label="Questions affichées">
                        <Input
                            aria-label={`Questions affichées du bloc ${index + 1}`}
                            min="1"
                            type="number"
                            value={section.displayCount}
                            onChange={event => update("displayCount", event.target.value)}
                        />
                    </AdminEditorField>
                </div>

                <div className="space-y-3">
                    {section.questions.map((question, questionIndex) => (
                        <GrammarQuestionEditor
                            index={questionIndex}
                            key={questionIndex}
                            question={question}
                            total={section.questions.length}
                            onChange={next => onChange({
                                ...section,
                                questions: section.questions.map((item, itemIndex) =>
                                    itemIndex === questionIndex ? next : item
                                )
                            })}
                            onMove={direction => onChange({
                                ...section,
                                questions: moveAdminItem(section.questions, questionIndex, direction)
                            })}
                            onRemove={() => onChange({
                                ...section,
                                questions: section.questions.filter((_, itemIndex) => itemIndex !== questionIndex)
                            })}
                        />
                    ))}
                    <Button
                        variant="secondary"
                        onClick={() => onChange({
                            ...section,
                            questions: [...section.questions, createEmptyGrammarQuestion()]
                        })}
                    >
                        + Ajouter une question
                    </Button>
                </div>

                <div className="flex flex-wrap gap-2 border-t border-line pt-3">
                    <Button disabled={index === 0} variant="ghost" onClick={() => onMove(-1)}>↑ Monter</Button>
                    <Button disabled={index === total - 1} variant="ghost" onClick={() => onMove(1)}>↓ Descendre</Button>
                    {onRemove ? (
                        <Button variant="ghost" onClick={onRemove}>Supprimer ce bloc</Button>
                    ) : (
                        <span className="self-center text-xs font-semibold text-muted">
                            Bloc publié protégé
                        </span>
                    )}
                </div>
            </div>
        </details>
    );
}

function GrammarQuestionEditor({
    index,
    question,
    total,
    onChange,
    onMove,
    onRemove
}: {
    index: number;
    question: AdminGrammarQuestionValue;
    total: number;
    onChange: (question: AdminGrammarQuestionValue) => void;
    onMove: (direction: -1 | 1) => void;
    onRemove: () => void;
}) {
    const correctAnswerName = useId();
    const update = (
        field: keyof AdminGrammarQuestionValue,
        nextValue: string
    ): void => onChange({ ...question, [field]: nextValue });

    return (
        <fieldset className="space-y-3 rounded-control border border-line bg-surface p-3">
            <legend className="px-2 text-sm font-bold text-ink">Question {index + 1}</legend>
            <div className="grid gap-3 sm:grid-cols-2">
                <AdminEditorField label="Format" required>
                    <Select
                        aria-label={`Format de la question ${index + 1}`}
                        value={question.type}
                        onChange={event => onChange(resetQuestionType(
                            question,
                            event.target.value as AdminGrammarQuestionType
                        ))}
                    >
                        {Object.entries(questionTypeLabels).map(([type, label]) => (
                            <option key={type} value={type}>{label}</option>
                        ))}
                    </Select>
                </AdminEditorField>
                <AdminEditorField label="Énoncé" required>
                    <Input
                        aria-label={`Énoncé de la question ${index + 1}`}
                        value={question.question}
                        onChange={event => update("question", event.target.value)}
                    />
                </AdminEditorField>
            </div>

            <QuestionAnswerFields
                correctAnswerName={correctAnswerName}
                question={question}
                onChange={onChange}
            />

            <div className="grid gap-3 sm:grid-cols-2">
                <AdminEditorField label="Explication française">
                    <Textarea
                        aria-label={`Explication française de la question ${index + 1}`}
                        className="min-h-24 resize-y"
                        value={question.explanation}
                        onChange={event => update("explanation", event.target.value)}
                    />
                </AdminEditorField>
                <AdminEditorField label="Explication persane">
                    <Textarea
                        aria-label={`Explication persane de la question ${index + 1}`}
                        className="min-h-24 resize-y"
                        dir="rtl"
                        value={question.explanationFa}
                        onChange={event => update("explanationFa", event.target.value)}
                    />
                </AdminEditorField>
            </div>

            <div className="flex flex-wrap gap-2">
                <Button disabled={index === 0} variant="ghost" onClick={() => onMove(-1)}>↑</Button>
                <Button disabled={index === total - 1} variant="ghost" onClick={() => onMove(1)}>↓</Button>
                <Button variant="ghost" onClick={onRemove}>Supprimer la question</Button>
            </div>
        </fieldset>
    );
}

function QuestionAnswerFields({
    correctAnswerName,
    question,
    onChange
}: {
    correctAnswerName: string;
    question: AdminGrammarQuestionValue;
    onChange: (question: AdminGrammarQuestionValue) => void;
}) {
    if (question.type === "fill_blank") {
        return (
            <AdminEditorField label="Réponse attendue" required>
                <Input value={question.answer} onChange={event => onChange({ ...question, answer: event.target.value })} />
            </AdminEditorField>
        );
    }

    if (question.type === "ordering") {
        return (
            <div className="grid gap-3 sm:grid-cols-2">
                <AdminEditorField hint="séparés par |" label="Mots proposés" required>
                    <Input value={question.words.join(" | ")} onChange={event => onChange({ ...question, words: splitPipeList(event.target.value) })} />
                </AdminEditorField>
                <AdminEditorField hint="mêmes mots, dans le bon ordre" label="Ordre correct" required>
                    <Input value={question.correctOrder.join(" | ")} onChange={event => onChange({ ...question, correctOrder: splitPipeList(event.target.value) })} />
                </AdminEditorField>
            </div>
        );
    }

    return (
        <div className="space-y-2">
            <p className="text-sm font-bold text-ink">Réponses proposées</p>
            {question.options.map((option, optionIndex) => (
                <div className="grid gap-2 sm:grid-cols-[auto_1fr_auto]" key={optionIndex}>
                    <input
                        aria-label={`Marquer la réponse ${optionIndex + 1} comme correcte`}
                        checked={Number(question.correctIndex) === optionIndex}
                        className="h-5 w-5 self-center accent-dino-600"
                        name={correctAnswerName}
                        type="radio"
                        onChange={() => onChange({ ...question, correctIndex: String(optionIndex) })}
                    />
                    <Input
                        aria-label={`Réponse proposée ${optionIndex + 1}`}
                        value={option}
                        onChange={event => onChange({
                            ...question,
                            options: question.options.map((item, itemIndex) =>
                                itemIndex === optionIndex ? event.target.value : item
                            )
                        })}
                    />
                    <Button
                        aria-label={`Supprimer la réponse ${optionIndex + 1}`}
                        disabled={question.type === "binary" || question.options.length <= 2}
                        variant="ghost"
                        onClick={() => onChange({
                            ...question,
                            correctIndex: "0",
                            options: question.options.filter((_, itemIndex) => itemIndex !== optionIndex)
                        })}
                    >✕</Button>
                </div>
            ))}
            {question.type === "mcq" ? (
                <Button variant="secondary" onClick={() => onChange({ ...question, options: [...question.options, ""] })}>
                    + Ajouter une réponse
                </Button>
            ) : null}
        </div>
    );
}

function resetQuestionType(
    question: AdminGrammarQuestionValue,
    type: AdminGrammarQuestionType
): AdminGrammarQuestionValue {
    return {
        ...question,
        answer: "",
        correctIndex: "0",
        correctOrder: [],
        options: type === "binary" ? ["Vrai", "Faux"] : type === "mcq" ? ["", ""] : [],
        type,
        words: []
    };
}

function splitPipeList(value: string): string[] {
    return value.split("|").map(item => item.trim());
}

export { AdminGrammarExercises };
