function getWeakWords(packId) {
    const p = JSON.parse(localStorage.getItem("dino_vocab_weak") || "{}");
    return p[packId] || [];
}
function setWeakWord(packId, fr, weak) {
    const p = JSON.parse(localStorage.getItem("dino_vocab_weak") || "{}");
    if (!p[packId]) p[packId] = [];
    p[packId] = p[packId].filter(w => w !== fr);
    if (weak) p[packId].push(fr);
    localStorage.setItem("dino_vocab_weak", JSON.stringify(p));
}

// ===============================
// 📖 موتور واژگان
// ===============================
let vocabCache = {};

async function loadVocabIndex(level) {
    if (vocabCache["index-" + level]) return vocabCache["index-" + level];
    try {
        const r = await fetch(`./data/vocabulary/vocab-${level}.json`);
        const data = await r.json();
        vocabCache["index-" + level] = data;
        return data;
    } catch (e) { return []; }
}

async function loadVocabPack(level, packId) {
    const key = `${level}-${packId}`;
    if (vocabCache[key]) return vocabCache[key];
    try {
        const r = await fetch(`./data/vocabulary/${level}/${packId}.json`);
        const data = await r.json();
        vocabCache[key] = data;
        return data;
    } catch (e) { return null; }
}

function getVocabProgress() {
    return JSON.parse(localStorage.getItem("dino_vocab_progress") || "{}");
}

function markWord(packId, wordFr, known) {
    const progress = getVocabProgress();
    if (!progress[packId]) progress[packId] = { known: [], unknown: [] };
    progress[packId].known = progress[packId].known.filter(w => w !== wordFr);
    progress[packId].unknown = progress[packId].unknown.filter(w => w !== wordFr);
    if (known) progress[packId].known.push(wordFr);
    else progress[packId].unknown.push(wordFr);
    localStorage.setItem("dino_vocab_progress", JSON.stringify(progress));
}

// ===============================
// 📖 واژگان - انتخاب سطح
// ===============================
async function showVocabularyPage() {
    const lang = localStorage.getItem("language") || "fr";
    const levels = ["A1", "A2", "B1", "B2", "C1", "C2"];
    let html = renderNavbar();
    html += `<div style="max-width:960px;margin:0 auto;padding:32px 20px 60px;">
        <h1 style="font-size:26px;font-weight:700;color:#1a1a1a;margin:0 0 6px;">${lang === "fa" ? "📖 واژگان" : "📖 Vocabulaire"}</h1>
        <p style="font-size:15px;color:#777;margin:0 0 30px;">${lang === "fa" ? "سطح خود را انتخاب کنید" : "Choisissez votre niveau"}</p>
        <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(140px,1fr));gap:12px;">
            ${levels.map(lv => simpleCard("🎯", lv, lang === "fa" ? "فلش‌کارت، داستان و تمرین" : "Flashcards & histoires", `showVocabLevel('${lv}')`)).join("")}
        </div>
    </div>`;
    app.innerHTML = html;
}

// ===============================
// 📖 یک سطح - لیست پک‌ها
// ===============================
async function showVocabLevel(level) {
    const lang = localStorage.getItem("language") || "fr";
    const packs = await loadVocabIndex(level);
    let html = renderNavbar();
    html += `<div style="max-width:960px;margin:0 auto;padding:32px 20px 60px;">
        <button class="back-btn" onclick="showVocabularyPage()">← ${lang === "fa" ? "بازگشت" : "Retour"}</button>
        <h1 style="font-size:26px;font-weight:700;color:#1a1a1a;margin:0 0 6px;">📖 ${level}</h1>
        <p style="font-size:15px;color:#777;margin:0 0 30px;">${lang === "fa" ? "یک دسته انتخاب کنید" : "Choisissez une catégorie"}</p>
        <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(200px,1fr));gap:12px;">
            ${packs.map(p => simpleCard(p.icon, lang === "fa" ? p.title_fa : p.title, `${p.words} ${lang === "fa" ? "کلمه" : "mots"}`, `showVocabPack('${level}','${p.id}')`)).join("")}
        </div>
    </div>`;
    app.innerHTML = html;
}

