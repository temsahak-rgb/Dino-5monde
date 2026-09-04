import {
    type ReactNode,
    useEffect,
    useRef,
    useState
} from "react";

import {
    Link,
    NavLink,
    useLocation
} from "react-router";

import {
    SearchDialog
} from "../../features/search/SearchDialog.js";

import {
    useI18n
} from "../../i18n/I18nProvider.js";

interface NavigationItem {
    to: string;
    label: string;
    icon: string;
}

interface PlannedNavigationItem {
    label: string;
    icon: string;
}

interface NavigationGroupProps {
    title: string;
    children: ReactNode;
    className?: string;
}

interface NavigationLinkProps
    extends NavigationItem {
    onNavigate: () => void;
}

interface PlannedNavigationLinkProps
    extends PlannedNavigationItem {
    unavailableLabel: string;
    soonLabel: string;
}

/**
 * Main React application navigation.
 *
 * Responsibilities:
 *
 * - persistent top-level navigation
 * - responsive navigation menu
 * - active-route presentation
 * - global search dialog
 * - keyboard and outside-click closing
 *
 * Feature routing remains owned by React Router.
 */
function Navbar() {
    const {
        t
    } = useI18n();

    const location =
        useLocation();

    const menuRef =
        useRef<HTMLDivElement | null>(
            null
        );

    const toggleRef =
        useRef<HTMLButtonElement | null>(
            null
        );

    const [
        menuOpen,
        setMenuOpen
    ] =
        useState(
            false
        );

    const [
        searchOpen,
        setSearchOpen
    ] =
        useState(
            false
        );

    /* ---------------------------------------------------------------------- */
    /* Route transitions                                                      */
    /* ---------------------------------------------------------------------- */

    useEffect(
        () => {
            /*
             * A completed navigation makes the old mobile/dropdown menu
             * irrelevant.
             */
            setMenuOpen(
                false
            );
        },
        [
            location.pathname
        ]
    );

    /* ---------------------------------------------------------------------- */
    /* Escape                                                                 */
    /* ---------------------------------------------------------------------- */

    useEffect(
        () => {
            if (!menuOpen) {
                return;
            }

            function handleKeyDown(
                event:
                    KeyboardEvent
            ): void {
                if (
                    event.key
                    !== "Escape"
                ) {
                    return;
                }

                setMenuOpen(
                    false
                );

                toggleRef.current
                    ?.focus();
            }

            document.addEventListener(
                "keydown",
                handleKeyDown
            );

            return () => {
                document.removeEventListener(
                    "keydown",
                    handleKeyDown
                );
            };
        },
        [
            menuOpen
        ]
    );

    /* ---------------------------------------------------------------------- */
    /* Outside click                                                          */
    /* ---------------------------------------------------------------------- */

    useEffect(
        () => {
            if (!menuOpen) {
                return;
            }

            function handlePointerDown(
                event:
                    PointerEvent
            ): void {
                const target =
                    event.target;

                if (
                    !(target instanceof Node)
                ) {
                    return;
                }

                if (
                    menuRef.current
                        ?.contains(
                            target
                        )
                    || toggleRef.current
                        ?.contains(
                            target
                        )
                ) {
                    return;
                }

                setMenuOpen(
                    false
                );
            }

            document.addEventListener(
                "pointerdown",
                handlePointerDown
            );

            return () => {
                document.removeEventListener(
                    "pointerdown",
                    handlePointerDown
                );
            };
        },
        [
            menuOpen
        ]
    );

    function closeMenu():
        void {
        setMenuOpen(
            false
        );
    }

    return (
        <>
            <header
                className="
                    sticky
                    top-0
                    z-40
                    h-14
                    bg-dino-600
                    shadow-[0_1px_0_rgb(255_255_255/0.15)]
                    max-[560px]:h-[52px]
                "
            >
                <nav
                    className="
                        relative
                        mx-auto
                        flex
                        h-full
                        w-full
                        max-w-[1200px]
                        items-center
                        justify-between
                        px-4
                        max-[560px]:px-2.5
                    "
                    aria-label={
                        t(
                            "navbar.primaryNavigation"
                        )
                    }
                >
                    {/* ------------------------------------------------------ */}
                    {/* Brand                                                  */}
                    {/* ------------------------------------------------------ */}

                    <Link
                        to="/"
                        onClick={
                            closeMenu
                        }
                        className="
                            inline-flex
                            min-w-0
                            items-center
                            gap-2
                            rounded-control
                            px-2
                            py-1.5
                            text-sm
                            font-bold
                            text-white
                            no-underline
                            transition
                            hover:bg-white/15
                            focus-visible:outline-none
                            focus-visible:ring-2
                            focus-visible:ring-white
                        "
                    >
                        <span
                            aria-hidden="true"
                            className="
                                shrink-0
                                text-lg
                            "
                        >
                            🦖
                        </span>

                        <span
                            className="
                                truncate
                                max-[560px]:max-w-[150px]
                            "
                        >
                            {t(
                                "app.title"
                            )}
                        </span>
                    </Link>

                    {/* ------------------------------------------------------ */}
                    {/* Actions                                                */}
                    {/* ------------------------------------------------------ */}

                    <div
                        className="
                            flex
                            items-center
                            gap-1.5
                        "
                    >
                        <button
                            type="button"
                            aria-label={
                                t(
                                    "navbar.search"
                                )
                            }
                            title={
                                t(
                                    "navbar.search"
                                )
                            }
                            onClick={() => {
                                setMenuOpen(
                                    false
                                );

                                setSearchOpen(
                                    true
                                );
                            }}
                            className="
                                inline-grid
                                size-[38px]
                                place-items-center
                                rounded-control
                                border-0
                                bg-white/10
                                text-base
                                text-white
                                transition
                                hover:bg-white/20
                                focus-visible:outline-none
                                focus-visible:ring-2
                                focus-visible:ring-white
                            "
                        >
                            <span
                                aria-hidden="true"
                            >
                                🔍
                            </span>
                        </button>

                        <button
                            ref={
                                toggleRef
                            }
                            type="button"
                            aria-controls="main-navigation-menu"
                            aria-expanded={
                                menuOpen
                            }
                            onClick={() => {
                                setMenuOpen(
                                    current =>
                                        !current
                                );
                            }}
                            className="
                                inline-flex
                                min-h-[38px]
                                items-center
                                gap-2
                                rounded-control
                                border-0
                                bg-white/10
                                px-3
                                py-1.5
                                text-sm
                                font-bold
                                text-white
                                transition
                                hover:bg-white/20
                                focus-visible:outline-none
                                focus-visible:ring-2
                                focus-visible:ring-white
                            "
                        >
                            <span
                                aria-hidden="true"
                            >
                                ☰
                            </span>

                            <span>
                                {t(
                                    "navbar.menu"
                                )}
                            </span>
                        </button>
                    </div>

                    {/* ------------------------------------------------------ */}
                    {/* Menu                                                   */}
                    {/* ------------------------------------------------------ */}

                    {menuOpen ? (
                        <div
                            ref={
                                menuRef
                            }
                            id="main-navigation-menu"
                            className="
                                absolute
                                end-3
                                top-[calc(100%+8px)]
                                grid
                                max-h-[calc(100vh-76px)]
                                w-[min(620px,calc(100vw-24px))]
                                grid-cols-2
                                gap-2.5
                                overflow-y-auto
                                rounded-panel
                                border
                                border-line
                                bg-surface
                                p-3
                                text-ink
                                shadow-panel
                                max-[560px]:inset-x-2
                                max-[560px]:top-[calc(100%+6px)]
                                max-[560px]:w-auto
                                max-[560px]:grid-cols-1
                            "
                        >
                            {/* ---------------------------------------------- */}
                            {/* Learning                                       */}
                            {/* ---------------------------------------------- */}

                            <NavigationGroup
                                title={
                                    t(
                                        "navbar.group.learning"
                                    )
                                }
                                className="
                                    row-span-3
                                    max-[560px]:row-auto
                                "
                            >
                                <p
                                    className="
                                        mb-2
                                        text-sm
                                        font-extrabold
                                        text-ink
                                    "
                                >
                                    {t(
                                        "navbar.gamesExercises"
                                    )}
                                </p>

                                <div
                                    className="
                                        mb-2
                                        border-s-2
                                        border-dino-200
                                        ps-2
                                    "
                                >
                                    <NavigationLink
                                        to="/grammar"
                                        icon="📐"
                                        label={
                                            t(
                                                "navbar.grammar"
                                            )
                                        }
                                        onNavigate={
                                            closeMenu
                                        }
                                    />

                                    <NavigationLink
                                        to="/vocabulary"
                                        icon="📖"
                                        label={
                                            t(
                                                "navbar.vocabulary"
                                            )
                                        }
                                        onNavigate={
                                            closeMenu
                                        }
                                    />
                                </div>

                                <NavigationLink
                                    to="/travel"
                                    icon="✈️"
                                    label={
                                        t(
                                            "navbar.travel"
                                        )
                                    }
                                    onNavigate={
                                        closeMenu
                                    }
                                />
                            </NavigationGroup>

                            {/* ---------------------------------------------- */}
                            {/* Discovery                                      */}
                            {/* ---------------------------------------------- */}

                            <NavigationGroup
                                title={
                                    t(
                                        "navbar.group.discovery"
                                    )
                                }
                            >
                                <PlannedNavigationLink
                                    icon="🎵"
                                    label={
                                        t(
                                            "navbar.music"
                                        )
                                    }
                                    soonLabel={
                                        t(
                                            "navbar.soon"
                                        )
                                    }
                                    unavailableLabel={
                                        t(
                                            "navbar.unavailable"
                                        )
                                    }
                                />

                                <NavigationLink
                                    to="/journal"
                                    icon="📰"
                                    label={
                                        t(
                                            "navbar.journal"
                                        )
                                    }
                                    onNavigate={
                                        closeMenu
                                    }
                                />
                            </NavigationGroup>

                            {/* ---------------------------------------------- */}
                            {/* Services                                       */}
                            {/* ---------------------------------------------- */}

                            <NavigationGroup
                                title={
                                    t(
                                        "navbar.group.services"
                                    )
                                }
                            >
                                <PlannedNavigationLink
                                    icon="🛍️"
                                    label={
                                        t(
                                            "navbar.shop"
                                        )
                                    }
                                    soonLabel={
                                        t(
                                            "navbar.soon"
                                        )
                                    }
                                    unavailableLabel={
                                        t(
                                            "navbar.unavailable"
                                        )
                                    }
                                />
                            </NavigationGroup>

                            {/* ---------------------------------------------- */}
                            {/* Account                                        */}
                            {/* ---------------------------------------------- */}

                            <NavigationGroup
                                title={
                                    t(
                                        "navbar.group.account"
                                    )
                                }
                            >
                                <PlannedNavigationLink
                                    icon="🗂️"
                                    label={
                                        t(
                                            "navbar.archive"
                                        )
                                    }
                                    soonLabel={
                                        t(
                                            "navbar.soon"
                                        )
                                    }
                                    unavailableLabel={
                                        t(
                                            "navbar.unavailable"
                                        )
                                    }
                                />

                                <PlannedNavigationLink
                                    icon="👤"
                                    label={
                                        t(
                                            "navbar.profile"
                                        )
                                    }
                                    soonLabel={
                                        t(
                                            "navbar.soon"
                                        )
                                    }
                                    unavailableLabel={
                                        t(
                                            "navbar.unavailable"
                                        )
                                    }
                                />
                            </NavigationGroup>
                        </div>
                    ) : null}
                </nav>
            </header>

            <SearchDialog
                open={
                    searchOpen
                }
                onClose={() => {
                    setSearchOpen(
                        false
                    );
                }}
            />
        </>
    );
}

