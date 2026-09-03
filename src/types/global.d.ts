/**
 * Shared application data contracts used by classic browser scripts.
 *
 * These declarations intentionally stay global until the application moves to
 * ES modules in a later architectural change.
 */

type Language =
    | "fr"
    | "fa";

type Level =
    | "A1"
    | "A2"
    | "B1"
    | "B2"
    | "C1"
    | "C2";

type AppSection =
    | "home"
    | "grammar"
    | "vocabulary"
    | "daily"
    | "travel"
    | "games"
    | "exercises"
    | "profile";

type LessonStatus =
    | "not_started"
    | "in_progress"
    | "completed";

type PathId =
    | "general"
    | "travel"
    | "daily"
    | string;

type BackHandler =
    () => void | Promise<void>;


/* -------------------------------------------------------------------------- */
/* Lessons                                                                    */
/* -------------------------------------------------------------------------- */

interface LessonTable {
    headers: string[];
    rows: string[][];
}

interface LessonExample {
    fr: string;
    fa?: string;
}

interface BaseExerciseQuestion {
    question: string;
    explanation?: string;
    explanation_fa?: string;
}

interface ChoiceExerciseQuestion
    extends BaseExerciseQuestion {
    type:
        | "mcq"
        | "binary";

    options: string[];
    correct: number;
}

interface FillBlankExerciseQuestion
    extends BaseExerciseQuestion {
    type: "fill_blank";
    correct: string;
}

interface OrderingExerciseQuestion
    extends BaseExerciseQuestion {
    type: "ordering";
    words: string[];
    correct: string[];
}

type ExerciseQuestion =
    | ChoiceExerciseQuestion
    | FillBlankExerciseQuestion
    | OrderingExerciseQuestion;

type ExerciseAnswer =
    | number
    | string
    | string[];

interface LessonContentSection {
    id: string;
    type: "lesson";

    title: string;
    title_fa?: string;

    content?: string;

    table?: LessonTable;
    table2?: LessonTable;

    examples?: LessonExample[];

    note?: string;
    note_fa?: string;
}

interface ExerciseSection {
    id: string;

    type:
        | "exercise"
        | "quiz";

    title: string;
    title_fa?: string;

    questions: ExerciseQuestion[];

    displayCount?: number;
}

type LessonSection =
    | LessonContentSection
    | ExerciseSection;

interface LessonData {
    id: string;

    level?: Level;

    title: string;
    title_fa?: string;

    icon?: string;
    estimatedTime?: number;

    sections: LessonSection[];
}


/* -------------------------------------------------------------------------- */
/* Grammar                                                                    */
/* -------------------------------------------------------------------------- */

interface GrammarLessonIndex {
    id: string;
    level: Level;

    module: string;
    category?: string;

    icon: string;

    title: string;
    title_fa?: string;

    estimatedTime: number;

    importance?: number;
    recommended?: boolean;

    prerequisites?: string[];

    lessons?: number;
    exercises: number;
}

interface GrammarModule {
    icon: string;
    items: GrammarLessonIndex[];
}


/* -------------------------------------------------------------------------- */
/* Progress                                                                   */
/* -------------------------------------------------------------------------- */

interface LessonProgress {
    status: LessonStatus;

    completedSections: string[];

    currentSection: number;

    lastAccessed: string | null;
}

interface MistakeRecord {
    lessonId: string;
    sectionId: string;

    questionIndex: number;

    userAnswer: ExerciseAnswer;

    correctAnswer:
        | number
        | string
        | string[];

    timestamp: string;
}


/* -------------------------------------------------------------------------- */
/* Placement                                                                  */
/* -------------------------------------------------------------------------- */

interface PlacementQuestion {
    id: string;
    level: Level;

    isPlacement?: boolean;

    difficulty: number;

    type: "mcq";

    skill?: string;
    topic?: string;

    question: string;
    options: string[];

    correctIndex: number;
}

interface PlacementState {
    asked: string[];

    currentDifficulty: number;

    correctStreak: number;
    wrongStreak: number;

    finished: boolean;

    finishReason: string | null;
}

interface PlacementLevelEstimate {
    level: Level;
    range: string;
}


/* -------------------------------------------------------------------------- */
/* Travel                                                                     */
/* -------------------------------------------------------------------------- */

interface TravelLessonIndex {
    id: string;

    title: string;
    title_fa?: string;

    icon?: string;
    estimatedTime?: number;

    module?: string;
    order?: number;
}

interface TravelVocabWord {
    fr: string;
    fa?: string;

    phonetic?: string;
    emoji?: string;
}

interface TravelTip {
    title_fr?: string;
    title_fa?: string;

    content_fr?: string;
    content_fa?: string;

    icon?: string;
}

interface TravelBaseSection {
    id: string;

    title?: string;
    title_fa?: string;

    note?: string;
    note_fa?: string;
}

