// lessonEngine.js

let lessonsCache = {};
let exercisesCache = {}; // کش جدید برای ذخیره تمرین‌ها

// ==========================================
// تابع اصلی: بارگذاری درس + تمام تمرین‌های مرتبط
// ==========================================
async function loadLessonWithExercises(level, lessonId) {
    // ۱. چک کردن کش (اگر قبلاً لود شده، سریع برگردان)
    if (lessonsCache[lessonId]) {
        return lessonsCache[lessonId];
    }

    try {
        // ۲. بارگذاری فایل اصلی درسنامه
        const lessonResponse = await fetch(`./data/lessons/${level}/${lessonId}.json`);
        if (!lessonResponse.ok) throw new Error("Lesson file not found");
        const lessonData = await lessonResponse.json();
        
        const exercises = [];
        let exIndex = 1;
        let keepLooking = true;

        // ۳. جستجوی خودکار فایل‌های تمرین (ex1, ex2, ex3, ...)
        while (keepLooking) {
            try {
                const exId = `${lessonId}-ex${exIndex}`;
                const exResponse = await fetch(`./data/exercises/${level}/${exId}.json`);
                
                if (exResponse.ok) {
                    const exData = await exResponse.json();
                    exercises.push(exData);
                    exercisesCache[exId] = exData; // ذخیره در کش
                    exIndex++; // برو سراغ فایل بعدی (ex2, ex3, ...)
                } else {
                    // اگر فایل ex بعدی وجود نداشت (مثلاً 404)، جستجو را متوقف کن
                    keepLooking = false;
                }
            } catch (error) {
                keepLooking = false;
            }
        }

        // ۴. جستجوی فایل آزمون پایانی (quiz)
        try {
            const quizId = `${lessonId}-quiz`;
            const quizResponse = await fetch(`./data/exercises/${level}/${quizId}.json`);
            if (quizResponse.ok) {
                const quizData = await quizResponse.json();
                exercises.push(quizData);
                exercisesCache[quizId] = quizData;
            }
        } catch (error) {
            // اگر فایل quiz وجود نداشت، اشکالی ندارد (نادیده گرفته می‌شود)
        }

        // ۵. ترکیب درسنامه و تمرین‌ها در یک آرایه واحد
        // تمرین‌ها دقیقاً به ترتیبی که پیدا شدند (ex1, ex2, ..., quiz) به انتهای sections اضافه می‌شوند
        lessonData.sections = [
            ...lessonData.sections,
            ...exercises
        ];

        // ۶. ذخیره نهایی در کش و بازگشت
        lessonsCache[lessonId] = lessonData;
        console.log(`✅ درس ${lessonId} به همراه ${exercises.length} بخش تمرین/آزمون بارگذاری شد`);
        return lessonData;

    } catch (error) {
        console.error(`❌ خطا در بارگذاری درس ${lessonId}:`, error);
        return null;
    }
}

// ==========================================
// توابع کمکی (بدون تغییر، همان‌طور که بودند)
// ==========================================

function getLesson(lessonId) {
    return lessonsCache[lessonId] || null;
}

function getSectionsByType(lessonData, type) {
    if (!lessonData || !lessonData.sections) return [];
    return lessonData.sections.filter(section => section.type === type);
}

function getLessons(lessonData) {
    return getSectionsByType(lessonData, "lesson");
}

function getExercises(lessonData) {
    return getSectionsByType(lessonData, "exercise");
}

function getQuiz(lessonData) {
    const quizzes = getSectionsByType(lessonData, "quiz");
    return quizzes.length > 0 ? quizzes[0] : null;
}

function getSection(lessonData, sectionId) {
    if (!lessonData || !lessonData.sections) return null;
    return lessonData.sections.find(s => s.id === sectionId);
}
