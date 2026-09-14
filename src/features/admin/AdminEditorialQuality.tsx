import {
    Badge,
    ProgressBar
} from "../../ui/components/Controls.js";

interface AdminEditorialIssue {
    field: string;
    message: string;
    severity: "error" | "warning";
}

function AdminEditorialQuality({
    completion,
    issues,
    label,
    readyMessage
}: {
    completion: number;
    issues: readonly AdminEditorialIssue[];
    label: string;
    readyMessage: string;
}) {
    const errors = issues.filter(issue => issue.severity === "error");
    const warnings = issues.filter(issue => issue.severity === "warning");

    return (
        <section
            aria-label={`Qualité ${label}`}
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
                    value={completion}
                    showValue
                />
            </div>
            {issues.length ? (
                <ul className="mt-4 space-y-2 text-sm">
                    {issues.map((issue, index) => (
                        <li
                            className={issue.severity === "error" ? "text-danger" : "text-amber-800"}
                            key={`${issue.field}:${issue.message}:${index}`}
                        >
                            {issue.severity === "error" ? "🔴" : "🟠"}
                            {" "}
                            <strong>{issue.field}</strong> — {issue.message}
                        </li>
                    ))}
                </ul>
            ) : (
                <p className="mt-4 text-sm font-semibold text-dino-700">
                    🟢 {readyMessage}
                </p>
            )}
        </section>
    );
}

export { AdminEditorialQuality };
export type { AdminEditorialIssue };
