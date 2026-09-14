import type {
    AdminNewsEditorValue,
    AdminNewsSourceValue
} from "./adminNewsEditor.js";

import {
    Button,
    Input
} from "../../ui/components/Controls.js";

import {
    NewsField
} from "./AdminNewsCoreFields.js";

interface AdminNewsSourcesProps {
    value: AdminNewsEditorValue;
    onChange: (value: AdminNewsEditorValue) => void;
}

function AdminNewsSources({
    value,
    onChange
}: AdminNewsSourcesProps) {
    function updateSource(
        index: number,
        field: keyof AdminNewsSourceValue,
        nextValue: string
    ): void {
        onChange({
            ...value,
            sources: value.sources.map((source, sourceIndex) =>
                sourceIndex === index
                    ? { ...source, [field]: nextValue }
                    : source
            )
        });
    }

    return (
        <details className="rounded-card border border-line bg-surface p-4" open>
            <summary className="cursor-pointer font-bold text-ink">
                Sources vérifiables · {value.sources.length}
            </summary>
            <div className="mt-4 space-y-3">
                {value.sources.map((source, index) => (
                    <div
                        className="rounded-control border border-line bg-line-soft p-3"
                        key={`source:${index}`}
                    >
                        <div className="grid gap-3 sm:grid-cols-[1fr_1fr_auto] sm:items-end">
                            <NewsField label={`Source ${index + 1}`}>
                                <Input
                                    aria-label={`Titre de la source ${index + 1}`}
                                    value={source.title}
                                    onChange={event => updateSource(index, "title", event.target.value)}
                                />
                            </NewsField>
                            <NewsField label="URL HTTPS">
                                <Input
                                    aria-label={`URL de la source ${index + 1}`}
                                    type="url"
                                    value={source.url}
                                    onChange={event => updateSource(index, "url", event.target.value)}
                                />
                            </NewsField>
                            <Button
                                aria-label={`Supprimer la source ${index + 1}`}
                                variant="ghost"
                                onClick={() => onChange({
                                    ...value,
                                    sources: value.sources.filter((_, itemIndex) => itemIndex !== index)
                                })}
                            >
                                ✕
                            </Button>
                        </div>
                    </div>
                ))}
                <Button
                    variant="secondary"
                    onClick={() => onChange({
                        ...value,
                        sources: [
                            ...value.sources,
                            { title: "", url: "" }
                        ]
                    })}
                >
                    + Ajouter une source
                </Button>
            </div>
        </details>
    );
}

export {
    AdminNewsSources
};
