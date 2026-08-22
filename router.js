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
            ${item('vocabulary', lang === "fa" ? "واژگان" : "Vocabulaire")}
            ${item('daily', lang === "fa" ? "روزمره" : "Quotidien")}
            ${item('travel', lang === "fa" ? "سفر" : "Voyage")}
            ${item('games', lang === "fa" ? "بازی" : "Jeux")}
            ${item('exercises', lang === "fa" ? "تمرین" : "Exercices")}
            
            <!-- 🔍 دکمه جستجو -->
            <button onclick="openSearch()" title="${lang === "fa" ? "جستجو در سایت" : "Rechercher dans le site"}" style="
                background:none;border:none;color:#fff;font-size:16px;cursor:pointer;
                padding:0 10px;margin:0;line-height:48px;transition:opacity 0.15s;
            " onmouseover="this.style.opacity='0.7'" onmouseout="this.style.opacity='1'">🔍</button>
            
            <!-- 👤 دکمه پروفایل -->
            <button onclick="switchSection('profile')" title="${lang === "fa" ? "پروفایل" : "Profil"}" style="
                background:none;border:none;color:#fff;font-size:18px;cursor:pointer;
                padding:0 0 0 4px;margin:0;line-height:48px;transition:opacity 0.15s;
            " onmouseover="this.style.opacity='0.7'" onmouseout="this.style.opacity='1'">👤</button>
        </div>
    </nav>
    <style>
        @media(max-width:768px){
            #menu-toggle{display:block!important;}
            #nav-links{display:none!important;position:absolute;top:48px;left:0;right:0;background:#087F5B;flex-direction:column;padding:4px 0;box-shadow:0 4px 12px rgba(0,0,0,0.15);}
            #nav-links.open{display:flex!important;}
            #nav-links button{width:100%;text-align:left;padding:12px 16px!important;line-height:1.4!important;border-bottom:1px solid rgba(255,255,255,0.1)!important;border-left:none!important;}
        }
    </style>
    <script>
        document.getElementById('menu-toggle').onclick = function(){
            document.getElementById('nav-links').classList.toggle('open');
        };
    </script>`;
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
