import { renderNavbar } from "./navbarView.js";
import {
    localizedTextClass,
    localizedValue,
    t
} from "../../i18n/i18n.js";
import type {
    VocabularyGameKind
} from "../../features/vocabulary/vocabularyGameEngine.js";
import type {
    Level,
    StoryDifficulty,
    VocabPack,
    VocabPackIndex,
    VocabStoryBlank,
    VocabStoryQuestion,
    VocabStoryWithTitle,
    VocabWord
} from "../../types/global.js";

export {
    getVocabScorePresentation,
    renderBlankVocabStoryView,
    renderFlashcardReviewPromptView,
    renderFlashcardView,
    renderLegacyVocabStoryView,
    renderVocabLevelView,
    renderVocabPackUnavailableView,
    renderVocabPackView,
    renderVocabQuizFeedbackView,
    renderVocabQuizQuestionView,
    renderVocabResultView,
    renderVocabularyPageView
};

/**
 * Presentation layer for the Vocabulary feature.
 *
 * This file owns every Vocabulary HTML template:
 * - CEFR level selection
 * - vocabulary pack catalog
 * - pack activity menu
 * - flashcards
 * - weak-word review
 * - stories
 * - fill-in-the-blank stories
 * - comprehension questions
 * - vocabulary quizzes
 * - activity results
 *
 * Loading, persistence, activity state, scoring and event orchestration remain
 * in `src/features/vocabulary/vocabulary.ts`.
 */

type VocabLowScoreMessageKey =
    | "common.moreEffort"
    | "common.morePractice";

/**
 * Returns the best localized title available for a vocabulary pack.
 *
 * @param pack - Vocabulary pack.
 * @returns Localized pack title.
 */
function getVocabPackTitleView(
    pack: VocabPack
): string {
    const frenchTitle =
        pack.title
        || pack.theme
        || pack.id;

    const persianTitle =
        pack.title_fa
        || pack.theme_fa
        || frenchTitle;

    return localizedValue(
        frenchTitle,
        persianTitle,
        pack.id
    );
}

/**
 * Renders the vocabulary CEFR-level selector.
 *
 * Navigation is exposed through `data-level`.
 *
 * @param levels - Available CEFR levels.
 * @returns Complete Vocabulary landing-page HTML.
 */
function renderVocabularyPageView(
    levels: readonly Level[]
): string {
    return `
        ${renderNavbar()}

        <div style="
            max-width:960px;
            margin:0 auto;
            padding:32px 20px 60px;
        ">
            <h1 style="
                font-size:26px;
                font-weight:700;
                color:#1a1a1a;
                margin:0 0 6px;
            ">
                ${t("vocab.title")}
            </h1>

            <p style="
                font-size:15px;
                color:#777;
                margin:0 0 30px;
            ">
                ${t("vocab.chooseLevel")}
            </p>

            <div style="
                display:grid;
                grid-template-columns:
                    repeat(auto-fill,minmax(140px,1fr));
                gap:12px;
            ">
                ${levels
                    .map(
                        level =>
                            renderVocabLevelCardView(
                                level
                            )
                    )
                    .join("")}
            </div>
        </div>
    `;
}

/**
 * Renders one CEFR-level card.
 *
 * @param level - CEFR level.
 * @returns Level-card HTML.
 */
function renderVocabLevelCardView(
    level: Level
): string {
    return `
        <button
            type="button"
            class="vocab-level-card"
            data-level="${level}"
            style="
                width:100%;
                background:#fff;
                border:1px solid #e0e0e0;
                border-radius:8px;
                padding:16px;
                cursor:pointer;
                text-align:inherit;
                font:inherit;
            "
        >
            <div style="
                display:flex;
                align-items:center;
                gap:10px;
                margin-bottom:8px;
            ">
                <span style="font-size:22px;">
                    🎯
                </span>

                <span style="
                    font-size:16px;
                    font-weight:600;
                    color:#1a1a1a;
                ">
                    ${level}
                </span>
            </div>

            <p style="
                margin:0;
                font-size:13px;
                color:#777;
            ">
                ${t("vocab.levelMeta")}
            </p>
        </button>
    `;
}

/**
 * Renders every vocabulary pack available for one level.
 *
 * @param level - Active CEFR level.
 * @param packs - Vocabulary pack index.
 * @returns Complete pack-catalog HTML.
 */
