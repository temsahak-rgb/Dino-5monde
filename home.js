// ===============================
// 📊 بخش نظرسنجی مستقل
// ===============================
async function renderPollSection() {
    const lang = localStorage.getItem("language") || "fr";
    
    try {
        const response = await fetch("./data/polls/polls.json?v=" + Date.now());
        if (!response.ok) return "";
        
        const pollsData = await response.json();
        if (!pollsData || !pollsData.activePoll) return "";
        
        const poll = pollsData.activePoll;
        const pollVoted = localStorage.getItem("dino_poll_voted_" + poll.id);
        const pollChoice = localStorage.getItem("dino_poll_choice_" + poll.id);
        
        let html = "";
        
        html += `<div style="background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 4px 12px rgba(0,0,0,0.1);margin-bottom:30px;">`;
        
        // هدر نظرسنجی
        html += `<div style="background:linear-gradient(135deg,#667eea 0%,#764ba2 100%);padding:24px 30px;">`;
        html += `<h2 style="font-size:22px;font-weight:700;color:#fff;margin:0 0 8px;">📊 ${lang === "fa" ? "نظرسنجی هفته" : "Sondage de la semaine"}</h2>`;
        html += `<p style="font-size:14px;color:rgba(255,255,255,0.9);margin:0;">${lang === "fa" ? "نظر شما برای ما مهم است!" : "Votre avis compte pour nous!"}</p>`;
        html += `</div>`;
        
        // محتوای نظرسنجی
        html += `<div style="padding:30px;">`;
        
        // سوال
        html += `<p style="font-size:18px;font-weight:700;color:#1a1a1a;margin:0 0 24px;line-height:1.5;">${lang === "fa" ? poll.question : poll.question_fr}</p>`;
        
        if (pollVoted && pollChoice) {
            // نمایش نتایج (کاربر رای داده)
            html += `<div style="background:#f0f9ff;border:2px solid #087F5B;border-radius:8px;padding:20px;margin-bottom:16px;">`;
            
            const totalVotes = parseInt(localStorage.getItem("dino_poll_total_" + poll.id) || "0");
            
            poll.options.forEach(option => {
                const optionVotes = parseInt(localStorage.getItem("dino_poll_" + poll.id + "_" + option.id) || "0");
                const percentage = totalVotes > 0 ? Math.round((optionVotes / totalVotes) * 100) : 0;
                const isSelected = option.id === pollChoice;
                
                html += `<div style="margin-bottom:16px;">`;
                html += `<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;">`;
                html += `<span style="font-weight:${isSelected ? '700' : '500'};color:${isSelected ? '#087F5B' : '#1a1a1a'};">`;
                html += `${lang === "fa" ? option.labelFa : option.labelFr}`;
                if (isSelected) html += ` ✅`;
                html += `</span>`;
                html += `<span style="font-weight:700;color:#087F5B;">${percentage}%</span>`;
                html += `</div>`;
                
                // نوار پیشرفت
                html += `<div style="background:#e0e0e0;border-radius:4px;height:8px;overflow:hidden;">`;
                html += `<div style="background:${isSelected ? '#087F5B' : '#a7f3d0'};height:100%;width:${percentage}%;transition:width 0.5s;"></div>`;
                html += `</div>`;
                html += `</div>`;
            });
            
            html += `<p style="font-size:13px;color:#777;margin:16px 0 0;text-align:center;">${lang === "fa" ? "مجموع آرا: " + totalVotes : "Total des votes: " + totalVotes}</p>`;
            html += `</div>`;
            
            // دکمه تغییر رای
            html += `<button onclick="resetPoll('${poll.id}')" style="width:100%;padding:12px;font-size:14px;font-weight:600;border:1px solid #e0e0e0;border-radius:6px;background:#fff;color:#777;cursor:pointer;transition:all 0.2s;" onmouseover="this.style.borderColor='#087F5B';this.style.color='#087F5B'" onmouseout="this.style.borderColor='#e0e0e0';this.style.color='#777'">`;
            html += `🔄 ${lang === "fa" ? "تغییر رای" : "Changer mon vote"}`;
            html += `</button>`;
        } else {
            // نمایش گزینه‌ها (کاربر رای نداده)
            poll.options.forEach(option => {
                const optionId = option.id;
                const label = lang === "fa" ? option.labelFa : option.labelFr;
                
                html += `<button onclick="votePoll('${poll.id}', '${optionId}')" style="width:100%;padding:16px 20px;font-size:15px;font-weight:600;border:2px solid #e0e0e0;border-radius:8px;background:#fff;color:#1a1a1a;cursor:pointer;margin-bottom:12px;transition:all 0.2s;text-align:left;" onmouseover="this.style.borderColor='#667eea';this.style.background='#f0f4ff'" onmouseout="this.style.borderColor='#e0e0e0';this.style.background='#fff'">`;
                html += `<span style="display:flex;justify-content:space-between;align-items:center;">`;
                html += `<span>${label}</span>`;
                html += `<span style="font-size:20px;color:#667eea;">○</span>`;
                html += `</span>`;
                html += `</button>`;
            });
            
            html += `<p style="font-size:12px;color:#999;margin:16px 0 0;text-align:center;">${lang === "fa" ? "با انتخاب یکی از گزینه‌ها، نظر خود را ثبت کنید" : "Sélectionnez une option pour donner votre avis"}</p>`;
        }
        
        html += `</div>`; // پایان محتوا
        html += `</div>`; // پایان کارت
        
        return html;
    } catch (e) {
        console.warn("Poll section skipped:", e);
        return "";
    }
}