interface TravelVocabSection
    extends TravelBaseSection {
    type: "vocab";
    words: TravelVocabWord[];
}

interface TravelTipsSection
    extends TravelBaseSection {
    type: "tips";
    tips: TravelTip[];
}

interface TravelLessonContentSection
    extends TravelBaseSection {
    type: "lesson";

    content?: string;

    examples?: LessonExample[];

    table?: LessonTable;
    table2?: LessonTable;
}

interface TravelExerciseSection
    extends TravelBaseSection {
    type: "exercise";

    questions: ExerciseQuestion[];

    displayCount?: number;
}

type TravelSection =
    | TravelVocabSection
    | TravelTipsSection
    | TravelLessonContentSection
    | TravelExerciseSection;

type ExerciseSectionInput =
    | ExerciseSection
    | TravelExerciseSection;

interface TravelLesson {
    id: string;

    path?: string;

    title: string;
    title_fa?: string;

    topic?: string;

    icon?: string;
    estimatedTime?: number;

    miniLessons?: TravelSection[];
    sections?: TravelSection[];
}


/* -------------------------------------------------------------------------- */
/* Vocabulary                                                                 */
/* -------------------------------------------------------------------------- */

interface VocabPackIndex {
    id: string;

    title: string;
    title_fa?: string;

    icon?: string;

    words: number;
}

interface VocabWord {
    fr: string;
    fa: string;

    emoji?: string;
    img?: string;

    difficulty?: number;

    ex?: string;
    ex_fa?: string;
}

interface VocabStoryBlank {
    id: number;

    options: string[];

    correctIndex: number;
}

interface VocabStoryParagraph {
    fr: string;
    fa: string;
}

interface VocabStoryQuestion {
    question: string;

    options: string[];

    correct: number;
}

interface VocabStory {
    title: string;
    title_fa?: string;

    text?: string;
    text_fa?: string;

    blanks?: VocabStoryBlank[];

    paragraphs?: VocabStoryParagraph[];

    keyWords?: string[];

    questions?: VocabStoryQuestion[];
}

interface VocabStories {
    simple?: VocabStory;
    easy?: VocabStory;

    literary?: VocabStory;
    hard?: VocabStory;

    [key: string]:
        VocabStory
        | undefined;
}

interface VocabExerciseQuestion {
    question: string;

    options: string[];

    correct?: number;
    correctIndex?: number;

    explanation?: string;
    explanation_fa?: string;
}

interface VocabExercise {
    questions: VocabExerciseQuestion[];

    displayCount?: number;
}

interface VocabPack {
    id: string;

    level: Level;

    title?: string;
    title_fa?: string;

    theme?: string;
    theme_fa?: string;

    icon?: string;

    words: VocabWord[];

    stories?: VocabStories;

    quiz?: VocabExercise;
    exercise?: VocabExercise;
}

interface VocabWeakMap {
    [packId: string]: string[];
}


/* -------------------------------------------------------------------------- */
/* News                                                                       */
/* -------------------------------------------------------------------------- */

interface NewsIndexItem {
    id: string;

    title: string;
    title_fa?: string;

    subtitle?: string;
    subtitle_fa?: string;

    image: string;

    level: string;

    publishedDate: string;
}

interface NewsVocabularyItem {
    fr: string;
    fa: string;

    level?: Level;
}

interface NewsGrammarItem {
    title: string;

    level?: Level;

    grammarId?: string;

    example: string;

    translation?: string;
    explanation?: string;
}

interface NewsSource {
    title: string;
    url: string;
}

interface NewsArticle
    extends NewsIndexItem {
    imageAlt?: string;

    week?: number;
    year?: number;

    content: {
        fullText: string;
        simpleText: string;

        vocabulary?: NewsVocabularyItem[];
        grammar?: NewsGrammarItem[];
    };

    sources?: NewsSource[];
}


/* -------------------------------------------------------------------------- */
/* Polls                                                                      */
/* -------------------------------------------------------------------------- */

interface PollOption {
    id: string;

    labelFa: string;
    labelFr: string;
}

interface Poll {
    id: string;

    question: string;
    question_fr: string;

    options: PollOption[];

    publishedDate?: string;
    endDate?: string;
}

interface PollFile {
    activePoll?: Poll;
}


/* -------------------------------------------------------------------------- */
/* Search                                                                     */
/* -------------------------------------------------------------------------- */

interface SearchGrammarItem
    extends GrammarLessonIndex {
    content?: string;
    example?: string;
}

interface SearchVocabWord
    extends VocabWord {
    level: Level;
    packId: string;
}


/* -------------------------------------------------------------------------- */
/* Global browser state                                                       */
/* -------------------------------------------------------------------------- */

interface Window {
    currentTravelLesson?: TravelLesson;
    currentTravelLessonId?: string;

    currentPack?: VocabPack;
}