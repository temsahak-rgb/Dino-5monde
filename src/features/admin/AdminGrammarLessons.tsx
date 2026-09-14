import {
    Button,
    Input,
    Textarea
} from "../../ui/components/Controls.js";

import {
    AdminEditorField
} from "./AdminEditorField.js";

import {
    moveAdminItem
} from "./adminEditorCollection.js";

import {
    createEmptyGrammarLessonSection,
    createEmptyGrammarTable
} from "./adminGrammarEditor.js";

import type {
    AdminGrammarEditorValue,
    AdminGrammarLessonSectionValue,
    AdminGrammarTableValue
} from "./adminGrammarEditor.js";

interface AdminGrammarLessonsProps {
    lockedSectionIds: ReadonlySet<string>;
    value: AdminGrammarEditorValue;
    onChange: (value: AdminGrammarEditorValue) => void;
}

function AdminGrammarLessons({
    lockedSectionIds,
    value,
    onChange
}: AdminGrammarLessonsProps) {
    function updateSection(
        index: number,
        nextSection: AdminGrammarLessonSectionValue
    ): void {
        onChange({
            ...value,
            lessons: value.lessons.map((section, sectionIndex) =>
                sectionIndex === index ? nextSection : section
            )
        });
    }

    return (
        <details className="rounded-card border border-line bg-surface p-4" open>
            <summary className="cursor-pointer text-base font-bold text-ink">
                Sections pédagogiques · {value.lessons.length}
            </summary>
            <div className="mt-4 space-y-4">
                {value.lessons.map((section, index) => (
                    <GrammarLessonSectionEditor
                        index={index}
                        key={index}
                        lockId={lockedSectionIds.has(section.id)}
                        section={section}
                        total={value.lessons.length}
                        onChange={nextSection => updateSection(index, nextSection)}
                        onMove={direction => onChange({
                            ...value,
                            lessons: moveAdminItem(value.lessons, index, direction)
                        })}
                        onRemove={lockedSectionIds.has(section.id) ? undefined : () => onChange({
                            ...value,
                            lessons: value.lessons.filter((_, sectionIndex) => sectionIndex !== index)
                        })}
                    />
                ))}

                <Button
                    variant="secondary"
                    onClick={() => {
                        const lessons = [
                            ...value.lessons,
                            createEmptyGrammarLessonSection(
                                value.contentKey,
                                value.lessons.length + 1
                            )
                        ];
                        onChange({
                            ...value,
                            lessonCount: value.lessonCount === ""
                                || Number(value.lessonCount) === value.lessons.length
                                ? String(lessons.length)
                                : value.lessonCount,
                            lessons
                        });
                    }}
                >
                    + Ajouter une section de cours
                </Button>
            </div>
        </details>
    );
}

