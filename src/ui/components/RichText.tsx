import {
    Fragment,
    type ReactNode
} from "react";

interface RichTextProps {
    text: string;
    className?: string;
    inline?: boolean;
}

/**
 * Safe renderer for Dino's small Markdown-like corpus syntax.
 *
 * Supported syntax:
 * - # / ## / ### headings
 * - unordered lists using `- `
 * - **bold**
 * - *italic*
 * - `inline code`
 * - ~~strikethrough~~
 * - [text][red]
 * - line breaks
 *
 * Unlike the historical renderer, corpus text is never injected through
 * dangerouslySetInnerHTML. React escapes plain text automatically.
 */
function RichText({
    text,
    className = "",
    inline = false
}: RichTextProps) {
    if (inline) {
        return (
            <span className={className}>
                <InlineMarkup
                    text={text}
                />
            </span>
        );
    }

    return (
        <div
            className={`
                min-w-0
                ${className}
            `}
        >
            <BlockMarkup
                text={text}
            />
        </div>
    );
}

/* -------------------------------------------------------------------------- */
/* Block rendering                                                             */
/* -------------------------------------------------------------------------- */

interface BlockMarkupProps {
    text: string;
}

/**
 * Converts source lines into semantic React blocks.
 */
function BlockMarkup({
    text
}: BlockMarkupProps) {
    const lines =
        text.replace(
            /\r\n?/g,
            "\n"
        ).split("\n");

    const nodes:
        ReactNode[] = [];

    let index = 0;

    while (
        index < lines.length
    ) {
        const line =
            lines[index]
            ?? "";

        /*
         * Empty source lines become vertical spacing rather than empty
         * paragraphs.
         */
        if (
            line.trim()
            === ""
        ) {
            index++;

            continue;
        }

        const heading =
            parseHeading(
                line
            );

        if (heading) {
            nodes.push(
                renderHeading(
                    heading.level,
                    heading.content,
                    nodes.length
                )
            );

            index++;

            continue;
        }

        /*
         * Consecutive `- ` lines form one semantic list.
         */
        if (
            isListLine(
                line
            )
        ) {
            const items:
                string[] = [];

            while (
                index < lines.length
                && isListLine(
                    lines[index]
                    ?? ""
                )
            ) {
                items.push(
                    (
                        lines[index]
                        ?? ""
                    ).replace(
                        /^-\s+/,
                        ""
                    )
                );

                index++;
            }

            nodes.push(
                <ul
                    key={
                        `list-${nodes.length}`
                    }
                    className="
                        my-3
                        list-disc
                        space-y-1.5
                        ps-6
                        text-inherit
                    "
                >
                    {items.map(
                        (
                            item,
                            itemIndex
                        ) => (
                            <li
                                key={
                                    itemIndex
                                }
                                className="
                                    leading-7
                                "
                            >
                                <InlineMarkup
                                    text={
                                        item
                                    }
                                />
                            </li>
                        )
                    )}
                </ul>
            );

            continue;
        }

        /*
         * Consecutive ordinary lines belong to the same paragraph. Internal
         * line breaks are retained to preserve the previous Dino rendering.
         */
        const paragraphLines:
            string[] = [
                line
            ];

        index++;

        while (
            index < lines.length
        ) {
            const nextLine =
                lines[index]
                ?? "";

            if (
                nextLine.trim()
                    === ""
                || parseHeading(
                    nextLine
                )
                || isListLine(
                    nextLine
                )
            ) {
                break;
            }

            paragraphLines.push(
                nextLine
            );

            index++;
        }

        nodes.push(
            <p
                key={
                    `paragraph-${nodes.length}`
                }
                className="
                    my-3
                    first:mt-0
                    last:mb-0
                    leading-7
                "
            >
                <InlineMarkup
                    text={
                        paragraphLines.join(
                            "\n"
                        )
                    }
                />
            </p>
        );
    }

    return nodes;
}

/* -------------------------------------------------------------------------- */
/* Headings                                                                    */
/* -------------------------------------------------------------------------- */

type HeadingLevel =
    | 1
    | 2
    | 3;

interface ParsedHeading {
    level: HeadingLevel;
    content: string;
}

function parseHeading(
    line: string
): ParsedHeading | null {
    const match =
        /^(#{1,3})\s+(.+)$/.exec(
            line
        );

    if (!match) {
        return null;
    }

    const marker =
        match[1];

    const content =
        match[2];

    if (
        !marker
        || !content
    ) {
        return null;
    }

    return {
        level:
            marker.length as HeadingLevel,
        content
    };
}

