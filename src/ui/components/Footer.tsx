import {
    NavLink
} from "react-router";

import {
    useI18n
} from "../../i18n/I18nProvider.js";

/**
 * Product-wide institutional footer.
 */
function Footer() {
    const {
        t
    } = useI18n();

    return (
        <footer
            className="
                border-t
                border-dino-100
                bg-dino-50
                text-dino-900
            "
        >
            <div
                className="
                    mx-auto
                    flex
                    w-full
                    max-w-[900px]
                    flex-col
                    gap-4
                    px-4
                    py-5
                    sm:flex-row
                    sm:items-center
                    sm:justify-between
                    sm:gap-6
                    sm:px-5
                    sm:py-6
                "
            >
                <div
                    className="
                        flex
                        items-center
                        gap-3
                    "
                >
                    <span
                        className="
                            shrink-0
                            text-3xl
                        "
                        aria-hidden="true"
                    >
                        🦖
                    </span>

                    <div>
                        <strong
                            className="
                                block
                                text-sm
                                font-bold
                            "
                        >
                            {t("app.title")}
                        </strong>

                        <p
                            className="
                                mt-0.5
                                text-xs
                                text-dino-800/70
                            "
                        >
                            {t("footer.tagline")}
                        </p>
                    </div>
                </div>

                <nav
                    className="
                        flex
                        flex-wrap
                        items-center
                        gap-x-5
                        gap-y-2
                    "
                    aria-label={
                        t(
                            "footer.navigationLabel"
                        )
                    }
                >
                    <FooterLink
                        to="/info/about"
                    >
                        {t("footer.about")}
                    </FooterLink>

                    <FooterLink
                        to="/info/contact"
                    >
                        {t("footer.contact")}
                    </FooterLink>

                    <FooterLink
                        to="/info/work-with-us"
                    >
                        {t("footer.workWithUs")}
                    </FooterLink>
                </nav>
            </div>
        </footer>
    );
}

interface FooterLinkProps {
    to: string;
    children: React.ReactNode;
}

/**
 * Institutional footer navigation link.
 */
function FooterLink({
    to,
    children
}: FooterLinkProps) {
    return (
        <NavLink
            to={to}
            className={
                ({
                    isActive
                }) => `
                    border-b-2
                    inline-flex
                    min-h-11
                    items-center
                    px-1.5
                    py-2
                    text-sm
                    font-semibold
                    no-underline
                    transition
                    ${
                        isActive
                            ? `
                                border-dino-600
                                text-dino-800
                            `
                            : `
                                border-transparent
                                text-dino-800/80
                                hover:border-dino-500
                                hover:text-dino-900
                            `
                    }
                `
            }
        >
            {children}
        </NavLink>
    );
}

export {
    Footer
};
