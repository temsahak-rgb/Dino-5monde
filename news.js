// ===============================
// 📰 موتور اخبار
// ===============================
let newsCache = null;

async function loadNewsIndex() {
    if (newsCache) return newsCache;
    try {
        const r = await fetch("./data/news/news-index.json?v=" + Date.now(), { cache: "no-store" });
        const d = await r.json();
        newsCache = d;
        return d;
    } catch (e) { return []; }
}

async function loadNewsDetail(newsId) {
    try {
        const r = await fetch("./data/news/" + newsId + ".json?v=" + Date.now(), { cache: "no-store" });
        return await r.json();
    } catch (e) { return null; }
}

// ===============================
// 📰 بخش اخبار در صفحه اصلی
// ===============================
async function renderNewsSection() {
    const lang = localStorage.getItem("language") || "fr";
    const allNews = await loadNewsIndex();
    
    if (!allNews || !allNews.length) return "";
    
    // آخرین خبر = خبر هفته جاری
    const currentNews = allNews[0];
    // بقیه = آرشیو
    const archive = allNews.slice(1);
    
    let html = "";
    
    // 🎯 خبر هفته (تصویر بزرگ)
    html += `<div style="background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 4px 12px rgba(0,0,0,0.1);margin-bottom:30px;cursor:pointer;" onclick="showNewsDetail('${currentNews.id}')">`;
    html += `<div style="position:relative;height:400px;overflow:hidden;">`;
    html += `<img src="${currentNews.image}" alt="${currentNews.title}" style="width:100%;height:100%;object-fit:cover;">`;
    html += `<div style="position:absolute;top:15px;right:15px;display:flex;gap:8px;">`;
    html += `<span style="background:#087F5B;color:#fff;padding:6px 12px;border-radius:6px;font-size:13px;font-weight:700;">${currentNews.level}</span>`;
    html += `<span style="background:rgba(0,0,0,0.6);color:#fff;padding:6px 12px;border-radius:6px;font-size:13px;font-weight:700;">📰 ${lang === "fa" ? "خبر هفته" : "Actualité de la semaine"}</span>`;
    html += `</div>`;
    html += `<div style="position:absolute;bottom:0;left:0;right:0;background:linear-gradient(to top, rgba(0,0,0,0.9), transparent);padding:30px;color:#fff;">`;
    html += `<h2 style="font-size:28px;font-weight:700;margin:0 0 8px;">${lang === "fa" ? currentNews.title_fa : currentNews.title}</h2>`;
    html += `<p style="font-size:16px;margin:0;opacity:0.9;">${lang === "fa" ? currentNews.subtitle_fa : currentNews.subtitle}</p>`;
    html += `</div></div>`;
    html += `<div style="padding:20px 30px;display:flex;justify-content:space-between;align-items:center;">`;
    html += `<span style="font-size:14px;color:#777;">📅 ${currentNews.publishedDate}</span>`;
    html += `<span style="font-size:15px;font-weight:700;color:#087F5B;">${lang === "fa" ? "مشاهده کامل ←" : "Lire la suite ←"}</span>`;
    html += `</div></div>`;
    
    // 📚 آرشیو اخبار (اگر وجود داشته باشد)
    if (archive.length > 0) {
        html += `<h2 style="font-size:20px;font-weight:700;color:#1a1a1a;margin:30px 0 15px;">📚 ${lang === "fa" ? "آرشیو اخبار" : "Archives"}</h2>`;
        html += `<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(280px,1fr));gap:15px;">`;
        archive.forEach(news => {
            html += `<div style="background:#fff;border:1px solid #e0e0e0;border-radius:8px;overflow:hidden;cursor:pointer;transition:transform 0.2s;" onclick="showNewsDetail('${news.id}')" onmouseover="this.style.transform='translateY(-4px)'" onmouseout="this.style.transform='translateY(0)'">`;
            html += `<img src="${news.image}" alt="${news.title}" style="width:100%;height:160px;object-fit:cover;">`;
            html += `<div style="padding:15px;">`;
            html += `<span style="background:#e8f5f0;color:#087F5B;padding:3px 8px;border-radius:4px;font-size:11px;font-weight:700;">${news.level}</span>`;
            html += `<h3 style="font-size:16px;font-weight:700;color:#1a1a1a;margin:10px 0 6px;line-height:1.4;">${lang === "fa" ? news.title_fa : news.title}</h3>`;
            html += `<p style="font-size:13px;color:#777;margin:0;">📅 ${news.publishedDate}</p>`;
            html += `</div></div>`;
        });
        html += `</div>`;
    }
    
    return html;
}

