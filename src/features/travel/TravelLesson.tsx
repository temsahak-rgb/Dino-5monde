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
    LessonProgress,
    TravelLesson as TravelLessonData,
    TravelSection
} from "../../types/global.js";

import {
    BackButton,
    Badge,
    ProgressBar
} from "../../ui/components/Controls.js";

import {
    PageHeader
} from "../../ui/components/Layout.js";

import {
    TravelSectionContent
} from "./TravelSectionContent.js";

import {
    getTravelSections
} from "./travelEngine.js";

interface TravelLessonProps {
    lessonId: string;
    lesson:
        TravelLessonData;
}

/**
 * Interactive Travel lesson.
 *
 * Durable route:
 *
 * /travel/:lessonId
 *
 * Individual sections remain local UI state.
 */
function TravelLesson({
    lessonId,
    lesson
}: TravelLessonProps) {
    const {
        localizedTextClass,
        localizedValue,
        t
    } = useI18n();

    const sections =
        getTravelSections(
            lesson
        );

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
        selectedSectionIndex,
        setSelectedSectionIndex
    ] =
        useState<number | null>(
            null
        );

    const selectedSection =
        selectedSectionIndex
        !== null
            ? sections[
                selectedSectionIndex
            ]
            : undefined;

    /* ---------------------------------------------------------------------- */
    /* Open section                                                           */
    /* ---------------------------------------------------------------------- */

    if (
        selectedSection
        && selectedSectionIndex
            !== null
    ) {
        if (
            selectedSection.type
            === "exercise"
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
                    onComplete={
                        completeExercise
                    }
                />
            );
        }

        return (
            <TravelSectionContent
                section={
                    selectedSection
                }
                sectionIndex={
                    selectedSectionIndex
                }
                totalSections={
                    sections.length
                }
                onBack={
                    returnToOverview
                }
                onComplete={() => {
                    completeSection(
                        selectedSection
                    );
                }}
            />
        );
    }

    /* ---------------------------------------------------------------------- */
    /* Overview                                                               */
    /* ---------------------------------------------------------------------- */

    const title =
        localizedValue(
            lesson.title,
            lesson.title_fa,
            lesson.id
        );

    const completedCount =
        getCompletedSectionCount(
            sections,
            progress
        );

    const lessonComplete =
        sections.length > 0
        && (
            progress.status
                === "completed"
            || completedCount
                === sections.length
        );

    return (
        <>
            <BackButton
                fallback="/travel"
            >
                ← {t("common.back")}
            </BackButton>

            <PageHeader
                icon={
                    lesson.icon
                    || "📝"
                }
                eyebrow="Travel"
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
                    t(
                        "travel.sectionsCount",
                        {
                            count:
                                sections.length
                        }
                    )
                }
            />

            {sections.length > 0 ? (
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
                        <TravelSectionCard
                            key={
                                `${section.id}:${index}`
                            }
                            section={
                                section
                            }
                            completed={
                                progress
                                    .completedSections
                                    .includes(
                                        section.id
                                    )
                            }
                            onOpen={() => {
                                setSelectedSectionIndex(
                                    index
                                );
                            }}
                        />
                    )
                )}
            </div>
        </>
    );

    /* ---------------------------------------------------------------------- */
    /* Completion                                                             */
    /* ---------------------------------------------------------------------- */

    /**
     * Completes a non-exercise Travel section.
     */
    function completeSection(
        section:
            TravelSection
    ): void {
        markSectionCompleted(
            lessonId,
            section.id
        );

        refreshAndFinalizeProgress();

        setSelectedSectionIndex(
            null
        );
    }

    /**
     * Exercise already persists its section completion internally.
     *
     * Once Exercise calls onComplete, we only need to evaluate whether that
     * newly completed section was the final outstanding Travel section.
     */
    function completeExercise():
        void {
        refreshAndFinalizeProgress();

        setSelectedSectionIndex(
            null
        );
    }

    /**
     * Returning without completing a section must never alter progress.
     */
    function returnToOverview():
        void {
        setProgress(
            getLessonProgress(
                lessonId
            )
        );

        setSelectedSectionIndex(
            null
        );
    }

    /**
     * Refreshes persisted progress and promotes the lesson to `completed`
     * when every Travel section has been finished.
     */
    function refreshAndFinalizeProgress():
        void {
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
            && updatedProgress.status
                !== "completed"
        ) {
            markLessonCompleted(
                lessonId
            );

            updatedProgress =
                getLessonProgress(
                    lessonId
                );
        }

        setProgress(
            updatedProgress
        );
    }
}

/* -------------------------------------------------------------------------- */
/* Section card                                                               */
/* -------------------------------------------------------------------------- */

interface TravelSectionCardProps {
    section:
        TravelSection;

    completed:
        boolean;

    onOpen:
        () => void;
}

function TravelSectionCard({
    section,
    completed,
    onOpen
}: TravelSectionCardProps) {
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

    const count =
        getTravelSectionCount(
            section
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
                    shrink-0
                    text-3xl
                    leading-none
                "
                aria-hidden="true"
            >
                {completed
                    ? "✅"
                    : getTravelSectionIcon(
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

                {count > 0 ? (
                    <p
                        className="
                            mt-2
                            text-sm
                            text-muted
                        "
                    >
                        {getTravelSectionCountLabel(
                            section,
                            count,
                            t
                        )}
                    </p>
                ) : null}
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
/* Progress                                                                   */
/* -------------------------------------------------------------------------- */

function getCompletedSectionCount(
    sections:
        readonly TravelSection[],
    progress:
        LessonProgress
): number {
    return sections.reduce(
        (
            count,
            section
        ) =>
            progress.completedSections
                .includes(
                    section.id
                )
                ? count + 1
                : count,
        0
    );
}

/* -------------------------------------------------------------------------- */
/* Presentation helpers                                                       */
/* -------------------------------------------------------------------------- */

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

function getTravelSectionCount(
    section:
        TravelSection
): number {
    switch (section.type) {
        case "vocab":
            return (
                section.words.length
            );

        case "tips":
            return (
                section.tips.length
            );

        case "lesson":
            return (
                section.examples
                    ?.length
                ?? 0
            );

        case "exercise":
            return (
                section.questions
                    .length
            );
    }
}

function getTravelSectionCountLabel(
    section:
        TravelSection,
    count:
        number,
    t:
        TranslationFunction
): string {
    switch (section.type) {
        case "vocab":
            return (
                `${count} ${t(
                    "common.words"
                )}`
            );

        case "exercise":
            return (
                `${count} ${t(
                    "common.questions"
                )}`
            );

        case "tips":
        case "lesson":
            return (
                `${count} ${t(
                    "common.sections"
                )}`
            );
    }
}

export {
    TravelLesson,
    TravelSectionCard,
    getCompletedSectionCount,
    getTravelSectionCount,
    getTravelSectionIcon,
    getTravelSectionTypeLabel
};