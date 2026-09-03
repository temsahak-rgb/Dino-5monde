/**
 * Learning-path data loader and path-selection state.
 */

const pathsData:
    Record<string, unknown> = {};

const currentPathData:
    Record<string, unknown[]> = {};

/**
 * Loads the global learning-path catalog.
 */
async function loadPaths(): Promise<void> {
    try {
        const response =
            await fetch(
                "./data/paths.json"
            );

        if (!response.ok) {
            throw new Error(
                `HTTP ${response.status}`
            );
        }

        const data = (await response.json()) as Record<string, unknown>;

        Object.assign(
            pathsData,
            data
        );

        console.log(
            "Learning paths loaded."
        );
    } catch (error) {
        console.error(
            "Failed to load learning paths:",
            error
        );
    }
}

/**
 * Loads the lesson index associated with a learning path.
 *
 * @param pathId - Learning-path identifier.
 * @returns Loaded path content, or null when unavailable.
 */
async function loadPathContent<
    T = unknown
>(
    pathId: string
): Promise<T[] | null> {
    try {
        const response =
            await fetch(
                `./data/${pathId}/lessons.json`
            );

        if (!response.ok) {
            throw new Error(
                `HTTP ${response.status}`
            );
        }

        const data = (await response.json()) as T[];

        currentPathData[pathId] =
            data as unknown[];

        console.log(
            `Learning-path index loaded: ${pathId}`
        );

        return data;
    } catch (error) {
        console.error(
            `Failed to load learning-path index: ${pathId}`,
            error
        );

        return null;
    }
}

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

/**
 * Returns the persisted learning path.
 *
 * @returns Current path, defaulting to General.
 */
function getCurrentPath(): PathId {
    return (
        localStorage.getItem(
            "currentPath"
        )
        || "general"
    );
}

/**
 * Persists another learning path and refreshes the Home page when the path is
 * present in the loaded path catalog.
 *
 * @param newPath - Destination learning-path identifier.
 */
function switchPath(
    newPath: string
): void {
    if (
        pathsData[newPath]
    ) {
        localStorage.setItem(
            "currentPath",
            newPath
        );

        console.log(
            `Learning path changed: ${newPath}`
        );

        void showHome();

        return;
    }

    console.error(
        `Unknown learning path: ${newPath}`
    );
}

/**
 * Loads the lesson index associated with the learner's current path.
 *
 * General French uses the level-based Grammar catalog. Other learning paths
 * use their dedicated lesson index.
 *
 * @returns Current-path lessons.
 */
async function getCurrentPathLessons(): Promise<
    GrammarLessonIndex[]
    | unknown[]
> {
    const currentPath =
        getCurrentPath();

    if (
        currentPath === "general"
    ) {
        const level =
            getPlacementResult()
            || "A1";

        await loadGrammar(
            level
        );

        return getGrammar(
            level
        );
    }

    return (
        await loadPathContent(
            currentPath
        )
        ?? []
    );
}