// ===============================
// 🔍 سیستم جستجوی سایت
// ===============================

let searchCache = {
    vocab: null,
    grammar: null,
    news: null
};

// باز کردن مودال جستجو
function openSearch() {
    const lang = localStorage.getItem("language") || "fr";
    
    let html = `
    <div id="search-modal" style="position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(0,0,0,0.8);z-index:9999;display:flex;align-items:flex-start;justify-content:center;padding:60px 20px;overflow-y:auto;" onclick="if(event.target===this)closeSearch()">
        <div style="background:#fff;border-radius:12px;width:100%;max-width:800px;box-shadow:0 10px 40px rgba(0,0,0,0.3);overflow:hidden;">
            <!-- هدر -->
            <div style="background:#087F5B;padding:20px 24px;display:flex;justify-content:space-between;align-items:center;">
                <h2 style="color:#fff;margin:0;font-size:20px;">🔍 ${lang === "fa" ? "جستجو در سایت" : "Rechercher dans le site"}</h2>
                <button onclick="closeSearch()" style="background:rgba(255,255,255,0.2);border:none;border-radius:6px;padding:6px 12px;color:#fff;cursor:pointer;font-size:18px;"></button>
            </div>
            
            <!-- input جستجو -->
            <div style="padding:24px;border-bottom:1px solid #e0e0e0;">
                <input type="text" id="search-input" placeholder="${lang === "fa" ? "کلمه، عبارت یا موضوع را وارد کنید..." : "Entrez un mot, une expression ou un sujet..."}" 
                    style="width:100%;padding:16px 20px;font-size:16px;border:2px solid #e0e0e0;border-radius:8px;box-sizing:border-box;transition:border-color 0.2s;"
                    oninput="performSearch(this.value)" autofocus>
            </div>
            
            <!-- نتایج -->
            <div id="search-results" style="padding:24px;max-height:500px;overflow-y:auto;">
                <p style="text-align:center;color:#777;padding:40px;">${lang === "fa" ? "برای جستجو تایپ کنید..." : "Commencez à taper pour rechercher..."}</p>
            </div>
        </div>
    </div>`;
    
    document.body.insertAdjacentHTML('beforeend', html);
    document.getElementById('search-input').focus();
    
    // بستن با کلید Escape
    document.addEventListener('keydown', function handleEscape(e) {
        if (e.key === 'Escape') {
            closeSearch();
            document.removeEventListener('keydown', handleEscape);
        }
    });
}

// بستن مودال
function closeSearch() {
    const modal = document.getElementById('search-modal');
    if (modal) {
        modal.remove();
    }
}

