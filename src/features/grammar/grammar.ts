/**
 * Grammar catalog, lesson detail, table, and lesson-section rendering.
 */

const levelNames: Record<Level, string> = {
    A1: "Débutant",
    A2: "Élémentaire",
    B1: "Intermédiaire",
    B2: "Avancé",
    C1: "Autonome",
    C2: "Maîtrise"
};

/** Displays the grammar catalog for the user's current CEFR level. */
async function showGrammarPage(): Promise<void> {
    const lang = getLanguage();
    const t = texts[lang];
    const level = getPlacementResult() || "A1";

    app.innerHTML = renderNavbar() + `<div style="text-align:center;padding:40px 16px;"><p style="font-size:14px;color:#777;">⏳ ...</p></div>`;

    await loadGrammar(level);
    const allLessons = getGrammar(level);
    const recommended = getRecommendedGrammar(level);

    let html = renderNavbar();
    html += `<div style="max-width:900px;margin:0 auto;padding:24px 16px 50px;">
        <h1 style="font-size:22px;font-weight:700;color:#1a1a1a;margin:0 0 4px;">${t.grammar}</h1>
        <p style="font-size:13px;color:#777;margin:0 0 30px;">${level} – ${levelNames[level]}</p>`;

    if (recommended.length > 0) {
        html += `<div style="margin-bottom:35px;">
            ${sectionHeader(lang === "fa" ? "پیشنهاد داینو 🦖" : "Recommandé 🦖", "", lang)}
            <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(190px,1fr));gap:10px;">`;

        recommended.slice(0, 3).forEach(item => {
            const title = lang === "fa" ? item.title_fa || item.title : item.title;
            html += simpleCard("🦖", title, `⏱ ${item.estimatedTime} min`, `showGrammarLesson('${item.id}')`);
        });
        html += `</div></div>`;
    }

    html += `<div>${sectionHeader(lang === "fa" ? "همه درس‌ها" : "Toutes les leçons", "", lang)}
        <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(190px,1fr));gap:10px;">`;

    allLessons.forEach(item => {
        const title = lang === "fa" ? item.title_fa || item.title : item.title;
        const statusIcon = getStatusIcon(getLessonStatus(item.id));
        html += simpleCard(statusIcon, title, `⏱ ${item.estimatedTime} min · ${item.exercises} ex`, `showGrammarLesson('${item.id}')`);
    });

    html += `</div></div></div>`;
    app.innerHTML = html;
}

