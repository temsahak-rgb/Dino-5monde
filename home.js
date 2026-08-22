// ===============================
// 📰 بخش اخبار (نسخه امن و ضدخطا)
// ===============================
async function renderNewsSection() {
    const lang = localStorage.getItem("language") || "fr";
    try {
        // تلاش برای خواندن فایل اخبار
        const response = await fetch("./data/news/news-index.json?v=" + Date.now());
        if (!response.ok) return ""; // اگر فایل نبود، خالی برگردان
        
        const allNews = await response.json();
        if (!allNews || !allNews.length) return ""; // اگر خالی بود، خالی برگردان
        
        const currentNews = allNews[0]; // آخرین خبر
        
        let html = "";
        html += `<div style="background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 4px 12px rgba(0,0,0,0.1);margin-bottom:30px;cursor:pointer;" onclick="showNewsDetail('${currentNews.id}')">`;
        html += `<div style="position:relative;height:350px;overflow:hidden;">`;
        html += `<img src="${currentNews.image}" alt="${currentNews.title}" style="width:100%;height:100%;object-fit:cover;">`;
        html += `<div style="position:absolute;top:15px;right:15px;display:flex;gap:8px;">`;
        html += `<span style="background:#087F5B;color:#fff;padding:6px 12px;border-radius:6px;font-size:13px;font-weight:700;">${currentNews.level}</span>`;
        html += `<span style="background:rgba(0,0,0,0.7);color:#fff;padding:6px 12px;border-radius:6px;font-size:13px;font-weight:700;">📰 ${lang === "fa" ? "خبر هفته" : "Actualité"}</span>`;
        html += `</div>`;
        html += `<div style="position:absolute;bottom:0;left:0;right:0;background:linear-gradient(to top, rgba(0,0,0,0.9), transparent);padding:25px;color:#fff;">`;
        html += `<h2 style="font-size:24px;font-weight:700;margin:0 0 8px;">${lang === "fa" ? currentNews.title_fa : currentNews.title}</h2>`;
        html += `<p style="font-size:15px;margin:0;opacity:0.9;">${lang === "fa" ? currentNews.subtitle_fa : currentNews.subtitle}</p>`;
        html += `</div></div>`;
        html += `<div style="padding:15px 25px;display:flex;justify-content:space-between;align-items:center;border-top:1px solid #f0f0f0;">`;
        html += `<span style="font-size:13px;color:#777;">📅 ${currentNews.publishedDate}</span>`;
        html += `<span style="font-size:14px;font-weight:700;color:#087F5B;">${lang === "fa" ? "مشاهده کامل ←" : "Lire la suite ←"}</span>`;
        html += `</div></div>`;
        
        return html;
    } catch (error) {
        console.warn("News section skipped:", error);
        return ""; // در صورت هرگونه خطا، سکوت کن و صفحه را خراب نکن
    }
}
// ===============================
// 🏠 صفحه اصلی مینیمال
// ===============================
async function showHome() {
    const lang = localStorage.getItem("language") || "fr";
    const level = getPlacementResult() || "A1";

    // بارگذاری موازی برای سرعت بیشتر
    const [g, t, d] = await Promise.all([
        loadGrammar(level).then(() => getGrammar(level).slice(0, 4)).catch(() => []),
        fetch("./data/travel/lessons.json").then(r => r.json()).catch(() => []),
        fetch("./data/daily/lessons.json").then(r => r.json()).catch(() => [])
    ]);
    
    const grammarLessons = g;
    const travelLessons = t.slice(0, 4);
    const dailyLessons = d.slice(0, 4);
    
    let html = renderNavbar();

    html += `<div style="max-width:960px;margin:0 auto;padding:32px 20px 60px;">
        <div style="display:flex;align-items:center;gap:16px;margin-bottom:8px;">
            <span style="font-size:48px;line-height:1;">🦖</span>
            <h1 style="font-size:30px;font-weight:700;color:#1a1a1a;margin:0;">${lang === "fa" ? "سلام، ادامه بده!" : "Bonjour, continuez !"}</h1>
        </div>
        <p style="font-size:17px;color:#777;margin:0 0 36px;">${level} · ${lang === "fa" ? "سطح فعلی شما" : "Votre niveau actuel"}</p>`;
    
    // اینجا اخبار تزریق می‌شود (اگر تابع بالا باشد، کار می‌کند)
    html += await renderNewsSection();
    
    html += `<div style="margin-bottom:45px;">
        ${sectionHeader(lang === "fa" ? "📰 اخبار و نکات" : "📰 Actualités & conseils", "", lang)}
        <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(280px,1fr));gap:14px;">
            <article style="background:#fff;border:1px solid #e0e0e0;border-radius:8px;overflow:hidden;cursor:pointer;grid-column:span 2;">
                <div style="height:180px;background:linear-gradient(135deg,#e8f5f0,#d0ebe1);display:flex;align-items:center;justify-content:center;font-size:64px;">📖</div>
                <div style="padding:18px;">
                    <p style="font-size:12px;font-weight:700;color:#087F5B;text-transform:uppercase;letter-spacing:1px;margin:0 0 10px;">GRAMMAIRE</p>
                    <h3 style="font-size:18px;font-weight:600;color:#1a1a1a;margin:0 0 10px;line-height:1.4;">${lang === "fa" ? "چگونه passé composé را درست استفاده کنیم؟" : "Comment bien utiliser le passé composé ?"}</h3>
                    <p style="font-size:13px;color:#888;margin:0;">${lang === "fa" ? "امروز · ۵ دقیقه مطالعه" : "Aujourd'hui · 5 min de lecture"}</p>
                </div>
            </article>
            <article style="background:#fff;border:1px solid #e0e0e0;border-radius:8px;overflow:hidden;cursor:pointer;">
                <div style="height:120px;background:linear-gradient(135deg,#fef3e2,#fde5c8);display:flex;align-items:center;justify-content:center;font-size:48px;">🏦</div>
                <div style="padding:16px;">
                    <p style="font-size:12px;font-weight:700;color:#d97706;text-transform:uppercase;letter-spacing:1px;margin:0 0 8px;">VIE QUOTIDIENNE</p>
                    <h3 style="font-size:16px;font-weight:600;color:#1a1a1a;margin:0 0 8px;line-height:1.4;">${lang === "fa" ? "۱۰ عبارت ضروری برای حساب بانکی" : "10 expressions pour ouvrir un compte bancaire"}</h3>
                    <p style="font-size:13px;color:#888;margin:0;">${lang === "fa" ? "دیروز · ۴ دقیقه" : "Hier · 4 min"}</p>
                </div>
            </article>
            <article style="background:#fff;border:1px solid #e0e0e0;border-radius:8px;overflow:hidden;cursor:pointer;">
                <div style="height:120px;background:linear-gradient(135deg,#e8f0fe,#d5e5fc);display:flex;align-items:center;justify-content:center;font-size:48px;">✈️</div>
                <div style="padding:16px;">
                    <p style="font-size:12px;font-weight:700;color:#2563eb;text-transform:uppercase;letter-spacing:1px;margin:0 0 8px;">VOYAGE</p>
                    <h3 style="font-size:16px;font-weight:600;color:#1a1a1a;margin:0 0 8px;line-height:1.4;">${lang === "fa" ? "راهنمای فرودگاه شارل دوگل" : "Guide complet de l'aéroport CDG"}</h3>
                    <p style="font-size:13px;color:#888;margin:0;">${lang === "fa" ? "۲ روز پیش · ۶ دقیقه" : "Il y a 2 jours · 6 min"}</p>
                </div>
            </article>
            <article style="background:#fffbeb;border:1px solid #fde68a;border-radius:8px;overflow:hidden;cursor:pointer;">
                <div style="height:120px;background:linear-gradient(135deg,#fef9c3,#fde68a);display:flex;align-items:center;justify-content:center;font-size:48px;">✨</div>
                <div style="padding:16px;">
                    <p style="font-size:12px;font-weight:700;color:#b45309;text-transform:uppercase;letter-spacing:1px;margin:0 0 8px;">✨ ${lang === "fa" ? "نکته روز" : "ASTUCE DU JOUR"}</p>
                    <h3 style="font-size:16px;font-weight:600;color:#1a1a1a;margin:0 0 8px;line-height:1.4;">${lang === "fa" ? "در فرانسه همیشه اول Bonjour بگویید!" : "En France, dites toujours Bonjour en premier !"}</h3>
                    <p style="font-size:13px;color:#888;margin:0;">${lang === "fa" ? "ادب فرانسوی" : "Politesse française"}</p>
                </div>
            </article>
        </div>
    </div>`;

    html += `<div style="margin-bottom:40px;">
        ${sectionHeader(lang === "fa" ? "📚 گرامر" : "📚 Grammaire", "switchSection('grammar')", lang)}
        <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(200px,1fr));gap:12px;">
            ${grammarLessons.map(l => simpleCard(l.icon || "📗", lang === "fa" ? l.title_fa : l.title, `${l.level} · ${l.estimatedTime} min`, `showGrammarLesson('${l.id}')`)).join("")}
        </div>
    </div>`;

    html += `<div style="margin-bottom:40px;">
        ${sectionHeader(lang === "fa" ? "📖 واژگان" : "📖 Vocabulaire", "switchSection('vocabulary')", lang)}
        <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(200px,1fr));gap:12px;">
            ${simpleCard("👕", lang === "fa" ? "لباس و پوشاک" : "Vêtements", lang === "fa" ? "۱۵ کلمه" : "15 mots", "switchSection('vocabulary')")}
            ${simpleCard("🥐", lang === "fa" ? "صبحانه در هتل" : "Petit-déjeuner", lang === "fa" ? "۱۵ کلمه" : "15 mots", "switchSection('vocabulary')")}
            ${simpleCard("🍽️", lang === "fa" ? "غذا و رستوران" : "Nourriture", lang === "fa" ? "۱۵ کلمه" : "15 mots", "switchSection('vocabulary')")}
            ${simpleCard("👨‍👩‍👧", lang === "fa" ? "خانواده" : "Famille", lang === "fa" ? "۱۵ کلمه" : "15 mots", "switchSection('vocabulary')")}
        </div>
    </div>`;

    html += `<div style="margin-bottom:40px;">
        ${sectionHeader(lang === "fa" ? "🏘️ زندگی روزمره" : "🏘️ Vie quotidienne", "switchSection('daily')", lang)}
        <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(200px,1fr));gap:12px;">
            ${dailyLessons.map(l => simpleCard(l.icon || "🏠", lang === "fa" ? l.title_fa : l.title, `${l.estimatedTime} min`, `showDailyLesson('${l.id}')`)).join("")}
        </div>
    </div>`;

    html += `<div style="margin-bottom:40px;">
        ${sectionHeader(lang === "fa" ? "✈️ سفر" : "✈️ Voyage", "switchSection('travel')", lang)}
        <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(200px,1fr));gap:12px;">
            ${travelLessons.map(l => simpleCard(l.icon || "✈️", lang === "fa" ? l.title_fa : l.title, `${l.estimatedTime} min`, `showTravelLesson('${l.id}')`)).join("")}
        </div>
    </div>`;

    html += `<div style="margin-bottom:40px;">
        ${sectionHeader(lang === "fa" ? "🎮 بازی و تمرین" : "🎮 Jeux & exercices", "", lang)}
        <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(200px,1fr));gap:12px;">
            ${simpleCard("🎮", lang === "fa" ? "بازی‌ها" : "Jeux", lang === "fa" ? "یادگیری با سرگرمی" : "Apprendre en jouant", "switchSection('games')")}
            ${simpleCard("📝", lang === "fa" ? "تمرین‌ها" : "Exercices", lang === "fa" ? "تثبیت یادگیری" : "Consolider", "switchSection('exercises')")}
            ${simpleCard("📊", lang === "fa" ? "تعیین سطح" : "Test", lang === "fa" ? "سطح خود را بسنجید" : "Évaluer votre niveau", "showPlacementChoice()")}
        </div>
    </div>
    </div>`;

    app.innerHTML = html;
}
