import type {
    HTMLAttributes,
    ReactNode
} from "react";

interface PageProps
    extends HTMLAttributes<HTMLDivElement> {
    children: ReactNode;
}

interface PageHeaderProps {
    eyebrow?: ReactNode;
    icon?: ReactNode;
    title: ReactNode;
    description?: ReactNode;
    actions?: ReactNode;
}

interface SectionHeaderProps {
    title: ReactNode;
    description?: ReactNode;
    actions?: ReactNode;
}

interface GridProps
    extends HTMLAttributes<HTMLDivElement> {
    children: ReactNode;
    variant?:
        | "default"
        | "levels"
        | "wide";
}

/**
 * Standard Dino application page container.
 */
function Page({
    children,
    className = "",
    ...props
}: PageProps) {
    return (
        <div
            className={`
                dino-page
                ${className}
            `}
            {...props}
        >
            {children}
        </div>
    );
}

/**
 * Main heading block for a routed page.
 */
function PageHeader({
    eyebrow,
    icon,
    title,
    description,
    actions
}: PageHeaderProps) {
    return (
        <header
            className="
                mb-6
                flex
                flex-col
                gap-4
                sm:flex-row
                sm:items-start
                sm:justify-between
                sm:mb-8
            "
        >
            <div
                className="
                    min-w-0
                    flex-1
                "
            >
                {eyebrow ? (
                    <div
                        className="
                            mb-2
                            text-xs
                            font-bold
                            uppercase
                            tracking-[0.08em]
                            text-dino-700
                        "
                    >
                        {eyebrow}
                    </div>
                ) : null}

                <div
                    className="
                        flex
                        items-start
                        gap-3
                    "
                >
                    {icon ? (
                        <span
                            className="
                                mt-0.5
                                shrink-0
                                text-3xl
                                leading-none
                            "
                            aria-hidden="true"
                        >
                            {icon}
                        </span>
                    ) : null}

                    <div className="min-w-0">
                        <h1
                            className="
                                text-2xl
                                font-bold
                                leading-tight
                                text-ink
                                sm:text-3xl
                            "
                        >
                            {title}
                        </h1>

                        {description ? (
                            <div
                                className="
                                    mt-2
                                    max-w-3xl
                                    text-sm
                                    leading-6
                                    text-muted
                                    sm:text-base
                                "
                            >
                                {description}
                            </div>
                        ) : null}
                    </div>
                </div>
            </div>

            {actions ? (
                <div
                    className="
                        flex
                        shrink-0
                        flex-wrap
                        items-center
                        gap-2
                    "
                >
                    {actions}
                </div>
            ) : null}
        </header>
    );
}

/**
 * Shared heading for a section inside one page.
 */
function SectionHeader({
    title,
    description,
    actions
}: SectionHeaderProps) {
    return (
        <div
            className="
                mb-4
                flex
                flex-col
                gap-2
                sm:flex-row
                sm:items-end
                sm:justify-between
            "
        >
            <div className="min-w-0">
                <h2
                    className="
                        text-lg
                        font-bold
                        text-ink
                    "
                >
                    {title}
                </h2>

                {description ? (
                    <div
                        className="
                            mt-1
                            text-sm
                            text-muted
                        "
                    >
                        {description}
                    </div>
                ) : null}
            </div>

            {actions ? (
                <div
                    className="
                        flex
                        shrink-0
                        items-center
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
 * Shared responsive grid.
 *
 * The variants cover the layouts currently repeated across Grammar,
 * Vocabulary, Home and institutional screens.
 */
function Grid({
    children,
    variant = "default",
    className = "",
    ...props
}: GridProps) {
    const variantClass =
        variant === "levels"
            ? `
                grid-cols-[repeat(auto-fill,minmax(8.75rem,1fr))]
            `
            : variant === "wide"
                ? `
                    grid-cols-[repeat(auto-fill,minmax(15rem,1fr))]
                `
                : `
                    grid-cols-[repeat(auto-fill,minmax(12.5rem,1fr))]
                `;

    return (
        <div
            className={`
                grid
                gap-3
                ${variantClass}
                ${className}
            `}
            {...props}
        >
            {children}
        </div>
    );
}

/**
 * Gives a page section consistent vertical spacing.
 */
function Section({
    children,
    className = "",
    ...props
}: PageProps) {
    return (
        <section
            className={`
                mb-9
                last:mb-0
                ${className}
            `}
            {...props}
        >
            {children}
        </section>
    );
}

export {
    Grid,
    Page,
    PageHeader,
    Section,
    SectionHeader
};