function renderVocabLevelView(
    level: Level,
    packs: VocabPackIndex[]
): string {
    return `
        ${renderNavbar()}

        <div style="
            max-width:960px;
            margin:0 auto;
            padding:32px 20px 60px;
        ">
            <button
                id="vocab-level-back"
                type="button"
                class="back-btn"
            >
                ← ${t("common.back")}
            </button>

            <h1 style="
                font-size:26px;
                font-weight:700;
                color:#1a1a1a;
                margin:0 0 6px;
            ">
                📖 ${level}
            </h1>

            <p style="
                font-size:15px;
                color:#777;
                margin:0 0 30px;
            ">
                ${t("vocab.chooseCategory")}
            </p>

            <div style="
                display:grid;
                grid-template-columns:
                    repeat(auto-fill,minmax(200px,1fr));
                gap:12px;
            ">
                ${packs
                    .map(
                        pack =>
                            renderVocabPackCardView(
                                level,
                                pack
                            )
                    )
                    .join("")}
            </div>
        </div>
    `;
}

/**
 * Renders one vocabulary pack card.
 *
 * @param level - Parent CEFR level.
 * @param pack - Vocabulary pack metadata.
 * @returns Pack-card HTML.
 */
function renderVocabPackCardView(
    level: Level,
    pack: VocabPackIndex
): string {
    const title =
        localizedValue(
            pack.title,
            pack.title_fa
        );

    return `
        <button
            type="button"
            class="vocab-pack-card"
            data-level="${level}"
            data-pack-id="${pack.id}"
            style="
                width:100%;
                background:#fff;
                border:1px solid #e0e0e0;
                border-radius:8px;
                padding:16px;
                cursor:pointer;
                text-align:inherit;
                font:inherit;
            "
        >
            <div style="
                display:flex;
                align-items:center;
                gap:10px;
                margin-bottom:8px;
            ">
                <span style="font-size:22px;">
                    ${pack.icon || "📖"}
                </span>

                <span
                    class="${localizedTextClass()}"
                    style="
                        font-size:16px;
                        font-weight:600;
                        color:#1a1a1a;
                    "
                >
                    ${title}
                </span>
            </div>

            <p style="
                margin:0;
                font-size:13px;
                color:#777;
            ">
                ${pack.words} ${t("common.words")}
            </p>
        </button>
    `;
}

/**
 * Renders the state used when a pack file does not yet exist.
 *
 * @returns Complete unavailable-pack HTML.
 */
function renderVocabPackUnavailableView(): string {
    return `
        ${renderNavbar()}

        <div style="
            max-width:500px;
            margin:0 auto;
            padding:60px 16px;
            text-align:center;
        ">
            <p style="
                font-size:14px;
                color:#777;
            ">
                🚧 ${t("vocab.packSoon")}
            </p>

            <button
                id="vocab-unavailable-back"
                type="button"
                style="
                    margin-top:15px;
                    padding:10px 20px;
                    border:1px solid #ddd;
                    border-radius:6px;
                    background:#fff;
                    color:#1a1a1a;
                    cursor:pointer;
                "
            >
                ${t("common.back")}
            </button>
        </div>
    `;
}

/**
 * Renders one vocabulary pack and its available learning activities.
 *
 * Activity choice is exposed through `.vocab-activity-card` data attributes.
 *
 * @param pack - Active vocabulary pack.
 * @param weakCount - Number of persisted weak words.
 * @param hasSimple - Whether a simple story exists.
 * @param hasLiterary - Whether a literary story exists.
 * @param hasQuiz - Whether an exercise or quiz exists.
 * @param availableGames - Mini-games supported by this pack's words.
 * @returns Complete pack page HTML.
 */
