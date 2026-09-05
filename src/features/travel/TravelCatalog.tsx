import {
    Link
} from "react-router";

import {
    useI18n
} from "../../i18n/I18nProvider.js";

import type {
    TravelLessonIndex
} from "../../types/global.js";

import {
    Card
} from "../../ui/components/Controls.js";

import {
    Grid
} from "../../ui/components/Layout.js";

interface TravelCatalogProps {
    lessons:
        readonly TravelLessonIndex[];
}

/**
 * Travel lesson catalog.
 *
 * Loading remains owned by TravelIndexPage. This component only renders
 * durable links to individual Travel lessons.
 */
function TravelCatalog({
    lessons
}: TravelCatalogProps) {
    return (
        <Grid variant="wide">
            {lessons.map(
                lesson => (
                    <TravelLessonCard
                        key={
                            lesson.id
                        }
                        lesson={
                            lesson
                        }
                    />
                )
            )}
        </Grid>
    );
}

interface TravelLessonCardProps {
    lesson:
        TravelLessonIndex;
}

/**
 * One Travel lesson card.
 */
function TravelLessonCard({
    lesson
}: TravelLessonCardProps) {
    const {
        localizedTextClass,
        localizedValue
    } = useI18n();

    const title =
        localizedValue(
            lesson.title,
            lesson.title_fa,
            lesson.id
        );

    const estimatedTime =
        lesson.estimatedTime
        || 25;

    return (
        <Link
            to={
                `/travel/${encodeURIComponent(
                    lesson.id
                )}`
            }
            className="
                block
                h-full
                text-inherit
                no-underline
            "
        >
            <Card
                interactive
                className="
                    flex
                    h-full
                    min-h-[120px]
                    items-start
                    gap-3
                    p-5
                "
            >
                <span
                    className="
                        shrink-0
                        text-4xl
                        leading-none
                    "
                    aria-hidden="true"
                >
                    {lesson.icon
                        || "📝"
                    }
                </span>

                <div
                    className="
                        min-w-0
                        flex-1
                    "
                >
                    <h2
                        className={`
                            text-[17px]
                            font-semibold
                            leading-snug
                            text-ink
                            ${localizedTextClass()}
                        `}
                    >
                        {title}
                    </h2>

                    <p
                        className="
                            ltr-lock
                            mt-2
                            text-sm
                            text-muted
                        "
                    >
                        ⏱
                        {" "}
                        {estimatedTime}
                        {" "}
                        min
                    </p>

                    {lesson.module ? (
                        <p
                            className="
                                mt-2
                                text-xs
                                text-muted
                            "
                        >
                            {lesson.module}
                        </p>
                    ) : null}
                </div>
            </Card>
        </Link>
    );
}

export {
    TravelCatalog,
    TravelLessonCard
};