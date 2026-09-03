import { renderNavbar } from "./navbarView.js";
import {
    localizedTextClass,
    localizedValue,
    t
} from "../../i18n/i18n.js";
import type {
    ExerciseQuestion,
    ExerciseSectionInput
} from "../../types/global.js";
import { renderMarkdown } from "../ui.js";

export {
    renderExerciseFeedbackView,
    renderExerciseQuestionView,
    renderExerciseResultView
};

/**
 * Presentation layer for shared exercise flows.
 *
 * Exercise state, scoring, persistence and event orchestration remain in the
 * feature controller.
 */

/**
 * Renders one exercise question.
 *
 * Choice questions receive buttons carrying their option index through the
 * `data-index` attribute. Event handlers remain the controller's
 * responsibility.
 *
 * @param section - Exercise section currently being played.
 * @param question - Prepared question to display.
 * @param currentQuestionIndex - Zero-based active question index.
 * @param totalQuestions - Total number of questions in the current exercise.
 * @returns Complete exercise-question page HTML.
 */
function renderExerciseQuestionView(
    section: ExerciseSectionInput,
    question: ExerciseQuestion,
    currentQuestionIndex: number,
    totalQuestions: number
): string {
    const title = localizedValue(
        section.title,
        section.title_fa,
        t("exercise.defaultTitle")
    );

    const progress = totalQuestions > 0
        ? ((currentQuestionIndex + 1) / totalQuestions) * 100
        : 0;

    return `
        ${renderNavbar()}

        <div style="
            max-width:900px;
            margin:0 auto;
            padding:24px 16px 50px;
        ">
            <button
                id="back"
                type="button"
                class="back-btn"
            >
                ← ${t("common.back")}
            </button>

            <div style="
                display:flex;
                justify-content:space-between;
                align-items:center;
                margin-bottom:16px;
            ">
                <span style="
                    font-size:13px;
                    color:#777;
                ">
                    ${currentQuestionIndex + 1} / ${totalQuestions}
                </span>
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
                    width:${progress}%;
                    transition:width 0.3s;
                    border-radius:2px;
                "></div>
            </div>

            <h2
                class="${localizedTextClass()}"
                style="
                    font-size:18px;
                    margin-bottom:10px;
                    color:#1a1a1a;
                "
            >
                ${title}
            </h2>

            <p
                class="ltr-lock"
                style="
                    font-size:17px;
                    line-height:1.6;
                    color:#1a1a1a;
                    margin-bottom:25px;
                    font-weight:500;
                "
            >
                ${question.question}
            </p>

            <div
                id="options-container"
                style="
                    display:flex;
                    flex-direction:column;
                    gap:10px;
                "
            >
                ${renderExerciseOptionsView(question)}
            </div>

            <div
                id="feedback"
                style="
                    margin-top:20px;
                    min-height:60px;
                "
            ></div>
        </div>
    `;
}

/**
 * Renders the available answers for a prepared exercise question.
 *
 * The current browser interaction supports MCQ and binary questions. Other
 * exercise contracts remain visible through a localized fallback instead of
 * silently failing.
 *
 * @param question - Prepared exercise question.
 * @returns Question options HTML.
 */
function renderExerciseOptionsView(
    question: ExerciseQuestion
): string {
    if (
        question.type !== "mcq"
        && question.type !== "binary"
    ) {
        return `
            <p style="color:#777;">
                ${t("exercise.unsupportedQuestion")}
            </p>
        `;
    }

    return question.options
        .map(
            (option, index) => `
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
                        transition:all 0.15s;
                        font-weight:500;
                    "
                >
                    ${option}
                </button>
            `
        )
        .join("");
}

/**
 * Renders answer feedback and the action used to continue to the next
 * question.
 *
 * @param correct - Whether the submitted answer was correct.
 * @param question - Question whose explanation should be displayed.
 * @returns Feedback-panel HTML.
 */
