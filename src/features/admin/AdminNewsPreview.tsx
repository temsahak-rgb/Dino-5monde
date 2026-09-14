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
    Badge,
    Button,
    ProgressBar
} from "../../ui/components/Controls.js";

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
    const errors = issues.filter(issue => issue.severity === "error");
    const warnings = issues.filter(issue => issue.severity === "warning");
    const article = createNewsArticlePreview(value);

    return (
        <div className="space-y-4">
            <section
                aria-label="Qualité de l’actualité"
                className="rounded-card border border-line bg-surface p-4"
            >
                <div className="flex flex-wrap items-center justify-between gap-3">
                    <h3 className="font-bold text-ink">Qualité avant publication</h3>
                    <div className="flex gap-2">
                        <Badge variant={errors.length ? "danger" : "success"}>
                            {errors.length} erreur(s)
                        </Badge>
                        <Badge variant={warnings.length ? "warning" : "success"}>
                            {warnings.length} conseil(s)
                        </Badge>
                    </div>
                </div>
                <div className="mt-4">
                    <ProgressBar
                        label="Complétion éditoriale"
                        value={getAdminNewsCompletion(issues)}
                        showValue
                    />
                </div>
                {issues.length ? (
                    <ul className="mt-4 space-y-2 text-sm">
                        {issues.map((issue, index) => (
                            <li
                                className={issue.severity === "error"
                                    ? "text-danger"
                                    : "text-amber-800"}
                                key={`${issue.field}:${index}`}
                            >
                                {issue.severity === "error" ? "🔴" : "🟠"}
                                {" "}
                                <strong>{issue.field}</strong> — {issue.message}
                            </li>
                        ))}
                    </ul>
                ) : (
                    <p className="mt-4 text-sm font-semibold text-dino-700">
                        🟢 Cette actualité est prête à être publiée.
                    </p>
                )}
            </section>

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
