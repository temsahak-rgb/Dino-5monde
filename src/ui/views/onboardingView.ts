import { t } from "../../i18n/i18n.js";
import type {
    Level,
    PlacementLevelEstimate,
    PlacementQuestion
} from "../../types/global.js";

export {
    renderLanguageSelectionView,
    renderLevelSelectionView,
    renderPathSelectionView,
    renderPlacementChoiceView,
    renderPlacementQuestionView,
    renderPlacementResultView
};

/**
 * Presentation layer for the onboarding and placement flow.
 *
 * This file owns every onboarding HTML template:
 * - interface language selection
 * - learning-path selection
 * - placement-test choice
 * - placement questions
 * - placement result
 * - manual CEFR level selection
 *
 * Navigation, persistence and placement logic remain in
 * `src/features/onboarding/onboarding.ts`.
 */

/**
 * Returns the localized human-readable label of a CEFR level.
 *
 * @param level - CEFR level.
 * @returns Localized level label.
 */
function getPlacementLevelLabelView(
    level: Level
): string {
    switch (level) {
        case "A1":
            return t(
                "grammar.level.A1"
            );

        case "A2":
            return t(
                "grammar.level.A2"
            );

        case "B1":
            return t(
                "grammar.level.B1"
            );

        case "B2":
            return t(
                "grammar.level.B2"
            );

        case "C1":
            return t(
                "grammar.level.C1"
            );

        case "C2":
            return t(
                "grammar.level.C2"
            );
    }
}

/**
 * Renders the interface-language selection page.
 *
 * @returns Complete language-selection HTML.
 */
function renderLanguageSelectionView(): string {
    return `
        <div style="
            max-width:400px;
            margin:80px auto;
            padding:0 16px;
            text-align:center;
        ">
            <div style="
                font-size:64px;
                margin-bottom:20px;
            ">
                🦖
            </div>

            <h1 style="
                font-size:24px;
                color:#1a1a1a;
                margin-bottom:8px;
            ">
                ${t("app.title")}
            </h1>

            <p style="
                font-size:14px;
                color:#777;
                margin-bottom:30px;
            ">
                ${t("onboarding.chooseLanguage")}
            </p>

            <button
                id="fr"
                type="button"
                style="
                    width:100%;
                    padding:14px;
                    margin-bottom:10px;
                    border:1px solid #ddd;
                    border-radius:6px;
                    background:#fff;
                    font-size:16px;
                    color:#1a1a1a;
                    cursor:pointer;
                "
            >
                🇫🇷 ${t("onboarding.french")}
            </button>

            <button
                id="fa"
                type="button"
                style="
                    width:100%;
                    padding:14px;
                    border:1px solid #ddd;
                    border-radius:6px;
                    background:#fff;
                    font-size:16px;
                    color:#1a1a1a;
                    cursor:pointer;
                "
            >
                🇮🇷 ${t("onboarding.persian")}
            </button>
        </div>
    `;
}

/**
 * Renders the learning-path selection page.
 *
 * @returns Complete path-selection HTML.
 */
function renderPathSelectionView(): string {
    return `
        <div style="
            max-width:400px;
            margin:60px auto;
            padding:0 16px;
        ">
            <div style="
                font-size:48px;
                margin-bottom:16px;
                text-align:center;
            ">
                🦖
            </div>

            <button
                id="back"
                type="button"
                class="back-btn"
                style="
                    background:none;
                    border:none;
                    color:#087F5B;
                    font-size:13px;
                    cursor:pointer;
                    padding:0;
                    margin-bottom:16px;
                "
            >
                ← ${t("common.back")}
            </button>

            <h1 style="
                font-size:22px;
                color:#1a1a1a;
                margin-bottom:20px;
            ">
                ${t("onboarding.choosePath")}
            </h1>

            <div style="
                display:flex;
                flex-direction:column;
                gap:10px;
            ">
                ${renderOnboardingPathButtonView(
                    "general",
                    "🇫🇷",
                    t("onboarding.general")
                )}

                ${renderOnboardingPathButtonView(
                    "travel",
                    "✈️",
                    t("onboarding.travel")
                )}
            </div>
        </div>
    `;
}

/**
 * Renders one learning-path button.
 *
 * @param id - DOM identifier used by the controller.
 * @param icon - Path icon.
 * @param label - Localized path label.
 * @returns Path button HTML.
 */