function GrammarLessonSectionEditor({
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
    section: AdminGrammarLessonSectionValue;
    total: number;
    onChange: (section: AdminGrammarLessonSectionValue) => void;
    onMove: (direction: -1 | 1) => void;
    onRemove?: () => void;
}) {
    function update(
        field: keyof AdminGrammarLessonSectionValue,
        nextValue: string
    ): void {
        onChange({ ...section, [field]: nextValue });
    }

    return (
        <details
            className="rounded-card border border-line bg-line-soft p-3 sm:p-4"
            open={index === 0}
        >
            <summary className="cursor-pointer font-semibold text-ink">
                {index + 1}. {section.titleFr || "Nouvelle section"}
            </summary>
            <div className="mt-4 space-y-4">
                <div className="grid gap-3 sm:grid-cols-2">
                    <AdminEditorField
                        hint={lockId ? "stable après publication" : undefined}
                        label="Identifiant de section"
                        required
                    >
                        <Input
                            aria-label={`Identifiant de la section ${index + 1}`}
                            className="font-mono"
                            disabled={lockId}
                            value={section.id}
                            onChange={event => update("id", event.target.value)}
                        />
                    </AdminEditorField>
                    <AdminEditorField label="Titre français" required>
                        <Input
                            aria-label={`Titre français de la section ${index + 1}`}
                            value={section.titleFr}
                            onChange={event => update("titleFr", event.target.value)}
                        />
                    </AdminEditorField>
                    <AdminEditorField label="Titre persan">
                        <Input
                            aria-label={`Titre persan de la section ${index + 1}`}
                            dir="rtl"
                            value={section.titleFa}
                            onChange={event => update("titleFa", event.target.value)}
                        />
                    </AdminEditorField>
                </div>

                <AdminEditorField
                    hint={`${section.content.trim().length} caractères`}
                    label="Cours en mini-Markdown"
                    required
                >
                    <Textarea
                        aria-label={`Cours de la section ${index + 1}`}
                        className="min-h-52 resize-y leading-7"
                        value={section.content}
                        onChange={event => update("content", event.target.value)}
                    />
                </AdminEditorField>

                <GrammarExamplesEditor section={section} onChange={onChange} />
                <GrammarTableEditor
                    label="Tableau principal"
                    table={section.table}
                    onChange={table => onChange({ ...section, table })}
                />
                <GrammarTableEditor
                    label="Second tableau"
                    table={section.table2}
                    onChange={table2 => onChange({ ...section, table2 })}
                />

                <div className="grid gap-3 sm:grid-cols-2">
                    <AdminEditorField label="Note française">
                        <Textarea
                            aria-label={`Note française de la section ${index + 1}`}
                            className="min-h-28 resize-y"
                            value={section.note}
                            onChange={event => update("note", event.target.value)}
                        />
                    </AdminEditorField>
                    <AdminEditorField label="Note persane">
                        <Textarea
                            aria-label={`Note persane de la section ${index + 1}`}
                            className="min-h-28 resize-y"
                            dir="rtl"
                            value={section.noteFa}
                            onChange={event => update("noteFa", event.target.value)}
                        />
                    </AdminEditorField>
                </div>

                <div className="flex flex-wrap gap-2 border-t border-line pt-3">
                    <Button
                        aria-label={`Monter la section ${index + 1}`}
                        disabled={index === 0}
                        variant="ghost"
                        onClick={() => onMove(-1)}
                    >
                        ↑ Monter
                    </Button>
                    <Button
                        aria-label={`Descendre la section ${index + 1}`}
                        disabled={index === total - 1}
                        variant="ghost"
                        onClick={() => onMove(1)}
                    >
                        ↓ Descendre
                    </Button>
                    {onRemove ? (
                        <Button variant="ghost" onClick={onRemove}>
                            Supprimer cette section
                        </Button>
                    ) : (
                        <span className="self-center text-xs font-semibold text-muted">
                            Section publiée protégée
                        </span>
                    )}
                </div>
            </div>
        </details>
    );
}

function GrammarExamplesEditor({
    section,
    onChange
}: {
    section: AdminGrammarLessonSectionValue;
    onChange: (section: AdminGrammarLessonSectionValue) => void;
}) {
    return (
        <div className="rounded-control border border-line bg-surface p-3">
            <h4 className="text-sm font-bold text-ink">
                Exemples · {section.examples.length}
            </h4>
            <div className="mt-3 space-y-3">
                {section.examples.map((example, index) => (
                    <div className="grid gap-2 sm:grid-cols-[1fr_1fr_auto]" key={index}>
                        <Input
                            aria-label={`Exemple français ${index + 1}`}
                            placeholder="Exemple français"
                            value={example.fr}
                            onChange={event => onChange({
                                ...section,
                                examples: section.examples.map((item, itemIndex) =>
                                    itemIndex === index
                                        ? { ...item, fr: event.target.value }
                                        : item
                                )
                            })}
                        />
                        <Input
                            aria-label={`Exemple persan ${index + 1}`}
                            dir="rtl"
                            placeholder="ترجمه فارسی"
                            value={example.fa}
                            onChange={event => onChange({
                                ...section,
                                examples: section.examples.map((item, itemIndex) =>
                                    itemIndex === index
                                        ? { ...item, fa: event.target.value }
                                        : item
                                )
                            })}
                        />
                        <Button
                            aria-label={`Supprimer l’exemple ${index + 1}`}
                            variant="ghost"
                            onClick={() => onChange({
                                ...section,
                                examples: section.examples.filter((_, itemIndex) => itemIndex !== index)
                            })}
                        >
                            ✕
                        </Button>
                    </div>
                ))}
                <Button
                    variant="secondary"
                    onClick={() => onChange({
                        ...section,
                        examples: [...section.examples, {
                            fa: "",
                            fr: "",
                            originalPayload: null
                        }]
                    })}
                >
                    + Ajouter un exemple
                </Button>
            </div>
        </div>
    );
}

