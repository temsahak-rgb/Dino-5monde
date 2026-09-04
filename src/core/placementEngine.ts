import {
    getStaticDataUrl
} from "./staticData.js";

import type {
    Level,
    PlacementLevelEstimate,
    PlacementQuestion,
    PlacementState
} from "../types/global.js";

export {
    answerPlacement,
    getEstimatedLevelRange,
    getNextQuestion,
    getPlacementResult,
    getPlacementState,
    loadPlacementQuestions,
    resetPlacementState,
    savePlacementResult
};

/**
 * Adaptive placement-test state and scoring engine.
 */

const PLACEMENT_MAX_QUESTIONS = 15;
const PLACEMENT_MIN_DIFFICULTY = 8;
const PLACEMENT_MAX_DIFFICULTY = 95;
const PLACEMENT_INITIAL_DIFFICULTY = 25;
const PLACEMENT_DIFFICULTY_STEP = 8;

let placementQuestions:
    PlacementQuestion[] = [];

let currentQuestion:
    PlacementQuestion | null = null;

let placementState:
    PlacementState =
        createInitialPlacementState();

/**
 * Creates the initial adaptive placement state.
 *
 * @returns Fresh placement state.
 */
function createInitialPlacementState():
    PlacementState {
    return {
        asked: [],
        currentDifficulty:
            PLACEMENT_INITIAL_DIFFICULTY,
        correctStreak: 0,
        wrongStreak: 0,
        finished: false,
        finishReason: null
    };
}

/**
 * Loads placement questions from the static data repository.
 */
async function loadPlacementQuestions():
    Promise<void> {
    try {
        const response =
            await fetch(
                getStaticDataUrl(
                    "data/placement.json"
                )
            );

        if (!response.ok) {
            throw new Error(
                `HTTP ${response.status}`
            );
        }

        placementQuestions =
            (
                await response.json()
            ) as PlacementQuestion[];

        console.log(
            `Placement questions loaded: ${placementQuestions.length}`
        );
    } catch (error) {
        placementQuestions = [];

        console.error(
            "Failed to load placement questions:",
            error
        );
    }
}

/**
 * Returns all loaded placement questions.
 *
 * @returns Placement question collection.
 */
function getPlacementQuestions():
    PlacementQuestion[] {
    return placementQuestions;
}

/**
 * Selects the next adaptive placement question.
 *
 * Questions closest to the current estimated difficulty are preferred. One
 * question is then selected randomly among the three closest candidates.
 *
 * @returns Next placement question, or null when the test has finished.
 */
function getNextQuestion():
    PlacementQuestion | null {
    if (
        placementState.finished
    ) {
        return null;
    }

    if (
        placementState.asked.length
        >= PLACEMENT_MAX_QUESTIONS
    ) {
        finishPlacement(
            "max_questions"
        );

        return null;
    }

    const candidates =
        placementQuestions.filter(
            question =>
                !placementState.asked.includes(
                    question.id
                )
        );

    if (
        candidates.length === 0
    ) {
        finishPlacement(
            "no_questions"
        );

        return null;
    }

    candidates.sort(
        (
            first,
            second
        ) =>
            Math.abs(
                first.difficulty
                - placementState.currentDifficulty
            )
            - Math.abs(
                second.difficulty
                - placementState.currentDifficulty
            )
    );

    const topCandidates =
        candidates.slice(
            0,
            Math.min(
                3,
                candidates.length
            )
        );

    const selectedIndex =
        Math.floor(
            Math.random()
            * topCandidates.length
        );

    currentQuestion =
        topCandidates[
            selectedIndex
        ];

    placementState.asked.push(
        currentQuestion.id
    );

    return currentQuestion;
}

/**
 * Updates the adaptive placement state after an answer.
 *
 * `null` corresponds to "I don't know" and intentionally has the same scoring
 * effect as an incorrect answer.
 *
 * @param correct - Whether the answer was correct.
 */
