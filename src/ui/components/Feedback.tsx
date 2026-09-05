import type {
    HTMLAttributes,
    ReactNode
} from "react";

import {
    Button
} from "./Controls.js";

type FeedbackVariant =
    | "neutral"
    | "success"
    | "warning"
    | "danger"
    | "info";

type DivAttributesWithoutTitle =
    Omit<
        HTMLAttributes<HTMLDivElement>,
        "title"
    >;

interface FeedbackPanelProps
    extends DivAttributesWithoutTitle {
    icon?: ReactNode;
    title: ReactNode;
    description?: ReactNode;
    actions?: ReactNode;
    variant?: FeedbackVariant;
}

interface LoadingStateProps {
    label?: ReactNode;
    description?: ReactNode;
}

interface EmptyStateProps {
    icon?: ReactNode;
    title: ReactNode;
    description?: ReactNode;
    action?: ReactNode;
}

interface ErrorStateProps {
    title: ReactNode;
    description?: ReactNode;
    retryLabel?: ReactNode;
    onRetry?: () => void;
    action?: ReactNode;
}

interface AlertProps
    extends DivAttributesWithoutTitle {
    children: ReactNode;
    title?: ReactNode;
    variant?: FeedbackVariant;
}

interface ResultStateProps {
    icon?: ReactNode;
    title: ReactNode;
    description?: ReactNode;
    score?: ReactNode;
    actions?: ReactNode;
    variant?: FeedbackVariant;
}

function getFeedbackClasses(
    variant: FeedbackVariant
): string {
    switch (variant) {
        case "success":
            return `
                border-dino-200
                bg-dino-50
                text-dino-900
            `;

        case "warning":
            return `
                border-amber-200
                bg-warning-soft
                text-amber-950
            `;

        case "danger":
            return `
                border-red-200
                bg-danger-soft
                text-red-950
            `;

        case "info":
            return `
                border-sky-200
                bg-info-soft
                text-sky-950
            `;

        case "neutral":
            return `
                border-line
                bg-surface
                text-ink
            `;
    }
}

/**
 * Generic centered feedback panel.
 *
 * Used by loading, empty, error and result states so pages do not need to
 * recreate the same visual structure.
 */
function FeedbackPanel({
    icon,
    title,
    description,
    actions,
    variant = "neutral",
    className = "",
    ...props
}: FeedbackPanelProps) {
    return (
        <div
            className={`
                mx-auto
                flex
                w-full
                max-w-xl
                flex-col
                items-center
                rounded-panel
                border
                px-6
                py-10
                text-center
                ${getFeedbackClasses(
                    variant
                )}
                ${className}
            `}
            {...props}
        >
            {icon ? (
                <div
                    className="
                        mb-4
                        text-5xl
                        leading-none
                    "
                    aria-hidden="true"
                >
                    {icon}
                </div>
            ) : null}

            <h1
                className="
                    text-xl
                    font-bold
                    leading-tight
                "
            >
                {title}
            </h1>

            {description ? (
                <div
                    className="
                        mt-3
                        max-w-md
                        text-sm
                        leading-6
                        opacity-75
                    "
                >
                    {description}
                </div>
            ) : null}

            {actions ? (
                <div
                    className="
                        mt-6
                        flex
                        flex-wrap
                        items-center
                        justify-center
                        gap-2
                    "
                >
                    {actions}
                </div>
            ) : null}
        </div>
    );
}

/**
 * Standard application loading state.
 */
function LoadingState({
    label = "Chargement…",
    description
}: LoadingStateProps) {
    return (
        <div
            className="
                flex
                min-h-56
                flex-col
                items-center
                justify-center
                px-6
                text-center
            "
            role="status"
            aria-live="polite"
        >
            <div
                className="
                    size-9
                    animate-spin
                    rounded-full
                    border-4
                    border-dino-100
                    border-t-dino-600
                "
                aria-hidden="true"
            />

            <p
                className="
                    mt-4
                    text-sm
                    font-bold
                    text-ink
                "
            >
                {label}
            </p>

            {description ? (
                <div
                    className="
                        mt-1
                        max-w-md
                        text-sm
                        text-muted
                    "
                >
                    {description}
                </div>
            ) : null}
        </div>
    );
}

/**
 * Generic empty-content state.
 */
function EmptyState({
    icon = "🦕",
    title,
    description,
    action
}: EmptyStateProps) {
    return (
        <FeedbackPanel
            icon={icon}
            title={title}
            description={description}
            actions={action}
        />
    );
}

/**
 * Generic recoverable error state.
 */
function ErrorState({
    title,
    description,
    retryLabel = "Réessayer",
    onRetry,
    action
}: ErrorStateProps) {
    const actions =
        onRetry
            ? (
                <>
                    <Button
                        variant="primary"
                        onClick={onRetry}
                    >
                        {retryLabel}
                    </Button>

                    {action}
                </>
            )
            : action;

    return (
        <FeedbackPanel
            icon="⚠️"
            title={title}
            description={description}
            actions={actions}
            variant="danger"
            role="alert"
        />
    );
}

/**
 * Inline contextual message.
 */
function Alert({
    children,
    title,
    variant = "info",
    className = "",
    ...props
}: AlertProps) {
    return (
        <div
            className={`
                rounded-card
                border
                px-4
                py-3
                text-sm
                leading-6
                ${getFeedbackClasses(
                    variant
                )}
                ${className}
            `}
            role={
                variant === "danger"
                    ? "alert"
                    : "status"
            }
            {...props}
        >
            {title ? (
                <div
                    className="
                        mb-1
                        font-bold
                    "
                >
                    {title}
                </div>
            ) : null}

            <div>
                {children}
            </div>
        </div>
    );
}

/**
 * Generic activity completion/result state.
 */
function ResultState({
    icon = "🎉",
    title,
    description,
    score,
    actions,
    variant = "success"
}: ResultStateProps) {
    return (
        <FeedbackPanel
            icon={icon}
            title={title}
            variant={variant}
            description={
                <>
                    {score ? (
                        <div
                            className="
                                mb-2
                                text-2xl
                                font-bold
                                opacity-100
                            "
                        >
                            {score}
                        </div>
                    ) : null}

                    {description}
                </>
            }
            actions={actions}
        />
    );
}

export {
    Alert,
    EmptyState,
    ErrorState,
    FeedbackPanel,
    LoadingState,
    ResultState
};

export type {
    FeedbackPanelProps,
    FeedbackVariant
};