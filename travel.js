// ===============================
// ✈️ موتور اختصاصی و مستقل درس‌های سفر
// ===============================
let travelCache = {};

async function loadTravelData(lessonId) {
    if (travelCache[lessonId]) return travelCache[lessonId];
    try {
        const r = await fetch(`./data/travel/lessons/${lessonId}.json?v=${Date.now()}`, { cache: "no-store" });
        if (!r.ok) return null;
        const d = await r.json();
        travelCache[lessonId] = d;
        return d;
    } catch (e) { return null; }
}

async function renderTravelLessonPage(lessonId) {
    const lang = localStorage.getItem("language") || "fr";
    const lesson = await loadTravelData(lessonId);
    
    if (!lesson) {
        app.innerHTML = renderNavbar() + `<div style="text-align:center;padding:60px 16px;">
            <p style="font-size:48px;margin-bottom:10px;">🚧</p>
            <p style="font-size:16px;color:#1a1a1a;font-weight:700;">درس پیدا نشد</p>
            <p style="font-size:13px;color:#777;margin-top:10px;direction:ltr;">data/travel/lessons/${lessonId}.json</p>
            <button onclick="showTravelPage()" style="margin-top:20px;padding:10px 20px;border:1px solid #ddd;border-radius:6px;background:#fff;color:#1a1a1a;cursor:pointer;font-weight:700;">${lang === "fa" ? "بازگشت به لیست" : "Retour"}</button>
        </div>`;
        return;
    }

    let html = renderNavbar();
    html += `<div style="max-width:900px;margin:0 auto;padding:20px 16px 60px;">`;
    html += `<button class="back-btn" onclick="showTravelPage()">← ${lang === "fa" ? "بازگشت" : "Retour"}</button>`;
    
    html += `<div style="display:flex;align-items:center;gap:16px;margin:20px 0;">`;
    html += `<span style="font-size:48px;">${lesson.icon || '📝'}</span>`;
    html += `<div>`;
    html += `<h1 style="font-size:26px;font-weight:700;color:#1a1a1a;margin:0;">${lang === "fa" ? lesson.title_fa : lesson.title}</h1>`;
    html += `<p style="font-size:14px;color:#777;margin:4px 0 0;">⏱️ ${lesson.estimatedTime || 25} ${lang === "fa" ? "دقیقه" : "min"}</p>`;
    html += `</div></div>`;
    
    const sections = lesson.miniLessons || [];
    
    if (sections.length > 0) {
        html += `<div style="background:#f9fafb;border:1px solid #e0e0e0;border-radius:8px;padding:16px;margin-bottom:24px;">`;
        html += `<h3 style="font-size:15px;font-weight:700;color:#1a1a1a;margin:0 0 12px;">📚 ${lang === "fa" ? "بخش‌های درس" : "Sections de la leçon"}</h3>`;
        html += `<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(200px,1fr));gap:10px;">`;
        
        sections.forEach((mini, idx) => {
            const typeIcon = mini.type === 'vocab' ? '📖' : '💡';
            const itemCount = mini.type === 'vocab' ? (mini.words ? mini.words.length : 0) : (mini.tips ? mini.tips.length : 0);
            const itemLabel = mini.type === 'vocab' ? (lang === "fa" ? "کلمه" : "mots") : (lang === "fa" ? "نکته" : "conseils");
            
            html += `<button onclick="renderTravelMiniLesson('${lessonId}', ${idx})" style="padding:12px;background:#fff;border:1px solid #e0e0e0;border-radius:6px;cursor:pointer;text-align:right;transition:all 0.2s;" onmouseover="this.style.borderColor='#087F5B';this.style.background='#f0f9ff'" onmouseout="this.style.borderColor='#e0e0e0';this.style.background='#fff'">`;
            html += `<span style="font-size:20px;">${typeIcon}</span>`;
            html += `<p style="font-size:14px;font-weight:600;color:#1a1a1a;margin:6px 0 0;">${mini.title || mini.title_fa}</p>`;
            html += `<p style="font-size:12px;color:#777;margin:4px 0 0;">${itemCount} ${itemLabel}</p>`;
            html += `</button>`;
        });
        html += `</div></div>`;
    }
    
    html += `<div id="travel-mini-lesson-content">`;
    html += `<p style="text-align:center;color:#777;padding:40px;">${lang === "fa" ? "یک بخش را از بالا انتخاب کنید" : "Sélectionnez une section ci-dessus"}</p>`;
    html += `</div></div>`;
    
    app.innerHTML = html;
    window.currentTravelLesson = lesson;
}

