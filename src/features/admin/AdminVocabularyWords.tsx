import { Button, Input, Textarea } from "../../ui/components/Controls.js";
import { AdminEditorField } from "./AdminEditorField.js";
import { moveAdminItem } from "./adminEditorCollection.js";
import { createEmptyVocabularyWord } from "./adminVocabularyEditor.js";
import type { AdminVocabularyEditorValue, AdminVocabularyWordValue } from "./adminVocabularyEditor.js";

function AdminVocabularyWords({ lockedWords, value, onChange }: {
    lockedWords: ReadonlySet<string>;
    value: AdminVocabularyEditorValue;
    onChange: (value: AdminVocabularyEditorValue) => void;
}) {
    const updateWord = (index: number, word: AdminVocabularyWordValue) => onChange({
        ...value,
        words: value.words.map((candidate, candidateIndex) => candidateIndex === index ? word : candidate)
    });
    return (
        <details className="rounded-card border border-line bg-surface p-4" open>
            <summary className="cursor-pointer font-bold text-ink">Mots · {value.words.length}</summary>
            <p className="mt-2 text-xs leading-5 text-muted">Le français d’un mot déjà publié reste stable afin de préserver la progression des apprenants.</p>
            <div className="mt-4 space-y-4">
                {value.words.map((word, index) => {
                    const locked = lockedWords.has(normalizeWord(word.fr));
                    const update = (field: keyof AdminVocabularyWordValue, next: string) => updateWord(index, { ...word, [field]: next });
                    return (
                        <details className="rounded-card border border-line bg-line-soft p-3 sm:p-4" key={`${word.fr}:${index}`} open={index === 0}>
                            <summary className="cursor-pointer font-semibold text-ink">{index + 1}. {word.emoji} {word.fr || "Nouveau mot"} {word.fa ? `→ ${word.fa}` : ""}</summary>
                            <div className="mt-4 space-y-3">
                                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                                    <AdminEditorField hint={locked ? "stable après publication" : undefined} label="Français" required>
                                        <Input disabled={locked} value={word.fr} onChange={event => update("fr", event.target.value)} />
                                    </AdminEditorField>
                                    <AdminEditorField label="Persan" required>
                                        <Input dir="rtl" value={word.fa} onChange={event => update("fa", event.target.value)} />
                                    </AdminEditorField>
                                    <AdminEditorField label="Emoji"><Input value={word.emoji} onChange={event => update("emoji", event.target.value)} /></AdminEditorField>
                                    <AdminEditorField label="Difficulté" hint="1 à 6"><Input inputMode="numeric" value={word.difficulty} onChange={event => update("difficulty", event.target.value)} /></AdminEditorField>
                                </div>
                                <AdminEditorField label="Image facultative"><Input value={word.image} onChange={event => update("image", event.target.value)} /></AdminEditorField>
                                <div className="grid gap-3 sm:grid-cols-2">
                                    <AdminEditorField label="Exemple français"><Textarea className="min-h-24 resize-y" value={word.exampleFr} onChange={event => update("exampleFr", event.target.value)} /></AdminEditorField>
                                    <AdminEditorField label="Exemple persan"><Textarea className="min-h-24 resize-y" dir="rtl" value={word.exampleFa} onChange={event => update("exampleFa", event.target.value)} /></AdminEditorField>
                                </div>
                                <div className="flex flex-wrap gap-2 border-t border-line pt-3">
                                    <Button disabled={index === 0} variant="ghost" onClick={() => onChange({ ...value, words: moveAdminItem(value.words, index, -1) })}>↑ Monter</Button>
                                    <Button disabled={index === value.words.length - 1} variant="ghost" onClick={() => onChange({ ...value, words: moveAdminItem(value.words, index, 1) })}>↓ Descendre</Button>
                                    <Button variant="ghost" onClick={() => onChange({ ...value, words: [...value.words.slice(0, index + 1), { ...word, fr: locked ? "" : `${word.fr} copie`, originalPayload: null }, ...value.words.slice(index + 1)] })}>Dupliquer</Button>
                                    {locked ? <span className="self-center text-xs font-semibold text-muted">Mot publié protégé</span> : <Button variant="ghost" onClick={() => onChange({ ...value, words: value.words.filter((_, candidateIndex) => candidateIndex !== index) })}>Supprimer</Button>}
                                </div>
                            </div>
                        </details>
                    );
                })}
                <Button variant="secondary" onClick={() => onChange({ ...value, words: [...value.words, createEmptyVocabularyWord()] })}>+ Ajouter un mot</Button>
            </div>
        </details>
    );
}

function normalizeWord(value: string): string { return value.normalize("NFKC").trim().toLocaleLowerCase("fr"); }
export { AdminVocabularyWords, normalizeWord };
