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
    LearningRewardsProvider
} from "../services/backend/LearningRewardsProvider.js";

import {
    LessonProgressSyncProvider
} from "../services/backend/LessonProgressSyncProvider.js";

import {
    ShopProvider
} from "../services/backend/ShopProvider.js";

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
                <ShopProvider>
                    <LessonProgressSyncProvider>
                        <LearningRewardsProvider>
                            <LearnerProfileProvider>
                                <I18nProvider>
                                    <AppRouter />
                                </I18nProvider>
                            </LearnerProfileProvider>
                        </LearningRewardsProvider>
                    </LessonProgressSyncProvider>
                </ShopProvider>
            </AuthProvider>
        </BackendProvider>
    );
}

export {
    App
};
