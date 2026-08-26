// ===============================
// ✈️ نسخه دیباگ با alert مرحله به مرحله
// ===============================

let travelCache = {};

async function loadTravelIndex() {
    if (travelCache.index) return travelCache.index;
    try {
        alert("🔍 مرحله ۱: در حال خواندن lessons.json...");
        const r = await fetch("./data/travel/lessons.json?v=" + Date.now(), { cache: "no-store" });
        if (!r.ok) throw new Error("lessons.json not found");
        const d = await r.json();
        travelCache.index = d;
        alert("✅ مرحله ۱: " + d.length + " درس خوانده شد");
        return d;
    } catch (e) { 
        alert("❌ مرحله ۱ خطا: " + e.message);
        return []; 
    }
}

async function showTravelPage() {
    alert("🚀 showTravelPage فراخوانی شد!");
    const lang = localStorage.getItem("language") || "fr";
    const lessons = await loadTravelIndex();
    
    let html = renderNavbar();
    html += `<div style="max-width:960px;margin:0 auto;padding:32px 20px 60px;">`;
    html += `<h1>✈️ Voyage (${lessons.length} درس)</h1>`;
    
    if (lessons.length === 0) {
        html += `<p>هیچ درسی پیدا نشد!</p>`;
    } else {
        html += `<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(280px,1fr));gap:15px;">`;
        lessons.forEach(lesson => {
            html += `<div style="background:#fff;border:1px solid #e0e0e0;border-radius:8px;padding:20px;cursor:pointer;" onclick="showTravelLesson('${lesson.id}')">`;
            html += `<div style="display:flex;align-items:center;gap:12px;">`;
            html += `<span style="font-size:36px;">${lesson.icon || '📝'}</span>`;
            html += `<div>`;
            html += `<h3 style="margin:0;">${lang === "fa" ? lesson.title_fa : lesson.title}</h3>`;
            html += `<p style="color:#777;font-size:13px;">ID: ${lesson.id}</p>`;
            html += `</div></div></div>`;
        });
        html += `</div>`;
    }
    html += `</div>`;
    app.innerHTML = html;
    alert("✅ صفحه لیست نمایش داده شد!");
}

async function showTravelLesson(lessonId) {
    alert("📖 showTravelLesson فراخوانی شد با ID: " + lessonId);
    const lang = localStorage.getItem("language") || "fr";
    
    let lesson = null;
    try {
        alert("🔍 مرحله ۲: در حال خواندن فایل " + lessonId + ".json...");
        const url = "./data/travel/lessons/" + lessonId + ".json?v=" + Date.now();
        const r = await fetch(url, { cache: "no-store" });
        alert("📡 پاسخ HTTP: " + r.status);
        
        if (!r.ok) {
            alert("❌ فایل پیدا نشد! کد: " + r.status);
            app.innerHTML = renderNavbar() + `<div style="padding:40px;text-align:center;"><h2>❌ فایل پیدا نشد</h2><p>مسیر: ${url}</p><button onclick="showTravelPage()">بازگشت</button></div>`;
            return;
        }
        
        lesson = await r.json();
        alert("✅ فایل خوانده شد! عنوان: " + (lesson.title_fa || lesson.title));
    } catch (e) {
        alert("❌ خطا در خواندن فایل: " + e.message);
        return;
    }
    
    if (!lesson.miniLessons || lesson.miniLessons.length === 0) {
        alert("⚠️ فایل miniLessons ندارد!");
        app.innerHTML = renderNavbar() + `<div style="padding:40px;text-align:center;"><h2>⚠️ محتوای درس خالی است</h2><button onclick="showTravelPage()">بازگشت</button></div>`;
        return;
    }
    
    alert("✅ " + lesson.miniLessons.length + " مینی‌درس پیدا شد!");
    
    let html = renderNavbar();
    html += `<div style="max-width:900px;margin:0 auto;padding:20px 16px 60px;">`;
    html += `<button onclick="showTravelPage()" style="padding:10px 20px;background:#087F5B;color:#fff;border:none;border-radius:6px;cursor:pointer;">← بازگشت</button>`;
    html += `<h1>${lang === "fa" ? lesson.title_fa : lesson.title}</h1>`;
    html += `<h2>📚 بخش‌های درس:</h2>`;
    
    lesson.miniLessons.forEach((mini, idx) => {
        const typeIcon = mini.type === 'vocab' ? '📖' : '💡';
        const count = mini.type === 'vocab' ? (mini.words ? mini.words.length : 0) : (mini.tips ? mini.tips.length : 0);
        
        html += `<div style="background:#fff;border:1px solid #e0e0e0;border-radius:8px;padding:16px;margin:10px 0;cursor:pointer;" onclick="showMiniLesson('${lessonId}', ${idx})">`;
        html += `<span style="font-size:20px;">${typeIcon}</span> <b>${mini.title}</b>`;
        html += `<p style="color:#777;font-size:13px;margin:4px 0 0;">${count} آیتم</p>`;
        html += `</div>`;
    });
    
    html += `<div id="mini-lesson-content"></div>`;
    html += `</div>`;
    
    app.innerHTML = html;
    window.currentTravelLesson = lesson;
    alert("✅ صفحه درس نمایش داده شد!");
}

function showMiniLesson(lessonId, miniIdx) {
    alert("📝 showMiniLesson فراخوانی شد! idx: " + miniIdx);
    const lang = localStorage.getItem("language") || "fr";
    const lesson = window.currentTravelLesson;
    if (!lesson || !lesson.miniLessons || !lesson.miniLessons[miniIdx]) {
        alert("❌ مینی‌درس پیدا نشد!");
        return;
    }
    
    const mini = lesson.miniLessons[miniIdx];
    const contentDiv = document.getElementById("mini-lesson-content");
    let html = "";
    
    html += `<div style="background:#fff;border:2px solid #087F5B;border-radius:8px;padding:20px;margin:20px 0;">`;
    html += `<h2 style="color:#087F5B;">${mini.title}</h2>`;
    html += `</div>`;
    
    if (mini.type === 'vocab' && mini.words && mini.words.length > 0) {
        html += `<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(280px,1fr));gap:12px;">`;
        mini.words.forEach(word => {
            html += `<div style="background:#fff;border:1px solid #e0e0e0;border-radius:8px;padding:16px;">`;
            html += `<div style="display:flex;align-items:start;gap:12px;">`;
            html += `<span style="font-size:32px;">${word.emoji || '📝'}</span>`;
            html += `<div>`;
            html += `<p style="font-size:18px;font-weight:700;margin:0 0 4px;">${word.fr}</p>`;
            if (word.phonetic) html += `<p style="font-size:13px;color:#888;margin:0 0 4px;">🔊 ${word.phonetic}</p>`;
            html += `<p style="font-size:15px;color:#555;margin:0;">${word.fa}</p>`;
            html += `</div></div></div>`;
        });
        html += `</div>`;
    }
    else if (mini.type === 'tips' && mini.tips && mini.tips.length > 0) {
        mini.tips.forEach((tip, idx) => {
            html += `<div style="background:#fffbeb;border:1px solid #fde68a;border-radius:8px;padding:18px;margin:10px 0;">`;
            html += `<h3>${idx + 1}. ${tip.title_fa || tip.title_fr || ''}</h3>`;
            if (tip.content_fr) html += `<p style="direction:ltr;text-align:left;">${tip.content_fr}</p>`;
            if (tip.content_fa) html += `<p style="color:#777;">${tip.content_fa}</p>`;
            html += `</div>`;
        });
    }
    
    contentDiv.innerHTML = html;
    alert("✅ مینی‌درس نمایش داده شد!");
}
