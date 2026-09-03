/**
 * Minimal placeholder pages for sections that are not implemented yet.
 */

/** Renders a localized placeholder page. */
function placeholderPage(icon: string, titleFa: string, titleFr: string): void {
    const lang = getLanguage();
    let html = renderNavbar();
    html += `<div style="max-width:900px;margin:0 auto;padding:60px 16px;text-align:center;">
        <div style="font-size:48px;margin-bottom:16px;">${icon}</div>
        <h1 style="font-size:22px;color:#1a1a1a;margin-bottom:10px;">${lang === "fa" ? titleFa : titleFr}</h1>
        <p style="font-size:14px;color:#777;">🏗️🦖 ${lang === "fa" ? "دایناسورها مشغول کارند — به زودی!" : "Les dinosaures sont au travail — bientôt !"}</p>
    </div>`;
    app.innerHTML = html;
}

/** Displays the educational games placeholder. */
function showGamesPage(): void {
    placeholderPage("🎮", "بازی‌های آموزشی", "Jeux éducatifs");
}

/** Displays the exercises placeholder. */
function showExercisesPage(): void {
    placeholderPage("📝", "تمرین‌ها و آزمون‌ها", "Exercices et tests");
}

/** Displays the user profile placeholder. */
function showProfile(): void {
    placeholderPage("👤", "پروفایل من", "Mon profil");
}
