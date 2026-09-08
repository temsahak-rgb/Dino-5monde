import type {
    LearnerLessonProgressRow,
    LessonProgressContentType
} from "./database.types.js";

import type {
    DinoBackendClient
} from "./supabaseClient.js";

import type {
    LessonProgress
} from "../../types/global.js";

type RemoteLessonProgress = Pick<
    LearnerLessonProgressRow,
    | "completed_sections"
    | "content_type"
    | "current_section"
    | "last_accessed"
    | "lesson_id"
    | "status"
    | "updated_at"
>;

const lessonProgressProjection =
    "content_type,lesson_id,status,completed_sections,current_section,last_accessed,updated_at";

async function loadRemoteLessonProgress(
    client: DinoBackendClient,
    userId: string
): Promise<RemoteLessonProgress[]> {
    const { data, error } = await client
        .from("learner_lesson_progress")
        .select(lessonProgressProjection)
        .eq("user_id", userId)
        .order("last_accessed", { ascending: false });

    if (error) {
        throw error;
    }

    return data;
}

async function syncRemoteLessonProgress(
    client: DinoBackendClient,
    contentType: LessonProgressContentType,
    lessonId: string,
    progress: LessonProgress
): Promise<RemoteLessonProgress> {
    assertProgress(contentType, lessonId, progress);

    const { data, error } = await client.rpc(
        "sync_lesson_progress",
        {
            p_completed_sections: progress.completedSections,
            p_content_type: contentType,
            p_current_section: progress.currentSection,
            p_last_accessed: progress.lastAccessed as string,
            p_lesson_id: lessonId,
            p_status: progress.status
        }
    );

    if (error) {
        throw error;
    }

    const result = data[0];

    if (!result) {
        throw new Error("Lesson progress synchronization returned no result");
    }

    return result;
}

function toLocalLessonProgress(
    remote: RemoteLessonProgress
): LessonProgress {
    return {
        completedSections: [...remote.completed_sections],
        currentSection: remote.current_section,
        lastAccessed: remote.last_accessed,
        status: remote.status
    };
}

function assertProgress(
    contentType: LessonProgressContentType,
    lessonId: string,
    progress: LessonProgress
): void {
    if (
        (contentType !== "grammar" && contentType !== "travel")
        || !lessonId
        || lessonId.trim() !== lessonId
        || lessonId.length > 160
        || !progress.lastAccessed
        || !Number.isFinite(Date.parse(progress.lastAccessed))
        || !Number.isInteger(progress.currentSection)
        || progress.currentSection < 0
        || progress.currentSection > 10000
        || ![
            "not_started",
            "in_progress",
            "completed"
        ].includes(progress.status)
        || progress.completedSections.length > 500
        || progress.completedSections.some(section =>
            !section
            || section.trim() !== section
            || section.length > 160
        )
    ) {
        throw new TypeError("Invalid lesson progress");
    }
}

export {
    loadRemoteLessonProgress,
    syncRemoteLessonProgress,
    toLocalLessonProgress
};

export type {
    RemoteLessonProgress
};
