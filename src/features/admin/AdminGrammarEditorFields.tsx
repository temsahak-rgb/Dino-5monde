import type {
    AdminContentItemRpcRow
} from "../../services/backend/database.types.js";

import {
    Textarea
} from "../../ui/components/Controls.js";

import {
    AdminGrammarCoreFields
} from "./AdminGrammarCoreFields.js";

import {
    AdminGrammarExercises
} from "./AdminGrammarExercises.js";

import {
    AdminGrammarLessons
} from "./AdminGrammarLessons.js";

import {
    AdminGrammarPreview
} from "./AdminGrammarPreview.js";

import {
    readAdminGrammarEditor,
    updateAdminGrammarEditor
} from "./adminGrammarEditor.js";

import type {
    AdminContentEditorValue
} from "./adminContentEditor.js";

import {
    validateAdminGrammarEditor
} from "./adminGrammarValidation.js";

function AdminGrammarEditorFields({
    availableItems,
    lockedSectionIds,
    value,
    onChange
}: {
    availableItems: readonly AdminContentItemRpcRow[];
    lockedSectionIds: ReadonlySet<string>;
    value: AdminContentEditorValue;
    onChange: (value: AdminContentEditorValue) => void;
}) {
    const grammar = readAdminGrammarEditor(value);
    const issues = validateAdminGrammarEditor(grammar, availableItems);
    const updateGrammar = (next: typeof grammar): void => {
        onChange(updateAdminGrammarEditor(value, next));
    };

    return (
        <div className="space-y-5">
            <AdminGrammarPreview issues={issues} value={grammar} />
            <AdminGrammarCoreFields
                availableItems={availableItems}
                value={grammar}
                onChange={updateGrammar}
            />
            <AdminGrammarLessons
                lockedSectionIds={lockedSectionIds}
                value={grammar}
                onChange={updateGrammar}
            />
            <AdminGrammarExercises
                lockedSectionIds={lockedSectionIds}
                value={grammar}
                onChange={updateGrammar}
            />

            <details className="rounded-card border border-line bg-line-soft p-4">
                <summary className="cursor-pointer text-sm font-bold text-dino-700">
                    JSON avancé
                </summary>
                <p className="mt-3 text-xs leading-5 text-muted">
                    Réservé aux extensions exceptionnelles. Les champs inconnus sont conservés lors des éditions structurées.
                </p>
                <Textarea
                    aria-label="Payload JSON avancé"
                    className="mt-3 min-h-80 resize-y font-mono text-xs leading-5"
                    required
                    spellCheck={false}
                    value={value.payloadText}
                    onChange={event => onChange({ ...value, payloadText: event.target.value })}
                />
            </details>
        </div>
    );
}

export { AdminGrammarEditorFields };
