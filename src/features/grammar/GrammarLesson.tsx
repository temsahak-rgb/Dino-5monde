import {
    useState
} from "react";

import {
    getLessonProgress,
    markLessonCompleted,
    markSectionCompleted
} from "../../core/progressEngine.js";

import {
    Exercise
} from "../exercises/Exercise.js";

import {
    useI18n
} from "../../i18n/I18nProvider.js";

import type {
    GrammarLevel,
    LessonData,
    LessonProgress,
    LessonSection
} from "../../types/global.js";

import {
    Badge,
    ProgressBar
} from "../../ui/components/Controls.js";

import {
    PageHeader
} from "../../ui/components/Layout.js";

import {
    GrammarLessonContent
} from "./GrammarLessonContent.js";

import {
    isBookmarked,
    setLessonStatus,
    toggleBookmark
} from "./grammarEngine.js";

interface GrammarLessonProps {
    lessonId: string;
    level: GrammarLevel;
    lesson: LessonData;
}

/**
 * Interactive Grammar lesson.
 *
 * The durable route remains:
 *
 * /grammar/lesson/:lessonId
 *
 * Individual lesson/exercise sections are local UI state.
 */
function GrammarLesson({
    lessonId,
    level,
    lesson
}: GrammarLessonProps) {
    const {
        localizedTextClass,
        localizedValue,
        t
    } = useI18n();

    const [
        progress,
        setProgress
    ] =
        useState<LessonProgress>(
            () =>
                getLessonProgress(
                    lessonId
                )
        );

    const [
        bookmarked,
        setBookmarked
    ] =
        useState(
            () =>
                isBookmarked(
                    lessonId
                )
        );

    const [
        selectedSectionId,
        setSelectedSectionId
    ] =
        useState<string | null>(
            null
        );

    const sections =
        lesson.sections;

    const selectedSection =
        selectedSectionId
            ? sections.find(
                section =>
                    section.id
                    === selectedSectionId
            )
            : undefined;

    /*
     * An opened section replaces the lesson overview.
     */
    if (
        selectedSection?.type
        === "lesson"
    ) {
        return (
            <GrammarLessonContent
                section={
                    selectedSection
                }
                onBack={
                    returnToOverview
                }
                onComplete={() => {
                    completeSection(
                        selectedSection.id
                    );
                }}
            />
        );
    }

    if (
        selectedSection
        && (
            selectedSection.type
                === "exercise"
            || selectedSection.type
                === "quiz"
        )
    ) {
        return (
            <Exercise
                lessonId={
                    lessonId
                }
                section={
                    selectedSection
                }
                onBack={
                    returnToOverview
                }
                onComplete={() => {
                    completeSection(
                        selectedSection.id
                    );
                }}
            />
        );
    }

    const title =
        localizedValue(
            lesson.title,
            lesson.title_fa,
            lessonId
        );

    const completedCount =
        sections.filter(
            section =>
                progress.completedSections
                    .includes(
                        section.id
                    )
        ).length;

    const lessonComplete =
        sections.length > 0
        && completedCount
            === sections.length;

    return (
        <>
            <div
                className="
                    flex
                    items-start
                    justify-between
                    gap-4
                "
            >
                <div
                    className="
                        min-w-0
                        flex-1
                    "
                >
                    <PageHeader
                        icon={
                            lesson.icon
                            || "📚"
                        }
                        eyebrow={
                            level
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
                        description={
                            lesson.estimatedTime
                                ? `⏱ ${lesson.estimatedTime} min`
                                : undefined
                        }
                    />
                </div>

                <button
                    type="button"
                    aria-pressed={
                        bookmarked
                    }
                    aria-label={
                        bookmarked
                            ? "Remove bookmark"
                            : "Bookmark lesson"
                    }
                    title={
                        bookmarked
                            ? "Remove bookmark"
                            : "Bookmark lesson"
                    }
                    onClick={() => {
                        setBookmarked(
                            toggleBookmark(
                                lessonId
                            )
                        );
                    }}
                    className={`
                        mt-1
                        flex
                        h-11
                        w-11
                        shrink-0
                        items-center
                        justify-center
                        rounded-full
                        border
                        text-xl
                        transition
                        focus-visible:outline-none
                        focus-visible:ring-2
                        focus-visible:ring-dino-500
                        focus-visible:ring-offset-2
                        ${
                            bookmarked
                                ? `
                                    border-amber-300
                                    bg-amber-50
                                `
                                : `
                                    border-line
                                    bg-surface
                                    hover:border-dino-300
                                    hover:bg-dino-50
                                `
                        }
                    `}
                >
                    {bookmarked
                        ? "🔖"
                        : "🔗"
                    }
                </button>
            </div>

            {sections.length > 0 ? (
                <div
                    className="
                        mb-7
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
                            {completedCount}
                            {" "}
                            /
                            {" "}
                            {sections.length}
                        </span>

                        {lessonComplete ? (
                            <span
                                className="
                                    text-emerald-700
                                "
                            >
                                ✅
                                {" "}
                                {t(
                                    "grammar.status.completed"
                                )}
                            </span>
                        ) : null}
                    </div>

                    <ProgressBar
                        value={
                            completedCount
                        }
                        max={
                            sections.length
                        }
                    />
                </div>
            ) : null}

            <div
                className="
                    grid
                    gap-3
                "
            >
                {sections.map(
                    (
                        section,
                        index
                    ) => (
                        <GrammarSectionCard
                            key={
                                section.id
                            }
                            section={
                                section
                            }
                            index={
                                index
                            }
                            completed={
                                progress.completedSections
                                    .includes(
                                        section.id
                                    )
                            }
                            onOpen={() => {
                                setSelectedSectionId(
                                    section.id
                                );
                            }}
                        />
                    )
                )}
            </div>
        </>
    );

    /**
     * Completes a section, refreshes local progress and synchronizes both
     * historical Dino progress stores when the entire lesson is finished.
     */
    function completeSection(
        sectionId: string
    ): void {
        markSectionCompleted(
            lessonId,
            sectionId
        );

        let updatedProgress =
            getLessonProgress(
                lessonId
            );

        const allSectionsComplete =
            sections.length > 0
            && sections.every(
                section =>
                    updatedProgress
                        .completedSections
                        .includes(
                            section.id
                        )
            );

        if (
            allSectionsComplete
        ) {
            /*
             * dino_lessons_progress
             */
            markLessonCompleted(
                lessonId
            );

            /*
             * Historical Grammar catalog store: dino_progress
             */
            setLessonStatus(
                lessonId,
                "completed"
            );

            updatedProgress =
                getLessonProgress(
                    lessonId
                );
        }

        setProgress(
            updatedProgress
        );

        setSelectedSectionId(
            null
        );
    }

    /**
     * Returning without completing must not alter section completion.
     */
    function returnToOverview():
        void {
        setProgress(
            getLessonProgress(
                lessonId
            )
        );

        setSelectedSectionId(
            null
        );
    }
}

/* -------------------------------------------------------------------------- */
/* Section card                                                                */
/* -------------------------------------------------------------------------- */

interface GrammarSectionCardProps {
    section:
        LessonSection;

    index: number;
    completed: boolean;

    onOpen: () => void;
}

function GrammarSectionCard({
    section,
    index,
    completed,
    onOpen
}: GrammarSectionCardProps) {
    const {
        localizedTextClass,
        localizedValue,
        t
    } = useI18n();

    const typeLabel =
        getGrammarSectionTypeLabel(
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
        <button
            type="button"
            onClick={
                onOpen
            }
            className="
                group
                flex
                w-full
                items-center
                gap-4
                rounded-card
                border
                border-line
                bg-surface
                p-4
                text-start
                shadow-sm
                transition
                hover:-translate-y-0.5
                hover:border-dino-300
                hover:shadow-md
                focus-visible:outline-none
                focus-visible:ring-2
                focus-visible:ring-dino-500
                focus-visible:ring-offset-2
                sm:p-5
            "
        >
            <span
                className="
                    flex
                    h-10
                    w-10
                    shrink-0
                    items-center
                    justify-center
                    rounded-full
                    bg-neutral-50
                    text-xl
                "
                aria-hidden="true"
            >
                {completed
                    ? "✅"
                    : getGrammarSectionIcon(
                        section
                    )
                }
            </span>

            <div
                className="
                    min-w-0
                    flex-1
                "
            >
                <div
                    className="
                        flex
                        flex-wrap
                        items-center
                        gap-2
                    "
                >
                    <h2
                        className={`
                            text-base
                            font-semibold
                            leading-snug
                            text-ink
                            ${localizedTextClass()}
                        `}
                    >
                        {title}
                    </h2>

                    <Badge>
                        {typeLabel}
                    </Badge>
                </div>

                <p
                    className="
                        mt-1.5
                        text-xs
                        text-muted
                    "
                >
                    {index + 1}
                </p>
            </div>

            <span
                className="
                    shrink-0
                    text-lg
                    text-muted
                    transition
                    group-hover:translate-x-0.5
                    group-hover:text-dino-700
                "
                aria-hidden="true"
            >
                →
            </span>
        </button>
    );
}

/* -------------------------------------------------------------------------- */
/* Presentation                                                               */
/* -------------------------------------------------------------------------- */

function getGrammarSectionIcon(
    section:
        LessonSection
): string {
    switch (section.type) {
        case "lesson":
            return "📖";

        case "exercise":
            return "✏️";

        case "quiz":
            return "🏆";
    }
}

type TranslationFunction =
    ReturnType<
        typeof useI18n
    >["t"];

function getGrammarSectionTypeLabel(
    section:
        LessonSection,
    t:
        TranslationFunction
): string {
    switch (section.type) {
        case "lesson":
            return t(
                "grammar.type.lesson"
            );

        case "exercise":
            return t(
                "grammar.type.exercise"
            );

        case "quiz":
            return t(
                "grammar.type.quiz"
            );
    }
}

export {
    GrammarLesson,
    GrammarSectionCard,
    getGrammarSectionIcon
};