function renderVocabPackView(
    pack: VocabPack,
    weakCount: number,
    hasSimple: boolean,
    hasLiterary: boolean,
    hasQuiz: boolean,
    availableGames: readonly VocabularyGameKind[]
): string {
    const title =
        getVocabPackTitleView(
            pack
        );

    return `
        ${renderNavbar()}

        <div style="
            max-width:960px;
            margin:0 auto;
            padding:32px 20px 60px;
        ">
            <button
                id="vocab-pack-back"
                type="button"
                class="back-btn"
            >
                ← ${t("common.back")}
            </button>

            <div style="
                display:flex;
                align-items:center;
                gap:12px;
                margin-bottom:30px;
            ">
                <span style="
                    font-size:36px;
                    flex-shrink:0;
                ">
                    ${pack.icon || "📖"}
                </span>

                <div>
                    <h1
                        class="${localizedTextClass()}"
                        style="
                            font-size:24px;
                            font-weight:700;
                            color:#1a1a1a;
                            margin:0;
                        "
                    >
                        ${title}
                    </h1>

                    <p style="
                        font-size:13px;
                        color:#777;
                        margin:4px 0 0;
                    ">
                        ${pack.level}
                        ·
                        ${pack.words.length}
                        ${t("common.words")}
                    </p>
                </div>
            </div>

            <div style="
                display:grid;
                grid-template-columns:
                    repeat(auto-fill,minmax(200px,1fr));
                gap:12px;
            ">
                ${renderVocabActivityCardView(
                    "🃏",
                    t("vocab.flashcards"),
                    `${pack.words.length} ${t("common.words")}`,
                    "flashcards"
                )}

                ${availableGames.includes("hangman")
                    ? renderVocabActivityCardView(
                        "🦖",
                        t("vocab.game.hangman"),
                        t("vocab.game.hangmanMeta"),
                        "hangman"
                    )
                    : ""
                }

                ${availableGames.includes("word-search")
                    ? renderVocabActivityCardView(
                        "🔎",
                        t("vocab.game.wordSearch"),
                        t("vocab.game.wordSearchMeta"),
                        "word-search"
                    )
                    : ""
                }

                ${availableGames.includes("crossword")
                    ? renderVocabActivityCardView(
                        "✏️",
                        t("vocab.game.crossword"),
                        t("vocab.game.crosswordMeta"),
                        "crossword"
                    )
                    : ""
                }

                ${
                    hasSimple
                        ? renderVocabActivityCardView(
                            "🌱",
                            t("vocab.simpleStory"),
                            t("vocab.simpleStoryMeta"),
                            "story",
                            "simple"
                        )
                        : ""
                }

                ${
                    hasLiterary
                        ? renderVocabActivityCardView(
                            "🌳",
                            t("vocab.literaryStory"),
                            t("vocab.literaryStoryMeta"),
                            "story",
                            "literary"
                        )
                        : ""
                }

                ${
                    hasQuiz
                        ? renderVocabActivityCardView(
                            "📝",
                            t("vocab.quiz"),
                            t("vocab.quizMeta"),
                            "exercise"
                        )
                        : ""
                }

                ${
                    weakCount > 0
                        ? renderVocabActivityCardView(
                            "🔁",
                            t("vocab.weakWords"),
                            `${weakCount} ${t("common.words")}`,
                            "flashcards",
                            undefined,
                            true
                        )
                        : ""
                }
            </div>
        </div>
    `;
}

/**
 * Renders one pack activity card.
 *
 * @param icon - Activity icon.
 * @param title - Localized title.
 * @param meta - Secondary text.
 * @param action - Controller action identifier.
 * @param difficulty - Optional story difficulty.
 * @param reviewMode - Whether flashcards should use weak-word review mode.
 * @returns Activity-card HTML.
 */
function renderVocabActivityCardView(
    icon: string,
    title: string,
    meta: string,
    action:
        | "flashcards"
        | "story"
        | "exercise"
        | VocabularyGameKind,
    difficulty?: StoryDifficulty,
    reviewMode = false
): string {
    return `
        <button
            type="button"
            class="vocab-activity-card"
            data-action="${action}"
            ${
                difficulty
                    ? `data-difficulty="${difficulty}"`
                    : ""
            }
            data-review-mode="${reviewMode ? "true" : "false"}"
            style="
                width:100%;
                background:#fff;
                border:1px solid #e0e0e0;
                border-radius:8px;
                padding:16px;
                cursor:pointer;
                text-align:inherit;
                font:inherit;
            "
        >
            <div style="
                display:flex;
                align-items:center;
                gap:10px;
                margin-bottom:8px;
            ">
                <span style="font-size:22px;">
                    ${icon}
                </span>

                <span style="
                    font-size:16px;
                    font-weight:600;
                    color:#1a1a1a;
                ">
                    ${title}
                </span>
            </div>

            <p style="
                margin:0;
                font-size:13px;
                color:#777;
            ">
                ${meta}
            </p>
        </button>
    `;
}

