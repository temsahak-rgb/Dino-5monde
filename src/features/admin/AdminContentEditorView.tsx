import {
    useEffect,
    useState,
    type ChangeEvent,
    type Dispatch,
    type FormEvent,
    type ReactNode,
    type SetStateAction
} from "react";

import {
    AdminContentRevisionHistory
} from "./AdminContentRevisionHistory.js";

import {
    AdminNewsEditorFields
} from "./AdminNewsEditorFields.js";

import {
    readAdminNewsEditor,
    updateAdminNewsEditor,
    validateAdminNewsEditor
} from "./adminNewsEditor.js";

import {
    createAdminContentEditorFromRevision,
    createAdminPayloadTemplate,
    createEmptyAdminContentEditor,
    parseAdminContentEditor
} from "./adminContentEditor.js";

import type {
    AdminContentEditorValue
} from "./adminContentEditor.js";

import {
    loadAdminContentRevisions,
    publishAdminContentRevision,
    saveAdminContentDraft
} from "./adminContentRepository.js";

import type {
    AdminContentItemRpcRow,
    AdminContentRevisionRpcRow,
    CanonicalContentType
} from "../../services/backend/database.types.js";

import type {
    DinoBackendClient
} from "../../services/backend/supabaseClient.js";

import {
    Button,
    Input,
    Select,
    Textarea
} from "../../ui/components/Controls.js";

import {
    Alert
} from "../../ui/components/Feedback.js";

import {
    Section,
    SectionHeader
} from "../../ui/components/Layout.js";

interface AdminContentEditorProps {
    availableItems: readonly AdminContentItemRpcRow[];
    client: DinoBackendClient;
    item: AdminContentItemRpcRow | null;
    onChanged: (identity?: {
        contentKey: string;
        contentType: CanonicalContentType;
    }) => void;
}

const editorContentTypes: Array<{
    label: string;
    value: CanonicalContentType;
}> = [
    { label: "Grammaire", value: "grammar_lesson" },
    { label: "Actualité", value: "news_article" },
    { label: "Voyage", value: "travel_lesson" },
    { label: "Vocabulaire", value: "vocabulary_pack" }
];

