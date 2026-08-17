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
        background:#fff;border:1px solid #e0e0e0;border-radius:6px;padding:14px;
        cursor:pointer;transition:border-color 0.15s;
    " onmouseover="this.style.borderColor='#087F5B'" onmouseout="this.style.borderColor='#e0e0e0'">
        <div style="display:flex;align-items:center;gap:8px;margin-bottom:6px;">
            <span style="font-size:18px;">${icon}</span>
            <span style="font-size:14px;font-weight:600;color:#1a1a1a;line-height:1.3;">${title}</span>
        </div>
        <p style="margin:0;font-size:12px;color:#777;">${meta}</p>
    </div>`;
}

// تیتر بخش مینیمال
function sectionHeader(title, moreOnclick, lang) {
    return `<div style="display:flex;justify-content:space-between;align-items:baseline;margin-bottom:10px;border-bottom:1px solid #ddd;padding-bottom:8px;">
        <h2 style="margin:0;font-size:16px;font-weight:700;color:#1a1a1a;">${title}</h2>
        ${moreOnclick ? `<span onclick="${moreOnclick}" style="font-size:12px;color:#087F5B;cursor:pointer;font-weight:600;">${lang === "fa" ? "همه →" : "Tout →"}</span>` : ''}
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
    html += `<div style="max-width:900px;margin:0 auto;padding:24px 16px 50px;">
        <h1 style="font-size:22px;font-weight:700;color:#1a1a1a;margin:0 0 4px;">${lang === "fa" ? "سلام، ادامه بده 👋" : "Bonjour, continuez 👋"}</h1>
        <p style="font-size:13px;color:#777;margin:0 0 30px;">${level} · ${lang === "fa" ? "سطح فعلی" : "Niveau actuel"}</p>

        <div style="margin-bottom:35px;">
            ${sectionHeader(lang === "fa" ? "گرامر" : "Grammaire", "switchSection('grammar')", lang)}
            <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(190px,1fr));gap:10px;">
                ${grammarLessons.map(l => simpleCard(l.icon || "📗", lang === "fa" ? l.title_fa : l.title, `${l.level} · ${l.estimatedTime} min`, `showGrammarLesson('${l.id}')`)).join("")}
            </div>
        </div>

        <div style="margin-bottom:35px;">
            ${sectionHeader(lang === "fa" ? "زندگی روزمره" : "Vie quotidienne", "switchSection('daily')", lang)}
            <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(190px,1fr));gap:10px;">
                ${dailyLessons.map(l => simpleCard(l.icon || "🏠", lang === "fa" ? l.title_fa : l.title, `${l.estimatedTime} min`, `showDailyLesson('${l.id}')`)).join("")}
            </div>
        </div>

        <div style="margin-bottom:35px;">
            ${sectionHeader(lang === "fa" ? "سفر" : "Voyage", "switchSection('travel')", lang)}
            <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(190px,1fr));gap:10px;">
                ${travelLessons.map(l => simpleCard(l.icon || "✈️", lang === "fa" ? l.title_fa : l.title, `${l.estimatedTime} min`, `showTravelLesson('${l.id}')`)).join("")}
            </div>
        </div>

        <div style="margin-bottom:35px;">
            ${sectionHeader(lang === "fa" ? "بازی و تمرین" : "Jeux & exercices", "", lang)}
            <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(190px,1fr));gap:10px;">
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

// ===============================
// 🦖 انتخاب زبان (با دایناسور)
// ===============================
function showLanguage() {
    const lang = localStorage.getItem("language") || "fr";
    const t = texts[lang];
    app.innerHTML = `<div style="max-width:400px;margin:80px auto;padding:0 16px;text-align:center;">
        <div style="font-size:64px;margin-bottom:20px;">🦖</div>
        <h1 style="font-size:24px;color:#1a1a1a;margin-bottom:8px;">${t.title}</h1>
        <p style="font-size:14px;color:#777;margin-bottom:30px;">${t.chooseLanguage}</p>
        <button id="fr" style="width:100%;padding:14px;margin-bottom:10px;border:1px solid #ddd;border-radius:6px;background:#fff;font-size:16px;color:#1a1a1a;cursor:pointer;transition:border-color 0.15s;" onmouseover="this.style.borderColor='#087F5B'" onmouseout="this.style.borderColor='#ddd'">${t.french}</button>
        <button id="fa" style="width:100%;padding:14px;border:1px solid #ddd;border-radius:6px;background:#fff;font-size:16px;color:#1a1a1a;cursor:pointer;transition:border-color 0.15s;" onmouseover="this.style.borderColor='#087F5B'" onmouseout="this.style.borderColor='#ddd'">${t.persian}</button>
    </div>`;
    document.getElementById("fr").onclick = () => { localStorage.setItem("language", "fr"); showPath(); };
    document.getElementById("fa").onclick = () => { localStorage.setItem("language", "fa"); showPath(); };
}

// ===============================
// 🦖 انتخاب مسیر (با دایناسور)
// ===============================
function showPath() {
    const lang = localStorage.getItem("language") || "fr";
    const t = texts[lang];
    app.innerHTML = `<div style="max-width:400px;margin:60px auto;padding:0 16px;">
        <div style="font-size:48px;margin-bottom:16px;text-align:center;">🦖</div>
        <button id="back" class="back-btn" style="background:none;border:none;color:#087F5B;font-size:13px;cursor:pointer;padding:0;margin-bottom:16px;">← ${t.back}</button>
        <h1 style="font-size:22px;color:#1a1a1a;margin-bottom:20px;">${t.choosePath}</h1>
        <button id="general" style="width:100%;padding:14px;margin-bottom:10px;border:1px solid #ddd;border-radius:6px;background:#fff;font-size:15px;color:#1a1a1a;cursor:pointer;text-align:left;transition:border-color 0.15s;" onmouseover="this.style.borderColor='#087F5B'" onmouseout="this.style.borderColor='#ddd'">🇫🇷 ${t.general}</button>
        <button id="travel" style="width:100%;padding:14px;margin-bottom:10px;border:1px solid #ddd;border-radius:6px;background:#fff;font-size:15px;color:#1a1a1a;cursor:pointer;text-align:left;transition:border-color 0.15s;" onmouseover="this.style.borderColor='#087F5B'" onmouseout="this.style.borderColor='#ddd'">✈️ ${t.travel}</button>
        <button id="daily" style="width:100%;padding:14px;border:1px solid #ddd;border-radius:6px;background:#fff;font-size:15px;color:#1a1a1a;cursor:pointer;text-align:left;transition:border-color 0.15s;" onmouseover="this.style.borderColor='#087F5B'" onmouseout="this.style.borderColor='#ddd'">🏘️ ${t.daily}</button>
    </div>`;
    document.getElementById("back").onclick = showLanguage;
    document.getElementById("general").onclick = showPlacementChoice;
    document.getElementById("travel").onclick = () => { localStorage.setItem("currentPath", "travel"); showHome(); };
    document.getElementById("daily").onclick = () => { localStorage.setItem("currentPath", "daily"); showHome(); };
}

// ===============================
// 🦖 تعیین سطح (با دایناسور)
// ===============================
function showPlacementChoice() {
    const lang = localStorage.getItem("language") || "fr";
    const t = texts[lang];
    app.innerHTML = `<div style="max-width:400px;margin:60px auto;padding:0 16px;">
        <div style="font-size:48px;margin-bottom:16px;text-align:center;">🦖</div>
        <button id="back" class="back-btn" style="background:none;border:none;color:#087F5B;font-size:13px;cursor:pointer;padding:0;margin-bottom:16px;">← ${t.back}</button>
        <h1 style="font-size:22px;color:#1a1a1a;margin-bottom:10px;">${t.general}</h1>
        <p style="font-size:14px;color:#777;margin-bottom:25px;">${t.levelQuestion}</p>
        <button id="yes" style="width:100%;padding:14px;margin-bottom:10px;border:none;border-radius:6px;background:#087F5B;color:#fff;font-size:15px;cursor:pointer;">${t.yes}</button>
        <button id="later" style="width:100%;padding:14px;border:1px solid #ddd;border-radius:6px;background:#fff;font-size:15px;color:#1a1a1a;cursor:pointer;">${t.later}</button>
    </div>`;
    document.getElementById("back").onclick = showPath;
    document.getElementById("later").onclick = showHome;
    document.getElementById("yes").onclick = () => { resetPlacementState(); showQuestion(); };
}

// ===============================
// 🦖 سوالات تعیین سطح (با دایناسور + اصلاح رنگ)
// ===============================
function showQuestion() {
    const question = getNextQuestion();
    if (!question) { showFinalResult(); return; }
    const lang = localStorage.getItem("language") || "fr";
    const t = texts[lang];
    const progress = (placementState.asked.length / 15) * 100;

    let html = `<div style="max-width:600px;margin:0 auto;padding:30px 16px;">
        <div style="text-align:center;font-size:32px;margin-bottom:16px;">🦖</div>
        <div style="background:#e0e0e0;height:4px;border-radius:2px;margin-bottom:25px;overflow:hidden;">
            <div style="background:#087F5B;height:100%;width:${progress}%;transition:width 0.3s;"></div>
        </div>
        <div style="background:#fff;border:1px solid #e0e0e0;border-radius:8px;padding:30px;">
            <p class="ltr-lock" style="font-size:18px;margin:0 0 25px;line-height:1.6;color:#1a1a1a;font-weight:500;">${question.question}</p>
            <div style="display:flex;flex-direction:column;gap:10px;">`;

    question.options.forEach((option, index) => {
        html += `<button class="option-btn ltr-lock" data-index="${index}" style="width:100%;padding:14px;font-size:15px;border:1px solid #e0e0e0;border-radius:6px;background:#fafafa;color:#1a1a1a;cursor:pointer;text-align:left;transition:all 0.15s;font-weight:500;">${option}</button>`;
    });

    html += `</div><button id="dont-know" style="width:100%;margin-top:15px;padding:12px;font-size:14px;border:1px solid #dc2626;border-radius:6px;background:#fff;color:#dc2626;cursor:pointer;font-weight:600;">${t.dontKnow}</button></div></div>`;
    app.innerHTML = html;

    document.querySelectorAll(".option-btn").forEach(btn => {
        btn.onclick = () => {
            const selectedIndex = parseInt(btn.getAttribute("data-index"));
            const isCorrect = selectedIndex === question.correctIndex;
            answerPlacement(isCorrect);
            if (isCorrect) { btn.style.background = "#d4edda"; btn.style.borderColor = "#28a745"; btn.style.color = "#155724"; }
            else { btn.style.background = "#f8d7da"; btn.style.borderColor = "#dc3545"; btn.style.color = "#721c24"; document.querySelectorAll(".option-btn")[question.correctIndex].style.background = "#d4edda"; document.querySelectorAll(".option-btn")[question.correctIndex].style.borderColor = "#28a745"; document.querySelectorAll(".option-btn")[question.correctIndex].style.color = "#155724"; }
            document.querySelectorAll(".option-btn").forEach(b => { b.onclick = null; b.style.cursor = "default"; });
            document.getElementById("dont-know").onclick = null; document.getElementById("dont-know").style.cursor = "default";
            setTimeout(() => { showQuestion(); }, 1500);
        };
    });
    document.getElementById("dont-know").onclick = () => {
        answerPlacement(null);
        document.getElementById("dont-know").style.backgroundColor = "#f8d7da"; document.getElementById("dont-know").style.color = "#721c24";
        document.querySelectorAll(".option-btn")[question.correctIndex].style.backgroundColor = "#d4edda"; document.querySelectorAll(".option-btn")[question.correctIndex].style.color = "#155724"; document.querySelectorAll(".option-btn")[question.correctIndex].style.borderColor = "#28a745";
        document.querySelectorAll(".option-btn").forEach(b => { b.onclick = null; b.style.cursor = "default"; });
        document.getElementById("dont-know").onclick = null; document.getElementById("dont-know").style.cursor = "default";
        setTimeout(() => { showQuestion(); }, 1500);
    };
}

// ===============================
// 🦖 نتیجه تعیین سطح (با دایناسور)
// ===============================
function showFinalResult() {
    const levelInfo = getEstimatedLevelRange();
    const lang = localStorage.getItem("language") || "fr";
    const t = texts[lang];
    app.innerHTML = `<div style="text-align:center;padding:50px 16px;max-width:500px;margin:0 auto;">
        <div style="font-size:48px;margin-bottom:16px;">🦖</div>
        <h1 style="font-size:24px;color:#1a1a1a;margin-bottom:16px;">🎉 ${t.finalResult}</h1>
        <p style="font-size:14px;color:#777;margin-bottom:8px;">${t.yourLevel} :</p>
        <h2 style="font-size:48px;color:#087F5B;margin:15px 0;font-weight:800;">${levelInfo.range}</h2>
        <p style="font-size:14px;color:#777;margin:20px 0;line-height:1.6;">${t.canModify}</p>
        <button id="accept-level" style="width:100%;padding:14px;border:none;border-radius:6px;background:#087F5B;color:#fff;font-size:15px;cursor:pointer;margin-bottom:10px;font-weight:600;">${t.acceptLevel}</button>
        <button id="change-level" style="width:100%;padding:14px;border:1px solid #087F5B;border-radius:6px;background:#fff;color:#087F5B;font-size:15px;cursor:pointer;font-weight:600;">${t.changeLevel}</button>
    </div>`;
    document.getElementById("accept-level").onclick = () => { savePlacementResult(levelInfo.level); showHome(); };
    document.getElementById("change-level").onclick = showLevelSelection;
}

function showLevelSelection() {
    const lang = localStorage.getItem("language") || "fr";
    const t = texts[lang];
    const levels = ["A1", "A2", "B1", "B2", "C1"];
    let html = `<div style="text-align:center;padding:50px 16px;max-width:500px;margin:0 auto;">
        <div style="font-size:48px;margin-bottom:16px;">🦖</div>
        <h1 style="font-size:22px;color:#1a1a1a;margin-bottom:30px;">${t.chooseYourLevel}</h1>
        <div style="display:flex;flex-direction:column;gap:10px;">`;
    levels.forEach(level => { html += `<button class="level-btn" data-level="${level}" style="padding:14px;font-size:18px;border:1px solid #ddd;border-radius:6px;background:#fff;color:#1a1a1a;cursor:pointer;font-weight:600;transition:border-color 0.15s;" onmouseover="this.style.borderColor='#087F5B'" onmouseout="this.style.borderColor='#ddd'">${level}</button>`; });
    html += `</div></div>`;
    app.innerHTML = html;
    document.querySelectorAll(".level-btn").forEach(btn => { btn.onclick = () => { savePlacementResult(btn.getAttribute("data-level")); showHome(); }; });
}

// ===============================
// صفحه گرامر (مینیمال)
// ===============================
async function showGrammarPage() {
    const lang = localStorage.getItem("language") || "fr";
    const t = texts[lang];
    const level = getPlacementResult() || "A1";

    let html = renderNavbar();
    html += `<div style="text-align:center;padding:40px 16px;"><p style="font-size:14px;color:#777;">⏳ ...</p></div>`;
    app.innerHTML = html;

    await loadGrammar(level);
    const allLessons = getGrammar(level);
    const recommended = getRecommendedGrammar(level);
    const levelNames = { "A1": "Débutant", "A2": "Élémentaire", "B1": "Intermédiaire", "B2": "Avancé", "C1": "Autonome" };

    html = renderNavbar();
    html += `<div style="max-width:900px;margin:0 auto;padding:24px 16px 50px;">
        <h1 style="font-size:22px;font-weight:700;color:#1a1a1a;margin:0 0 4px;">${t.grammar}</h1>
        <p style="font-size:13px;color:#777;margin:0 0 30px;">${level} – ${levelNames[level] || ""}</p>`;

    if (recommended.length > 0) {
        html += `<div style="margin-bottom:35px;">
            ${sectionHeader(lang === "fa" ? "پیشنهاد داینو 🦖" : "Recommandé 🦖", "", lang)}
            <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(190px,1fr));gap:10px;">`;
        recommended.slice(0, 3).forEach(item => {
            const title = lang === "fa" ? item.title_fa : item.title;
            html += simpleCard("🦖", title, `⏱ ${item.estimatedTime} min`, `showGrammarLesson('${item.id}')`);
        });
        html += `</div></div>`;
    }

    html += `<div>${sectionHeader(lang === "fa" ? "همه درس‌ها" : "Toutes les leçons", "", lang)}
        <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(190px,1fr));gap:10px;">`;

    allLessons.forEach(item => {
        const title = lang === "fa" ? item.title_fa : item.title;
        const statusIcon = getStatusIcon(getLessonStatus(item.id));
        html += simpleCard(statusIcon, title, `⏱ ${item.estimatedTime} min · ${item.exercises} ex`, `showGrammarLesson('${item.id}')`);
    });

    html += `</div></div></div>`;
    app.innerHTML = html;
}

