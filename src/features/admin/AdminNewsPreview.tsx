import {
    useState
} from "react";

import {
    NewsArticle
} from "../news/NewsArticle.js";

import {
    createNewsArticlePreview,
    getAdminNewsCompletion
} from "./adminNewsEditor.js";

import type {
    AdminNewsEditorValue,
    AdminNewsValidationIssue
} from "./adminNewsEditor.js";

import type {
    Language
} from "../../types/global.js";

import {
    Button
} from "../../ui/components/Controls.js";

import {
    AdminEditorialQuality
} from "./AdminEditorialQuality.js";

interface AdminNewsPreviewProps {
    issues: readonly AdminNewsValidationIssue[];
    value: AdminNewsEditorValue;
}

function AdminNewsPreview({
    issues,
    value
}: AdminNewsPreviewProps) {
    const [language, setLanguage] =
        useState<Language>("fr");
    const article = createNewsArticlePreview(value);

    return (
        <div className="space-y-4">
            <AdminEditorialQuality
                completion={getAdminNewsCompletion(issues)}
                issues={issues}
                label="de l’actualité"
                readyMessage="Cette actualité est prête à être publiée."
            />

            <details className="rounded-card border border-line bg-surface p-4">
                <summary className="cursor-pointer font-bold text-ink">
                    Aperçu réel de l’article
                </summary>
                <div className="mt-4 flex gap-2" aria-label="Langue de l’aperçu">
                    <Button
                        aria-pressed={language === "fr"}
                        variant={language === "fr" ? "primary" : "secondary"}
                        onClick={() => setLanguage("fr")}
                    >
                        Français
                    </Button>
                    <Button
                        aria-pressed={language === "fa"}
                        variant={language === "fa" ? "primary" : "secondary"}
                        onClick={() => setLanguage("fa")}
                    >
                        فارسی
                    </Button>
                </div>
                <div className="mt-4 rounded-card border border-line bg-page p-3 sm:p-5">
                    <NewsArticle
                        article={article}
                        grammar={article.content.grammar ?? []}
                        hasHiddenGrammar={false}
                        preview
                        previewLanguage={language}
                        vocabulary={article.content.vocabulary ?? []}
                    />
                </div>
            </details>
        </div>
    );
}

export {
    AdminNewsPreview
};