function renderOnboardingPathButtonView(
    id: string,
    icon: string,
    label: string
): string {
    return `
        <button
            id="${id}"
            type="button"
            style="
                width:100%;
                padding:14px;
                border:1px solid #ddd;
                border-radius:6px;
                background:#fff;
                font-size:15px;
                color:#1a1a1a;
                cursor:pointer;
                text-align:inherit;
            "
        >
            ${icon} ${label}
        </button>
    `;
}

/**
 * Renders the screen asking whether the learner wants to run the placement
 * test.
 *
 * @returns Complete placement-choice HTML.
 */
function renderPlacementChoiceView(): string {
    return `
        <div style="
            max-width:400px;
            margin:60px auto;
            padding:0 16px;
        ">
            <div style="
                font-size:48px;
                margin-bottom:16px;
                text-align:center;
            ">
                🦖
            </div>

            <button
                id="back"
                type="button"
                class="back-btn"
                style="
                    background:none;
                    border:none;
                    color:#087F5B;
                    font-size:13px;
                    cursor:pointer;
                    padding:0;
                    margin-bottom:16px;
                "
            >
                ← ${t("common.back")}
            </button>

            <h1 style="
                font-size:22px;
                color:#1a1a1a;
                margin-bottom:10px;
            ">
                ${t("onboarding.general")}
            </h1>

            <p style="
                font-size:14px;
                color:#777;
                margin-bottom:25px;
            ">
                ${t("onboarding.levelQuestion")}
            </p>

            <button
                id="yes"
                type="button"
                style="
                    width:100%;
                    padding:14px;
                    margin-bottom:10px;
                    border:none;
                    border-radius:6px;
                    background:#087F5B;
                    color:#fff;
                    font-size:15px;
                    cursor:pointer;
                "
            >
                ${t("onboarding.startTest")}
            </button>

            <button
                id="later"
                type="button"
                style="
                    width:100%;
                    padding:14px;
                    border:1px solid #ddd;
                    border-radius:6px;
                    background:#fff;
                    font-size:15px;
                    color:#1a1a1a;
                    cursor:pointer;
                "
            >
                ${t("onboarding.later")}
            </button>
        </div>
    `;
}

/**
 * Renders one adaptive placement-test question.
 *
 * Answer selection is exposed through `.option-btn` and `data-index`.
 *
 * @param question - Active placement question.
 * @param progressPercent - Current test completion percentage.
 * @returns Complete placement-question HTML.
 */
function renderPlacementQuestionView(
    question: PlacementQuestion,
    progressPercent: number
): string {
    const safeProgress =
        Math.min(
            100,
            Math.max(
                0,
                progressPercent
            )
        );

    return `
        <div style="
            max-width:600px;
            margin:0 auto;
            padding:30px 16px;
        ">
            <div style="
                text-align:center;
                font-size:32px;
                margin-bottom:16px;
            ">
                🦖
            </div>

            <div style="
                background:#e0e0e0;
                height:4px;
                border-radius:2px;
                margin-bottom:25px;
                overflow:hidden;
            ">
                <div style="
                    background:#087F5B;
                    height:100%;
                    width:${safeProgress}%;
                    transition:width 0.3s;
                "></div>
            </div>

            <div style="
                background:#fff;
                border:1px solid #e0e0e0;
                border-radius:8px;
                padding:30px;
            ">
                <p
                    class="ltr-lock"
                    style="
                        font-size:18px;
                        margin:0 0 25px;
                        line-height:1.6;
                        color:#1a1a1a;
                        font-weight:500;
                    "
                >
                    ${question.question}
                </p>

                <div style="
                    display:flex;
                    flex-direction:column;
                    gap:10px;
                ">
                    ${question.options
                        .map(
                            (
                                option,
                                index
                            ) =>
                                renderPlacementOptionView(
                                    option,
                                    index
                                )
                        )
                        .join("")}
                </div>

                <button
                    id="dont-know"
                    type="button"
                    style="
                        width:100%;
                        margin-top:15px;
                        padding:12px;
                        font-size:14px;
                        border:1px solid #dc2626;
                        border-radius:6px;
                        background:#fff;
                        color:#dc2626;
                        cursor:pointer;
                        font-weight:600;
                    "
                >
                    ${t("onboarding.dontKnow")}
                </button>
            </div>
        </div>
    `;
}

/**
 * Renders one placement-test answer option.
 *
 * @param option - Answer text.
 * @param index - Answer index.
 * @returns Answer button HTML.
 */