/* -------------------------------------------------------------------------- */
/* Group                                                                      */
/* -------------------------------------------------------------------------- */

function NavigationGroup({
    title,
    children,
    className = ""
}: NavigationGroupProps) {
    return (
        <section
            className={`
                rounded-card
                border
                border-line
                bg-neutral-50
                p-3
                ${className}
            `}
        >
            <h2
                className="
                    mb-2
                    text-[11px]
                    font-extrabold
                    uppercase
                    leading-tight
                    tracking-[0.08em]
                    text-muted
                "
            >
                {title}
            </h2>

            {children}
        </section>
    );
}

/* -------------------------------------------------------------------------- */
/* Active navigation                                                          */
/* -------------------------------------------------------------------------- */

/**
 * Shipped navigation destination.
 */
function NavigationLink({
    to,
    label,
    icon,
    onNavigate
}: NavigationLinkProps) {
    return (
        <NavLink
            to={
                to
            }
            end={
                to === "/"
            }
            onClick={
                onNavigate
            }
            className={
                ({
                    isActive
                }) => `
                    flex
                    min-h-[42px]
                    w-full
                    items-center
                    gap-2
                    rounded-control
                    px-2.5
                    py-2
                    text-sm
                    font-semibold
                    no-underline
                    transition
                    focus-visible:outline-none
                    focus-visible:ring-2
                    focus-visible:ring-dino-500
                    ${
                        isActive
                            ? `
                                bg-dino-100
                                text-dino-800
                                shadow-[inset_3px_0_0_var(--color-dino-600)]
                            `
                            : `
                                text-ink
                                hover:bg-dino-50
                                hover:text-dino-700
                            `
                    }
                `
            }
        >
            <span
                className="
                    w-[22px]
                    shrink-0
                    text-center
                    text-base
                "
                aria-hidden="true"
            >
                {icon}
            </span>

            <span
                className="
                    min-w-0
                "
            >
                {label}
            </span>
        </NavLink>
    );
}

/* -------------------------------------------------------------------------- */
/* Planned destinations                                                       */
/* -------------------------------------------------------------------------- */

/**
 * Roadmap destination visible in the information architecture but not shipped.
 */
function PlannedNavigationLink({
    label,
    icon,
    unavailableLabel,
    soonLabel
}: PlannedNavigationLinkProps) {
    return (
        <div
            aria-disabled="true"
            title={
                unavailableLabel
            }
            className="
                flex
                min-h-[42px]
                w-full
                items-center
                gap-2
                rounded-control
                px-2.5
                py-2
                text-sm
                text-muted
                opacity-75
            "
        >
            <span
                className="
                    w-[22px]
                    shrink-0
                    text-center
                    text-base
                "
                aria-hidden="true"
            >
                {icon}
            </span>

            <span
                className="
                    min-w-0
                    flex-1
                "
            >
                {label}
            </span>

            <span
                className="
                    shrink-0
                    rounded-full
                    bg-neutral-200
                    px-1.5
                    py-0.5
                    text-[10px]
                    font-bold
                    text-muted
                "
            >
                {soonLabel}
            </span>
        </div>
    );
}

export {
    Navbar
};