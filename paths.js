// ===============================
// صفحات مسیرها (paths.js)
// ===============================
async function showDailyHome() {
    const lang = localStorage.getItem("language") || "fr";
    let html = renderNavbar();
    html += `<div style="max-width:900px;margin:0 auto;padding:24px 16px 50px;">
        <h1 style="font-size:22px;font-weight:700;color:#1a1a1a;margin:0 0 4px;">${lang === "fa" ? "🏘️ فرانسوی روزمره" : "🏘️ Français quotidien"}</h1>
        <p style="font-size:13px;color:#777;margin:0 0 30px;">${lang === "fa" ? "برای زندگی در فرانسه" : "Pour vivre en France"}</p>
        <p style="font-size:14px;color:#777;text-align:center;padding:40px 0;">🏗️🦖 ${lang === "fa" ? "دایناسورها مشغول ساخت این بخش هستند!" : "Les dinosaures sont au travail !"}</p>
    </div>`;
    app.innerHTML = html;
}

async function showTravelHome() {
    const lang = localStorage.getItem("language") || "fr";
    let html = renderNavbar();
    html += `<div style="max-width:900px;margin:0 auto;padding:24px 16px 50px;">
        <h1 style="font-size:22px;font-weight:700;color:#1a1a1a;margin:0 0 4px;">${lang === "fa" ? "✈️ فرانسوی در سفر" : "✈️ Français voyage"}</h1>
        <p style="font-size:13px;color:#777;margin:0 0 30px;">${lang === "fa" ? "۱۸ درس برای سفری بی‌نقص" : "18 leçons pour un voyage parfait"}</p>
        <p style="font-size:14px;color:#777;text-align:center;padding:40px 0;">🏗️🦖 ${lang === "fa" ? "دایناسورها مشغول ساخت این بخش هستند!" : "Les dinosaures sont au travail !"}</p>
    </div>`;
    app.innerHTML = html;
}

// ===============================
// درس‌های روزمره و سفر
// ===============================
// ===============================
// درس‌های روزمره و سفر (نسخه هوشمند و سازگار با همه فرمت‌ها)
// ===============================
async function showDailyLesson(lessonId) {
    await showSmartLesson("daily", lessonId);
}

async function showTravelLesson(lessonId) {
    await showSmartLesson("travel", lessonId);
}

