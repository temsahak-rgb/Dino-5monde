import type {
    AdminContentDraft
} from "./adminContentRepository.js";

import {
    Button,
    Card,
    ProgressBar
} from "../../ui/components/Controls.js";

import {
    Alert
} from "../../ui/components/Feedback.js";

import {
    Section
} from "../../ui/components/Layout.js";

interface GrammarImportPanelProps {
    drafts: AdminContentDraft[] | null;
    pendingCount: number;
    progress: { completed: number; total: number };
    publishConfirmed: boolean;
    status: "idle" | "analysing" | "importing" | "publishing";
    onAnalyse: () => void;
    onImport: () => void;
    onPublish: () => void;
    onPublishConfirmed: (value: boolean) => void;
}

function StatusCard({ icon, label, value }: {
    icon: string;
    label: string;
    value: number;
}) {
    return (
        <Card className="p-4">
            <span aria-hidden="true">{icon}</span>
            <strong className="ms-2 text-2xl text-ink">{value}</strong>
            <span className="mt-2 block text-sm text-muted">{label}</span>
        </Card>
    );
}

function GrammarImportPanel({
    drafts,
    pendingCount,
    progress,
    publishConfirmed,
    status,
    onAnalyse,
    onImport,
    onPublish,
    onPublishConfirmed
}: GrammarImportPanelProps) {
    return (
        <Section>
            <details className="rounded-card border border-line bg-surface p-4">
                <summary className="cursor-pointer font-bold text-ink">
                    Import initial de la Grammaire
                </summary>
                <div className="mt-4 space-y-4">
                    <p className="text-sm leading-6 text-muted">
                        L’analyse lit l’export historique sans le modifier. L’import crée uniquement des révisions brouillon ; la publication reste séparée.
                    </p>
                    <div className="flex flex-wrap gap-2">
                        <Button variant="secondary" disabled={status !== "idle"} onClick={onAnalyse}>
                            {status === "analysing" ? "Analyse…" : "Analyser l’export Grammaire"}
                        </Button>
                        <Button disabled={!drafts || status !== "idle"} onClick={onImport}>
                            Importer en brouillons
                        </Button>
                    </div>
                    {drafts ? (
                        <Alert variant="info">
                            {drafts.length} leçons valides prêtes à être importées.
                        </Alert>
                    ) : null}
                    {progress.total > 0 ? (
                        <ProgressBar
                            label={`Import ${progress.completed} / ${progress.total}`}
                            value={progress.completed}
                            max={progress.total}
                            showValue
                        />
                    ) : null}
                    <div className="border-t border-line pt-4">
                        <label className="flex items-start gap-3 text-sm text-ink">
                            <input
                                className="mt-1 size-4"
                                type="checkbox"
                                checked={publishConfirmed}
                                onChange={event => onPublishConfirmed(event.target.checked)}
                            />
                            J’ai vérifié les brouillons et je souhaite publier les dernières révisions Grammaire.
                        </label>
                        <Button
                            className="mt-3"
                            disabled={!publishConfirmed || pendingCount === 0 || status !== "idle"}
                            onClick={onPublish}
                        >
                            Publier {pendingCount} brouillon(s)
                        </Button>
                    </div>
                </div>
            </details>
        </Section>
    );
}

export {
    GrammarImportPanel,
    StatusCard
};
