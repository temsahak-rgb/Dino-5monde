import type {
    ExerciseSection,
    LessonContentSection,
    LessonData,
    LessonSection,
    Level
} from "../types/global.js";

export {
    getSection,
    loadLessonWithExercises
};

/**
 * Grammar lesson loader with automatic exercise and quiz discovery.
 */

const lessonsCache:
    Record<string, LessonData> = {};

const exercisesCache:
    Record<string, ExerciseSection> = {};

/**
 * Loads a lesson and appends every sequential exercise and the optional final
 * quiz.
 *
 * Results are cached by lesson id for the current browser session.
 *
 * Exercise discovery follows:
 *
 * - `{lessonId}-ex1`
 * - `{lessonId}-ex2`
 * - ...
 * - `{lessonId}-quiz`
 *
 * The first missing sequential exercise stops exercise discovery. The final
 * quiz remains optional.
 *
 * @param level - Lesson CEFR level.
 * @param lessonId - Lesson identifier.
 * @returns Complete lesson including discovered exercises, or null on failure.
 */
async function loadLessonWithExercises(
    level: Level,
    lessonId: string
): Promise<LessonData | null> {
    const cached =
        lessonsCache[
            lessonId
        ];

    if (cached) {
        return cached;
    }

    try {
        const lessonResponse =
            await fetch(
                `./data/lessons/${level}/${lessonId}.json`
            );

        if (!lessonResponse.ok) {
            throw new Error(
                `Lesson file not found: ${level}/${lessonId}`
            );
        }

        const lessonData =
            (await lessonResponse.json()) as LessonData;

        const exercises:
            ExerciseSection[] = [];

        let exerciseIndex = 1;
        let keepLooking = true;

        while (
            keepLooking
        ) {
            const exerciseId =
                `${lessonId}-ex${exerciseIndex}`;

            try {
                const response =
                    await fetch(
                        `./data/exercises/${level}/${exerciseId}.json`
                    );

                if (!response.ok) {
                    keepLooking = false;
                    continue;
                }

                const exercise =
                    (await response.json()) as ExerciseSection;

                exercises.push(
                    exercise
                );

                exercisesCache[
                    exerciseId
                ] = exercise;

                exerciseIndex++;
            } catch {
                /*
                 * Exercises are sequential. Failure to load one terminates
                 * discovery of additional numbered exercises.
                 */
                keepLooking = false;
            }
        }

        const quiz =
            await loadOptionalLessonQuiz(
                level,
                lessonId
            );

        if (quiz) {
            exercises.push(
                quiz
            );
        }

        lessonData.sections = [
            ...lessonData.sections,
            ...exercises
        ];

        lessonsCache[
            lessonId
        ] = lessonData;

        console.log(
            `Lesson loaded: ${lessonId} (${exercises.length} exercise/quiz section(s)).`
        );

        return lessonData;
    } catch (error) {
        console.error(
            `Failed to load lesson: ${lessonId}`,
            error
        );

        return null;
    }
}

/**
 * Loads the optional final quiz associated with a lesson.
 *
 * @param level - Lesson CEFR level.
 * @param lessonId - Parent lesson identifier.
 * @returns Quiz section or null when no final quiz exists.
 */
async function loadOptionalLessonQuiz(
    level: Level,
    lessonId: string
): Promise<ExerciseSection | null> {
    const quizId =
        `${lessonId}-quiz`;

    try {
        const response =
            await fetch(
                `./data/exercises/${level}/${quizId}.json`
            );

        if (!response.ok) {
            return null;
        }

        const quiz =
            (await response.json()) as ExerciseSection;

        exercisesCache[
            quizId
        ] = quiz;

        return quiz;
    } catch {
        /*
         * A final quiz is optional and must never prevent the lesson itself
         * from loading.
         */
        return null;
    }
}

/**
 * Returns a cached lesson.
 *
 * @param lessonId - Lesson identifier.
 * @returns Cached lesson or null when it has not been loaded.
 */
function getLesson(
    lessonId: string
): LessonData | null {
    return (
        lessonsCache[
            lessonId
        ]
        ?? null
    );
}

/**
 * Returns sections matching a specific section type.
 *
 * @param lessonData - Lesson data.
 * @param type - Requested section type.
 * @returns Matching sections.
 */
function getSectionsByType(
    lessonData: LessonData | null,
    type: LessonSection["type"]
): LessonSection[] {
    if (
        !lessonData?.sections
    ) {
        return [];
    }

    return lessonData.sections.filter(
        section =>
            section.type
            === type
    );
}

/**
 * Returns only instructional sections from a lesson.
 *
 * @param lessonData - Lesson data.
 * @returns Instructional sections.
 */
function getLessons(
    lessonData: LessonData | null
): LessonContentSection[] {
    if (
        !lessonData?.sections
    ) {
        return [];
    }

    return lessonData.sections.filter(
        (
            section
        ): section is LessonContentSection =>
            section.type
            === "lesson"
    );
}

/**
 * Returns exercise sections, excluding the final quiz.
 *
 * @param lessonData - Lesson data.
 * @returns Exercise sections.
 */
function getExercises(
    lessonData: LessonData | null
): ExerciseSection[] {
    if (
        !lessonData?.sections
    ) {
        return [];
    }

    return lessonData.sections.filter(
        (
            section
        ): section is ExerciseSection =>
            section.type
            === "exercise"
    );
}

/**
 * Returns the first quiz section when present.
 *
 * @param lessonData - Lesson data.
 * @returns Quiz section or null.
 */
function getQuiz(
    lessonData: LessonData | null
): ExerciseSection | null {
    if (
        !lessonData?.sections
    ) {
        return null;
    }

    return (
        lessonData.sections.find(
            (
                section
            ): section is ExerciseSection =>
                section.type
                === "quiz"
        )
        ?? null
    );
}

/**
 * Returns one lesson section by identifier.
 *
 * @param lessonData - Lesson data.
 * @param sectionId - Section identifier.
 * @returns Matching section or null.
 */
function getSection(
    lessonData: LessonData | null,
    sectionId: string
): LessonSection | null {
    return (
        lessonData?.sections.find(
            section =>
                section.id
                === sectionId
        )
        ?? null
    );
}