/**
 * Renders one flashcard.
 *
 * @param pack - Active pack.
 * @param word - Current vocabulary word.
 * @param index - Zero-based card index.
 * @param total - Number of cards in the deck.
 * @returns Complete flashcard page HTML.
 */
function renderFlashcardView(
    pack: VocabPack,
    word: VocabWord,
    index: number,
    total: number
): string {
    const progress =
        total > 0
            ? (index / total) * 100
            : 0;

    return `
        ${renderNavbar()}

        <div style="
            max-width:560px;
            margin:0 auto;
            padding:32px 16px 60px;
        ">
            <div style="
                display:flex;
                justify-content:space-between;
                align-items:center;
                margin-bottom:16px;
            ">
                <button
                    id="vocab-flashcard-back"
                    type="button"
                    class="back-btn"
                    style="margin:0;"
                >
                    ← ${t("common.back")}
                </button>

                <span style="
                    font-size:14px;
                    color:#777;
                ">
                    ${index + 1} / ${total}
                </span>
            </div>

            <div style="
                background:#e0e0e0;
                height:4px;
                border-radius:2px;
                margin-bottom:24px;
                overflow:hidden;
            ">
                <div style="
                    background:#087F5B;
                    height:100%;
                    width:${progress}%;
                "></div>
            </div>

            <div
                id="flashcard"
                style="
                    background:#fff;
                    border:1px solid #e0e0e0;
                    border-radius:10px;
                    min-height:340px;
                    display:flex;
                    flex-direction:column;
                    align-items:center;
                    justify-content:center;
                    cursor:pointer;
                    padding:28px;
                    text-align:center;
                    box-shadow:0 2px 8px rgba(0,0,0,0.05);
                "
            >
                ${renderFlashcardMediaView(word)}

                <p
                    class="ltr-lock"
                    style="
                        font-size:30px;
                        font-weight:700;
                        color:#1a1a1a;
                        margin:0 0 10px;
                    "
                >
                    ${word.fr}
                </p>

                <div
                    id="card-back"
                    style="
                        display:none;
                        width:100%;
                    "
                >
                    <p
                        class="persian-text"
                        style="
                            font-size:20px;
                            color:#087F5B;
                            font-weight:600;
                            margin:0 0 14px;
                        "
                    >
                        ${word.fa}
                    </p>

                    ${
                        word.ex
                            ? `
                                <p
                                    class="ltr-lock"
                                    style="
                                        font-size:15px;
                                        color:#333;
                                        margin:0 0 6px;
                                        font-style:italic;
                                    "
                                >
                                    ${word.ex}
                                </p>
                            `
                            : ""
                    }

                    ${
                        word.ex_fa
                            ? `
                                <p
                                    class="persian-text"
                                    style="
                                        font-size:13px;
                                        color:#777;
                                        margin:0;
                                    "
                                >
                                    ${word.ex_fa}
                                </p>
                            `
                            : ""
                    }
                </div>

                <p
                    id="card-hint"
                    style="
                        font-size:12px;
                        color:#aaa;
                        margin:18px 0 0;
                    "
                >
                    ${t("vocab.cardHint")}
                </p>
            </div>

            <div
                id="card-buttons"
                style="
                    display:none;
                    gap:10px;
                    margin-top:16px;
                "
            >
                <button
                    id="btn-unknown"
                    type="button"
                    style="
                        flex:1;
                        padding:14px;
                        font-size:15px;
                        font-weight:600;
                        border:1px solid #dc2626;
                        border-radius:6px;
                        background:#fff;
                        color:#dc2626;
                        cursor:pointer;
                    "
                >
                    ❌ ${t("vocab.unknown")}
                </button>

                <button
                    id="btn-known"
                    type="button"
                    style="
                        flex:1;
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
                    ✅ ${t("vocab.known")}
                </button>
            </div>

            <p style="
                font-size:12px;
                color:#999;
                text-align:center;
                margin:12px 0 0;
            ">
                ${t("vocab.weakWordsNote")}
            </p>
        </div>
    `;
}

/**
 * Renders optional flashcard media.
 *
 * @param word - Vocabulary word.
 * @returns Image, emoji, or empty HTML.
 */