// ===============================
// 📖 یک پک - منوی داخلی
// ===============================
async function showVocabPack(level, packId) {
    const lang = localStorage.getItem("language") || "fr";
    const pack = await loadVocabPack(level, packId);
    if (!pack) {
        app.innerHTML = renderNavbar() + `<div style="max-width:500px;margin:0 auto;padding:60px 16px;text-align:center;">
            <p style="font-size:14px;color:#777;">🚧 ${lang === "fa" ? "این پک به زودی اضافه می‌شود." : "Bientôt disponible."}</p>
            <button onclick="showVocabLevel('${level}')" style="margin-top:15px;padding:10px 20px;border:1px solid #ddd;border-radius:6px;background:#fff;color:#1a1a1a;cursor:pointer;">${lang === "fa" ? "بازگشت" : "Retour"}</button>
        </div>`;
        return;
    }
    window.currentPack = pack;
    let html = renderNavbar();
    html += `<div style="max-width:960px;margin:0 auto;padding:32px 20px 60px;">
        <button class="back-btn" onclick="showVocabLevel('${level}')">← ${lang === "fa" ? "بازگشت" : "Retour"}</button>
        <div style="display:flex;align-items:center;gap:12px;margin-bottom:30px;">
            <span style="font-size:36px;">${pack.icon}</span>
            <div>
                <h1 style="font-size:24px;font-weight:700;color:#1a1a1a;margin:0;">${lang === "fa" ? pack.title_fa : pack.title}</h1>
                <p style="font-size:13px;color:#777;margin:4px 0 0;">${level} · ${pack.words.length} ${lang === "fa" ? "کلمه" : "mots"}</p>
            </div>
        </div>
        <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(200px,1fr));gap:12px;">
            ${simpleCard("🃏", lang === "fa" ? "فلش‌کارت‌ها" : "Flashcards", `${pack.words.length} ${lang === "fa" ? "کلمه" : "mots"}`, "startFlashcards()")}
            ${simpleCard("🌱", lang === "fa" ? "داستان ساده" : "Histoire facile", "A1-A2", "startStory('easy')")}
            ${simpleCard("🌳", lang === "fa" ? "داستان پیشرفته" : "Histoire avancée", "B1+", "startStory('hard')")}
            ${simpleCard("📝", lang === "fa" ? "تمرین" : "Quiz", lang === "fa" ? "آزمون کوتاه" : "Quiz rapide", "startVocabExercise()")}
            ${(() => { const weak = getWeakWords(pack.id); return weak.length ? simpleCard("🔁", lang === "fa" ? "مرور کلمات ضعیف" : "Mots faibles", weak.length + " " + (lang === "fa" ? "کلمه" : "mots"), "startFlashcards(true)") : ""; })()}
        </div>
    </div>`;
    app.innerHTML = html;
}

