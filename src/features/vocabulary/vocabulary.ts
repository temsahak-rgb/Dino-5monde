/**
 * Vocabulary catalog, flashcards, stories, weak-word review, and quizzes.
 */

type StoryDifficulty = "simple" | "literary" | "easy" | "hard";

const vocabCache: Record<string, VocabPackIndex[] | VocabPack> = {};

/** Returns persisted weak words for a vocabulary pack. */
function getWeakWords(packId: string): string[] {
    const weakMap = JSON.parse(localStorage.getItem("dino_vocab_weak") || "{}") as VocabWeakMap;
    return weakMap[packId] ?? [];
}

/** Adds or removes a word from the persisted weak-word list. */
function setWeakWord(packId: string, frenchWord: string, weak: boolean): void {
    const weakMap = JSON.parse(localStorage.getItem("dino_vocab_weak") || "{}") as VocabWeakMap;
    const current = (weakMap[packId] ?? []).filter(word => word !== frenchWord);
    weakMap[packId] = weak ? [...current, frenchWord] : current;
    localStorage.setItem("dino_vocab_weak", JSON.stringify(weakMap));
}

/** Loads and caches the vocabulary pack index for a CEFR level. */
async function loadVocabIndex(level: Level): Promise<VocabPackIndex[]> {
    const key = `index-${level}`;
    const cached = vocabCache[key];
    if (Array.isArray(cached)) return cached;

    try {
        const response = await fetch(`./data/vocabulary/vocab-${level}.json?v=${Date.now()}`, { cache: "no-store" });
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const data = await response.json() as VocabPackIndex[];
        vocabCache[key] = data;
        return data;
    } catch {
        return [];
    }
}

/** Loads and caches a complete vocabulary pack. */
async function loadVocabPack(level: Level, packId: string): Promise<VocabPack | null> {
    const key = `${level}-${packId}`;
    const cached = vocabCache[key];
    if (cached && !Array.isArray(cached)) return cached;

    try {
        const response = await fetch(`./data/vocabulary/${level}/${packId}.json?v=${Date.now()}`, { cache: "no-store" });
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const data = await response.json() as VocabPack;
        data.level = level;
        vocabCache[key] = data;
        return data;
    } catch {
        return null;
    }
}

/** Returns the active vocabulary pack or fails fast when navigation state is invalid. */
function getCurrentVocabPack(): VocabPack {
    const pack = window.currentPack;
    if (!pack) throw new Error("No active vocabulary pack is available.");
    return pack;
}

/** Displays the vocabulary level selector. */
async function showVocabularyPage(): Promise<void> {
    const lang = getLanguage();
    const levels: Level[] = ["A1", "A2", "B1", "B2", "C1", "C2"];

    app.innerHTML = renderNavbar() + `<div style="max-width:960px;margin:0 auto;padding:32px 20px 60px;">
        <h1 style="font-size:26px;font-weight:700;color:#1a1a1a;margin:0 0 6px;">${lang === "fa" ? "📖 واژگان" : "📖 Vocabulaire"}</h1>
        <p style="font-size:15px;color:#777;margin:0 0 30px;">${lang === "fa" ? "سطح خود را انتخاب کنید" : "Choisissez votre niveau"}</p>
        <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(140px,1fr));gap:12px;">
            ${levels.map(level => simpleCard("🎯", level, lang === "fa" ? "فلش‌کارت، داستان و تمرین" : "Flashcards & histoires", `showVocabLevel('${level}')`)).join("")}
        </div>
    </div>`;
}

/** Displays every vocabulary pack available for one CEFR level. */
async function showVocabLevel(level: Level): Promise<void> {
    const lang = getLanguage();
    const packs = await loadVocabIndex(level);

    app.innerHTML = renderNavbar() + `<div style="max-width:960px;margin:0 auto;padding:32px 20px 60px;">
        <button class="back-btn" onclick="showVocabularyPage()">← ${lang === "fa" ? "بازگشت" : "Retour"}</button>
        <h1 style="font-size:26px;font-weight:700;color:#1a1a1a;margin:0 0 6px;">📖 ${level}</h1>
        <p style="font-size:15px;color:#777;margin:0 0 30px;">${lang === "fa" ? "یک دسته انتخاب کنید" : "Choisissez une catégorie"}</p>
        <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(200px,1fr));gap:12px;">
            ${packs.map(pack => simpleCard(
                pack.icon || "📖",
                lang === "fa" ? pack.title_fa || pack.title : pack.title,
                `${pack.words} ${lang === "fa" ? "کلمه" : "mots"}`,
                `showVocabPack('${level}','${pack.id}')`
            )).join("")}
        </div>
    </div>`;
}

