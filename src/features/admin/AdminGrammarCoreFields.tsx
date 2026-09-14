import {
    useMemo,
    useState
} from "react";

import type {
    AdminContentItemRpcRow
} from "../../services/backend/database.types.js";

import {
    Button,
    Input,
    Select
} from "../../ui/components/Controls.js";

import {
    AdminEditorField
} from "./AdminEditorField.js";

import {
    grammarLevels
} from "./adminGrammarEditor.js";

import type {
    AdminGrammarEditorValue
} from "./adminGrammarEditor.js";

interface AdminGrammarCoreFieldsProps {
    availableItems: readonly AdminContentItemRpcRow[];
    value: AdminGrammarEditorValue;
    onChange: (value: AdminGrammarEditorValue) => void;
}

function AdminGrammarCoreFields({
    availableItems,
    value,
    onChange
}: AdminGrammarCoreFieldsProps) {
    const [selectedPrerequisite, setSelectedPrerequisite] = useState("");
    const prerequisiteOptions = useMemo(
        () => availableItems.filter(item =>
            item.content_type === "grammar_lesson"
            && item.content_key !== value.contentKey
            && item.archived_at === null
            && !value.prerequisites.includes(item.content_key)
        ),
        [availableItems, value.contentKey, value.prerequisites]
    );

    function update(
        field: keyof AdminGrammarEditorValue,
        nextValue: string | boolean
    ): void {
        onChange({
            ...value,
            [field]: nextValue
        });
    }

    return (
        <div className="space-y-5">
            <fieldset className="space-y-3 rounded-card border border-line p-4">
                <legend className="px-2 text-base font-bold text-ink">
                    Carte dans le catalogue
                </legend>
                <div className="grid gap-3 sm:grid-cols-2">
                    <AdminEditorField label="Titre du catalogue" required>
                        <Input
                            value={value.catalogTitleFr}
                            onChange={event => update("catalogTitleFr", event.target.value)}
                        />
                    </AdminEditorField>
                    <AdminEditorField label="Titre persan du catalogue">
                        <Input
                            dir="rtl"
                            value={value.catalogTitleFa}
                            onChange={event => update("catalogTitleFa", event.target.value)}
                        />
                    </AdminEditorField>
                    <AdminEditorField label="Niveau" required>
                        <Select
                            value={value.level}
                            onChange={event => update("level", event.target.value)}
                        >
                            {grammarLevels.map(level => (
                                <option key={level} value={level}>{level}</option>
                            ))}
                        </Select>
                    </AdminEditorField>
                    <AdminEditorField label="Module" required>
                        <Input
                            value={value.module}
                            onChange={event => update("module", event.target.value)}
                        />
                    </AdminEditorField>
                    <AdminEditorField label="Catégorie" required>
                        <Input
                            placeholder="base, temps, pronom…"
                            value={value.category}
                            onChange={event => update("category", event.target.value)}
                        />
                    </AdminEditorField>
                    <AdminEditorField label="Icône du catalogue" required>
                        <Input
                            maxLength={12}
                            value={value.catalogIcon}
                            onChange={event => update("catalogIcon", event.target.value)}
                        />
                    </AdminEditorField>
                    <AdminEditorField label="Durée estimée (minutes)" required>
                        <Input
                            min="1"
                            max="240"
                            type="number"
                            value={value.catalogEstimatedTime}
                            onChange={event => update("catalogEstimatedTime", event.target.value)}
                        />
                    </AdminEditorField>
                    <AdminEditorField label="Importance" required>
                        <Select
                            value={value.importance}
                            onChange={event => update("importance", event.target.value)}
                        >
                            {[1, 2, 3, 4, 5].map(importance => (
                                <option key={importance} value={importance}>{importance} / 5</option>
                            ))}
                        </Select>
                    </AdminEditorField>
                    <AdminEditorField label="Parties annoncées" required>
                        <Input
                            min="0"
                            type="number"
                            value={value.lessonCount}
                            onChange={event => update("lessonCount", event.target.value)}
                        />
                    </AdminEditorField>
                    <AdminEditorField label="Exercices annoncés" required>
                        <Input
                            min="0"
                            type="number"
                            value={value.exerciseCount}
                            onChange={event => update("exerciseCount", event.target.value)}
                        />
                    </AdminEditorField>
                </div>
                <label className="flex min-h-11 items-center gap-3 rounded-control border border-line px-3 py-2 text-sm font-semibold text-ink">
                    <input
                        checked={value.recommended}
                        className="h-5 w-5 accent-dino-600"
                        type="checkbox"
                        onChange={event => update("recommended", event.target.checked)}
                    />
                    Recommander cette leçon dans son niveau
                </label>

                <div className="rounded-control border border-line bg-line-soft p-3">
                    <h4 className="text-sm font-bold text-ink">Prérequis</h4>
                    {value.prerequisites.length ? (
                        <ul className="mt-2 flex flex-wrap gap-2">
                            {value.prerequisites.map(contentKey => (
                                <li
                                    className="flex items-center gap-2 rounded-full bg-surface px-3 py-1.5 text-xs font-semibold text-ink"
                                    key={contentKey}
                                >
                                    <span className="font-mono">{contentKey}</span>
                                    <button
                                        aria-label={`Retirer le prérequis ${contentKey}`}
                                        className="min-h-6 min-w-6 text-danger"
                                        type="button"
                                        onClick={() => onChange({
                                            ...value,
                                            prerequisites: value.prerequisites.filter(item => item !== contentKey)
                                        })}
                                    >
                                        ✕
                                    </button>
                                </li>
                            ))}
                        </ul>
                    ) : (
                        <p className="mt-2 text-xs text-muted">Aucun prérequis.</p>
                    )}
                    <div className="mt-3 flex flex-col gap-2 sm:flex-row">
                        <Select
                            aria-label="Leçon prérequise à ajouter"
                            value={selectedPrerequisite}
                            onChange={event => setSelectedPrerequisite(event.target.value)}
                        >
                            <option value="">Choisir une leçon…</option>
                            {prerequisiteOptions.map(item => (
                                <option key={item.content_key} value={item.content_key}>
                                    {item.content_key} · {item.title_fr}
                                    {item.published_revision_number === null ? " · brouillon" : ""}
                                </option>
                            ))}
                        </Select>
                        <Button
                            disabled={!selectedPrerequisite}
                            variant="secondary"
                            onClick={() => {
                                if (!selectedPrerequisite) {
                                    return;
                                }
                                onChange({
                                    ...value,
                                    prerequisites: [...value.prerequisites, selectedPrerequisite]
                                });
                                setSelectedPrerequisite("");
                            }}
                        >
                            + Ajouter
                        </Button>
                    </div>
                </div>
            </fieldset>

            <fieldset className="space-y-3 rounded-card border border-line p-4">
                <legend className="px-2 text-base font-bold text-ink">
                    En-tête de la leçon
                </legend>
                <div className="grid gap-3 sm:grid-cols-2">
                    <AdminEditorField label="Titre de la leçon" required>
                        <Input
                            value={value.titleFr}
                            onChange={event => update("titleFr", event.target.value)}
                        />
                    </AdminEditorField>
                    <AdminEditorField label="Titre persan de la leçon">
                        <Input
                            dir="rtl"
                            value={value.titleFa}
                            onChange={event => update("titleFa", event.target.value)}
                        />
                    </AdminEditorField>
                    <AdminEditorField label="Icône de la leçon" required>
                        <Input
                            maxLength={12}
                            value={value.icon}
                            onChange={event => update("icon", event.target.value)}
                        />
                    </AdminEditorField>
                    <AdminEditorField label="Durée de la leçon (minutes)" required>
                        <Input
                            min="1"
                            max="240"
                            type="number"
                            value={value.estimatedTime}
                            onChange={event => update("estimatedTime", event.target.value)}
                        />
                    </AdminEditorField>
                </div>
                <p className="text-xs leading-5 text-muted">
                    Le titre et l’icône peuvent volontairement différer de la carte du catalogue.
                </p>
            </fieldset>
        </div>
    );
}

export {
    AdminGrammarCoreFields
};
