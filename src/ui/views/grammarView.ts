/**
 * Presentation layer for the grammar feature.
 *
 * This file owns grammar HTML generation only. Catalog loading, lesson state,
 * bookmarks, progress persistence and navigation remain in the grammar
 * controller and engines.
 */

/**
 * Returns the localized CEFR level name.
 *
 * @param level - CEFR level.
 * @returns Localized level label.
 */
function getGrammarLevelName(
    level: Level
): string {
    switch (level) {
        case "A1":
            return t("grammar.level.A1");

        case "A2":
            return t("grammar.level.A2");

        case "B1":
            return t("grammar.level.B1");

        case "B2":
            return t("grammar.level.B2");

        case "C1":
            return t("grammar.level.C1");

        case "C2":
            return t("grammar.level.C2");
    }
}

/**
 * Renders the grammar loading state.
 *
 * @returns Complete loading-page HTML.
 */
function renderGrammarLoadingView(): string {
    return `
        ${renderNavbar()}

        <div style="
            text-align:center;
            padding:40px 16px;
        ">
            <p style="
                font-size:14px;
                color:#777;
            ">
                ⏳ ${t("common.loading")}
            </p>
        </div>
    `;
}

/**
 * Renders the grammar catalog for one CEFR level.
 *
 * Lesson cards expose their identifiers through `data-lesson-id`.
 * Navigation handlers are attached by the grammar controller.
 *
 * @param level - Active CEFR level.
 * @param allLessons - Complete grammar catalog for the level.
 * @param recommended - Recommended grammar lessons.
 * @returns Complete grammar catalog HTML.
 */
function renderGrammarCatalogView(
    level: Level,
    allLessons: GrammarLessonIndex[],
    recommended: GrammarLessonIndex[]
): string {
    return `
        ${renderNavbar()}

        <div style="
            max-width:900px;
            margin:0 auto;
            padding:24px 16px 50px;
        ">
            <h1 style="
                font-size:22px;
                font-weight:700;
                color:#1a1a1a;
                margin:0 0 4px;
            ">
                ${t("navbar.grammar")}
            </h1>

            <p style="
                font-size:13px;
                color:#777;
                margin:0 0 30px;
            ">
                ${level} – ${getGrammarLevelName(level)}
            </p>

            ${
                recommended.length > 0
                    ? renderRecommendedGrammarView(
                        recommended.slice(0, 3)
                    )
                    : ""
            }

            ${renderAllGrammarLessonsView(allLessons)}
        </div>
    `;
}

/**
 * Renders the recommended grammar block.
 *
 * @param lessons - Recommended grammar lessons.
 * @returns Recommended-section HTML.
 */
function renderRecommendedGrammarView(
    lessons: GrammarLessonIndex[]
): string {
    return `
        <div style="margin-bottom:35px;">
            ${sectionHeader(
                t("grammar.recommended"),
                "",
                getLanguage()
            )}

            <div
                class="grammar-lesson-grid"
                style="
                    display:grid;
                    grid-template-columns:
                        repeat(auto-fill,minmax(190px,1fr));
                    gap:10px;
                "
            >
                ${lessons
                    .map(
                        lesson =>
                            renderGrammarCatalogCardView(
                                lesson,
                                "🦖"
                            )
                    )
                    .join("")}
            </div>
        </div>
    `;
}

/**
 * Renders the complete grammar lesson catalog.
 *
 * @param lessons - Grammar lessons for the active level.
 * @returns Lesson-catalog HTML.
 */
function renderAllGrammarLessonsView(
    lessons: GrammarLessonIndex[]
): string {
    return `
        <div>
            ${sectionHeader(
                t("grammar.allLessons"),
                "",
                getLanguage()
            )}

            <div
                class="grammar-lesson-grid"
                style="
                    display:grid;
                    grid-template-columns:
                        repeat(auto-fill,minmax(190px,1fr));
                    gap:10px;
                "
            >
                ${lessons
                    .map(
                        lesson =>
                            renderGrammarCatalogCardView(
                                lesson,
                                getStatusIcon(
                                    getLessonStatus(
                                        lesson.id
                                    )
                                )
                            )
                    )
                    .join("")}
            </div>
        </div>
    `;
}

/**
 * Renders one grammar catalog card.
 *
 * @param lesson - Grammar lesson metadata.
 * @param icon - Icon displayed on the card.
 * @returns Grammar-card HTML.
 */
