import type {
    AdminContentRevisionRpcRow
} from "../../services/backend/database.types.js";

import {
    Badge,
    Button
} from "../../ui/components/Controls.js";

import {
    LoadingState
} from "../../ui/components/Feedback.js";

interface AdminContentRevisionHistoryProps {
    action: "idle" | "saving" | "publishing";
    loading: boolean;
    revisions: AdminContentRevisionRpcRow[];
    selectedRevision: number | null;
    onPublish: () => void;
    onSelect: (revision: AdminContentRevisionRpcRow) => void;
}

function AdminContentRevisionHistory({
    action,
    loading,
    revisions,
    selectedRevision,
    onPublish,
    onSelect
}: AdminContentRevisionHistoryProps) {
    return (
        <div className="mt-4 rounded-card border border-line bg-surface p-4">
            <h3 className="font-bold text-ink">Historique</h3>
            {loading ? (
                <LoadingState label="Chargement des révisions…" />
            ) : (
                <div className="mt-3 space-y-2">
                    {revisions.map(revision => (
                        <label
                            className="flex cursor-pointer items-center justify-between gap-3 rounded-control border border-line p-3"
                            key={revision.revision_id}
                        >
                            <span>
                                <input
                                    className="me-2"
                                    type="radio"
                                    name="admin-revision"
                                    checked={selectedRevision === revision.revision_number}
                                    onChange={() => onSelect(revision)}
                                />
                                Révision {revision.revision_number}
                            </span>
                            {revision.published ? (
                                <Badge variant="success">Publiée</Badge>
                            ) : (
                                <Badge variant="warning">Brouillon</Badge>
                            )}
                        </label>
                    ))}
                </div>
            )}

            <Button
                className="mt-3"
                disabled={!selectedRevision || action !== "idle"}
                onClick={onPublish}
            >
                {action === "publishing"
                    ? "Publication…"
                    : `Publier la révision ${selectedRevision ?? ""}`}
            </Button>
        </div>
    );
}

export {
    AdminContentRevisionHistory
};
