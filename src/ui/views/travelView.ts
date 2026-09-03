/**
 * Presentation layer for the Travel feature.
 *
 * This file owns every Travel HTML template:
 * - lesson catalog
 * - lesson overview
 * - section cards
 * - vocabulary
 * - tips
 * - lesson content
 * - mini-lesson content
 *
 * Loading, caching, navigation, progress and exercise orchestration remain
 * outside this file.
 */

/**
 * Returns the localized display label for a Travel section type.
 *
 * @param section - Travel section.
 * @returns Localized section type label.
 */
function getTravelSectionTypeLabelView(
    section: TravelSection
): string {
    switch (section.type) {
        case "vocab":
            return t("travel.type.vocab");

        case "tips":
            return t("travel.type.tips");

        case "lesson":
            return t("travel.type.lesson");

        case "exercise":
            return t("travel.type.exercise");
    }
}

/**
 * Returns the localized title of a Travel section.
 *
 * The section type is used as fallback when no explicit title exists.
 *
 * @param section - Travel section.
 * @returns Localized section title.
 */
function getTravelSectionTitleView(
    section: TravelSection
): string {
    return localizedValue(
        section.title,
        section.title_fa,
        getTravelSectionTypeLabelView(section)
    );
}

/**
 * Renders the Travel catalog.
 *
 * Lesson navigation is exposed through `data-lesson-id` and bound by the
 * controller after rendering.
 *
 * @param lessons - Travel lesson index.
 * @returns Complete Travel catalog HTML.
 */
function renderTravelCatalogView(
    lessons: TravelLessonIndex[]
): string {
    return `
        ${renderNavbar()}

        <div style="
            max-width:960px;
            margin:0 auto;
            padding:32px 20px 60px;
        ">
            <h1 style="
                font-size:24px;
                color:#1a1a1a;
                margin:0 0 28px;
            ">
                ✈️ ${t(
                    "travel.catalogTitle",
                    {
                        count: lessons.length
                    }
                )}
            </h1>

            ${
                lessons.length === 0
                    ? renderTravelEmptyCatalogView()
                    : renderTravelLessonGridView(
                        lessons
                    )
            }
        </div>
    `;
}

/**
 * Renders the empty Travel catalog state.
 *
 * @returns Empty-state HTML.
 */
function renderTravelEmptyCatalogView(): string {
    return `
        <p style="
            color:#777;
            font-size:14px;
        ">
            ${t("travel.noLessons")}
        </p>
    `;
}

/**
 * Renders the Travel lesson grid.
 *
 * @param lessons - Travel lessons.
 * @returns Lesson-grid HTML.
 */
function renderTravelLessonGridView(
    lessons: TravelLessonIndex[]
): string {
    return `
        <div
            class="travel-lesson-grid"
            style="
                display:grid;
                grid-template-columns:
                    repeat(auto-fill,minmax(280px,1fr));
                gap:15px;
            "
        >
            ${lessons
                .map(
                    lesson =>
                        renderTravelLessonCardView(
                            lesson
                        )
                )
                .join("")}
        </div>
    `;
}

/**
 * Renders one Travel lesson card.
 *
 * @param lesson - Travel lesson metadata.
 * @returns Lesson-card HTML.
 */
function renderTravelLessonCardView(
    lesson: TravelLessonIndex
): string {
    const title = localizedValue(
        lesson.title,
        lesson.title_fa
    );

    return `
        <button
            type="button"
            class="travel-lesson-card"
            data-lesson-id="${lesson.id}"
            style="
                width:100%;
                background:#fff;
                border:1px solid #e0e0e0;
                border-radius:8px;
                padding:20px;
                cursor:pointer;
                text-align:inherit;
                font:inherit;
                transition:border-color 0.15s;
            "
        >
            <div style="
                display:flex;
                align-items:center;
                gap:12px;
            ">
                <span style="
                    font-size:36px;
                    flex-shrink:0;
                ">
                    ${lesson.icon || "📝"}
                </span>

                <div>
                    <h3
                        class="${localizedTextClass()}"
                        style="
                            margin:0;
                            color:#1a1a1a;
                            font-size:17px;
                        "
                    >
                        ${title}
                    </h3>

                    <p style="
                        color:#777;
                        font-size:13px;
                        margin:5px 0 0;
                    ">
                        ⏱ ${lesson.estimatedTime || 25} min
                    </p>
                </div>
            </div>
        </button>
    `;
}

