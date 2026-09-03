/**
 * Grammar catalog loading, progress state, and bookmark persistence.
 */

const grammarData: Partial<
    Record<Level, GrammarLessonIndex[]>
> = {};

/**
 * Loads the grammar catalog for a CEFR level.
 *
 * @param level - CEFR level to load.
 * @returns Loaded grammar lessons, or an empty array on failure.
 */
async function loadGrammar(
    level: Level
): Promise<GrammarLessonIndex[]> {
    try {
        const response = await fetch(
            `./data/grammar-${level}.json`
        );

        if (!response.ok) {
            throw new Error(
                `HTTP ${response.status}`
            );
        }

        const data =
            await response.json()
                as GrammarLessonIndex[];

        grammarData[level] = data;

        return data;
    } catch (error) {
        console.error(
            `Failed to load grammar catalog ${level}:`,
            error
        );

        return [];
    }
}

/**
 * Returns the cached grammar catalog for a CEFR level.
 *
 * @param level - CEFR level.
 * @returns Cached grammar lessons.
 */
function getGrammar(
    level: Level
): GrammarLessonIndex[] {
    return grammarData[level] ?? [];
}

/**
 * Returns grammar lessons explicitly marked as recommended.
 *
 * @param level - CEFR level.
 * @returns Recommended grammar lessons.
 */
function getRecommendedGrammar(
    level: Level
): GrammarLessonIndex[] {
    return getGrammar(level)
        .filter(
            item =>
                item.recommended === true
        );
}

/**
 * Groups cached grammar lessons by their module name.
 *
 * @param level - CEFR level.
 * @returns Grammar modules keyed by module name.
 */
function getGrammarByModule(
    level: Level
): Record<string, GrammarModule> {
    return getGrammar(level)
        .reduce<
            Record<string, GrammarModule>
        >(
            (
                modules,
                item
            ) => {
                modules[item.module] ??= {
                    icon: item.icon,
                    items: []
                };

                modules[item.module]
                    .items
                    .push(item);

                return modules;
            },
            {}
        );
}

/**
 * Returns the persisted learning status of a grammar lesson.
 *
 * @param lessonId - Grammar lesson identifier.
 * @returns Persisted lesson status.
 */
function getLessonStatus(
    lessonId: string
): LessonStatus {
    const progress =
        JSON.parse(
            localStorage.getItem(
                "dino_progress"
            )
            || "{}"
        ) as Record<
            string,
            LessonStatus
        >;

    return progress[lessonId]
        ?? "not_started";
}

/**
 * Persists the learning status of a grammar lesson.
 *
 * @param lessonId - Grammar lesson identifier.
 * @param status - New lesson status.
 */
function setLessonStatus(
    lessonId: string,
    status: LessonStatus
): void {
    const progress =
        JSON.parse(
            localStorage.getItem(
                "dino_progress"
            )
            || "{}"
        ) as Record<
            string,
            LessonStatus
        >;

    progress[lessonId] = status;

    localStorage.setItem(
        "dino_progress",
        JSON.stringify(progress)
    );
}

/**
 * Toggles a grammar lesson bookmark and returns its new state.
 *
 * @param lessonId - Grammar lesson identifier.
 * @returns Whether the lesson is bookmarked after the update.
 */
function toggleBookmark(
    lessonId: string
): boolean {
    let bookmarks =
        JSON.parse(
            localStorage.getItem(
                "dino_bookmarks"
            )
            || "[]"
        ) as string[];

    bookmarks =
        bookmarks.includes(lessonId)
            ? bookmarks.filter(
                id => id !== lessonId
            )
            : [
                ...bookmarks,
                lessonId
            ];

    localStorage.setItem(
        "dino_bookmarks",
        JSON.stringify(bookmarks)
    );

    return bookmarks.includes(
        lessonId
    );
}

/**
 * Returns whether a grammar lesson is bookmarked.
 *
 * @param lessonId - Grammar lesson identifier.
 * @returns True when bookmarked.
 */
function isBookmarked(
    lessonId: string
): boolean {
    const bookmarks =
        JSON.parse(
            localStorage.getItem(
                "dino_bookmarks"
            )
            || "[]"
        ) as string[];

    return bookmarks.includes(
        lessonId
    );
}

/**
 * Returns the compact icon associated with a lesson status.
 *
 * @param status - Lesson progress status.
 * @returns Status icon.
 */
function getStatusIcon(
    status: LessonStatus
): string {
    if (status === "completed") {
        return "✅";
    }

    if (status === "in_progress") {
        return "⏳";
    }

    return "▶️";
}

/**
 * Returns the localized label associated with a lesson status.
 *
 * The optional language parameter is kept temporarily for backward
 * compatibility with callers using the historical function signature.
 * Translation itself now comes exclusively from the central i18n runtime.
 *
 * @param status - Lesson progress status.
 * @param _lang - Deprecated compatibility parameter.
 * @returns Localized status label.
 */
function getStatusText(
    status: LessonStatus,
    _lang?: Language
): string {
    switch (status) {
        case "completed":
            return t(
                "grammar.status.completed"
            );

        case "in_progress":
            return t(
                "grammar.status.inProgress"
            );

        case "not_started":
            return t(
                "grammar.status.notStarted"
            );
    }
}