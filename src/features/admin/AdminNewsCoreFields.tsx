import type {
    AdminNewsEditorValue
} from "./adminNewsEditor.js";

import {
    Input,
    Textarea
} from "../../ui/components/Controls.js";

interface AdminNewsCoreFieldsProps {
    value: AdminNewsEditorValue;
    onChange: (value: AdminNewsEditorValue) => void;
}

function AdminNewsCoreFields({
    value,
    onChange
}: AdminNewsCoreFieldsProps) {
    function update(
        field: keyof AdminNewsEditorValue,
        nextValue: string
    ): void {
        onChange({
            ...value,
            [field]: nextValue
        });
    }

    return (
        <div className="space-y-5">
            <fieldset className="space-y-3">
                <legend className="text-base font-bold text-ink">
                    Présentation
                </legend>
                <NewsField label="Titre français" required>
                    <Input
                        required
                        value={value.titleFr}
                        onChange={event => update("titleFr", event.target.value)}
                    />
                </NewsField>
                <NewsField label="Titre persan">
                    <Input
                        dir="rtl"
                        value={value.titleFa}
                        onChange={event => update("titleFa", event.target.value)}
                    />
                </NewsField>
                <NewsField label="Chapô français">
                    <Textarea
                        className="min-h-24 resize-y"
                        value={value.subtitleFr}
                        onChange={event => update("subtitleFr", event.target.value)}
                    />
                </NewsField>
                <NewsField label="Chapô persan">
                    <Textarea
                        className="min-h-24 resize-y"
                        dir="rtl"
                        value={value.subtitleFa}
                        onChange={event => update("subtitleFa", event.target.value)}
                    />
                </NewsField>
            </fieldset>

            <fieldset className="grid gap-3 sm:grid-cols-2">
                <legend className="mb-3 text-base font-bold text-ink">
                    Publication
                </legend>
                <NewsField label="Niveau ou plage CECRL" required>
                    <Input
                        placeholder="A2-C1"
                        required
                        value={value.level}
                        onChange={event => update("level", event.target.value.toUpperCase())}
                    />
                </NewsField>
                <NewsField label="Date de publication" required>
                    <Input
                        required
                        type="date"
                        value={value.publishedDate}
                        onChange={event => update("publishedDate", event.target.value)}
                    />
                </NewsField>
            </fieldset>

            <fieldset className="space-y-3">
                <legend className="text-base font-bold text-ink">
                    Illustration
                </legend>
                <NewsField label="URL de l’image" required>
                    <Input
                        placeholder="https://… ou ./data/news/images/…"
                        required
                        type="text"
                        value={value.image}
                        onChange={event => update("image", event.target.value)}
                    />
                </NewsField>
                <NewsField label="Texte alternatif">
                    <Input
                        value={value.imageAlt}
                        onChange={event => update("imageAlt", event.target.value)}
                    />
                </NewsField>
            </fieldset>

            <fieldset className="space-y-3">
                <legend className="text-base font-bold text-ink">
                    Article
                </legend>
                <NewsField
                    label="Texte complet"
                    hint={`${value.fullText.trim().length} caractères`}
                    required
                >
                    <Textarea
                        className="min-h-64 resize-y leading-7"
                        required
                        value={value.fullText}
                        onChange={event => update("fullText", event.target.value)}
                    />
                </NewsField>
                <NewsField
                    label="Version simplifiée"
                    hint={`${value.simpleText.trim().length} caractères`}
                    required
                >
                    <Textarea
                        className="min-h-48 resize-y leading-7"
                        required
                        value={value.simpleText}
                        onChange={event => update("simpleText", event.target.value)}
                    />
                </NewsField>
            </fieldset>
        </div>
    );
}

function NewsField({
    children,
    hint,
    label,
    required = false
}: {
    children: React.ReactNode;
    hint?: string;
    label: string;
    required?: boolean;
}) {
    return (
        <label className="block min-w-0">
            <span className="mb-1 flex items-center justify-between gap-3 text-sm font-bold text-ink">
                <span>
                    {label}
                    {required ? <span className="text-danger"> *</span> : null}
                </span>
                {hint ? (
                    <span className="text-xs font-normal text-muted">{hint}</span>
                ) : null}
            </span>
            {children}
        </label>
    );
}

export {
    AdminNewsCoreFields,
    NewsField
};
