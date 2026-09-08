import {
    Link
} from "react-router";

import {
    createPracticeGamePath,
    type PracticeGameKind
} from "../../core/practiceRoutes.js";

import {
    useI18n
} from "../../i18n/I18nProvider.js";

import type {
    Level,
    VocabPackIndex
} from "../../types/global.js";

import {
    Badge,
    Card
} from "../../ui/components/Controls.js";

import {
    Grid
} from "../../ui/components/Layout.js";

interface PracticePackCatalogProps {
    game: PracticeGameKind;
    level: Level;
    packs: readonly VocabPackIndex[];
}

/** Theme selector that launches one game through a durable public URL. */
function PracticePackCatalog({
    game,
    level,
    packs
}: PracticePackCatalogProps) {
    const {
        localizedTextClass,
        localizedValue,
        t
    } = useI18n();

    return (
        <Grid variant="wide">
            {packs.map(
                pack => {
                    const title =
                        localizedValue(
                            pack.title,
                            pack.title_fa,
                            pack.id
                        );

                    return (
                        <Link
                            key={pack.id}
                            to={
                                createPracticeGamePath(
                                    game,
                                    level,
                                    pack.id
                                )
                            }
                            className="block h-full text-inherit no-underline"
                        >
                            <Card
                                interactive
                                className="flex h-full min-h-[132px] flex-col p-4"
                            >
                                <div className="flex items-start gap-3">
                                    <span
                                        className="shrink-0 text-2xl leading-none"
                                        aria-hidden="true"
                                    >
                                        {pack.icon || "📖"}
                                    </span>

                                    <h2
                                        className={`min-w-0 text-base font-semibold leading-snug text-ink ${localizedTextClass()}`}
                                    >
                                        {title}
                                    </h2>
                                </div>

                                <div className="mt-auto pt-5">
                                    <Badge>
                                        {pack.words}
                                        {" "}
                                        {t("common.words")}
                                    </Badge>
                                </div>
                            </Card>
                        </Link>
                    );
                }
            )}
        </Grid>
    );
}

export {
    PracticePackCatalog
};