// ===============================
// 🃏 فلش‌کارت‌ها
// ===============================
function startFlashcards(reviewMode) {
    const pack = window.currentPack;
    const lang = localStorage.getItem("language") || "fr";
    let deck;
    if (reviewMode) {
        const weak = getWeakWords(pack.id);
        deck = pack.words.filter(w => weak.includes(w.fr)).sort(() => Math.random() - 0.5);
        if (!deck.length) { alert(lang === "fa" ? "کلمه‌ای برای مرور نیست! 🎉" : "Aucun mot à réviser !"); return; }
    } else {
        deck = pack.words.slice().sort(() => Math.random() - 0.5);
    }
    let index = 0, knownCount = 0, retry = [];

    function renderCard() {
        if (index >= deck.length) { renderEnd(); return; }
        const word = deck[index];
        let html = renderNavbar();
        html += `<div style="max-width:560px;margin:0 auto;padding:32px 16px 60px;">
            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px;">
                <button class="back-btn" style="margin:0;" onclick="showVocabPack('${pack.level}','${pack.id}')">← ${lang === "fa" ? "بازگشت" : "Retour"}</button>
                <span style="font-size:14px;color:#777;">${index + 1} / ${deck.length}</span>
            </div>
            <div style="background:#e0e0e0;height:4px;border-radius:2px;margin-bottom:24px;overflow:hidden;">
                <div style="background:#087F5B;height:100%;width:${(index / deck.length) * 100}%;"></div>
            </div>
            <div id="flashcard" style="background:#fff;border:1px solid #e0e0e0;border-radius:10px;min-height:340px;display:flex;flex-direction:column;align-items:center;justify-content:center;cursor:pointer;padding:28px;text-align:center;box-shadow:0 2px 8px rgba(0,0,0,0.05);">
                ${word.img ? `<img src="${word.img}" alt="" style="width:100%;max-height:160px;object-fit:cover;border-radius:8px;margin-bottom:14px;">` : (word.emoji ? `<div style="font-size:52px;margin-bottom:10px;">${word.emoji}</div>` : "")}
                <p class="ltr-lock" style="font-size:30px;font-weight:700;color:#1a1a1a;margin:0 0 10px;">${word.fr}</p>
                <div id="card-back" style="display:none;width:100%;">
                    <p class="persian-text" style="font-size:20px;color:#087F5B;font-weight:600;margin:0 0 14px;">${word.fa}</p>
                    ${word.ex ? `<p class="ltr-lock" style="font-size:15px;color:#333;margin:0 0 6px;font-style:italic;">${word.ex}</p>` : ""}
                    ${word.ex_fa ? `<p class="persian-text" style="font-size:13px;color:#777;margin:0;">${word.ex_fa}</p>` : ""}
                </div>
                <p id="card-hint" style="font-size:12px;color:#aaa;margin:18px 0 0;">${lang === "fa" ? "👆 برای دیدن معنی و مثال، روی کارت بزن" : "👆 Touchez pour voir le sens et l'exemple"}</p>
            </div>
            <div id="card-buttons" style="display:none;gap:10px;margin-top:16px;">
                <button id="btn-unknown" style="flex:1;padding:14px;font-size:15px;font-weight:600;border:1px solid #dc2626;border-radius:6px;background:#fff;color:#dc2626;cursor:pointer;">❌ ${lang === "fa" ? "بلد نیستم" : "Je ne sais pas"}</button>
                <button id="btn-known" style="flex:1;padding:14px;font-size:15px;font-weight:700;border:none;border-radius:6px;background:#087F5B;color:#fff;cursor:pointer;">✅ ${lang === "fa" ? "بلدم" : "Je sais"}</button>
            </div>
            <p style="font-size:12px;color:#999;text-align:center;margin:12px 0 0;">${lang === "fa" ? "کلماتی که بلد نیستی، در پایان مرور می‌شوند و برای جلسه بعد ذخیره می‌شوند." : "Les mots inconnus seront révisés à la fin et gardés pour la prochaine fois."}</p>
        </div>`;
        app.innerHTML = html;
        document.getElementById("flashcard").onclick = function () {
            document.getElementById("card-back").style.display = "block";
            document.getElementById("card-hint").style.display = "none";
            document.getElementById("card-buttons").style.display = "flex";
            this.onclick = null;
        };
        document.getElementById("btn-unknown").onclick = function () { setWeakWord(pack.id, word.fr, true); retry.push(word); index++; renderCard(); };
        document.getElementById("btn-known").onclick = function () { setWeakWord(pack.id, word.fr, false); knownCount++; index++; renderCard(); };
    }

    function renderEnd() {
        if (retry.length && !reviewMode) {
            app.innerHTML = renderNavbar() + `<div style="max-width:500px;margin:0 auto;padding:50px 16px;text-align:center;">
                <div style="font-size:48px;margin-bottom:16px;">🔁</div>
                <h1 style="font-size:22px;color:#1a1a1a;margin-bottom:10px;">${lang === "fa" ? retry.length + " کلمه را بلد نبودی" : retry.length + " mot(s) non connu(s)"}</h1>
                <p style="font-size:15px;color:#777;margin-bottom:30px;">${lang === "fa" ? "حالا وقت مرور است!" : "C'est l'heure de réviser !"}</p>
                <button id="btn-review" style="width:100%;padding:14px;font-size:15px;font-weight:700;border:none;border-radius:6px;background:#087F5B;color:#fff;cursor:pointer;margin-bottom:10px;">🔁 ${lang === "fa" ? "مرور کن" : "Réviser"}</button>
                <button id="btn-stop" style="width:100%;padding:14px;font-size:15px;font-weight:600;border:1px solid #ddd;border-radius:6px;background:#fff;color:#1a1a1a;cursor:pointer;">${lang === "fa" ? "پایان" : "Terminer"}</button>
            </div>`;
            document.getElementById("btn-review").onclick = function () { startFlashcards(true); };
            document.getElementById("btn-stop").onclick = function () { showVocabPack(pack.level, pack.id); };
            return;
        }
        const pct = Math.round((knownCount / deck.length) * 100);
        let emoji = "🎉", msg = lang === "fa" ? "عالی بود!" : "Excellent !";
        if (pct < 50) { emoji = "💪"; msg = lang === "fa" ? "باید بیشتر تمرین کنی!" : "Plus d'entraînement !"; }
        else if (pct < 80) { emoji = "👍"; msg = lang === "fa" ? "خوب بود!" : "Bien !"; }
        app.innerHTML = renderNavbar() + `<div style="max-width:500px;margin:0 auto;padding:50px 16px;text-align:center;">
            <div style="font-size:48px;margin-bottom:16px;">${emoji}</div>
            <h1 style="font-size:24px;color:#1a1a1a;margin-bottom:10px;">${msg}</h1>
            <p style="font-size:16px;color:#777;margin-bottom:30px;">${knownCount} / ${deck.length} (${pct}%)</p>
            <button onclick="startFlashcards(${reviewMode ? "true" : "false"})" style="width:100%;padding:14px;font-size:15px;font-weight:700;border:none;border-radius:6px;background:#087F5B;color:#fff;cursor:pointer;margin-bottom:10px;">🔄 ${lang === "fa" ? "دوباره" : "Recommencer"}</button>
            <button onclick="showVocabPack('${pack.level}','${pack.id}')" style="width:100%;padding:14px;font-size:15px;font-weight:600;border:1px solid #ddd;border-radius:6px;background:#fff;color:#1a1a1a;cursor:pointer;">${lang === "fa" ? "بازگشت" : "Retour"}</button>
        </div>`;
    }
    renderCard();
}

