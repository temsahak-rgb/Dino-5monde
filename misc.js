// ===============================
// صفحات Placeholder مینیمال (misc.js)
// ===============================
function placeholderPage(icon, titleFa, titleFr) {
    const lang = localStorage.getItem("language") || "fr";
    let html = renderNavbar();
    html += `<div style="max-width:900px;margin:0 auto;padding:60px 16px;text-align:center;">
        <div style="font-size:48px;margin-bottom:16px;">${icon}</div>
        <h1 style="font-size:22px;color:#1a1a1a;margin-bottom:10px;">${lang === "fa" ? titleFa : titleFr}</h1>
        <p style="font-size:14px;color:#777;">🏗️🦖 ${lang === "fa" ? "دایناسورها مشغول کارند — به زودی!" : "Les dinosaures sont au travail — bientôt !"}</p>
    </div>`;
    app.innerHTML = html;
}

function showGamesPage() { placeholderPage("🎮", "بازی‌های آموزشی", "Jeux éducatifs"); }
function showExercisesPage() { placeholderPage("📝", "تمرین‌ها و آزمون‌ها", "Exercices et tests"); }
function showProfile() { placeholderPage("👤", "پروفایل من", "Mon profil"); }