function renderFlashcardMediaView(
    word: VocabWord
): string {
    if (word.img) {
        return `
            <img
                src="${word.img}"
                alt=""
                style="
                    width:100%;
                    max-height:160px;
                    object-fit:cover;
                    border-radius:8px;
                    margin-bottom:14px;
                "
            >
        `;
    }

    if (word.emoji) {
        return `
            <div style="
                font-size:52px;
                margin-bottom:10px;
            ">
                ${word.emoji}
            </div>
        `;
    }

    return "";
}

/**
 * Renders the prompt shown before reviewing unknown flashcards.
 *
 * @param retryCount - Number of unknown words.
 * @returns Review prompt HTML.
 */
function renderFlashcardReviewPromptView(
    retryCount: number
): string {
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
                🔁
            </div>

            <h1 style="
                font-size:22px;
                color:#1a1a1a;
                margin-bottom:10px;
            ">
                ${t(
                    "vocab.unknownCount",
                    {
                        count: retryCount
                    }
                )}
            </h1>

            <p style="
                font-size:15px;
                color:#777;
                margin-bottom:30px;
            ">
                ${t("vocab.reviewNow")}
            </p>

            <button
                id="btn-review"
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
                    margin-bottom:10px;
                "
            >
                🔁 ${t("vocab.review")}
            </button>

            <button
                id="btn-stop"
                type="button"
                style="
                    width:100%;
                    padding:14px;
                    font-size:15px;
                    font-weight:600;
                    border:1px solid #ddd;
                    border-radius:6px;
                    background:#fff;
                    color:#1a1a1a;
                    cursor:pointer;
                "
            >
                ${t("common.finish")}
            </button>
        </div>
    `;
}

/**
 * Resolves score presentation metadata.
 *
 * @param percentage - Activity score percentage.
 * @param lowScoreKey - Translation used below 50%.
 * @returns Score presentation.
 */
function getVocabScorePresentation(
    percentage: number,
    lowScoreKey: VocabLowScoreMessageKey =
        "common.morePractice"
): {
    emoji: string;
    message: string;
} {
    if (percentage < 50) {
        return {
            emoji: "💪",
            message: t(lowScoreKey)
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

/**
 * Renders a generic Vocabulary activity result.
 *
 * The controller binds retry and return actions.
 *
 * @param correctCount - Correct/known item count.
 * @param totalCount - Total item count.
 * @param percentage - Score percentage.
 * @param lowScoreKey - Low-score message.
 * @returns Complete result HTML.
 */
function renderVocabResultView(
    correctCount: number,
    totalCount: number,
    percentage: number,
    lowScoreKey: VocabLowScoreMessageKey =
        "common.morePractice"
): string {
    const presentation =
        getVocabScorePresentation(
            percentage,
            lowScoreKey
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
                ${presentation.emoji}
            </div>

            <h1 style="
                font-size:24px;
                color:#1a1a1a;
                margin-bottom:10px;
            ">
                ${presentation.message}
            </h1>

            <p style="
                font-size:16px;
                color:#777;
                margin-bottom:30px;
            ">
                ${correctCount} / ${totalCount}
                (${percentage}%)
            </p>

            <button
                id="vocab-result-retry"
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
                    margin-bottom:10px;
                "
            >
                🔄 ${t("common.retry")}
            </button>

            <button
                id="vocab-result-back"
                type="button"
                style="
                    width:100%;
                    padding:14px;
                    font-size:15px;
                    font-weight:600;
                    border:1px solid #ddd;
                    border-radius:6px;
                    background:#fff;
                    color:#1a1a1a;
                    cursor:pointer;
                "
            >
                ${t("common.back")}
            </button>
        </div>
    `;
}

/**
 * Renders the shared header of a Vocabulary story.
 *
 * @param pack - Active pack.
 * @param story - Story data.
 * @param difficulty - Story difficulty.
 * @returns Story header HTML.
 */
