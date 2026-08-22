// script.js

// ===============================
// شروع
// ===============================
// اگر زبان و مسیر انتخاب شده، مستقیم به خانه برو
const savedLanguage = localStorage.getItem("language");
const savedPath = localStorage.getItem("currentPath");

if (savedLanguage && savedPath) {
    switchSection('home');
} else {
    showLanguage();
}

loadPlacementQuestions().then(() => { console.log("✅ موتور آماده. سوالات:", getPlacementQuestions().length); });
