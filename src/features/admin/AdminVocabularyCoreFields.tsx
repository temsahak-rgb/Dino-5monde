import { Input, Select, Textarea } from "../../ui/components/Controls.js";
import { AdminEditorField } from "./AdminEditorField.js";
import { vocabularyLevels } from "./adminVocabularyEditor.js";
import type { AdminVocabularyEditorValue } from "./adminVocabularyEditor.js";

function AdminVocabularyCoreFields({ value, onChange }: { value: AdminVocabularyEditorValue; onChange: (value: AdminVocabularyEditorValue) => void }) {
    const update = (field: keyof AdminVocabularyEditorValue, next: string) => onChange({ ...value, [field]: next });
    return (
        <details className="rounded-card border border-line bg-surface p-4" open>
            <summary className="cursor-pointer font-bold text-ink">Présentation du pack</summary>
            <div className="mt-4 space-y-4">
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    <AdminEditorField label="Niveau" required>
                        <Select value={value.level} onChange={event => update("level", event.target.value)}>
                            {vocabularyLevels.map(level => <option key={level}>{level}</option>)}
                        </Select>
                    </AdminEditorField>
                    <AdminEditorField label="Titre catalogue" required>
                        <Input value={value.catalogTitleFr} onChange={event => update("catalogTitleFr", event.target.value)} />
                    </AdminEditorField>
                    <AdminEditorField label="Titre catalogue persan">
                        <Input dir="rtl" value={value.catalogTitleFa} onChange={event => update("catalogTitleFa", event.target.value)} />
                    </AdminEditorField>
                    <AdminEditorField label="Icône catalogue">
                        <Input value={value.catalogIcon} onChange={event => update("catalogIcon", event.target.value)} />
                    </AdminEditorField>
                    <AdminEditorField hint={value.titleKey === "theme" ? "champ historique theme" : "champ title"} label="Titre dans le pack" required>
                        <Input value={value.detailTitleFr} onChange={event => update("detailTitleFr", event.target.value)} />
                    </AdminEditorField>
                    <AdminEditorField label="Titre du pack en persan">
                        <Input dir="rtl" value={value.detailTitleFa} onChange={event => update("detailTitleFa", event.target.value)} />
                    </AdminEditorField>
                    <AdminEditorField label="Icône dans le pack">
                        <Input value={value.detailIcon} onChange={event => update("detailIcon", event.target.value)} />
                    </AdminEditorField>
                </div>
                <AdminEditorField label="Inspiration">
                    <Textarea className="min-h-24 resize-y" value={value.inspiration} onChange={event => update("inspiration", event.target.value)} />
                </AdminEditorField>
                {(value.catalogTitleFr !== value.detailTitleFr || value.catalogIcon !== value.detailIcon) ? (
                    <p className="rounded-control bg-info-soft p-3 text-sm text-info">ℹ️ Le catalogue et le détail sont volontairement éditables séparément : les différences existantes sont conservées.</p>
                ) : null}
            </div>
        </details>
    );
}

export { AdminVocabularyCoreFields };