/** Displays one vocabulary pack and its available learning activities. */
async function showVocabPack(level: Level, packId: string): Promise<void> {
    const lang = getLanguage();
    const pack = await loadVocabPack(level, packId);

    if (!pack) {
        app.innerHTML = renderNavbar() + `<div style="max-width:500px;margin:0 auto;padding:60px 16px;text-align:center;">
            <p style="font-size:14px;color:#777;">🚧 ${lang === "fa" ? "این پک به زودی اضافه می‌شود." : "Bientôt disponible."}</p>
            <button onclick="showVocabLevel('${level}')" style="margin-top:15px;padding:10px 20px;border:1px solid #ddd;border-radius:6px;background:#fff;color:#1a1a1a;cursor:pointer;">${lang === "fa" ? "بازگشت" : "Retour"}</button>
        </div>`;
        return;
    }

    window.currentPack = pack;
    const weak = getWeakWords(pack.id);
    const hasSimple = Boolean(pack.stories?.simple || pack.stories?.easy);
    const hasLiterary = Boolean(pack.stories?.literary || pack.stories?.hard);
    const hasQuiz = Boolean(pack.quiz || pack.exercise);
    const title = lang === "fa"
        ? pack.title_fa || pack.theme_fa || pack.title || pack.theme || pack.id
        : pack.title || pack.theme || pack.id;

    let html = renderNavbar();
    html += `<div style="max-width:960px;margin:0 auto;padding:32px 20px 60px;">
        <button class="back-btn" onclick="showVocabLevel('${level}')">← ${lang === "fa" ? "بازگشت" : "Retour"}</button>
        <div style="display:flex;align-items:center;gap:12px;margin-bottom:30px;">
            <span style="font-size:36px;">${pack.icon || "📖"}</span>
            <div>
                <h1 style="font-size:24px;font-weight:700;color:#1a1a1a;margin:0;">${title}</h1>
                <p style="font-size:13px;color:#777;margin:4px 0 0;">${level} · ${pack.words.length} ${lang === "fa" ? "کلمه" : "mots"}</p>
            </div>
        </div>
        <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(200px,1fr));gap:12px;">`;

    html += simpleCard("🃏", lang === "fa" ? "فلش‌کارت‌ها" : "Flashcards", `${pack.words.length} ${lang === "fa" ? "کلمه" : "mots"}`, "startFlashcards()");
    if (hasSimple) html += simpleCard("🌱", lang === "fa" ? "داستان ساده" : "Histoire simple", lang === "fa" ? "متن کوتاه با جای خالی" : "Texte court à trous", "startStory('simple')");
    if (hasLiterary) html += simpleCard("🌳", lang === "fa" ? "داستان ادبی" : "Histoire littéraire", lang === "fa" ? "متن بلندتر با جای خالی" : "Texte plus long à trous", "startStory('literary')");
    if (hasQuiz) html += simpleCard("📝", lang === "fa" ? "تمرین" : "Quiz", lang === "fa" ? "آزمون کوتاه" : "Quiz rapide", "startVocabExercise()");
    if (weak.length) html += simpleCard("🔁", lang === "fa" ? "مرور کلمات ضعیف" : "Mots faibles", `${weak.length} ${lang === "fa" ? "کلمه" : "mots"}`, "startFlashcards(true)");

    app.innerHTML = `${html}</div></div>`;
}