function renderHeading(
    level: HeadingLevel,
    content: string,
    key: number
): ReactNode {
    switch (level) {
        case 1:
            return (
                <h2
                    key={
                        `heading-${key}`
                    }
                    className="
                        mb-3.5
                        mt-7
                        text-xl
                        font-bold
                        leading-tight
                        text-ink
                        first:mt-0
                    "
                >
                    <InlineMarkup
                        text={
                            content
                        }
                    />
                </h2>
            );

        case 2:
            return (
                <h3
                    key={
                        `heading-${key}`
                    }
                    className="
                        mb-3
                        mt-6
                        text-lg
                        font-bold
                        leading-tight
                        text-neutral-800
                        first:mt-0
                    "
                >
                    <InlineMarkup
                        text={
                            content
                        }
                    />
                </h3>
            );

        case 3:
            return (
                <h4
                    key={
                        `heading-${key}`
                    }
                    className="
                        mb-2.5
                        mt-5
                        text-base
                        font-bold
                        leading-tight
                        text-neutral-800
                        first:mt-0
                    "
                >
                    <InlineMarkup
                        text={
                            content
                        }
                    />
                </h4>
            );
    }
}

function isListLine(
    line: string
): boolean {
    return /^-\s+/.test(
        line
    );
}

/* -------------------------------------------------------------------------- */
/* Inline rendering                                                            */
/* -------------------------------------------------------------------------- */

interface InlineMarkupProps {
    text: string;
}

/**
 * Parses inline formatting without generating raw HTML.
 */
function InlineMarkup({
    text
}: InlineMarkupProps) {
    const lines =
        text.split("\n");

    return (
        <>
            {lines.map(
                (
                    line,
                    lineIndex
                ) => (
                    <Fragment
                        key={
                            lineIndex
                        }
                    >
                        {parseInlineMarkup(
                            line
                        )}

                        {lineIndex
                            < lines.length - 1
                            ? <br />
                            : null
                        }
                    </Fragment>
                )
            )}
        </>
    );
}

/**
 * Tokenizes the limited inline syntax supported by the Dino corpus.
 */
function parseInlineMarkup(
    text: string
): ReactNode[] {
    const pattern =
        /(\*\*[^*]+?\*\*|~~[^~]+?~~|`[^`]+?`|\[[^\]]+?\]\[red\]|\*[^*\n]+?\*)/g;

    const nodes:
        ReactNode[] = [];

    let cursor = 0;
    let match:
        RegExpExecArray | null;

    while (
        (
            match =
                pattern.exec(
                    text
                )
        )
        !== null
    ) {
        if (
            match.index
            > cursor
        ) {
            nodes.push(
                text.slice(
                    cursor,
                    match.index
                )
            );
        }

        const token =
            match[0];

        nodes.push(
            renderInlineToken(
                token,
                nodes.length
            )
        );

        cursor =
            match.index
            + token.length;
    }

    if (
        cursor < text.length
    ) {
        nodes.push(
            text.slice(
                cursor
            )
        );
    }

    return nodes;
}

function renderInlineToken(
    token: string,
    key: number
): ReactNode {
    if (
        token.startsWith(
            "**"
        )
        && token.endsWith(
            "**"
        )
    ) {
        return (
            <strong
                key={key}
                className="
                    font-bold
                    text-ink
                "
            >
                <InlineMarkup
                    text={
                        token.slice(
                            2,
                            -2
                        )
                    }
                />
            </strong>
        );
    }

    if (
        token.startsWith(
            "~~"
        )
        && token.endsWith(
            "~~"
        )
    ) {
        return (
            <del
                key={key}
                className="
                    text-muted
                "
            >
                <InlineMarkup
                    text={
                        token.slice(
                            2,
                            -2
                        )
                    }
                />
            </del>
        );
    }

    if (
        token.startsWith(
            "`"
        )
        && token.endsWith(
            "`"
        )
    ) {
        return (
            <code
                key={key}
                className="
                    rounded
                    bg-neutral-100
                    px-1.5
                    py-0.5
                    font-mono
                    text-[0.9em]
                    text-rose-700
                "
            >
                {token.slice(
                    1,
                    -1
                )}
            </code>
        );
    }

    const redMatch =
        /^\[([^\]]+)\]\[red\]$/.exec(
            token
        );

    if (
        redMatch?.[1]
    ) {
        return (
            <span
                key={key}
                className="
                    font-bold
                    text-danger
                "
            >
                <InlineMarkup
                    text={
                        redMatch[1]
                    }
                />
            </span>
        );
    }

    if (
        token.startsWith(
            "*"
        )
        && token.endsWith(
            "*"
        )
    ) {
        return (
            <em
                key={key}
                className="
                    italic
                    text-neutral-600
                "
            >
                <InlineMarkup
                    text={
                        token.slice(
                            1,
                            -1
                        )
                    }
                />
            </em>
        );
    }

    return token;
}

export {
    RichText
};