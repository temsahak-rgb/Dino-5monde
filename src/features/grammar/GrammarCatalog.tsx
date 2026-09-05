import {
    Link
} from "react-router";

import {
    getLessonStatus,
    getStatusIcon
} from "./grammarEngine.js";

import {
    useI18n
} from "../../i18n/I18nProvider.js";

import {
    findShopOffer
} from "../shop/shopOfferManifest.js";

import type {
    GrammarLessonIndex,
    GrammarLevel,
    LessonStatus
} from "../../types/global.js";

import {
    Badge,
    Card
} from "../../ui/components/Controls.js";

import {
    Grid,
    Section,
    SectionHeader
} from "../../ui/components/Layout.js";

interface GrammarCatalogProps {
    level: GrammarLevel;
    lessons: readonly GrammarLessonIndex[];
    recommended:
        readonly GrammarLessonIndex[];
}

/**
 * Grammar lesson catalog.
 *
 * The route page owns loading and URL validation.
 * This component owns only catalog presentation.
 */
function GrammarCatalog({
    level,
    lessons,
    recommended
}: GrammarCatalogProps) {
    const {
        t
    } = useI18n();

    const recommendedLessons =
        recommended.slice(
            0,
            3
        );

    return (
        <>
            {recommendedLessons.length > 0 ? (
                <Section>
                    <SectionHeader
                        title={
                            t(
                                "grammar.recommended"
                            )
                        }
                    />

                    <Grid>
                        {recommendedLessons.map(
                            lesson => (
                                <GrammarLessonCard
                                    key={
                                        lesson.id
                                    }
                                    level={
                                        level
                                    }
                                    lesson={
                                        lesson
                                    }
                                    recommended
                                />
                            )
                        )}
                    </Grid>
                </Section>
            ) : null}

            <Section>
                <SectionHeader
                    title={
                        t(
                            "grammar.allLessons"
                        )
                    }
                />

                <Grid>
                    {lessons.map(
                        lesson => (
                            <GrammarLessonCard
                                key={
                                    lesson.id
                                }
                                level={
                                    level
                                }
                                lesson={
                                    lesson
                                }
                            />
                        )
                    )}
                </Grid>
            </Section>
        </>
    );
}

interface GrammarLessonCardProps {
    level: GrammarLevel;
    lesson: GrammarLessonIndex;
    recommended?: boolean;
}

/**
 * One Grammar lesson entry.
 *
 * Persisted status is read from grammarEngine but navigation is now handled
 * declaratively by React Router.
 */
function GrammarLessonCard({
    level,
    lesson,
    recommended = false
}: GrammarLessonCardProps) {
    const {
        localizedTextClass,
        localizedValue,
        t
    } = useI18n();

    const status =
        getLessonStatus(
            lesson.id
        );

    const statusIcon =
        recommended
            ? "🦖"
            : getStatusIcon(
                status
            );

    const title =
        localizedValue(
            lesson.title,
            lesson.title_fa,
            lesson.id
        );

    const shopOffer =
        findShopOffer(
            "grammar",
            lesson.id,
            level
        );

    return (
        <Link
            to={
                `/grammar/lesson/${encodeURIComponent(
                    lesson.id
                )}`
            }
            state={{
                grammarLevel:
                    level
            }}
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
                    flex-col
                    p-4
                "
            >
                <div
                    className="
                        flex
                        items-start
                        gap-2.5
                    "
                >
                    <span
                        className="
                            mt-0.5
                            shrink-0
                            text-2xl
                            leading-none
                        "
                        aria-hidden="true"
                    >
                        {statusIcon}
                    </span>

                    <h2
                        className={`
                            min-w-0
                            flex-1
                            text-base
                            font-semibold
                            leading-snug
                            text-ink
                            ${localizedTextClass()}
                        `}
                    >
                        {title}
                    </h2>
                </div>

                <div
                    className="
                        mt-4
                        flex
                        flex-wrap
                        items-center
                        gap-2
                    "
                >
                    <Badge
                        variant={
                            getStatusBadgeVariant(
                                status
                            )
                        }
                    >
                        {getStatusLabel(
                            status,
                            t
                        )}
                    </Badge>

                    {recommended ? (
                        <Badge
                            variant="success"
                        >
                            🦖
                        </Badge>
                    ) : null}

                    {shopOffer ? (
                        <Badge
                            variant="info"
                        >
                            {t(
                                "shop.catalogPrice",
                                {
                                    price:
                                        shopOffer.priceCredits
                                }
                            )}
                        </Badge>
                    ) : null}
                </div>

                <div
                    className="
                        mt-auto
                        flex
                        flex-wrap
                        items-center
                        gap-x-2
                        gap-y-1
                        pt-4
                        text-xs
                        text-muted
                    "
                >
                    <span>
                        ⏱
                        {" "}
                        {lesson.estimatedTime}
                        {" "}
                        min
                    </span>

                    <span
                        aria-hidden="true"
                    >
                        ·
                    </span>

                    <span>
                        {lesson.exercises}
                        {" "}
                        {t(
                            "grammar.exercises"
                        )}
                    </span>
                </div>
            </Card>
        </Link>
    );
}

function getStatusBadgeVariant(
    status: LessonStatus
):
    | "default"
    | "success"
    | "warning" {
    switch (status) {
        case "completed":
            return "success";

        case "in_progress":
            return "warning";

        case "not_started":
            return "default";
    }
}

type TranslationFunction =
    ReturnType<
        typeof useI18n
    >["t"];

function getStatusLabel(
    status: LessonStatus,
    t: TranslationFunction
): string {
    switch (status) {
        case "completed":
            return t(
                "grammar.status.completed"
            );

        case "in_progress":
            return t(
                "grammar.status.inProgress"
            );

        case "not_started":
            return t(
                "grammar.status.notStarted"
            );
    }
}

export {
    GrammarCatalog,
    GrammarLessonCard
};
