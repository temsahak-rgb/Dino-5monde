import {
    AdminNewsAnnotations
} from "./AdminNewsAnnotations.js";

import {
    AdminNewsCoreFields
} from "./AdminNewsCoreFields.js";

import {
    AdminNewsPreview
} from "./AdminNewsPreview.js";

import {
    AdminNewsSources
} from "./AdminNewsSources.js";

import {
    readAdminNewsEditor,
    updateAdminNewsEditor,
    validateAdminNewsEditor
} from "./adminNewsEditor.js";

import type {
    AdminContentEditorValue
} from "./adminContentEditor.js";

import type {
    AdminContentItemRpcRow
} from "../../services/backend/database.types.js";

import {
    Textarea
} from "../../ui/components/Controls.js";

interface AdminNewsEditorFieldsProps {
    availableItems: readonly AdminContentItemRpcRow[];
    value: AdminContentEditorValue;
    onChange: (value: AdminContentEditorValue) => void;
}

function AdminNewsEditorFields({
    availableItems,
    value,
    onChange
}: AdminNewsEditorFieldsProps) {
    const news = readAdminNewsEditor(value);
    const issues = validateAdminNewsEditor(news, availableItems);
    const updateNews = (
        nextValue: typeof news
    ): void => {
        onChange(updateAdminNewsEditor(value, nextValue));
    };

    return (
        <div className="space-y-5">
            <AdminNewsPreview issues={issues} value={news} />
            <AdminNewsCoreFields value={news} onChange={updateNews} />
            <AdminNewsSources value={news} onChange={updateNews} />
            <AdminNewsAnnotations value={news} onChange={updateNews} />

            <details className="rounded-card border border-line bg-line-soft p-4">
                <summary className="cursor-pointer text-sm font-bold text-dino-700">
                    JSON avancé
                </summary>
                <p className="mt-3 text-xs leading-5 text-muted">
                    Réservé aux corrections exceptionnelles. Toute modification structurée régénère ce JSON.
                </p>
                <Textarea
                    aria-label="Payload JSON avancé"
                    className="mt-3 min-h-80 resize-y font-mono text-xs leading-5"
                    required
                    spellCheck={false}
                    value={value.payloadText}
                    onChange={event => onChange({
                        ...value,
                        payloadText: event.target.value
                    })}
                />
            </details>
        </div>
    );
}

export {
    AdminNewsEditorFields
};
