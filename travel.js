// ===============================
// ✈️ موتور اختصاصی سفر (بدون تداخل با سایر فایل‌ها)
// ===============================

async function loadTravelList() {
    const lang = localStorage.getItem("language") || "fr";
    app.innerHTML = renderNavbar() + `<div style="text-align:center;padding:60px;">⏳ در حال بارگذاری...</div>`;

    try {
        const res = await fetch("./data/travel/lessons.json?v=" + Date.now());
        if (!res.ok) throw new Error("فایل لیست دروس پیدا نشد");
        const lessons = await res.json();

        let html = renderNavbar();
        html += `<div style="max-width:960px;margin:0 auto;padding:32px 20px 60px;">`;
        html += `<h1 style="font-size:26px;font-weight:700;color:#1a1a1a;margin:0 0 6px;">${lang === "fa" ? "✈️ سفر" : "✈️ Voyage"}</h1>`;
        html += `<p style="font-size:15px;color:#777;margin:0 0 30px;">${lang === "fa" ? "درس‌های کاربردی برای سفر" : "Leçons pratiques pour voyager"}</p>`;

        if (lessons.length === 0) {
            html += `<p style="text-align:center;color:#777;padding:40px;">${lang === "fa" ? "هنوز درسی اضافه نشده" : "Aucune leçon disponible"}</p>`;
        } else {
            html += `<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(280px,1fr));gap:15px;">`;
            lessons.forEach(lesson => {
                html += `<div style="background:#fff;border:1px solid #e0e0e0;border-radius:8px;padding:20px;cursor:pointer;transition:all 0.2s;" onclick="loadTravelDetail('${lesson.id}')" onmouseover="this.style.borderColor='#087F5B'" onmouseout="this.style.borderColor='#e0e0e0'">`;
                html += `<div style="display:flex;align-items:center;gap:12px;">`;
                html += `<span style="font-size:36px;">${lesson.icon || '📝'}</span>`;
                html += `<div><h3 style="margin:0;font-size:17px;color:#1a1a1a;">${lang === "fa" ? lesson.title_fa : lesson.title}</h3>`;
                html += `<p style="font-size:13px;color:#777;margin:4px 0 0;">⏱️ ${lesson.estimatedTime || 25} min</p></div></div></div>`;
            });
            html += `</div>`;
        }
        html += `</div>`;
        app.innerHTML = html;
    } catch (e) {
        app.innerHTML = renderNavbar() + `<div style="text-align:center;padding:60px;"><p>❌ خطا: ${e.message}</p><button onclick="location.reload()" style="margin-top:15px;padding:10px 20px;border:1px solid #ddd;border-radius:6px;background:#fff;cursor:pointer;">رفرش صفحه</button></div>`;
    }
}

async function loadTravelDetail(lessonId) {
    const lang = localStorage.getItem("language") || "fr";
    app.innerHTML = renderNavbar() + `<div style="text-align:center;padding:60px;">⏳ در حال بارگذاری درس...</div>`;

    try {
        let res = await fetch(`./data/travel/lessons/${lessonId}.json?v=${Date.now()}`);
        if (!res.ok) {
            res = await fetch(`./data/travel/${lessonId}.json?v=${Date.now()}`); // فال‌بک
        }

        if (!res.ok) throw new Error(`فایل ${lessonId}.json پیدا نشد`);
        const lesson = await res.json();

        let html = renderNavbar();
        html += `<div style="max-width:900px;margin:0 auto;padding:20px 16px 60px;">`;
        html += `<button onclick="loadTravelList()" style="margin-bottom:20px;padding:8px 16px;background:#eee;border:none;border-radius:6px;cursor:pointer;font-weight:700;">← ${lang === "fa" ? "بازگشت به لیست" : "Retour"}</button>`;
        html += `<h1 style="font-size:24px;font-weight:700;margin:0 0 20px;">${lesson.icon || '📝'} ${lang === "fa" ? lesson.title_fa : lesson.title}</h1>`;

        // پشتیبانی همزمان از miniLessons و sections
        const sections = lesson.miniLessons || lesson.sections || [];

        if (sections.length > 0) {
            sections.forEach((sec, idx) => {
                const count = sec.type === 'vocab' ? (sec.words ? sec.words.length : 0) : (sec.tips ? sec.tips.length : 0);
                const label = sec.type === 'vocab' ? (lang === "fa" ? 'کلمه' : 'mots') : (lang === "fa" ? 'نکته' : 'conseils');
                
                html += `<div style="background:#f9fafb;border:1px solid #e0e0e0;border-radius:8px;padding:16px;margin-bottom:12px;cursor:pointer;" onclick="showTravelSectionContent('${lessonId}', ${idx})" onmouseover="this.style.background='#f0f9ff'" onmouseout="this.style.background='#f9fafb'">`;
                html += `<h3 style="margin:0;font-size:16px;color:#087F5B;">${sec.title || sec.title_fa}</h3>`;
                html += `<p style="margin:4px 0 0;font-size:13px;color:#777;">${count} ${label}</p>`;
                html += `</div>`;
            });
        } else {
            html += `<p style="text-align:center;color:#777;padding:40px;">محتوایی یافت نشد.</p>`;
        }

        html += `<div id="travel-section-content" style="margin-top:20px;"></div>`;
        html += `</div>`;
        app.innerHTML = html;

        window.currentTravelLesson = lesson; // ذخیره برای استفاده در تابع بعدی

    } catch (e) {
        app.innerHTML = renderNavbar() + `<div style="text-align:center;padding:60px;"><p>❌ خطا: ${e.message}</p><button onclick="loadTravelList()" style="margin-top:15px;padding:10px 20px;border:1px solid #ddd;border-radius:6px;background:#fff;cursor:pointer;">بازگشت</button></div>`;
    }
}