// ===============================
// 📚 داستان
// ===============================
function startStory(difficulty) {
    const pack = window.currentPack;
    const lang = localStorage.getItem("language") || "fr";
    const story = pack.stories && pack.stories[difficulty];
    if (!story) { alert(lang === "fa" ? "به زودی" : "Bientôt"); return; }

    let html = renderNavbar();
    html += `<div style="max-width:700px;margin:0 auto;padding:32px 20px 60px;">
        <button class="back-btn" onclick="showVocabPack('${pack.level}','${pack.id}')">← ${lang === "fa" ? "بازگشت" : "Retour"}</button>
        <p style="font-size:12px;color:#777;text-transform:uppercase;letter-spacing:1px;margin:0 0 6px;">${difficulty === 'easy' ? '🌱 A1-A2' : '🌳 B1+'}</p>
        <h1 class="ltr-lock" style="font-size:24px;font-weight:700;color:#1a1a1a;margin:0 0 4px;">${story.title}</h1>
        <p class="persian-text" style="font-size:15px;color:#777;margin:0 0 20px;">${story.title_fa}</p>
        <button onclick="toggleStoryTranslation()" style="width:auto;padding:8px 16px;font-size:13px;font-weight:600;border:1px solid #ddd;border-radius:6px;background:#fff;color:#1a1a1a;cursor:pointer;margin-bottom:20px;">👁 ${lang === "fa" ? "نمایش / مخفی ترجمه" : "Traduction"}</button>
        <div style="background:#fff;border:1px solid #e0e0e0;border-radius:8px;padding:24px;margin-bottom:24px;">
            ${story.paragraphs.map(p => `
                <div style="margin-bottom:18px;padding-bottom:18px;border-bottom:1px solid #f0f0f0;">
                    <p class="ltr-lock" style="font-size:16px;line-height:1.8;color:#1a1a1a;margin:0 0 8px;">${p.fr}</p>
                    <p class="story-tr persian-text" style="font-size:14px;color:#777;margin:0;">${p.fa}</p>
                </div>`).join("")}
        </div>
        ${story.keyWords ? `<h2 style="font-size:17px;font-weight:700;color:#1a1a1a;margin:0 0 10px;">🔑 ${lang === "fa" ? "کلمات کلیدی" : "Mots-clés"}</h2>
        <div style="display:flex;flex-wrap:wrap;gap:8px;margin-bottom:24px;">
            ${story.keyWords.map(w => `<span class="ltr-lock" style="background:#e8f5f0;color:#087F5B;padding:6px 12px;border-radius:20px;font-size:13px;font-weight:600;">${w}</span>`).join("")}
        </div>` : ''}
        ${story.questions && story.questions.length ? `
        <h2 style="font-size:17px;font-weight:700;color:#1a1a1a;margin:0 0 14px;">❓ ${lang === "fa" ? "درک مطلب" : "Compréhension"}</h2>
        ${story.questions.map((q, qi) => `
            <div style="background:#fff;border:1px solid #e0e0e0;border-radius:8px;padding:18px;margin-bottom:12px;">
                <p class="ltr-lock" style="font-size:15px;font-weight:600;color:#1a1a1a;margin:0 0 12px;">${q.question}</p>
                <div style="display:flex;flex-direction:column;gap:8px;">
                    ${q.options.map((opt, oi) => `<button class="story-q" data-q="${qi}" data-o="${oi}" style="width:100%;padding:12px;font-size:14px;border:1px solid #e0e0e0;border-radius:6px;background:#fafafa;color:#1a1a1a;cursor:pointer;text-align:left;">${opt}</button>`).join("")}
                </div>
            </div>`).join("")}` : ''}
    </div>`;
    app.innerHTML = html;

    document.querySelectorAll(".story-q").forEach(btn => {
        btn.onclick = () => {
            const qi = parseInt(btn.getAttribute("data-q"));
            const oi = parseInt(btn.getAttribute("data-o"));
            const q = story.questions[qi];
            const siblings = document.querySelectorAll(`.story-q[data-q="${qi}"]`);
            siblings.forEach(b => { b.onclick = null; });
            if (oi === q.correct) { btn.style.background = "#d4edda"; btn.style.borderColor = "#28a745"; btn.style.color = "#155724"; }
            else {
                btn.style.background = "#f8d7da"; btn.style.borderColor = "#dc3545"; btn.style.color = "#721c24";
                siblings[q.correct].style.background = "#d4edda";
                siblings[q.correct].style.borderColor = "#28a745";
                siblings[q.correct].style.color = "#155724";
            }
        };
    });
}

