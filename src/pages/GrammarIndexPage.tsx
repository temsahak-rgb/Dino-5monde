import {
    Link
} from "react-router";

import {
    getGrammarLevels
} from "../features/grammar/grammarLevels.js";

import {
    useI18n
} from "../i18n/I18nProvider.js";

import type {
    GrammarLevel
} from "../types/global.js";

import {
    Card
} from "../ui/components/Controls.js";

import {
    Grid,
    Page,
    PageHeader
} from "../ui/components/Layout.js";

/**
 * Grammar landing page.
 *
 * This route only presents the CEFR levels currently shipped by the Grammar
 * corpus. Loading lesson catalogs belongs to `GrammarLevelPage`.
 */
function GrammarIndexPage() {
    const {
        t
    } = useI18n();

    const levels =
        getGrammarLevels();

    return (
        <Page>
            <PageHeader
                icon="📐"
                title={
                    t(
                        "navbar.grammar"
                    )
                }
                description={
                    t(
                        "grammar.chooseLevel"
                    )
                }
            />

            <Grid variant="levels">
                {levels.map(
                    level => (
                        <GrammarLevelCard
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

interface GrammarLevelCardProps {
    level: GrammarLevel;
}

/**
 * Navigates to one Grammar CEFR catalog.
 */
function GrammarLevelCard({
    level
}: GrammarLevelCardProps) {
    const {
        t
    } = useI18n();

    return (
        <Link
            to={
                `/grammar/${level}`
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
                        📚
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
                        font-semibold
                        text-ink-soft
                    "
                >
                    {getGrammarLevelLabel(
                        level,
                        t
                    )}
                </p>

                <p
                    className="
                        mt-1
                        text-xs
                        text-muted
                    "
                >
                    {t(
                        "grammar.levelMeta"
                    )}
                </p>
            </Card>
        </Link>
    );
}

type TranslationFunction =
    ReturnType<
        typeof useI18n
    >["t"];

function getGrammarLevelLabel(
    level: GrammarLevel,
    t: TranslationFunction
): string {
    const keys = {
        A1: "grammar.level.A1",
        A2: "grammar.level.A2",
        B1: "grammar.level.B1",
        B2: "grammar.level.B2",
        C1: "grammar.level.C1"
    } as const;

    return t(
        keys[level]
    );
}

export {
    GrammarIndexPage
};