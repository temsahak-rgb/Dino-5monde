/**
 * Adaptive placement-test state and scoring engine.
 */

let placementQuestions: PlacementQuestion[] = [];
let currentQuestion: PlacementQuestion | null = null;

let placementState: PlacementState = {
    asked: [],
    currentDifficulty: 25,
    correctStreak: 0,
    wrongStreak: 0,
    finished: false,
    finishReason: null
};

/** Loads placement questions from the static data repository. */
async function loadPlacementQuestions(): Promise<void> {
    try {
        const response = await fetch("./data/placement.json");
        placementQuestions = await response.json() as PlacementQuestion[];
        console.log("✅ سوالات بارگذاری شدند:", placementQuestions.length);
    } catch (error) {
        console.error("❌ خطا:", error);
    }
}

/** Returns all loaded placement questions. */
function getPlacementQuestions(): PlacementQuestion[] {
    return placementQuestions;
}

/** Selects the next adaptive placement question. */
function getNextQuestion(): PlacementQuestion | null {
    if (placementState.finished) return null;

    if (placementState.asked.length >= 15) {
        placementState.finished = true;
        return null;
    }

    const candidates = placementQuestions.filter(question => !placementState.asked.includes(question.id));
    if (candidates.length === 0) {
        placementState.finished = true;
        return null;
    }

    candidates.sort(
        (a, b) => Math.abs(a.difficulty - placementState.currentDifficulty)
            - Math.abs(b.difficulty - placementState.currentDifficulty)
    );

    const topCandidates = candidates.slice(0, Math.min(3, candidates.length));
    currentQuestion = topCandidates[Math.floor(Math.random() * topCandidates.length)];
    placementState.asked.push(currentQuestion.id);
    return currentQuestion;
}

/** Updates adaptive placement state after an answer. */
function answerPlacement(correct: boolean | null): void {
    if (correct) {
        placementState.correctStreak++;
        placementState.wrongStreak = 0;
        placementState.currentDifficulty += 8;
    } else {
        placementState.wrongStreak++;
        placementState.correctStreak = 0;
        placementState.currentDifficulty -= 8;
    }

    placementState.currentDifficulty = Math.max(8, Math.min(95, placementState.currentDifficulty));

    if (placementState.currentDifficulty <= 16 && placementState.wrongStreak >= 3) {
        placementState.finished = true;
    }
    if (placementState.currentDifficulty >= 90 && placementState.correctStreak >= 3) {
        placementState.finished = true;
    }
}

/** Returns the mutable placement state used by the onboarding UI. */
function getPlacementState(): PlacementState {
    return placementState;
}

/** Returns the active placement question. */
function getCurrentQuestion(): PlacementQuestion | null {
    return currentQuestion;
}

/** Maps the adaptive difficulty score to a user-facing CEFR estimate. */
function getEstimatedLevelRange(): PlacementLevelEstimate {
    const difficulty = placementState.currentDifficulty;
    if (difficulty >= 90) return { level: "C1", range: "C1 - Autonome" };
    if (difficulty >= 75) return { level: "B2", range: "B2 - Avancé" };
    if (difficulty >= 60) return { level: "B2", range: "B1 - B2" };
    if (difficulty >= 45) return { level: "B1", range: "B1 - Intermédiaire" };
    if (difficulty >= 30) return { level: "A2", range: "A2 - Élémentaire" };
    if (difficulty >= 15) return { level: "A2", range: "A1 - A2" };
    return { level: "A1", range: "A1 - Débutant" };
}

/** Resets the placement test to its initial state. */
function resetPlacementState(): void {
    placementState = {
        asked: [],
        currentDifficulty: 25,
        correctStreak: 0,
        wrongStreak: 0,
        finished: false,
        finishReason: null
    };
    currentQuestion = null;
}

/** Persists a placement result and its timestamp. */
function savePlacementResult(level: Level): void {
    localStorage.setItem("placementResult", level);
    localStorage.setItem("placementDate", new Date().toISOString());
}

/** Returns the persisted placement level when valid. */
function getPlacementResult(): Level | null {
    const level = localStorage.getItem("placementResult");
    return level === "A1" || level === "A2" || level === "B1" || level === "B2" || level === "C1" || level === "C2"
        ? level
        : null;
}