/**
 * Renders the Travel lesson loading state.
 *
 * @returns Complete loading-page HTML.
 */
function renderTravelLessonLoadingView(): string {
    return `
        ${renderNavbar()}

        <div style="
            text-align:center;
            padding:60px 16px;
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
 * Renders the Travel lesson-not-found state.
 *
 * The controller binds `#travel-error-back`.
 *
 * @returns Complete error-page HTML.
 */
function renderTravelLessonNotFoundView(): string {
    return `
        ${renderNavbar()}

        <div style="
            padding:40px;
            text-align:center;
        ">
            <p style="
                color:#777;
                margin-bottom:15px;
            ">
                ${t("travel.lessonNotFound")}
            </p>

            <button
                id="travel-error-back"
                type="button"
                class="back-btn"
            >
                ← ${t("common.back")}
            </button>
        </div>
    `;
}

/**
 * Renders one Travel lesson and its section cards.
 *
 * Section navigation is exposed through `data-section-index`.
 *
 * @param lesson - Loaded Travel lesson.
 * @param lessonId - Canonical lesson identifier.
 * @param sections - Normalized Travel sections.
 * @returns Complete Travel lesson HTML.
 */
function renderTravelLessonView(
    lesson: TravelLesson,
    lessonId: string,
    sections: TravelSection[]
): string {
    const title = localizedValue(
        lesson.title,
        lesson.title_fa
    );

    return `
        ${renderNavbar()}

        <div style="
            max-width:900px;
            margin:0 auto;
            padding:24px 16px 60px;
        ">
            <button
                id="travel-back"
                type="button"
                class="back-btn"
            >
                ← ${t("common.back")}
            </button>

            <h1
                class="${localizedTextClass()}"
                style="
                    font-size:22px;
                    margin-bottom:6px;
                    color:#1a1a1a;
                "
            >
                ${lesson.icon || "📝"} ${title}
            </h1>

            <p style="
                color:#777;
                font-size:13px;
                margin:0 0 25px;
            ">
                ${t(
                    "travel.sectionsCount",
                    {
                        count: sections.length
                    }
                )}
            </p>

            <div id="travel-sections">
                ${sections
                    .map(
                        (
                            section,
                            index
                        ) =>
                            renderTravelSectionCardView(
                                lessonId,
                                section,
                                index
                            )
                    )
                    .join("")}
            </div>

            <div id="mini-lesson-content"></div>
        </div>
    `;
}

/**
 * Renders one Travel section card.
 *
 * @param lessonId - Parent lesson identifier.
 * @param section - Travel section.
 * @param sectionIndex - Position of the section in the lesson.
 * @returns Travel section-card HTML.
 */
function renderTravelSectionCardView(
    lessonId: string,
    section: TravelSection,
    sectionIndex: number
): string {
    const title =
        getTravelSectionTitleView(
            section
        );

    const count =
        getTravelSectionCount(
            section
        );

    return `
        <button
            type="button"
            class="travel-section-card"
            data-lesson-id="${lessonId}"
            data-section-index="${sectionIndex}"
            style="
                width:100%;
                background:#fff;
                border:1px solid #e0e0e0;
                border-radius:8px;
                padding:16px;
                margin:10px 0;
                cursor:pointer;
                text-align:inherit;
                font:inherit;
                transition:border-color 0.15s;
            "
        >
            <div style="
                display:flex;
                align-items:center;
                gap:10px;
            ">
                <span style="
                    font-size:20px;
                    flex-shrink:0;
                ">
                    ${getTravelSectionIcon(
                        section
                    )}
                </span>

                <strong
                    class="${localizedTextClass()}"
                    style="
                        color:#1a1a1a;
                    "
                >
                    ${title}
                </strong>
            </div>

            <p style="
                color:#777;
                font-size:13px;
                margin:6px 0 0;
            ">
                ${getTravelSectionTypeLabelView(
                    section
                )}
                ${
                    count > 0
                        ? ` · ${count}`
                        : ""
                }
            </p>
        </button>
    `;
}

/**
 * Renders an opened Travel mini-lesson.
 *
 * The controller binds completion to `#travel-complete-btn`.
 *
 * @param section - Travel section to display.
 * @returns Mini-lesson HTML.
 */
function renderTravelMiniLessonView(
    section: TravelSection
): string {
    const title =
        getTravelSectionTitleView(
            section
        );

    return `
        <div style="
            background:#fff;
            border:2px solid #087F5B;
            border-radius:8px;
            padding:20px;
            margin:20px 0;
        ">
            <p style="
                font-size:11px;
                color:#777;
                text-transform:uppercase;
                letter-spacing:1px;
                margin:0 0 6px;
            ">
                ${getTravelSectionTypeLabelView(
                    section
                )}
            </p>

            <h2
                class="${localizedTextClass()}"
                style="
                    color:#087F5B;
                    margin:0 0 20px;
                "
            >
                ${title}
            </h2>

            ${renderTravelSectionView(
                section
            )}

            <button
                id="travel-complete-btn"
                type="button"
                style="
                    width:100%;
                    margin-top:20px;
                    padding:12px;
                    background:#087F5B;
                    color:#fff;
                    border:none;
                    border-radius:6px;
                    cursor:pointer;
                    font-weight:700;
                "
            >
                ✓ ${t("common.continue")}
            </button>
        </div>
    `;
}

/**
 * Delegates a Travel section to its specialized renderer.
 *
 * Exercise sections normally use the shared exercise flow and therefore only
 * expose a fallback message here.
 *
 * @param section - Travel section.
 * @returns Section HTML.
 */
function renderTravelSectionView(
    section: TravelSection
): string {
    switch (section.type) {
        case "vocab":
            return renderTravelVocabView(
                section
            );

        case "tips":
            return renderTravelTipsView(
                section
            );

        case "lesson":
            return renderTravelLessonContentView(
                section
            );

        case "exercise":
            return `
                <p style="color:#777;">
                    ${t(
                        "travel.exerciseOpensSeparately"
                    )}
                </p>
            `;
    }
}

/**
 * Renders a Travel vocabulary grid.
 *
 * Vocabulary remains bilingual educational content and is therefore not moved
 * into the interface translation catalogs.
 *
 * @param section - Vocabulary section.
 * @returns Vocabulary-grid HTML.
 */
function renderTravelVocabView(
    section: TravelVocabSection
): string {
    if (section.words.length === 0) {
        return "";
    }

    return `
        <div style="
            display:grid;
            grid-template-columns:
                repeat(auto-fill,minmax(280px,1fr));
            gap:12px;
        ">
            ${section.words
                .map(
                    word => `
                        <div style="
                            background:#fff;
                            border:1px solid #e0e0e0;
                            border-radius:8px;
                            padding:16px;
                        ">
                            <div style="
                                display:flex;
                                align-items:start;
                                gap:12px;
                            ">
                                <span style="
                                    font-size:32px;
                                    flex-shrink:0;
                                ">
                                    ${word.emoji || "📝"}
                                </span>

                                <div>
                                    <p
                                        class="ltr-lock"
                                        style="
                                            font-size:18px;
                                            font-weight:700;
                                            margin:0 0 4px;
                                        "
                                    >
                                        ${renderMarkdown(
                                            word.fr
                                        )}
                                    </p>

                                    ${
                                        word.phonetic
                                            ? `
                                                <p
                                                    class="persian-text"
                                                    style="
                                                        font-size:13px;
                                                        color:#888;
                                                        margin:0 0 4px;
                                                    "
                                                >
                                                    🔊 ${word.phonetic}
                                                </p>
                                            `
                                            : ""
                                    }

                                    ${
                                        word.fa
                                            ? `
                                                <p
                                                    class="persian-text"
                                                    style="
                                                        font-size:15px;
                                                        color:#555;
                                                        margin:0;
                                                    "
                                                >
                                                    ${word.fa}
                                                </p>
                                            `
                                            : ""
                                    }
                                </div>
                            </div>
                        </div>
                    `
                )
                .join("")}
        </div>
    `;
}

/**
 * Renders localized Travel advice cards.
 *
 * @param section - Travel tips section.
 * @returns Advice-cards HTML.
 */
function renderTravelTipsView(
    section: TravelTipsSection
): string {
    return section.tips
        .map(
            (
                tip,
                index
            ) => {
                const title =
                    localizedValue(
                        tip.title_fr,
                        tip.title_fa,
                        t(
                            "travel.tipFallback",
                            {
                                number:
                                    index + 1
                            }
                        )
                    );

                const content =
                    localizedValue(
                        tip.content_fr,
                        tip.content_fa
                    );

                return `
                    <div style="
                        background:#fffbeb;
                        border:1px solid #fde68a;
                        border-radius:8px;
                        padding:18px;
                        margin:10px 0;
                    ">
                        <h3
                            class="${localizedTextClass()}"
                            style="
                                margin:0 0 10px;
                                font-size:16px;
                            "
                        >
                            ${tip.icon || "💡"}
                            ${title}
                        </h3>

                        <div
                            class="${localizedTextClass()}"
                            style="
                                line-height:1.7;
                                color:#444;
                            "
                        >
                            ${renderMarkdown(
                                content
                            )}
                        </div>
                    </div>
                `;
            }
        )
        .join("");
}

/**
 * Renders a classic Travel lesson section.
 *
 * @param section - Travel lesson-content section.
 * @returns Lesson-content HTML.
 */
function renderTravelLessonContentView(
    section: TravelLessonContentSection
): string {
    let html = "";

    if (section.content) {
        html += `
            <div
                class="${localizedTextClass()}"
                style="
                    font-size:15px;
                    line-height:1.8;
                    margin-bottom:20px;
                    color:#333;
                "
            >
                ${renderMarkdown(
                    section.content
                )}
            </div>
        `;
    }

    if (section.table) {
        html += renderTravelTableView(
            section.table
        );
    }

    if (section.table2) {
        html += renderTravelTableView(
            section.table2
        );
    }

    if (section.examples?.length) {
        html += renderTravelExamplesView(
            section.examples
        );
    }

    const note =
        localizedValue(
            section.note,
            section.note_fa
        );

    if (note) {
        html += renderTravelNoteView(
            note
        );
    }

    return html;
}

/**
 * Renders Travel lesson examples.
 *
 * French and Persian values are displayed together because these are learning
 * data rather than application interface strings.
 *
 * @param examples - Lesson examples.
 * @returns Examples HTML.
 */
function renderTravelExamplesView(
    examples: LessonExample[]
): string {
    return examples
        .map(
            example => `
                <div style="
                    background:#fafafa;
                    padding:12px 14px;
                    border-radius:4px;
                    margin:8px 0;
                    border-left:3px solid #087F5B;
                ">
                    ${
                        example.fr
                            ? `
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
                            `
                            : ""
                    }

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
                                    ${renderMarkdown(
                                        example.fa
                                    )}
                                </p>
                            `
                            : ""
                    }
                </div>
            `
        )
        .join("");
}

/**
 * Renders the localized note of a Travel lesson.
 *
 * @param note - Localized note.
 * @returns Note HTML.
 */
function renderTravelNoteView(
    note: string
): string {
    return `
        <div
            class="${localizedTextClass()}"
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
            💡 ${renderMarkdown(note)}
        </div>
    `;
}

/**
 * Renders a Travel lesson table.
 *
 * This intentionally stays in the Travel view for now so the view does not
 * depend on the Grammar controller or its historical `renderTable()` helper.
 *
 * A later shared-view extraction can centralize identical lesson-table
 * presentation without coupling features together.
 *
 * @param table - Lesson table.
 * @returns Table HTML.
 */
function renderTravelTableView(
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
            (
                row,
                index
            ) => `
                <tr style="
                    background:${
                        index % 2 === 0
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
                                    ${renderMarkdown(
                                        cell
                                    )}
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
                    <tr style="
                        background:#087F5B;
                    ">
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