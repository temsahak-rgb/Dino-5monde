/**
 * Initial language, learning-path, and adaptive placement onboarding flow.
 */

/** Displays the interface-language selection page. */
function showLanguage(): void {
    const lang = getLanguage();
    const t = texts[lang];

    app.innerHTML = `<div style="max-width:400px;margin:80px auto;padding:0 16px;text-align:center;">
        <div style="font-size:64px;margin-bottom:20px;">🦖</div>
        <h1 style="font-size:24px;color:#1a1a1a;margin-bottom:8px;">${t.title}</h1>
        <p style="font-size:14px;color:#777;margin-bottom:30px;">${t.chooseLanguage}</p>
        <button id="fr" style="width:100%;padding:14px;margin-bottom:10px;border:1px solid #ddd;border-radius:6px;background:#fff;font-size:16px;color:#1a1a1a;cursor:pointer;transition:border-color 0.15s;" onmouseover="this.style.borderColor='#087F5B'" onmouseout="this.style.borderColor='#ddd'">${t.french}</button>
        <button id="fa" style="width:100%;padding:14px;border:1px solid #ddd;border-radius:6px;background:#fff;font-size:16px;color:#1a1a1a;cursor:pointer;transition:border-color 0.15s;" onmouseover="this.style.borderColor='#087F5B'" onmouseout="this.style.borderColor='#ddd'">${t.persian}</button>
    </div>`;

    getRequiredElement<HTMLButtonElement>("fr").onclick = () => {
        localStorage.setItem("language", "fr");
        showPath();
    };
    getRequiredElement<HTMLButtonElement>("fa").onclick = () => {
        localStorage.setItem("language", "fa");
        showPath();
    };
}

/** Displays the learning-path selection page. */
function showPath(): void {
    const lang = getLanguage();
    const t = texts[lang];

    app.innerHTML = `<div style="max-width:400px;margin:60px auto;padding:0 16px;">
        <div style="font-size:48px;margin-bottom:16px;text-align:center;">🦖</div>
        <button id="back" class="back-btn" style="background:none;border:none;color:#087F5B;font-size:13px;cursor:pointer;padding:0;margin-bottom:16px;">← ${t.back}</button>
        <h1 style="font-size:22px;color:#1a1a1a;margin-bottom:20px;">${t.choosePath}</h1>
        <button id="general" style="width:100%;padding:14px;margin-bottom:10px;border:1px solid #ddd;border-radius:6px;background:#fff;font-size:15px;color:#1a1a1a;cursor:pointer;text-align:left;transition:border-color 0.15s;" onmouseover="this.style.borderColor='#087F5B'" onmouseout="this.style.borderColor='#ddd'">🇫🇷 ${t.general}</button>
        <button id="travel" style="width:100%;padding:14px;margin-bottom:10px;border:1px solid #ddd;border-radius:6px;background:#fff;font-size:15px;color:#1a1a1a;cursor:pointer;text-align:left;transition:border-color 0.15s;" onmouseover="this.style.borderColor='#087F5B'" onmouseout="this.style.borderColor='#ddd'">✈️ ${t.travel}</button>
        <button id="daily" style="width:100%;padding:14px;border:1px solid #ddd;border-radius:6px;background:#fff;font-size:15px;color:#1a1a1a;cursor:pointer;text-align:left;transition:border-color 0.15s;" onmouseover="this.style.borderColor='#087F5B'" onmouseout="this.style.borderColor='#ddd'">🏘️ ${t.daily}</button>
    </div>`;

    getRequiredElement<HTMLButtonElement>("back").onclick = showLanguage;
    getRequiredElement<HTMLButtonElement>("general").onclick = showPlacementChoice;
    getRequiredElement<HTMLButtonElement>("travel").onclick = () => {
        localStorage.setItem("currentPath", "travel");
        void showHome();
    };
    getRequiredElement<HTMLButtonElement>("daily").onclick = () => {
        localStorage.setItem("currentPath", "daily");
        void showHome();
    };
}

