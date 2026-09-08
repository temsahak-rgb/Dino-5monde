import {
    saurusQuizQuestions,
    type SaurusKey
} from "../../core/saurusAllocation.js";
import {
    useI18n
} from "../../i18n/I18nProvider.js";
import {
    Card,
    ProgressBar
} from "../../ui/components/Controls.js";
import {
    saurusPresentations
} from "./saurusPresentation.js";

interface SaurusQuizQuestionProps {
    onAnswer: (answer: SaurusKey) => void;
    questionIndex: number;
}

function SaurusQuizQuestion({
    onAnswer,
    questionIndex
}: SaurusQuizQuestionProps) {
    const { t } = useI18n();
    const question =
        saurusQuizQuestions[
            questionIndex
        ];

    if (!question) {
        return null;
    }

    return (
        <Card className="mx-auto max-w-3xl p-5 sm:p-7">
            <div className="mb-6">
                <div className="mb-3 flex items-center justify-between gap-3 text-sm font-semibold text-muted">
                    <span>
                        {t("saurus.quiz.progress", {
                            current:
                                questionIndex + 1,
                            total:
                                saurusQuizQuestions.length
                        })}
                    </span>
                    <span>
                        {Math.round(
                            (
                                questionIndex
                                / saurusQuizQuestions.length
                            ) * 100
                        )}%
                    </span>
                </div>
                <ProgressBar
                    value={questionIndex}
                    max={saurusQuizQuestions.length}
                    label={t(
                        "saurus.quiz.progressLabel"
                    )}
                />
            </div>

            <fieldset>
                <legend className="text-xl font-bold leading-tight text-ink sm:text-2xl">
                    {t(question.promptKey)}
                </legend>
                <div className="mt-6 grid gap-3">
                    {question.options.map(
                        option => (
                            <button
                                className="flex min-h-16 w-full items-center gap-4 rounded-card border border-line bg-surface p-4 text-start text-sm font-bold text-ink transition hover:border-dino-400 hover:bg-dino-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-dino-500"
                                key={option.saurus}
                                onClick={() => {
                                    onAnswer(
                                        option.saurus
                                    );
                                }}
                                type="button"
                            >
                                <span
                                    className="grid size-10 shrink-0 place-items-center rounded-full bg-canvas text-xl"
                                    aria-hidden="true"
                                >
                                    {
                                        saurusPresentations[
                                            option.saurus
                                        ].icon
                                    }
                                </span>
                                {t(option.labelKey)}
                            </button>
                        )
                    )}
                </div>
            </fieldset>
        </Card>
    );
}

export {
    SaurusQuizQuestion
};

export type {
    SaurusQuizQuestionProps
};