function AdminContentEditor({
    availableItems,
    client,
    item,
    onChanged
}: AdminContentEditorProps) {
    const [value, setValue] =
        useState<AdminContentEditorValue>(
            createEmptyAdminContentEditor
        );
    const [revisions, setRevisions] =
        useState<AdminContentRevisionRpcRow[]>([]);
    const [selectedRevision, setSelectedRevision] =
        useState<number | null>(null);
    const [revisionRefresh, setRevisionRefresh] =
        useState(0);
    const [loading, setLoading] =
        useState(false);
    const [action, setAction] =
        useState<"idle" | "saving" | "publishing">("idle");
    const [message, setMessage] =
        useState<string | null>(null);
    const [error, setError] =
        useState<string | null>(null);
    const [dirty, setDirty] =
        useState(false);

    const setDraftValue: Dispatch<
        SetStateAction<AdminContentEditorValue>
    > = nextValue => {
        setDirty(true);
        setValue(nextValue);
    };

    const newsIssues = value.contentType === "news_article"
        ? validateAdminNewsEditor(
            readAdminNewsEditor(value),
            availableItems
        )
        : [];
    const newsErrors = newsIssues.filter(
        issue => issue.severity === "error"
    );
    const publicationBlockedReason = dirty
        ? "Enregistrez vos modifications en brouillon avant de publier."
        : newsErrors.length > 0
            ? `${newsErrors.length} erreur(s) éditoriale(s) bloquent la publication.`
            : undefined;

    useEffect(
        () => {
            setMessage(null);
            setError(null);
        },
        [
            item?.content_key,
            item?.content_type
        ]
    );

    useEffect(
        () => {

            if (!item) {
                setValue(createEmptyAdminContentEditor());
                setDirty(false);
                setRevisions([]);
                setSelectedRevision(null);
                return;
            }

            let active = true;
            setLoading(true);

            void loadAdminContentRevisions(
                client,
                item.content_type,
                item.content_key
            ).then(
                loaded => {
                    if (!active) {
                        return;
                    }

                    setRevisions(loaded);
                    setLoading(false);

                    if (loaded.length > 0) {
                        setSelectedRevision(
                            loaded[0].revision_number
                        );
                        setValue(
                            createAdminContentEditorFromRevision(
                                item,
                                loaded[0]
                            )
                        );
                        setDirty(false);
                    }
                },
                reason => {
                    if (active) {
                        setLoading(false);
                        setError(getErrorMessage(reason));
                    }
                }
            );

            return () => {
                active = false;
            };
        },
        [client, item, revisionRefresh]
    );

    async function saveDraft(
        event: FormEvent
    ): Promise<void> {
        event.preventDefault();
        setAction("saving");
        setMessage(null);
        setError(null);

        try {
            const result = await saveAdminContentDraft(
                client,
                parseAdminContentEditor(value)
            );
            setMessage(
                `Révision ${result.revision_number} enregistrée en brouillon.`
            );
            onChanged({
                contentKey: result.content_key,
                contentType: result.content_type
            });

            if (item) {
                setRevisionRefresh(current => current + 1);
            }
        } catch (reason) {
            setError(getErrorMessage(reason));
        } finally {
            setAction("idle");
        }
    }

    async function publishRevision(): Promise<void> {
        if (!item || !selectedRevision) {
            return;
        }

        setAction("publishing");
        setMessage(null);
        setError(null);

        try {
            await publishAdminContentRevision(
                client,
                item.content_type,
                item.content_key,
                selectedRevision
            );
            setMessage(`Révision ${selectedRevision} publiée.`);
            onChanged({
                contentKey: item.content_key,
                contentType: item.content_type
            });
            setRevisionRefresh(current => current + 1);
        } catch (reason) {
            setError(getErrorMessage(reason));
        } finally {
            setAction("idle");
        }
    }

    return (
        <Section className="min-w-0">
            <SectionHeader
                title={item
                    ? `Modifier ${item.content_key}`
                    : "Nouveau contenu"}
                description="Chaque sauvegarde produit une révision immuable."
            />

            {error ? (
                <Alert className="mb-3" variant="danger" title="Édition interrompue">
                    {error}
                </Alert>
            ) : null}
            {message ? (
                <Alert className="mb-3" variant="success" title="Terminé">
                    {message}
                </Alert>
            ) : null}

            <form
                className="space-y-4 rounded-card border border-line bg-surface p-4"
                onSubmit={event => void saveDraft(event)}
            >
                <div className="grid gap-3 sm:grid-cols-2">
                    <EditorField label="Type">
                        <Select
                            aria-label="Type de contenu"
                            disabled={Boolean(item)}
                            value={value.contentType}
                            onChange={event => {
                                updateEditorField(
                                    setDraftValue,
                                    "contentType",
                                    event.target.value as CanonicalContentType
                                );
                            }}
                        >
                            {editorContentTypes.map(option => (
                                <option key={option.value} value={option.value}>
                                    {option.label}
                                </option>
                            ))}
                        </Select>
                    </EditorField>

                    <EditorField label="Identifiant stable">
                        <Input
                            className="font-mono"
                            disabled={Boolean(item)}
                            required
                            value={value.contentKey}
                            onChange={changeEditor("contentKey", setDraftValue)}
                        />
                    </EditorField>
                </div>

                {value.contentType === "news_article" ? (
                    <AdminNewsEditorFields
                        availableItems={availableItems}
                        value={value}
                        onChange={setDraftValue}
                    />
                ) : (
                    <GenericContentFields
                        value={value}
                        setValue={setDraftValue}
                    />
                )}

                <details>
                    <summary className="cursor-pointer text-sm font-bold text-dino-700">
                        Paramètres techniques
                    </summary>
                    <div className="mt-3 grid gap-3 sm:grid-cols-2">
                        <EditorField label="Version du schéma">
                            <Input
                                min="1"
                                required
                                type="number"
                                value={value.schemaVersion}
                                onChange={changeEditor("schemaVersion", setDraftValue)}
                            />
                        </EditorField>
                        <EditorField label="Provenance">
                            <Input
                                className="font-mono"
                                value={value.sourcePath}
                                onChange={changeEditor("sourcePath", setDraftValue)}
                            />
                        </EditorField>
                    </div>
                </details>

                <Button
                    fullWidth
                    type="submit"
                    disabled={action !== "idle"}
                >
                    {action === "saving"
                        ? "Enregistrement…"
                        : "Enregistrer en brouillon"}
                </Button>
            </form>

            {item ? (
                <AdminContentRevisionHistory
                    action={action}
                    loading={loading}
                    publicationBlockedReason={publicationBlockedReason}
                    revisions={revisions}
                    selectedRevision={selectedRevision}
                    onPublish={() => void publishRevision()}
                    onSelect={revision => {
                        setSelectedRevision(revision.revision_number);
                        setValue(
                            createAdminContentEditorFromRevision(
                                item,
                                revision
                            )
                        );
                        setDirty(false);
                    }}
                />
            ) : null}
        </Section>
    );
}

