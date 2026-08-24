// ===============================
// ✈️ موتور درس‌های سفر
// ===============================
let travelCache = {};

async function loadTravelIndex() {
    if (travelCache.index) return travelCache.index;
    try {
        const r = await fetch("./data/travel/lessons.json?v=" + Date.now(), { cache: "no-store" });
        if (!r.ok) throw new Error("lessons.json not found");
        const d = await r.json();
        travelCache.index = d;
        return d;
    } catch (e) { 
        console.error("Error loading travel index:", e);
        return []; 
    }
}

async function loadTravelLesson(lessonId) {
    const key = "travel-" + lessonId;
    if (travelCache[key]) return travelCache[key];
    
    try {
        const r = await fetch("./data/travel/lessons/" + lessonId + ".json?v=" + Date.now(), { cache: "no-store" });
        if (!r.ok) {
            console.warn(`Lesson file not found: ${lessonId}`);
            return null;
        }
        const d = await r.json();
        travelCache[key] = d;
        return d;
    } catch (e) { 
        console.error(`Error loading lesson ${lessonId}:`, e);
        return null; 
    }
}

// ===============================
// ✈️ نمایش لیست درس‌های سفر
// ===============================
async function showTravelPage() {
    const lang = localStorage.getItem("language") || "fr";
    const lessons = await loadTravelIndex();
    
    let html = renderNavbar();
    html += `<div style="max-width:960px;margin:0 auto;padding:32px 20px 60px;">`;
    html += `<h1 style="font-size:26px;font-weight:700;color:#1a1a1a;margin:0 0 6px;">${lang === "fa" ? "✈️ سفر" : "✈️ Voyage"}</h1>`;
    html += `<p style="font-size:15px;color:#777;margin:0 0 30px;">${lang === "fa" ? "درس‌های کاربردی برای سفر به کشورهای فرانسوی‌زبان" : "Leçons pratiques pour voyager dans les pays francophones"}</p>`;
    
    if (lessons.length === 0) {
        html += `<p style="text-align:center;color:#777;padding:40px;">${lang === "fa" ? "هنوز درسی اضافه نشده" : "Aucune leçon disponible"}</p>`;
    } else {
        html += `<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(280px,1fr));gap:15px;">`;
        
        lessons.forEach(lesson => {
            html += `<div style="background:#fff;border:1px solid #e0e0e0;border-radius:8px;padding:20px;cursor:pointer;transition:all 0.2s;" 
                onclick="showTravelLesson('${lesson.id}')" 
                onmouseover="this.style.borderColor='#087F5B';this.style.transform='translateY(-4px)'" 
                onmouseout="this.style.borderColor='#e0e0e0';this.style.transform='translateY(0)'">`;
            html += `<div style="display:flex;align-items:center;gap:12px;margin-bottom:12px;">`;
            html += `<span style="font-size:36px;">${lesson.icon}</span>`;
            html += `<div>`;
            html += `<h3 style="font-size:17px;font-weight:700;color:#1a1a1a;margin:0;">${lang === "fa" ? lesson.title_fa : lesson.title}</h3>`;
            html += `<p style="font-size:13px;color:#777;margin:4px 0 0;">⏱️ ${lesson.estimatedTime} ${lang === "fa" ? "دقیقه" : "min"}</p>`;
            html += `</div></div>`;
            html += `</div>`;
        });
        
        html += `</div>`;
    }
    
    html += `</div>`;
    app.innerHTML = html;
}

