/**
 * Shared browser UI helpers and localized interface strings.
 *
 * This file intentionally remains a classic browser script rather than an ES
 * module so existing inline HTML handlers can continue to call global
 * functions while the project is migrated to TypeScript.
 */

const appElement = document.getElementById("app");
if (!appElement) {
    throw new Error("Application root #app was not found.");
}
const app: HTMLElement = appElement;

/**
 * Returns the currently selected interface language.
 * Invalid or missing persisted values fall back to French.
 */
function getLanguage(): Language {
    return localStorage.getItem("language") === "fa" ? "fa" : "fr";
}

/**
 * Returns a required DOM element and fails fast when the expected element is
 * missing from the current rendered page.
 *
 * @param id - DOM id without the leading hash.
 */
function getRequiredElement<T extends HTMLElement = HTMLElement>(id: string): T {
    const element = document.getElementById(id);
    if (!element) {
        throw new Error(`Required DOM element #${id} was not found.`);
    }
    return element as T;
}

/**
 * Queries all elements matching a selector with a caller-provided DOM type.
 *
 * @param selector - Valid CSS selector.
 */
function queryElements<T extends Element = HTMLElement>(selector: string): NodeListOf<T> {
    return document.querySelectorAll<T>(selector);
}

/**
 * Renders Persian text using the shared right-to-left typography class.
 *
 * @param text - Text to render.
 */
function renderFaText(text?: string): string {
    if (!text) return "";
    return `<span class="persian-text">${text}</span>`;
}

/**
 * Converts the small Markdown subset supported by the application to HTML.
 * User-provided HTML is escaped before formatting rules are applied.
 *
 * @param text - Markdown-like source text.
 */
function renderMarkdown(text?: string): string {
    if (!text) return "";

    return text
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
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
        .replace(/\n/g, "<br>");
}

const texts: UiTexts = {
    fr: {
        title: "Français avec Dino",
        chooseLanguage: "Choisissez la langue",
        choosePath: "Choisissez votre parcours",
        french: "Français",
        persian: "فارسی",
        general: "Français général",
        travel: "Français Voyage",
        daily: "Français Quotidien",
        levelQuestion: "Souhaitez-vous passer un test de niveau ?",
        yes: "Passer le test",
        later: "Plus tard",
        home: "Accueil",
        back: "Retour",
        dontKnow: "Je ne sais pas",
        finalResult: "Résultat du test",
        yourLevel: "Votre niveau estimé",
        canModify: "Vous pourrez toujours le modifier plus tard.",
        acceptLevel: "Accepter ce niveau",
        changeLevel: "Changer de niveau",
        chooseYourLevel: "Choisissez votre niveau",
        hello: "Bonjour",
        vocabulary: "Vocabulaire",
        grammar: "Grammaire",
        listening: "Compréhension orale",
        revision: "Révision",
        continue: "Continuer",
        level: "Niveau"
    },
    fa: {
        title: "Français avec Dino",
        chooseLanguage: "زبان خود را انتخاب کنید",
        choosePath: "مسیر یادگیری خود را انتخاب کنید",
        french: "Français",
        persian: "فارسی",
        general: "فرانسوی عمومی",
        travel: "فرانسوی در سفر",
        daily: "فرانسوی روزمره",
        levelQuestion: "آیا می‌خواهید ابتدا تعیین سطح انجام دهید؟",
        yes: "انجام تعیین سطح",
        later: "بعداً",
        home: "صفحه اصلی",
        back: "بازگشت",
        dontKnow: "نمی‌دانم",
        finalResult: "نتیجه تعیین سطح",
        yourLevel: "سطح تقریبی شما",
        canModify: "بعداً هم می‌توانید آن را تغییر دهید.",
        acceptLevel: "قبول این سطح",
        changeLevel: "تغییر سطح",
        chooseYourLevel: "سطح خود را انتخاب کنید",
        hello: "سلام",
        vocabulary: "واژگان",
        grammar: "گرامر",
        listening: "درک شنیداری",
        revision: "مرور",
        continue: "ادامه",
        level: "سطح"
    }
};

/**
 * Renders a minimal clickable card used across feature landing pages.
 */
function simpleCard(icon: string, title: string, meta: string, onclick: string): string {
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

/**
 * Renders a section heading with an optional secondary action.
 */
function sectionHeader(title: string, moreOnclick: string, lang: Language): string {
    return `<div style="display:flex;justify-content:space-between;align-items:baseline;margin-bottom:14px;border-bottom:2px solid #1a1a1a;padding-bottom:10px;">
        <h2 style="margin:0;font-size:20px;font-weight:700;color:#1a1a1a;">${title}</h2>
        ${moreOnclick ? `<span onclick="${moreOnclick}" style="font-size:14px;color:#087F5B;cursor:pointer;font-weight:600;">${lang === "fa" ? "همه →" : "Tout →"}</span>` : ""}
    </div>`;
}