/** Asks whether the user wants to run the adaptive placement test. */
function showPlacementChoice(): void {
    const lang = getLanguage();
    const t = texts[lang];

    app.innerHTML = `<div style="max-width:400px;margin:60px auto;padding:0 16px;">
        <div style="font-size:48px;margin-bottom:16px;text-align:center;">🦖</div>
        <button id="back" class="back-btn" style="background:none;border:none;color:#087F5B;font-size:13px;cursor:pointer;padding:0;margin-bottom:16px;">← ${t.back}</button>
        <h1 style="font-size:22px;color:#1a1a1a;margin-bottom:10px;">${t.general}</h1>
        <p style="font-size:14px;color:#777;margin-bottom:25px;">${t.levelQuestion}</p>
        <button id="yes" style="width:100%;padding:14px;margin-bottom:10px;border:none;border-radius:6px;background:#087F5B;color:#fff;font-size:15px;cursor:pointer;">${t.yes}</button>
        <button id="later" style="width:100%;padding:14px;border:1px solid #ddd;border-radius:6px;background:#fff;font-size:15px;color:#1a1a1a;cursor:pointer;">${t.later}</button>
    </div>`;

    getRequiredElement<HTMLButtonElement>("back").onclick = showPath;
    getRequiredElement<HTMLButtonElement>("later").onclick = () => { void showHome(); };
    getRequiredElement<HTMLButtonElement>("yes").onclick = () => {
        resetPlacementState();
        showQuestion();
    };
}

/** Displays and wires the current adaptive placement question. */
function showQuestion(): void {
    const question = getNextQuestion();
    if (!question) {
        showFinalResult();
        return;
    }

    const lang = getLanguage();
    const t = texts[lang];
    const progress = (getPlacementState().asked.length / 15) * 100;

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

    const optionButtons = queryElements<HTMLButtonElement>(".option-btn");
    const dontKnowButton = getRequiredElement<HTMLButtonElement>("dont-know");

    optionButtons.forEach(button => {
        button.onclick = () => {
            const selectedIndex = Number.parseInt(button.dataset.index || "-1", 10);
            const correct = selectedIndex === question.correctIndex;
            answerPlacement(correct);

            if (correct) {
                button.style.background = "#d4edda";
                button.style.borderColor = "#28a745";
                button.style.color = "#155724";
            } else {
                button.style.background = "#f8d7da";
                button.style.borderColor = "#dc3545";
                button.style.color = "#721c24";
                const correctButton = optionButtons[question.correctIndex];
                if (correctButton) {
                    correctButton.style.background = "#d4edda";
                    correctButton.style.borderColor = "#28a745";
                    correctButton.style.color = "#155724";
                }
            }

            optionButtons.forEach(candidate => {
                candidate.onclick = null;
                candidate.style.cursor = "default";
            });
            dontKnowButton.onclick = null;
            dontKnowButton.style.cursor = "default";
            window.setTimeout(showQuestion, 1500);
        };
    });

    dontKnowButton.onclick = () => {
        answerPlacement(null);
        dontKnowButton.style.backgroundColor = "#f8d7da";
        dontKnowButton.style.color = "#721c24";

        const correctButton = optionButtons[question.correctIndex];
        if (correctButton) {
            correctButton.style.backgroundColor = "#d4edda";
            correctButton.style.color = "#155724";
            correctButton.style.borderColor = "#28a745";
        }

        optionButtons.forEach(button => {
            button.onclick = null;
            button.style.cursor = "default";
        });
        dontKnowButton.onclick = null;
        dontKnowButton.style.cursor = "default";
        window.setTimeout(showQuestion, 1500);
    };
}

/** Displays the adaptive placement result. */
function showFinalResult(): void {
    const levelInfo = getEstimatedLevelRange();
    const lang = getLanguage();
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

    getRequiredElement<HTMLButtonElement>("accept-level").onclick = () => {
        savePlacementResult(levelInfo.level);
        void showHome();
    };
    getRequiredElement<HTMLButtonElement>("change-level").onclick = showLevelSelection;
}

/** Displays a manual CEFR level selector. */
function showLevelSelection(): void {
    const lang = getLanguage();
    const t = texts[lang];
    const levels: Level[] = ["A1", "A2", "B1", "B2", "C1"];

    app.innerHTML = `<div style="text-align:center;padding:50px 16px;max-width:500px;margin:0 auto;">
        <div style="font-size:48px;margin-bottom:16px;">🦖</div>
        <h1 style="font-size:22px;color:#1a1a1a;margin-bottom:30px;">${t.chooseYourLevel}</h1>
        <div style="display:flex;flex-direction:column;gap:10px;">
            ${levels.map(level => `<button class="level-btn" data-level="${level}" style="padding:14px;font-size:18px;border:1px solid #ddd;border-radius:6px;background:#fff;color:#1a1a1a;cursor:pointer;font-weight:600;transition:border-color 0.15s;" onmouseover="this.style.borderColor='#087F5B'" onmouseout="this.style.borderColor='#ddd'">${level}</button>`).join("")}
        </div>
    </div>`;

    queryElements<HTMLButtonElement>(".level-btn").forEach(button => {
        button.onclick = () => {
            const level = button.dataset.level as Level | undefined;
            if (!level) return;
            savePlacementResult(level);
            void showHome();
        };
    });
}