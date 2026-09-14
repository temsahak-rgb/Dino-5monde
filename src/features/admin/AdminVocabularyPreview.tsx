import { Badge } from "../../ui/components/Controls.js";
import { AdminEditorialQuality } from "./AdminEditorialQuality.js";
import type { AdminVocabularyEditorValue } from "./adminVocabularyEditor.js";
import { getAdminVocabularyCompletion } from "./adminVocabularyValidation.js";
import type { AdminEditorialIssue } from "./AdminEditorialQuality.js";

function AdminVocabularyPreview({ issues, value }: { issues: readonly AdminEditorialIssue[]; value: AdminVocabularyEditorValue }) {
    return (
        <div className="space-y-4">
            <AdminEditorialQuality
                completion={getAdminVocabularyCompletion(issues)}
                issues={issues}
                label="du pack de vocabulaire"
                readyMessage="Ce pack est prêt à être publié."
            />
            <details className="rounded-card border border-line bg-surface p-4">
                <summary className="cursor-pointer font-bold text-ink">Aperçu sans effet de bord</summary>
                <div className="mt-4 rounded-card border border-line bg-page p-4 sm:p-5">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                        <div>
                            <p className="text-3xl" aria-hidden="true">{value.detailIcon || "📚"}</p>
                            <h3 className="mt-2 text-xl font-bold text-ink">{value.detailTitleFr || "Nouveau pack"}</h3>
                            <p className="mt-1 text-sm text-muted" dir="rtl">{value.detailTitleFa}</p>
                        </div>
                        <div className="flex flex-wrap gap-2">
                            <Badge>{value.level || "—"}</Badge>
                            <Badge>{value.words.length} mot(s)</Badge>
                            <Badge>{value.quiz?.questions.length ?? 0} question(s)</Badge>
                        </div>
                    </div>
                    {value.inspiration ? <p className="mt-4 text-sm italic text-muted">Inspiré par {value.inspiration}</p> : null}
                    <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                        {value.words.slice(0, 9).map((word, index) => (
                            <article className="rounded-control border border-line bg-surface p-3" key={`${word.fr}:${index}`}>
                                <p className="text-xl" aria-hidden="true">{word.emoji || "🦕"}</p>
                                <p className="mt-1 font-bold text-ink">{word.fr || "Mot français"}</p>
                                <p className="mt-1 text-sm text-muted" dir="rtl">{word.fa || "ترجمه"}</p>
                                {word.exampleFr ? <p className="mt-2 text-xs leading-5 text-muted">{word.exampleFr}</p> : null}
                            </article>
                        ))}
                    </div>
                    {value.words.length > 9 ? <p className="mt-3 text-xs text-muted">+ {value.words.length - 9} autre(s) mot(s)</p> : null}
                </div>
            </details>
        </div>
    );
}

export { AdminVocabularyPreview };