// ===============================
// ✈️ نمایش یک درس سفر (با مدیریت خطای قوی)
// ===============================
async function showTravelLesson(lessonId) {
    const lang = localStorage.getItem("language") || "fr";
    
    const lesson = await loadTravelLesson(lessonId);
    
    // اگر درس پیدا نشد، پیام موقت نشان بده
    if (!lesson) {
        app.innerHTML = renderNavbar() + `<div style="max-width:600px;margin:0 auto;padding:60px 20px;text-align:center;">
            <p style="font-size:48px;margin-bottom:20px;">🚧</p>
            <p style="font-size:18px;color:#1a1a1a;margin-bottom:10px;">${lang === "fa" ? "این درس به زودی اضافه می‌شود" : "Cette leçon sera bientôt disponible"}</p>
            <p style="font-size:14px;color:#777;margin-bottom:20px;">${lang === "fa" ? "محتوای این درس هنوز آماده نشده است" : "Le contenu de cette leçon n'est pas encore prêt"}</p>
            <button onclick="showTravelPage()" style="padding:12px 24px;background:#087F5B;color:#fff;border:none;border-radius:6px;cursor:pointer;font-weight:700;">${lang === "fa" ? "بازگشت به لیست" : "Retour à la liste"}</button>
        </div>`;
        return;
    }
    
    // اگر درس هست ولی miniLessons ندارد
    if (!lesson.miniLessons || lesson.miniLessons.length === 0) {
        app.innerHTML = renderNavbar() + `<div style="max-width:600px;margin:0 auto;padding:60px 20px;text-align:center;">
            <p style="font-size:48px;margin-bottom:20px;">📝</p>
            <h1 style="font-size:24px;font-weight:700;color:#1a1a1a;margin-bottom:10px;">${lang === "fa" ? lesson.title_fa : lesson.title}</h1>
            <p style="font-size:16px;color:#777;margin-bottom:20px;">${lang === "fa" ? "محتوای این درس به زودی اضافه می‌شود" : "Le contenu de cette leçon sera bientôt ajouté"}</p>
            <button onclick="showTravelPage()" style="padding:12px 24px;background:#087F5B;color:#fff;border:none;border-radius:6px;cursor:pointer;font-weight:700;">${lang === "fa" ? "بازگشت به لیست" : "Retour à la liste"}</button>
        </div>`;
        return;
    }
    
    // درس کامل است - نمایش آن
    let html = renderNavbar();
    html += `<div style="max-width:900px;margin:0 auto;padding:20px 16px 60px;">`;
    html += `<button class="back-btn" onclick="showTravelPage()">← ${lang === "fa" ? "بازگشت" : "Retour"}</button>`;
    
    // هدر درس
    html += `<div style="display:flex;align-items:center;gap:16px;margin:20px 0;">`;
    html += `<span style="font-size:48px;">${lesson.icon}</span>`;
    html += `<div>`;
    html += `<h1 style="font-size:26px;font-weight:700;color:#1a1a1a;margin:0;">${lang === "fa" ? lesson.title_fa : lesson.title}</h1>`;
    html += `<p style="font-size:14px;color:#777;margin:4px 0 0;">⏱️ ${lesson.estimatedTime} ${lang === "fa" ? "دقیقه" : "min"}</p>`;
    html += `</div></div>`;
    
    // منوی مینی‌درس‌ها
    html += `<div style="background:#f9fafb;border:1px solid #e0e0e0;border-radius:8px;padding:16px;margin-bottom:24px;">`;
    html += `<h3 style="font-size:15px;font-weight:700;color:#1a1a1a;margin:0 0 12px;">📚 ${lang === "fa" ? "بخش‌های درس" : "Sections de la leçon"}</h3>`;
    html += `<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(200px,1fr));gap:10px;">`;
    
    lesson.miniLessons.forEach((mini, idx) => {
        const typeIcon = mini.type === 'vocab' ? '📖' : mini.type === 'tips' ? '💡' : '📝';
        const itemCount = mini.type === 'vocab' ? (mini.words ? mini.words.length : 0) : (mini.tips ? mini.tips.length : 0);
        const itemLabel = mini.type === 'vocab' ? (lang === "fa" ? "کلمه" : "mots") : (lang === "fa" ? "نکته" : "conseils");
        
        html += `<button onclick="showMiniLesson('${lessonId}', ${idx})" style="padding:12px;background:#fff;border:1px solid #e0e0e0;border-radius:6px;cursor:pointer;text-align:right;transition:all 0.2s;" onmouseover="this.style.borderColor='#087F5B';this.style.background='#f0f9ff'" onmouseout="this.style.borderColor='#e0e0e0';this.style.background='#fff'">`;
        html += `<span style="font-size:20px;">${typeIcon}</span>`;
        html += `<p style="font-size:14px;font-weight:600;color:#1a1a1a;margin:6px 0 0;">${mini.title}</p>`;
        html += `<p style="font-size:12px;color:#777;margin:4px 0 0;">${itemCount} ${itemLabel}</p>`;
        html += `</button>`;
    });
    
    html += `</div></div>`;
    
    // محتوای مینی‌درس‌ها
    html += `<div id="mini-lesson-content">`;
    html += `<p style="text-align:center;color:#777;padding:40px;">${lang === "fa" ? "یک بخش را از بالا انتخاب کنید" : "Sélectionnez une section ci-dessus"}</p>`;
    html += `</div>`;
    
    html += `</div>`;
    app.innerHTML = html;
    
    window.currentTravelLesson = lesson;
}

