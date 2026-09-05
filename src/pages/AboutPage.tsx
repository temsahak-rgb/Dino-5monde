import {
    useI18n
} from "../i18n/I18nProvider.js";

import {
    BackButton,
    Card
} from "../ui/components/Controls.js";

import {
    Page,
    PageHeader
} from "../ui/components/Layout.js";

/**
 * Institutional About page.
 *
 * Durable route:
 *
 * /info/about
 *
 * This page is intentionally static. Its only dependency is i18n; no
 * controller, fetch or DOM binding is required.
 */
function AboutPage() {
    const {
        t
    } = useI18n();

    const cards = [
        {
            icon:
                "🎯",

            title:
                t(
                    "institutional.about.missionTitle"
                ),

            body:
                t(
                    "institutional.about.missionBody"
                )
        },

        {
            icon:
                "🧭",

            title:
                t(
                    "institutional.about.methodTitle"
                ),

            body:
                t(
                    "institutional.about.methodBody"
                )
        },

        {
            icon:
                "🌍",

            title:
                t(
                    "institutional.about.audienceTitle"
                ),

            body:
                t(
                    "institutional.about.audienceBody"
                )
        }
    ];

    return (
        <Page>
            <BackButton
                fallback="/"
            >
                ←
                {" "}
                {t(
                    "common.back"
                )}
            </BackButton>

            <div
                className="
                    mt-6
                "
            >
                <PageHeader
                    eyebrow={
                        t(
                            "institutional.eyebrow"
                        )
                    }
                    title={
                        t(
                            "institutional.about.title"
                        )
                    }
                    description={
                        t(
                            "institutional.about.introduction"
                        )
                    }
                />
            </div>

            {/* -------------------------------------------------------------- */}
            {/* Product principles                                             */}
            {/* -------------------------------------------------------------- */}

            <div
                className="
                    grid
                    gap-4
                    md:grid-cols-3
                "
            >
                {cards.map(
                    card => (
                        <Card
                            key={
                                card.title
                            }
                            className="
                                h-full
                                p-5
                                sm:p-6
                            "
                        >
                            <span
                                className="
                                    text-3xl
                                    leading-none
                                "
                                aria-hidden="true"
                            >
                                {card.icon}
                            </span>

                            <h2
                                className="
                                    mt-4
                                    text-lg
                                    font-bold
                                    text-ink
                                "
                            >
                                {card.title}
                            </h2>

                            <p
                                className="
                                    mt-3
                                    text-sm
                                    leading-7
                                    text-neutral-600
                                "
                            >
                                {card.body}
                            </p>
                        </Card>
                    )
                )}
            </div>

            {/* -------------------------------------------------------------- */}
            {/* Privacy                                                        */}
            {/* -------------------------------------------------------------- */}

            <section
                className="
                    mt-6
                    rounded-card
                    border
                    border-dino-200
                    bg-dino-50
                    p-5
                    sm:p-6
                "
            >
                <h2
                    className="
                        text-lg
                        font-bold
                        text-dino-900
                    "
                >
                    🔒
                    {" "}
                    {t(
                        "institutional.about.privacyTitle"
                    )}
                </h2>

                <p
                    className="
                        mt-3
                        text-sm
                        leading-7
                        text-dino-900
                    "
                >
                    {t(
                        "institutional.about.privacyBody"
                    )}
                </p>
            </section>
        </Page>
    );
}

export {
    AboutPage
};