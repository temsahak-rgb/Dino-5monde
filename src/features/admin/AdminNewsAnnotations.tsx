import type {
    AdminNewsEditorValue,
    AdminNewsGrammarValue,
    AdminNewsVocabularyValue
} from "./adminNewsEditor.js";

import {
    cefrLevels
} from "./adminNewsEditor.js";

import {
    Button,
    Input,
    Select,
    Textarea
} from "../../ui/components/Controls.js";

import {
    NewsField
} from "./AdminNewsCoreFields.js";

interface AdminNewsAnnotationsProps {
    value: AdminNewsEditorValue;
    onChange: (value: AdminNewsEditorValue) => void;
}

function AdminNewsAnnotations({
    value,
    onChange
}: AdminNewsAnnotationsProps) {
    return (
        <div className="space-y-4">
            <VocabularyEditor value={value} onChange={onChange} />
            <GrammarEditor value={value} onChange={onChange} />
        </div>
    );
}

function VocabularyEditor({
    value,
    onChange
}: AdminNewsAnnotationsProps) {
    function update(
        index: number,
        field: keyof AdminNewsVocabularyValue,
        nextValue: string
    ): void {
        onChange({
            ...value,
            vocabulary: value.vocabulary.map((item, itemIndex) =>
                itemIndex === index
                    ? { ...item, [field]: nextValue }
                    : item
            )
        });
    }

    return (
        <details className="rounded-card border border-line bg-surface p-4">
            <summary className="cursor-pointer font-bold text-ink">
                Vocabulaire clé · {value.vocabulary.length}
            </summary>
            <div className="mt-4 space-y-3">
                {value.vocabulary.map((item, index) => (
                    <div
                        className="rounded-control border border-line bg-line-soft p-3"
                        key={`vocabulary:${index}`}
                    >
                        <div className="grid gap-3 sm:grid-cols-2">
                            <NewsField label="Mot français">
                                <Input
                                    value={item.fr}
                                    onChange={event => update(index, "fr", event.target.value)}
                                />
                            </NewsField>
                            <NewsField label="Traduction persane">
                                <Input
                                    dir="rtl"
                                    value={item.fa}
                                    onChange={event => update(index, "fa", event.target.value)}
                                />
                            </NewsField>
                            <NewsField label="Niveau">
                                <LevelSelect
                                    value={item.level}
                                    onChange={nextValue => update(index, "level", nextValue)}
                                />
                            </NewsField>
                            <NewsField label="Pack lié">
                                <Input
                                    className="font-mono"
                                    placeholder="pack_…"
                                    value={item.packId}
                                    onChange={event => update(index, "packId", event.target.value)}
                                />
                            </NewsField>
                        </div>
                        <Button
                            className="mt-2"
                            variant="ghost"
                            onClick={() => onChange({
                                ...value,
                                vocabulary: value.vocabulary.filter((_, itemIndex) => itemIndex !== index)
                            })}
                        >
                            Supprimer ce mot
                        </Button>
                    </div>
                ))}
                <Button
                    variant="secondary"
                    onClick={() => onChange({
                        ...value,
                        vocabulary: [
                            ...value.vocabulary,
                            { fa: "", fr: "", level: "", packId: "" }
                        ]
                    })}
                >
                    + Ajouter un mot
                </Button>
            </div>
        </details>
    );
}

function GrammarEditor({
    value,
    onChange
}: AdminNewsAnnotationsProps) {
    function update(
        index: number,
        field: keyof AdminNewsGrammarValue,
        nextValue: string
    ): void {
        onChange({
            ...value,
            grammar: value.grammar.map((item, itemIndex) =>
                itemIndex === index
                    ? { ...item, [field]: nextValue }
                    : item
            )
        });
    }

    return (
        <details className="rounded-card border border-line bg-surface p-4">
            <summary className="cursor-pointer font-bold text-ink">
                Connexions Grammaire · {value.grammar.length}
            </summary>
            <div className="mt-4 space-y-3">
                {value.grammar.map((item, index) => (
                    <details
                        className="rounded-control border border-line bg-line-soft p-3"
                        key={`grammar:${index}`}
                    >
                        <summary className="cursor-pointer font-semibold text-ink">
                            {item.title || `Point de grammaire ${index + 1}`}
                        </summary>
                        <div className="mt-3 grid gap-3 sm:grid-cols-2">
                            <NewsField label="Titre">
                                <Input
                                    value={item.title}
                                    onChange={event => update(index, "title", event.target.value)}
                                />
                            </NewsField>
                            <NewsField label="Niveau">
                                <LevelSelect
                                    value={item.level}
                                    onChange={nextValue => update(index, "level", nextValue)}
                                />
                            </NewsField>
                            <NewsField label="Leçon liée">
                                <Input
                                    className="font-mono"
                                    placeholder="B1-G-001"
                                    value={item.grammarId}
                                    onChange={event => update(index, "grammarId", event.target.value)}
                                />
                            </NewsField>
                            <NewsField label="Exemple">
                                <Textarea
                                    className="min-h-24 resize-y"
                                    value={item.example}
                                    onChange={event => update(index, "example", event.target.value)}
                                />
                            </NewsField>
                            <NewsField label="Traduction persane">
                                <Textarea
                                    className="min-h-24 resize-y"
                                    dir="rtl"
                                    value={item.translation}
                                    onChange={event => update(index, "translation", event.target.value)}
                                />
                            </NewsField>
                            <NewsField label="Explication persane">
                                <Textarea
                                    className="min-h-24 resize-y"
                                    dir="rtl"
                                    value={item.explanation}
                                    onChange={event => update(index, "explanation", event.target.value)}
                                />
                            </NewsField>
                        </div>
                        <Button
                            className="mt-2"
                            variant="ghost"
                            onClick={() => onChange({
                                ...value,
                                grammar: value.grammar.filter((_, itemIndex) => itemIndex !== index)
                            })}
                        >
                            Supprimer ce point
                        </Button>
                    </details>
                ))}
                <Button
                    variant="secondary"
                    onClick={() => onChange({
                        ...value,
                        grammar: [
                            ...value.grammar,
                            {
                                example: "",
                                explanation: "",
                                grammarId: "",
                                level: "",
                                title: "",
                                translation: ""
                            }
                        ]
                    })}
                >
                    + Ajouter un point de grammaire
                </Button>
            </div>
        </details>
    );
}

function LevelSelect({
    onChange,
    value
}: {
    onChange: (value: string) => void;
    value: string;
}) {
    return (
        <Select
            value={value}
            onChange={event => onChange(event.target.value)}
        >
            <option value="">Non précisé</option>
            {cefrLevels.map(level => (
                <option key={level} value={level}>{level}</option>
            ))}
        </Select>
    );
}

export {
    AdminNewsAnnotations
};
