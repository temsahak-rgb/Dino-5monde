/**
 * News index rendering and article-detail presentation.
 */

const cefrRank: Record<Level, number> = {
    A1: 1,
    A2: 2,
    B1: 3,
    B2: 4,
    C1: 5,
    C2: 6
};

/** Renders the current news card shown on the home page. */
async function renderNewsSection(): Promise<string> {
    const lang = getLanguage();

    try {
        const response = await fetch(`./data/news/news-index.json?v=${Date.now()}`);
        if (!response.ok) return "";

        const allNews = await response.json() as NewsIndexItem[];
        const currentNews = allNews[0];
        if (!currentNews) return "";

        return `<div style="background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 4px 12px rgba(0,0,0,0.1);margin-bottom:30px;cursor:pointer;" onclick="showNewsDetail('${currentNews.id}')">
            <div style="position:relative;height:350px;overflow:hidden;">
                <img src="${currentNews.image}" alt="${currentNews.title}" style="width:100%;height:100%;object-fit:cover;">
                <div style="position:absolute;top:15px;right:15px;display:flex;gap:8px;">
                    <span style="background:#087F5B;color:#fff;padding:6px 12px;border-radius:6px;font-size:13px;font-weight:700;">${currentNews.level}</span>
                    <span style="background:rgba(0,0,0,0.7);color:#fff;padding:6px 12px;border-radius:6px;font-size:13px;font-weight:700;">📰 ${lang === "fa" ? "خبر هفته" : "Actualité"}</span>
                </div>
                <div style="position:absolute;bottom:0;left:0;right:0;background:linear-gradient(to top, rgba(0,0,0,0.9), transparent);padding:25px;color:#fff;">
                    <h2 style="font-size:24px;font-weight:700;margin:0 0 8px;">${lang === "fa" ? currentNews.title_fa || currentNews.title : currentNews.title}</h2>
                    <p style="font-size:15px;margin:0;opacity:0.9;">${lang === "fa" ? currentNews.subtitle_fa || currentNews.subtitle || "" : currentNews.subtitle || ""}</p>
                </div>
            </div>
            <div style="padding:15px 25px;display:flex;justify-content:space-between;align-items:center;border-top:1px solid #f0f0f0;">
                <span style="font-size:13px;color:#777;">📅 ${currentNews.publishedDate}</span>
                <span style="font-size:14px;font-weight:700;color:#087F5B;">${lang === "fa" ? "مشاهده کامل ←" : "Lire la suite ←"}</span>
            </div>
        </div>`;
    } catch (error) {
        console.warn("News section skipped:", error);
        return "";
    }
}