function GrammarTableEditor({
    label,
    table,
    onChange
}: {
    label: string;
    table: AdminGrammarTableValue | null;
    onChange: (table: AdminGrammarTableValue | null) => void;
}) {
    if (!table) {
        return (
            <Button variant="secondary" onClick={() => onChange(createEmptyGrammarTable())}>
                + Ajouter : {label.toLocaleLowerCase("fr")}
            </Button>
        );
    }

    return (
        <div className="rounded-control border border-line bg-surface p-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
                <h4 className="text-sm font-bold text-ink">{label}</h4>
                <Button variant="ghost" onClick={() => onChange(null)}>
                    Supprimer le tableau
                </Button>
            </div>
            <div className="mt-3 overflow-x-auto pb-2">
                <div
                    className="grid min-w-max gap-2"
                    style={{
                        gridTemplateColumns: `repeat(${Math.max(table.headers.length, 1)}, minmax(11rem, 1fr)) 3rem`
                    }}
                >
                    {table.headers.map((header, columnIndex) => (
                        <Input
                            aria-label={`${label}, en-tête ${columnIndex + 1}`}
                            className="font-semibold"
                            key={`header:${columnIndex}`}
                            placeholder={`Colonne ${columnIndex + 1}`}
                            value={header}
                            onChange={event => onChange({
                                ...table,
                                headers: table.headers.map((item, itemIndex) =>
                                    itemIndex === columnIndex ? event.target.value : item
                                )
                            })}
                        />
                    ))}
                    <span aria-hidden="true" />

                    {table.rows.flatMap((row, rowIndex) => [
                        ...row.map((cell, columnIndex) => (
                            <Input
                                aria-label={`${label}, ligne ${rowIndex + 1}, colonne ${columnIndex + 1}`}
                                key={`cell:${rowIndex}:${columnIndex}`}
                                value={cell}
                                onChange={event => onChange({
                                    ...table,
                                    rows: table.rows.map((item, itemIndex) =>
                                        itemIndex === rowIndex
                                            ? item.map((value, valueIndex) =>
                                                valueIndex === columnIndex ? event.target.value : value
                                            )
                                            : item
                                    )
                                })}
                            />
                        )),
                        <Button
                            aria-label={`${label}, supprimer la ligne ${rowIndex + 1}`}
                            key={`remove:${rowIndex}`}
                            variant="ghost"
                            onClick={() => onChange({
                                ...table,
                                rows: table.rows.filter((_, itemIndex) => itemIndex !== rowIndex)
                            })}
                        >
                            ✕
                        </Button>
                    ])}
                </div>
            </div>
            <div className="mt-2 flex flex-wrap gap-2">
                <Button
                    variant="secondary"
                    onClick={() => onChange({
                        ...table,
                        headers: [...table.headers, ""],
                        rows: table.rows.map(row => [...row, ""])
                    })}
                >
                    + Colonne
                </Button>
                <Button
                    disabled={table.headers.length <= 1}
                    variant="ghost"
                    onClick={() => onChange({
                        ...table,
                        headers: table.headers.slice(0, -1),
                        rows: table.rows.map(row => row.slice(0, -1))
                    })}
                >
                    − Dernière colonne
                </Button>
                <Button
                    variant="secondary"
                    onClick={() => onChange({
                        ...table,
                        rows: [...table.rows, table.headers.map(() => "")]
                    })}
                >
                    + Ligne
                </Button>
            </div>
        </div>
    );
}

export {
    AdminGrammarLessons
};
