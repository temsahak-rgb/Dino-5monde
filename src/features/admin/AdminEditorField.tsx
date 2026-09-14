import type {
    ReactNode
} from "react";

interface AdminEditorFieldProps {
    children: ReactNode;
    hint?: string;
    label: string;
    required?: boolean;
}

/** Shared accessible field wrapper for the domain-specific admin editors. */
function AdminEditorField({
    children,
    hint,
    label,
    required = false
}: AdminEditorFieldProps) {
    return (
        <label className="block min-w-0">
            <span className="mb-1 flex items-center justify-between gap-3 text-sm font-bold text-ink">
                <span>
                    {label}
                    {required ? <span className="text-danger"> *</span> : null}
                </span>
                {hint ? (
                    <span className="text-xs font-normal text-muted">{hint}</span>
                ) : null}
            </span>
            {children}
        </label>
    );
}

export {
    AdminEditorField
};