/** Starts the flashcard activity for the active vocabulary pack. */
function startFlashcards(reviewMode = false): void {
    const pack = getCurrentVocabPack();
    const lang = getLanguage();
    const weak = getWeakWords(pack.id);
    const deck = (reviewMode ? pack.words.filter(word => weak.includes(word.fr)) : [...pack.words])
        .sort(() => Math.random() - 0.5);

    if (!deck.length) {
        alert(lang === "fa" ? "کلمه‌ای برای مرور نیست! 🎉" : "Aucun mot à réviser !");
        return;
    }

    let index = 0;
    let knownCount = 0;
    const retry: VocabWord[] = [];

    /** Displays the current flashcard. */
    function renderCard(): void {
        if (index >= deck.length) {
            renderEnd();
            return;
        }

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
                ${word.img ? `<img src="${word.img}" alt="" style="width:100%;max-height:160px;object-fit:cover;border-radius:8px;margin-bottom:14px;">` : word.emoji ? `<div style="font-size:52px;margin-bottom:10px;">${word.emoji}</div>` : ""}
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

        const flashcard = getRequiredElement<HTMLElement>("flashcard");
        flashcard.onclick = () => {
            getRequiredElement<HTMLElement>("card-back").style.display = "block";
            getRequiredElement<HTMLElement>("card-hint").style.display = "none";
            getRequiredElement<HTMLElement>("card-buttons").style.display = "flex";
            flashcard.onclick = null;
        };

        getRequiredElement<HTMLButtonElement>("btn-unknown").onclick = () => {
            setWeakWord(pack.id, word.fr, true);
            retry.push(word);
            index++;
            renderCard();
        };
        getRequiredElement<HTMLButtonElement>("btn-known").onclick = () => {
            setWeakWord(pack.id, word.fr, false);
            knownCount++;
            index++;
            renderCard();
        };
    }

    /** Displays the flashcard activity result. */
    function renderEnd(): void {
        if (retry.length && !reviewMode) {
            app.innerHTML = renderNavbar() + `<div style="max-width:500px;margin:0 auto;padding:50px 16px;text-align:center;">
                <div style="font-size:48px;margin-bottom:16px;">🔁</div>
                <h1 style="font-size:22px;color:#1a1a1a;margin-bottom:10px;">${lang === "fa" ? `${retry.length} کلمه را بلد نبودی` : `${retry.length} mot(s) non connu(s)`}</h1>
                <p style="font-size:15px;color:#777;margin-bottom:30px;">${lang === "fa" ? "حالا وقت مرور است!" : "C'est l'heure de réviser !"}</p>
                <button id="btn-review" style="width:100%;padding:14px;font-size:15px;font-weight:700;border:none;border-radius:6px;background:#087F5B;color:#fff;cursor:pointer;margin-bottom:10px;">🔁 ${lang === "fa" ? "مرور کن" : "Réviser"}</button>
                <button id="btn-stop" style="width:100%;padding:14px;font-size:15px;font-weight:600;border:1px solid #ddd;border-radius:6px;background:#fff;color:#1a1a1a;cursor:pointer;">${lang === "fa" ? "پایان" : "Terminer"}</button>
            </div>`;
            getRequiredElement<HTMLButtonElement>("btn-review").onclick = () => startFlashcards(true);
            getRequiredElement<HTMLButtonElement>("btn-stop").onclick = () => { void showVocabPack(pack.level, pack.id); };
            return;
        }

        const percentage = Math.round((knownCount / deck.length) * 100);
        let emoji = "🎉";
        let message = lang === "fa" ? "عالی بود!" : "Excellent !";
        if (percentage < 50) {
            emoji = "💪";
            message = lang === "fa" ? "باید بیشتر تمرین کنی!" : "Plus d'entraînement !";
        } else if (percentage < 80) {
            emoji = "👍";
            message = lang === "fa" ? "خوب بود!" : "Bien !";
        }

        app.innerHTML = renderNavbar() + `<div style="max-width:500px;margin:0 auto;padding:50px 16px;text-align:center;">
            <div style="font-size:48px;margin-bottom:16px;">${emoji}</div>
            <h1 style="font-size:24px;color:#1a1a1a;margin-bottom:10px;">${message}</h1>
            <p style="font-size:16px;color:#777;margin-bottom:30px;">${knownCount} / ${deck.length} (${percentage}%)</p>
            <button onclick="startFlashcards(${reviewMode})" style="width:100%;padding:14px;font-size:15px;font-weight:700;border:none;border-radius:6px;background:#087F5B;color:#fff;cursor:pointer;margin-bottom:10px;">🔄 ${lang === "fa" ? "دوباره" : "Recommencer"}</button>
            <button onclick="showVocabPack('${pack.level}','${pack.id}')" style="width:100%;padding:14px;font-size:15px;font-weight:600;border:1px solid #ddd;border-radius:6px;background:#fff;color:#1a1a1a;cursor:pointer;">${lang === "fa" ? "بازگشت" : "Retour"}</button>
        </div>`;
    }

    renderCard();
}

