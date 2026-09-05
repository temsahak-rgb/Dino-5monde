import type {
    LessonContentSection,
    LessonExample,
    LessonTable
} from "../../types/global.js";

import {
    useI18n
} from "../../i18n/I18nProvider.js";

import {
    Button,
    Card
} from "../../ui/components/Controls.js";

import {
    PageHeader
} from "../../ui/components/Layout.js";

import {
    RichText
} from "../../ui/components/RichText.js";

interface GrammarLessonContentProps {
    section: LessonContentSection;
    onBack: () => void;
    onComplete: () => void;
}

/**
 * Displays one instructional Grammar section.
 *
 * Navigation and progression remain owned by GrammarLesson.
 * This component only presents the educational content.
 */
function GrammarLessonContent({
    section,
    onBack,
    onComplete
}: GrammarLessonContentProps) {
    const {
        localizedTextClass,
        localizedValue,
        t
    } = useI18n();

    const title =
        localizedValue(
            section.title,
            section.title_fa,
            section.id
        );

    return (
        <div
            className="
                mx-auto
                w-full
                max-w-[900px]
            "
        >
            <button
                type="button"
                onClick={
                    onBack
                }
                className="
                    mb-6
                    border-0
                    bg-transparent
                    p-0
                    text-sm
                    font-bold
                    text-dino-700
                    hover:underline
                    hover:underline-offset-4
                "
            >
                ←
                {" "}
                {t("common.back")}
            </button>

            <PageHeader
                eyebrow={
                    t(
                        "grammar.type.lesson"
                    )
                }
                icon="📖"
                title={
                    <span
                        className={
                            localizedTextClass()
                        }
                    >
                        {title}
                    </span>
                }
            />

            <Card
                className="
                    p-5
                    sm:p-6
                "
            >
                <GrammarSectionContent
                    section={
                        section
                    }
                />
            </Card>

            <Button
                fullWidth
                className="
                    mt-5
                "
                onClick={
                    onComplete
                }
            >
                ✓
                {" "}
                {t(
                    "common.continue"
                )}
            </Button>
        </div>
    );
}

/* -------------------------------------------------------------------------- */
/* Section content                                                             */
/* -------------------------------------------------------------------------- */

interface GrammarSectionContentProps {
    section: LessonContentSection;
}

function GrammarSectionContent({
    section
}: GrammarSectionContentProps) {
    return (
        <div>
            {section.content ? (
                <RichText
                    text={
                        section.content
                    }
                    className="
                        ltr-lock
                        text-[15px]
                        leading-7
                        text-neutral-700
                    "
                />
            ) : null}

            {section.table ? (
                <GrammarTable
                    table={
                        section.table
                    }
                />
            ) : null}

            {section.table2 ? (
                <GrammarSecondTable
                    section={
                        section
                    }
                />
            ) : null}

            {(
                section.examples?.length
                && !section.table2
            ) ? (
                <GrammarExamples
                    examples={
                        section.examples
                    }
                />
            ) : null}

            {section.note ? (
                <GrammarFrenchNote
                    note={
                        section.note
                    }
                />
            ) : null}

            {section.note_fa ? (
                <GrammarPersianNote
                    note={
                        section.note_fa
                    }
                />
            ) : null}
        </div>
    );
}

/* -------------------------------------------------------------------------- */
/* Tables                                                                      */
/* -------------------------------------------------------------------------- */

interface GrammarTableProps {
    table:
        LessonTable
        | null
        | undefined;
}

/**
 * Responsive educational table.
 */
function GrammarTable({
    table
}: GrammarTableProps) {
    if (!table) {
        return null;
    }

    return (
        <div
            className="
                my-5
                overflow-x-auto
                rounded-card
                border
                border-line
            "
        >
            <table
                className="
                    ltr-lock
                    min-w-full
                    border-collapse
                    text-sm
                "
            >
                <thead
                    className="
                        bg-dino-600
                        text-white
                    "
                >
                    <tr>
                        {table.headers.map(
                            (
                                header,
                                index
                            ) => (
                                <th
                                    key={
                                        `${header}-${index}`
                                    }
                                    scope="col"
                                    className="
                                        whitespace-nowrap
                                        px-3.5
                                        py-3
                                        text-left
                                        text-[13px]
                                        font-semibold
                                    "
                                >
                                    <RichText
                                        text={
                                            header
                                        }
                                        inline
                                    />
                                </th>
                            )
                        )}
                    </tr>
                </thead>

                <tbody>
                    {table.rows.map(
                        (
                            row,
                            rowIndex
                        ) => (
                            <tr
                                key={
                                    rowIndex
                                }
                                className="
                                    border-b
                                    border-line
                                    even:bg-neutral-50
                                    last:border-b-0
                                "
                            >
                                {row.map(
                                    (
                                        cell,
                                        cellIndex
                                    ) => (
                                        <td
                                            key={
                                                cellIndex
                                            }
                                            className="
                                                px-3.5
                                                py-2.5
                                                align-top
                                                text-neutral-700
                                            "
                                        >
                                            <RichText
                                                text={
                                                    cell
                                                }
                                                inline
                                            />
                                        </td>
                                    )
                                )}
                            </tr>
                        )
                    )}
                </tbody>
            </table>
        </div>
    );
}