// ===============================
// ✈️ نمایش مینی‌درس
// ===============================
function showMiniLesson(lessonId, miniIdx) {
    const lang = localStorage.getItem("language") || "fr";
    const lesson = window.currentTravelLesson;
    
    if (!lesson || !lesson.miniLessons || !lesson.miniLessons[miniIdx]) {
        console.error("Mini lesson not found");
        return;
    }
    
    const mini = lesson.miniLessons[miniIdx];
    const contentDiv = document.getElementById("mini-lesson-content");
    let html = "";
    
    // هدر مینی‌درس
    html += `<div style="background:#fff;border:2px solid #087F5B;border-radius:8px;padding:20px;margin-bottom:20px;">`;
    html += `<h2 style="font-size:20px;font-weight:700;color:#087F5B;margin:0 0 8px;">${mini.title}</h2>`;
    html += `</div>`;
    
    // نوع ۱: واژگان
    if (mini.type === 'vocab' && mini.words && mini.words.length > 0) {
        html += `<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(280px,1fr));gap:12px;">`;
        mini.words.forEach(word => {
            html += `<div style="background:#fff;border:1px solid #e0e0e0;border-radius:8px;padding:16px;transition:all 0.2s;" onmouseover="this.style.borderColor='#087F5B'" onmouseout="this.style.borderColor='#e0e0e0'">`;
            html += `<div style="display:flex;align-items:start;gap:12px;">`;
            html += `<span style="font-size:32px;">${word.emoji || '📝'}</span>`;
            html += `<div style="flex:1;">`;
            html += `<p class="ltr-lock" style="font-size:18px;font-weight:700;color:#1a1a1a;margin:0 0 4px;">${word.fr}</p>`;
            if (word.phonetic) {
                html += `<p class="persian-text" style="font-size:13px;color:#888;margin:0 0 4px;font-style:italic;">🔊 ${word.phonetic}</p>`;
            }
            html += `<p class="persian-text" style="font-size:15px;color:#555;margin:0;">${word.fa}</p>`;
            html += `</div></div></div>`;
        });
        html += `</div>`;
        
        // دکمه فلش‌کارت
        html += `<button onclick="startTravelFlashcards('${lessonId}', ${miniIdx})" style="margin-top:20px;width:100%;padding:14px;font-size:15px;font-weight:700;border:none;border-radius:6px;background:#087F5B;color:#fff;cursor:pointer;">🃏 ${lang === "fa" ? "تمرین با فلش‌کارت" : "Pratiquer avec des flashcards"}</button>`;
    }
    
    // نوع ۲: توصیه‌ها
    else if (mini.type === 'tips' && mini.tips && mini.tips.length > 0) {
        html += `<div style="display:flex;flex-direction:column;gap:12px;">`;
        mini.tips.forEach((tip, idx) => {
            const bgColor = tip.type === 'warning' ? '#fef2f2' : tip.type === 'note' ? '#eff6ff' : tip.type === 'comparison' ? '#f0fdf4' : '#fffbeb';
            const borderColor = tip.type === 'warning' ? '#dc2626' : tip.type === 'note' ? '#2563eb' : tip.type === 'comparison' ? '#16a34a' : '#d97706';
            
            html += `<div style="background:${bgColor};border:1px solid ${borderColor};border-radius:8px;padding:18px;">`;
            html += `<div style="display:flex;align-items:start;gap:12px;">`;
            html += `<span style="font-size:28px;">${tip.icon || '💡'}</span>`;
            html += `<div style="flex:1;">`;
            html += `<h3 style="font-size:16px;font-weight:700;color:#1a1a1a;margin:0 0 8px;">${idx + 1}. ${tip.title_fa || tip.title_fr || ''}</h3>`;
            if (tip.content_fr) {
                html += `<p class="ltr-lock" style="font-size:14px;color:#333;margin:0 0 8px;line-height:1.7;">${tip.content_fr}</p>`;
            }
            if (tip.content_fa) {
                html += `<p class="persian-text" style="font-size:13px;color:#777;margin:0;line-height:1.7;">${tip.content_fa}</p>`;
            }
            html += `</div></div></div>`;
        });
        html += `</div>`;
    }
    
    // اگر هیچ محتوایی نداشت
    else {
        html += `<p style="text-align:center;color:#777;padding:40px;">${lang === "fa" ? "این بخش هنوز محتوایی ندارد" : "Cette section n'a pas encore de contenu"}</p>`;
    }
    
    contentDiv.innerHTML = html;
    contentDiv.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

// ===============================
// 🃏 فلش‌کارت برای مینی‌درس واژگان
// ===============================
function startTravelFlashcards(lessonId, miniIdx) {
    const lesson = window.currentTravelLesson;
    
    if (!lesson || !lesson.miniLessons || !lesson.miniLessons[miniIdx]) {
        console.error("Cannot start flashcards: lesson or mini lesson not found");
        return;
    }
    
    const mini = lesson.miniLessons[miniIdx];
    
    if (mini.type !== 'vocab' || !mini.words || mini.words.length === 0) {
        console.error("Cannot start flashcards: not a vocab section or no words");
        return;
    }
    
    window.currentPack = {
        id: lessonId + '-' + mini.id,
        level: 'travel',
        words: mini.words.map(w => ({
            fr: w.fr,
            fa: w.fa,
            phonetic: w.phonetic,
            emoji: w.emoji || '📝'
        }))
    };
    
    startFlashcards();
}
