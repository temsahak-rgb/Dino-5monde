import type {
    ExerciseAnswer,
    ExerciseQuestion,
    ExerciseSectionInput
} from "../types/global.js";

export {
    checkAnswer,
    getRandomQuestions,
    prepareQuestion
};

/**
 * Exercise preparation and answer-validation utilities shared by grammar,
 * travel, and daily lessons.
 */

/**
 * Selects a randomized subset of questions from an exercise section.
 *
 * @param exerciseSection - Exercise section containing the source questions.
 * @param count - Requested number of questions. Uses displayCount when omitted.
 */
function getRandomQuestions(
    exerciseSection: ExerciseSectionInput | null | undefined,
    count: number | null = null
): ExerciseQuestion[] {
    if (!exerciseSection?.questions) return [];

    const requestedCount = count ?? exerciseSection.displayCount ?? exerciseSection.questions.length;
    const safeCount = Math.min(requestedCount, exerciseSection.questions.length);
    const shuffled = [...exerciseSection.questions];

    for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }

    return shuffled.slice(0, safeCount);
}

/**
 * Shuffles choice options while preserving the semantic correct answer.
 */
function shuffleQuestionOptions(question: ExerciseQuestion): ExerciseQuestion {
    if (question.type !== "mcq" && question.type !== "binary") {
        return question;
    }

    const shuffledOptions = [...question.options];
    const correctOption = question.options[question.correct];

    for (let i = shuffledOptions.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffledOptions[i], shuffledOptions[j]] = [shuffledOptions[j], shuffledOptions[i]];
    }

    return {
        ...question,
        options: shuffledOptions,
        correct: shuffledOptions.indexOf(correctOption)
    };
}

/**
 * Shuffles the source words of an ordering question.
 */
function shuffleWordsForOrdering(question: ExerciseQuestion): ExerciseQuestion {
    if (question.type !== "ordering") {
        return question;
    }

    const shuffledWords = [...question.words];
    for (let i = shuffledWords.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffledWords[i], shuffledWords[j]] = [shuffledWords[j], shuffledWords[i]];
    }

    return {
        ...question,
        words: shuffledWords
    };
}

/**
 * Applies the randomization rules required by a question type.
 */
function prepareQuestion(question: ExerciseQuestion): ExerciseQuestion {
    if (question.type === "mcq" || question.type === "binary") {
        return shuffleQuestionOptions(question);
    }

    if (question.type === "ordering") {
        return shuffleWordsForOrdering(question);
    }

    return question;
}

/**
 * Validates a user answer against a prepared question.
 */
function checkAnswer(question: ExerciseQuestion, userAnswer: ExerciseAnswer): boolean {
    switch (question.type) {
        case "mcq":
        case "binary":
            return typeof userAnswer === "number" && userAnswer === question.correct;

        case "fill_blank":
            return typeof userAnswer === "string"
                && userAnswer.trim().toLowerCase() === question.correct.trim().toLowerCase();

        case "ordering":
            return Array.isArray(userAnswer)
                && userAnswer.length === question.correct.length
                && userAnswer.every((word, index) => word === question.correct[index]);
    }
}
