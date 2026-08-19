
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
