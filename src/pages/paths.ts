/**
 * Daily-path placeholders and the shared exercise presentation flow.
 */

/** Displays the Daily French placeholder page. */
async function showDailyHome(): Promise<void> {
    const lang = getLanguage();
    let html = renderNavbar();
    html += `<div style="max-width:900px;margin:0 auto;padding:24px 16px 50px;">
        <h1 style="font-size:22px;font-weight:700;color:#1a1a1a;margin:0 0 4px;">${lang === "fa" ? "🏘️ فرانسوی روزمره" : "🏘️ Français quotidien"}</h1>
        <p style="font-size:13px;color:#777;margin:0 0 30px;">${lang === "fa" ? "برای زندگی در فرانسه" : "Pour vivre en France"}</p>
        <p style="font-size:14px;color:#777;text-align:center;padding:40px 0;">🏗️🦖 ${lang === "fa" ? "دایناسورها مشغول ساخت این بخش هستند!" : "Les dinosaures sont au travail !"}</p>
    </div>`;
    app.innerHTML = html;
}

/** Loads and displays the first instructional section of a Daily lesson. */
async function showDailyLesson(lessonId: string): Promise<void> {
    app.innerHTML = renderNavbar() + `<div style="text-align:center;padding:60px 16px;"><p style="font-size:14px;color:#777;">⏳ ...</p></div>`;

    const lessonData = await loadSpecificLesson<LessonData>("daily", lessonId);
    if (!lessonData) {
        app.innerHTML = renderNavbar() + `<div style="text-align:center;padding:60px 16px;"><p style="font-size:14px;color:#777;">🚧 به زودی</p><button onclick="showHome()" style="margin-top:15px;padding:10px 20px;border:1px solid #ddd;border-radius:6px;background:#fff;color:#1a1a1a;cursor:pointer;">بازگشت</button></div>`;
        return;
    }

    const firstLessonSection = lessonData.sections.find(
        (section): section is LessonContentSection => section.type === "lesson"
    );

    if (firstLessonSection) {
        showLessonContent(lessonId, firstLessonSection);
    }
}

/**
 * Displays an exercise section and manages question-by-question interaction.
 *
 * @param lessonId - Parent lesson identifier.
 * @param section - Exercise or quiz section to render.
 * @param onBack - Optional callback used by non-grammar flows.
 */
