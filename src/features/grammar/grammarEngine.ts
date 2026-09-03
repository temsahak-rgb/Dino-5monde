/**
 * Grammar catalog loading, progress state, and bookmark persistence.
 */

const grammarData: Partial<Record<Level, GrammarLessonIndex[]>> = {};

/** Loads the grammar catalog for a CEFR level. */
async function loadGrammar(level: Level): Promise<GrammarLessonIndex[]> {
    try {
        const response = await fetch(`./data/grammar-${level}.json`);
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
        }

        const data = await response.json() as GrammarLessonIndex[];
        grammarData[level] = data;
        return data;
    } catch (error) {
        console.error(`خطا در بارگذاری گرامر ${level}:`, error);
        return [];
    }
}

/** Returns the cached grammar catalog for a CEFR level. */
function getGrammar(level: Level): GrammarLessonIndex[] {
    return grammarData[level] ?? [];
}

/** Returns grammar lessons explicitly marked as recommended. */
function getRecommendedGrammar(level: Level): GrammarLessonIndex[] {
    return getGrammar(level).filter(item => item.recommended === true);
}

/** Groups cached grammar lessons by their module name. */
function getGrammarByModule(level: Level): Record<string, GrammarModule> {
    return getGrammar(level).reduce<Record<string, GrammarModule>>((modules, item) => {
        modules[item.module] ??= {
            icon: item.icon,
            items: []
        };
        modules[item.module].items.push(item);
        return modules;
    }, {});
}

/** Returns the persisted learning status of a grammar lesson. */
function getLessonStatus(lessonId: string): LessonStatus {
    const progress = JSON.parse(localStorage.getItem("dino_progress") || "{}") as Record<string, LessonStatus>;
    return progress[lessonId] ?? "not_started";
}

/** Persists the learning status of a grammar lesson. */
function setLessonStatus(lessonId: string, status: LessonStatus): void {
    const progress = JSON.parse(localStorage.getItem("dino_progress") || "{}") as Record<string, LessonStatus>;
    progress[lessonId] = status;
    localStorage.setItem("dino_progress", JSON.stringify(progress));
}

/** Toggles a grammar lesson bookmark and returns its new state. */
function toggleBookmark(lessonId: string): boolean {
    let bookmarks = JSON.parse(localStorage.getItem("dino_bookmarks") || "[]") as string[];

    bookmarks = bookmarks.includes(lessonId)
        ? bookmarks.filter(id => id !== lessonId)
        : [...bookmarks, lessonId];

    localStorage.setItem("dino_bookmarks", JSON.stringify(bookmarks));
    return bookmarks.includes(lessonId);
}

/** Returns whether a grammar lesson is bookmarked. */
function isBookmarked(lessonId: string): boolean {
    const bookmarks = JSON.parse(localStorage.getItem("dino_bookmarks") || "[]") as string[];
    return bookmarks.includes(lessonId);
}

/** Returns the compact icon associated with a lesson status. */
function getStatusIcon(status: LessonStatus): string {
    if (status === "completed") return "✅";
    if (status === "in_progress") return "⏳";
    return "▶️";
}

/** Returns the localized label associated with a lesson status. */
function getStatusText(status: LessonStatus, lang: Language): string {
    if (status === "completed") return lang === "fa" ? "تمام شده" : "Terminé";
    if (status === "in_progress") return lang === "fa" ? "در حال مطالعه" : "En cours";
    return lang === "fa" ? "شروع نشده" : "Non commencé";
}