function renderVocabStoryHeaderView(
    pack: VocabPack,
    story: VocabStoryWithTitle,
    difficulty: StoryDifficulty
): string {
    const simple =
        difficulty === "simple"
        || difficulty === "easy";

    const hasTranslation =
        Boolean(
            story.text_fa
            || story.paragraphs?.some(
                paragraph =>
                    Boolean(paragraph.fa)
            )
        );

    return `
        ${renderNavbar()}

        <div style="
            max-width:700px;
            margin:0 auto;
            padding:32px 20px 60px;
        ">
            <button
                id="vocab-story-back"
                type="button"
                class="back-btn"
            >
                ← ${t("common.back")}
            </button>

            <p style="
                font-size:12px;
                color:#777;
                text-transform:uppercase;
                letter-spacing:1px;
                margin:0 0 6px;
            ">
                ${simple ? "🌱" : "🌳"}
            </p>

            <h1
                class="ltr-lock"
                style="
                    font-size:24px;
                    font-weight:700;
                    color:#1a1a1a;
                    margin:0 0 4px;
                "
            >
                ${story.title}
            </h1>

            ${
                story.title_fa
                    ? `
                        <p
                            class="persian-text"
                            style="
                                font-size:15px;
                                color:#777;
                                margin:0 0 20px;
                            "
                        >
                            ${story.title_fa}
                        </p>
                    `
                    : ""
            }

            ${
                hasTranslation
                    ? `
                        <button
                            id="story-translation-toggle"
                            type="button"
                            style="
                                width:auto;
                                padding:8px 16px;
                                font-size:13px;
                                font-weight:600;
                                border:1px solid #ddd;
                                border-radius:6px;
                                background:#fff;
                                color:#1a1a1a;
                                cursor:pointer;
                                margin-bottom:20px;
                            "
                        >
                            👁️ ${t("vocab.toggleTranslation")}
                        </button>
                    `
                    : ""
            }
    `;
}

/**
 * Renders a legacy paragraph-based story.
 *
 * @param pack - Active pack.
 * @param story - Story data.
 * @param difficulty - Story difficulty.
 * @returns Complete legacy-story HTML.
 */
function renderLegacyVocabStoryView(
    pack: VocabPack,
    story: VocabStoryWithTitle,
    difficulty: StoryDifficulty
): string {
    return `
        ${renderVocabStoryHeaderView(
            pack,
            story,
            difficulty
        )}

            <div style="
                background:#fff;
                border:1px solid #e0e0e0;
                border-radius:8px;
                padding:24px;
                margin-bottom:24px;
            ">
                ${(story.paragraphs ?? [])
                    .map(
                        paragraph => `
                            <div style="
                                margin-bottom:18px;
                                padding-bottom:18px;
                                border-bottom:1px solid #f0f0f0;
                            ">
                                <p
                                    class="ltr-lock"
                                    style="
                                        font-size:16px;
                                        line-height:1.8;
                                        color:#1a1a1a;
                                        margin:0 0 8px;
                                    "
                                >
                                    ${paragraph.fr}
                                </p>

                                <p
                                    class="story-tr persian-text"
                                    style="
                                        font-size:14px;
                                        color:#777;
                                        margin:0;
                                    "
                                >
                                    ${paragraph.fa}
                                </p>
                            </div>
                        `
                    )
                    .join("")}
            </div>

            ${
                story.keyWords?.length
                    ? renderVocabStoryKeywordsView(
                        story.keyWords
                    )
                    : ""
            }

            ${
                story.questions?.length
                    ? renderVocabStoryQuestionsView(
                        story.questions
                    )
                    : ""
            }
        </div>
    `;
}

/**
 * Renders the story keyword list.
 *
 * @param words - Story keywords.
 * @returns Keyword block HTML.
 */
function renderVocabStoryKeywordsView(
    words: string[]
): string {
    return `
        <h2 style="
            font-size:17px;
            font-weight:700;
            color:#1a1a1a;
            margin:0 0 10px;
        ">
            🔑 ${t("vocab.keywords")}
        </h2>

        <div style="
            display:flex;
            flex-wrap:wrap;
            gap:8px;
            margin-bottom:24px;
        ">
            ${words
                .map(
                    word => `
                        <span
                            class="ltr-lock"
                            style="
                                background:#e8f5f0;
                                color:#087F5B;
                                padding:6px 12px;
                                border-radius:20px;
                                font-size:13px;
                                font-weight:600;
                            "
                        >
                            ${word}
                        </span>
                    `
                )
                .join("")}
        </div>
    `;
}

/**
 * Renders legacy story comprehension questions.
 *
 * @param questions - Story questions.
 * @returns Comprehension block HTML.
 */
