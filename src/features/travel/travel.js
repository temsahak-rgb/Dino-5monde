// ===============================
// ✈️ Travel pages & navigation
// ===============================


// ===============================
// Liste des leçons
// ===============================

async function showTravelPage() {
    const lang = localStorage.getItem("language") || "fr";
    const lessons = await loadTravelIndex();

    let html = renderNavbar();

    html += `
        <div style="max-width:960px;margin:0 auto;padding:32px 20px 60px;">
            <h1>
                ✈️ ${
                    lang === "fa"
                        ? `سفر (${lessons.length} درس)`
                        : `Voyage (${lessons.length} leçons)`
                }
            </h1>
    `;

    if (lessons.length === 0) {
        html += `
            <p style="color:#777;">
                ${
                    lang === "fa"
                        ? "هیچ درسی پیدا نشد."
                        : "Aucune leçon trouvée."
                }
            </p>
        `;
    } else {
        html += `
            <div
                style="
                    display:grid;
                    grid-template-columns:repeat(auto-fill,minmax(280px,1fr));
                    gap:15px;
                "
            >
        `;

        lessons.forEach(lesson => {
            const title =
                lang === "fa"
                    ? lesson.title_fa || lesson.title
                    : lesson.title || lesson.title_fa;

            html += `
                <div
                    onclick="showTravelLesson('${lesson.id}')"
                    style="
                        background:#fff;
                        border:1px solid #e0e0e0;
                        border-radius:8px;
                        padding:20px;
                        cursor:pointer;
                    "
                >
                    <div
                        style="
                            display:flex;
                            align-items:center;
                            gap:12px;
                        "
                    >
                        <span style="font-size:36px;">
                            ${lesson.icon || "📝"}
                        </span>

                        <div>
                            <h3 style="margin:0;">
                                ${title}
                            </h3>

                            <p
                                style="
                                    color:#777;
                                    font-size:13px;
                                    margin:5px 0 0;
                                "
                            >
                                ⏱ ${lesson.estimatedTime || 25} min
                            </p>
                        </div>
                    </div>
                </div>
            `;
        });

        html += `</div>`;
    }

    html += `</div>`;

    app.innerHTML = html;
}


// ===============================
// Une leçon
// ===============================

async function showTravelLesson(lessonId) {
    const lang = localStorage.getItem("language") || "fr";

    app.innerHTML =
        renderNavbar() +
        `
            <div style="text-align:center;padding:60px 16px;">
                <p style="font-size:14px;color:#777;">
                    ⏳ ...
                </p>
            </div>
        `;

    const lesson = await loadTravelLesson(lessonId);

    if (!lesson) {
        app.innerHTML =
            renderNavbar() +
            `
                <div style="padding:40px;text-align:center;">
                    <p style="color:#777;">
                        ${
                            lang === "fa"
                                ? "درس پیدا نشد."
                                : "Leçon introuvable."
                        }
                    </p>

                    <button
                        onclick="showTravelPage()"
                        class="back-btn"
                    >
                        ← ${
                            lang === "fa"
                                ? "بازگشت"
                                : "Retour"
                        }
                    </button>
                </div>
            `;

        return;
    }

    const sections = getTravelSections(lesson);

    window.currentTravelLesson = lesson;
    window.currentTravelLessonId = lessonId;

    const title =
        lang === "fa"
            ? lesson.title_fa || lesson.title
            : lesson.title || lesson.title_fa;

    let html = renderNavbar();

    html += `
        <div style="max-width:900px;margin:0 auto;padding:24px 16px 60px;">

            <button
                onclick="showTravelPage()"
                class="back-btn"
            >
                ← ${
                    lang === "fa"
                        ? "بازگشت"
                        : "Retour"
                }
            </button>

            <h1 style="font-size:22px;margin-bottom:6px;">
                ${lesson.icon || "📝"} ${title}
            </h1>

            <p
                style="
                    color:#777;
                    font-size:13px;
                    margin:0 0 25px;
                "
            >
                ${sections.length}
                ${
                    lang === "fa"
                        ? " بخش"
                        : " sections"
                }
            </p>
    `;

    sections.forEach((section, index) => {
        const sectionTitle =
            lang === "fa"
                ? section.title_fa || section.title
                : section.title || section.title_fa;

        const count = getTravelSectionCount(section);
        const icon = getTravelSectionIcon(section);

        html += `
            <div
                onclick="showMiniLesson('${lessonId}', ${index})"
                style="
                    background:#fff;
                    border:1px solid #e0e0e0;
                    border-radius:8px;
                    padding:16px;
                    margin:10px 0;
                    cursor:pointer;
                "
            >
                <span style="font-size:20px;">
                    ${icon}
                </span>

                <b>
                    ${sectionTitle}
                </b>

                <p
                    style="
                        color:#777;
                        font-size:13px;
                        margin:4px 0 0;
                    "
                >
                    ${getTravelSectionLabel(section, lang)}
                    ${count > 0 ? ` · ${count}` : ""}
                </p>
            </div>
        `;
    });

    html += `
            <div id="mini-lesson-content"></div>
        </div>
    `;

    app.innerHTML = html;
}


// ===============================
// Une section
// ===============================

function showMiniLesson(lessonId, sectionIndex) {
    const lang = localStorage.getItem("language") || "fr";

    const lesson = window.currentTravelLesson;

    if (!lesson) {
        showTravelLesson(lessonId);
        return;
    }

    const sections = getTravelSections(lesson);
    const section = sections[sectionIndex];

    if (!section) {
        console.error(
            "Travel section not found:",
            lessonId,
            sectionIndex
        );

        return;
    }

    // Les exercices utilisent le moteur existant.
    if (section.type === "exercise") {
        showExerciseContent(
            lessonId,
            section,
            () => showTravelLesson(lessonId)
        );

        return;
    }

    const title =
        lang === "fa"
            ? section.title_fa || section.title
            : section.title || section.title_fa;

    const content = renderTravelSection(
        section,
        lang
    );

    const container =
        document.getElementById(
            "mini-lesson-content"
        );

    if (!container) {
        return;
    }

    container.innerHTML = `
        <div
            style="
                background:#fff;
                border:2px solid #087F5B;
                border-radius:8px;
                padding:20px;
                margin:20px 0;
            "
        >
            <p
                style="
                    font-size:11px;
                    color:#777;
                    text-transform:uppercase;
                    letter-spacing:1px;
                    margin:0 0 6px;
                "
            >
                ${getTravelSectionLabel(section, lang)}
            </p>

            <h2
                style="
                    color:#087F5B;
                    margin:0 0 20px;
                "
            >
                ${title}
            </h2>

            ${content}

            <button
                onclick="markTravelMiniLessonCompleted('${lessonId}', '${section.id}')"
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
                ${
                    lang === "fa"
                        ? "✓ ادامه"
                        : "✓ Continuer"
                }
            </button>
        </div>
    `;

    container.scrollIntoView({
        behavior: "smooth",
        block: "start"
    });
}


// ===============================
// Completion
// ===============================

function markTravelMiniLessonCompleted(
    lessonId,
    sectionId
) {
    markSectionCompleted(
        lessonId,
        sectionId
    );

    showTravelLesson(lessonId);
}