function renderGrammarCatalogCardView(
    lesson: GrammarLessonIndex,
    icon: string
): string {
    const title = localizedValue(
        lesson.title,
        lesson.title_fa
    );

    return `
        <button
            type="button"
            class="grammar-lesson-card"
            data-lesson-id="${lesson.id}"
            style="
                width:100%;
                background:#fff;
                border:1px solid #e0e0e0;
                border-radius:8px;
                padding:16px;
                cursor:pointer;
                transition:border-color 0.15s;
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

                <span
                    class="${localizedTextClass()}"
                    style="
                        font-size:16px;
                        font-weight:600;
                        color:#1a1a1a;
                        line-height:1.3;
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
                ⏱ ${lesson.estimatedTime} min
                ·
                ${lesson.exercises}
                ${t("navbar.exercises")}
            </p>
        </button>
    `;
}

/**
 * Renders the grammar lesson-not-found page.
 *
 * The controller binds the return action to `#grammar-error-back`.
 *
 * @returns Error-page HTML.
 */
function renderGrammarLessonNotFoundView(): string {
    return `
        <div style="
            padding:40px 16px;
            text-align:center;
        ">
            <p style="color:#1a1a1a;">
                ${t("grammar.lessonNotFound")}
            </p>

            <button
                id="grammar-error-back"
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
 * Renders one complete grammar lesson overview.
 *
 * @param lesson - Loaded lesson data.
 * @param lessonId - Grammar lesson identifier.
 * @param fallbackLevel - Active level used when lesson metadata omits it.
 * @param bookmarked - Whether the lesson is currently bookmarked.
 * @param progress - Persisted lesson progress.
 * @returns Complete grammar lesson HTML.
 */
function renderGrammarLessonView(
    lesson: LessonData,
    lessonId: string,
    fallbackLevel: Level,
    bookmarked: boolean,
    progress: LessonProgress
): string {
    const totalSections = lesson.sections.length;

    const completedCount =
        progress.completedSections.length;

    const progressPercent =
        totalSections > 0
            ? (
                completedCount
                / totalSections
            ) * 100
            : 0;

    const title = localizedValue(
        lesson.title,
        lesson.title_fa
    );

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
                align-items:start;
                margin-bottom:6px;
            ">
                <h1
                    class="${localizedTextClass()}"
                    style="
                        font-size:22px;
                        margin:0;
                        font-weight:700;
                        color:#1a1a1a;
                    "
                >
                    ${title}
                </h1>

                <button
                    id="bookmark-btn"
                    type="button"
                    aria-label="Bookmark"
                    style="
                        background:none;
                        border:none;
                        font-size:20px;
                        cursor:pointer;
                        padding:0;
                        margin:0;
                    "
                >
                    ${bookmarked ? "⭐" : "☆"}
                </button>
            </div>

            <p
                class="ltr-lock"
                style="
                    font-size:13px;
                    color:#777;
                    margin:0 0 20px;
                "
            >
                ${lesson.level || fallbackLevel}
                ·
                ${lessonId}
                ·
                ⏱ ${lesson.estimatedTime || 0} min
                ·
                ${totalSections}
                ${t("common.sections")}
            </p>

            ${renderGrammarProgressView(
                completedCount,
                totalSections,
                progressPercent
            )}

            <div id="grammar-sections">
                ${lesson.sections
                    .map(
                        section =>
                            renderGrammarSectionCardView(
                                lessonId,
                                section,
                                progress.completedSections.includes(
                                    section.id
                                )
                            )
                    )
                    .join("")}
            </div>
        </div>
    `;
}

/**
 * Renders the lesson progression bar.
 *
 * @param completedCount - Number of completed sections.
 * @param totalSections - Total number of lesson sections.
 * @param progressPercent - Completion percentage.
 * @returns Progress block HTML.
 */
function renderGrammarProgressView(
    completedCount: number,
    totalSections: number,
    progressPercent: number
): string {
    return `
        <div style="margin-bottom:25px;">
            <div style="
                display:flex;
                justify-content:space-between;
                margin-bottom:6px;
                font-size:12px;
                color:#777;
            ">
                <span>
                    ${t("grammar.progress")}
                </span>

                <span style="
                    font-weight:600;
                    color:#087F5B;
                ">
                    ${completedCount}/${totalSections}
                </span>
            </div>

            <div style="
                background:#e0e0e0;
                height:4px;
                border-radius:2px;
                overflow:hidden;
            ">
                <div style="
                    background:#087F5B;
                    height:100%;
                    width:${progressPercent}%;
                    transition:width 0.3s;
                    border-radius:2px;
                "></div>
            </div>
        </div>
    `;
}

/**
 * Renders one section of a grammar lesson.
 *
 * Navigation is exposed through `data-lesson-id` and `data-section-id`, and
 * wired by the controller after rendering.
 *
 * @param lessonId - Parent lesson identifier.
 * @param section - Lesson section.
 * @param done - Whether the section is completed.
 * @returns Section-card HTML.
 */