// ===============================
// 📰 صفحه جزئیات خبر
// ===============================
async function showNewsDetail(newsId) {
    const lang = localStorage.getItem("language") || "fr";
    const news = await loadNewsDetail(newsId);
    
    if (!news) {
        app.innerHTML = renderNavbar() + `<div style="text-align:center;padding:60px 16px;"><p>❌ خبر پیدا نشد</p><button onclick="showHome()" style="margin-top:15px;padding:10px 20px;border:1px solid #ddd;border-radius:6px;background:#fff;cursor:pointer;">${lang === "fa" ? "بازگشت" : "Retour"}</button></div>`;
        return;
    }
    
    let html = renderNavbar();
    html += `<div style="max-width:900px;margin:0 auto;padding:20px 16px 60px;">`;
    html += `<button class="back-btn" onclick="showHome()">← ${lang === "fa" ? "بازگشت" : "Retour"}</button>`;
    
    // تصویر بزرگ
    html += `<img src="${news.image}" alt="${news.imageAlt}" style="width:100%;max-height:500px;object-fit:cover;border-radius:12px;margin:20px 0;">`;
    
    // عنوان و متادیتا
    html += `<div style="display:flex;gap:10px;align-items:center;margin-bottom:15px;flex-wrap:wrap;">`;
    html += `<span style="background:#087F5B;color:#fff;padding:6px 12px;border-radius:6px;font-size:13px;font-weight:700;">${news.level}</span>`;
    html += `<span style="font-size:14px;color:#777;">📅 ${news.publishedDate}</span>`;
    html += `<span style="font-size:14px;color:#777;">📆 ${lang === "fa" ? "هفته" : "Semaine"} ${news.week}</span>`;
    html += `</div>`;
    
    html += `<h1 style="font-size:32px;font-weight:700;color:#1a1a1a;margin:0 0 10px;line-height:1.3;">${lang === "fa" ? news.title_fa : news.title}</h1>`;
    html += `<p style="font-size:17px;color:#555;margin:0 0 30px;">${lang === "fa" ? news.subtitle_fa : news.subtitle}</p>`;
    
    // انتخاب سطح متن
    html += `<div style="display:flex;gap:10px;margin-bottom:20px;background:#f9fafb;padding:10px;border-radius:8px;">`;
    html += `<button id="btn-full" onclick="switchNewsText('full')" style="flex:1;padding:10px;font-size:14px;font-weight:700;border:2px solid #087F5B;border-radius:6px;background:#087F5B;color:#fff;cursor:pointer;">📖 ${lang === "fa" ? "متن کامل (" + news.level + ")" : "Texte complet (" + news.level + ")"}</button>`;
    html += `<button id="btn-simple" onclick="switchNewsText('simple')" style="flex:1;padding:10px;font-size:14px;font-weight:600;border:2px solid #e0e0e0;border-radius:6px;background:#fff;color:#1a1a1a;cursor:pointer;">🌱 ${lang === "fa" ? "متن ساده (A1-B1)" : "Texte simple (A1-B1)"}</button>`;
    html += `</div>`;
    
    // متن کامل (پیش‌فرض)
    html += `<div id="news-full-text" style="background:#fff;border:1px solid #e0e0e0;border-radius:8px;padding:30px;margin-bottom:30px;">`;
    html += `<div style="font-size:16px;line-height:1.9;color:#333;white-space:pre-line;">${news.content.fullText}</div>`;
    html += `</div>`;
    
    // متن ساده (مخفی)
    html += `<div id="news-simple-text" style="display:none;background:#f0f9ff;border:1px solid #087F5B;border-radius:8px;padding:30px;margin-bottom:30px;">`;
    html += `<p style="font-size:13px;color:#087F5B;font-weight:700;margin:0 0 12px;">🌱 ${lang === "fa" ? "نسخه ساده‌شده برای سطوح A1-B1" : "Version simplifiée pour niveaux A1-B1"}</p>`;
    html += `<div style="font-size:16px;line-height:1.9;color:#333;white-space:pre-line;">${news.content.simpleText}</div>`;
    html += `</div>`;
    
    // واژگان
    if (news.content.vocabulary && news.content.vocabulary.length) {
        html += `<h2 style="font-size:22px;font-weight:700;margin:30px 0 15px;">📚 ${lang === "fa" ? "واژگان کلیدی" : "Vocabulaire clé"}</h2>`;
        html += `<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(280px,1fr));gap:10px;">`;
        news.content.vocabulary.forEach(word => {
            html += `<div style="background:#f9fafb;padding:12px 16px;border-radius:6px;border-left:4px solid #087F5B;">`;
            html += `<p class="ltr-lock" style="font-weight:700;color:#1a1a1a;margin:0 0 4px;font-size:15px;">${word.fr}</p>`;
            html += `<p class="persian-text" style="font-size:14px;color:#777;margin:0;">${word.fa}</p>`;
            html += `</div>`;
        });
        html += `</div>`;
    }
    
    // گرامر
    if (news.content.grammar && news.content.grammar.length) {
        html += `<h2 style="font-size:22px;font-weight:700;margin:30px 0 15px;">📐 ${lang === "fa" ? "نکات گرامری" : "Points de grammaire"}</h2>`;
        news.content.grammar.forEach((item, idx) => {
            html += `<div style="background:#fff;border:1px solid #e0e0e0;border-radius:8px;padding:20px;margin-bottom:15px;">`;
            html += `<h3 style="font-size:17px;font-weight:700;color:#087F5B;margin:0 0 12px;">${idx + 1}. ${item.title}</h3>`;
            html += `<div class="ltr-lock" style="background:#f9fafb;padding:12px;border-radius:6px;margin:10px 0;font-size:15px;line-height:1.7;border-left:3px solid #087F5B;">${item.example}</div>`;
            if (item.translation) {
                html += `<p class="persian-text" style="font-size:14px;color:#555;margin:10px 0;font-style:italic;">${item.translation}</p>`;
            }
            if (item.explanation) {
                html += `<p class="persian-text" style="font-size:14px;color:#777;margin:8px 0 0;">💡 ${item.explanation}</p>`;
            }
            html += `</div>`;
        });
    }
    
    // منابع
    if (news.sources && news.sources.length) {
        html += `<h2 style="font-size:22px;font-weight:700;margin:30px 0 15px;">📖 ${lang === "fa" ? "منابع" : "Sources"}</h2>`;
        html += `<div style="display:flex;flex-direction:column;gap:10px;">`;
        news.sources.forEach(source => {
            html += `<a href="${source.url}" target="_blank" style="padding:14px 18px;background:#fff;border:1px solid #e0e0e0;border-radius:8px;color:#087F5B;text-decoration:none;font-weight:600;display:flex;justify-content:space-between;align-items:center;transition:all 0.2s;" onmouseover="this.style.borderColor='#087F5B';this.style.background='#f0f9ff'" onmouseout="this.style.borderColor='#e0e0e0';this.style.background='#fff'">`;
            html += `<span>${source.title}</span>`;
            html += `<span>↗</span>`;
            html += `</a>`;
        });
        html += `</div>`;
    }
    
    html += `</div>`;
    app.innerHTML = html;
    window.scrollTo(0, 0);
}

// ===============================
// 🔄 تغییر بین متن کامل و ساده
// ===============================
function switchNewsText(mode) {
    const lang = localStorage.getItem("language") || "fr";
    const fullDiv = document.getElementById("news-full-text");
    const simpleDiv = document.getElementById("news-simple-text");
    const btnFull = document.getElementById("btn-full");
    const btnSimple = document.getElementById("btn-simple");
    
    if (mode === "full") {
        fullDiv.style.display = "block";
        simpleDiv.style.display = "none";
        btnFull.style.background = "#087F5B";
        btnFull.style.color = "#fff";
        btnFull.style.borderColor = "#087F5B";
        btnSimple.style.background = "#fff";
        btnSimple.style.color = "#1a1a1a";
        btnSimple.style.borderColor = "#e0e0e0";
    } else {
        fullDiv.style.display = "none";
        simpleDiv.style.display = "block";
        btnSimple.style.background = "#087F5B";
        btnSimple.style.color = "#fff";
        btnSimple.style.borderColor = "#087F5B";
        btnFull.style.background = "#fff";
        btnFull.style.color = "#1a1a1a";
        btnFull.style.borderColor = "#e0e0e0";
    }
}