function showExerciseContent(
    lessonId: string,
    section: ExerciseSectionInput,
    onBack: BackHandler | null = null
): void {
    const lang = getLanguage();
    const t = texts[lang];
    const title = (lang === "fa" ? section.title_fa || section.title : section.title || section.title_fa)
        || (lang === "fa" ? "تمرین" : "Exercice");
    const questions = getRandomQuestions(section, section.displayCount ?? null);
    const goBack: BackHandler = onBack || (() => showGrammarLesson(lessonId));

    let currentQuestionIndex = 0;
    let correctCount = 0;

    /** Renders and wires the active question. */
    function showCurrentQuestion(): void {
        if (currentQuestionIndex >= questions.length) {
            showExerciseResult(lessonId, section, correctCount, questions.length, goBack);
            return;
        }

        const question = prepareQuestion(questions[currentQuestionIndex]);
        let html = renderNavbar();
        html += `<div style="max-width:900px;margin:0 auto;padding:24px 16px 50px;">
            <button id="back" class="back-btn">← ${t.back}</button>
            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px;">
                <span style="font-size:13px;color:#777;">${currentQuestionIndex + 1} / ${questions.length}</span>
            </div>
            <div style="background:#e0e0e0;height:4px;border-radius:2px;margin-bottom:25px;overflow:hidden;">
                <div style="background:#087F5B;height:100%;width:${((currentQuestionIndex + 1) / Math.max(questions.length, 1)) * 100}%;transition:width 0.3s;border-radius:2px;"></div>
            </div>
            <h2 class="${lang === "fa" ? "persian-text" : "ltr-lock"}" style="font-size:18px;margin-bottom:10px;color:#1a1a1a;">${title}</h2>
            <p class="ltr-lock" style="font-size:17px;line-height:1.6;color:#1a1a1a;margin-bottom:25px;font-weight:500;">${question.question}</p>
            <div id="options-container" style="display:flex;flex-direction:column;gap:10px;">`;

        if (question.type === "mcq" || question.type === "binary") {
            question.options.forEach((option, index) => {
                html += `<button class="option-btn ltr-lock" data-index="${index}" style="width:100%;padding:14px;font-size:15px;border:1px solid #e0e0e0;border-radius:6px;background:#fafafa;color:#1a1a1a;cursor:pointer;text-align:left;transition:all 0.15s;font-weight:500;">${option}</button>`;
            });
        } else {
            html += `<p style="color:#777;">${lang === "fa" ? "این نوع سؤال هنوز در رابط کاربری پشتیبانی نمی‌شود." : "Ce type de question n'est pas encore pris en charge dans l'interface."}</p>`;
        }

        html += `</div><div id="feedback" style="margin-top:20px;min-height:60px;"></div></div>`;
        app.innerHTML = html;

        getRequiredElement<HTMLButtonElement>("back").onclick = () => { void goBack(); };

        if (question.type !== "mcq" && question.type !== "binary") {
            return;
        }

        const optionButtons = queryElements<HTMLButtonElement>(".option-btn");
        optionButtons.forEach(button => {
            button.onclick = () => {
                const selectedIndex = Number.parseInt(button.dataset.index || "-1", 10);
                const correct = checkAnswer(question, selectedIndex);

                if (correct) {
                    correctCount++;
                } else {
                    saveMistake(
                        lessonId,
                        section.id,
                        currentQuestionIndex,
                        selectedIndex,
                        question.correct
                    );
                }

                const feedback = getRequiredElement<HTMLElement>("feedback");
                if (correct) {
                    button.style.background = "#d4edda";
                    button.style.borderColor = "#28a745";
                    button.style.color = "#155724";
                    feedback.innerHTML = `<div style="background:#d4edda;padding:14px;border-radius:6px;color:#155724;border:1px solid #c3e6cb;"><p style="margin:0;font-weight:700;font-size:15px;">✅ ${lang === "fa" ? "آفرین!" : "Bravo!"}</p><p class="persian-text" style="margin:8px 0 0;font-size:13px;">${renderMarkdown(question.explanation)}</p></div>`;
                } else {
                    button.style.background = "#f8d7da";
                    button.style.borderColor = "#dc3545";
                    button.style.color = "#721c24";

                    const correctButton = optionButtons[question.correct];
                    if (correctButton) {
                        correctButton.style.background = "#d4edda";
                        correctButton.style.borderColor = "#28a745";
                        correctButton.style.color = "#155724";
                    }

                    feedback.innerHTML = `<div style="background:#f8d7da;padding:14px;border-radius:6px;color:#721c24;border:1px solid #f5c6cb;"><p style="margin:0;font-weight:700;font-size:15px;">❌ ${lang === "fa" ? "اشتباه!" : "Incorrect!"}</p><p class="persian-text" style="margin:8px 0 0;font-size:13px;">${renderMarkdown(question.explanation)}</p></div>`;
                }

                optionButtons.forEach(candidate => {
                    candidate.onclick = null;
                    candidate.style.cursor = "default";
                });

                feedback.innerHTML += `<button id="next-btn" style="width:100%;margin-top:12px;padding:12px;font-size:15px;font-weight:700;border:none;border-radius:6px;background:#087F5B;color:#fff;cursor:pointer;">${lang === "fa" ? "سوال بعدی" : "Question suivante"}</button>`;
                getRequiredElement<HTMLButtonElement>("next-btn").onclick = () => {
                    currentQuestionIndex++;
                    showCurrentQuestion();
                };
            };
        });
    }

    showCurrentQuestion();
}

/** Displays the final score of an exercise section. */
function showExerciseResult(
    lessonId: string,
    section: ExerciseSectionInput,
    correctCount: number,
    totalCount: number,
    onBack: BackHandler | null = null
): void {
    const lang = getLanguage();
    const percentage = totalCount > 0 ? Math.round((correctCount / totalCount) * 100) : 0;
    const goBack: BackHandler = onBack || (() => showGrammarLesson(lessonId));

    markSectionCompleted(lessonId, section.id);

    let emoji = "🎉";
    let message = lang === "fa" ? "عالی بود!" : "Excellent!";
    if (percentage < 50) {
        emoji = "💪";
        message = lang === "fa" ? "تلاش بیشتر!" : "Plus d'effort!";
    } else if (percentage < 80) {
        emoji = "👍";
        message = lang === "fa" ? "خوب بود!" : "Bien!";
    }

    app.innerHTML = renderNavbar() + `<div style="max-width:500px;margin:0 auto;padding:50px 16px;text-align:center;">
        <div style="font-size:48px;margin-bottom:16px;">${emoji}</div>
        <h1 style="font-size:24px;color:#1a1a1a;margin-bottom:10px;">${message}</h1>
        <p style="font-size:36px;font-weight:800;color:#087F5B;margin:15px 0;">${correctCount}/${totalCount}</p>
        <p style="font-size:16px;color:#777;margin-bottom:30px;">${percentage}%</p>
        <button id="exercise-return-btn" style="width:100%;padding:14px;font-size:15px;font-weight:700;border:none;border-radius:6px;background:#087F5B;color:#fff;cursor:pointer;">${lang === "fa" ? "بازگشت به درس" : "Retour à la leçon"}</button>
    </div>`;

    getRequiredElement<HTMLButtonElement>("exercise-return-btn").onclick = () => { void goBack(); };
}