/** Loads and displays one grammar lesson. */
async function showGrammarLesson(lessonId: string): Promise<void> {
    const lang = getLanguage();
    const t = texts[lang];
    const level = getPlacementResult() || "A1";

    let lesson: LessonData;
    try {
        const response = await fetch(`./data/lessons/${level}/${lessonId}.json`);
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        lesson = await response.json() as LessonData;
    } catch {
        app.innerHTML = `<div style="padding:40px 16px;text-align:center;"><p style="color:#1a1a1a;">خطا در یافتن درس.</p><button onclick="showGrammarPage()" style="margin-top:15px;padding:10px 20px;border:1px solid #ddd;border-radius:6px;background:#fff;color:#1a1a1a;cursor:pointer;">بازگشت</button></div>`;
        return;
    }

    const status = getLessonStatus(lessonId);
    const bookmarked = isBookmarked(lessonId);
    const progress = getLessonProgress(lessonId);
    if (status === "not_started") setLessonStatus(lessonId, "in_progress");

    const totalSections = lesson.sections.length;
    const completedCount = progress.completedSections.length;
    const progressPercent = totalSections > 0 ? (completedCount / totalSections) * 100 : 0;

    const sectionsHtml = lesson.sections.map(section => {
        const done = progress.completedSections.includes(section.id);
        const icon = done ? "✅" : section.type === "lesson" ? "📖" : section.type === "exercise" ? "✏️" : "🏆";
        const typeLabel = section.type === "lesson"
            ? (lang === "fa" ? "درسنامه" : "Leçon")
            : section.type === "exercise"
                ? (lang === "fa" ? "تمرین" : "Exercice")
                : (lang === "fa" ? "آزمون" : "Quiz");

        return `<div onclick="showLessonSection('${lessonId}','${section.id}')" style="
            background:#fff;border:1px solid ${done ? "#10b981" : "#e0e0e0"};border-radius:6px;
            padding:14px 16px;margin-bottom:8px;display:flex;align-items:center;gap:12px;
            cursor:pointer;transition:border-color 0.15s;
        " onmouseover="this.style.borderColor='#087F5B'" onmouseout="this.style.borderColor='${done ? "#10b981" : "#e0e0e0"}'">
            <span style="font-size:20px;flex-shrink:0;">${icon}</span>
            <div style="flex:1;">
                <p class="ltr-lock" style="margin:0;font-size:14px;font-weight:600;color:#1a1a1a;">${section.title}</p>
                <p style="margin:4px 0 0;font-size:12px;color:#777;">${typeLabel}${done ? (lang === "fa" ? " · انجام شد" : " · Terminé") : ""}</p>
            </div>
            <span style="color:#ccc;font-size:16px;">›</span>
        </div>`;
    }).join("");

    let html = renderNavbar();
    html += `<div style="max-width:900px;margin:0 auto;padding:24px 16px 50px;">
        <button id="back" class="back-btn">← ${t.back}</button>
        <div style="display:flex;justify-content:space-between;align-items:start;margin-bottom:6px;">
            <h1 class="ltr-lock" style="font-size:22px;margin:0;font-weight:700;color:#1a1a1a;">${lesson.title}</h1>
            <button id="bookmark-btn" style="background:none;border:none;font-size:20px;cursor:pointer;padding:0;margin:0;">${bookmarked ? "⭐" : "☆"}</button>
        </div>
        <p class="ltr-lock" style="font-size:13px;color:#777;margin:0 0 20px;">${lesson.level || level} · ${lessonId} · ⏱ ${lesson.estimatedTime || 0} min · ${totalSections} ${lang === "fa" ? "بخش" : "sections"}</p>
        <div style="margin-bottom:25px;">
            <div style="display:flex;justify-content:space-between;margin-bottom:6px;font-size:12px;color:#777;">
                <span>${lang === "fa" ? "پیشرفت" : "Progression"}</span>
                <span style="font-weight:600;color:#087F5B;">${completedCount}/${totalSections}</span>
            </div>
            <div style="background:#e0e0e0;height:4px;border-radius:2px;overflow:hidden;">
                <div style="background:#087F5B;height:100%;width:${progressPercent}%;transition:width 0.3s;border-radius:2px;"></div>
            </div>
        </div>
        ${sectionsHtml}
    </div>`;

    app.innerHTML = html;
    getRequiredElement<HTMLButtonElement>("back").onclick = () => { void showGrammarPage(); };
    getRequiredElement<HTMLButtonElement>("bookmark-btn").onclick = () => {
        getRequiredElement<HTMLButtonElement>("bookmark-btn").innerHTML = toggleBookmark(lessonId) ? "⭐" : "☆";
    };
}

/** Renders a simple lesson table. */
function renderTable(table: LessonTable | null | undefined): string {
    if (!table) return "";

    let html = `<div style="overflow-x:auto;margin:20px 0;"><table class="ltr-lock" style="width:100%;border-collapse:collapse;font-size:14px;">`;
    html += `<thead><tr style="background:#087F5B;">`;
    table.headers.forEach(header => {
        html += `<th style="padding:12px 14px;text-align:left;color:#fff;font-weight:600;font-size:13px;">${renderMarkdown(header)}</th>`;
    });
    html += `</tr></thead><tbody>`;

    table.rows.forEach((row, index) => {
        html += `<tr style="background:${index % 2 === 0 ? "#fff" : "#fafafa"};border-bottom:1px solid #eee;">`;
        row.forEach(cell => {
            html += `<td style="padding:10px 14px;color:#333;">${renderMarkdown(cell)}</td>`;
        });
        html += `</tr>`;
    });

    return `${html}</tbody></table></div>`;
}

