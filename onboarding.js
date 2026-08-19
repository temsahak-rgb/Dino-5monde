// ===============================
// 🦖 انتخاب زبان (با دایناسور)
// ===============================
function showLanguage() {
    const lang = localStorage.getItem("language") || "fr";
    const t = texts[lang];
    app.innerHTML = `<div style="max-width:400px;margin:80px auto;padding:0 16px;text-align:center;">
        <div style="font-size:64px;margin-bottom:20px;">🦖</div>
        <h1 style="font-size:24px;color:#1a1a1a;margin-bottom:8px;">${t.title}</h1>
        <p style="font-size:14px;color:#777;margin-bottom:30px;">${t.chooseLanguage}</p>
        <button id="fr" style="width:100%;padding:14px;margin-bottom:10px;border:1px solid #ddd;border-radius:6px;background:#fff;font-size:16px;color:#1a1a1a;cursor:pointer;transition:border-color 0.15s;" onmouseover="this.style.borderColor='#087F5B'" onmouseout="this.style.borderColor='#ddd'">${t.french}</button>
        <button id="fa" style="width:100%;padding:14px;border:1px solid #ddd;border-radius:6px;background:#fff;font-size:16px;color:#1a1a1a;cursor:pointer;transition:border-color 0.15s;" onmouseover="this.style.borderColor='#087F5B'" onmouseout="this.style.borderColor='#ddd'">${t.persian}</button>
    </div>`;
    document.getElementById("fr").onclick = () => { localStorage.setItem("language", "fr"); showPath(); };
    document.getElementById("fa").onclick = () => { localStorage.setItem("language", "fa"); showPath(); };
}

// ===============================
// 🦖 انتخاب مسیر (با دایناسور)
// ===============================
function showPath() {
    const lang = localStorage.getItem("language") || "fr";
    const t = texts[lang];
    app.innerHTML = `<div style="max-width:400px;margin:60px auto;padding:0 16px;">
        <div style="font-size:48px;margin-bottom:16px;text-align:center;">🦖</div>
        <button id="back" class="back-btn" style="background:none;border:none;color:#087F5B;font-size:13px;cursor:pointer;padding:0;margin-bottom:16px;">← ${t.back}</button>
        <h1 style="font-size:22px;color:#1a1a1a;margin-bottom:20px;">${t.choosePath}</h1>
        <button id="general" style="width:100%;padding:14px;margin-bottom:10px;border:1px solid #ddd;border-radius:6px;background:#fff;font-size:15px;color:#1a1a1a;cursor:pointer;text-align:left;transition:border-color 0.15s;" onmouseover="this.style.borderColor='#087F5B'" onmouseout="this.style.borderColor='#ddd'">🇫🇷 ${t.general}</button>
        <button id="travel" style="width:100%;padding:14px;margin-bottom:10px;border:1px solid #ddd;border-radius:6px;background:#fff;font-size:15px;color:#1a1a1a;cursor:pointer;text-align:left;transition:border-color 0.15s;" onmouseover="this.style.borderColor='#087F5B'" onmouseout="this.style.borderColor='#ddd'">✈️ ${t.travel}</button>
        <button id="daily" style="width:100%;padding:14px;border:1px solid #ddd;border-radius:6px;background:#fff;font-size:15px;color:#1a1a1a;cursor:pointer;text-align:left;transition:border-color 0.15s;" onmouseover="this.style.borderColor='#087F5B'" onmouseout="this.style.borderColor='#ddd'">🏘️ ${t.daily}</button>
    </div>`;
    document.getElementById("back").onclick = showLanguage;
    document.getElementById("general").onclick = showPlacementChoice;
    document.getElementById("travel").onclick = () => { localStorage.setItem("currentPath", "travel"); showHome(); };
    document.getElementById("daily").onclick = () => { localStorage.setItem("currentPath", "daily"); showHome(); };
}

