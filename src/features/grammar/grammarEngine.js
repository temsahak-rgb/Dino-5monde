// grammarEngine.js

let grammarData = {};

async function loadGrammar(level) {
    try {
        const response = await fetch("./data/grammar-" + level + ".json");
        const data = await response.json();
        grammarData[level] = data;
        return data;
    } catch (error) {
        console.error("خطا در بارگذاری گرامر " + level + ":", error);
        return [];
    }
}

function getGrammar(level) {
    return grammarData[level] || [];
}

function getRecommendedGrammar(level) {
    const data = grammarData[level] || [];
    return data.filter(item => item.recommended === true);
}

function getGrammarByModule(level) {
    const data = grammarData[level] || [];
    const modules = {};
    
    data.forEach(item => {
        if (!modules[item.module]) {
            modules[item.module] = {
                icon: item.icon,
                items: []
            };
        }
        modules[item.module].items.push(item);
    });
    
    return modules;
}

// ===============================
// سیستم پیشرفت و بوک‌مارک (LocalStorage)
// ===============================

function getLessonStatus(lessonId) {
    const progress = JSON.parse(localStorage.getItem("dino_progress") || "{}");
    return progress[lessonId] || "not_started";
}

function setLessonStatus(lessonId, status) {
    const progress = JSON.parse(localStorage.getItem("dino_progress") || "{}");
    progress[lessonId] = status;
    localStorage.setItem("dino_progress", JSON.stringify(progress));
}

function toggleBookmark(lessonId) {
    let bookmarks = JSON.parse(localStorage.getItem("dino_bookmarks") || "[]");
    if (bookmarks.includes(lessonId)) {
        bookmarks = bookmarks.filter(id => id !== lessonId);
    } else {
        bookmarks.push(lessonId);
    }
    localStorage.setItem("dino_bookmarks", JSON.stringify(bookmarks));
    return bookmarks.includes(lessonId);
}

function isBookmarked(lessonId) {
    const bookmarks = JSON.parse(localStorage.getItem("dino_bookmarks") || "[]");
    return bookmarks.includes(lessonId);
}

function getStatusIcon(status) {
    if (status === "completed") return "✅";
    if (status === "in_progress") return "⏳";
    return "▶️";
}

function getStatusText(status, lang) {
    if (status === "completed") return lang === "fa" ? "تمام شده" : "Terminé";
    if (status === "in_progress") return lang === "fa" ? "در حال مطالعه" : "En cours";
    return lang === "fa" ? "شروع نشده" : "Non commencé";
}

// ===============================
// Markdown Parser (جدید)
// ===============================

function renderMarkdown(text) {
    if (!text) return "";
    
    let html = text
        // Escape HTML first
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        
        // Bold: **text**
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
        
        // Italic: *text*
        .replace(/\*(.*?)\*/g, '<em>$1</em>')
        
        // Code: `text`
        .replace(/`(.*?)`/g, '<code style="background: #f0f0f0; padding: 2px 6px; border-radius: 3px; font-family: monospace;">$1</code>')
        
        // Strikethrough: ~~text~~
        .replace(/~~(.*?)~~/g, '<del style="color: #999;">$1</del>')
        
        // Red color: [text][red]
        .replace(/\[(.*?)\]\[red\]/g, '<span style="color: #dc3545; font-weight: bold;">$1</span>')
        
        // Line breaks
        .replace(/\n/g, '<br>');
    
    return html;
}
