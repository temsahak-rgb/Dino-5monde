import {
    Outlet,
    ScrollRestoration,
    useLocation
} from "react-router";

import {
    useEffect
} from "react";

import {
    Footer
} from "../ui/components/Footer.js";

import {
    Navbar
} from "../ui/components/Navbar.js";

/**
 * Shared shell for every authenticated/onboarded application page.
 *
 * Responsibilities:
 * - render the persistent navigation
 * - render the active route
 * - render the institutional footer
 * - restore scroll positions through React Router
 * - expose a stable focus target after navigation
 *
 * Feature-specific state and data loading must remain outside this component.
 */
function AppLayout() {
    const location =
        useLocation();

    /*
     * React Router changes the route without recreating the document.
     * Move focus to the routed content so keyboard and assistive-technology
     * users immediately know that navigation occurred.
     */
    useEffect(
        () => {
            const main =
                document.getElementById(
                    "main-content"
                );

            if (!main) {
                return;
            }

            main.focus({
                preventScroll: true
            });
        },
        [
            location.pathname,
            location.search
        ]
    );

    return (
        <div
            className="
                flex
                min-h-screen
                flex-col
                bg-page
                text-ink
            "
        >
            <Navbar />

            <main
                id="main-content"
                tabIndex={-1}
                className="
                    dino-route-enter
                    min-w-0
                    flex-1
                    outline-none
                "
                key={
                    `${location.pathname}${location.search}`
                }
            >
                <Outlet />
            </main>

            <Footer />

            <ScrollRestoration />
        </div>
    );
}

export {
    AppLayout
};