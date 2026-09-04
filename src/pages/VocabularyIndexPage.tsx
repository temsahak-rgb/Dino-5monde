import {
    Link
} from "react-router";

import {
    useI18n
} from "../i18n/I18nProvider.js";

import type {
    Level
} from "../types/global.js";

import {
    Card
} from "../ui/components/Controls.js";

import {
    Grid,
    Page,
    PageHeader
} from "../ui/components/Layout.js";

const vocabularyLevels:
    readonly Level[] = [
        "A1",
        "A2",
        "B1",
        "B2",
        "C1",
        "C2"
    ];

/**
 * Vocabulary landing page.
 *
 * Pack loading remains the responsibility of VocabularyLevelPage.
 */
function VocabularyIndexPage() {
    const {
        t
    } = useI18n();

    return (
        <Page>
            <PageHeader
                icon="📖"
                title={
                    t(
                        "vocab.title"
                    )
                }
                description={
                    t(
                        "vocab.chooseLevel"
                    )
                }
            />

            <Grid variant="levels">
                {vocabularyLevels.map(
                    level => (
                        <VocabularyLevelCard
                            key={
                                level
                            }
                            level={
                                level
                            }
                        />
                    )
                )}
            </Grid>
        </Page>
    );
}

interface VocabularyLevelCardProps {
    level: Level;
}

/**
 * Navigates to one CEFR Vocabulary catalog.
 */
function VocabularyLevelCard({
    level
}: VocabularyLevelCardProps) {
    const {
        t
    } = useI18n();

    return (
        <Link
            to={
                `/vocabulary/${level}`
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
                    flex-col
                    p-4
                "
            >
                <div
                    className="
                        flex
                        items-center
                        gap-2.5
                    "
                >
                    <span
                        className="
                            text-2xl
                            leading-none
                        "
                        aria-hidden="true"
                    >
                        🎯
                    </span>

                    <strong
                        className="
                            ltr-lock
                            text-lg
                            text-ink
                        "
                    >
                        {level}
                    </strong>
                </div>

                <p
                    className="
                        mt-3
                        text-sm
                        text-muted
                    "
                >
                    {t(
                        "vocab.levelMeta"
                    )}
                </p>
            </Card>
        </Link>
    );
}

export {
    VocabularyIndexPage
};