/** Toggles all visible story translations. */
function toggleStoryTranslation(): void {
    queryElements<HTMLElement>(".story-tr").forEach(element => {
        element.style.display = element.style.display === "none" ? "block" : "none";
    });
}

/** Starts a story activity using either the current or legacy story schema. */
function startStory(difficulty: StoryDifficulty): void {
    const pack = getCurrentVocabPack();
    const lang = getLanguage();
    const fallbackDifficulty = difficulty === "simple" ? "easy" : difficulty === "literary" ? "hard" : difficulty;
    const story = pack.stories?.[difficulty] || pack.stories?.[fallbackDifficulty];

    if (!story) {
        alert(lang === "fa" ? "به زودی" : "Bientôt");
        return;
    }

    let html = renderNavbar();
    html += `<div style="max-width:700px;margin:0 auto;padding:32px 20px 60px;">
        <button class="back-btn" onclick="showVocabPack('${pack.level}','${pack.id}')">← ${lang === "fa" ? "بازگشت" : "Retour"}</button>`;

    const label = difficulty === "simple" || difficulty === "easy" ? "🌱" : "🌳";
    html += `<p style="font-size:12px;color:#777;text-transform:uppercase;letter-spacing:1px;margin:0 0 6px;">${label}</p>`;
    html += `<h1 class="ltr-lock" style="font-size:24px;font-weight:700;color:#1a1a1a;margin:0 0 4px;">${story.title}</h1>`;
    html += `<p class="persian-text" style="font-size:15px;color:#777;margin:0 0 20px;">${story.title_fa || ""}</p>`;

    if (story.text_fa) {
        html += `<button onclick="toggleStoryTranslation()" style="width:auto;padding:8px 16px;font-size:13px;font-weight:600;border:1px solid #ddd;border-radius:6px;background:#fff;color:#1a1a1a;cursor:pointer;margin-bottom:20px;">👁️ ${lang === "fa" ? "نمایش / مخفی ترجمه" : "Traduction"}</button>`;
    }

    if (story.text && story.blanks?.length) {
        renderBlankStory(story, html, lang);
        return;
    }

    html += `<div style="background:#fff;border:1px solid #e0e0e0;border-radius:8px;padding:24px;margin-bottom:24px;">`;
    (story.paragraphs ?? []).forEach(paragraph => {
        html += `<div style="margin-bottom:18px;padding-bottom:18px;border-bottom:1px solid #f0f0f0;">
            <p class="ltr-lock" style="font-size:16px;line-height:1.8;color:#1a1a1a;margin:0 0 8px;">${paragraph.fr}</p>
            <p class="story-tr persian-text" style="font-size:14px;color:#777;margin:0;">${paragraph.fa}</p>
        </div>`;
    });
    html += `</div>`;

    if (story.keyWords?.length) {
        html += `<h2 style="font-size:17px;font-weight:700;color:#1a1a1a;margin:0 0 10px;">🔑 ${lang === "fa" ? "کلمات کلیدی" : "Mots-clés"}</h2>`;
        html += `<div style="display:flex;flex-wrap:wrap;gap:8px;margin-bottom:24px;">${story.keyWords.map(word => `<span class="ltr-lock" style="background:#e8f5f0;color:#087F5B;padding:6px 12px;border-radius:20px;font-size:13px;font-weight:600;">${word}</span>`).join("")}</div>`;
    }

    if (story.questions?.length) {
        html += `<h2 style="font-size:17px;font-weight:700;color:#1a1a1a;margin:0 0 14px;">❓ ${lang === "fa" ? "درک مطلب" : "Compréhension"}</h2>`;
        story.questions.forEach((question, questionIndex) => {
            html += `<div style="background:#fff;border:1px solid #e0e0e0;border-radius:8px;padding:18px;margin-bottom:12px;">
                <p class="ltr-lock" style="font-size:15px;font-weight:600;color:#1a1a1a;margin:0 0 12px;">${question.question}</p>
                <div style="display:flex;flex-direction:column;gap:8px;">
                    ${question.options.map((option, optionIndex) => `<button class="story-q" data-q="${questionIndex}" data-o="${optionIndex}" style="width:100%;padding:12px;font-size:14px;border:1px solid #e0e0e0;border-radius:6px;background:#fafafa;color:#1a1a1a;cursor:pointer;text-align:left;">${option}</button>`).join("")}
                </div>
            </div>`;
        });
    }

    app.innerHTML = `${html}</div>`;
    bindLegacyStoryQuestions(story);
}