function renderVocabStoryQuestionsView(
    questions: VocabStoryQuestion[]
): string {
    return `
        <h2 style="
            font-size:17px;
            font-weight:700;
            color:#1a1a1a;
            margin:0 0 14px;
        ">
            ❓ ${t("vocab.comprehension")}
        </h2>

        ${questions
            .map(
                (
                    question,
                    questionIndex
                ) => `
                    <div style="
                        background:#fff;
                        border:1px solid #e0e0e0;
                        border-radius:8px;
                        padding:18px;
                        margin-bottom:12px;
                    ">
                        <p
                            class="ltr-lock"
                            style="
                                font-size:15px;
                                font-weight:600;
                                color:#1a1a1a;
                                margin:0 0 12px;
                            "
                        >
                            ${question.question}
                        </p>

                        <div style="
                            display:flex;
                            flex-direction:column;
                            gap:8px;
                        ">
                            ${question.options
                                .map(
                                    (
                                        option,
                                        optionIndex
                                    ) => `
                                        <button
                                            type="button"
                                            class="story-q ltr-lock"
                                            data-q="${questionIndex}"
                                            data-o="${optionIndex}"
                                            style="
                                                width:100%;
                                                padding:12px;
                                                font-size:14px;
                                                border:1px solid #e0e0e0;
                                                border-radius:6px;
                                                background:#fafafa;
                                                color:#1a1a1a;
                                                cursor:pointer;
                                                text-align:left;
                                            "
                                        >
                                            ${option}
                                        </button>
                                    `
                                )
                                .join("")}
                        </div>
                    </div>
                `
            )
            .join("")}
    `;
}

/**
 * Renders a fill-in-the-blank story.
 *
 * @param pack - Active vocabulary pack.
 * @param story - Story data.
 * @param difficulty - Story difficulty.
 * @param blanks - Blanks sorted in display order.
 * @returns Complete blank-story HTML.
 */
function renderBlankVocabStoryView(
    pack: VocabPack,
    story: VocabStoryWithTitle,
    difficulty: StoryDifficulty,
    blanks: VocabStoryBlank[]
): string {
    return `
        ${renderVocabStoryHeaderView(
            pack,
            story,
            difficulty
        )}

            <p style="
                font-size:13px;
                color:#777;
                margin-bottom:16px;
            ">
                ${t("vocab.fillBlanks")}
            </p>

            ${renderBlankVocabStoryTextView(
                story.text || ""
            )}

            <div id="blanks-container">
                ${blanks
                    .map(
                        (
                            blank,
                            index
                        ) =>
                            renderBlankVocabQuestionView(
                                blank,
                                index
                            )
                    )
                    .join("")}
            </div>

            <button
                id="check-blanks"
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
                    margin-top:16px;
                "
            >
                ${t("vocab.checkAnswers")}
            </button>

            ${
                story.text_fa
                    ? `
                        <div
                            class="story-tr"
                            style="
                                display:none;
                                background:#f0f9ff;
                                border:1px solid #087F5B;
                                border-radius:8px;
                                padding:20px;
                                margin-top:20px;
                            "
                        >
                            <h3 style="
                                font-size:16px;
                                font-weight:700;
                                color:#087F5B;
                                margin:0 0 12px;
                            ">
                                📖 ${t("vocab.storyTranslation")}
                            </h3>

                            <p
                                class="persian-text"
                                style="
                                    font-size:15px;
                                    line-height:1.8;
                                    color:#333;
                                    margin:0;
                                "
                            >
                                ${story.text_fa}
                            </p>
                        </div>
                    `
                    : ""
            }
        </div>
    `;
}

/**
 * Replaces story placeholders with interactive blank buttons.
 *
 * @param text - Story source text.
 * @returns Story text HTML.
 */
function renderBlankVocabStoryTextView(
    text: string
): string {
    const parts =
        text.split(
            /{{BLANK_\d+}}/
        );

    const placeholders =
        text.match(
            /{{BLANK_\d+}}/g
        ) ?? [];

    return `
        <div
            class="ltr-lock"
            style="
                background:#fff;
                border:1px solid #e0e0e0;
                border-radius:8px;
                padding:24px;
                margin-bottom:24px;
                line-height:2;
            "
        >
            ${parts
                .map(
                    (
                        part,
                        index
                    ) => `
                        ${part}
                        ${
                            index < placeholders.length
                                ? `
                                    <button
                                        type="button"
                                        class="blank-btn"
                                        data-blank="${index}"
                                        style="
                                            display:inline-block;
                                            min-width:100px;
                                            padding:4px 12px;
                                            margin:2px 4px;
                                            font-size:14px;
                                            font-weight:600;
                                            border:2px dashed #087F5B;
                                            border-radius:6px;
                                            background:#e8f5f0;
                                            color:#087F5B;
                                            cursor:pointer;
                                            vertical-align:middle;
                                        "
                                    >
                                        ___
                                    </button>
                                `
                                : ""
                        }
                    `
                )
                .join("")}
        </div>
    `;
}

