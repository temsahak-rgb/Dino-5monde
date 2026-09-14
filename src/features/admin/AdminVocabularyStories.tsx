import { Button, Input, Select, Textarea } from "../../ui/components/Controls.js";
import { AdminEditorField } from "./AdminEditorField.js";
import { moveAdminItem } from "./adminEditorCollection.js";
import { createEmptyVocabularyBlank, createEmptyVocabularyStory } from "./adminVocabularyEditor.js";
import type { AdminVocabularyBlankValue, AdminVocabularyEditorValue, AdminVocabularyStoryValue } from "./adminVocabularyEditor.js";

function AdminVocabularyStories({ value, onChange }: { value: AdminVocabularyEditorValue; onChange: (value: AdminVocabularyEditorValue) => void }) {
    return (
        <details className="rounded-card border border-line bg-surface p-4">
            <summary className="cursor-pointer font-bold text-ink">Histoires · {[value.simpleStory, value.literaryStory].filter(Boolean).length}</summary>
            <div className="mt-4 space-y-4">
                <StorySlot label="Histoire simple" slot="simpleStory" story={value.simpleStory} value={value} onChange={onChange} />
                <StorySlot label="Histoire littéraire" slot="literaryStory" story={value.literaryStory} value={value} onChange={onChange} />
            </div>
        </details>
    );
}

function StorySlot({ label, slot, story, value, onChange }: {
    label: string; slot: "simpleStory" | "literaryStory"; story: AdminVocabularyStoryValue | null;
    value: AdminVocabularyEditorValue; onChange: (value: AdminVocabularyEditorValue) => void;
}) {
    const setStory = (next: AdminVocabularyStoryValue | null) => onChange({ ...value, [slot]: next });
    if (!story) return <div className="flex flex-wrap items-center justify-between gap-3 rounded-control border border-dashed border-line p-3"><span className="font-semibold text-ink">{label}</span><Button variant="secondary" onClick={() => setStory(createEmptyVocabularyStory(slot === "simpleStory" ? "simple" : "literary"))}>+ Activer</Button></div>;
    const update = (field: keyof AdminVocabularyStoryValue, next: string) => setStory({ ...story, [field]: next });
    return (
        <details className="rounded-card border border-line bg-line-soft p-3 sm:p-4" open>
            <summary className="cursor-pointer font-semibold text-ink">{label} · {story.blanks.length} blanc(s)</summary>
            <div className="mt-4 space-y-3">
                {story.textFr.includes("____") ? <p className="rounded-control bg-warning-soft p-3 text-sm text-amber-800">🟠 Marqueurs historiques détectés : ils restent intacts. Les nouveaux blancs utilisent <code>{"{{BLANK_n}}"}</code>.</p> : null}
                <div className="grid gap-3 sm:grid-cols-2">
                    <AdminEditorField label="Titre français"><Input value={story.titleFr} onChange={event => update("titleFr", event.target.value)} /></AdminEditorField>
                    <AdminEditorField label="Titre persan"><Input dir="rtl" value={story.titleFa} onChange={event => update("titleFa", event.target.value)} /></AdminEditorField>
                </div>
                <AdminEditorField label="Texte français"><Textarea className="min-h-40 resize-y leading-6" value={story.textFr} onChange={event => update("textFr", event.target.value)} /></AdminEditorField>
                <AdminEditorField label="Texte persan"><Textarea className="min-h-32 resize-y leading-7" dir="rtl" value={story.textFa} onChange={event => update("textFa", event.target.value)} /></AdminEditorField>
                <AdminEditorField label="Inspiration"><Input value={story.inspiration} onChange={event => update("inspiration", event.target.value)} /></AdminEditorField>
                <div className="space-y-3 rounded-control border border-line bg-surface p-3">
                    <h4 className="text-sm font-bold text-ink">Blancs</h4>
                    {story.blanks.map((blank, index) => <BlankEditor key={`${blank.id}:${index}`} blank={blank} index={index} total={story.blanks.length} onChange={next => setStory({ ...story, blanks: story.blanks.map((candidate, candidateIndex) => candidateIndex === index ? next : candidate) })} onMove={direction => setStory({ ...story, blanks: moveAdminItem(story.blanks, index, direction) })} onRemove={() => setStory({ ...story, blanks: story.blanks.filter((_, candidateIndex) => candidateIndex !== index) })} />)}
                    <Button variant="secondary" onClick={() => setStory({ ...story, blanks: [...story.blanks, createEmptyVocabularyBlank(story.blanks.length)] })}>+ Ajouter un blanc</Button>
                </div>
                <Button variant="ghost" onClick={() => setStory(null)}>Désactiver cette histoire</Button>
            </div>
        </details>
    );
}

function BlankEditor({ blank, index, total, onChange, onMove, onRemove }: { blank: AdminVocabularyBlankValue; index: number; total: number; onChange: (blank: AdminVocabularyBlankValue) => void; onMove: (direction: -1 | 1) => void; onRemove: () => void }) {
    const setOptions = (options: string[]) => onChange({ ...blank, options });
    return (
        <div className="rounded-control border border-line bg-line-soft p-3">
            <div className="grid gap-2 sm:grid-cols-[7rem_1fr]">
                <AdminEditorField label="Identifiant"><Input inputMode="numeric" value={blank.id} onChange={event => onChange({ ...blank, id: event.target.value })} /></AdminEditorField>
                <AdminEditorField label="Marqueur"><Input readOnly value={`{{BLANK_${blank.id || "n"}}}`} /></AdminEditorField>
            </div>
            <div className="mt-3 grid gap-2 sm:grid-cols-2">
                {blank.options.map((option, optionIndex) => <div className="flex gap-2" key={optionIndex}><Input aria-label={`Option ${optionIndex + 1} du blanc ${index + 1}`} value={option} onChange={event => setOptions(blank.options.map((candidate, candidateIndex) => candidateIndex === optionIndex ? event.target.value : candidate))} /><Button aria-label={`Supprimer l’option ${optionIndex + 1}`} variant="ghost" onClick={() => { const options = blank.options.filter((_, candidateIndex) => candidateIndex !== optionIndex); onChange({ ...blank, correctIndex: String(Math.min(Number(blank.correctIndex) || 0, Math.max(0, options.length - 1))), options }); }}>×</Button></div>)}
            </div>
            <div className="mt-3 grid gap-2 sm:grid-cols-[1fr_auto]">
                <AdminEditorField label="Bonne réponse"><Select value={blank.correctIndex} onChange={event => onChange({ ...blank, correctIndex: event.target.value })}>{blank.options.map((option, optionIndex) => <option key={optionIndex} value={optionIndex}>{option || `Option ${optionIndex + 1}`}</option>)}</Select></AdminEditorField>
                <Button variant="secondary" onClick={() => setOptions([...blank.options, ""])}>+ Option</Button>
            </div>
            <div className="mt-3 flex flex-wrap gap-2"><Button disabled={index === 0} variant="ghost" onClick={() => onMove(-1)}>↑</Button><Button disabled={index === total - 1} variant="ghost" onClick={() => onMove(1)}>↓</Button><Button variant="ghost" onClick={onRemove}>Supprimer</Button></div>
        </div>
    );
}

export { AdminVocabularyStories };
