// script.js

const app = document.getElementById("app");

// ===============================
// تابع رندر متن فارسی
// ===============================
function renderFaText(text) {
    if (!text) return "";
    return `<span class="persian-text">${text}</span>`;
}

// ===============================
// تابع Markdown
// ===============================
function renderMarkdown(text) {
    if (!text) return "";
    let html = text
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/^### (.*$)/gm, '<h4 style="margin-top:20px;margin-bottom:10px;color:#333;font-size:16px;font-weight:700;">$1</h4>')
        .replace(/^## (.*$)/gm, '<h3 style="margin-top:24px;margin-bottom:12px;color:#333;font-size:18px;font-weight:700;">$1</h3>')
        .replace(/^# (.*$)/gm, '<h2 style="margin-top:28px;margin-bottom:14px;color:#1a1a1a;font-size:20px;font-weight:700;">$1</h2>')
        .replace(/^- (.*$)/gm, '<li style="margin-bottom:6px;line-height:1.6;">$1</li>')
        .replace(/(<li>.*?<\/li>(\s*<li>.*?<\/li>)*)/gs, '<ul style="margin:12px 0;padding-right:22px;list-style-type:disc;color:#333;">$1</ul>')
        .replace(/\*\*(.*?)\*\*/g, '<strong style="font-weight:700;color:#1a1a1a;">$1</strong>')
        .replace(/\*(.*?)\*/g, '<em style="font-style:italic;color:#555;">$1</em>')
        .replace(/`(.*?)`/g, '<code style="background:#f0f0f0;color:#c7254e;padding:2px 6px;border-radius:3px;font-family:monospace;font-size:0.9em;">$1</code>')
        .replace(/~~(.*?)~~/g, '<del style="color:#999;text-decoration:line-through;">$1</del>')
        .replace(/\[(.*?)\]\[red\]/g, '<span style="color:#dc2626;font-weight:700;">$1</span>')
        .replace(/\n/g, '<br>');
    return html;
}

// ===============================
// متون رابط کاربری
// ===============================
const texts = {
    fr: {
        title: "Français avec Dino", chooseLanguage: "Choisissez la langue", choosePath: "Choisissez votre parcours",
        french: "Français", persian: "فارسی", general: "Français général", travel: "Français Voyage", daily: "Français Quotidien",
        levelQuestion: "Souhaitez-vous passer un test de niveau ?", yes: "Passer le test", later: "Plus tard",
        home: "Accueil", back: "Retour", dontKnow: "Je ne sais pas", finalResult: "Résultat du test",
        yourLevel: "Votre niveau estimé", canModify: "Vous pourrez toujours le modifier plus tard.",
        acceptLevel: "Accepter ce niveau", changeLevel: "Changer de niveau", chooseYourLevel: "Choisissez votre niveau",
        hello: "Bonjour", vocabulary: "Vocabulaire", grammar: "Grammaire", listening: "Compréhension orale",
        revision: "Révision", continue: "Continuer", level: "Niveau"
    },
    fa: {
        title: "Français avec Dino", chooseLanguage: "زبان خود را انتخاب کنید", choosePath: "مسیر یادگیری خود را انتخاب کنید",
        french: "Français", persian: "فارسی", general: "فرانسوی عمومی", travel: "فرانسوی در سفر", daily: "فرانسوی روزمره",
        levelQuestion: "آیا می‌خواهید ابتدا تعیین سطح انجام دهید؟", yes: "انجام تعیین سطح", later: "بعداً",
        home: "صفحه اصلی", back: "بازگشت", dontKnow: "نمی‌دانم", finalResult: "نتیجه تعیین سطح",
        yourLevel: "سطح تقریبی شما", canModify: "بعداً هم می‌توانید آن را تغییر دهید.",
        acceptLevel: "قبول این سطح", changeLevel: "تغییر سطح", chooseYourLevel: "سطح خود را انتخاب کنید",
        hello: "سلام", vocabulary: "واژگان", grammar: "گرامر", listening: "درک شنیداری",
        revision: "مرور", continue: "ادامه", level: "سطح"
    }
};

// ===============================
// 🟢 نوار ناوبری نازک + همبرگری
// ===============================
function renderNavbar() {
    const lang = localStorage.getItem("language") || "fr";
    const cs = localStorage.getItem("currentSection") || "home";

    const item = (sec, label) => {
        const active = cs === sec;
        return `<button onclick="switchSection('${sec}')" style="
            background:none;border:none;border-bottom:2px solid ${active ? '#fff' : 'transparent'};
            color:${active ? '#fff' : 'rgba(255,255,255,0.7)'};font-size:13px;
            font-weight:${active ? '700' : '500'};cursor:pointer;padding:0 12px;
            line-height:48px;margin:0;transition:color 0.15s,border-color 0.15s;
        " onmouseover="this.style.color='#fff'" onmouseout="this.style.color='${active ? '#fff' : 'rgba(255,255,255,0.7)'}'">${label}</button>`;
    };

    return `
    <nav style="background:#087F5B;height:48px;display:flex;align-items:center;justify-content:space-between;padding:0 16px;position:sticky;top:0;z-index:1000;">
        <div onclick="switchSection('home')" style="cursor:pointer;display:flex;align-items:center;gap:6px;">
            <span style="font-size:16px;">🦖</span>
            <span style="color:#fff;font-size:14px;font-weight:700;">Français avec Dino</span>
        </div>
        <button id="menu-toggle" style="display:none;background:none;border:none;color:#fff;font-size:20px;cursor:pointer;padding:4px 8px;margin:0;line-height:1;">☰</button>
        <div id="nav-links" style="display:flex;align-items:center;gap:0;">
            ${item('grammar', lang === "fa" ? "گرامر" : "Grammaire")}
            ${item('daily', lang === "fa" ? "روزمره" : "Quotidien")}
            ${item('travel', lang === "fa" ? "سفر" : "Voyage")}
            ${item('games', lang === "fa" ? "بازی" : "Jeux")}
            ${item('exercises', lang === "fa" ? "تمرین" : "Exercices")}
            <button onclick="switchSection('profile')" style="background:none;border:none;color:#fff;font-size:15px;cursor:pointer;padding:0 0 0 10px;margin:0;line-height:48px;">👤</button>
        </div>
    </nav>
    <style>
        @media(max-width:768px){
            #menu-toggle{display:block!important;}
            #nav-links{display:none!important;position:absolute;top:48px;left:0;right:0;background:#087F5B;flex-direction:column;padding:4px 0;box-shadow:0 4px 12px rgba(0,0,0,0.15);}
            #nav-links.open{display:flex!important;}
            #nav-links button{width:100%;text-align:left;padding:12px 16px!important;line-height:1.4!important;border-bottom:1px solid rgba(255,255,255,0.1)!important;}
        }
    </style>
    <script>document.getElementById('menu-toggle').onclick=function(){document.getElementById('nav-links').classList.toggle('open');};</script>`;
}

// ===============================
// تغییر بخش
// ===============================
async function switchSection(section) {
    localStorage.setItem("currentSection", section);
    switch (section) {
        case 'home': showHome(); break;
        case 'grammar': showGrammarPage(); break;
        case 'vocabulary': showVocabularyPage(); break;
        case 'daily': showDailyHome(); break;
        case 'travel': showTravelHome(); break;
        case 'games': showGamesPage(); break;
        case 'exercises': showExercisesPage(); break;
        case 'profile': showProfile(); break;
    }
}

// ===============================
// کارت ساده مینیمال
// ===============================
function simpleCard(icon, title, meta, onclick) {
    return `<div onclick="${onclick}" style="
        background:#fff;border:1px solid #e0e0e0;border-radius:8px;padding:16px;
        cursor:pointer;transition:border-color 0.15s;
    " onmouseover="this.style.borderColor='#087F5B'" onmouseout="this.style.borderColor='#e0e0e0'">
        <div style="display:flex;align-items:center;gap:10px;margin-bottom:8px;">
            <span style="font-size:22px;">${icon}</span>
            <span style="font-size:16px;font-weight:600;color:#1a1a1a;line-height:1.3;">${title}</span>
        </div>
        <p style="margin:0;font-size:13px;color:#777;">${meta}</p>
    </div>`;
}
//======
//header
//=====
function sectionHeader(title, moreOnclick, lang) {
    return `<div style="display:flex;justify-content:space-between;align-items:baseline;margin-bottom:14px;border-bottom:2px solid #1a1a1a;padding-bottom:10px;">
        <h2 style="margin:0;font-size:20px;font-weight:700;color:#1a1a1a;">${title}</h2>
        ${moreOnclick ? `<span onclick="${moreOnclick}" style="font-size:14px;color:#087F5B;cursor:pointer;font-weight:600;">${lang === "fa" ? "همه →" : "Tout →"}</span>` : ''}
    </div>`;
}
// ===============================
// 🏠 صفحه اصلی مینیمال
// ===============================
async function showHome() {
    const lang = localStorage.getItem("language") || "fr";
    const level = getPlacementResult() || "A1";

    let grammarLessons = [];
    try { await loadGrammar(level); grammarLessons = getGrammar(level).slice(0, 4); } catch (e) {}
    let travelLessons = [];
    try { const r = await fetch("./data/travel/lessons.json"); travelLessons = (await r.json()).slice(0, 4); } catch (e) {}
    let dailyLessons = [];
    try { const r = await fetch("./data/daily/lessons.json"); dailyLessons = (await r.json()).slice(0, 4); } catch (e) {}

    let html = renderNavbar();

    html += `<div style="max-width:960px;margin:0 auto;padding:32px 20px 60px;">
        <div style="display:flex;align-items:center;gap:16px;margin-bottom:8px;">
            <span style="font-size:48px;line-height:1;">🦖</span>
            <h1 style="font-size:30px;font-weight:700;color:#1a1a1a;margin:0;">${lang === "fa" ? "سلام، ادامه بده!" : "Bonjour, continuez !"}</h1>
        </div>
        <p style="font-size:17px;color:#777;margin:0 0 36px;">${level} · ${lang === "fa" ? "سطح فعلی شما" : "Votre niveau actuel"}</p>`;

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
            ${simpleCard("", lang === "fa" ? "لباس و پوشاک" : "Vêtements", lang === "fa" ? "۱۵ کلمه" : "15 mots", "switchSection('vocabulary')")}
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
// ===============================
// صفحات Placeholder مینیمال
// ===============================
function placeholderPage(icon, titleFa, titleFr) {
    const lang = localStorage.getItem("language") || "fr";
    let html = renderNavbar();
    html += `<div style="max-width:900px;margin:0 auto;padding:60px 16px;text-align:center;">
        <div style="font-size:48px;margin-bottom:16px;">${icon}</div>
        <h1 style="font-size:22px;color:#1a1a1a;margin-bottom:10px;">${lang === "fa" ? titleFa : titleFr}</h1>
        <p style="font-size:14px;color:#777;">${lang === "fa" ? "این بخش به زودی فعال می‌شود." : "Cette section sera bientôt disponible."}</p>
    </div>`;
    app.innerHTML = html;
}

function showGamesPage() { placeholderPage("🎮", "بازی‌های آموزشی", "Jeux éducatifs"); }
function showExercisesPage() { placeholderPage("📝", "تمرین‌ها و آزمون‌ها", "Exercices et tests"); }
function showProfile() { placeholderPage("👤", "پروفایل من", "Mon profil"); }

// ===============================
// صفحات مسیرها (مینیمال)
// ===============================
async function showDailyHome() {
    const lang = localStorage.getItem("language") || "fr";
    let html = renderNavbar();
    html += `<div style="max-width:900px;margin:0 auto;padding:24px 16px 50px;">
        <h1 style="font-size:22px;font-weight:700;color:#1a1a1a;margin:0 0 4px;">${lang === "fa" ? "🏘️ فرانسوی روزمره" : "🏘️ Français quotidien"}</h1>
        <p style="font-size:13px;color:#777;margin:0 0 30px;">${lang === "fa" ? "برای زندگی در فرانسه" : "Pour vivre en France"}</p>
        <p style="font-size:14px;color:#777;text-align:center;padding:40px 0;">${lang === "fa" ? "🏗️ در حال آماده‌سازی..." : "🏗️ En cours de préparation..."}</p>
    </div>`;
    app.innerHTML = html;
}

async function showTravelHome() {
    const lang = localStorage.getItem("language") || "fr";
    let html = renderNavbar();
    html += `<div style="max-width:900px;margin:0 auto;padding:24px 16px 50px;">
        <h1 style="font-size:22px;font-weight:700;color:#1a1a1a;margin:0 0 4px;">${lang === "fa" ? "✈️ فرانسوی در سفر" : "✈️ Français voyage"}</h1>
        <p style="font-size:13px;color:#777;margin:0 0 30px;">${lang === "fa" ? "۱۸ درس برای سفری بی‌نقص" : "18 leçons pour un voyage parfait"}</p>
        <p style="font-size:14px;color:#777;text-align:center;padding:40px 0;">${lang === "fa" ? "🏗️ در حال آماده‌سازی..." : "🏗️ En cours de préparation..."}</p>
    </div>`;
    app.innerHTML = html;
}

function showGamesPage() { placeholderPage("🎮", "بازی‌های آموزشی", "Jeux éducatifs"); }
function showExercisesPage() { placeholderPage("📝", "تمرین‌ها و آزمون‌ها", "Exercices et tests"); }
function showProfile() { placeholderPage("👤", "پروفایل من", "Mon profil"); }

// ===============================
// صفحات مسیرها (مینیمال)
// ===============================
async function showDailyHome() {
    const lang = localStorage.getItem("language") || "fr";
    let html = renderNavbar();
    html += `<div style="max-width:900px;margin:0 auto;padding:24px 16px 50px;">
        <h1 style="font-size:22px;font-weight:700;color:#1a1a1a;margin:0 0 4px;">${lang === "fa" ? "🏘️ فرانسوی روزمره" : "🏘️ Français quotidien"}</h1>
        <p style="font-size:13px;color:#777;margin:0 0 30px;">${lang === "fa" ? "برای زندگی در فرانسه" : "Pour vivre en France"}</p>
        <p style="font-size:14px;color:#777;text-align:center;padding:40px 0;">${lang === "fa" ? "🏗️ در حال آماده‌سازی..." : "🏗️ En cours de préparation..."}</p>
    </div>`;
    app.innerHTML = html;
}

async function showTravelHome() {
    const lang = localStorage.getItem("language") || "fr";
    let html = renderNavbar();
    html += `<div style="max-width:900px;margin:0 auto;padding:24px 16px 50px;">
        <h1 style="font-size:22px;font-weight:700;color:#1a1a1a;margin:0 0 4px;">${lang === "fa" ? "✈️ فرانسوی در سفر" : "✈️ Français voyage"}</h1>
        <p style="font-size:13px;color:#777;margin:0 0 30px;">${lang === "fa" ? "۱۸ درس برای سفری بی‌نقص" : "18 leçons pour un voyage parfait"}</p>
        <p style="font-size:14px;color:#777;text-align:center;padding:40px 0;">${lang === "fa" ? "🏗️ در حال آماده‌سازی..." : "🏗️ En cours de préparation..."}</p>
    </div>`;
    app.innerHTML = html;
}

// ===============================
// درس‌های روزمره و سفر
// ===============================
async function showDailyLesson(lessonId) {
    app.innerHTML = renderNavbar() + `<div style="text-align:center;padding:60px 16px;"><p style="font-size:14px;color:#777;">⏳ ...</p></div>`;
    const lessonData = await loadSpecificLesson("daily", lessonId);
    if (!lessonData) { app.innerHTML = renderNavbar() + `<div style="text-align:center;padding:60px 16px;"><p style="font-size:14px;color:#777;">🚧 به زودی</p><button onclick="showHome()" style="margin-top:15px;padding:10px 20px;border:1px solid #ddd;border-radius:6px;background:#fff;color:#1a1a1a;cursor:pointer;">بازگشت</button></div>`; return; }
    showLessonContent(lessonId, lessonData.sections[0]);
}

async function showTravelLesson(lessonId) {
    app.innerHTML = renderNavbar() + `<div style="text-align:center;padding:60px 16px;"><p style="font-size:14px;color:#777;">⏳ ...</p></div>`;
    const lessonData = await loadSpecificLesson("travel", lessonId);
    if (!lessonData) { app.innerHTML = renderNavbar() + `<div style="text-align:center;padding:60px 16px;"><p style="font-size:14px;color:#777;">🚧 به زودی</p><button onclick="showHome()" style="margin-top:15px;padding:10px 20px;border:1px solid #ddd;border-radius:6px;background:#fff;color:#1a1a1a;cursor:pointer;">بازگشت</button></div>`; return; }
    showLessonContent(lessonId, lessonData.sections[0]);
}

// ===============================
// تمرین
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

// ===============================
// شروع
// ===============================
showLanguage();
loadPlacementQuestions().then(() => { console.log("✅ موتور آماده. سوالات:", getPlacementQuestions().length); });