/** Loads and displays a complete news article. */
async function showNewsDetail(newsId: string): Promise<void> {
    const lang = getLanguage();
    const userLevel = getPlacementResult() || "A1";
    const userLevelRank = cefrRank[userLevel];

    try {
        const response = await fetch(`./data/news/${newsId}.json?v=${Date.now()}`);
        if (!response.ok) throw new Error("News not found");
        const news = await response.json() as NewsArticle;

        let html = renderNavbar();
        html += `<div style="max-width:900px;margin:0 auto;padding:20px 16px 60px;">
            <button class="back-btn" onclick="showHome()" style="margin-bottom:20px;">← ${lang === "fa" ? "بازگشت به خانه" : "Retour à l'accueil"}</button>
            <img src="${news.image}" alt="${news.imageAlt || news.title}" style="width:100%;max-height:500px;object-fit:cover;border-radius:12px;margin-bottom:20px;">
            <div style="display:flex;gap:10px;align-items:center;margin-bottom:15px;flex-wrap:wrap;">
                <span style="background:#087F5B;color:#fff;padding:6px 12px;border-radius:6px;font-size:13px;font-weight:700;">${news.level}</span>
                <span style="font-size:14px;color:#777;">📅 ${news.publishedDate}</span>
            </div>
            <h1 style="font-size:28px;font-weight:700;color:#1a1a1a;margin:0 0 10px;line-height:1.3;">${lang === "fa" ? news.title_fa || news.title : news.title}</h1>
            <p style="font-size:16px;color:#555;margin:0 0 30px;">${lang === "fa" ? news.subtitle_fa || news.subtitle || "" : news.subtitle || ""}</p>
            <div style="display:flex;gap:10px;margin-bottom:20px;background:#f9fafb;padding:10px;border-radius:8px;">
                <button id="btn-full" onclick="switchNewsText('full')" style="flex:1;padding:10px;font-size:14px;font-weight:700;border:2px solid #087F5B;border-radius:6px;background:#087F5B;color:#fff;cursor:pointer;">📖 ${lang === "fa" ? "متن کامل" : "Texte complet"}</button>
                <button id="btn-simple" onclick="switchNewsText('simple')" style="flex:1;padding:10px;font-size:14px;font-weight:600;border:2px solid #e0e0e0;border-radius:6px;background:#fff;color:#1a1a1a;cursor:pointer;">🌱 ${lang === "fa" ? "متن ساده" : "Texte simple"}</button>
            </div>
            <div id="news-full-text" style="background:#fff;border:1px solid #e0e0e0;border-radius:8px;padding:30px;margin-bottom:30px;">
                <div style="font-size:16px;line-height:1.9;color:#333;white-space:pre-line;">${news.content.fullText}</div>
            </div>
            <div id="news-simple-text" style="display:none;background:#f0f9ff;border:1px solid #087F5B;border-radius:8px;padding:30px;margin-bottom:30px;">
                <p style="font-size:13px;color:#087F5B;font-weight:700;margin:0 0 12px;">🌱 ${lang === "fa" ? "نسخه ساده‌شده" : "Version simplifiée"}</p>
                <div style="font-size:16px;line-height:1.9;color:#333;white-space:pre-line;">${news.content.simpleText}</div>
            </div>`;

        const vocabulary = news.content.vocabulary?.filter(item => !item.level || cefrRank[item.level] <= userLevelRank + 1) ?? [];
        if (vocabulary.length) {
            html += `<details style="background:#fff;border:1px solid #e0e0e0;border-radius:8px;margin-bottom:20px;overflow:hidden;">
                <summary style="padding:18px 24px;font-weight:700;color:#087F5B;cursor:pointer;background:#f9fafb;display:flex;justify-content:space-between;align-items:center;list-style:none;">
                    <span>📚 ${lang === "fa" ? "واژگان کلیدی" : "Vocabulaire clé"}</span><span style="font-size:18px;">▼</span>
                </summary>
                <div style="padding:0 24px 24px 24px;border-top:1px solid #e0e0e0;">
                    <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(250px,1fr));gap:10px;margin-top:20px;">
                        ${vocabulary.map(word => `<div style="background:#f9fafb;padding:12px 16px;border-radius:6px;border-right:4px solid #087F5B;">
                            <p class="ltr-lock" style="font-weight:700;color:#1a1a1a;margin:0 0 4px;font-size:15px;">${word.fr} ${word.level ? `<span style="font-size:11px;background:#e0e0e0;padding:2px 6px;border-radius:4px;color:#555;">${word.level}</span>` : ""}</p>
                            <p class="persian-text" style="font-size:14px;color:#777;margin:0;">${word.fa}</p>
                        </div>`).join("")}
                    </div>
                </div>
            </details>`;
        }

        const grammar = news.content.grammar?.filter(item => !item.level || cefrRank[item.level] <= userLevelRank + 1) ?? [];
        if (news.content.grammar?.length) {
            if (grammar.length) {
                html += `<details style="background:#fff;border:1px solid #e0e0e0;border-radius:8px;margin-bottom:20px;overflow:hidden;">
                    <summary style="padding:18px 24px;font-weight:700;color:#087F5B;cursor:pointer;background:#f9fafb;display:flex;justify-content:space-between;align-items:center;list-style:none;">
                        <span>📐 ${lang === "fa" ? "نکات گرامری" : "Points de grammaire"}</span><span style="font-size:18px;">▼</span>
                    </summary>
                    <div style="padding:0 24px 24px 24px;border-top:1px solid #e0e0e0;">`;

                grammar.forEach((item, index) => {
                    const grammarLink = item.grammarId
                        ? `<a href="#" onclick="showGrammarLesson('${item.grammarId}'); return false;" style="display:inline-block;margin-top:10px;font-size:13px;font-weight:700;color:#087F5B;text-decoration:none;background:#e8f5f0;padding:6px 12px;border-radius:6px;">🔗 ${lang === "fa" ? "مشاهده درس گرامر" : "Voir la leçon de grammaire"}</a>`
                        : item.level
                            ? `<p style="font-size:12px;color:#999;margin-top:10px;">${lang === "fa" ? `⚠️ این نکته برای سطح ${item.level} است.` : `⚠️ Ce point est pour le niveau ${item.level}.`}</p>`
                            : "";

                    html += `<div style="background:#f9fafb;border:1px solid #e0e0e0;border-radius:8px;padding:20px;margin-bottom:15px;margin-top:20px;">
                        <h3 style="font-size:16px;font-weight:700;color:#1a1a1a;margin:0 0 10px;">${index + 1}. ${item.title} ${item.level ? `<span style="font-size:12px;background:#087F5B;color:#fff;padding:2px 8px;border-radius:4px;margin-right:8px;">${item.level}</span>` : ""}</h3>
                        <div class="ltr-lock" style="background:#fff;padding:12px;border-radius:6px;margin:10px 0;font-size:15px;line-height:1.7;border-left:3px solid #087F5B;font-style:italic;">${item.example}</div>
                        ${item.translation ? `<p class="persian-text" style="font-size:14px;color:#555;margin:10px 0;">${item.translation}</p>` : ""}
                        ${item.explanation ? `<p class="persian-text" style="font-size:14px;color:#777;margin:8px 0 0;">💡 ${item.explanation}</p>` : ""}
                        ${grammarLink}
                    </div>`;
                });
                html += `</div></details>`;
            } else {
                html += `<div style="background:#fffbeb;border:1px solid #fde68a;border-radius:8px;padding:16px;margin-bottom:20px;text-align:center;color:#92400e;">${lang === "fa" ? "💡 نکات گرامری این متن برای سطح فعلی شما پیشرفته است و پنهان شده‌اند." : "💡 Les points de grammaire de ce texte sont trop avancés pour votre niveau et ont été masqués."}</div>`;
            }
        }

        if (news.sources?.length) {
            html += `<details style="background:#fff;border:1px solid #e0e0e0;border-radius:8px;margin-bottom:20px;overflow:hidden;">
                <summary style="padding:18px 24px;font-weight:700;color:#1a1a1a;cursor:pointer;background:#f9fafb;display:flex;justify-content:space-between;align-items:center;list-style:none;">
                    <span>📖 ${lang === "fa" ? "منابع" : "Sources"}</span><span style="font-size:18px;">▼</span>
                </summary>
                <div style="padding:0 24px 24px 24px;border-top:1px solid #e0e0e0;">
                    <div style="display:flex;flex-direction:column;gap:10px;margin-top:20px;">
                        ${news.sources.map(source => `<a href="${source.url}" target="_blank" rel="noopener noreferrer" style="padding:12px 16px;background:#fff;border:1px solid #e0e0e0;border-radius:6px;color:#087F5B;text-decoration:none;font-weight:600;display:flex;justify-content:space-between;align-items:center;"><span>${source.title}</span><span>↗</span></a>`).join("")}
                    </div>
                </div>
            </details>`;
        }

        html += `</div>`;
        app.innerHTML = html;
        window.scrollTo(0, 0);
    } catch (error) {
        console.error("News detail error:", error);
        app.innerHTML = renderNavbar() + `<div style="text-align:center;padding:60px 16px;">
            <p style="font-size:18px;color:#777;">❌ ${lang === "fa" ? "این خبر پیدا نشد." : "Cet article est introuvable."}</p>
            <button onclick="showHome()" style="margin-top:15px;padding:10px 20px;border:1px solid #ddd;border-radius:6px;background:#fff;cursor:pointer;">${lang === "fa" ? "بازگشت" : "Retour"}</button>
        </div>`;
    }
}

/** Switches between full and simplified article text. */
function switchNewsText(mode: "full" | "simple"): void {
    const fullDiv = getRequiredElement<HTMLElement>("news-full-text");
    const simpleDiv = getRequiredElement<HTMLElement>("news-simple-text");
    const fullButton = getRequiredElement<HTMLButtonElement>("btn-full");
    const simpleButton = getRequiredElement<HTMLButtonElement>("btn-simple");

    const fullMode = mode === "full";
    fullDiv.style.display = fullMode ? "block" : "none";
    simpleDiv.style.display = fullMode ? "none" : "block";

    fullButton.style.background = fullMode ? "#087F5B" : "#fff";
    fullButton.style.color = fullMode ? "#fff" : "#1a1a1a";
    fullButton.style.borderColor = fullMode ? "#087F5B" : "#e0e0e0";

    simpleButton.style.background = fullMode ? "#fff" : "#087F5B";
    simpleButton.style.color = fullMode ? "#1a1a1a" : "#fff";
    simpleButton.style.borderColor = fullMode ? "#e0e0e0" : "#087F5B";
}