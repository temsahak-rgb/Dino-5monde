import {
    useI18n
} from "../../i18n/I18nProvider.js";

import type {
    LessonExample,
    LessonTable,
    TravelLessonContentSection,
    TravelSection,
    TravelTipsSection,
    TravelVocabSection
} from "../../types/global.js";

import {
    Button,
    Card,
    ProgressBar
} from "../../ui/components/Controls.js";

import {
    PageHeader
} from "../../ui/components/Layout.js";

import {
    RichText
} from "../../ui/components/RichText.js";

interface TravelSectionContentProps {
    section:
        Exclude<
            TravelSection,
            {
                type: "exercise";
            }
        >
        | TravelSection;

    sectionIndex: number;
    totalSections: number;

    onBack: () => void;
    onComplete: () => void;
}

/**
 * Displays one non-exercise Travel section.
 *
 * Supported corpus sections:
 *
 * - vocab
 * - tips
 * - lesson
 *
 * Exercise sections normally go through the shared Exercise component.
 */
function TravelSectionContent({
    section,
    sectionIndex,
    totalSections,
    onBack,
    onComplete
}: TravelSectionContentProps) {
    const {
        localizedTextClass,
        localizedValue,
        t
    } = useI18n();

    const typeLabel =
        getTravelSectionTypeLabel(
            section,
            t
        );

    const title =
        localizedValue(
            section.title,
            section.title_fa,
            typeLabel
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
                {t(
                    "common.back"
                )}
            </button>

            {totalSections > 0 ? (
                <div
                    className="
                        mb-6
                    "
                >
                    <div
                        className="
                            mb-2
                            flex
                            items-center
                            justify-between
                            gap-4
                            text-xs
                            font-semibold
                            text-muted
                        "
                    >
                        <span>
                            {sectionIndex + 1}
                            {" "}
                            /
                            {" "}
                            {totalSections}
                        </span>

                        <span>
                            {typeLabel}
                        </span>
                    </div>

                    <ProgressBar
                        value={
                            sectionIndex + 1
                        }
                        max={
                            totalSections
                        }
                    />
                </div>
            ) : null}

            <PageHeader
                icon={
                    getTravelSectionIcon(
                        section
                    )
                }
                eyebrow={
                    typeLabel
                }
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
                    border-2
                    border-dino-500
                    p-5
                    sm:p-6
                "
            >
                <TravelSectionBody
                    section={
                        section
                    }
                />

                {section.type
                    !== "exercise" ? (
                    <Button
                        fullWidth
                        className="
                            mt-6
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
                ) : null}
            </Card>
        </div>
    );
}

/* -------------------------------------------------------------------------- */
/* Dispatcher                                                                  */
/* -------------------------------------------------------------------------- */

interface TravelSectionBodyProps {
    section:
        TravelSection;
}

function TravelSectionBody({
    section
}: TravelSectionBodyProps) {
    const {
        t
    } = useI18n();

    switch (section.type) {
        case "vocab":
            return (
                <TravelVocabularyContent
                    section={
                        section
                    }
                />
            );

        case "tips":
            return (
                <TravelTipsContent
                    section={
                        section
                    }
                />
            );

        case "lesson":
            return (
                <TravelLessonContent
                    section={
                        section
                    }
                />
            );

        case "exercise":
            return (
                <p
                    className="
                        text-sm
                        text-muted
                    "
                >
                    {t(
                        "travel.exerciseOpensSeparately"
                    )}
                </p>
            );
    }
}

/* -------------------------------------------------------------------------- */
/* Vocabulary                                                                  */
/* -------------------------------------------------------------------------- */

interface TravelVocabularyContentProps {
    section:
        TravelVocabSection;
}