// تابع هوشمند مرکزی که همه چیز را مدیریت می‌کند
async function showSmartLesson(type, lessonId) {
    const lang = localStorage.getItem("language") || "fr";
    app.innerHTML = renderNavbar() + `<div style="text-align:center;padding:60px 16px;"><p style="font-size:14px;color:#777;">⏳ در حال بارگذاری...</p></div>`;
    
    let lessonData = null;
    
    // ۱. اول پوشه lessons را چک می‌کند (جایی که ربات فایل‌ها را ساخت)
    try {
        const res1 = await fetch(`./data/${type}/lessons/${lessonId}.json?v=${Date.now()}`, { cache: "no-store" });
        if (res1.ok) lessonData = await res1.json();
    } catch (e) {}

    // ۲. اگر پیدا نشد، پوشه اصلی type را چک می‌کند
    if (!lessonData) {
        try {
            const res2 = await fetch(`./data/${type}/${lessonId}.json?v=${Date.now()}`, { cache: "no-store" });
            if (res2.ok) lessonData = await res2.json();
        } catch (e) {}
    }

    // ۳. اگر هنوز پیدا نشد، پیام خطای دقیق می‌دهد
    if (!lessonData) { 
        app.innerHTML = renderNavbar() + `<div style="text-align:center;padding:60px 16px;">
            <p style="font-size:48px;margin-bottom:10px;">🚧</p>
            <p style="font-size:16px;color:#1a1a1a;font-weight:700;">درس پیدا نشد</p>
            <p style="font-size:13px;color:#777;margin-top:10px;direction:ltr;">
                File not found: <code>data/${type}/lessons/${lessonId}.json</code><br>
                or <code>data/${type}/${lessonId}.json</code>
            </p>
            <button onclick="type === 'travel' ? showTravelPage() : showHome()" style="margin-top:20px;padding:10px 20px;border:1px solid #ddd;border-radius:6px;background:#fff;color:#1a1a1a;cursor:pointer;font-weight:700;">${lang === "fa" ? "بازگشت به لیست" : "Retour"}</button>
        </div>`; 
        return; 
    }

    // 🌟 ۴. جادوی سازگاری: اگر فایل miniLessons دارد اما کد قدیمی sections می‌خواهد، آن را تبدیل می‌کند
    if (!lessonData.sections && lessonData.miniLessons) {
        lessonData.sections = lessonData.miniLessons.map(m => ({
            id: m.id,
            title: m.title,
            title_fa: m.title,
            type: m.type,
            words: m.words || [],
            tips: m.tips || [],
            displayCount: m.displayCount || 10
        }));
    }

    // ۵. نمایش محتوا
    if (typeof showLessonContent === 'function' && lessonData.sections && lessonData.sections.length > 0) {
        // اگر موتور قدیمی وجود دارد، از آن استفاده می‌کند
        showLessonContent(lessonId, lessonData.sections[0]);
    } else if (typeof showTravelLessonContent === 'function' && type === 'travel') {
        // اگر تابع جدید travel.js لود شده باشد، از آن استفاده می‌کند
        window.currentTravelLesson = lessonData;
        showTravelLessonContent(lessonId);
    } else {
        // فال‌بک نهایی اگر هیچکدام کار نکرد
        app.innerHTML = renderNavbar() + `<div style="text-align:center;padding:60px 16px;">
            <p style="font-size:18px;color:#dc2626;">⚠️ خطا در نمایش درس</p>
            <p style="font-size:13px;color:#777;">ساختار فایل خوانده شد اما تابع نمایش آن در دسترس نیست.</p>
            <button onclick="showHome()" style="margin-top:15px;padding:10px 20px;border:1px solid #ddd;border-radius:6px;background:#fff;cursor:pointer;">بازگشت</button>
        </div>`;
    }
}