function renderExerciseFeedbackView(
    correct: boolean,
    question: ExerciseQuestion
): string {
    const explanation = localizedValue(
        question.explanation,
        question.explanation_fa
    );

    return `
        ${renderExerciseFeedbackMessageView(
            correct,
            explanation
        )}

        <button
            id="next-btn"
            type="button"
            style="
                width:100%;
                margin-top:12px;
                padding:12px;
                font-size:15px;
                font-weight:700;
                border:none;
                border-radius:6px;
                background:#087F5B;
                color:#fff;
                cursor:pointer;
            "
        >
            ${t("common.nextQuestion")}
        </button>
    `;
}

/**
 * Renders the positive or negative answer message.
 *
 * @param correct - Whether the answer was correct.
 * @param explanation - Localized explanation text.
 * @returns Feedback message HTML.
 */
function renderExerciseFeedbackMessageView(
    correct: boolean,
    explanation: string
): string {
    if (correct) {
        return `
            <div style="
                background:#d4edda;
                padding:14px;
                border-radius:6px;
                color:#155724;
                border:1px solid #c3e6cb;
            ">
                <p style="
                    margin:0;
                    font-weight:700;
                    font-size:15px;
                ">
                    ✅ ${t("exercise.correct")}
                </p>

                ${
                    explanation
                        ? `
                            <p
                                class="${localizedTextClass()}"
                                style="
                                    margin:8px 0 0;
                                    font-size:13px;
                                "
                            >
                                ${renderMarkdown(explanation)}
                            </p>
                        `
                        : ""
                }
            </div>
        `;
    }

    return `
        <div style="
            background:#f8d7da;
            padding:14px;
            border-radius:6px;
            color:#721c24;
            border:1px solid #f5c6cb;
        ">
            <p style="
                margin:0;
                font-weight:700;
                font-size:15px;
            ">
                ❌ ${t("exercise.incorrect")}
            </p>

            ${
                explanation
                    ? `
                        <p
                            class="${localizedTextClass()}"
                            style="
                                margin:8px 0 0;
                                font-size:13px;
                            "
                        >
                            ${renderMarkdown(explanation)}
                        </p>
                    `
                    : ""
            }
        </div>
    `;
}

/**
 * Renders the final score page of an exercise.
 *
 * @param correctCount - Number of correctly answered questions.
 * @param totalCount - Total number of questions presented.
 * @returns Complete exercise-result page HTML.
 */
function renderExerciseResultView(
    correctCount: number,
    totalCount: number
): string {
    const percentage = totalCount > 0
        ? Math.round(
            (correctCount / totalCount) * 100
        )
        : 0;

    const result = getExerciseResultPresentation(
        percentage
    );

    return `
        ${renderNavbar()}

        <div style="
            max-width:500px;
            margin:0 auto;
            padding:50px 16px;
            text-align:center;
        ">
            <div style="
                font-size:48px;
                margin-bottom:16px;
            ">
                ${result.emoji}
            </div>

            <h1 style="
                font-size:24px;
                color:#1a1a1a;
                margin-bottom:10px;
            ">
                ${result.message}
            </h1>

            <p style="
                font-size:36px;
                font-weight:800;
                color:#087F5B;
                margin:15px 0;
            ">
                ${correctCount}/${totalCount}
            </p>

            <p style="
                font-size:16px;
                color:#777;
                margin-bottom:30px;
            ">
                ${percentage}%
            </p>

            <button
                id="exercise-return-btn"
                type="button"
                style="
                    width:100%;
                    padding:14px;
                    font-size:15px;
                    font-weight:700;
                    border:none;
                    border-radius:6px;
                    background:#087F5B;
                    color:#fff;
                    cursor:pointer;
                "
            >
                ${t("exercise.returnLesson")}
            </button>
        </div>
    `;
}

/**
 * Resolves the icon and localized message associated with a score.
 *
 * @param percentage - Exercise success percentage.
 * @returns Presentation metadata for the result screen.
 */
function getExerciseResultPresentation(
    percentage: number
): {
    emoji: string;
    message: string;
} {
    if (percentage < 50) {
        return {
            emoji: "💪",
            message: t("common.moreEffort")
        };
    }

    if (percentage < 80) {
        return {
            emoji: "👍",
            message: t("common.good")
        };
    }

    return {
        emoji: "🎉",
        message: t("common.excellent")
    };
}
