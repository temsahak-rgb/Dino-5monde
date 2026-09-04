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

const issueUrl =
    `${repositoryUrl}/issues/new`;

/**
 * Institutional Contact page.
 *
 * Durable route:
 *
 * /info/contact
 *
 * Dino currently exposes the public GitHub issue tracker as its concrete
 * contact/support channel.
 */
function ContactPage() {
    const {
        t
    } = useI18n();

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
                            "institutional.contact.title"
                        )
                    }
                    description={
                        t(
                            "institutional.contact.introduction"
                        )
                    }
                />
            </div>

            {/* -------------------------------------------------------------- */}
            {/* Contact reasons                                                */}
            {/* -------------------------------------------------------------- */}

            <Card
                className="
                    p-5
                    sm:p-6
                "
            >
                <h2
                    className="
                        text-lg
                        font-bold
                        text-ink
                    "
                >
                    {t(
                        "institutional.contact.beforeTitle"
                    )}
                </h2>

                <ul
                    className="
                        mt-4
                        grid
                        gap-3
                    "
                >
                    <ContactReason
                        icon="✍️"
                    >
                        {t(
                            "institutional.contact.itemContent"
                        )}
                    </ContactReason>

                    <ContactReason
                        icon="🐛"
                    >
                        {t(
                            "institutional.contact.itemBug"
                        )}
                    </ContactReason>

                    <ContactReason
                        icon="♿"
                    >
                        {t(
                            "institutional.contact.itemAccessibility"
                        )}
                    </ContactReason>
                </ul>
            </Card>

            {/* -------------------------------------------------------------- */}
            {/* Public support channel                                         */}
            {/* -------------------------------------------------------------- */}

            <aside
                className="
                    mt-5
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
                            "institutional.contact.action"
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
                            "institutional.contact.actionMeta"
                        )}
                    </p>
                </div>

                <a
                    href={
                        issueUrl
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
                        "institutional.contact.action"
                    )}

                    <span
                        aria-hidden="true"
                    >
                        ↗
                    </span>
                </a>
            </aside>

            <p
                className="
                    mt-4
                    text-xs
                    leading-5
                    text-muted
                "
            >
                {t(
                    "institutional.contact.publicNotice"
                )}
            </p>
        </Page>
    );
}

/* -------------------------------------------------------------------------- */
/* Reason                                                                      */
/* -------------------------------------------------------------------------- */

interface ContactReasonProps {
    icon:
        string;

    children:
        React.ReactNode;
}

function ContactReason({
    icon,
    children
}: ContactReasonProps) {
    return (
        <li
            className="
                flex
                items-start
                gap-3
                rounded-control
                bg-neutral-50
                px-4
                py-3
                text-sm
                leading-6
                text-neutral-700
            "
        >
            <span
                className="
                    shrink-0
                    text-lg
                "
                aria-hidden="true"
            >
                {icon}
            </span>

            <span>
                {children}
            </span>
        </li>
    );
}

export {
    ContactPage
};