// انجام جستجو
async function performSearch(query) {
    const resultsDiv = document.getElementById('search-results');
    const lang = localStorage.getItem("language") || "fr";
    
    if (!query || query.length < 2) {
        resultsDiv.innerHTML = `<p style="text-align:center;color:#777;padding:40px;">${lang === "fa" ? "حداقل ۲ حرف وارد کنید..." : "Entrez au moins 2 caractères..."}</p>`;
        return;
    }
    
    resultsDiv.innerHTML = `<p style="text-align:center;color:#777;padding:40px;">🔄 ${lang === "fa" ? "در حال جستجو..." : "Recherche en cours..."}</p>`;
    
    // بارگذاری داده‌ها
    const [vocabData, grammarData, newsData] = await Promise.all([
        loadAllVocab(),
        loadAllGrammar(),
        loadAllNews()
    ]);
    
    const results = {
        vocab: searchInVocab(query, vocabData, lang),
        grammar: searchInGrammar(query, grammarData, lang),
        news: searchInNews(query, newsData, lang)
    };
    
    const totalResults = results.vocab.length + results.grammar.length + results.news.length;
    
    if (totalResults === 0) {
        resultsDiv.innerHTML = `<p style="text-align:center;color:#777;padding:40px;">${lang === "fa" ? " نتیجه‌ای پیدا نشد." : "Aucun résultat trouvé."}</p>`;
        return;
    }
    
    // نمایش نتایج
    let html = '';
    
    // واژگان
    if (results.vocab.length > 0) {
        html += `<h3 style="font-size:16px;font-weight:700;color:#087F5B;margin:0 0 12px;padding-bottom:8px;border-bottom:2px solid #e0e0e0;"> ${lang === "fa" ? "واژگان" : "Vocabulaire"} (${results.vocab.length})</h3>`;
        results.vocab.forEach(item => {
            html += `
            <div style="background:#f9fafb;border:1px solid #e0e0e0;border-radius:8px;padding:14px;margin-bottom:10px;cursor:pointer;transition:all 0.2s;" 
                onmouseover="this.style.background='#f0f9ff';this.style.borderColor='#087F5B'" 
                onmouseout="this.style.background='#f9fafb';this.style.borderColor='#e0e0e0'"
                onclick="showVocabPack('${item.level}','${item.packId}');closeSearch();">
                <div style="display:flex;justify-content:space-between;align-items:start;">
                    <div>
                        <p class="ltr-lock" style="font-weight:700;color:#1a1a1a;margin:0 0 4px;font-size:16px;">${highlightMatch(item.fr, query)}</p>
                        <p class="persian-text" style="font-size:14px;color:#777;margin:0;">${highlightMatch(item.fa, query)}</p>
                        ${item.ex ? `<p class="ltr-lock" style="font-size:13px;color:#555;margin:8px 0 0;font-style:italic;">${highlightMatch(item.ex, query)}</p>` : ''}
                    </div>
                    <span style="background:#e8f5f0;color:#087F5B;padding:4px 10px;border-radius:4px;font-size:11px;font-weight:700;">${item.level}</span>
                </div>
            </div>`;
        });
    }
    
    // گرامر
    if (results.grammar.length > 0) {
        html += `<h3 style="font-size:16px;font-weight:700;color:#087F5B;margin:24px 0 12px;padding-bottom:8px;border-bottom:2px solid #e0e0e0;">📚 ${lang === "fa" ? "گرامر" : "Grammaire"} (${results.grammar.length})</h3>`;
        results.grammar.forEach(item => {
            html += `
            <div style="background:#f9fafb;border:1px solid #e0e0e0;border-radius:8px;padding:14px;margin-bottom:10px;cursor:pointer;transition:all 0.2s;"
                onmouseover="this.style.background='#f0f9ff';this.style.borderColor='#087F5B'"
                onmouseout="this.style.background='#f9fafb';this.style.borderColor='#e0e0e0'"
                onclick="showGrammarLesson('${item.id}');closeSearch();">
                <div style="display:flex;justify-content:space-between;align-items:start;">
                    <div>
                        <p style="font-weight:700;color:#1a1a1a;margin:0 0 4px;font-size:16px;">${highlightMatch(item.title, query)}</p>
                        ${item.example ? `<p class="ltr-lock" style="font-size:13px;color:#555;margin:8px 0 0;font-style:italic;">${highlightMatch(item.example, query)}</p>` : ''}
                    </div>
                    <span style="background:#fef3c7;color:#d97706;padding:4px 10px;border-radius:4px;font-size:11px;font-weight:700;">${item.level}</span>
                </div>
            </div>`;
        });
    }
    
    // اخبار
    if (results.news.length > 0) {
        html += `<h3 style="font-size:16px;font-weight:700;color:#087F5B;margin:24px 0 12px;padding-bottom:8px;border-bottom:2px solid #e0e0e0;">📰 ${lang === "fa" ? "اخبار" : "Actualités"} (${results.news.length})</h3>`;
        results.news.forEach(item => {
            html += `
            <div style="background:#f9fafb;border:1px solid #e0e0e0;border-radius:8px;padding:14px;margin-bottom:10px;cursor:pointer;transition:all 0.2s;"
                onmouseover="this.style.background='#f0f9ff';this.style.borderColor='#087F5B'"
                onmouseout="this.style.background='#f9fafb';this.style.borderColor='#e0e0e0'"
                onclick="showNewsDetail('${item.id}');closeSearch();">
                <div>
                    <p style="font-weight:700;color:#1a1a1a;margin:0 0 4px;font-size:16px;">${highlightMatch(lang === "fa" ? item.title_fa : item.title, query)}</p>
                    <p style="font-size:13px;color:#777;margin:0;">${item.publishedDate} · ${item.level}</p>
                </div>
            </div>`;
        });
    }
    
    resultsDiv.innerHTML = html;
}

