import {
    Link
} from "react-router";

import {
    type PracticeGameKind,
    createPracticeCatalogPath
} from "../../core/practiceRoutes.js";

import type {
    Level
} from "../../types/global.js";

import {
    useI18n
} from "../../i18n/I18nProvider.js";

import {
    Card
} from "../../ui/components/Controls.js";

import {
    getPracticeGamePresentation
} from "./practiceGamePresentation.js";

interface PracticeGameCardProps {
    game: PracticeGameKind;
    levels: readonly Level[];
}

/** One game family with direct, touch-friendly links to every CEFR catalog. */
function PracticeGameCard({
    game,
    levels
}: PracticeGameCardProps) {
    const {
        t
    } = useI18n();

    const presentation =
        getPracticeGamePresentation(
            game
        );

    return (
        <Card
            className="flex h-full flex-col p-5"
            data-practice-game={game}
        >
            <div className="flex items-start gap-3">
                <span
                    className="text-3xl leading-none"
                    aria-hidden="true"
                >
                    {presentation.icon}
                </span>

                <div className="min-w-0">
                    <h2 className="text-lg font-bold text-ink">
                        {t(
                            presentation.titleKey
                        )}
                    </h2>

                    <p className="mt-1 text-sm leading-5 text-muted">
                        {t(
                            presentation.descriptionKey
                        )}
                    </p>
                </div>
            </div>

            <div
                className="mt-5 grid grid-cols-3 gap-2"
                aria-label={
                    t(
                        "practice.chooseLevel"
                    )
                }
            >
                {levels.map(
                    level => (
                        <Link
                            key={level}
                            to={
                                createPracticeCatalogPath(
                                    game,
                                    level
                                )
                            }
                            className="inline-flex min-h-11 items-center justify-center rounded-control border border-dino-200 bg-dino-50 px-2 py-2 text-sm font-extrabold text-dino-800 no-underline transition hover:border-dino-400 hover:bg-dino-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-dino-500 focus-visible:ring-offset-2"
                            aria-label={
                                t(
                                    "practice.playLevel",
                                    { level }
                                )
                            }
                        >
                            {level}
                        </Link>
                    )
                )}
            </div>
        </Card>
    );
}

export {
    PracticeGameCard
};
