/**
 * Shared application data contracts.
 *
 * Every contract is exported explicitly so application modules declare their
 * type dependencies just like their runtime dependencies.
 */

export type Language =
    | "fr"
    | "fa";

export type Level =
    | "A1"
    | "A2"
    | "B1"
    | "B2"
    | "C1"
    | "C2";

export type AppSection =
    | "home"
    | "grammar"
    | "vocabulary"
    | "travel"
    | "journal";

export type LessonStatus =
    | "not_started"
    | "in_progress"
    | "completed";

export type PathId =
    | "general"
    | "travel";

export type BackHandler =
    () => void | Promise<void>;


/* -------------------------------------------------------------------------- */
/* Lessons                                                                    */
/* -------------------------------------------------------------------------- */

export interface LessonTable {
    headers: string[];
    rows: string[][];
}

export interface LessonExample {
    fr: string;
    fa?: string;
}

export interface BaseExerciseQuestion {
    question: string;
    explanation?: string;
    explanation_fa?: string;
}

export interface ChoiceExerciseQuestion
    extends BaseExerciseQuestion {
    type:
        | "mcq"
        | "binary";

    options: string[];
    correct: number;
}

export interface FillBlankExerciseQuestion
    extends BaseExerciseQuestion {
    type: "fill_blank";
    correct: string;
}

export interface OrderingExerciseQuestion
    extends BaseExerciseQuestion {
    type: "ordering";
    words: string[];
    correct: string[];
}

export type ExerciseQuestion =
    | ChoiceExerciseQuestion
    | FillBlankExerciseQuestion
    | OrderingExerciseQuestion;

export type ExerciseAnswer =
    | number
    | string
    | string[];

export interface LessonContentSection {
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

export interface ExerciseSection {
    id: string;

    type:
        | "exercise"
        | "quiz";

    title: string;
    title_fa?: string;

    questions: ExerciseQuestion[];

    displayCount?: number;
}

export type LessonSection =
    | LessonContentSection
    | ExerciseSection;

export interface LessonData {
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

export interface GrammarLessonIndex {
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

export interface GrammarModule {
    icon: string;
    items: GrammarLessonIndex[];
}


/* -------------------------------------------------------------------------- */
/* Progress                                                                   */
/* -------------------------------------------------------------------------- */

export interface LessonProgress {
    status: LessonStatus;

    completedSections: string[];

    currentSection: number;

    lastAccessed: string | null;
}

export interface MistakeRecord {
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

export interface PlacementQuestion {
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

export interface PlacementState {
    asked: string[];

    currentDifficulty: number;

    correctStreak: number;
    wrongStreak: number;

    finished: boolean;

    finishReason: string | null;
}

export interface PlacementLevelEstimate {
    level: Level;
    range: string;
}


/* -------------------------------------------------------------------------- */
/* Travel                                                                     */
/* -------------------------------------------------------------------------- */

export interface TravelLessonIndex {
    id: string;

    title: string;
    title_fa?: string;

    icon?: string;
    estimatedTime?: number;

    module?: string;
    order?: number;
}

export interface TravelVocabWord {
    fr: string;
    fa?: string;

    phonetic?: string;
    emoji?: string;
}

export interface TravelTip {
    title_fr?: string;
    title_fa?: string;

    content_fr?: string;
    content_fa?: string;

    icon?: string;
}

export interface TravelBaseSection {
    id: string;

    title?: string;
    title_fa?: string;

    note?: string;
    note_fa?: string;
}

export interface TravelVocabSection
    extends TravelBaseSection {
    type: "vocab";
    words: TravelVocabWord[];
}

export interface TravelTipsSection
    extends TravelBaseSection {
    type: "tips";
    tips: TravelTip[];
}

export interface TravelLessonContentSection
    extends TravelBaseSection {
    type: "lesson";

    content?: string;

    examples?: LessonExample[];

    table?: LessonTable;
    table2?: LessonTable;
}

export interface TravelExerciseSection
    extends TravelBaseSection {
    type: "exercise";

    questions: ExerciseQuestion[];

    displayCount?: number;
}

export type TravelSection =
    | TravelVocabSection
    | TravelTipsSection
    | TravelLessonContentSection
    | TravelExerciseSection;

export type ExerciseSectionInput =
    | ExerciseSection
    | TravelExerciseSection;

export interface TravelLesson {
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

export type StoryDifficulty =
    | "simple"
    | "literary"
    | "easy"
    | "hard";

export interface VocabPackIndex {
    id: string;

    title: string;
    title_fa?: string;

    icon?: string;

    words: number;
}

export interface VocabWord {
    fr: string;
    fa: string;

    emoji?: string;
    img?: string;

    difficulty?: number;

    ex?: string;
    ex_fa?: string;
}

export interface VocabStoryBlank {
    id: number;

    options: string[];

    correctIndex: number;
}

export interface VocabStoryParagraph {
    fr: string;
    fa: string;
}

export interface VocabStoryQuestion {
    question: string;

    options: string[];

    correct: number;
}

export interface VocabStory {
    title?: string;
    title_fa?: string;

    text?: string;
    text_fa?: string;

    blanks?: VocabStoryBlank[];

    paragraphs?: VocabStoryParagraph[];

    keyWords?: string[];

    questions?: VocabStoryQuestion[];
}

export interface VocabStoryWithTitle
    extends VocabStory {
    title: string;
}

export interface VocabStories {
    simple?: VocabStory;
    easy?: VocabStory;

    literary?: VocabStory;
    hard?: VocabStory;

    [key: string]:
        VocabStory
        | undefined;
}

export interface VocabExerciseQuestion {
    question: string;

    options: string[];

    correct?: number;
    correctIndex?: number;

    explanation?: string;
    explanation_fa?: string;
}

export interface VocabExercise {
    questions: VocabExerciseQuestion[];

    displayCount?: number;
}

export interface VocabPack {
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

export interface VocabWeakMap {
    [packId: string]: string[];
}


/* -------------------------------------------------------------------------- */
/* News                                                                       */
/* -------------------------------------------------------------------------- */

export interface NewsIndexItem {
    id: string;

    title: string;
    title_fa?: string;

    subtitle?: string;
    subtitle_fa?: string;

    image: string;

    level: string;

    publishedDate: string;
}

export interface NewsVocabularyItem {
    fr: string;
    fa: string;

    level?: Level;
}

export interface NewsGrammarItem {
    title: string;

    level?: Level;

    grammarId?: string;

    example: string;

    translation?: string;
    explanation?: string;
}

export interface NewsSource {
    title: string;
    url: string;
}

export interface NewsArticle
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

export interface PollOption {
    id: string;

    labelFa: string;
    labelFr: string;
}

export interface Poll {
    id: string;

    question: string;
    question_fr: string;

    options: PollOption[];

    publishedDate?: string;
    endDate?: string;
}

export interface PollFile {
    activePoll?: Poll;
}


/* -------------------------------------------------------------------------- */
/* Search                                                                     */
/* -------------------------------------------------------------------------- */

export interface SearchGrammarItem
    extends GrammarLessonIndex {
    content?: string;
    example?: string;
}

export interface SearchVocabWord
    extends VocabWord {
    level: Level;
    packId: string;

    packTitle?: string;
    packTitleFa?: string;
}

export interface SearchIndex {
    version: 1;

    vocab: SearchVocabWord[];
    grammar: SearchGrammarItem[];
    news: NewsIndexItem[];
}

export interface SearchResults {
    vocab: SearchVocabWord[];
    grammar: SearchGrammarItem[];
    news: NewsIndexItem[];
}
