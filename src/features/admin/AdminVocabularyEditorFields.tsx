import { Textarea } from "../../ui/components/Controls.js";
import { AdminVocabularyCoreFields } from "./AdminVocabularyCoreFields.js";
import { AdminVocabularyPreview } from "./AdminVocabularyPreview.js";
import { AdminVocabularyQuiz } from "./AdminVocabularyQuiz.js";
import { AdminVocabularyStories } from "./AdminVocabularyStories.js";
import { AdminVocabularyWords } from "./AdminVocabularyWords.js";
import { readAdminVocabularyEditor, updateAdminVocabularyEditor } from "./adminVocabularyEditor.js";
import type { AdminContentEditorValue } from "./adminContentEditor.js";
import { validateAdminVocabularyEditor } from "./adminVocabularyValidation.js";

function AdminVocabularyEditorFields({ lockedWords, value, onChange }: {
    lockedWords: ReadonlySet<string>;
    value: AdminContentEditorValue;
    onChange: (value: AdminContentEditorValue) => void;
}) {
    const vocabulary = readAdminVocabularyEditor(value);
    const issues = validateAdminVocabularyEditor(vocabulary);
    const update = (next: typeof vocabulary) => onChange(updateAdminVocabularyEditor(value, next));
    return <div className="space-y-5">
        <AdminVocabularyPreview issues={issues} value={vocabulary} />
        <AdminVocabularyCoreFields value={vocabulary} onChange={update} />
        <AdminVocabularyWords lockedWords={lockedWords} value={vocabulary} onChange={update} />
        <AdminVocabularyStories value={vocabulary} onChange={update} />
        <AdminVocabularyQuiz value={vocabulary} onChange={update} />
        <details className="rounded-card border border-line bg-line-soft p-4">
            <summary className="cursor-pointer text-sm font-bold text-dino-700">JSON avancé</summary>
            <p className="mt-3 text-xs leading-5 text-muted">Les extensions inconnues sont conservées lors des éditions structurées.</p>
            <Textarea aria-label="Payload JSON avancé Vocabulaire" className="mt-3 min-h-80 resize-y font-mono text-xs leading-5" spellCheck={false} value={value.payloadText} onChange={event => onChange({ ...value, payloadText: event.target.value })} />
        </details>
    </div>;
}

export { AdminVocabularyEditorFields };
