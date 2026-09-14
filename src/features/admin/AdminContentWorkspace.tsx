import {
    useEffect,
    useMemo,
    useRef,
    useState
} from "react";

import {
    loadAdminContentItems,
    publishLatestAdminContentBatch
} from "./adminContentRepository.js";

import {
    importAdminContentDrafts,
    loadGrammarExportDrafts
} from "./grammarExport.js";

import {
    AdminContentEditor
} from "./AdminContentEditorView.js";

import {
    ContentFilters,
    ContentInventory
} from "./AdminContentInventory.js";

import {
    GrammarImportPanel,
    StatusCard
} from "./AdminContentOverview.js";

import type {
    AdminContentDraft
} from "./adminContentRepository.js";

import type {
    AdminContentItemRpcRow,
    CanonicalContentType
} from "../../services/backend/database.types.js";

import type {
    DinoBackendClient
} from "../../services/backend/supabaseClient.js";

import {
    Button,
    Card,
    ProgressBar
} from "../../ui/components/Controls.js";

import {
    Alert
} from "../../ui/components/Feedback.js";

import {
    Page,
    PageHeader,
    Section,
    SectionHeader
} from "../../ui/components/Layout.js";

interface AdminContentWorkspaceProps {
    client: DinoBackendClient;
}

function AdminContentWorkspace({
    client
}: AdminContentWorkspaceProps) {
    const [items, setItems] =
        useState<AdminContentItemRpcRow[]>([]);
    const [loading, setLoading] =
        useState(true);
    const [loadError, setLoadError] =
        useState(false);
    const [refreshCount, setRefreshCount] =
        useState(0);
    const [query, setQuery] =
        useState("");
    const [typeFilter, setTypeFilter] =
        useState<CanonicalContentType | "all">("all");
    const [selectedItem, setSelectedItem] =
        useState<AdminContentItemRpcRow | null>(null);
    const [newEditorVersion, setNewEditorVersion] =
        useState(0);
    const pendingSelection = useRef<{
        contentKey: string;
        contentType: CanonicalContentType;
    } | null>(null);
    const [grammarDrafts, setGrammarDrafts] =
        useState<AdminContentDraft[] | null>(null);
    const [importProgress, setImportProgress] =
        useState({ completed: 0, total: 0 });
    const [importStatus, setImportStatus] =
        useState<"idle" | "analysing" | "importing" | "publishing">("idle");
    const [publishConfirmed, setPublishConfirmed] =
        useState(false);
    const [message, setMessage] =
        useState<string | null>(null);
    const [error, setError] =
        useState<string | null>(null);

    useEffect(
        () => {
            let active = true;
            setLoading(true);
            setLoadError(false);

            void loadAdminContentItems(client).then(
                loaded => {
                    if (active) {
                        setItems(loaded);
                        setSelectedItem(current => {
                            const identity =
                                pendingSelection.current
                                ?? (current
                                    ? {
                                        contentKey: current.content_key,
                                        contentType: current.content_type
                                    }
                                    : null);

                            pendingSelection.current = null;

                            if (!identity) {
                                return null;
                            }

                            return loaded.find(item =>
                                item.content_key === identity.contentKey
                                && item.content_type === identity.contentType
                            ) ?? null;
                        });
                        setLoading(false);
                    }
                },
                () => {
                    if (active) {
                        setLoadError(true);
                        setLoading(false);
                    }
                }
            );

            return () => {
                active = false;
            };
        },
        [client, refreshCount]
    );

    const filteredItems = useMemo(
        () => {
            const normalized = query.trim()
                .toLocaleLowerCase("fr");

            return items.filter(item =>
                (
                    typeFilter === "all"
                    || item.content_type === typeFilter
                )
                && (
                    !normalized
                    || item.content_key
                        .toLocaleLowerCase("fr")
                        .includes(normalized)
                    || item.title_fr
                        .toLocaleLowerCase("fr")
                        .includes(normalized)
                )
            );
        },
        [items, query, typeFilter]
    );

    const publishedCount = items.filter(
        item =>
            item.published_revision_number !== null
            && item.archived_at === null
    ).length;
    const pendingCount = items.filter(
        item =>
            item.latest_revision_number
            !== item.published_revision_number
    ).length;
    const pendingGrammarCount = items.filter(
        item =>
            item.content_type === "grammar_lesson"
            && item.latest_revision_number
                !== item.published_revision_number
    ).length;

    function refresh(identity?: {
        contentKey: string;
        contentType: CanonicalContentType;
    }): void {
        pendingSelection.current = identity ?? null;
        setRefreshCount(value => value + 1);
    }

    async function analyseGrammarExport(): Promise<void> {
        setImportStatus("analysing");
        setError(null);
        setMessage(null);

        try {
            const drafts = await loadGrammarExportDrafts();
            setGrammarDrafts(drafts);
            setImportProgress({ completed: 0, total: drafts.length });
        } catch (reason) {
            setError(getErrorMessage(reason));
        } finally {
            setImportStatus("idle");
        }
    }

    async function importGrammar(): Promise<void> {
        if (!grammarDrafts) {
            return;
        }

        setImportStatus("importing");
        setError(null);
        setMessage(null);

        try {
            await importAdminContentDrafts(
                client,
                grammarDrafts,
                (completed, total) => {
                    setImportProgress({ completed, total });
                }
            );
            setMessage(
                `${grammarDrafts.length} leçons importées en brouillons.`
            );
            refresh();
        } catch (reason) {
            setError(getErrorMessage(reason));
        } finally {
            setImportStatus("idle");
        }
    }

    async function publishGrammar(): Promise<void> {
        if (!publishConfirmed) {
            return;
        }

        setImportStatus("publishing");
        setError(null);
        setMessage(null);

        try {
            const count = await publishLatestAdminContentBatch(
                client,
                "grammar_lesson"
            );
            setMessage(`${count} révision(s) Grammaire publiée(s).`);
            setPublishConfirmed(false);
            refresh();
        } catch (reason) {
            setError(getErrorMessage(reason));
        } finally {
            setImportStatus("idle");
        }
    }

    return (
        <Page>
            <PageHeader
                eyebrow="Administration"
                icon="🦕"
                title="Atelier des contenus"
                description="Préparer, relire et publier le corpus canonique sans exposer de clé serveur."
                actions={
                    <Button
                        variant="secondary"
                        onClick={() => {
                            setSelectedItem(null);
                            setNewEditorVersion(value => value + 1);
                        }}
                    >
                        + Nouveau contenu
                    </Button>
                }
            />

            <Section>
                <div className="grid gap-3 sm:grid-cols-3">
                    <StatusCard icon="📚" label="Contenus suivis" value={items.length} />
                    <StatusCard icon="🟢" label="Publiés" value={publishedCount} />
                    <StatusCard
                        icon={pendingCount > 0 ? "🟠" : "⚪"}
                        label="Brouillons en attente"
                        value={pendingCount}
                    />
                </div>
                <Card className="mt-3 p-4">
                    <ProgressBar
                        label="Couverture publiée"
                        value={publishedCount}
                        max={Math.max(items.length, 1)}
                        showValue
                    />
                </Card>
            </Section>

            {error ? (
                <Alert className="mb-5" variant="danger" title="Action interrompue">
                    {error}
                </Alert>
            ) : null}
            {message ? (
                <Alert className="mb-5" variant="success" title="Terminé">
                    {message}
                </Alert>
            ) : null}

            <GrammarImportPanel
                drafts={grammarDrafts}
                pendingCount={pendingGrammarCount}
                progress={importProgress}
                publishConfirmed={publishConfirmed}
                status={importStatus}
                onAnalyse={() => void analyseGrammarExport()}
                onImport={() => void importGrammar()}
                onPublish={() => void publishGrammar()}
                onPublishConfirmed={setPublishConfirmed}
            />

            <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,1.05fr)_minmax(24rem,0.95fr)]">
                <Section className="min-w-0">
                    <SectionHeader
                        title="Inventaire serveur"
                        description={`${filteredItems.length} résultat(s)`}
                    />
                    <ContentFilters
                        query={query}
                        typeFilter={typeFilter}
                        onQuery={setQuery}
                        onTypeFilter={setTypeFilter}
                    />
                    <ContentInventory
                        error={loadError}
                        items={filteredItems}
                        loading={loading}
                        onRetry={refresh}
                        onSelect={setSelectedItem}
                    />
                </Section>

                <AdminContentEditor
                    client={client}
                    item={selectedItem}
                    key={selectedItem
                        ? `${selectedItem.content_type}:${selectedItem.content_key}`
                        : `new:${newEditorVersion}`}
                    onChanged={refresh}
                />
            </div>
        </Page>
    );
}

function getErrorMessage(reason: unknown): string {
    return reason instanceof Error
        ? reason.message
        : "Une erreur inattendue est survenue.";
}

export {
    AdminContentWorkspace
};
