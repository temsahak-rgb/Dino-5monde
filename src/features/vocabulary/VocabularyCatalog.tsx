import {
    Link
} from "react-router";

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

interface VocabularyCatalogProps {
    level: Level;
    packs:
        readonly VocabPackIndex[];
}

/**
 * Vocabulary pack catalog for one CEFR level.
 *
 * Data loading remains owned by VocabularyLevelPage /
 * vocabularyRepository.ts.
 */
function VocabularyCatalog({
    level,
    packs
}: VocabularyCatalogProps) {
    return (
        <Grid variant="wide">
            {packs.map(
                pack => (
                    <VocabularyPackCard
                        key={
                            pack.id
                        }
                        level={
                            level
                        }
                        pack={
                            pack
                        }
                    />
                )
            )}
        </Grid>
    );
}

interface VocabularyPackCardProps {
    level: Level;
    pack: VocabPackIndex;
}

/**
 * One navigable Vocabulary category.
 */
function VocabularyPackCard({
    level,
    pack
}: VocabularyPackCardProps) {
    const {
        localizedTextClass,
        localizedValue,
        t
    } = useI18n();

    const title =
        localizedValue(
            pack.title,
            pack.title_fa,
            pack.id
        );

    return (
        <Link
            to={
                `/vocabulary/${level}/${encodeURIComponent(
                    pack.id
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
                    min-h-[130px]
                    flex-col
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
                            text-2xl
                            leading-none
                        "
                        aria-hidden="true"
                    >
                        {pack.icon
                            || "📖"
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
                                text-base
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
                                mt-1
                                text-xs
                                text-muted
                            "
                        >
                            {pack.id}
                        </p>
                    </div>
                </div>

                <div
                    className="
                        mt-auto
                        pt-5
                    "
                >
                    <Badge>
                        {pack.words}
                        {" "}
                        {t(
                            "common.words"
                        )}
                    </Badge>
                </div>
            </Card>
        </Link>
    );
}

export {
    VocabularyCatalog,
    VocabularyPackCard
};