// ===============================
// ✈️ Travel renderers
// ===============================

function renderTravelSection(section, lang) {
    switch (section?.type) {
        case "vocab":
            return renderTravelVocab(section);

        case "tips":
            return renderTravelTips(section, lang);

        case "lesson":
            return renderTravelLessonContent(section, lang);

        default:
            return `
                <p style="color:#777;">
                    ${
                        lang === "fa"
                            ? "این نوع محتوا پشتیبانی نمی‌شود."
                            : `Type de contenu non supporté : ${section?.type || "inconnu"}`
                    }
                </p>
            `;
    }
}


// ===============================
// Vocabulaire
// ===============================

function renderTravelVocab(section) {
    const words = section.words || [];

    if (words.length === 0) {
        return "";
    }

    let html = `
        <div
            style="
                display:grid;
                grid-template-columns:repeat(auto-fill,minmax(280px,1fr));
                gap:12px;
            "
        >
    `;

    words.forEach(word => {
        html += `
            <div
                style="
                    background:#fff;
                    border:1px solid #e0e0e0;
                    border-radius:8px;
                    padding:16px;
                "
            >
                <div
                    style="
                        display:flex;
                        align-items:start;
                        gap:12px;
                    "
                >
                    <span style="font-size:32px;">
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
                            ${renderMarkdown(word.fr || "")}
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
        `;
    });

    html += `</div>`;

    return html;
}


// ===============================
// Conseils / tips
// ===============================

function renderTravelTips(section, lang) {
    const tips = section.tips || [];

    if (tips.length === 0) {
        return "";
    }

    let html = "";

    tips.forEach((tip, index) => {
        const title =
            lang === "fa"
                ? tip.title_fa || tip.title_fr || ""
                : tip.title_fr || tip.title_fa || "";

        const content =
            lang === "fa"
                ? tip.content_fa || tip.content_fr || ""
                : tip.content_fr || tip.content_fa || "";

        html += `
            <div
                style="
                    background:#fffbeb;
                    border:1px solid #fde68a;
                    border-radius:8px;
                    padding:18px;
                    margin:10px 0;
                "
            >
                <h3
                    style="
                        margin:0 0 10px;
                        font-size:16px;
                    "
                >
                    ${tip.icon || "💡"}
                    ${
                        title ||
                        (
                            lang === "fa"
                                ? `نکته ${index + 1}`
                                : `Conseil ${index + 1}`
                        )
                    }
                </h3>

                <div
                    class="${lang === "fa" ? "persian-text" : "ltr-lock"}"
                    style="
                        line-height:1.7;
                        color:#444;
                    "
                >
                    ${renderMarkdown(content)}
                </div>
            </div>
        `;
    });

    return html;
}


// ===============================
// Leçon classique
// ===============================

function renderTravelLessonContent(section, lang) {
    let html = "";

    if (section.content) {
        html += `
            <div
                class="${lang === "fa" ? "persian-text" : "ltr-lock"}"
                style="
                    font-size:15px;
                    line-height:1.8;
                    margin-bottom:20px;
                    color:#333;
                "
            >
                ${renderMarkdown(section.content)}
            </div>
        `;
    }

    if (
        section.table &&
        typeof renderTable === "function"
    ) {
        html += renderTable(section.table);
    }

    if (
        section.table2 &&
        typeof renderTable === "function"
    ) {
        html += renderTable(section.table2);
    }

    if (
        section.examples &&
        section.examples.length > 0
    ) {
        section.examples.forEach(example => {
            html += `
                <div
                    style="
                        background:#fafafa;
                        padding:12px 14px;
                        border-radius:4px;
                        margin:8px 0;
                        border-left:3px solid #087F5B;
                    "
                >
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
                                    ${renderMarkdown(example.fr)}
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
                                    ${renderMarkdown(example.fa)}
                                </p>
                            `
                            : ""
                    }
                </div>
            `;
        });
    }

    const note =
        lang === "fa"
            ? section.note_fa || section.note
            : section.note || section.note_fa;

    if (note) {
        html += `
            <div
                class="${lang === "fa" ? "persian-text" : "ltr-lock"}"
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

    return html;
}