function renderGrammarSectionCardView(
    lessonId: string,
    section: LessonSection,
    done: boolean
): string {
    const icon =
        done
            ? "✅"
            : section.type === "lesson"
                ? "📖"
                : section.type === "exercise"
                    ? "✏️"
                    : "🏆";

    const title = localizedValue(
        section.title,
        section.title_fa
    );

    const typeLabel =
        getGrammarSectionTypeLabel(section);

    const borderColor =
        done
            ? "#10b981"
            : "#e0e0e0";

    return `
        <button
            type="button"
            class="grammar-section-card"
            data-lesson-id="${lessonId}"
            data-section-id="${section.id}"
            style="
                width:100%;
                background:#fff;
                border:1px solid ${borderColor};
                border-radius:6px;
                padding:14px 16px;
                margin-bottom:8px;
                display:flex;
                align-items:center;
                gap:12px;
                cursor:pointer;
                transition:border-color 0.15s;
                text-align:inherit;
                font:inherit;
            "
        >
            <span style="
                font-size:20px;
                flex-shrink:0;
            ">
                ${icon}
            </span>

            <div style="flex:1;">
                <p
                    class="${localizedTextClass()}"
                    style="
                        margin:0;
                        font-size:14px;
                        font-weight:600;
                        color:#1a1a1a;
                    "
                >
                    ${title}
                </p>

                <p style="
                    margin:4px 0 0;
                    font-size:12px;
                    color:#777;
                ">
                    ${typeLabel}${
                        done
                            ? t(
                                "grammar.completedSuffix"
                            )
                            : ""
                    }
                </p>
            </div>

            <span style="
                color:#ccc;
                font-size:16px;
            ">
                ›
            </span>
        </button>
    `;
}

/**
 * Returns the localized type label of a grammar section.
 *
 * @param section - Grammar lesson section.
 * @returns Localized section type.
 */
function getGrammarSectionTypeLabel(
    section: LessonSection
): string {
    switch (section.type) {
        case "lesson":
            return t("grammar.type.lesson");

        case "exercise":
            return t("grammar.type.exercise");

        case "quiz":
            return t("grammar.type.quiz");
    }
}

/**
 * Renders a lesson table.
 *
 * @param table - Lesson table data.
 * @returns Table HTML or an empty string when absent.
 */
function renderGrammarTableView(
    table: LessonTable | null | undefined
): string {
    if (!table) {
        return "";
    }

    const headers = table.headers
        .map(
            header => `
                <th style="
                    padding:12px 14px;
                    text-align:left;
                    color:#fff;
                    font-weight:600;
                    font-size:13px;
                ">
                    ${renderMarkdown(header)}
                </th>
            `
        )
        .join("");

    const rows = table.rows
        .map(
            (row, rowIndex) => `
                <tr style="
                    background:${
                        rowIndex % 2 === 0
                            ? "#fff"
                            : "#fafafa"
                    };
                    border-bottom:1px solid #eee;
                ">
                    ${row
                        .map(
                            cell => `
                                <td style="
                                    padding:10px 14px;
                                    color:#333;
                                ">
                                    ${renderMarkdown(cell)}
                                </td>
                            `
                        )
                        .join("")}
                </tr>
            `
        )
        .join("");

    return `
        <div style="
            overflow-x:auto;
            margin:20px 0;
        ">
            <table
                class="ltr-lock"
                style="
                    width:100%;
                    border-collapse:collapse;
                    font-size:14px;
                "
            >
                <thead>
                    <tr style="background:#087F5B;">
                        ${headers}
                    </tr>
                </thead>

                <tbody>
                    ${rows}
                </tbody>
            </table>
        </div>
    `;
}

/**
 * Renders one instructional grammar section.
 *
 * The controller binds navigation and completion to `#back` and
 * `#complete-btn`.
 *
 * @param section - Instructional lesson section.
 * @returns Complete lesson-content HTML.
 */
