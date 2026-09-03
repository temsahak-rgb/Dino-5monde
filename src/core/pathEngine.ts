/**
 * Learning-path data loader and path-selection state.
 */

const pathsData: Record<string, unknown> = {};
const currentPathData: Record<string, unknown[]> = {};

/** Loads the global path catalog. */
async function loadPaths(): Promise<void> {
    try {
        const response = await fetch("./data/paths.json");
        Object.assign(pathsData, await response.json() as Record<string, unknown>);
        console.log("✅ مسیرها بارگذاری شدند");
    } catch (error) {
        console.error("❌ خطا در بارگذاری مسیرها:", error);
    }
}

/**
 * Loads the lesson index associated with a path.
 */
async function loadPathContent<T = unknown>(pathId: string): Promise<T[] | null> {
    try {
        const response = await fetch(`./data/${pathId}/lessons.json`);
        const data = await response.json() as T[];
        currentPathData[pathId] = data as unknown[];
        console.log(`✅ فهرست درس‌های مسیر ${pathId} بارگذاری شد`);
        return data;
    } catch (error) {
        console.error(`❌ خطا در بارگذاری فهرست ${pathId}:`, error);
        return null;
    }
}

/**
 * Loads a specific flat lesson JSON file from a path.
 */
async function loadSpecificLesson<T>(pathId: string, lessonId: string): Promise<T | null> {
    try {
        const response = await fetch(`./data/${pathId}/lessons/${lessonId}.json`);
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
        }

        const lessonData = await response.json() as T;
        console.log(`✅ محتوای درس ${lessonId} با موفقیت بارگذاری شد`);
        return lessonData;
    } catch (error) {
        console.error(`❌ خطا در بارگذاری محتوای درس ${lessonId}:`, error);
        return null;
    }
}

/** Returns the persisted learning path. */
function getCurrentPath(): PathId {
    return localStorage.getItem("currentPath") || "general";
}

/** Persists a new path and refreshes the home page when valid. */
function switchPath(newPath: string): void {
    if (pathsData[newPath]) {
        localStorage.setItem("currentPath", newPath);
        console.log(`🔄 تغییر مسیر به: ${newPath}`);
        showHome();
        return;
    }

    console.error("❌ مسیر نامعتبر است:", newPath);
}

/** Loads the lesson index associated with the user's current path. */
async function getCurrentPathLessons(): Promise<GrammarLessonIndex[] | unknown[]> {
    const currentPath = getCurrentPath();

    if (currentPath === "general") {
        const level = getPlacementResult() || "A1";
        await loadGrammar(level);
        return getGrammar(level);
    }

    return await loadPathContent(currentPath) ?? [];
}