// ===============================
// 🦖 تعیین سطح (با دایناسور)
// ===============================
function showPlacementChoice() {
    const lang = localStorage.getItem("language") || "fr";
    const t = texts[lang];
    app.innerHTML = `<div style="max-width:400px;margin:60px auto;padding:0 16px;">
        <div style="font-size:48px;margin-bottom:16px;text-align:center;">🦖</div>
        <button id="back" class="back-btn" style="background:none;border:none;color:#087F5B;font-size:13px;cursor:pointer;padding:0;margin-bottom:16px;">← ${t.back}</button>
        <h1 style="font-size:22px;color:#1a1a1a;margin-bottom:10px;">${t.general}</h1>
        <p style="font-size:14px;color:#777;margin-bottom:25px;">${t.levelQuestion}</p>
        <button id="yes" style="width:100%;padding:14px;margin-bottom:10px;border:none;border-radius:6px;background:#087F5B;color:#fff;font-size:15px;cursor:pointer;">${t.yes}</button>
        <button id="later" style="width:100%;padding:14px;border:1px solid #ddd;border-radius:6px;background:#fff;font-size:15px;color:#1a1a1a;cursor:pointer;">${t.later}</button>
    </div>`;
    document.getElementById("back").onclick = showPath;
    document.getElementById("later").onclick = showHome;
    document.getElementById("yes").onclick = () => { resetPlacementState(); showQuestion(); };
}

// ===============================
// 🦖 سوالات تعیین سطح (با دایناسور + اصلاح رنگ)
// ===============================
function showQuestion() {
    const question = getNextQuestion();
    if (!question) { showFinalResult(); return; }
    const lang = localStorage.getItem("language") || "fr";
    const t = texts[lang];
    const progress = (placementState.asked.length / 15) * 100;

    let html = `<div style="max-width:600px;margin:0 auto;padding:30px 16px;">
        <div style="text-align:center;font-size:32px;margin-bottom:16px;">🦖</div>
        <div style="background:#e0e0e0;height:4px;border-radius:2px;margin-bottom:25px;overflow:hidden;">
            <div style="background:#087F5B;height:100%;width:${progress}%;transition:width 0.3s;"></div>
        </div>
        <div style="background:#fff;border:1px solid #e0e0e0;border-radius:8px;padding:30px;">
            <p class="ltr-lock" style="font-size:18px;margin:0 0 25px;line-height:1.6;color:#1a1a1a;font-weight:500;">${question.question}</p>
            <div style="display:flex;flex-direction:column;gap:10px;">`;

    question.options.forEach((option, index) => {
        html += `<button class="option-btn ltr-lock" data-index="${index}" style="width:100%;padding:14px;font-size:15px;border:1px solid #e0e0e0;border-radius:6px;background:#fafafa;color:#1a1a1a;cursor:pointer;text-align:left;transition:all 0.15s;font-weight:500;">${option}</button>`;
    });

    html += `</div><button id="dont-know" style="width:100%;margin-top:15px;padding:12px;font-size:14px;border:1px solid #dc2626;border-radius:6px;background:#fff;color:#dc2626;cursor:pointer;font-weight:600;">${t.dontKnow}</button></div></div>`;
    app.innerHTML = html;

    document.querySelectorAll(".option-btn").forEach(btn => {
        btn.onclick = () => {
            const selectedIndex = parseInt(btn.getAttribute("data-index"));
            const isCorrect = selectedIndex === question.correctIndex;
            answerPlacement(isCorrect);
            if (isCorrect) { btn.style.background = "#d4edda"; btn.style.borderColor = "#28a745"; btn.style.color = "#155724"; }
            else { btn.style.background = "#f8d7da"; btn.style.borderColor = "#dc3545"; btn.style.color = "#721c24"; document.querySelectorAll(".option-btn")[question.correctIndex].style.background = "#d4edda"; document.querySelectorAll(".option-btn")[question.correctIndex].style.borderColor = "#28a745"; document.querySelectorAll(".option-btn")[question.correctIndex].style.color = "#155724"; }
            document.querySelectorAll(".option-btn").forEach(b => { b.onclick = null; b.style.cursor = "default"; });
            document.getElementById("dont-know").onclick = null; document.getElementById("dont-know").style.cursor = "default";
            setTimeout(() => { showQuestion(); }, 1500);
        };
    });
    document.getElementById("dont-know").onclick = () => {
        answerPlacement(null);
        document.getElementById("dont-know").style.backgroundColor = "#f8d7da"; document.getElementById("dont-know").style.color = "#721c24";
        document.querySelectorAll(".option-btn")[question.correctIndex].style.backgroundColor = "#d4edda"; document.querySelectorAll(".option-btn")[question.correctIndex].style.color = "#155724"; document.querySelectorAll(".option-btn")[question.correctIndex].style.borderColor = "#28a745";
        document.querySelectorAll(".option-btn").forEach(b => { b.onclick = null; b.style.cursor = "default"; });
        document.getElementById("dont-know").onclick = null; document.getElementById("dont-know").style.cursor = "default";
        setTimeout(() => { showQuestion(); }, 1500);
    };
}