/* -------------------------------------------------------------------------- */
/* Optional second table                                                       */
/* -------------------------------------------------------------------------- */

interface GrammarSecondTableProps {
    section: LessonContentSection;
}

/**
 * Some corpus sections use the first example as an introduction to a second
 * comparison table. This preserves that existing data contract.
 */
function GrammarSecondTable({
    section
}: GrammarSecondTableProps) {
    const firstExample =
        section.examples?.[0];

    return (
        <div>
            {firstExample ? (
                <div
                    className="
                        mt-6
                    "
                >
                    <h3
                        className="
                            ltr-lock
                            text-[15px]
                            font-bold
                            text-dino-700
                        "
                    >
                        <RichText
                            text={
                                firstExample.fr
                            }
                            inline
                        />
                    </h3>

                    {firstExample.fa ? (
                        <p
                            className="
                                persian-text
                                mt-1.5
                                text-[13px]
                                leading-6
                                text-muted
                            "
                        >
                            {firstExample.fa}
                        </p>
                    ) : null}
                </div>
            ) : null}

            <GrammarTable
                table={
                    section.table2
                }
            />
        </div>
    );
}

/* -------------------------------------------------------------------------- */
/* Examples                                                                    */
/* -------------------------------------------------------------------------- */

interface GrammarExamplesProps {
    examples:
        readonly LessonExample[];
}

function GrammarExamples({
    examples
}: GrammarExamplesProps) {
    const {
        t
    } = useI18n();

    return (
        <section
            className="
                mt-6
            "
        >
            <h3
                className="
                    mb-3
                    text-[15px]
                    font-bold
                    text-dino-700
                "
            >
                {t(
                    "grammar.examples"
                )}
            </h3>

            <div
                className="
                    grid
                    gap-2
                "
            >
                {examples.map(
                    (
                        example,
                        index
                    ) => (
                        <GrammarExample
                            key={
                                index
                            }
                            example={
                                example
                            }
                        />
                    )
                )}
            </div>
        </section>
    );
}

interface GrammarExampleProps {
    example: LessonExample;
}

function GrammarExample({
    example
}: GrammarExampleProps) {
    return (
        <div
            className="
                rounded-control
                border-s-[3px]
                border-dino-600
                bg-neutral-50
                px-3.5
                py-3
            "
        >
            <div
                className="
                    ltr-lock
                    text-[15px]
                    font-semibold
                    leading-6
                    text-ink
                "
            >
                <RichText
                    text={
                        example.fr
                    }
                    inline
                />
            </div>

            {example.fa ? (
                <p
                    className="
                        persian-text
                        mt-1.5
                        text-[13px]
                        leading-6
                        text-muted
                    "
                >
                    {example.fa}
                </p>
            ) : null}
        </div>
    );
}

/* -------------------------------------------------------------------------- */
/* Notes                                                                       */
/* -------------------------------------------------------------------------- */

interface GrammarNoteProps {
    note: string;
}

function GrammarFrenchNote({
    note
}: GrammarNoteProps) {
    return (
        <aside
            className="
                ltr-lock
                mt-5
                rounded-control
                border-s-[3px]
                border-amber-500
                bg-amber-50
                px-4
                py-3.5
                text-sm
                leading-6
                text-amber-950
            "
        >
            <div
                className="
                    flex
                    items-start
                    gap-2
                "
            >
                <span
                    className="
                        shrink-0
                    "
                    aria-hidden="true"
                >
                    💡
                </span>

                <RichText
                    text={
                        note
                    }
                />
            </div>
        </aside>
    );
}

function GrammarPersianNote({
    note
}: GrammarNoteProps) {
    return (
        <aside
            className="
                persian-text
                mt-5
                rounded-control
                border-s-[3px]
                border-amber-500
                bg-amber-50
                px-4
                py-3.5
                text-sm
                leading-6
                text-amber-950
            "
        >
            <div
                className="
                    flex
                    items-start
                    gap-2
                "
            >
                <span
                    className="
                        shrink-0
                    "
                    aria-hidden="true"
                >
                    💡
                </span>

                <div>
                    {note}
                </div>
            </div>
        </aside>
    );
}

export {
    GrammarLessonContent,
    GrammarTable
};