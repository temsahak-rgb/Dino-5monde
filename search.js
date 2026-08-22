// ===============================
// 🔍 سیستم جستجوی سایت (نسخه ۲ - پایدار)
// ===============================

let searchCache = { vocab: null, grammar: null, news: null };

function openSearch() {
    const lang = localStorage.getItem("language") || "fr";
    
    // اگر مودال قبلاً باز است، نبند و دوباره باز نکن
    if (document.getElementById('search-modal')) {
        document.getElementById('search-input').focus();
        return;
    }
    
    const modal = document.createElement('div');
    modal.id = 'search-modal';
    modal.style.cssText = 'position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(0,0,0,0.85);z-index:9999;display:flex;align-items:flex-start;justify-content:center;padding:40px 16px;overflow-y:auto;';
    modal.onclick = function(e) { if (e.target === modal) closeSearch(); };
    
    modal.innerHTML = `
        <div style="background:#fff;border-radius:12px;width:100%;max-width:800px;box-shadow:0 10px 40px rgba(0,0,0,0.3);overflow:hidden;">
            <div style="background:#087F5B;padding:16px 20px;display:flex;justify-content:space-between;align-items:center;">
                <h2 style="color:#fff;margin:0;font-size:18px;">🔍 ${lang === "fa" ? "جستجو در سایت" : "Rechercher"}</h2>
                <button onclick="closeSearch()" style="background:rgba(255,255,255,0.2);border:none;border-radius:6px;padding:6px 12px;color:#fff;cursor:pointer;font-size:16px;">✕</button>
            </div>
            <div style="padding:20px;border-bottom:1px solid #e0e0e0;">
                <input type="text" id="search-input" placeholder="${lang === "fa" ? "کلمه یا عبارت..." : "Mot ou expression..."}" 
                    style="width:100%;padding:14px 18px;font-size:16px;border:2px solid #e0e0e0;border-radius:8px;box-sizing:border-box;outline:none;"
                    onfocus="this.style.borderColor='#087F5B'" onblur="this.style.borderColor='#e0e0e0'">
            </div>
            <div id="search-results" style="padding:20px;max-height:60vh;overflow-y:auto;">
                <p style="text-align:center;color:#999;padding:30px;">${lang === "fa" ? "حداقل ۲ حرف تایپ کنید..." : "Tapez au moins 2 caractères..."}</p>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    const input = document.getElementById('search-input');
    input.focus();
    input.oninput = function() { performSearch(this.value); };
    
    // بستن با Escape
    document.onkeydown = function(e) {
        if (e.key === 'Escape') closeSearch();
    };
}

function closeSearch() {
    const modal = document.getElementById('search-modal');
    if (modal) modal.remove();
    document.onkeydown = null;
}

async function performSearch(query) {
    const resultsDiv = document.getElementById('search-results');
    const lang = localStorage.getItem("language") || "fr";
    
    if (!query || query.length < 2) {
        resultsDiv.innerHTML = `<p style="text-align:center;color:#999;padding:30px;">${lang === "fa" ? "حداقل ۲ حرف تایپ کنید..." : "Tapez au moins 2 caractères..."}</p>`;
        return;
    }
    
    resultsDiv.innerHTML = `<p style="text-align:center;color:#999;padding:30px;">🔄 ${lang === "fa" ? "در حال جستجو..." : "Recherche..."}</p>`;
    
    try {
        // بارگذاری داده‌ها (همه با try/catch تا اگر یکی نبود، بقیه کار کنند)
        const [vocabData, grammarData, newsData] = await Promise.all([
            loadAllVocab().catch(e => { console.warn("Vocab load error:", e); return []; }),
            loadAllGrammar().catch(e => { console.warn("Grammar load error:", e); return []; }),
            loadAllNews().catch(e => { console.warn("News load error:", e); return []; })
        ]);
        
        const lowerQuery = query.toLowerCase();
        
        // جستجو در واژگان
        const vocabResults = [];
        vocabData.forEach(pack => {
            if (!pack.words) return;
            pack.words.forEach(word => {
                const searchable = [word.fr, word.fa, word.ex, word.ex_fa].filter(Boolean).join(' ').toLowerCase();
                if (searchable.includes(lowerQuery)) {
                    vocabResults.push({ ...word, level: pack.level, packId: pack.id });
                }
            });
        });
        
        // جستجو در گرامر
        const grammarResults = [];
        grammarData.forEach(lesson => {
            const searchable = [lesson.title, lesson.title_fa, lesson.content, lesson.example].filter(Boolean).join(' ').toLowerCase();
            if (searchable.includes(lowerQuery)) {
                grammarResults.push(lesson);
            }
        });
        
        // جستجو در اخبار
        const newsResults = [];
        newsData.forEach(news => {
            const searchable = [news.title, news.title_fa, news.subtitle, news.subtitle_fa].filter(Boolean).join(' ').toLowerCase();
            if (searchable.includes(lowerQuery)) {
                newsResults.push(news);
            }
        });
        
        const total = vocabResults.length + grammarResults.length + newsResults.length;
        
        if (total === 0) {
            resultsDiv.innerHTML = `<p style="text-align:center;color:#999;padding:40px;">${lang === "fa" ? " نتیجه‌ای پیدا نشد." : "Aucun résultat."}</p>`;
            return;
        }
        
        // ساخت HTML نتایج
        let html = '';
        
        if (vocabResults.length > 0) {
            html += `<h3 style="font-size:15px;font-weight:700;color:#087F5B;margin:0 0 10px;padding-bottom:8px;border-bottom:2px solid #087F5B;">📖 ${lang === "fa" ? "واژگان" : "Vocabulaire"} (${vocabResults.length})</h3>`;
            vocabResults.slice(0, 15).forEach(item => {
                html += `
                <div onclick="goToVocab('${item.level}','${item.packId}')" style="background:#f9fafb;border:1px solid #e0e0e0;border-radius:8px;padding:12px;margin-bottom:8px;cursor:pointer;transition:all 0.15s;" 
                    onmouseover="this.style.background='#f0f9ff';this.style.borderColor='#087F5B'" 
                    onmouseout="this.style.background='#f9fafb';this.style.borderColor='#e0e0e0'">
                    <div style="display:flex;justify-content:space-between;align-items:start;gap:10px;">
                        <div style="flex:1;">
                            <p class="ltr-lock" style="font-weight:700;color:#1a1a1a;margin:0 0 3px;font-size:15px;">${hl(item.fr, query)}</p>
                            <p class="persian-text" style="font-size:13px;color:#777;margin:0;">${hl(item.fa, query)}</p>
                            ${item.ex ? `<p class="ltr-lock" style="font-size:12px;color:#888;margin:6px 0 0;font-style:italic;">${hl(item.ex, query)}</p>` : ''}
                        </div>
                        <span style="background:#e8f5f0;color:#087F5B;padding:3px 8px;border-radius:4px;font-size:11px;font-weight:700;white-space:nowrap;">${item.level}</span>
                    </div>
                </div>`;
            });
        }
        
        if (grammarResults.length > 0) {
            html += `<h3 style="font-size:15px;font-weight:700;color:#087F5B;margin:20px 0 10px;padding-bottom:8px;border-bottom:2px solid #087F5B;">📚 ${lang === "fa" ? "گرامر" : "Grammaire"} (${grammarResults.length})</h3>`;
            grammarResults.slice(0, 15).forEach(item => {
                html += `
                <div onclick="goToGrammar('${item.id}')" style="background:#f9fafb;border:1px solid #e0e0e0;border-radius:8px;padding:12px;margin-bottom:8px;cursor:pointer;transition:all 0.15s;"
                    onmouseover="this.style.background='#f0f9ff';this.style.borderColor='#087F5B'"
                    onmouseout="this.style.background='#f9fafb';this.style.borderColor='#e0e0e0'">
                    <div style="display:flex;justify-content:space-between;align-items:start;gap:10px;">
                        <div style="flex:1;">
                            <p style="font-weight:700;color:#1a1a1a;margin:0 0 3px;font-size:15px;">${hl(item.title, query)}</p>
                            ${item.example ? `<p class="ltr-lock" style="font-size:12px;color:#888;margin:6px 0 0;font-style:italic;">${hl(item.example, query)}</p>` : ''}
                        </div>
                        <span style="background:#fef3c7;color:#d97706;padding:3px 8px;border-radius:4px;font-size:11px;font-weight:700;white-space:nowrap;">${item.level || ''}</span>
                    </div>
                </div>`;
            });
        }
        
        if (newsResults.length > 0) {
            html += `<h3 style="font-size:15px;font-weight:700;color:#087F5B;margin:20px 0 10px;padding-bottom:8px;border-bottom:2px solid #087F5B;">📰 ${lang === "fa" ? "اخبار" : "Actualités"} (${newsResults.length})</h3>`;
            newsResults.slice(0, 10).forEach(item => {
                html += `
                <div onclick="goToNews('${item.id}')" style="background:#f9fafb;border:1px solid #e0e0e0;border-radius:8px;padding:12px;margin-bottom:8px;cursor:pointer;transition:all 0.15s;"
                    onmouseover="this.style.background='#f0f9ff';this.style.borderColor='#087F5B'"
                    onmouseout="this.style.background='#f9fafb';this.style.borderColor='#e0e0e0'">
                    <p style="font-weight:700;color:#1a1a1a;margin:0 0 3px;font-size:15px;">${hl(lang === "fa" ? item.title_fa : item.title, query)}</p>
                    <p style="font-size:12px;color:#777;margin:0;">${item.publishedDate || ''} · ${item.level || ''}</p>
                </div>`;
            });
        }
        
        resultsDiv.innerHTML = html;
        
    } catch (e) {
        console.error("Search error:", e);
        resultsDiv.innerHTML = `<p style="text-align:center;color:#dc2626;padding:30px;">❌ ${lang === "fa" ? "خطا در جستجو" : "Erreur de recherche"}: ${e.message}</p>`;
    }
}

// رفتن به پک واژگان
function goToVocab(level, packId) {
    closeSearch();
    if (typeof showVocabPack === 'function') {
        showVocabPack(level, packId);
    }
}

// رفتن به درس گرامر
function goToGrammar(id) {
    closeSearch();
    if (typeof showGrammarLesson === 'function') {
        showGrammarLesson(id);
    }
}

// رفتن به خبر
function goToNews(id) {
    closeSearch();
    if (typeof showNewsDetail === 'function') {
        showNewsDetail(id);
    }
}

// هایلایت کلمه جستجو
function hl(text, query) {
    if (!text) return '';
    const escaped = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(`(${escaped})`, 'gi');
    return text.replace(regex, '<mark style="background:#fef08a;padding:0 2px;border-radius:2px;">$1</mark>');
}

// بارگذاری همه واژگان
async function loadAllVocab() {
    if (searchCache.vocab) return searchCache.vocab;
    
    const levels = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'];
    const allPacks = [];
    
    for (const level of levels) {
        try {
            const indexRes = await fetch(`./data/vocabulary/vocab-${level}.json`);
            if (!indexRes.ok) continue;
            const index = await indexRes.json();
            
            for (const pack of index) {
                try {
                    const packRes = await fetch(`./data/vocabulary/${level}/${pack.id}.json`);
                    if (!packRes.ok) continue;
                    const packData = await packRes.json();
                    packData.level = level; // ذخیره سطح
                    allPacks.push(packData);
                } catch (e) { /* نادیده گرفتن یک پک */ }
            }
        } catch (e) { /* نادیده گرفتن یک سطح */ }
    }
    
    console.log(`📖 Loaded ${allPacks.length} vocab packs`);
    searchCache.vocab = allPacks;
    return allPacks;
}

// بارگذاری همه گرامر
async function loadAllGrammar() {
    if (searchCache.grammar) return searchCache.grammar;
    
    const allLessons = [];
    
    // تلاش ۱: از grammar-index.json
    try {
        const res = await fetch('./data/grammar/grammar-index.json');
        if (res.ok) {
            const index = await res.json();
            for (const lesson of index) {
                try {
                    const lessonRes = await fetch(`./data/grammar/${lesson.id}.json`);
                    if (!lessonRes.ok) continue;
                    const lessonData = await lessonRes.json();
                    allLessons.push(lessonData);
                } catch (e) { /* نادیده گرفتن */ }
            }
            console.log(`📚 Loaded ${allLessons.length} grammar lessons (from index)`);
            searchCache.grammar = allLessons;
            return allLessons;
        }
    } catch (e) { /* ادامه به روش بعدی */ }
    
    // تلاش ۲: از فایل‌های سطح به سطح (A1/lessons.json, B1/lessons.json, ...)
    const levels = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'];
    for (const level of levels) {
        try {
            const res = await fetch(`./data/grammar/${level}/lessons.json`);
            if (!res.ok) continue;
            const index = await res.json();
            for (const lesson of index) {
                try {
                    const lessonRes = await fetch(`./data/grammar/${level}/${lesson.id}.json`);
                    if (!lessonRes.ok) continue;
                    const lessonData = await lessonRes.json();
                    lessonData.level = level;
                    allLessons.push(lessonData);
                } catch (e) { /* نادیده گرفتن */ }
            }
        } catch (e) { /* نادیده گرفتن */ }
    }
    
    console.log(`📚 Loaded ${allLessons.length} grammar lessons (from levels)`);
    searchCache.grammar = allLessons;
    return allLessons;
}

// بارگذاری همه اخبار
async function loadAllNews() {
    if (searchCache.news) return searchCache.news;
    
    try {
        const res = await fetch('./data/news/news-index.json');
        if (!res.ok) return [];
        const news = await res.json();
        console.log(`📰 Loaded ${news.length} news`);
        searchCache.news = news;
        return news;
    } catch (e) {
        console.warn("News load failed:", e);
        searchCache.news = [];
        return [];
    }
}
