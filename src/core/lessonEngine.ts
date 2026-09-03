/**
 * Grammar lesson loader with automatic exercise and quiz discovery.
 */

const lessonsCache: Record<string, LessonData> = {};
const exercisesCache: Record<string, ExerciseSection> = {};

/**
 * Loads a lesson and appends every sequential exercise and optional final quiz.
 * Results are cached by lesson id for the current browser session.
 */
async function loadLessonWithExercises(level: Level, lessonId: string): Promise<LessonData | null> {
    if (lessonsCache[lessonId]) {
        return lessonsCache[lessonId];
    }

    try {
        const lessonResponse = await fetch(`./data/lessons/${level}/${lessonId}.json`);
        if (!lessonResponse.ok) throw new Error("Lesson file not found");

        const lessonData = await lessonResponse.json() as LessonData;
        const exercises: ExerciseSection[] = [];
        let exIndex = 1;
        let keepLooking = true;

        while (keepLooking) {
            try {
                const exId = `${lessonId}-ex${exIndex}`;
                const exResponse = await fetch(`./data/exercises/${level}/${exId}.json`);

                if (!exResponse.ok) {
                    keepLooking = false;
                    continue;
                }

                const exData = await exResponse.json() as ExerciseSection;
                exercises.push(exData);
                exercisesCache[exId] = exData;
                exIndex++;
            } catch {
                keepLooking = false;
            }
        }

        try {
            const quizId = `${lessonId}-quiz`;
            const quizResponse = await fetch(`./data/exercises/${level}/${quizId}.json`);
            if (quizResponse.ok) {
                const quizData = await quizResponse.json() as ExerciseSection;
                exercises.push(quizData);
                exercisesCache[quizId] = quizData;
            }
        } catch {
            // A final quiz is optional.
        }

        lessonData.sections = [...lessonData.sections, ...exercises];
        lessonsCache[lessonId] = lessonData;

        console.log(`✅ درس ${lessonId} به همراه ${exercises.length} بخش تمرین/آزمون بارگذاری شد`);
        return lessonData;
    } catch (error) {
        console.error(`❌ خطا در بارگذاری درس ${lessonId}:`, error);
        return null;
    }
}

/** Returns a cached lesson, or null when it has not been loaded yet. */
function getLesson(lessonId: string): LessonData | null {
    return lessonsCache[lessonId] ?? null;
}

/** Returns sections matching a specific section type. */
function getSectionsByType(lessonData: LessonData | null, type: LessonSection["type"]): LessonSection[] {
    if (!lessonData?.sections) return [];
    return lessonData.sections.filter(section => section.type === type);
}

/** Returns only instructional sections from a lesson. */
function getLessons(lessonData: LessonData | null): LessonContentSection[] {
    if (!lessonData?.sections) return [];
    return lessonData.sections.filter((section): section is LessonContentSection => section.type === "lesson");
}

/** Returns exercise sections, excluding the final quiz. */
function getExercises(lessonData: LessonData | null): ExerciseSection[] {
    if (!lessonData?.sections) return [];
    return lessonData.sections.filter((section): section is ExerciseSection => section.type === "exercise");
}

/** Returns the first quiz section, when present. */
function getQuiz(lessonData: LessonData | null): ExerciseSection | null {
    if (!lessonData?.sections) return null;
    return lessonData.sections.find((section): section is ExerciseSection => section.type === "quiz") ?? null;
}

/** Returns a section by id. */
function getSection(lessonData: LessonData | null, sectionId: string): LessonSection | null {
    return lessonData?.sections.find(section => section.id === sectionId) ?? null;
}
