// progressEngine.js

// گرفتن وضعیت یک درس
function getLessonProgress(lessonId) {
    const allProgress = JSON.parse(localStorage.getItem("dino_lessons_progress") || "{}");
    return allProgress[lessonId] || {
        status: "not_started",
        completedSections: [],
        currentSection: 0,
        lastAccessed: null
    };
}

// ذخیره وضعیت یک درس
function saveLessonProgress(lessonId, progress) {
    const allProgress = JSON.parse(localStorage.getItem("dino_lessons_progress") || "{}");
    progress.lastAccessed = new Date().toISOString();
    allProgress[lessonId] = progress;
    localStorage.setItem("dino_lessons_progress", JSON.stringify(allProgress));
}

// علامت‌گذاری یک section به عنوان تکمیل شده
function markSectionCompleted(lessonId, sectionId) {
    const progress = getLessonProgress(lessonId);
    
    if (!progress.completedSections.includes(sectionId)) {
        progress.completedSections.push(sectionId);
    }
    
    progress.status = "in_progress";
    saveLessonProgress(lessonId, progress);
}

// علامت‌گذاری کل درس به عنوان تکمیل شده
function markLessonCompleted(lessonId) {
    const progress = getLessonProgress(lessonId);
    progress.status = "completed";
    saveLessonProgress(lessonId, progress);
}

// ذخیره اشتباهات کاربر
function saveMistake(lessonId, sectionId, questionIndex, userAnswer, correctAnswer) {
    const allMistakes = JSON.parse(localStorage.getItem("dino_mistakes") || "[]");
    
    const mistake = {
        lessonId: lessonId,
        sectionId: sectionId,
        questionIndex: questionIndex,
        userAnswer: userAnswer,
        correctAnswer: correctAnswer,
        timestamp: new Date().toISOString()
    };
    
    allMistakes.push(mistake);
    localStorage.setItem("dino_mistakes", JSON.stringify(allMistakes));
}

// گرفتن اشتباهات یک درس
function getMistakesForLesson(lessonId) {
    const allMistakes = JSON.parse(localStorage.getItem("dino_mistakes") || "[]");
    return allMistakes.filter(m => m.lessonId === lessonId);
}

// گرفتن همه اشتباهات
function getAllMistakes() {
    return JSON.parse(localStorage.getItem("dino_mistakes") || "[]");
}

// پاک کردن اشتباهات یک درس
function clearMistakesForLesson(lessonId) {
    const allMistakes = JSON.parse(localStorage.getItem("dino_mistakes") || "[]");
    const filtered = allMistakes.filter(m => m.lessonId !== lessonId);
    localStorage.setItem("dino_mistakes", JSON.stringify(filtered));
}