/** Renders and wires the fill-in-the-blank story schema. */
function renderBlankStory(story: VocabStory, initialHtml: string, lang: Language): void {
    const sortedBlanks = [...(story.blanks ?? [])].sort((a, b) => a.id - b.id);
    const text = story.text || "";
    const parts = text.split(/{{BLANK_\d+}}/);
    const placeholders = text.match(/{{BLANK_\d+}}/g) || [];
    let html = `${initialHtml}<p style="font-size:13px;color:#777;margin-bottom:16px;">${lang === "fa" ? "جاهای خالی را با کلمه درست پر کن:" : "Remplis les trous avec le bon mot :"}</p>`;
    html += `<div style="background:#fff;border:1px solid #e0e0e0;border-radius:8px;padding:24px;margin-bottom:24px;line-height:2;">`;

    parts.forEach((part, index) => {
        html += part;
        if (index < placeholders.length) {
            html += `<button class="blank-btn" data-blank="${index}" style="display:inline-block;min-width:100px;padding:4px 12px;margin:2px 4px;font-size:14px;font-weight:600;border:2px dashed #087F5B;border-radius:6px;background:#e8f5f0;color:#087F5B;cursor:pointer;vertical-align:middle;">___</button>`;
        }
    });
    html += `</div><div id="blanks-container">`;

    sortedBlanks.forEach((blank, index) => {
        html += `<div class="blank-question" data-idx="${index}" style="background:#fff;border:1px solid #e0e0e0;border-radius:8px;padding:16px;margin-bottom:12px;">
            <p style="font-size:14px;font-weight:600;color:#1a1a1a;margin:0 0 10px;">${index + 1}. ___</p>
            <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;">
                ${blank.options.map((option, optionIndex) => `<button class="blank-opt" data-idx="${index}" data-oi="${optionIndex}" style="padding:10px;font-size:14px;border:1px solid #e0e0e0;border-radius:6px;background:#fafafa;color:#1a1a1a;cursor:pointer;text-align:center;">${option}</button>`).join("")}
            </div>
        </div>`;
    });

    html += `</div><button id="check-blanks" style="width:100%;padding:14px;font-size:15px;font-weight:700;border:none;border-radius:6px;background:#087F5B;color:#fff;cursor:pointer;margin-top:16px;">${lang === "fa" ? "بررسی جواب‌ها" : "Vérifier les réponses"}</button>`;
    if (story.text_fa) {
        html += `<div class="story-tr" style="display:none;background:#f0f9ff;border:1px solid #087F5B;border-radius:8px;padding:20px;margin-top:20px;">
            <h3 style="font-size:16px;font-weight:700;color:#087F5B;margin:0 0 12px;">📖 ${lang === "fa" ? "ترجمه داستان" : "Traduction de l'histoire"}</h3>
            <p class="persian-text" style="font-size:15px;line-height:1.8;color:#333;margin:0;">${story.text_fa}</p>
        </div>`;
    }

    app.innerHTML = `${html}</div>`;
    const answers: Array<number | null> = new Array(sortedBlanks.length).fill(null);

    queryElements<HTMLButtonElement>(".blank-opt").forEach(button => {
        button.onclick = () => {
            const blankIndex = Number.parseInt(button.dataset.idx || "-1", 10);
            const optionIndex = Number.parseInt(button.dataset.oi || "-1", 10);
            if (blankIndex < 0 || optionIndex < 0) return;
            answers[blankIndex] = optionIndex;

            queryElements<HTMLButtonElement>(`.blank-opt[data-idx="${blankIndex}"]`).forEach(candidate => {
                candidate.style.background = "#fafafa";
                candidate.style.borderColor = "#e0e0e0";
            });
            button.style.background = "#e8f5f0";
            button.style.borderColor = "#087F5B";

            const blankButton = document.querySelector<HTMLButtonElement>(`.blank-btn[data-blank="${blankIndex}"]`);
            if (blankButton) blankButton.textContent = sortedBlanks[blankIndex]?.options[optionIndex] || "___";
        };
    });

    getRequiredElement<HTMLButtonElement>("check-blanks").onclick = () => {
        let correct = 0;
        sortedBlanks.forEach((blank, index) => {
            const blankButton = document.querySelector<HTMLButtonElement>(`.blank-btn[data-blank="${index}"]`);
            const valid = answers[index] === blank.correctIndex;
            if (valid) correct++;
            if (blankButton) {
                blankButton.style.background = valid ? "#d4edda" : "#f8d7da";
                blankButton.style.borderColor = valid ? "#28a745" : "#dc3545";
                blankButton.style.color = valid ? "#155724" : "#721c24";
            }
        });

        const percentage = Math.round((correct / Math.max(sortedBlanks.length, 1)) * 100);
        const message = percentage < 50
            ? (lang === "fa" ? "بیشتر تلاش کن!" : "Plus d'effort !")
            : percentage < 80
                ? (lang === "fa" ? "خوب بود!" : "Bien !")
                : (lang === "fa" ? "عالی بود!" : "Excellent !");
        const emoji = percentage < 50 ? "💪" : percentage < 80 ? "👍" : "🎉";
        alert(`${emoji} ${correct}/${sortedBlanks.length} (${percentage}%) - ${message}`);
    };
}

