import {
    useLocation
} from "react-router";

import {
    useI18n
} from "../i18n/I18nProvider.js";

import {
    BackButton
} from "../ui/components/Controls.js";

import {
    Page
} from "../ui/components/Layout.js";

/**
 * Global React Router fallback.
 *
 * This page handles application URLs that do not match any registered route.
 */
function NotFoundPage() {
    const {
        pathname
    } = useLocation();

    const {
        t
    } = useI18n();

    return (
        <Page>
            <main
                className="
                    mx-auto
                    flex
                    min-h-[55vh]
                    w-full
                    max-w-[680px]
                    flex-col
                    items-center
                    justify-center
                    py-12
                    text-center
                    sm:py-16
                "
                data-error-page="not-found"
            >
                <p
                    aria-hidden="true"
                    className="
                        m-0
                        text-7xl
                        font-extrabold
                        leading-none
                        tracking-tighter
                        text-dino-600
                        sm:text-8xl
                    "
                >
                    404
                </p>

                <h1
                    className="
                        mt-5
                        text-2xl
                        font-bold
                        leading-tight
                        text-ink
                        sm:text-3xl
                    "
                >
                    {t(
                        "error.notFound.title"
                    )}
                </h1>

                <p
                    className="
                        ltr-lock
                        mt-3
                        max-w-lg
                        break-all
                        text-sm
                        leading-6
                        text-muted
                        sm:text-base
                    "
                >
                    {pathname}
                </p>

                <div
                    className="
                        mt-7
                    "
                >
                    <BackButton
                        fallback="/"
                    >
                        ←
                        {" "}
                        {t(
                            "common.back"
                        )}
                    </BackButton>
                </div>
            </main>
        </Page>
    );
}

export {
    NotFoundPage
};