// ===============================
// نمایش یک درس گرامر
// ===============================
async function showGrammarLesson(lessonId) {
    const lang = localStorage.getItem("language") || "fr";
    const t = texts[lang];
    const level = getPlacementResult() || "A1";

    let lesson = null;
    try {
        const response = await fetch(`./data/lessons/${level}/${lessonId}.json`);
        lesson = await response.json();
    } catch (error) {
        app.innerHTML = `<div style="padding:40px 16px;text-align:center;"><p style="color:#1a1a1a;">خطا در یافتن درس.</p><button onclick="showGrammarPage()" style="margin-top:15px;padding:10px 20px;border:1px solid #ddd;border-radius:6px;background:#fff;color:#1a1a1a;cursor:pointer;">بازگشت</button></div>`;
        return;
    }

    const status = getLessonStatus(lessonId);
    const bookmarked = isBookmarked(lessonId);
    const progress = getLessonProgress(lessonId);
    if (status === "not_started") setLessonStatus(lessonId, "in_progress");

    const totalSections = lesson.sections ? lesson.sections.length : 0;
    const completedCount = progress.completedSections.length;
    const progressPercent = totalSections > 0 ? (completedCount / totalSections) * 100 : 0;

    let sectionsHtml = "";
    if (lesson.sections && lesson.sections.length > 0) {
        lesson.sections.forEach(section => {
            const isDone = progress.completedSections.includes(section.id);
            const icon = isDone ? "✅" : (section.type === "lesson" ? "📖" : section.type === "exercise" ? "✏️" : "🏆");
            const typeLabel = section.type === "lesson" ? (lang === "fa" ? "درسنامه" : "Leçon") : section.type === "exercise" ? (lang === "fa" ? "تمرین" : "Exercice") : (lang === "fa" ? "آزمون" : "Quiz");

            sectionsHtml += `<div onclick="showLessonSection('${lessonId}','${section.id}')" style="
                background:#fff;border:1px solid ${isDone ? '#10b981' : '#e0e0e0'};border-radius:6px;
                padding:14px 16px;margin-bottom:8px;display:flex;align-items:center;gap:12px;
                cursor:pointer;transition:border-color 0.15s;
            " onmouseover="this.style.borderColor='#087F5B'" onmouseout="this.style.borderColor='${isDone ? '#10b981' : '#e0e0e0'}'">
                <span style="font-size:20px;flex-shrink:0;">${icon}</span>
                <div style="flex:1;">
                    <p class="ltr-lock" style="margin:0;font-size:14px;font-weight:600;color:#1a1a1a;">${section.title}</p>
                    <p style="margin:4px 0 0;font-size:12px;color:#777;">${typeLabel}${isDone ? (lang === "fa" ? " · انجام شد" : " · Terminé") : ""}</p>
                </div>
                <span style="color:#ccc;font-size:16px;">›</span>
            </div>`;
        });
    }

    let html = renderNavbar();
    html += `<div style="max-width:900px;margin:0 auto;padding:24px 16px 50px;">
        <button id="back" class="back-btn">← ${t.back}</button>

        <div style="display:flex;justify-content:space-between;align-items:start;margin-bottom:6px;">
            <h1 class="ltr-lock" style="font-size:22px;margin:0;font-weight:700;color:#1a1a1a;">${lesson.title}</h1>
            <button id="bookmark-btn" style="background:none;border:none;font-size:20px;cursor:pointer;padding:0;margin:0;">${bookmarked ? "⭐" : "☆"}</button>
        </div>
        <p class="ltr-lock" style="font-size:13px;color:#777;margin:0 0 20px;">${lesson.level} · ${lessonId} · ⏱ ${lesson.estimatedTime} min · ${totalSections} ${lang === "fa" ? "بخش" : "sections"}</p>

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
    document.getElementById("back").onclick = showGrammarPage;
    document.getElementById("bookmark-btn").onclick = () => {
        document.getElementById("bookmark-btn").innerHTML = toggleBookmark(lessonId) ? "⭐" : "☆";
    };
}

// ===============================
// جدول
// ===============================
function renderTable(table) {
    if (!table || !table.headers || !table.rows) return "";
    let html = `<div style="overflow-x:auto;margin:20px 0;"><table class="ltr-lock" style="width:100%;border-collapse:collapse;font-size:14px;">`;
    html += `<thead><tr style="background:#087F5B;">`;
    table.headers.forEach(h => { html += `<th style="padding:12px 14px;text-align:left;color:#fff;font-weight:600;font-size:13px;">${renderMarkdown(h)}</th>`; });
    html += `</tr></thead><tbody>`;
    table.rows.forEach((row, i) => {
        html += `<tr style="background:${i % 2 === 0 ? '#fff' : '#fafafa'};border-bottom:1px solid #eee;">`;
        row.forEach(cell => { html += `<td style="padding:10px 14px;color:#333;">${renderMarkdown(cell)}</td>`; });
        html += `</tr>`;
    });
    html += `</tbody></table></div>`;
    return html;
}

// ===============================
// نمایش بخش درس / تمرین
// ===============================
async function showLessonSection(lessonId, sectionId) {
    const level = lessonId.split("-")[0];
    const lessonData = await loadLessonWithExercises(level, lessonId);
    const section = getSection(lessonData, sectionId);
    if (!section) { alert("خطا در یافتن بخش"); return; }
    if (section.type === "lesson") showLessonContent(lessonId, section);
    else if (section.type === "exercise" || section.type === "quiz") showExerciseContent(lessonId, section);
}

function showLessonContent(lessonId, section) {
    const lang = localStorage.getItem("language") || "fr";
    const t = texts[lang];
    const title = lang === "fa" ? section.title_fa : section.title;

    let html = renderNavbar();
    html += `<div style="max-width:900px;margin:0 auto;padding:24px 16px 50px;">
        <button id="back" class="back-btn">← ${t.back}</button>
        <p style="font-size:11px;color:#777;text-transform:uppercase;letter-spacing:1px;margin:0 0 6px;">${section.type === 'lesson' ? (lang === "fa" ? "درسنامه" : "Leçon") : (lang === "fa" ? "تمرین" : "Exercice")}</p>
        <h1 class="ltr-lock" style="font-size:22px;margin:0 0 20px;font-weight:700;color:#1a1a1a;">${title}</h1>
        <div style="background:#fff;border:1px solid #e0e0e0;border-radius:6px;padding:24px;margin-bottom:20px;">`;

    if (section.content) html += `<div class="ltr-lock" style="line-height:1.8;color:#333;font-size:15px;margin-bottom:20px;">${renderMarkdown(section.content)}</div>`;
    if (section.table) html += renderTable(section.table);

    if (section.examples && section.examples.length > 0) {
        html += `<h3 style="font-size:15px;color:#087F5B;margin:20px 0 10px;font-weight:700;">${lang === "fa" ? "مثال‌ها" : "Exemples"}</h3>`;
        section.examples.forEach(ex => {
            html += `<div style="background:#fafafa;padding:12px 14px;border-radius:4px;margin:8px 0;border-left:3px solid #087F5B;">
                <p class="ltr-lock" style="margin:0;font-weight:600;font-size:15px;color:#1a1a1a;">${renderMarkdown(ex.fr)}</p>
                ${ex.fa ? `<p class="persian-text" style="margin:6px 0 0;font-size:13px;color:#666;">${ex.fa}</p>` : ''}
            </div>`;
        });
    }

    if (section.note) {
        html += `<div style="margin-top:20px;padding:14px 16px;background:#fffbeb;border-radius:4px;border-left:3px solid #f59e0b;color:#78350f;font-size:14px;line-height:1.6;">
            <div style="display:flex;gap:8px;align-items:start;"><span>💡</span><div class="ltr-lock">${renderMarkdown(section.note)}</div></div></div>`;
    }
    if (section.note_fa) {
        html += `<div class="persian-text" style="margin-top:20px;padding:14px 16px;background:#fffbeb;border-radius:4px;border-left:3px solid #f59e0b;color:#78350f;font-size:14px;line-height:1.6;">
            <div style="display:flex;gap:8px;align-items:start;"><span>💡</span><div>${section.note_fa}</div></div></div>`;
    }

    html += `</div>
        <button id="complete-btn" style="width:100%;padding:14px;font-size:15px;font-weight:700;border:none;border-radius:6px;cursor:pointer;background:#087F5B;color:#fff;">
            ${lang === "fa" ? "✓ ادامه" : "✓ Continuer"}
        </button>
    </div>`;

    app.innerHTML = html;
    document.getElementById("back").onclick = () => showGrammarLesson(lessonId);
    document.getElementById("complete-btn").onclick = () => { markSectionCompleted(lessonId, section.id); showGrammarLesson(lessonId); };
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