/** Wires comprehension questions used by the legacy story schema. */
function bindLegacyStoryQuestions(story: VocabStory): void {
    queryElements<HTMLButtonElement>(".story-q").forEach(button => {
        button.onclick = () => {
            const questionIndex = Number.parseInt(button.dataset.q || "-1", 10);
            const optionIndex = Number.parseInt(button.dataset.o || "-1", 10);
            const question = story.questions?.[questionIndex];
            if (!question) return;

            const siblings = queryElements<HTMLButtonElement>(`.story-q[data-q="${questionIndex}"]`);
            siblings.forEach(candidate => { candidate.onclick = null; });

            if (optionIndex === question.correct) {
                button.style.background = "#d4edda";
                button.style.borderColor = "#28a745";
                button.style.color = "#155724";
            } else {
                button.style.background = "#f8d7da";
                button.style.borderColor = "#dc3545";
                button.style.color = "#721c24";
                const correctButton = siblings[question.correct];
                if (correctButton) {
                    correctButton.style.background = "#d4edda";
                    correctButton.style.borderColor = "#28a745";
                    correctButton.style.color = "#155724";
                }
            }
        };
    });
}

/** Starts the randomized quiz attached to the active vocabulary pack. */
function startVocabExercise(): void {
    const pack = getCurrentVocabPack();
    const lang = getLanguage();
    const exercise = pack.exercise || pack.quiz;

    if (!exercise?.questions.length) {
        alert(lang === "fa" ? "به زودی" : "Bientôt");
        return;
    }

    const questions = [...exercise.questions]
        .sort(() => Math.random() - 0.5)
        .slice(0, exercise.displayCount || exercise.questions.length)
        .map(question => {
            const correctIndex = question.correct ?? question.correctIndex ?? -1;
            const options = question.options
                .map((text, index) => ({ text, correct: index === correctIndex }))
                .sort(() => Math.random() - 0.5);

            return {
                question: question.question,
                options: options.map(option => option.text),
                correct: options.findIndex(option => option.correct),
                explanation: question.explanation || question.explanation_fa || ""
            };
        });

    let questionIndex = 0;
    let correctCount = 0;

    /** Renders one vocabulary quiz question or the final score. */
    function renderQuestion(): void {
        if (questionIndex >= questions.length) {
            const percentage = Math.round((correctCount / Math.max(questions.length, 1)) * 100);
            const emoji = percentage < 50 ? "💪" : percentage < 80 ? "👍" : "🎉";
            const message = percentage < 50
                ? (lang === "fa" ? "باید بیشتر تمرین کنی!" : "Plus d'entraînement !")
                : percentage < 80
                    ? (lang === "fa" ? "خوب بود!" : "Bien !")
                    : (lang === "fa" ? "عالی بود!" : "Excellent !");

            app.innerHTML = renderNavbar() + `<div style="max-width:500px;margin:0 auto;padding:50px 16px;text-align:center;">
                <div style="font-size:48px;margin-bottom:16px;">${emoji}</div>
                <h1 style="font-size:24px;color:#1a1a1a;margin-bottom:10px;">${message}</h1>
                <p style="font-size:16px;color:#777;margin-bottom:30px;">${correctCount} / ${questions.length} (${percentage}%)</p>
                <button onclick="startVocabExercise()" style="width:100%;padding:14px;font-size:15px;font-weight:700;border:none;border-radius:6px;background:#087F5B;color:#fff;cursor:pointer;margin-bottom:10px;">🔄 ${lang === "fa" ? "دوباره" : "Recommencer"}</button>
                <button onclick="showVocabPack('${pack.level}','${pack.id}')" style="width:100%;padding:14px;font-size:15px;font-weight:600;border:1px solid #ddd;border-radius:6px;background:#fff;color:#1a1a1a;cursor:pointer;">${lang === "fa" ? "بازگشت" : "Retour"}</button>
            </div>`;
            return;
        }

        const question = questions[questionIndex];
        app.innerHTML = renderNavbar() + `<div style="max-width:560px;margin:0 auto;padding:32px 16px 60px;">
            <button class="back-btn" onclick="showVocabPack('${pack.level}','${pack.id}')">← ${lang === "fa" ? "بازگشت" : "Retour"}</button>
            <span style="font-size:13px;color:#777;">${questionIndex + 1} / ${questions.length}</span>
            <p class="ltr-lock" style="font-size:17px;font-weight:600;color:#1a1a1a;margin:16px 0 20px;">${question.question}</p>
            <div style="display:flex;flex-direction:column;gap:10px;">
                ${question.options.map((option, index) => `<button class="vq" data-o="${index}" style="width:100%;padding:13px;font-size:15px;border:1px solid #e0e0e0;border-radius:6px;background:#fafafa;color:#1a1a1a;cursor:pointer;text-align:left;">${option}</button>`).join("")}
            </div>
            <div id="vfb" style="margin-top:16px;"></div>
        </div>`;

        const buttons = queryElements<HTMLButtonElement>(".vq");
        buttons.forEach(button => {
            button.onclick = () => {
                const optionIndex = Number.parseInt(button.dataset.o || "-1", 10);
                const correct = optionIndex === question.correct;
                if (correct) correctCount++;
                buttons.forEach(candidate => { candidate.onclick = null; });

                button.style.background = correct ? "#d4edda" : "#f8d7da";
                button.style.borderColor = correct ? "#28a745" : "#dc3545";
                button.style.color = correct ? "#155724" : "#721c24";

                if (!correct) {
                    const correctButton = buttons[question.correct];
                    if (correctButton) {
                        correctButton.style.background = "#d4edda";
                        correctButton.style.borderColor = "#28a745";
                        correctButton.style.color = "#155724";
                    }
                }

                const feedback = getRequiredElement<HTMLElement>("vfb");
                feedback.innerHTML = `<p class="persian-text" style="font-size:13px;color:#666;margin:0 0 12px;">${question.explanation}</p>
                    <button id="vnext" style="width:100%;padding:13px;font-size:15px;font-weight:700;border:none;border-radius:6px;background:#087F5B;color:#fff;cursor:pointer;">${lang === "fa" ? "سوال بعدی" : "Suivant"}</button>`;
                getRequiredElement<HTMLButtonElement>("vnext").onclick = () => {
                    questionIndex++;
                    renderQuestion();
                };
            };
        });
    }

    renderQuestion();
}