/**
 * Renders one fill-in-the-blank choice block.
 *
 * @param blank - Blank data.
 * @param index - Display index.
 * @returns Blank-question HTML.
 */
function renderBlankVocabQuestionView(
    blank: VocabStoryBlank,
    index: number
): string {
    return `
        <div
            class="blank-question"
            data-idx="${index}"
            style="
                background:#fff;
                border:1px solid #e0e0e0;
                border-radius:8px;
                padding:16px;
                margin-bottom:12px;
            "
        >
            <p style="
                font-size:14px;
                font-weight:600;
                color:#1a1a1a;
                margin:0 0 10px;
            ">
                ${index + 1}. ___
            </p>

            <div style="
                display:grid;
                grid-template-columns:1fr 1fr;
                gap:8px;
            ">
                ${blank.options
                    .map(
                        (
                            option,
                            optionIndex
                        ) => `
                            <button
                                type="button"
                                class="blank-opt ltr-lock"
                                data-idx="${index}"
                                data-oi="${optionIndex}"
                                style="
                                    padding:10px;
                                    font-size:14px;
                                    border:1px solid #e0e0e0;
                                    border-radius:6px;
                                    background:#fafafa;
                                    color:#1a1a1a;
                                    cursor:pointer;
                                    text-align:center;
                                "
                            >
                                ${option}
                            </button>
                        `
                    )
                    .join("")}
            </div>
        </div>
    `;
}

/**
 * Renders one Vocabulary quiz question.
 *
 * @param question - Question text.
 * @param options - Prepared/shuffled answer options.
 * @param questionIndex - Zero-based question index.
 * @param totalQuestions - Total question count.
 * @returns Complete quiz-question HTML.
 */
function renderVocabQuizQuestionView(
    question: string,
    options: string[],
    questionIndex: number,
    totalQuestions: number
): string {
    return `
        ${renderNavbar()}

        <div style="
            max-width:560px;
            margin:0 auto;
            padding:32px 16px 60px;
        ">
            <button
                id="vocab-quiz-back"
                type="button"
                class="back-btn"
            >
                ← ${t("common.back")}
            </button>

            <span style="
                font-size:13px;
                color:#777;
            ">
                ${questionIndex + 1}
                /
                ${totalQuestions}
            </span>

            <p
                class="ltr-lock"
                style="
                    font-size:17px;
                    font-weight:600;
                    color:#1a1a1a;
                    margin:16px 0 20px;
                "
            >
                ${question}
            </p>

            <div style="
                display:flex;
                flex-direction:column;
                gap:10px;
            ">
                ${options
                    .map(
                        (
                            option,
                            index
                        ) => `
                            <button
                                type="button"
                                class="vq ltr-lock"
                                data-o="${index}"
                                style="
                                    width:100%;
                                    padding:13px;
                                    font-size:15px;
                                    border:1px solid #e0e0e0;
                                    border-radius:6px;
                                    background:#fafafa;
                                    color:#1a1a1a;
                                    cursor:pointer;
                                    text-align:left;
                                "
                            >
                                ${option}
                            </button>
                        `
                    )
                    .join("")}
            </div>

            <div
                id="vfb"
                style="margin-top:16px;"
            ></div>
        </div>
    `;
}

/**
 * Renders Vocabulary quiz feedback after one answer.
 *
 * @param explanation - Optional learning explanation.
 * @returns Feedback HTML.
 */
function renderVocabQuizFeedbackView(
    explanation: string
): string {
    return `
        ${
            explanation
                ? `
                    <p
                        class="${localizedTextClass()}"
                        style="
                            font-size:13px;
                            color:#666;
                            margin:0 0 12px;
                        "
                    >
                        ${explanation}
                    </p>
                `
                : ""
        }

        <button
            id="vnext"
            type="button"
            style="
                width:100%;
                padding:13px;
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