// ===============================
// 📊 توابع مدیریت نظرسنجی
// ===============================
function votePoll(pollId, choice) {
    // ذخیره رای
    localStorage.setItem("dino_poll_voted_" + pollId, "true");
    localStorage.setItem("dino_poll_choice_" + pollId, choice);
    
    // افزایش شمارنده این گزینه
    const currentCount = parseInt(localStorage.getItem("dino_poll_" + pollId + "_" + choice) || "0");
    localStorage.setItem("dino_poll_" + pollId + "_" + choice, currentCount + 1);
    
    // افزایش مجموع آرا
    const totalVotes = parseInt(localStorage.getItem("dino_poll_total_" + pollId) || "0");
    localStorage.setItem("dino_poll_total_" + pollId, totalVotes + 1);
    
    // رفرش صفحه اصلی
    showHome();
}

function resetPoll(pollId) {
    // حذف رای قبلی
    const previousChoice = localStorage.getItem("dino_poll_choice_" + pollId);
    if (previousChoice) {
        const previousCount = parseInt(localStorage.getItem("dino_poll_" + pollId + "_" + previousChoice) || "1");
        localStorage.setItem("dino_poll_" + pollId + "_" + previousChoice, Math.max(0, previousCount - 1));
        
        const totalVotes = parseInt(localStorage.getItem("dino_poll_total_" + pollId) || "1");
        localStorage.setItem("dino_poll_total_" + pollId, Math.max(0, totalVotes - 1));
    }
    
    localStorage.removeItem("dino_poll_voted_" + pollId);
    localStorage.removeItem("dino_poll_choice_" + pollId);
    
    showHome();
}