// ===============================
// موتور تمرین (مشترک بین گرامر، سفر و روزمره)
// ===============================
function showExerciseContent(lessonId, section) {
    const lang = localStorage.getItem("language") || "fr";
    const t = texts[lang];
    const title = lang === "fa" ? section.title_fa : section.title;
    const questions = getRandomQuestions(section, section.displayCount);
    let currentQuestionIndex = 0;
    let correctCount = 0;

    function showCurrentQuestion() {
        if (currentQuestionIndex >= questions.length) { showExerciseResult(lessonId, section, correctCount, questions.length); return; }
        const question = prepareQuestion(questions[currentQuestionIndex]);

        let html = renderNavbar();
        html += `<div style="max-width:900px;margin:0 auto;padding:24px 16px 50px;">
            <button id="back" class="back-btn">← ${t.back}</button>
            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px;">
                <span style="font-size:13px;color:#777;">${currentQuestionIndex + 1} / ${questions.length}</span>
            </div>
            <div style="background:#e0e0e0;height:4px;border-radius:2px;margin-bottom:25px;overflow:hidden;">
                <div style="background:#087F5B;height:100%;width:${((currentQuestionIndex + 1) / questions.length) * 100}%;transition:width 0.3s;border-radius:2px;"></div>
            </div>
            <h2 class="${lang === 'fa' ? 'persian-text' : 'ltr-lock'}" style="font-size:18px;margin-bottom:10px;color:#1a1a1a;">${title}</h2>
            <p class="ltr-lock" style="font-size:17px;line-height:1.6;color:#1a1a1a;margin-bottom:25px;font-weight:500;">${question.question}</p>
            <div id="options-container" style="display:flex;flex-direction:column;gap:10px;">`;

        if (question.type === "mcq" || question.type === "binary") {
            question.options.forEach((option, index) => {
                html += `<button class="option-btn ltr-lock" data-index="${index}" style="width:100%;padding:14px;font-size:15px;border:1px solid #e0e0e0;border-radius:6px;background:#fafafa;color:#1a1a1a;cursor:pointer;text-align:left;transition:all 0.15s;font-weight:500;">${option}</button>`;
            });
        }

        html += `</div><div id="feedback" style="margin-top:20px;min-height:60px;"></div></div>`;
        app.innerHTML = html;
        document.getElementById("back").onclick = () => showGrammarLesson(lessonId);

        document.querySelectorAll(".option-btn").forEach(btn => {
            btn.onclick = () => {
                const selectedIndex = parseInt(btn.getAttribute("data-index"));
                const isCorrect = checkAnswer(question, selectedIndex);
                if (isCorrect) correctCount++;
                else saveMistake(lessonId, section.id, currentQuestionIndex, selectedIndex, question.correct);

                const feedback = document.getElementById("feedback");
                if (isCorrect) {
                    btn.style.background = "#d4edda"; btn.style.borderColor = "#28a745"; btn.style.color = "#155724";
                    feedback.innerHTML = `<div style="background:#d4edda;padding:14px;border-radius:6px;color:#155724;border:1px solid #c3e6cb;"><p style="margin:0;font-weight:700;font-size:15px;">✅ ${lang === "fa" ? "آفرین!" : "Bravo!"}</p><p class="persian-text" style="margin:8px 0 0;font-size:13px;">${renderMarkdown(question.explanation)}</p></div>`;
                } else {
                    btn.style.background = "#f8d7da"; btn.style.borderColor = "#dc3545"; btn.style.color = "#721c24";
                    document.querySelectorAll(".option-btn")[question.correct].style.background = "#d4edda";
                    document.querySelectorAll(".option-btn")[question.correct].style.borderColor = "#28a745";
                    document.querySelectorAll(".option-btn")[question.correct].style.color = "#155724";
                    feedback.innerHTML = `<div style="background:#f8d7da;padding:14px;border-radius:6px;color:#721c24;border:1px solid #f5c6cb;"><p style="margin:0;font-weight:700;font-size:15px;">❌ ${lang === "fa" ? "اشتباه!" : "Incorrect!"}</p><p class="persian-text" style="margin:8px 0 0;font-size:13px;">${renderMarkdown(question.explanation)}</p></div>`;
                }
                document.querySelectorAll(".option-btn").forEach(b => { b.onclick = null; b.style.cursor = "default"; });
                feedback.innerHTML += `<button id="next-btn" style="width:100%;margin-top:12px;padding:12px;font-size:15px;font-weight:700;border:none;border-radius:6px;background:#087F5B;color:#fff;cursor:pointer;">${lang === "fa" ? "سوال بعدی" : "Question suivante"}</button>`;
                document.getElementById("next-btn").onclick = () => { currentQuestionIndex++; showCurrentQuestion(); };
            };
        });
    }
    showCurrentQuestion();
}

function showExerciseResult(lessonId, section, correctCount, totalCount) {
    const lang = localStorage.getItem("language") || "fr";
    const percentage = Math.round((correctCount / totalCount) * 100);
    markSectionCompleted(lessonId, section.id);

    let emoji = "🎉", message = lang === "fa" ? "عالی بود!" : "Excellent!";
    if (percentage < 50) { emoji = "💪"; message = lang === "fa" ? "تلاش بیشتر!" : "Plus d'effort!"; }
    else if (percentage < 80) { emoji = "👍"; message = lang === "fa" ? "خوب بود!" : "Bien!"; }

    let html = renderNavbar();
    html += `<div style="max-width:500px;margin:0 auto;padding:50px 16px;text-align:center;">
        <div style="font-size:48px;margin-bottom:16px;">${emoji}</div>
        <h1 style="font-size:24px;color:#1a1a1a;margin-bottom:10px;">${message}</h1>
        <p style="font-size:36px;font-weight:800;color:#087F5B;margin:15px 0;">${correctCount}/${totalCount}</p>
        <p style="font-size:16px;color:#777;margin-bottom:30px;">${percentage}%</p>
        <button onclick="showGrammarLesson('${lessonId}')" style="width:100%;padding:14px;font-size:15px;font-weight:700;border:none;border-radius:6px;background:#087F5B;color:#fff;cursor:pointer;">${lang === "fa" ? "بازگشت به درس" : "Retour à la leçon"}</button>
    </div>`;
    app.innerHTML = html;
}
