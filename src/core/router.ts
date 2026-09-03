/**
 * Application navigation bar and top-level section router.
 */

/** Opens or closes the mobile navigation menu. */
function toggleMobileMenu(): void {
    document.getElementById("nav-links")?.classList.toggle("open");
}

/** Renders the shared application navigation bar. */
function renderNavbar(): string {
    const lang = getLanguage();
    const currentSection = (localStorage.getItem("currentSection") || "home") as AppSection;

    const item = (section: AppSection, label: string): string => {
        const active = currentSection === section;
        return `<button onclick="switchSection('${section}')" style="
            background:none;border:none;border-bottom:2px solid ${active ? "#fff" : "transparent"};
            color:${active ? "#fff" : "rgba(255,255,255,0.7)"};font-size:13px;
            font-weight:${active ? "700" : "500"};cursor:pointer;padding:0 12px;
            line-height:48px;margin:0;transition:color 0.15s,border-color 0.15s;
        " onmouseover="this.style.color='#fff'" onmouseout="this.style.color='${active ? "#fff" : "rgba(255,255,255,0.7)"}'">${label}</button>`;
    };

    return `
    <nav style="background:#087F5B;height:48px;display:flex;align-items:center;justify-content:space-between;padding:0 16px;position:sticky;top:0;z-index:1000;">
        <div onclick="switchSection('home')" style="cursor:pointer;display:flex;align-items:center;gap:6px;">
            <span style="font-size:16px;">🦖</span>
            <span style="color:#fff;font-size:14px;font-weight:700;">Français avec Dino</span>
        </div>
        <button id="menu-toggle" onclick="toggleMobileMenu()" style="display:none;background:none;border:none;color:#fff;font-size:20px;cursor:pointer;padding:4px 8px;margin:0;line-height:1;">☰</button>
        <div id="nav-links" style="display:flex;align-items:center;gap:0;">
            ${item("grammar", lang === "fa" ? "گرامر" : "Grammaire")}
            ${item("vocabulary", lang === "fa" ? "واژگان" : "Vocabulaire")}
            ${item("daily", lang === "fa" ? "روزمره" : "Quotidien")}
            ${item("travel", lang === "fa" ? "سفر" : "Voyage")}
            ${item("games", lang === "fa" ? "بازی" : "Jeux")}
            ${item("exercises", lang === "fa" ? "تمرین" : "Exercices")}
            <button onclick="openSearch()" title="${lang === "fa" ? "جستجو در سایت" : "Rechercher dans le site"}" style="
                background:none;border:none;color:#fff;font-size:16px;cursor:pointer;
                padding:0 10px;margin:0;line-height:48px;transition:opacity 0.15s;
            " onmouseover="this.style.opacity='0.7'" onmouseout="this.style.opacity='1'">🔍</button>
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
    </style>`;
}

/** Routes the application to a top-level section. */
async function switchSection(section: AppSection): Promise<void> {
    localStorage.setItem("currentSection", section);

    switch (section) {
        case "home":
            await showHome();
            break;
        case "grammar":
            await showGrammarPage();
            break;
        case "vocabulary":
            await showVocabularyPage();
            break;
        case "daily":
            await showDailyHome();
            break;
        case "travel":
            await showTravelPage();
            break;
        case "games":
            showGamesPage();
            break;
        case "exercises":
            showExercisesPage();
            break;
        case "profile":
            showProfile();
            break;
    }
}