// ===============================
// 📰 بخش اخبار (نسخه امن و ضدخطا)
// ===============================
async function renderNewsSection() {
    const lang = localStorage.getItem("language") || "fr";
    try {
        // تلاش برای خواندن فایل اخبار
        const response = await fetch("./data/news/news-index.json?v=" + Date.now());
        if (!response.ok) return ""; // اگر فایل نبود، خالی برگردان
        
        const allNews = await response.json();
        if (!allNews || !allNews.length) return ""; // اگر خالی بود، خالی برگردان
        
        const currentNews = allNews[0]; // آخرین خبر
        
        let html = "";
        html += `<div style="background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 4px 12px rgba(0,0,0,0.1);margin-bottom:30px;cursor:pointer;" onclick="showNewsDetail('${currentNews.id}')">`;
        html += `<div style="position:relative;height:350px;overflow:hidden;">`;
        html += `<img src="${currentNews.image}" alt="${currentNews.title}" style="width:100%;height:100%;object-fit:cover;">`;
        html += `<div style="position:absolute;top:15px;right:15px;display:flex;gap:8px;">`;
        html += `<span style="background:#087F5B;color:#fff;padding:6px 12px;border-radius:6px;font-size:13px;font-weight:700;">${currentNews.level}</span>`;
        html += `<span style="background:rgba(0,0,0,0.7);color:#fff;padding:6px 12px;border-radius:6px;font-size:13px;font-weight:700;">📰 ${lang === "fa" ? "خبر هفته" : "Actualité"}</span>`;
        html += `</div>`;
        html += `<div style="position:absolute;bottom:0;left:0;right:0;background:linear-gradient(to top, rgba(0,0,0,0.9), transparent);padding:25px;color:#fff;">`;
        html += `<h2 style="font-size:24px;font-weight:700;margin:0 0 8px;">${lang === "fa" ? currentNews.title_fa : currentNews.title}</h2>`;
        html += `<p style="font-size:15px;margin:0;opacity:0.9;">${lang === "fa" ? currentNews.subtitle_fa : currentNews.subtitle}</p>`;
        html += `</div></div>`;
        html += `<div style="padding:15px 25px;display:flex;justify-content:space-between;align-items:center;border-top:1px solid #f0f0f0;">`;
        html += `<span style="font-size:13px;color:#777;">📅 ${currentNews.publishedDate}</span>`;
        html += `<span style="font-size:14px;font-weight:700;color:#087F5B;">${lang === "fa" ? "مشاهده کامل ←" : "Lire la suite ←"}</span>`;
        html += `</div></div>`;
        
        return html;
    } catch (error) {
        console.warn("News section skipped:", error);
        return ""; // در صورت هرگونه خطا، سکوت کن و صفحه را خراب نکن
    }
}
// ===============================
// 📰 صفحه جزئیات خبر
// ===============================
// ===============================
// 📰 صفحه جزئیات خبر (نسخه پیشرفته)
// ===============================
async function showNewsDetail(newsId) {
    const lang = localStorage.getItem("language") || "fr";
    const userLevel = getPlacementResult() || "A1";
    
    // تبدیل سطح به عدد برای مقایسه (A1=1, A2=2, B1=3, B2=4, C1=5, C2=6)
    const levelMap = { "A1": 1, "A2": 2, "B1": 3, "B2": 4, "C1": 5, "C2": 6 };
    const userLevelNum = levelMap[userLevel] || 1;

    try {
        const response = await fetch("./data/news/" + newsId + ".json?v=" + Date.now());
        if (!response.ok) throw new Error("News not found");
        const news = await response.json();
        const newsLevelNum = levelMap[news.level.split('-')[0]] || 1; // سطح پایه خبر

        let html = renderNavbar();
        html += `<div style="max-width:900px;margin:0 auto;padding:20px 16px 60px;">`;
        html += `<button class="back-btn" onclick="showHome()" style="margin-bottom:20px;">← ${lang === "fa" ? "بازگشت به خانه" : "Retour à l'accueil"}</button>`;
        
        html += `<img src="${news.image}" alt="${news.imageAlt || news.title}" style="width:100%;max-height:500px;object-fit:cover;border-radius:12px;margin-bottom:20px;">`;
        
        html += `<div style="display:flex;gap:10px;align-items:center;margin-bottom:15px;flex-wrap:wrap;">`;
        html += `<span style="background:#087F5B;color:#fff;padding:6px 12px;border-radius:6px;font-size:13px;font-weight:700;">${news.level}</span>`;
        html += `<span style="font-size:14px;color:#777;">📅 ${news.publishedDate}</span>`;
        html += `</div>`;
        
        html += `<h1 style="font-size:28px;font-weight:700;color:#1a1a1a;margin:0 0 10px;line-height:1.3;">${lang === "fa" ? news.title_fa : news.title}</h1>`;
        html += `<p style="font-size:16px;color:#555;margin:0 0 30px;">${lang === "fa" ? news.subtitle_fa : news.subtitle}</p>`;
        
        // دکمه‌های تغییر متن
        html += `<div style="display:flex;gap:10px;margin-bottom:20px;background:#f9fafb;padding:10px;border-radius:8px;">`;
        html += `<button id="btn-full" onclick="switchNewsText('full')" style="flex:1;padding:10px;font-size:14px;font-weight:700;border:2px solid #087F5B;border-radius:6px;background:#087F5B;color:#fff;cursor:pointer;">📖 ${lang === "fa" ? "متن کامل" : "Texte complet"}</button>`;
        html += `<button id="btn-simple" onclick="switchNewsText('simple')" style="flex:1;padding:10px;font-size:14px;font-weight:600;border:2px solid #e0e0e0;border-radius:6px;background:#fff;color:#1a1a1a;cursor:pointer;">🌱 ${lang === "fa" ? "متن ساده" : "Texte simple"}</button>`;
        html += `</div>`;
        
        // متن کامل
        html += `<div id="news-full-text" style="background:#fff;border:1px solid #e0e0e0;border-radius:8px;padding:30px;margin-bottom:30px;">`;
        html += `<div style="font-size:16px;line-height:1.9;color:#333;white-space:pre-line;">${news.content.fullText}</div>`;
        html += `</div>`;
        
        // متن ساده
        html += `<div id="news-simple-text" style="display:none;background:#f0f9ff;border:1px solid #087F5B;border-radius:8px;padding:30px;margin-bottom:30px;">`;
        html += `<p style="font-size:13px;color:#087F5B;font-weight:700;margin:0 0 12px;">🌱 ${lang === "fa" ? "نسخه ساده‌شده" : "Version simplifiée"}</p>`;
        html += `<div style="font-size:16px;line-height:1.9;color:#333;white-space:pre-line;">${news.content.simpleText}</div>`;
        html += `</div>`;
        
        // --- بخش واژگان (با فیلتر سطح) ---
        if (news.content.vocabulary && news.content.vocabulary.length) {
            // فیلتر: اگر سطح کلمه مشخص است و خیلی بالاتر از کاربر است، نشان نده
            const filteredVocab = news.content.vocabulary.filter(v => {
                if (!v.level) return true; // اگر سطح ندارد، نشان بده
                const vLevelNum = levelMap[v.level] || 1;
                return vLevelNum <= userLevelNum + 1; // حداکثر ۱ سطح بالاتر را نشان بده
            });

            if (filteredVocab.length > 0) {
                html += `<details style="background:#fff;border:1px solid #e0e0e0;border-radius:8px;margin-bottom:20px;overflow:hidden;">
                    <summary style="padding:18px 24px;font-weight:700;color:#087F5B;cursor:pointer;background:#f9fafb;display:flex;justify-content:space-between;align-items:center;list-style:none;">
                        <span>📚 ${lang === "fa" ? "واژگان کلیدی" : "Vocabulaire clé"}</span>
                        <span style="font-size:18px;">▼</span>
                    </summary>
                    <div style="padding:0 24px 24px 24px;border-top:1px solid #e0e0e0;">
                        <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(250px,1fr));gap:10px;margin-top:20px;">`;
                
                filteredVocab.forEach(word => {
                    html += `<div style="background:#f9fafb;padding:12px 16px;border-radius:6px;border-right:4px solid #087F5B;">`;
                    html += `<p class="ltr-lock" style="font-weight:700;color:#1a1a1a;margin:0 0 4px;font-size:15px;">${word.fr} ${word.level ? `<span style="font-size:11px;background:#e0e0e0;padding:2px 6px;border-radius:4px;color:#555;">${word.level}</span>` : ''}</p>`;
                    html += `<p class="persian-text" style="font-size:14px;color:#777;margin:0;">${word.fa}</p>`;
                    html += `</div>`;
                });
                html += `</div></div></details>`;
            }
        }
        
        // --- بخش گرامر (با فیلتر سطح و لینک خودکار) ---
        if (news.content.grammar && news.content.grammar.length) {
            const filteredGrammar = news.content.grammar.filter(g => {
                if (!g.level) return true;
                const gLevelNum = levelMap[g.level] || 1;
                return gLevelNum <= userLevelNum + 1;
            });

            if (filteredGrammar.length > 0) {
                html += `<details style="background:#fff;border:1px solid #e0e0e0;border-radius:8px;margin-bottom:20px;overflow:hidden;">
                    <summary style="padding:18px 24px;font-weight:700;color:#087F5B;cursor:pointer;background:#f9fafb;display:flex;justify-content:space-between;align-items:center;list-style:none;">
                        <span>📐 ${lang === "fa" ? "نکات گرامری" : "Points de grammaire"}</span>
                        <span style="font-size:18px;">▼</span>
                    </summary>
                    <div style="padding:0 24px 24px 24px;border-top:1px solid #e0e0e0;">`;
                
                filteredGrammar.forEach((item, idx) => {
                    // ساخت لینک به درس گرامر اگر grammarId وجود داشته باشد
                    let grammarLink = "";
                    if (item.grammarId) {
                        grammarLink = `<a href="#" onclick="showGrammarLesson('${item.grammarId}'); return false;" style="display:inline-block;margin-top:10px;font-size:13px;font-weight:700;color:#087F5B;text-decoration:none;background:#e8f5f0;padding:6px 12px;border-radius:6px;">🔗 ${lang === "fa" ? "مشاهده درس گرامر" : "Voir la leçon de grammaire"}</a>`;
                    } else if (item.level) {
                        grammarLink = `<p style="font-size:12px;color:#999;margin-top:10px;">${lang === "fa" ? "⚠️ این نکته برای سطح " + item.level + " است." : "⚠️ Ce point est pour le niveau " + item.level + "."}</p>`;
                    }

                    html += `<div style="background:#f9fafb;border:1px solid #e0e0e0;border-radius:8px;padding:20px;margin-bottom:15px;margin-top:20px;">`;
                    html += `<h3 style="font-size:16px;font-weight:700;color:#1a1a1a;margin:0 0 10px;">${idx + 1}. ${item.title} ${item.level ? `<span style="font-size:12px;background:#087F5B;color:#fff;padding:2px 8px;border-radius:4px;margin-right:8px;">${item.level}</span>` : ''}</h3>`;
                    html += `<div class="ltr-lock" style="background:#fff;padding:12px;border-radius:6px;margin:10px 0;font-size:15px;line-height:1.7;border-left:3px solid #087F5B;font-style:italic;">${item.example}</div>`;
                    if (item.translation) {
                        html += `<p class="persian-text" style="font-size:14px;color:#555;margin:10px 0;">${item.translation}</p>`;
                    }
                    if (item.explanation) {
                        html += `<p class="persian-text" style="font-size:14px;color:#777;margin:8px 0 0;">💡 ${item.explanation}</p>`;
                    }
                    html += grammarLink;
                    html += `</div>`;
                });
                html += `</div></details>`;
            } else {
                // اگر همه نکات گرامری فیلتر شدند
                html += `<div style="background:#fffbeb;border:1px solid #fde68a;border-radius:8px;padding:16px;margin-bottom:20px;text-align:center;color:#92400e;">
                    ${lang === "fa" ? "💡 نکات گرامری این متن برای سطح فعلی شما پیشرفته است و پنهان شده‌اند." : "💡 Les points de grammaire de ce texte sont trop avancés pour votre niveau et ont été masqués."}
                </div>`;
            }
        }
        
        // منابع
        if (news.sources && news.sources.length) {
            html += `<details style="background:#fff;border:1px solid #e0e0e0;border-radius:8px;margin-bottom:20px;overflow:hidden;">
                <summary style="padding:18px 24px;font-weight:700;color:#1a1a1a;cursor:pointer;background:#f9fafb;display:flex;justify-content:space-between;align-items:center;list-style:none;">
                    <span>📖 ${lang === "fa" ? "منابع" : "Sources"}</span>
                    <span style="font-size:18px;">▼</span>
                </summary>
                <div style="padding:0 24px 24px 24px;border-top:1px solid #e0e0e0;">
                    <div style="display:flex;flex-direction:column;gap:10px;margin-top:20px;">`;
            news.sources.forEach(source => {
                html += `<a href="${source.url}" target="_blank" style="padding:12px 16px;background:#fff;border:1px solid #e0e0e0;border-radius:6px;color:#087F5B;text-decoration:none;font-weight:600;display:flex;justify-content:space-between;align-items:center;">`;
                html += `<span>${source.title}</span><span>↗</span>`;
                html += `</a>`;
            });
            html += `</div></div></details>`;
        }
        
        html += `</div>`;
        app.innerHTML = html;
        window.scrollTo(0, 0);
        
    } catch (e) {
        console.error("News detail error:", e);
        app.innerHTML = renderNavbar() + `<div style="text-align:center;padding:60px 16px;">
            <p style="font-size:18px;color:#777;">❌ ${lang === "fa" ? "این خبر پیدا نشد." : "Cet article est introuvable."}</p>
            <button onclick="showHome()" style="margin-top:15px;padding:10px 20px;border:1px solid #ddd;border-radius:6px;background:#fff;cursor:pointer;">${lang === "fa" ? "بازگشت" : "Retour"}</button>
        </div>`;
    }
}