function answerPlacement(
    correct: boolean | null
): void {
    if (
        placementState.finished
    ) {
        return;
    }

    if (
        correct === true
    ) {
        placementState.correctStreak++;
        placementState.wrongStreak = 0;

        placementState.currentDifficulty +=
            PLACEMENT_DIFFICULTY_STEP;
    } else {
        placementState.wrongStreak++;
        placementState.correctStreak = 0;

        placementState.currentDifficulty -=
            PLACEMENT_DIFFICULTY_STEP;
    }

    placementState.currentDifficulty =
        clampPlacementDifficulty(
            placementState.currentDifficulty
        );

    if (
        placementState.currentDifficulty
            <= 16
        && placementState.wrongStreak
            >= 3
    ) {
        finishPlacement(
            "low_difficulty_streak"
        );

        return;
    }

    if (
        placementState.currentDifficulty
            >= 90
        && placementState.correctStreak
            >= 3
    ) {
        finishPlacement(
            "high_difficulty_streak"
        );
    }
}

/**
 * Keeps the adaptive difficulty inside the supported scoring range.
 *
 * @param difficulty - Raw difficulty score.
 * @returns Clamped difficulty score.
 */
function clampPlacementDifficulty(
    difficulty: number
): number {
    return Math.max(
        PLACEMENT_MIN_DIFFICULTY,
        Math.min(
            PLACEMENT_MAX_DIFFICULTY,
            difficulty
        )
    );
}

/**
 * Marks the placement test as finished.
 *
 * @param reason - Internal completion reason.
 */
function finishPlacement(
    reason: string
): void {
    placementState.finished =
        true;

    placementState.finishReason =
        reason;
}

/**
 * Returns the mutable placement state used by the onboarding flow.
 *
 * @returns Current placement state.
 */
function getPlacementState():
    PlacementState {
    return placementState;
}

/**
 * Returns the active placement question.
 *
 * @returns Current question or null.
 */
function getCurrentQuestion():
    PlacementQuestion | null {
    return currentQuestion;
}

/**
 * Maps the adaptive difficulty score to a CEFR estimate.
 *
 * Only language-neutral CEFR codes are returned. Human-readable labels belong
 * to the presentation/i18n layer.
 *
 * @returns Estimated CEFR level and range.
 */
function getEstimatedLevelRange():
    PlacementLevelEstimate {
    const difficulty =
        placementState.currentDifficulty;

    if (
        difficulty >= 90
    ) {
        return {
            level: "C1",
            range: "C1"
        };
    }

    if (
        difficulty >= 75
    ) {
        return {
            level: "B2",
            range: "B2"
        };
    }

    if (
        difficulty >= 60
    ) {
        return {
            level: "B2",
            range: "B1 - B2"
        };
    }

    if (
        difficulty >= 45
    ) {
        return {
            level: "B1",
            range: "B1"
        };
    }

    if (
        difficulty >= 30
    ) {
        return {
            level: "A2",
            range: "A2"
        };
    }

    if (
        difficulty >= 15
    ) {
        return {
            level: "A2",
            range: "A1 - A2"
        };
    }

    return {
        level: "A1",
        range: "A1"
    };
}

/**
 * Resets the placement test to its initial state.
 */
function resetPlacementState():
    void {
    placementState =
        createInitialPlacementState();

    currentQuestion =
        null;
}

/**
 * Persists a placement result and its timestamp.
 *
 * @param level - Estimated or manually selected CEFR level.
 */
function savePlacementResult(
    level: Level
): void {
    localStorage.setItem(
        "placementResult",
        level
    );

    localStorage.setItem(
        "placementDate",
        new Date().toISOString()
    );
}

/**
 * Returns the persisted placement level when valid.
 *
 * @returns Persisted CEFR level or null.
 */
function getPlacementResult():
    Level | null {
    const level =
        localStorage.getItem(
            "placementResult"
        );

    switch (level) {
        case "A1":
        case "A2":
        case "B1":
        case "B2":
        case "C1":
        case "C2":
            return level;

        default:
            return null;
    }
}