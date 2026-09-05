import {
    I18nProvider
} from "../i18n/I18nProvider.js";

import {
    AuthProvider
} from "../services/backend/AuthProvider.js";

import {
    BackendProvider
} from "../services/backend/BackendProvider.js";

import {
    LearnerProfileProvider
} from "../services/backend/LearnerProfileProvider.js";

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
        <BackendProvider>
            <AuthProvider>
                <LearnerProfileProvider>
                    <I18nProvider>
                        <AppRouter />
                    </I18nProvider>
                </LearnerProfileProvider>
            </AuthProvider>
        </BackendProvider>
    );
}

export {
    App
};
