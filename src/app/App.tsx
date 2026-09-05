import {
    I18nProvider
} from "../i18n/I18nProvider.js";

import {
    AppRouter
} from "./AppRouter.js";

/**
 * Root React application.
 *
 * Global application concerns belong here while individual routes and
 * educational features remain isolated below the router.
 */
function App() {
    return (
        <I18nProvider>
            <AppRouter />
        </I18nProvider>
    );
}

export {
    App
};