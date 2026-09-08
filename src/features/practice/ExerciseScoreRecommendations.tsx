import {
    Link
} from "react-router";

import type {
    ExerciseScoreReviewItem
} from "../../core/reviewEngine.js";
import {
    useI18n
} from "../../i18n/I18nProvider.js";
import {
    Badge,
    Card,
    ProgressBar
} from "../../ui/components/Controls.js";
import {
    Section,
    SectionHeader
} from "../../ui/components/Layout.js";

interface ExerciseScoreRecommendationsProps {
    items: readonly ExerciseScoreReviewItem[];
}

function ExerciseScoreRecommendations({
    items
}: ExerciseScoreRecommendationsProps) {
    const {
        language,
        localizedTextClass,
        localizedValue,
        t
    } = useI18n();

    return (
        <Section>
            <SectionHeader
                title={t(
                    "review.scoresTitle"
                )}
                description={t(
                    "review.scoresDescription"
                )}
            />

            {items.length > 0 ? (
                <div className="grid gap-3 sm:grid-cols-2">
                    {items.map(item => {
                        const title =
                            localizedValue(
                                item.title,
                                item.titleFa,
                                item.id
                            );
                        const date =
                            new Intl.DateTimeFormat(
                                language === "fa"
                                    ? "fa-IR"
                                    : "fr-FR",
                                {
                                    dateStyle:
                                        "medium"
                                }
                            ).format(
                                new Date(
                                    item.completedAt
                                )
                            );

                        return (
                            <Link
                                key={[
                                    item.contentType,
                                    item.id,
                                    item.exerciseId
                                ].join(":")}
                                to={item.href}
                                data-review-score={
                                    item.percentage
                                }
                                className="text-inherit no-underline"
                            >
                                <Card
                                    interactive
                                    className="h-full p-4"
                                >
                                    <div className="flex items-start justify-between gap-3">
                                        <div className="flex min-w-0 items-start gap-3">
                                            <span
                                                className="text-2xl"
                                                aria-hidden="true"
                                            >
                                                {item.icon}
                                            </span>
                                            <div className="min-w-0">
                                                <h2
                                                    className={`font-bold text-ink ${localizedTextClass()}`}
                                                >
                                                    {title}
                                                </h2>
                                                <p className="mt-1 text-xs text-muted">
                                                    {t(
                                                        "review.scoreAttempt",
                                                        { date }
                                                    )}
                                                </p>
                                            </div>
                                        </div>
                                        <Badge variant="warning">
                                            {t(
                                                "review.scoreResult",
                                                {
                                                    correct:
                                                        item.correctAnswers,
                                                    percentage:
                                                        item.percentage,
                                                    total:
                                                        item.totalQuestions
                                                }
                                            )}
                                        </Badge>
                                    </div>

                                    <div className="mt-4">
                                        <ProgressBar
                                            value={
                                                item.percentage
                                            }
                                            max={100}
                                            label={t(
                                                "review.scoreProgress",
                                                { title }
                                            )}
                                            showValue
                                        />
                                    </div>
                                    <span className="mt-4 inline-flex min-h-11 items-center text-sm font-bold text-dino-700">
                                        {t(
                                            "review.retryExercise"
                                        )}
                                    </span>
                                </Card>
                            </Link>
                        );
                    })}
                </div>
            ) : (
                <p className="text-sm text-muted">
                    {t(
                        "review.noLowScores"
                    )}
                </p>
            )}
        </Section>
    );
}

export {
    ExerciseScoreRecommendations
};

export type {
    ExerciseScoreRecommendationsProps
};
