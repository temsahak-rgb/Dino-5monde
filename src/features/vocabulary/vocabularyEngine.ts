import type {
    VocabPack,
    VocabStory,
    VocabStoryWithTitle
} from "../../types/global.js";

export { prepareVocabStory };

/**
 * Returns the first non-empty title candidate, normalized for display.
 */
function firstNonEmptyTitle(
    ...candidates: Array<string | undefined>
): string | undefined {
    for (const candidate of candidates) {
        const normalized = candidate?.trim();

        if (normalized) {
            return normalized;
        }
    }

    return undefined;
}

/**
 * Prepares a corpus story for presentation without mutating source data.
 *
 * Story titles are optional in the corpus. The returned presentation model
 * always carries a real title so template interpolation can never display
 * the JavaScript value `undefined`.
 *
 * @param pack - Vocabulary pack owning the story.
 * @param story - Raw corpus story.
 * @returns Immutable story model with a guaranteed title.
 */
function prepareVocabStory(
    pack: VocabPack,
    story: VocabStory
): VocabStoryWithTitle {
    const title =
        firstNonEmptyTitle(
            story.title,
            pack.title,
            pack.theme,
            pack.id
        )
        ?? pack.id;

    const persianTitle =
        firstNonEmptyTitle(
            story.title_fa,
            pack.title_fa,
            pack.theme_fa
        );

    return {
        ...story,
        title,
        title_fa: persianTitle
    };
}