// جستجو در واژگان
function searchInVocab(query, data, lang) {
    const results = [];
    const lowerQuery = query.toLowerCase();
    
    data.forEach(pack => {
        pack.words.forEach(word => {
            const matchFr = word.fr.toLowerCase().includes(lowerQuery);
            const matchFa = word.fa.toLowerCase().includes(lowerQuery);
            const matchEx = word.ex ? word.ex.toLowerCase().includes(lowerQuery) : false;
            const matchExFa = word.ex_fa ? word.ex_fa.toLowerCase().includes(lowerQuery) : false;
            
            if (matchFr || matchFa || matchEx || matchExFa) {
                results.push({
                    fr: word.fr,
                    fa: word.fa,
                    ex: word.ex,
                    ex_fa: word.ex_fa,
                    level: pack.level,
                    packId: pack.id
                });
            }
        });
    });
    
    return results.slice(0, 20); // محدود کردن به ۲۰ نتیجه
}

// جستجو در گرامر
function searchInGrammar(query, data, lang) {
    const results = [];
    const lowerQuery = query.toLowerCase();
    
    data.forEach(lesson => {
        const matchTitle = lesson.title.toLowerCase().includes(lowerQuery);
        const matchTitleFa = lesson.title_fa ? lesson.title_fa.toLowerCase().includes(lowerQuery) : false;
        const matchContent = lesson.content ? lesson.content.toLowerCase().includes(lowerQuery) : false;
        
        if (matchTitle || matchTitleFa || matchContent) {
            results.push({
                id: lesson.id,
                title: lesson.title,
                title_fa: lesson.title_fa,
                example: lesson.example,
                level: lesson.level
            });
        }
    });
    
    return results.slice(0, 20);
}

// جستجو در اخبار
function searchInNews(query, data, lang) {
    const results = [];
    const lowerQuery = query.toLowerCase();
    
    data.forEach(news => {
        const matchTitle = (lang === "fa" ? news.title_fa : news.title).toLowerCase().includes(lowerQuery);
        const matchSubtitle = (lang === "fa" ? news.subtitle_fa : news.subtitle).toLowerCase().includes(lowerQuery);
        const matchContent = news.content ? 
            (news.content.fullText.toLowerCase().includes(lowerQuery) || 
             news.content.simpleText.toLowerCase().includes(lowerQuery)) : false;
        
        if (matchTitle || matchSubtitle || matchContent) {
            results.push({
                id: news.id,
                title: news.title,
                title_fa: news.title_fa,
                publishedDate: news.publishedDate,
                level: news.level
            });
        }
    });
    
    return results.slice(0, 10);
}

// هایلایت کردن کلمه جستجو
function highlightMatch(text, query) {
    if (!text) return '';
    const regex = new RegExp(`(${query})`, 'gi');
    return text.replace(regex, '<mark style="background:#fef08a;padding:0 2px;border-radius:2px;">$1</mark>');
}

// بارگذاری همه واژگان
async function loadAllVocab() {
    if (searchCache.vocab) return searchCache.vocab;
    
    const levels = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'];
    const allPacks = [];
    
    for (const level of levels) {
        try {
            const index = await fetch(`./data/vocabulary/vocab-${level}.json`).then(r => r.json());
            for (const pack of index) {
                try {
                    const packData = await fetch(`./data/vocabulary/${level}/${pack.id}.json`).then(r => r.json());
                    allPacks.push(packData);
                } catch (e) { /* نادیده گرفتن */ }
            }
        } catch (e) { /* نادیده گرفتن */ }
    }
    
    searchCache.vocab = allPacks;
    return allPacks;
}

// بارگذاری همه گرامر
async function loadAllGrammar() {
    if (searchCache.grammar) return searchCache.grammar;
    
    try {
        const grammar = await fetch('./data/grammar/grammar-index.json').then(r => r.json());
        searchCache.grammar = grammar;
        return grammar;
    } catch (e) {
        searchCache.grammar = [];
        return [];
    }
}

// بارگذاری همه اخبار
async function loadAllNews() {
    if (searchCache.news) return searchCache.news;
    
    try {
        const news = await fetch('./data/news/news-index.json').then(r => r.json());
        searchCache.news = news;
        return news;
    } catch (e) {
        searchCache.news = [];
        return [];
    }
}
