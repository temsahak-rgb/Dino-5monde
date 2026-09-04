export {
    loadSpecificLesson
};

/**
 * Loads educational content addressed by learning path and lesson identifier.
 */

/**
 * Loads a specific flat lesson JSON file from a learning path.
 *
 * @param pathId - Learning-path identifier.
 * @param lessonId - Lesson identifier.
 * @returns Loaded lesson, or null when unavailable.
 */
async function loadSpecificLesson<T>(
    pathId: string,
    lessonId: string
): Promise<T | null> {
    try {
        const response =
            await fetch(
                `./data/${pathId}/lessons/${lessonId}.json`
            );

        if (!response.ok) {
            throw new Error(
                `HTTP ${response.status}`
            );
        }

        const lessonData = (await response.json()) as T;

        console.log(
            `Learning-path lesson loaded: ${pathId}/${lessonId}`
        );

        return lessonData;
    } catch (error) {
        console.error(
            `Failed to load learning-path lesson: ${pathId}/${lessonId}`,
            error
        );

        return null;
    }
}
