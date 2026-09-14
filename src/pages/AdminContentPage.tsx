import {
    useEffect,
    useState,
    type ReactNode
} from "react";

import {
    Link
} from "react-router";

import {
    AdminContentWorkspace
} from "../features/admin/AdminContentWorkspace.js";

import {
    loadContentAdminStatus
} from "../features/admin/adminContentRepository.js";

import {
    useAuth
} from "../services/backend/AuthProvider.js";

import {
    useBackend
} from "../services/backend/BackendProvider.js";

import {
    ErrorState,
    LoadingState
} from "../ui/components/Feedback.js";

import {
    Page,
    PageHeader
} from "../ui/components/Layout.js";

type AccessStatus =
    | "loading"
    | "allowed"
    | "denied"
    | "error";

function AdminContentPage() {
    const {
        status: authStatus,
        user
    } = useAuth();
    const {
        client,
        connectionStatus
    } = useBackend();
    const [accessStatus, setAccessStatus] =
        useState<AccessStatus>("loading");
    const [retryCount, setRetryCount] =
        useState(0);

    useEffect(
        () => {
            if (
                authStatus !== "signed-in"
                || !client
            ) {
                setAccessStatus("loading");
                return;
            }

            let active = true;

            void loadContentAdminStatus(client).then(
                allowed => {
                    if (active) {
                        setAccessStatus(
                            allowed
                                ? "allowed"
                                : "denied"
                        );
                    }
                },
                () => {
                    if (active) {
                        setAccessStatus("error");
                    }
                }
            );

            return () => {
                active = false;
            };
        },
        [
            authStatus,
            client,
            retryCount
        ]
    );

    if (connectionStatus === "disabled") {
        return (
            <AdminShell>
                <ErrorState
                    title="Backend requis"
                    description="Le panel éditorial fonctionne uniquement avec Supabase configuré."
                />
            </AdminShell>
        );
    }

    if (
        authStatus === "loading"
        || connectionStatus === "connecting"
    ) {
        return (
            <AdminShell>
                <LoadingState label="Vérification de la session…" />
            </AdminShell>
        );
    }

    if (
        authStatus !== "signed-in"
        || !user
    ) {
        return (
            <AdminShell>
                <ErrorState
                    title="Connexion requise"
                    description="Connectez-vous avec votre compte administrateur avant d’ouvrir l’atelier éditorial."
                    action={
                        <Link
                            className="inline-flex min-h-11 items-center justify-center rounded-control bg-dino-600 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-dino-700"
                            to="/auth?returnTo=%2Fadmin%2Fcontent"
                        >
                            Se connecter
                        </Link>
                    }
                />
            </AdminShell>
        );
    }

    if (accessStatus === "loading") {
        return (
            <AdminShell>
                <LoadingState label="Vérification des droits éditoriaux…" />
            </AdminShell>
        );
    }

    if (accessStatus === "denied") {
        return (
            <AdminShell>
                <ErrorState
                    title="Accès administrateur requis"
                    description={
                        <>
                            Ce compte n’est pas dans l’allowlist éditoriale.
                            <span className="mt-2 block break-all font-mono text-xs">
                                Identifiant : {user.id}
                            </span>
                        </>
                    }
                />
            </AdminShell>
        );
    }

    if (
        accessStatus === "error"
        || !client
    ) {
        return (
            <AdminShell>
                <ErrorState
                    title="Vérification impossible"
                    description="Le serveur n’a pas pu confirmer les droits administrateur."
                    retryLabel="Recommencer"
                    onRetry={() => {
                        setAccessStatus("loading");
                        setRetryCount(value => value + 1);
                    }}
                />
            </AdminShell>
        );
    }

    return (
        <AdminContentWorkspace client={client} />
    );
}

function AdminShell({
    children
}: {
    children: ReactNode;
}) {
    return (
        <Page>
            <PageHeader
                eyebrow="Administration"
                icon="🦕"
                title="Atelier des contenus"
                description="Créer, réviser et publier le corpus canonique."
            />
            {children}
        </Page>
    );
}

export {
    AdminContentPage
};