function renderTravelMiniLesson(lessonId, miniIdx) {
    const lang = localStorage.getItem("language") || "fr";
    const lesson = window.currentTravelLesson;
    if (!lesson) return;
    
    const sections = lesson.miniLessons || [];
    const mini = sections[miniIdx];
    if (!mini) return;

    const contentDiv = document.getElementById("travel-mini-lesson-content");
    let html = "";
    
    html += `<div style="background:#fff;border:2px solid #087F5B;border-radius:8px;padding:20px;margin-bottom:20px;">`;
    html += `<h2 style="font-size:20px;font-weight:700;color:#087F5B;margin:0 0 8px;">${mini.title || mini.title_fa}</h2>`;
    html += `</div>`;
    
    if (mini.type === 'vocab' && mini.words && mini.words.length > 0) {
        html += `<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(280px,1fr));gap:12px;">`;
        mini.words.forEach(word => {
            html += `<div style="background:#fff;border:1px solid #e0e0e0;border-radius:8px;padding:16px;" onmouseover="this.style.borderColor='#087F5B'" onmouseout="this.style.borderColor='#e0e0e0'">`;
            html += `<div style="display:flex;align-items:start;gap:12px;">`;
            html += `<span style="font-size:32px;">${word.emoji || '📝'}</span>`;
            html += `<div style="flex:1;">`;
            html += `<p class="ltr-lock" style="font-size:18px;font-weight:700;color:#1a1a1a;margin:0 0 4px;">${word.fr}</p>`;
            if (word.phonetic) html += `<p class="persian-text" style="font-size:13px;color:#888;margin:0 0 4px;font-style:italic;">🔊 ${word.phonetic}</p>`;
            html += `<p class="persian-text" style="font-size:15px;color:#555;margin:0;">${word.fa}</p>`;
            html += `</div></div></div>`;
        });
        html += `</div>`;
    }
    else if ((mini.type === 'tips' || mini.type === 'note') && mini.tips && mini.tips.length > 0) {
        html += `<div style="display:flex;flex-direction:column;gap:12px;">`;
        mini.tips.forEach((tip, idx) => {
            const bgColor = tip.type === 'warning' ? '#fef2f2' : tip.type === 'note' ? '#eff6ff' : '#fffbeb';
            const borderColor = tip.type === 'warning' ? '#dc2626' : tip.type === 'note' ? '#2563eb' : '#d97706';
            
            html += `<div style="background:${bgColor};border:1px solid ${borderColor};border-radius:8px;padding:18px;">`;
            html += `<div style="display:flex;align-items:start;gap:12px;">`;
            html += `<span style="font-size:28px;">${tip.icon || '💡'}</span>`;
            html += `<div style="flex:1;">`;
            html += `<h3 style="font-size:16px;font-weight:700;color:#1a1a1a;margin:0 0 8px;">${idx + 1}. ${tip.title_fa || tip.title_fr || ''}</h3>`;
            if (tip.content_fr) html += `<p class="ltr-lock" style="font-size:14px;color:#333;margin:0 0 8px;line-height:1.7;">${tip.content_fr}</p>`;
            if (tip.content_fa) html += `<p class="persian-text" style="font-size:13px;color:#777;margin:0;line-height:1.7;">${tip.content_fa}</p>`;
            html += `</div></div></div>`;
        });
        html += `</div>`;
    }
    
    contentDiv.innerHTML = html;
    contentDiv.scrollIntoView({ behavior: 'smooth', block: 'start' });
}
