import {
    Link
} from "react-router";

import {
    practiceGameKinds,
    practiceLevels
} from "../core/practiceRoutes.js";

import {
    PracticeGameCard
} from "../features/practice/PracticeGameCard.js";

import {
    useI18n
} from "../i18n/I18nProvider.js";

import {
    Card
} from "../ui/components/Controls.js";

import {
    Grid,
    Page,
    PageHeader,
    Section,
    SectionHeader
} from "../ui/components/Layout.js";

const exerciseDestinations = [
    {
        to: "/grammar",
        icon: "📐",
        titleKey: "navbar.grammar",
        descriptionKey: "practice.grammarDescription"
    },
    {
        to: "/vocabulary",
        icon: "📖",
        titleKey: "navbar.vocabulary",
        descriptionKey: "practice.vocabularyDescription"
    },
    {
        to: "/travel",
        icon: "✈️",
        titleKey: "navbar.travel",
        descriptionKey: "practice.travelDescription"
    }
] as const;

/** Central entry point for every shipped game and exercise family. */
function PracticeIndexPage() {
    const {
        t
    } = useI18n();

    return (
        <Page>
            <PageHeader
                icon="🎮"
                eyebrow={t("practice.eyebrow")}
                title={t("practice.title")}
                description={t("practice.introduction")}
            />

            <Section>
                <SectionHeader
                    title={t("practice.gamesTitle")}
                    description={t("practice.gamesDescription")}
                />

                <Grid variant="wide">
                    {practiceGameKinds.map(
                        game => (
                            <PracticeGameCard
                                key={game}
                                game={game}
                                levels={practiceLevels}
                            />
                        )
                    )}
                </Grid>
            </Section>

            <Section>
                <SectionHeader
                    title={t("practice.exercisesTitle")}
                    description={t("practice.exercisesDescription")}
                />

                <Grid variant="wide">
                    {exerciseDestinations.map(
                        destination => (
                            <Link
                                key={destination.to}
                                to={destination.to}
                                className="block h-full text-inherit no-underline"
                            >
                                <Card
                                    interactive
                                    className="flex h-full min-h-[126px] items-start gap-3 p-5"
                                >
                                    <span
                                        className="text-2xl leading-none"
                                        aria-hidden="true"
                                    >
                                        {destination.icon}
                                    </span>

                                    <div>
                                        <h2 className="text-base font-bold text-ink">
                                            {t(destination.titleKey)}
                                        </h2>

                                        <p className="mt-1.5 text-sm leading-5 text-muted">
                                            {t(destination.descriptionKey)}
                                        </p>
                                    </div>
                                </Card>
                            </Link>
                        )
                    )}
                </Grid>
            </Section>
        </Page>
    );
}

export {
    PracticeIndexPage
};
