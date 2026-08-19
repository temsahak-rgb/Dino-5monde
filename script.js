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
// شروع
// ===============================
showLanguage();
loadPlacementQuestions().then(() => { console.log("✅ موتور آماده. سوالات:", getPlacementQuestions().length); });
