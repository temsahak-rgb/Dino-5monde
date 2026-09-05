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

const repositoryUrl =
    "https://github.com/temsahak-rgb/Dino-5monde";

/**
 * Institutional contribution page.
 *
 * Durable route:
 *
 * /info/work-with-us
 *
 * The page deliberately describes contribution opportunities rather than
 * implying that formal employment positions currently exist.
 */
function WorkWithUsPage() {
    const {
        t
    } = useI18n();

    const contributionAreas = [
        {
            icon:
                "✍️",

            title:
                t(
                    "institutional.work.contentTitle"
                ),

            body:
                t(
                    "institutional.work.contentBody"
                )
        },

        {
            icon:
                "🧩",

            title:
                t(
                    "institutional.work.productTitle"
                ),

            body:
                t(
                    "institutional.work.productBody"
                )
        },

        {
            icon:
                "🛠️",

            title:
                t(
                    "institutional.work.technicalTitle"
                ),

            body:
                t(
                    "institutional.work.technicalBody"
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
                            "institutional.work.title"
                        )
                    }
                    description={
                        t(
                            "institutional.work.introduction"
                        )
                    }
                />
            </div>

            {/* -------------------------------------------------------------- */}
            {/* Contribution areas                                             */}
            {/* -------------------------------------------------------------- */}

            <div
                className="
                    grid
                    gap-4
                    md:grid-cols-3
                "
            >
                {contributionAreas.map(
                    area => (
                        <Card
                            key={
                                area.title
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
                                {area.icon}
                            </span>

                            <h2
                                className="
                                    mt-4
                                    text-lg
                                    font-bold
                                    text-ink
                                "
                            >
                                {area.title}
                            </h2>

                            <p
                                className="
                                    mt-3
                                    text-sm
                                    leading-7
                                    text-neutral-600
                                "
                            >
                                {area.body}
                            </p>
                        </Card>
                    )
                )}
            </div>

            {/* -------------------------------------------------------------- */}
            {/* Repository action                                              */}
            {/* -------------------------------------------------------------- */}

            <aside
                className="
                    mt-6
                    flex
                    flex-col
                    gap-5
                    rounded-card
                    border
                    border-dino-200
                    bg-dino-50
                    p-5
                    sm:flex-row
                    sm:items-center
                    sm:justify-between
                    sm:p-6
                "
            >
                <div
                    className="
                        min-w-0
                    "
                >
                    <strong
                        className="
                            text-base
                            font-bold
                            text-dino-900
                        "
                    >
                        {t(
                            "institutional.work.action"
                        )}
                    </strong>

                    <p
                        className="
                            mt-2
                            max-w-2xl
                            text-sm
                            leading-6
                            text-dino-900
                        "
                    >
                        {t(
                            "institutional.work.actionMeta"
                        )}
                    </p>
                </div>

                <a
                    href={
                        repositoryUrl
                    }
                    target="_blank"
                    rel="noopener noreferrer"
                    className="
                        inline-flex
                        shrink-0
                        items-center
                        justify-center
                        gap-2
                        rounded-control
                        bg-dino-600
                        px-4
                        py-2.5
                        text-sm
                        font-bold
                        text-white
                        no-underline
                        transition
                        hover:bg-dino-700
                        focus-visible:outline-none
                        focus-visible:ring-2
                        focus-visible:ring-dino-500
                        focus-visible:ring-offset-2
                    "
                >
                    {t(
                        "institutional.work.action"
                    )}

                    <span
                        aria-hidden="true"
                    >
                        ↗
                    </span>
                </a>
            </aside>
        </Page>
    );
}

export {
    WorkWithUsPage
};