import {
    type ButtonHTMLAttributes,
    type HTMLAttributes,
    type ReactNode
} from "react";

import {
    useNavigate
} from "react-router";

type ButtonVariant =
    | "primary"
    | "secondary"
    | "danger"
    | "ghost";

type BadgeVariant =
    | "default"
    | "success"
    | "warning"
    | "danger"
    | "info";

interface ButtonProps
    extends ButtonHTMLAttributes<HTMLButtonElement> {
    children: ReactNode;
    variant?: ButtonVariant;
    fullWidth?: boolean;
}

interface BackButtonProps
    extends Omit<
        ButtonHTMLAttributes<HTMLButtonElement>,
        "children"
    > {
    children?: ReactNode;
    fallback?: string;
}

interface IconButtonProps
    extends ButtonHTMLAttributes<HTMLButtonElement> {
    children: ReactNode;
    label: string;
}

interface CardProps
    extends HTMLAttributes<HTMLDivElement> {
    children: ReactNode;
    interactive?: boolean;
}

interface BadgeProps
    extends HTMLAttributes<HTMLSpanElement> {
    children: ReactNode;
    variant?: BadgeVariant;
}

interface ProgressBarProps {
    value: number;
    max?: number;
    label?: string;
    showValue?: boolean;
}

function getButtonVariantClass(
    variant: ButtonVariant
): string {
    switch (variant) {
        case "primary":
            return `
                border-transparent
                bg-dino-600
                text-white
                hover:bg-dino-700
            `;

        case "secondary":
            return `
                border-line
                bg-surface
                text-ink
                hover:border-dino-300
                hover:bg-dino-50
            `;

        case "danger":
            return `
                border-danger
                bg-danger
                text-white
                hover:opacity-90
            `;

        case "ghost":
            return `
                border-transparent
                bg-transparent
                text-dino-700
                hover:bg-dino-50
            `;
    }
}

/**
 * Shared Dino button.
 */
function Button({
    children,
    variant = "primary",
    fullWidth = false,
    className = "",
    type = "button",
    ...props
}: ButtonProps) {
    return (
        <button
            type={type}
            className={`
                inline-flex
                min-h-11
                items-center
                justify-center
                gap-2
                rounded-control
                border
                px-4
                py-2.5
                text-sm
                font-bold
                transition
                duration-150
                disabled:pointer-events-none
                disabled:opacity-50
                ${getButtonVariantClass(
                    variant
                )}
                ${
                    fullWidth
                        ? "w-full"
                        : ""
                }
                ${className}
            `}
            {...props}
        >
            {children}
        </button>
    );
}

/**
 * Browser-history back button with an optional application fallback.
 */
function BackButton({
    children = "←",
    fallback = "/",
    className = "",
    onClick,
    ...props
}: BackButtonProps) {
    const navigate =
        useNavigate();

    return (
        <button
            type="button"
            className={`
                mb-6
                inline-flex
                items-center
                gap-2
                border-0
                bg-transparent
                p-0
                text-sm
                font-bold
                text-dino-700
                hover:underline
                hover:underline-offset-4
                ${className}
            `}
            onClick={
                event => {
                    onClick?.(
                        event
                    );

                    if (
                        event.defaultPrevented
                    ) {
                        return;
                    }

                    if (
                        window.history.length > 1
                    ) {
                        navigate(-1);
                        return;
                    }

                    navigate(
                        fallback,
                        {
                            replace: true
                        }
                    );
                }
            }
            {...props}
        >
            {children}
        </button>
    );
}

/**
 * Accessible icon-only button.
 */
function IconButton({
    children,
    label,
    className = "",
    type = "button",
    ...props
}: IconButtonProps) {
    return (
        <button
            type={type}
            aria-label={label}
            title={label}
            className={`
                inline-grid
                size-10
                shrink-0
                place-items-center
                rounded-control
                border
                border-transparent
                bg-transparent
                text-lg
                transition
                hover:bg-dino-50
                disabled:pointer-events-none
                disabled:opacity-50
                ${className}
            `}
            {...props}
        >
            {children}
        </button>
    );
}

/**
 * Generic surface container.
 */
function Card({
    children,
    interactive = false,
    className = "",
    ...props
}: CardProps) {
    return (
        <div
            className={`
                rounded-card
                border
                border-line
                bg-surface
                ${
                    interactive
                        ? `
                            transition
                            duration-150
                            hover:-translate-y-px
                            hover:border-dino-300
                            hover:shadow-card
                        `
                        : ""
                }
                ${className}
            `}
            {...props}
        >
            {children}
        </div>
    );
}

function getBadgeVariantClass(
    variant: BadgeVariant
): string {
    switch (variant) {
        case "success":
            return `
                bg-dino-100
                text-dino-800
            `;

        case "warning":
            return `
                bg-warning-soft
                text-amber-800
            `;

        case "danger":
            return `
                bg-danger-soft
                text-danger
            `;

        case "info":
            return `
                bg-info-soft
                text-info
            `;

        case "default":
            return `
                bg-line-soft
                text-ink-soft
            `;
    }
}

/**
 * Compact status badge.
 */
function Badge({
    children,
    variant = "default",
    className = "",
    ...props
}: BadgeProps) {
    return (
        <span
            className={`
                inline-flex
                items-center
                rounded-full
                px-2
                py-0.5
                text-xs
                font-bold
                ${getBadgeVariantClass(
                    variant
                )}
                ${className}
            `}
            {...props}
        >
            {children}
        </span>
    );
}

/**
 * Shared progress indicator.
 */
function ProgressBar({
    value,
    max = 100,
    label,
    showValue = false
}: ProgressBarProps) {
    const safeMax =
        max > 0
            ? max
            : 100;

    const safeValue =
        Math.min(
            Math.max(
                value,
                0
            ),
            safeMax
        );

    const percentage =
        Math.round(
            (
                safeValue
                / safeMax
            )
            * 100
        );

    return (
        <div>
            {(
                label
                || showValue
            ) ? (
                <div
                    className="
                        mb-2
                        flex
                        items-center
                        justify-between
                        gap-3
                        text-xs
                        font-semibold
                        text-muted
                    "
                >
                    <span>
                        {label}
                    </span>

                    {showValue ? (
                        <span>
                            {percentage}%
                        </span>
                    ) : null}
                </div>
            ) : null}

            <div
                className="
                    h-1.5
                    overflow-hidden
                    rounded-full
                    bg-line
                "
                role="progressbar"
                aria-valuemin={0}
                aria-valuemax={safeMax}
                aria-valuenow={safeValue}
                aria-label={
                    label
                    ?? "Progression"
                }
            >
                <div
                    className="
                        h-full
                        rounded-full
                        bg-dino-600
                        transition-[width]
                        duration-200
                    "
                    style={{
                        width:
                            `${percentage}%`
                    }}
                />
            </div>
        </div>
    );
}

export {
    BackButton,
    Badge,
    Button,
    Card,
    IconButton,
    ProgressBar
};

export type {
    BadgeProps,
    ButtonProps,
    CardProps
};