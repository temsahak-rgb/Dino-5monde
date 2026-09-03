/**
 * Cross-feature search over vocabulary packs, grammar indexes, and news.
 */

interface SearchCache {
    vocab: VocabPack[] | null;
    grammar: SearchGrammarItem[] | null;
    news: NewsIndexItem[] | null;
}

const searchCache: SearchCache = {
    vocab: null,
    grammar: null,
    news: null
};

/** Returns a readable message for an unknown caught value. */
function searchErrorMessage(error: unknown): string {
    return error instanceof Error ? error.message : String(error);
}

/** Opens the site-wide search modal. */
function openSearch(): void {
    const lang = getLanguage();
    const existingModal = document.getElementById("search-modal");
    if (existingModal) {
        getRequiredElement<HTMLInputElement>("search-input").focus();
        return;
    }

    const modal = document.createElement("div");
    modal.id = "search-modal";
    modal.style.cssText = "position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(0,0,0,0.85);z-index:9999;display:flex;align-items:flex-start;justify-content:center;padding:40px 16px;overflow-y:auto;";
    modal.onclick = event => {
        if (event.target === modal) closeSearch();
    };

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
        </div>`;

    document.body.appendChild(modal);

    const input = getRequiredElement<HTMLInputElement>("search-input");
    input.focus();
    input.oninput = () => { void performSearch(input.value); };

    document.onkeydown = event => {
        if (event.key === "Escape") closeSearch();
    };
}

/** Closes the search modal and removes its keyboard listener. */
function closeSearch(): void {
    document.getElementById("search-modal")?.remove();
    document.onkeydown = null;
}

/** Searches every indexed content family and renders matching results. */
async function performSearch(query: string): Promise<void> {
    const resultsDiv = getRequiredElement<HTMLElement>("search-results");
    const lang = getLanguage();

    if (query.length < 2) {
        resultsDiv.innerHTML = `<p style="text-align:center;color:#999;padding:30px;">${lang === "fa" ? "حداقل ۲ حرف تایپ کنید..." : "Tapez au moins 2 caractères..."}</p>`;
        return;
    }

    resultsDiv.innerHTML = `<p style="text-align:center;color:#999;padding:30px;">🔄 ${lang === "fa" ? "در حال جستجو..." : "Recherche..."}</p>`;

    try {
        const [vocabData, grammarData, newsData] = await Promise.all([
            loadAllVocab().catch(error => { console.warn("Vocab load error:", error); return []; }),
            loadAllGrammar().catch(error => { console.warn("Grammar load error:", error); return []; }),
            loadAllNews().catch(error => { console.warn("News load error:", error); return []; })
        ]);

        const lowerQuery = query.toLowerCase();
        const vocabResults: SearchVocabWord[] = [];
        const grammarResults: SearchGrammarItem[] = [];
        const newsResults: NewsIndexItem[] = [];

        vocabData.forEach(pack => {
            pack.words.forEach(word => {
                const searchable = [word.fr, word.fa, word.ex, word.ex_fa].filter(Boolean).join(" ").toLowerCase();
                if (searchable.includes(lowerQuery)) {
                    vocabResults.push({ ...word, level: pack.level, packId: pack.id });
                }
            });
        });

        grammarData.forEach(lesson => {
            const searchable = [lesson.title, lesson.title_fa, lesson.content, lesson.example].filter(Boolean).join(" ").toLowerCase();
            if (searchable.includes(lowerQuery)) grammarResults.push(lesson);
        });

        newsData.forEach(news => {
            const searchable = [news.title, news.title_fa, news.subtitle, news.subtitle_fa].filter(Boolean).join(" ").toLowerCase();
            if (searchable.includes(lowerQuery)) newsResults.push(news);
        });

        if (vocabResults.length + grammarResults.length + newsResults.length === 0) {
            resultsDiv.innerHTML = `<p style="text-align:center;color:#999;padding:40px;">${lang === "fa" ? "نتیجه‌ای پیدا نشد." : "Aucun résultat."}</p>`;
            return;
        }

        let html = "";

        if (vocabResults.length) {
            html += `<h3 style="font-size:15px;font-weight:700;color:#087F5B;margin:0 0 10px;padding-bottom:8px;border-bottom:2px solid #087F5B;">📖 ${lang === "fa" ? "واژگان" : "Vocabulaire"} (${vocabResults.length})</h3>`;
            vocabResults.slice(0, 15).forEach(item => {
                html += `<div onclick="goToVocab('${item.level}','${item.packId}')" style="background:#f9fafb;border:1px solid #e0e0e0;border-radius:8px;padding:12px;margin-bottom:8px;cursor:pointer;transition:all 0.15s;" onmouseover="this.style.background='#f0f9ff';this.style.borderColor='#087F5B'" onmouseout="this.style.background='#f9fafb';this.style.borderColor='#e0e0e0'">
                    <div style="display:flex;justify-content:space-between;align-items:start;gap:10px;">
                        <div style="flex:1;">
                            <p class="ltr-lock" style="font-weight:700;color:#1a1a1a;margin:0 0 3px;font-size:15px;">${hl(item.fr, query)}</p>
                            <p class="persian-text" style="font-size:13px;color:#777;margin:0;">${hl(item.fa, query)}</p>
                            ${item.ex ? `<p class="ltr-lock" style="font-size:12px;color:#888;margin:6px 0 0;font-style:italic;">${hl(item.ex, query)}</p>` : ""}
                        </div>
                        <span style="background:#e8f5f0;color:#087F5B;padding:3px 8px;border-radius:4px;font-size:11px;font-weight:700;white-space:nowrap;">${item.level}</span>
                    </div>
                </div>`;
            });
        }

        if (grammarResults.length) {
            html += `<h3 style="font-size:15px;font-weight:700;color:#087F5B;margin:20px 0 10px;padding-bottom:8px;border-bottom:2px solid #087F5B;">📚 ${lang === "fa" ? "گرامر" : "Grammaire"} (${grammarResults.length})</h3>`;
            grammarResults.slice(0, 15).forEach(item => {
                html += `<div onclick="goToGrammar('${item.id}')" style="background:#f9fafb;border:1px solid #e0e0e0;border-radius:8px;padding:12px;margin-bottom:8px;cursor:pointer;transition:all 0.15s;" onmouseover="this.style.background='#f0f9ff';this.style.borderColor='#087F5B'" onmouseout="this.style.background='#f9fafb';this.style.borderColor='#e0e0e0'">
                    <div style="display:flex;justify-content:space-between;align-items:start;gap:10px;">
                        <div style="flex:1;">
                            <p style="font-weight:700;color:#1a1a1a;margin:0 0 3px;font-size:15px;">${hl(item.title, query)}</p>
                            ${item.example ? `<p class="ltr-lock" style="font-size:12px;color:#888;margin:6px 0 0;font-style:italic;">${hl(item.example, query)}</p>` : ""}
                        </div>
                        <span style="background:#fef3c7;color:#d97706;padding:3px 8px;border-radius:4px;font-size:11px;font-weight:700;white-space:nowrap;">${item.level}</span>
                    </div>
                </div>`;
            });
        }

        if (newsResults.length) {
            html += `<h3 style="font-size:15px;font-weight:700;color:#087F5B;margin:20px 0 10px;padding-bottom:8px;border-bottom:2px solid #087F5B;">📰 ${lang === "fa" ? "اخبار" : "Actualités"} (${newsResults.length})</h3>`;
            newsResults.slice(0, 10).forEach(item => {
                html += `<div onclick="goToNews('${item.id}')" style="background:#f9fafb;border:1px solid #e0e0e0;border-radius:8px;padding:12px;margin-bottom:8px;cursor:pointer;transition:all 0.15s;" onmouseover="this.style.background='#f0f9ff';this.style.borderColor='#087F5B'" onmouseout="this.style.background='#f9fafb';this.style.borderColor='#e0e0e0'">
                    <p style="font-weight:700;color:#1a1a1a;margin:0 0 3px;font-size:15px;">${hl(lang === "fa" ? item.title_fa || item.title : item.title, query)}</p>
                    <p style="font-size:12px;color:#777;margin:0;">${item.publishedDate} · ${item.level}</p>
                </div>`;
            });
        }

        resultsDiv.innerHTML = html;
    } catch (error) {
        console.error("Search error:", error);
        resultsDiv.innerHTML = `<p style="text-align:center;color:#dc2626;padding:30px;">❌ ${lang === "fa" ? "خطا در جستجو" : "Erreur de recherche"}: ${searchErrorMessage(error)}</p>`;
    }
}

/** Navigates from a search result to a vocabulary pack. */
function goToVocab(level: Level, packId: string): void {
    closeSearch();
    void showVocabPack(level, packId);
}

/** Navigates from a search result to a grammar lesson. */
function goToGrammar(id: string): void {
    closeSearch();
    void showGrammarLesson(id);
}

/** Navigates from a search result to a news article. */
function goToNews(id: string): void {
    closeSearch();
    void showNewsDetail(id);
}

/** Highlights a case-insensitive query inside a result string. */
function hl(text: string | undefined, query: string): string {
    if (!text) return "";
    const escaped = query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    return text.replace(new RegExp(`(${escaped})`, "gi"), '<mark style="background:#fef08a;padding:0 2px;border-radius:2px;">$1</mark>');
}

/** Loads every vocabulary pack used by search. */
async function loadAllVocab(): Promise<VocabPack[]> {
    if (searchCache.vocab) return searchCache.vocab;

    const levels: Level[] = ["A1", "A2", "B1", "B2", "C1", "C2"];
    const allPacks: VocabPack[] = [];

    for (const level of levels) {
        try {
            const indexResponse = await fetch(`./data/vocabulary/vocab-${level}.json`);
            if (!indexResponse.ok) continue;
            const index = await indexResponse.json() as VocabPackIndex[];

            for (const pack of index) {
                try {
                    const packResponse = await fetch(`./data/vocabulary/${level}/${pack.id}.json`);
                    if (!packResponse.ok) continue;
                    const packData = await packResponse.json() as VocabPack;
                    packData.level = level;
                    allPacks.push(packData);
                } catch {
                    // One invalid pack must not disable global search.
                }
            }
        } catch {
            // One unavailable level must not disable global search.
        }
    }

    searchCache.vocab = allPacks;
    return allPacks;
}

/** Loads grammar indexes from the actual level-based catalog files. */
async function loadAllGrammar(): Promise<SearchGrammarItem[]> {
    if (searchCache.grammar) return searchCache.grammar;

    const levels: Level[] = ["A1", "A2", "B1", "B2", "C1", "C2"];
    const allLessons: SearchGrammarItem[] = [];

    for (const level of levels) {
        try {
            const response = await fetch(`./data/grammar-${level}.json`);
            if (!response.ok) continue;
            const lessons = await response.json() as GrammarLessonIndex[];
            allLessons.push(...lessons);
        } catch {
            // Missing grammar levels are ignored by search.
        }
    }

    searchCache.grammar = allLessons;
    return allLessons;
}

/** Loads the complete news index used by search. */
async function loadAllNews(): Promise<NewsIndexItem[]> {
    if (searchCache.news) return searchCache.news;

    try {
        const response = await fetch("./data/news/news-index.json");
        if (!response.ok) return [];
        const news = await response.json() as NewsIndexItem[];
        searchCache.news = news;
        return news;
    } catch (error) {
        console.warn("News load failed:", error);
        searchCache.news = [];
        return [];
    }
}