function TravelVocabularyContent({
    section
}: TravelVocabularyContentProps) {
    if (
        section.words.length
        === 0
    ) {
        return null;
    }

    return (
        <div
            className="
                grid
                gap-3
                sm:grid-cols-2
            "
        >
            {section.words.map(
                (
                    word,
                    index
                ) => (
                    <div
                        key={
                            `${word.fr}:${index}`
                        }
                        className="
                            rounded-card
                            border
                            border-line
                            bg-page
                            p-4
                        "
                    >
                        <div
                            className="
                                flex
                                items-start
                                gap-3
                            "
                        >
                            <span
                                className="
                                    shrink-0
                                    text-3xl
                                    leading-none
                                "
                                aria-hidden="true"
                            >
                                {word.emoji
                                    || "📝"
                                }
                            </span>

                            <div
                                className="
                                    min-w-0
                                "
                            >
                                <div
                                    className="
                                        ltr-lock
                                        text-lg
                                        font-bold
                                        text-ink
                                    "
                                >
                                    <RichText
                                        text={
                                            word.fr
                                        }
                                        inline
                                    />
                                </div>

                                {word.phonetic ? (
                                    <p
                                        className="
                                            persian-text
                                            mt-1
                                            text-sm
                                            text-muted
                                        "
                                    >
                                        🔊
                                        {" "}
                                        {word.phonetic}
                                    </p>
                                ) : null}

                                {word.fa ? (
                                    <p
                                        className="
                                            persian-text
                                            mt-1
                                            text-[15px]
                                            leading-6
                                            text-neutral-600
                                        "
                                    >
                                        {word.fa}
                                    </p>
                                ) : null}
                            </div>
                        </div>
                    </div>
                )
            )}
        </div>
    );
}

/* -------------------------------------------------------------------------- */
/* Tips                                                                        */
/* -------------------------------------------------------------------------- */

interface TravelTipsContentProps {
    section:
        TravelTipsSection;
}

function TravelTipsContent({
    section
}: TravelTipsContentProps) {
    const {
        localizedTextClass,
        localizedValue,
        t
    } = useI18n();

    if (
        section.tips.length
        === 0
    ) {
        return null;
    }

    return (
        <div
            className="
                grid
                gap-3
            "
        >
            {section.tips.map(
                (
                    tip,
                    index
                ) => {
                    const title =
                        localizedValue(
                            tip.title_fr,
                            tip.title_fa,
                            t(
                                "travel.tipFallback",
                                {
                                    number:
                                        index + 1
                                }
                            )
                        );

                    const content =
                        localizedValue(
                            tip.content_fr,
                            tip.content_fa
                        );

                    return (
                        <div
                            key={
                                index
                            }
                            className="
                                rounded-card
                                border
                                border-amber-200
                                bg-amber-50
                                p-4
                                sm:p-5
                            "
                        >
                            <h3
                                className={`
                                    flex
                                    items-start
                                    gap-2
                                    text-base
                                    font-bold
                                    text-amber-950
                                    ${localizedTextClass()}
                                `}
                            >
                                <span
                                    aria-hidden="true"
                                >
                                    {tip.icon
                                        || "💡"
                                    }
                                </span>

                                <span>
                                    {title}
                                </span>
                            </h3>

                            {content ? (
                                <div
                                    className={`
                                        mt-3
                                        text-sm
                                        leading-7
                                        text-amber-950
                                        ${localizedTextClass()}
                                    `}
                                >
                                    <RichText
                                        text={
                                            content
                                        }
                                    />
                                </div>
                            ) : null}
                        </div>
                    );
                }
            )}
        </div>
    );
}

/* -------------------------------------------------------------------------- */
/* Lesson                                                                      */
/* -------------------------------------------------------------------------- */

interface TravelLessonContentProps {
    section:
        TravelLessonContentSection;
}

