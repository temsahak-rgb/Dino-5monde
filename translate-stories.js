// translate-stories.js
// ترجمه خودکار فقط داستان‌ها

const fs = require('fs');
const path = require('path');
const https = require('https');

const VOCAB_DIR = './data/vocabulary';
const DELAY = 1200; // تاخیر بین درخواست‌ها

function translate(text, from = 'fr', to = 'fa') {
    return new Promise((resolve, reject) => {
        if (!text || text.trim() === '') {
            resolve('');
            return;
        }
        
        const encoded = encodeURIComponent(text);
        const url = `https://api.mymemory.translated.net/get?q=${encoded}&langpair=${from}|${to}`;
        
        https.get(url, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                try {
                    const json = JSON.parse(data);
                    if (json.responseStatus === 200) {
                        resolve(json.responseData.translatedText);
                    } else {
                        console.warn(`️ خطا: ${json.responseDetails}`);
                        resolve(text);
                    }
                } catch (e) {
                    reject(e);
                }
            });
        }).on('error', reject);
    });
}

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function translateStory(filePath) {
    const content = fs.readFileSync(filePath, 'utf8');
    const pack = JSON.parse(content);
    let changed = false;
    
    console.log(`\n📦 ${pack.id} (${pack.level})`);
    
    if (!pack.stories) {
        console.log('  ⏭️ داستان ندارد');
        return;
    }
    
    for (const [key, story] of Object.entries(pack.stories)) {
        console.log(`  📖 ${key}`);
        
        // ترجمه عنوان
        if (story.title && !story.title_fa) {
            console.log(`    🔄 عنوان...`);
            story.title_fa = await translate(story.title);
            await sleep(DELAY);
            changed = true;
        }
        
        // ترجمه متن (اگر text دارد)
        if (story.text && !story.text_fa) {
            console.log(`    🔄 متن...`);
            const cleanText = story.text.replace(/\{\{BLANK_\d+\}\}/g, '___');
            story.text_fa = await translate(cleanText);
            await sleep(DELAY);
            changed = true;
        }
        
        // ترجمه پاراگراف‌ها (اگر paragraphs دارد)
        if (story.paragraphs) {
            for (const para of story.paragraphs) {
                if (para.fr && !para.fa) {
                    console.log(`    🔄 پاراگراف...`);
                    para.fa = await translate(para.fr);
                    await sleep(DELAY);
                    changed = true;
                }
            }
        }
    }
    
    if (changed) {
        fs.writeFileSync(filePath, JSON.stringify(pack, null, 2), 'utf8');
        console.log(`  ✅ ذخیره شد`);
    } else {
        console.log(`  ⏭️ ترجمه شده`);
    }
}

async function main() {
    const levels = fs.readdirSync(VOCAB_DIR).filter(f => 
        fs.statSync(path.join(VOCAB_DIR, f)).isDirectory()
    );
    
    console.log(`🔍 سطوح: ${levels.join(', ')}`);
    
    let count = 0;
    for (const level of levels) {
        const levelDir = path.join(VOCAB_DIR, level);
        const files = fs.readdirSync(levelDir).filter(f => f.endsWith('.json'));
        
        for (const file of files) {
            const filePath = path.join(levelDir, file);
            try {
                await translateStory(filePath);
                count++;
            } catch (e) {
                console.error(`❌ ${file}: ${e.message}`);
            }
        }
    }
    
    console.log(`\n🎉 پایان! ${count} پک پردازش شد.`);
}

main().catch(e => {
    console.error('خطا:', e);
    process.exit(1);
});
