import type {
    AdminContentItemRpcRow,
    CanonicalContentType
} from "../../services/backend/database.types.js";

import {
    Badge,
    Input,
    Select
} from "../../ui/components/Controls.js";

import {
    EmptyState,
    ErrorState,
    LoadingState
} from "../../ui/components/Feedback.js";

const contentTypeLabels: Record<CanonicalContentType, string> = {
    grammar_lesson: "Grammaire",
    news_article: "Actualité",
    travel_lesson: "Voyage",
    vocabulary_pack: "Vocabulaire"
};

const contentTypes = Object.keys(
    contentTypeLabels
) as CanonicalContentType[];

function ContentFilters({ query, typeFilter, onQuery, onTypeFilter }: {
    query: string;
    typeFilter: CanonicalContentType | "all";
    onQuery: (value: string) => void;
    onTypeFilter: (value: CanonicalContentType | "all") => void;
}) {
    return (
        <div className="mb-3 grid gap-2 sm:grid-cols-[1fr_auto]">
            <label>
                <span className="sr-only">Rechercher un contenu</span>
                <Input
                    type="search"
                    value={query}
                    placeholder="Titre ou identifiant…"
                    onChange={event => onQuery(event.target.value)}
                />
            </label>
            <label>
                <span className="sr-only">Filtrer par type</span>
                <Select
                    value={typeFilter}
                    onChange={event => onTypeFilter(
                        event.target.value as CanonicalContentType | "all"
                    )}
                >
                    <option value="all">Tous les types</option>
                    {contentTypes.map(type => (
                        <option key={type} value={type}>
                            {contentTypeLabels[type]}
                        </option>
                    ))}
                </Select>
            </label>
        </div>
    );
}

function ContentInventory({ error, items, loading, onRetry, onSelect }: {
    error: boolean;
    items: AdminContentItemRpcRow[];
    loading: boolean;
    onRetry: () => void;
    onSelect: (item: AdminContentItemRpcRow) => void;
}) {
    if (loading) {
        return <LoadingState label="Chargement de l’inventaire…" />;
    }
    if (error) {
        return (
            <ErrorState
                title="Inventaire indisponible"
                description="La liste privée des contenus n’a pas pu être chargée."
                retryLabel="Recommencer"
                onRetry={onRetry}
            />
        );
    }
    if (items.length === 0) {
        return (
            <EmptyState
                title="Aucun contenu"
                description="Importez l’export Grammaire ou créez un premier brouillon."
            />
        );
    }

    return (
        <div className="overflow-x-auto rounded-card border border-line bg-surface">
            <table className="w-full min-w-[42rem] text-left text-sm">
                <thead className="bg-line-soft text-xs uppercase tracking-wide text-muted">
                    <tr>
                        <th className="px-3 py-3">Statut</th>
                        <th className="px-3 py-3">Contenu</th>
                        <th className="px-3 py-3">Type</th>
                        <th className="px-3 py-3">Révisions</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-line">
                    {items.map(item => (
                        <tr key={`${item.content_type}:${item.content_key}`}>
                            <td className="px-3 py-3">
                                <ContentStatusBadge item={item} />
                            </td>
                            <td className="px-3 py-3">
                                <button
                                    type="button"
                                    className="min-h-11 text-left font-bold text-dino-700 hover:underline"
                                    onClick={() => onSelect(item)}
                                >
                                    <span className="block text-ink">{item.title_fr}</span>
                                    <span className="block font-mono text-xs font-normal text-muted">
                                        {item.content_key}
                                    </span>
                                </button>
                            </td>
                            <td className="px-3 py-3">
                                {contentTypeLabels[item.content_type]}
                                {item.level ? ` · ${item.level}` : ""}
                            </td>
                            <td className="px-3 py-3">
                                {item.published_revision_number ?? "—"} / {item.latest_revision_number}
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}

function ContentStatusBadge({ item }: {
    item: AdminContentItemRpcRow;
}) {
    if (item.archived_at) {
        return <Badge variant="danger">Archivé</Badge>;
    }
    if (item.latest_revision_number !== item.published_revision_number) {
        return <Badge variant="warning">Brouillon</Badge>;
    }
    return <Badge variant="success">Publié</Badge>;
}

export {
    ContentFilters,
    ContentInventory,
    ContentStatusBadge
};
