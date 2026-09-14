import { Button, Input, Select, Textarea } from "../../ui/components/Controls.js";
import { AdminEditorField } from "./AdminEditorField.js";
import { moveAdminItem } from "./adminEditorCollection.js";
import { createEmptyVocabularyQuestion, createEmptyVocabularyQuiz } from "./adminVocabularyEditor.js";
import type { AdminVocabularyEditorValue, AdminVocabularyQuestionValue } from "./adminVocabularyEditor.js";

function AdminVocabularyQuiz({ value, onChange }: { value: AdminVocabularyEditorValue; onChange: (value: AdminVocabularyEditorValue) => void }) {
    const quiz = value.quiz;
    const setQuiz = (next: typeof quiz) => onChange({ ...value, quiz: next });
    if (!quiz) return <div className="rounded-card border border-dashed border-line bg-surface p-4"><div className="flex flex-wrap items-center justify-between gap-3"><strong>Quiz</strong><Button variant="secondary" onClick={() => setQuiz(createEmptyVocabularyQuiz())}>+ Activer le quiz</Button></div></div>;
    return (
        <details className="rounded-card border border-line bg-surface p-4">
            <summary className="cursor-pointer font-bold text-ink">Quiz · {quiz.questions.length} question(s)</summary>
            <div className="mt-4 space-y-4">
                <div className="grid gap-3 sm:grid-cols-3">
                    <AdminEditorField label="Titre français"><Input value={quiz.titleFr} onChange={event => setQuiz({ ...quiz, titleFr: event.target.value })} /></AdminEditorField>
                    <AdminEditorField label="Titre persan"><Input dir="rtl" value={quiz.titleFa} onChange={event => setQuiz({ ...quiz, titleFa: event.target.value })} /></AdminEditorField>
                    <AdminEditorField label="Questions affichées"><Input inputMode="numeric" value={quiz.displayCount} onChange={event => setQuiz({ ...quiz, displayCount: event.target.value })} /></AdminEditorField>
                </div>
                {quiz.questions.map((question, index) => <QuestionEditor key={index} question={question} index={index} total={quiz.questions.length} onChange={next => setQuiz({ ...quiz, questions: quiz.questions.map((candidate, candidateIndex) => candidateIndex === index ? next : candidate) })} onMove={direction => setQuiz({ ...quiz, questions: moveAdminItem(quiz.questions, index, direction) })} onRemove={() => setQuiz({ ...quiz, displayCount: String(Math.min(Number(quiz.displayCount) || 1, Math.max(1, quiz.questions.length - 1))), questions: quiz.questions.filter((_, candidateIndex) => candidateIndex !== index) })} />)}
                <div className="flex flex-wrap gap-2"><Button variant="secondary" onClick={() => { const questions = [...quiz.questions, createEmptyVocabularyQuestion()]; setQuiz({ ...quiz, displayCount: quiz.questions.length ? quiz.displayCount : "1", questions }); }}>+ Ajouter une question</Button><Button variant="ghost" onClick={() => setQuiz(null)}>Désactiver le quiz</Button></div>
            </div>
        </details>
    );
}

function QuestionEditor({ question, index, total, onChange, onMove, onRemove }: { question: AdminVocabularyQuestionValue; index: number; total: number; onChange: (question: AdminVocabularyQuestionValue) => void; onMove: (direction: -1 | 1) => void; onRemove: () => void }) {
    return <details className="rounded-card border border-line bg-line-soft p-3 sm:p-4" open={index === 0}><summary className="cursor-pointer font-semibold text-ink">{index + 1}. {question.question || "Nouvelle question"}</summary><div className="mt-4 space-y-3">
        <AdminEditorField label="Type"><Select value={question.type} onChange={event => { const type = event.target.value as "mcq" | "binary"; onChange({ ...question, type, options: type === "binary" ? ["Vrai", "Faux"] : question.options }); }}><option value="mcq">Choix multiple</option><option value="binary">Vrai / Faux</option></Select></AdminEditorField>
        <AdminEditorField label="Question" required><Textarea className="min-h-24 resize-y" value={question.question} onChange={event => onChange({ ...question, question: event.target.value })} /></AdminEditorField>
        <div className="grid gap-2 sm:grid-cols-2">{question.options.map((option, optionIndex) => <div className="flex gap-2" key={optionIndex}><Input value={option} aria-label={`Option ${optionIndex + 1} de la question ${index + 1}`} onChange={event => onChange({ ...question, options: question.options.map((candidate, candidateIndex) => candidateIndex === optionIndex ? event.target.value : candidate) })} />{question.type === "mcq" ? <Button variant="ghost" onClick={() => { const options = question.options.filter((_, candidateIndex) => candidateIndex !== optionIndex); onChange({ ...question, correctIndex: String(Math.min(Number(question.correctIndex) || 0, Math.max(0, options.length - 1))), options }); }}>×</Button> : null}</div>)}</div>
        <div className="grid gap-3 sm:grid-cols-2"><AdminEditorField label="Bonne réponse"><Select value={question.correctIndex} onChange={event => onChange({ ...question, correctIndex: event.target.value })}>{question.options.map((option, optionIndex) => <option key={optionIndex} value={optionIndex}>{option || `Option ${optionIndex + 1}`}</option>)}</Select></AdminEditorField>{question.type === "mcq" ? <Button variant="secondary" onClick={() => onChange({ ...question, options: [...question.options, ""] })}>+ Ajouter une option</Button> : null}</div>
        <div className="grid gap-3 sm:grid-cols-2"><AdminEditorField label="Explication française"><Textarea className="min-h-24 resize-y" value={question.explanation} onChange={event => onChange({ ...question, explanation: event.target.value })} /></AdminEditorField><AdminEditorField label="Explication persane"><Textarea className="min-h-24 resize-y" dir="rtl" value={question.explanationFa} onChange={event => onChange({ ...question, explanationFa: event.target.value })} /></AdminEditorField></div>
        <div className="flex flex-wrap gap-2 border-t border-line pt-3"><Button disabled={index === 0} variant="ghost" onClick={() => onMove(-1)}>↑ Monter</Button><Button disabled={index === total - 1} variant="ghost" onClick={() => onMove(1)}>↓ Descendre</Button><Button variant="ghost" onClick={onRemove}>Supprimer</Button></div>
    </div></details>;
}

export { AdminVocabularyQuiz };