// تابع تغییر متن (همان قبلی)
function switchNewsText(mode) {
    const fullDiv = document.getElementById("news-full-text");
    const simpleDiv = document.getElementById("news-simple-text");
    const btnFull = document.getElementById("btn-full");
    const btnSimple = document.getElementById("btn-simple");
    if (!fullDiv || !simpleDiv) return;
    if (mode === "full") {
        fullDiv.style.display = "block"; simpleDiv.style.display = "none";
        btnFull.style.background = "#087F5B"; btnFull.style.color = "#fff"; btnFull.style.borderColor = "#087F5B";
        btnSimple.style.background = "#fff"; btnSimple.style.color = "#1a1a1a"; btnSimple.style.borderColor = "#e0e0e0";
    } else {
        fullDiv.style.display = "none"; simpleDiv.style.display = "block";
        btnSimple.style.background = "#087F5B"; btnSimple.style.color = "#fff"; btnSimple.style.borderColor = "#087F5B";
        btnFull.style.background = "#fff"; btnFull.style.color = "#1a1a1a"; btnFull.style.borderColor = "#e0e0e0";
    }
}
// ===============================
// 🔄 تغییر بین متن کامل و ساده
// ===============================
function switchNewsText(mode) {
    const fullDiv = document.getElementById("news-full-text");
    const simpleDiv = document.getElementById("news-simple-text");
    const btnFull = document.getElementById("btn-full");
    const btnSimple = document.getElementById("btn-simple");
    
    if (!fullDiv || !simpleDiv) return;
    
    if (mode === "full") {
        fullDiv.style.display = "block";
        simpleDiv.style.display = "none";
        btnFull.style.background = "#087F5B";
        btnFull.style.color = "#fff";
        btnFull.style.borderColor = "#087F5B";
        btnSimple.style.background = "#fff";
        btnSimple.style.color = "#1a1a1a";
        btnSimple.style.borderColor = "#e0e0e0";
    } else {
        fullDiv.style.display = "none";
        simpleDiv.style.display = "block";
        btnSimple.style.background = "#087F5B";
        btnSimple.style.color = "#fff";
        btnSimple.style.borderColor = "#087F5B";
        btnFull.style.background = "#fff";
        btnFull.style.color = "#1a1a1a";
        btnFull.style.borderColor = "#e0e0e0";
    }
}
// ===============================
// 🏠 صفحه اصلی مینیمال
// ===============================
async function showHome() {
    const lang = localStorage.getItem("language") || "fr";
    const level = getPlacementResult() || "A1";

    // بارگذاری موازی برای سرعت بیشتر
    const [g, t, d] = await Promise.all([
        loadGrammar(level).then(() => getGrammar(level).slice(0, 4)).catch(() => []),
        fetch("./data/travel/lessons.json").then(r => r.json()).catch(() => []),
        fetch("./data/daily/lessons.json").then(r => r.json()).catch(() => [])
    ]);
    
    const grammarLessons = g;
    const travelLessons = t.slice(0, 4);
    const dailyLessons = d.slice(0, 4);
    
    let html = renderNavbar();

    html += `<div style="max-width:960px;margin:0 auto;padding:32px 20px 60px;">
        <div style="display:flex;align-items:center;gap:16px;margin-bottom:8px;">
            <span style="font-size:48px;line-height:1;">🦖</span>
            <h1 style="font-size:30px;font-weight:700;color:#1a1a1a;margin:0;">${lang === "fa" ? "سلام، ادامه بده!" : "Bonjour, continuez !"}</h1>
        </div>
        <p style="font-size:17px;color:#777;margin:0 0 36px;">${level} · ${lang === "fa" ? "سطح فعلی شما" : "Votre niveau actuel"}</p>`;
    
    // اینجا اخبار تزریق می‌شود (اگر تابع بالا باشد، کار می‌کند)
    html += await renderNewsSection();
    
    html += `<div style="margin-bottom:45px;">
        ${sectionHeader(lang === "fa" ? "📰 اخبار و نکات" : "📰 Actualités & conseils", "", lang)}
        <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(280px,1fr));gap:14px;">
            <article style="background:#fff;border:1px solid #e0e0e0;border-radius:8px;overflow:hidden;cursor:pointer;grid-column:span 2;">
                <div style="height:180px;background:linear-gradient(135deg,#e8f5f0,#d0ebe1);display:flex;align-items:center;justify-content:center;font-size:64px;">📖</div>
                <div style="padding:18px;">
                    <p style="font-size:12px;font-weight:700;color:#087F5B;text-transform:uppercase;letter-spacing:1px;margin:0 0 10px;">GRAMMAIRE</p>
                    <h3 style="font-size:18px;font-weight:600;color:#1a1a1a;margin:0 0 10px;line-height:1.4;">${lang === "fa" ? "چگونه passé composé را درست استفاده کنیم؟" : "Comment bien utiliser le passé composé ?"}</h3>
                    <p style="font-size:13px;color:#888;margin:0;">${lang === "fa" ? "امروز · ۵ دقیقه مطالعه" : "Aujourd'hui · 5 min de lecture"}</p>
                </div>
            </article>
            <article style="background:#fff;border:1px solid #e0e0e0;border-radius:8px;overflow:hidden;cursor:pointer;">
                <div style="height:120px;background:linear-gradient(135deg,#fef3e2,#fde5c8);display:flex;align-items:center;justify-content:center;font-size:48px;">🏦</div>
                <div style="padding:16px;">
                    <p style="font-size:12px;font-weight:700;color:#d97706;text-transform:uppercase;letter-spacing:1px;margin:0 0 8px;">VIE QUOTIDIENNE</p>
                    <h3 style="font-size:16px;font-weight:600;color:#1a1a1a;margin:0 0 8px;line-height:1.4;">${lang === "fa" ? "۱۰ عبارت ضروری برای حساب بانکی" : "10 expressions pour ouvrir un compte bancaire"}</h3>
                    <p style="font-size:13px;color:#888;margin:0;">${lang === "fa" ? "دیروز · ۴ دقیقه" : "Hier · 4 min"}</p>
                </div>
            </article>
            <article style="background:#fff;border:1px solid #e0e0e0;border-radius:8px;overflow:hidden;cursor:pointer;">
                <div style="height:120px;background:linear-gradient(135deg,#e8f0fe,#d5e5fc);display:flex;align-items:center;justify-content:center;font-size:48px;">✈️</div>
                <div style="padding:16px;">
                    <p style="font-size:12px;font-weight:700;color:#2563eb;text-transform:uppercase;letter-spacing:1px;margin:0 0 8px;">VOYAGE</p>
                    <h3 style="font-size:16px;font-weight:600;color:#1a1a1a;margin:0 0 8px;line-height:1.4;">${lang === "fa" ? "راهنمای فرودگاه شارل دوگل" : "Guide complet de l'aéroport CDG"}</h3>
                    <p style="font-size:13px;color:#888;margin:0;">${lang === "fa" ? "۲ روز پیش · ۶ دقیقه" : "Il y a 2 jours · 6 min"}</p>
                </div>
            </article>
            <article style="background:#fffbeb;border:1px solid #fde68a;border-radius:8px;overflow:hidden;cursor:pointer;">
                <div style="height:120px;background:linear-gradient(135deg,#fef9c3,#fde68a);display:flex;align-items:center;justify-content:center;font-size:48px;">✨</div>
                <div style="padding:16px;">
                    <p style="font-size:12px;font-weight:700;color:#b45309;text-transform:uppercase;letter-spacing:1px;margin:0 0 8px;">✨ ${lang === "fa" ? "نکته روز" : "ASTUCE DU JOUR"}</p>
                    <h3 style="font-size:16px;font-weight:600;color:#1a1a1a;margin:0 0 8px;line-height:1.4;">${lang === "fa" ? "در فرانسه همیشه اول Bonjour بگویید!" : "En France, dites toujours Bonjour en premier !"}</h3>
                    <p style="font-size:13px;color:#888;margin:0;">${lang === "fa" ? "ادب فرانسوی" : "Politesse française"}</p>
                </div>
            </article>
        </div>
    </div>`;
async function showHome() {
    const lang = localStorage.getItem("language") || "fr";
    const level = getPlacementResult() || "A1";

    // ... بارگذاری داده‌ها ...
    
    let html = renderNavbar();
    html += `<div style="max-width:960px;margin:0 auto;padding:32px 20px 60px;">`;
    
    // سلام
    html += `<div style="display:flex;align-items:center;gap:16px;margin-bottom:8px;">
        <span style="font-size:48px;line-height:1;">🦖</span>
        <h1 style="font-size:30px;font-weight:700;color:#1a1a1a;margin:0;">${lang === "fa" ? "سلام، ادامه بده!" : "Bonjour, continuez !"}</h1>
    </div>
    <p style="font-size:17px;color:#777;margin:0 0 36px;">${level} · ${lang === "fa" ? "سطح فعلی شما" : "Votre niveau actuel"}</p>`;
    
    // 📰 بخش اخبار (تصویر بزرگ)
    html += await renderNewsSection();
    
    // 📊 بخش نظرسنجی (مستقل)
    html += await renderPollSection();
    
    // 📰 اخبار و نکات ثابت
    html += `<div style="margin-bottom:45px;">
        ${sectionHeader(lang === "fa" ? "📰 اخبار و نکات" : "📰 Actualités & conseils", "", lang)}
        ...
    </div>`;
    
    // ... بقیه بخش‌ها ...
    
    html += `</div>`;
    app.innerHTML = html;
}
    html += `<div style="margin-bottom:40px;">
        ${sectionHeader(lang === "fa" ? "📚 گرامر" : "📚 Grammaire", "switchSection('grammar')", lang)}
        <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(200px,1fr));gap:12px;">
            ${grammarLessons.map(l => simpleCard(l.icon || "📗", lang === "fa" ? l.title_fa : l.title, `${l.level} · ${l.estimatedTime} min`, `showGrammarLesson('${l.id}')`)).join("")}
        </div>
    </div>`;

    html += `<div style="margin-bottom:40px;">
        ${sectionHeader(lang === "fa" ? "📖 واژگان" : "📖 Vocabulaire", "switchSection('vocabulary')", lang)}
        <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(200px,1fr));gap:12px;">
            ${simpleCard("👕", lang === "fa" ? "لباس و پوشاک" : "Vêtements", lang === "fa" ? "۱۵ کلمه" : "15 mots", "switchSection('vocabulary')")}
            ${simpleCard("🥐", lang === "fa" ? "صبحانه در هتل" : "Petit-déjeuner", lang === "fa" ? "۱۵ کلمه" : "15 mots", "switchSection('vocabulary')")}
            ${simpleCard("🍽️", lang === "fa" ? "غذا و رستوران" : "Nourriture", lang === "fa" ? "۱۵ کلمه" : "15 mots", "switchSection('vocabulary')")}
            ${simpleCard("👨‍👩‍👧", lang === "fa" ? "خانواده" : "Famille", lang === "fa" ? "۱۵ کلمه" : "15 mots", "switchSection('vocabulary')")}
        </div>
    </div>`;

    html += `<div style="margin-bottom:40px;">
        ${sectionHeader(lang === "fa" ? "🏘️ زندگی روزمره" : "🏘️ Vie quotidienne", "switchSection('daily')", lang)}
        <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(200px,1fr));gap:12px;">
            ${dailyLessons.map(l => simpleCard(l.icon || "🏠", lang === "fa" ? l.title_fa : l.title, `${l.estimatedTime} min`, `showDailyLesson('${l.id}')`)).join("")}
        </div>
    </div>`;

    html += `<div style="margin-bottom:40px;">
        ${sectionHeader(lang === "fa" ? "✈️ سفر" : "✈️ Voyage", "switchSection('travel')", lang)}
        <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(200px,1fr));gap:12px;">
            ${travelLessons.map(l => simpleCard(l.icon || "✈️", lang === "fa" ? l.title_fa : l.title, `${l.estimatedTime} min`, `showTravelLesson('${l.id}')`)).join("")}
        </div>
    </div>`;

    html += `<div style="margin-bottom:40px;">
        ${sectionHeader(lang === "fa" ? "🎮 بازی و تمرین" : "🎮 Jeux & exercices", "", lang)}
        <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(200px,1fr));gap:12px;">
            ${simpleCard("🎮", lang === "fa" ? "بازی‌ها" : "Jeux", lang === "fa" ? "یادگیری با سرگرمی" : "Apprendre en jouant", "switchSection('games')")}
            ${simpleCard("📝", lang === "fa" ? "تمرین‌ها" : "Exercices", lang === "fa" ? "تثبیت یادگیری" : "Consolider", "switchSection('exercises')")}
            ${simpleCard("📊", lang === "fa" ? "تعیین سطح" : "Test", lang === "fa" ? "سطح خود را بسنجید" : "Évaluer votre niveau", "showPlacementChoice()")}
        </div>
    </div>
    </div>`;

    app.innerHTML = html;
}