function renderPlacementOptionView(
    option: string,
    index: number
): string {
    return `
        <button
            type="button"
            class="option-btn ltr-lock"
            data-index="${index}"
            style="
                width:100%;
                padding:14px;
                font-size:15px;
                border:1px solid #e0e0e0;
                border-radius:6px;
                background:#fafafa;
                color:#1a1a1a;
                cursor:pointer;
                text-align:left;
                font-weight:500;
            "
        >
            ${option}
        </button>
    `;
}

/**
 * Renders the final adaptive placement result.
 *
 * The placement engine returns language-neutral CEFR values. Their
 * human-readable description is resolved here through i18n.
 *
 * @param levelInfo - Estimated CEFR level and range.
 * @returns Complete placement-result HTML.
 */
function renderPlacementResultView(
    levelInfo: PlacementLevelEstimate
): string {
    const levelLabel =
        getPlacementLevelLabelView(
            levelInfo.level
        );

    return `
        <div style="
            text-align:center;
            padding:50px 16px;
            max-width:500px;
            margin:0 auto;
        ">
            <div style="
                font-size:48px;
                margin-bottom:16px;
            ">
                🦖
            </div>

            <h1 style="
                font-size:24px;
                color:#1a1a1a;
                margin-bottom:16px;
            ">
                🎉 ${t("onboarding.finalResult")}
            </h1>

            <p style="
                font-size:14px;
                color:#777;
                margin-bottom:8px;
            ">
                ${t("onboarding.yourLevel")} :
            </p>

            <h2
                class="ltr-lock"
                style="
                    font-size:48px;
                    color:#087F5B;
                    margin:15px 0 6px;
                    font-weight:800;
                "
            >
                ${levelInfo.range}
            </h2>

            <p style="
                font-size:16px;
                color:#087F5B;
                margin:0 0 20px;
                font-weight:600;
            ">
                ${levelLabel}
            </p>

            <p style="
                font-size:14px;
                color:#777;
                margin:20px 0;
                line-height:1.6;
            ">
                ${t("onboarding.canModify")}
            </p>

            <button
                id="accept-level"
                type="button"
                style="
                    width:100%;
                    padding:14px;
                    border:none;
                    border-radius:6px;
                    background:#087F5B;
                    color:#fff;
                    font-size:15px;
                    cursor:pointer;
                    margin-bottom:10px;
                    font-weight:600;
                "
            >
                ${t("onboarding.acceptLevel")}
            </button>

            <button
                id="change-level"
                type="button"
                style="
                    width:100%;
                    padding:14px;
                    border:1px solid #087F5B;
                    border-radius:6px;
                    background:#fff;
                    color:#087F5B;
                    font-size:15px;
                    cursor:pointer;
                    font-weight:600;
                "
            >
                ${t("onboarding.changeLevel")}
            </button>
        </div>
    `;
}

/**
 * Renders a manual CEFR level selector.
 *
 * @param levels - Levels that may be selected manually.
 * @returns Complete manual-level-selection HTML.
 */
function renderLevelSelectionView(
    levels: readonly Level[]
): string {
    return `
        <div style="
            text-align:center;
            padding:50px 16px;
            max-width:500px;
            margin:0 auto;
        ">
            <div style="
                font-size:48px;
                margin-bottom:16px;
            ">
                🦖
            </div>

            <h1 style="
                font-size:22px;
                color:#1a1a1a;
                margin-bottom:30px;
            ">
                ${t("onboarding.chooseYourLevel")}
            </h1>

            <div style="
                display:flex;
                flex-direction:column;
                gap:10px;
            ">
                ${levels
                    .map(
                        level =>
                            renderLevelButtonView(
                                level
                            )
                    )
                    .join("")}
            </div>
        </div>
    `;
}

/**
 * Renders one manually selectable CEFR level.
 *
 * @param level - CEFR level.
 * @returns Level button HTML.
 */
function renderLevelButtonView(
    level: Level
): string {
    return `
        <button
            type="button"
            class="level-btn"
            data-level="${level}"
            style="
                padding:14px;
                border:1px solid #ddd;
                border-radius:6px;
                background:#fff;
                color:#1a1a1a;
                cursor:pointer;
                display:flex;
                align-items:center;
                justify-content:space-between;
                gap:16px;
            "
        >
            <span
                class="ltr-lock"
                style="
                    font-size:18px;
                    font-weight:700;
                "
            >
                ${level}
            </span>

            <span style="
                font-size:14px;
                color:#777;
                font-weight:500;
            ">
                ${getPlacementLevelLabelView(
                    level
                )}
            </span>
        </button>
    `;
}