function toggleStoryTranslation() {
    document.querySelectorAll(".story-tr").forEach(el => {
        el.style.display = el.style.display === "none" ? "block" : "none";
    });
}

// ===============================
// 📝 تمرین پک
// ===============================
function startVocabExercise() {
    const pack = window.currentPack;
    const lang = localStorage.getItem("language") || "fr";
    const ex = pack.exercise;
    if (!ex || !ex.questions) { alert(lang === "fa" ? "به زودی" : "Bientôt"); return; }

    const questions = ex.questions.slice().sort(() => Math.random() - 0.5)
        .slice(0, ex.displayCount || ex.questions.length)
        .map(q => {
            const opts = q.options.map((text, i) => ({ text, ok: i === q.correct })).sort(() => Math.random() - 0.5);
            return { question: q.question, options: opts.map(o => o.text), correct: opts.findIndex(o => o.ok), explanation: q.explanation };
        });

    let i = 0, correct = 0;
    function renderQ() {
        if (i >= questions.length) {
            const pct = Math.round((correct / questions.length) * 100);
            let emoji = "🎉", msg = lang === "fa" ? "عالی بود!" : "Excellent !";
            if (pct < 50) { emoji = "💪"; msg = lang === "fa" ? "باید بیشتر تمرین کنی!" : "Plus d'entraînement !"; }
            else if (pct < 80) { emoji = "👍"; msg = lang === "fa" ? "خوب بود!" : "Bien !"; }
            app.innerHTML = renderNavbar() + `<div style="max-width:500px;margin:0 auto;padding:50px 16px;text-align:center;">
                <div style="font-size:48px;margin-bottom:16px;">${emoji}</div>
                <h1 style="font-size:24px;color:#1a1a1a;margin-bottom:10px;">${msg}</h1>
                <p style="font-size:16px;color:#777;margin-bottom:30px;">${correct} / ${questions.length} (${pct}%)</p>
                <button onclick="startVocabExercise()" style="width:100%;padding:14px;font-size:15px;font-weight:700;border:none;border-radius:6px;background:#087F5B;color:#fff;cursor:pointer;margin-bottom:10px;">🔄 ${lang === "fa" ? "دوباره" : "Recommencer"}</button>
                <button onclick="showVocabPack('${pack.level}','${pack.id}')" style="width:100%;padding:14px;font-size:15px;font-weight:600;border:1px solid #ddd;border-radius:6px;background:#fff;color:#1a1a1a;cursor:pointer;">${lang === "fa" ? "بازگشت" : "Retour"}</button>
            </div>`;
            return;
        }
        const q = questions[i];
        let html = renderNavbar();
        html += `<div style="max-width:560px;margin:0 auto;padding:32px 16px 60px;">
            <button class="back-btn" onclick="showVocabPack('${pack.level}','${pack.id}')">← ${lang === "fa" ? "بازگشت" : "Retour"}</button>
            <span style="font-size:13px;color:#777;">${i + 1} / ${questions.length}</span>
            <p class="ltr-lock" style="font-size:17px;font-weight:600;color:#1a1a1a;margin:16px 0 20px;">${q.question}</p>
            <div style="display:flex;flex-direction:column;gap:10px;">
                ${q.options.map((o, oi) => `<button class="vq" data-o="${oi}" style="width:100%;padding:13px;font-size:15px;border:1px solid #e0e0e0;border-radius:6px;background:#fafafa;color:#1a1a1a;cursor:pointer;text-align:left;">${o}</button>`).join("")}
            </div>
            <div id="vfb" style="margin-top:16px;"></div>
        </div>`;
        app.innerHTML = html;
        document.querySelectorAll(".vq").forEach(btn => {
            btn.onclick = () => {
                const oi = parseInt(btn.getAttribute("data-o"));
                const good = oi === q.correct;
                if (good) correct++;
                document.querySelectorAll(".vq").forEach(b => { b.onclick = null; });
                if (good) { btn.style.background = "#d4edda"; btn.style.borderColor = "#28a745"; btn.style.color = "#155724"; }
                else {
                    btn.style.background = "#f8d7da"; btn.style.borderColor = "#dc3545"; btn.style.color = "#721c24";
                    document.querySelectorAll(".vq")[q.correct].style.background = "#d4edda";
                    document.querySelectorAll(".vq")[q.correct].style.borderColor = "#28a745";
                    document.querySelectorAll(".vq")[q.correct].style.color = "#155724";
                }
                document.getElementById("vfb").innerHTML = `
                    <p class="persian-text" style="font-size:13px;color:#666;margin:0 0 12px;">${q.explanation || ""}</p>
                    <button id="vnext" style="width:100%;padding:13px;font-size:15px;font-weight:700;border:none;border-radius:6px;background:#087F5B;color:#fff;cursor:pointer;">${lang === "fa" ? "سوال بعدی" : "Suivant"}</button>`;
                document.getElementById("vnext").onclick = () => { i++; renderQ(); };
            };
        });
    }
    renderQ();
}