function showTravelSectionContent(lessonId, idx) {
    const lesson = window.currentTravelLesson;
    if (!lesson) return;
    
    const sections = lesson.miniLessons || lesson.sections || [];
    const sec = sections[idx];
    if (!sec) return;

    const contentDiv = document.getElementById("travel-section-content");
    let html = `<div style="background:#fff;border:2px solid #087F5B;border-radius:8px;padding:20px;margin-bottom:20px;">`;
    html += `<h2 style="font-size:18px;font-weight:700;color:#087F5B;margin:0;">${sec.title || sec.title_fa}</h2>`;
    html += `</div>`;

    if (sec.type === 'vocab' && sec.words) {
        html += `<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(280px,1fr));gap:12px;">`;
        sec.words.forEach(w => {
            html += `<div style="background:#fff;border:1px solid #e0e0e0;border-radius:8px;padding:16px;">`;
            html += `<div style="display:flex;align-items:start;gap:12px;">`;
            html += `<span style="font-size:28px;">${w.emoji || '📝'}</span>`;
            html += `<div style="flex:1;">`;
            html += `<p class="ltr-lock" style="font-size:18px;font-weight:700;color:#1a1a1a;margin:0 0 4px;">${w.fr}</p>`;
            if (w.phonetic) html += `<p class="persian-text" style="font-size:13px;color:#888;margin:0 0 4px;font-style:italic;">🔊 ${w.phonetic}</p>`;
            html += `<p class="persian-text" style="font-size:15px;color:#555;margin:0;">${w.fa}</p>`;
            html += `</div></div></div>`;
        });
        html += `</div>`;
    } else if ((sec.type === 'tips' || sec.type === 'note') && sec.tips) {
        html += `<div style="display:flex;flex-direction:column;gap:12px;">`;
        sec.tips.forEach((tip, tIdx) => {
            const bgColor = tip.type === 'warning' ? '#fef2f2' : tip.type === 'note' ? '#eff6ff' : '#fffbeb';
            const borderColor = tip.type === 'warning' ? '#dc2626' : tip.type === 'note' ? '#2563eb' : '#d97706';
            
            html += `<div style="background:${bgColor};border:1px solid ${borderColor};border-radius:8px;padding:18px;">`;
            html += `<h3 style="font-size:16px;font-weight:700;color:#1a1a1a;margin:0 0 8px;">${tIdx + 1}. ${tip.title_fa || tip.title_fr}</h3>`;
            if (tip.content_fr) html += `<p class="ltr-lock" style="font-size:14px;color:#333;margin:0 0 8px;line-height:1.7;">${tip.content_fr}</p>`;
            if (tip.content_fa) html += `<p class="persian-text" style="font-size:13px;color:#777;margin:0;line-height:1.7;">${tip.content_fa}</p>`;
            html += `</div>`;
        });
        html += `</div>`;
    }

    contentDiv.innerHTML = html;
    contentDiv.scrollIntoView({ behavior: 'smooth', block: 'start' });
}
