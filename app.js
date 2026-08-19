// script.js

// ===============================
// شروع
// ===============================
showLanguage();
loadPlacementQuestions().then(() => { console.log("✅ موتور آماده. سوالات:", getPlacementQuestions().length); });
