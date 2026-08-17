// pathEngine.js

let pathsData = {};
let currentPathData = {};

// ۱. بارگذاری اطلاعات کلی مسیرها (از paths.json)
async function loadPaths() {
    try {
        const response = await fetch("./data/paths.json");
        pathsData = await response.json();
        console.log("✅ مسیرها بارگذاری شدند");
    } catch (error) {
        console.error("❌ خطا در بارگذاری مسیرها:", error);
    }
}

// ۲. بارگذاری فهرست درس‌های یک مسیر (لیست کلی)
async function loadPathContent(pathId) {
    try {
        const response = await fetch(`./data/${pathId}/lessons.json`);
        currentPathData[pathId] = await response.json();
        console.log(`✅ فهرست درس‌های مسیر ${pathId} بارگذاری شد`);
        return currentPathData[pathId];
    } catch (error) {
        console.error(`❌ خطا در بارگذاری فهرست ${pathId}:`, error);
        return null;
    }
}

// ۳. 🆕 بارگذاری محتوای کامل یک درس خاص (مثلاً DL-001.json)
async function loadSpecificLesson(pathId, lessonId) {
    try {
        // مسیر فایل به این شکل است: data/daily/lessons/DL-001/DL-001.json
        const response = await fetch(`./data/${pathId}/lessons/${lessonId}/${lessonId}.json`);
        const lessonData = await response.json();
        console.log(`✅ محتوای درس ${lessonId} با موفقیت بارگذاری شد`);
        return lessonData;
    } catch (error) {
        console.error(`❌ خطا در بارگذاری محتوای درس ${lessonId}:`, error);
        return null;
    }
}

// ۴. گرفتن مسیر فعلی کاربر
function getCurrentPath() {
    return localStorage.getItem("currentPath") || "general";
}

// ۵. تغییر مسیر و به‌روزرسانی صفحه
function switchPath(newPath) {
    if (pathsData[newPath]) {
        localStorage.setItem("currentPath", newPath);
        console.log(`🔄 تغییر مسیر به: ${newPath}`);
        
        // اگر تابع showHome در script.js لود شده باشد، آن را صدا می‌زنیم
        if (typeof showHome === "function") {
            showHome(); 
        }
    } else {
        console.error("❌ مسیر نامعتبر است:", newPath);
    }
}

// ۶. گرفتن لیست درس‌های مسیر فعلی برای نمایش در صفحه اصلی
async function getCurrentPathLessons() {
    const currentPath = getCurrentPath();
    
    if (currentPath === "general") {
        const level = getPlacementResult() || "A1";
        await loadGrammar(level);
        return getGrammar(level);
    } else {
        const data = await loadPathContent(currentPath);
        return data || [];
    }
}