function GenericContentFields({
    setValue,
    value
}: {
    setValue: Dispatch<SetStateAction<AdminContentEditorValue>>;
    value: AdminContentEditorValue;
}) {
    return (
        <>
            <EditorField label="Titre français">
                <Input
                    required
                    value={value.titleFr}
                    onChange={changeEditor("titleFr", setValue)}
                />
            </EditorField>

            <div className="grid gap-3 sm:grid-cols-2">
                <EditorField label="Niveau">
                    <Input
                        value={value.level}
                        onChange={changeEditor("level", setValue)}
                    />
                </EditorField>
                <EditorField label="Titre persan">
                    <Input
                        dir="rtl"
                        value={value.titleFa}
                        onChange={changeEditor("titleFa", setValue)}
                    />
                </EditorField>
            </div>

            <div>
                <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                    <label className="text-sm font-bold text-ink" htmlFor="admin-payload">
                        Payload JSON
                    </label>
                    <Button
                        variant="ghost"
                        onClick={() => setValue(current => ({
                            ...current,
                            payloadText: createAdminPayloadTemplate(current)
                        }))}
                    >
                        Générer un modèle
                    </Button>
                </div>
                <Textarea
                    id="admin-payload"
                    className="min-h-80 resize-y font-mono text-xs leading-5"
                    required
                    spellCheck={false}
                    value={value.payloadText}
                    onChange={changeEditor("payloadText", setValue)}
                />
            </div>
        </>
    );
}

function EditorField({
    children,
    label
}: {
    children: ReactNode;
    label: string;
}) {
    return (
        <label className="block">
            <span className="mb-1 block text-sm font-bold text-ink">
                {label}
            </span>
            {children}
        </label>
    );
}

function changeEditor(
    field: keyof AdminContentEditorValue,
    setValue: Dispatch<SetStateAction<AdminContentEditorValue>>
) {
    return (
        event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
    ): void => {
        updateEditorField(
            setValue,
            field,
            event.target.value
        );
    };
}

function updateEditorField(
    setValue: Dispatch<SetStateAction<AdminContentEditorValue>>,
    field: keyof AdminContentEditorValue,
    value: string
): void {
    setValue(current => {
        const updated = {
            ...current,
            [field]: value
        };

        if (
            field === "contentType"
            && value !== "news_article"
        ) {
            return {
                ...updated,
                payloadText: createAdminPayloadTemplate(updated)
            };
        }

        if (
            updated.contentType === "news_article"
            && (
                field === "contentType"
                || field === "contentKey"
            )
        ) {
            const news = readAdminNewsEditor(updated);
            return updateAdminNewsEditor(
                updated,
                {
                    ...news,
                    contentKey: updated.contentKey
                }
            );
        }

        return updated;
    });
}

function getErrorMessage(reason: unknown): string {
    return reason instanceof Error
        ? reason.message
        : "Une erreur inattendue est survenue.";
}

export {
    AdminContentEditor
};
