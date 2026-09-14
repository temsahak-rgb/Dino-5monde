import type {
    LessonStatus
} from "../../types/global.js";

import {
    getAccountScopedStorageKey
} from "../../core/learnerStorage.js";

export {
    getLessonStatus,
    getStatusIcon,
    isBookmarked,
    setLessonStatus,
    toggleBookmark
};

/**
 * Grammar progress state and bookmark persistence.
 */

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
                getAccountScopedStorageKey("dino_progress")
            )
            || "{}"
        ) as Record<
            string,
            LessonStatus
        >;

    return (
        progress[
            lessonId
        ]
        ?? "not_started"
    );
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
                getAccountScopedStorageKey("dino_progress")
            )
            || "{}"
        ) as Record<
            string,
            LessonStatus
        >;

    progress[
        lessonId
    ] = status;

    localStorage.setItem(
        getAccountScopedStorageKey("dino_progress"),
        JSON.stringify(
            progress
        )
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
        bookmarks.includes(
            lessonId
        )
            ? bookmarks.filter(
                id =>
                    id
                    !== lessonId
            )
            : [
                ...bookmarks,
                lessonId
            ];

    localStorage.setItem(
        "dino_bookmarks",
        JSON.stringify(
            bookmarks
        )
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
    if (
        status === "completed"
    ) {
        return "✅";
    }

    if (
        status === "in_progress"
    ) {
        return "⏳";
    }

    return "▶️";
}