// ===============================
// 🦖 نتیجه تعیین سطح (با دایناسور)
// ===============================
function showFinalResult() {
    const levelInfo = getEstimatedLevelRange();
    const lang = localStorage.getItem("language") || "fr";
    const t = texts[lang];
    app.innerHTML = `<div style="text-align:center;padding:50px 16px;max-width:500px;margin:0 auto;">
        <div style="font-size:48px;margin-bottom:16px;">🦖</div>
        <h1 style="font-size:24px;color:#1a1a1a;margin-bottom:16px;">🎉 ${t.finalResult}</h1>
        <p style="font-size:14px;color:#777;margin-bottom:8px;">${t.yourLevel} :</p>
        <h2 style="font-size:48px;color:#087F5B;margin:15px 0;font-weight:800;">${levelInfo.range}</h2>
        <p style="font-size:14px;color:#777;margin:20px 0;line-height:1.6;">${t.canModify}</p>
        <button id="accept-level" style="width:100%;padding:14px;border:none;border-radius:6px;background:#087F5B;color:#fff;font-size:15px;cursor:pointer;margin-bottom:10px;font-weight:600;">${t.acceptLevel}</button>
        <button id="change-level" style="width:100%;padding:14px;border:1px solid #087F5B;border-radius:6px;background:#fff;color:#087F5B;font-size:15px;cursor:pointer;font-weight:600;">${t.changeLevel}</button>
    </div>`;
    document.getElementById("accept-level").onclick = () => { savePlacementResult(levelInfo.level); showHome(); };
    document.getElementById("change-level").onclick = showLevelSelection;
}

function showLevelSelection() {
    const lang = localStorage.getItem("language") || "fr";
    const t = texts[lang];
    const levels = ["A1", "A2", "B1", "B2", "C1"];
    let html = `<div style="text-align:center;padding:50px 16px;max-width:500px;margin:0 auto;">
        <div style="font-size:48px;margin-bottom:16px;">🦖</div>
        <h1 style="font-size:22px;color:#1a1a1a;margin-bottom:30px;">${t.chooseYourLevel}</h1>
        <div style="display:flex;flex-direction:column;gap:10px;">`;
    levels.forEach(level => { html += `<button class="level-btn" data-level="${level}" style="padding:14px;font-size:18px;border:1px solid #ddd;border-radius:6px;background:#fff;color:#1a1a1a;cursor:pointer;font-weight:600;transition:border-color 0.15s;" onmouseover="this.style.borderColor='#087F5B'" onmouseout="this.style.borderColor='#ddd'">${level}</button>`; });
    html += `</div></div>`;
    app.innerHTML = html;
    document.querySelectorAll(".level-btn").forEach(btn => { btn.onclick = () => { savePlacementResult(btn.getAttribute("data-level")); showHome(); }; });
}
