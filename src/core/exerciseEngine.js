// exerciseEngine.js

// گرفتن سوالات رندوم از یک بخش تمرین
function getRandomQuestions(exerciseSection, count = null) {
    if (!exerciseSection || !exerciseSection.questions) return [];
    
    // اگر count مشخص نشده، همه سوالات را برگردان
    if (count === null) {
        count = exerciseSection.displayCount || exerciseSection.questions.length;
    }
    
    // اگر تعداد درخواستی بیشتر از موجودی است، همه را برگردان
    count = Math.min(count, exerciseSection.questions.length);
    
    // کپی آرایه و shuffle
    const shuffled = [...exerciseSection.questions];
    for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    
    // برگرداندن تعداد مشخصی
    return shuffled.slice(0, count);
}

// shuffle گزینه‌های یک سوال (برای mcq و binary)
function shuffleQuestionOptions(question) {
    if (question.type !== "mcq" && question.type !== "binary") {
        return question;
    }
    
    // کپی گزینه‌ها
    const shuffledOptions = [...question.options];
    const correctOption = question.options[question.correct];
    
    // shuffle
    for (let i = shuffledOptions.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffledOptions[i], shuffledOptions[j]] = [shuffledOptions[j], shuffledOptions[i]];
    }
    
    // پیدا کردن ایندکس جدید جواب درست
    const newCorrectIndex = shuffledOptions.indexOf(correctOption);
    
    return {
        ...question,
        options: shuffledOptions,
        correct: newCorrectIndex
    };
}

// shuffle کلمات برای ordering
function shuffleWordsForOrdering(question) {
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

// آماده‌سازی کامل یک سوال (shuffle همه چیز)
function prepareQuestion(question) {
    let prepared = question;
    
    if (prepared.type === "mcq" || prepared.type === "binary") {
        prepared = shuffleQuestionOptions(prepared);
    } else if (prepared.type === "ordering") {
        prepared = shuffleWordsForOrdering(prepared);
    }
    
    return prepared;
}

// بررسی جواب
function checkAnswer(question, userAnswer) {
    switch (question.type) {
        case "mcq":
        case "binary":
            return userAnswer === question.correct;
        
        case "fill_blank":
            return userAnswer.trim().toLowerCase() === question.correct.trim().toLowerCase();
        
        case "ordering":
            if (!Array.isArray(userAnswer)) return false;
            return userAnswer.every((word, index) => word === question.correct[index]);
        
        default:
            return false;
    }
}