/** Loads a grammar lesson section and opens its matching renderer. */
async function showLessonSection(lessonId: string, sectionId: string): Promise<void> {
    const level = lessonId.split("-")[0] as Level;
    const lessonData = await loadLessonWithExercises(level, lessonId);
    const section = getSection(lessonData, sectionId);

    if (!section) {
        alert("خطا در یافتن بخش");
        return;
    }

    if (section.type === "lesson") {
        showLessonContent(lessonId, section);
    } else {
        showExerciseContent(lessonId, section);
    }
}

/** Displays one instructional lesson section. */
function showLessonContent(lessonId: string, section: LessonContentSection): void {
    const lang = getLanguage();
    const t = texts[lang];
    const title = lang === "fa" ? section.title_fa || section.title : section.title;

    let html = renderNavbar();
    html += `<div style="max-width:900px;margin:0 auto;padding:24px 16px 50px;">
        <button id="back" class="back-btn">← ${t.back}</button>
        <p style="font-size:11px;color:#777;text-transform:uppercase;letter-spacing:1px;margin:0 0 6px;">${lang === "fa" ? "درسنامه" : "Leçon"}</p>
        <h1 class="ltr-lock" style="font-size:22px;margin:0 0 20px;font-weight:700;color:#1a1a1a;">${title}</h1>
        <div style="background:#fff;border:1px solid #e0e0e0;border-radius:6px;padding:24px;margin-bottom:20px;">`;

    if (section.content) {
        html += `<div class="ltr-lock" style="line-height:1.8;color:#333;font-size:15px;margin-bottom:20px;">${renderMarkdown(section.content)}</div>`;
    }

    if (section.table) html += renderTable(section.table);

    if (section.table2) {
        const firstExample = section.examples?.[0];
        if (firstExample) {
            html += `<h3 style="font-size:15px;color:#087F5B;margin:24px 0 6px;font-weight:700;">${renderMarkdown(firstExample.fr)}</h3>`;
            if (firstExample.fa) {
                html += `<p class="persian-text" style="margin:0 0 10px;font-size:13px;color:#666;">${firstExample.fa}</p>`;
            }
        }
        html += renderTable(section.table2);
    }

    if (section.examples?.length && !section.table2) {
        html += `<h3 style="font-size:15px;color:#087F5B;margin:20px 0 10px;font-weight:700;">${lang === "fa" ? "مثال‌ها" : "Exemples"}</h3>`;
        section.examples.forEach(example => {
            html += `<div style="background:#fafafa;padding:12px 14px;border-radius:4px;margin:8px 0;border-left:3px solid #087F5B;">
                <p class="ltr-lock" style="margin:0;font-weight:600;font-size:15px;color:#1a1a1a;">${renderMarkdown(example.fr)}</p>
                ${example.fa ? `<p class="persian-text" style="margin:6px 0 0;font-size:13px;color:#666;">${example.fa}</p>` : ""}
            </div>`;
        });
    }

    if (section.note) {
        html += `<div style="margin-top:20px;padding:14px 16px;background:#fffbeb;border-radius:4px;border-left:3px solid #f59e0b;color:#78350f;font-size:14px;line-height:1.6;"><div style="display:flex;gap:8px;align-items:start;"><span>💡</span><div class="ltr-lock">${renderMarkdown(section.note)}</div></div></div>`;
    }
    if (section.note_fa) {
        html += `<div class="persian-text" style="margin-top:20px;padding:14px 16px;background:#fffbeb;border-radius:4px;border-left:3px solid #f59e0b;color:#78350f;font-size:14px;line-height:1.6;"><div style="display:flex;gap:8px;align-items:start;"><span>💡</span><div>${section.note_fa}</div></div></div>`;
    }

    html += `</div>
        <button id="complete-btn" style="width:100%;padding:14px;font-size:15px;font-weight:700;border:none;border-radius:6px;cursor:pointer;background:#087F5B;color:#fff;">${lang === "fa" ? "✓ ادامه" : "✓ Continuer"}</button>
    </div>`;

    app.innerHTML = html;
    getRequiredElement<HTMLButtonElement>("back").onclick = () => { void showGrammarLesson(lessonId); };
    getRequiredElement<HTMLButtonElement>("complete-btn").onclick = () => {
        markSectionCompleted(lessonId, section.id);
        void showGrammarLesson(lessonId);
    };
}
