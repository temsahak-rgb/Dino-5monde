// نسخه تضمینی - همه توابع تعریف شده‌اند

let travelCache = {};

async function loadTravelIndex() {
    if (travelCache.index) return travelCache.index;
    try {
        const r = await fetch("./data/travel/lessons.json?v=" + Date.now(), { cache: "no-store" });
        if (!r.ok) throw new Error("lessons.json not found");
        const d = await r.json();
        travelCache.index = d;
        return d;
    } catch (e) { 
        console.error("Error loading travel index:", e);
        return []; 
    }
}

async function showTravelPage() {
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
            html += `<div style="background:#fff;border:1px solid #e0e0e0;border-radius:8px;padding:20px;cursor:pointer;" onclick="alert('کلیک روی: ${lesson.id}'); showTravelLesson('${lesson.id}')">`;
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
}

async function showTravelLesson(lessonId) {
    alert("🎯 showTravelLesson شروع شد! ID: " + lessonId);
    app.innerHTML = "<h1>تست موفق!</h1><p>تابع showTravelLesson کار می‌کند.</p><p>ID: " + lessonId + "</p>";
}
