import type {
    ExerciseAnswer,
    LessonProgress,
    MistakeRecord
} from "../types/global.js";

export {
    getLessonProgress,
    markSectionCompleted,
    saveMistake
};

/**
 * Local persistence for lesson progress and user mistakes.
 */

/** Returns the persisted progress state of a lesson. */
function getLessonProgress(lessonId: string): LessonProgress {
    const allProgress = JSON.parse(localStorage.getItem("dino_lessons_progress") || "{}") as Record<string, LessonProgress>;
    return allProgress[lessonId] ?? {
        status: "not_started",
        completedSections: [],
        currentSection: 0,
        lastAccessed: null
    };
}

/** Persists a lesson progress record and refreshes its access timestamp. */
function saveLessonProgress(lessonId: string, progress: LessonProgress): void {
    const allProgress = JSON.parse(localStorage.getItem("dino_lessons_progress") || "{}") as Record<string, LessonProgress>;
    progress.lastAccessed = new Date().toISOString();
    allProgress[lessonId] = progress;
    localStorage.setItem("dino_lessons_progress", JSON.stringify(allProgress));
}

/** Marks a section as completed for a lesson. */
function markSectionCompleted(lessonId: string, sectionId: string): void {
    const progress = getLessonProgress(lessonId);
    if (!progress.completedSections.includes(sectionId)) {
        progress.completedSections.push(sectionId);
    }
    progress.status = "in_progress";
    saveLessonProgress(lessonId, progress);
}

/** Marks a complete lesson as finished. */
function markLessonCompleted(lessonId: string): void {
    const progress = getLessonProgress(lessonId);
    progress.status = "completed";
    saveLessonProgress(lessonId, progress);
}

/** Stores an incorrect answer for later review. */
function saveMistake(
    lessonId: string,
    sectionId: string,
    questionIndex: number,
    userAnswer: ExerciseAnswer,
    correctAnswer: number | string | string[]
): void {
    const allMistakes = JSON.parse(localStorage.getItem("dino_mistakes") || "[]") as MistakeRecord[];
    allMistakes.push({
        lessonId,
        sectionId,
        questionIndex,
        userAnswer,
        correctAnswer,
        timestamp: new Date().toISOString()
    });
    localStorage.setItem("dino_mistakes", JSON.stringify(allMistakes));
}

/** Returns mistakes associated with a specific lesson. */
function getMistakesForLesson(lessonId: string): MistakeRecord[] {
    const allMistakes = JSON.parse(localStorage.getItem("dino_mistakes") || "[]") as MistakeRecord[];
    return allMistakes.filter(mistake => mistake.lessonId === lessonId);
}

/** Returns every persisted mistake. */
function getAllMistakes(): MistakeRecord[] {
    return JSON.parse(localStorage.getItem("dino_mistakes") || "[]") as MistakeRecord[];
}

/** Removes every persisted mistake associated with one lesson. */
function clearMistakesForLesson(lessonId: string): void {
    const allMistakes = JSON.parse(localStorage.getItem("dino_mistakes") || "[]") as MistakeRecord[];
    localStorage.setItem(
        "dino_mistakes",
        JSON.stringify(allMistakes.filter(mistake => mistake.lessonId !== lessonId))
    );
}
