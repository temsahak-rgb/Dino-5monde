// vocabularyEngine.js

let vocabCache = {};

// فهرست پک‌های یک سطح
async function loadVocabIndex(level) {
    if (vocabCache["index-" + level]) return vocabCache["index-" + level];
    try {
        const r = await fetch(`./data/vocabulary/vocab-${level}.json`);
        const data = await r.json();
        vocabCache["index-" + level] = data;
        return data;
    } catch (e) {
        console.error("❌ خطا در بارگذاری سطح " + level, e);
        return [];
    }
}

// محتوای کامل یک پک
async function loadVocabPack(level, packId) {
    const key = `${level}-${packId}`;
    if (vocabCache[key]) return vocabCache[key];
    try {
        const r = await fetch(`./data/vocabulary/${level}/${packId}.json`);
        const data = await r.json();
        vocabCache[key] = data;
        return data;
    } catch (e) {
        return null;
    }
}

// پیشرفت فلش‌کارت
function getVocabProgress() {
    return JSON.parse(localStorage.getItem("dino_vocab_progress") || "{}");
}

function markWord(packId, wordFr, known) {
    const progress = getVocabProgress();
    if (!progress[packId]) progress[packId] = { known: [], unknown: [] };
    progress[packId].known = progress[packId].known.filter(w => w !== wordFr);
    progress[packId].unknown = progress[packId].unknown.filter(w => w !== wordFr);
    if (known) progress[packId].known.push(wordFr);
    else progress[packId].unknown.push(wordFr);
    localStorage.setItem("dino_vocab_progress", JSON.stringify(progress));
}