function renderGrammarLessonContentView(
    section: LessonContentSection
): string {
    const title = localizedValue(
        section.title,
        section.title_fa
    );

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

            <p style="
                font-size:11px;
                color:#777;
                text-transform:uppercase;
                letter-spacing:1px;
                margin:0 0 6px;
            ">
                ${t("grammar.type.lesson")}
            </p>

            <h1
                class="${localizedTextClass()}"
                style="
                    font-size:22px;
                    margin:0 0 20px;
                    font-weight:700;
                    color:#1a1a1a;
                "
            >
                ${title}
            </h1>

            <div style="
                background:#fff;
                border:1px solid #e0e0e0;
                border-radius:6px;
                padding:24px;
                margin-bottom:20px;
            ">
                ${renderGrammarSectionContentView(section)}
            </div>

            <button
                id="complete-btn"
                type="button"
                style="
                    width:100%;
                    padding:14px;
                    font-size:15px;
                    font-weight:700;
                    border:none;
                    border-radius:6px;
                    cursor:pointer;
                    background:#087F5B;
                    color:#fff;
                "
            >
                ✓ ${t("common.continue")}
            </button>
        </div>
    `;
}

/**
 * Renders the inner educational content of an instructional section.
 *
 * @param section - Instructional section.
 * @returns Lesson body HTML.
 */
function renderGrammarSectionContentView(
    section: LessonContentSection
): string {
    let html = "";

    if (section.content) {
        html += `
            <div
                class="ltr-lock"
                style="
                    line-height:1.8;
                    color:#333;
                    font-size:15px;
                    margin-bottom:20px;
                "
            >
                ${renderMarkdown(section.content)}
            </div>
        `;
    }

    if (section.table) {
        html += renderGrammarTableView(
            section.table
        );
    }

    if (section.table2) {
        html += renderGrammarSecondTableView(
            section
        );
    }

    if (
        section.examples?.length
        && !section.table2
    ) {
        html += renderGrammarExamplesView(
            section.examples
        );
    }

    if (section.note) {
        html += renderGrammarFrenchNoteView(
            section.note
        );
    }

    if (section.note_fa) {
        html += renderGrammarPersianNoteView(
            section.note_fa
        );
    }

    return html;
}

/**
 * Renders the optional second lesson table and its introduction.
 *
 * @param section - Instructional section containing table2.
 * @returns Secondary table HTML.
 */
function renderGrammarSecondTableView(
    section: LessonContentSection
): string {
    const firstExample =
        section.examples?.[0];

    return `
        ${
            firstExample
                ? `
                    <h3 style="
                        font-size:15px;
                        color:#087F5B;
                        margin:24px 0 6px;
                        font-weight:700;
                    ">
                        ${renderMarkdown(
                            firstExample.fr
                        )}
                    </h3>

                    ${
                        firstExample.fa
                            ? `
                                <p
                                    class="persian-text"
                                    style="
                                        margin:0 0 10px;
                                        font-size:13px;
                                        color:#666;
                                    "
                                >
                                    ${firstExample.fa}
                                </p>
                            `
                            : ""
                    }
                `
                : ""
        }

        ${renderGrammarTableView(
            section.table2
        )}
    `;
}

/**
 * Renders grammar examples.
 *
 * French examples and their Persian learning translations are intentionally
 * shown together because these values are lesson content rather than
 * interface translations.
 *
 * @param examples - Lesson examples.
 * @returns Examples HTML.
 */
function renderGrammarExamplesView(
    examples: LessonExample[]
): string {
    return `
        <h3 style="
            font-size:15px;
            color:#087F5B;
            margin:20px 0 10px;
            font-weight:700;
        ">
            ${t("grammar.examples")}
        </h3>

        ${examples
            .map(
                example => `
                    <div style="
                        background:#fafafa;
                        padding:12px 14px;
                        border-radius:4px;
                        margin:8px 0;
                        border-left:3px solid #087F5B;
                    ">
                        <p
                            class="ltr-lock"
                            style="
                                margin:0;
                                font-weight:600;
                                font-size:15px;
                                color:#1a1a1a;
                            "
                        >
                            ${renderMarkdown(
                                example.fr
                            )}
                        </p>

                        ${
                            example.fa
                                ? `
                                    <p
                                        class="persian-text"
                                        style="
                                            margin:6px 0 0;
                                            font-size:13px;
                                            color:#666;
                                        "
                                    >
                                        ${example.fa}
                                    </p>
                                `
                                : ""
                        }
                    </div>
                `
            )
            .join("")}
    `;
}

/**
 * Renders the French note attached to a grammar section.
 *
 * @param note - French lesson note.
 * @returns Note HTML.
 */
function renderGrammarFrenchNoteView(
    note: string
): string {
    return `
        <div style="
            margin-top:20px;
            padding:14px 16px;
            background:#fffbeb;
            border-radius:4px;
            border-left:3px solid #f59e0b;
            color:#78350f;
            font-size:14px;
            line-height:1.6;
        ">
            <div style="
                display:flex;
                gap:8px;
                align-items:start;
            ">
                <span>💡</span>

                <div class="ltr-lock">
                    ${renderMarkdown(note)}
                </div>
            </div>
        </div>
    `;
}

/**
 * Renders the Persian note attached to a grammar section.
 *
 * @param note - Persian lesson note.
 * @returns Note HTML.
 */
function renderGrammarPersianNoteView(
    note: string
): string {
    return `
        <div
            class="persian-text"
            style="
                margin-top:20px;
                padding:14px 16px;
                background:#fffbeb;
                border-radius:4px;
                border-left:3px solid #f59e0b;
                color:#78350f;
                font-size:14px;
                line-height:1.6;
            "
        >
            <div style="
                display:flex;
                gap:8px;
                align-items:start;
            ">
                <span>💡</span>

                <div>
                    ${note}
                </div>
            </div>
        </div>
    `;
}