function TravelLessonContent({
    section
}: TravelLessonContentProps) {
    const {
        localizedTextClass,
        localizedValue
    } = useI18n();

    const note =
        localizedValue(
            section.note,
            section.note_fa
        );

    return (
        <div>
            {section.content ? (
                <div
                    className={`
                        text-[15px]
                        leading-8
                        text-neutral-700
                        ${localizedTextClass()}
                    `}
                >
                    <RichText
                        text={
                            section.content
                        }
                    />
                </div>
            ) : null}

            {section.table ? (
                <TravelTable
                    table={
                        section.table
                    }
                />
            ) : null}

            {section.table2 ? (
                <TravelTable
                    table={
                        section.table2
                    }
                />
            ) : null}

            {section.examples?.length ? (
                <TravelExamples
                    examples={
                        section.examples
                    }
                />
            ) : null}

            {note ? (
                <div
                    className={`
                        mt-5
                        border-s-4
                        border-amber-500
                        bg-amber-50
                        px-4
                        py-3.5
                        text-sm
                        leading-6
                        text-amber-950
                        ${localizedTextClass()}
                    `}
                >
                    <span
                        className="
                            me-2
                        "
                        aria-hidden="true"
                    >
                        💡
                    </span>

                    <RichText
                        text={
                            note
                        }
                        inline
                    />
                </div>
            ) : null}
        </div>
    );
}

/* -------------------------------------------------------------------------- */
/* Examples                                                                    */
/* -------------------------------------------------------------------------- */

interface TravelExamplesProps {
    examples:
        readonly LessonExample[];
}

function TravelExamples({
    examples
}: TravelExamplesProps) {
    return (
        <div
            className="
                mt-5
                grid
                gap-2
            "
        >
            {examples.map(
                (
                    example,
                    index
                ) => (
                    <div
                        key={
                            index
                        }
                        className="
                            border-s-4
                            border-dino-500
                            bg-neutral-50
                            px-4
                            py-3
                        "
                    >
                        {example.fr ? (
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
                                />
                            </div>
                        ) : null}

                        {example.fa ? (
                            <div
                                className="
                                    persian-text
                                    mt-1.5
                                    text-sm
                                    leading-6
                                    text-muted
                                "
                            >
                                <RichText
                                    text={
                                        example.fa
                                    }
                                />
                            </div>
                        ) : null}
                    </div>
                )
            )}
        </div>
    );
}

/* -------------------------------------------------------------------------- */
/* Tables                                                                      */
/* -------------------------------------------------------------------------- */

interface TravelTableProps {
    table:
        LessonTable;
}

function TravelTable({
    table
}: TravelTableProps) {
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
                    w-full
                    min-w-[520px]
                    border-collapse
                    text-sm
                "
            >
                <thead>
                    <tr
                        className="
                            bg-dino-600
                            text-white
                        "
                    >
                        {table.headers.map(
                            (
                                header,
                                index
                            ) => (
                                <th
                                    key={
                                        index
                                    }
                                    scope="col"
                                    className="
                                        px-4
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
                                    border-neutral-100
                                    odd:bg-white
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
                                                px-4
                                                py-3
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
/* Presentation helpers                                                        */
/* -------------------------------------------------------------------------- */

type TranslationFunction =
    ReturnType<
        typeof useI18n
    >["t"];

function getTravelSectionTypeLabel(
    section:
        TravelSection,
    t:
        TranslationFunction
): string {
    switch (section.type) {
        case "vocab":
            return t(
                "travel.type.vocab"
            );

        case "tips":
            return t(
                "travel.type.tips"
            );

        case "lesson":
            return t(
                "travel.type.lesson"
            );

        case "exercise":
            return t(
                "travel.type.exercise"
            );
    }
}

function getTravelSectionIcon(
    section:
        TravelSection
): string {
    switch (section.type) {
        case "vocab":
            return "📖";

        case "tips":
            return "💡";

        case "lesson":
            return "📚";

        case "exercise":
            return "✏️";
    }
}

export {
    TravelExamples,
    TravelLessonContent,
    TravelSectionContent,
    TravelTable,
    TravelTipsContent,
    TravelVocabularyContent
};