// ===============================
// 📊 بخش نظرسنجی مستقل
// ===============================
async function renderPollSection() {
    const lang = localStorage.getItem("language") || "fr";
    
    try {
        const response = await fetch("./data/polls/polls.json?v=" + Date.now());
        if (!response.ok) {
            console.warn("Polls file not found");
            return "";
        }
        
        const pollsData = await response.json();
        if (!pollsData || !pollsData.activePoll) {
            console.warn("No active poll");
            return "";
        }
        
        const poll = pollsData.activePoll;
        const pollVoted = localStorage.getItem("dino_poll_voted_" + poll.id);
        const pollChoice = localStorage.getItem("dino_poll_choice_" + poll.id);
        
        let html = "";
        
        html += `<div style="background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 4px 12px rgba(0,0,0,0.1);margin-bottom:30px;">`;
        
        // هدر
        html += `<div style="background:linear-gradient(135deg,#667eea 0%,#764ba2 100%);padding:24px 30px;">`;
        html += `<h2 style="font-size:22px;font-weight:700;color:#fff;margin:0 0 8px;">📊 ${lang === "fa" ? "نظرسنجی هفته" : "Sondage de la semaine"}</h2>`;
        html += `<p style="font-size:14px;color:rgba(255,255,255,0.9);margin:0;">${lang === "fa" ? "نظر شما برای ما مهم است!" : "Votre avis compte pour nous!"}</p>`;
        html += `</div>`;
        
        // محتوا
        html += `<div style="padding:30px;">`;
        html += `<p style="font-size:18px;font-weight:700;color:#1a1a1a;margin:0 0 24px;line-height:1.5;">${lang === "fa" ? poll.question : poll.question_fr}</p>`;
        
        if (pollVoted && pollChoice) {
            // نتایج
            html += `<div style="background:#f0f9ff;border:2px solid #087F5B;border-radius:8px;padding:20px;margin-bottom:16px;">`;
            const totalVotes = parseInt(localStorage.getItem("dino_poll_total_" + poll.id) || "0");
            
            poll.options.forEach(option => {
                const optionVotes = parseInt(localStorage.getItem("dino_poll_" + poll.id + "_" + option.id) || "0");
                const percentage = totalVotes > 0 ? Math.round((optionVotes / totalVotes) * 100) : 0;
                const isSelected = option.id === pollChoice;
                
                html += `<div style="margin-bottom:16px;">`;
                html += `<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;">`;
                html += `<span style="font-weight:${isSelected ? '700' : '500'};color:${isSelected ? '#087F5B' : '#1a1a1a'};">`;
                html += `${lang === "fa" ? option.labelFa : option.labelFr}`;
                if (isSelected) html += ` ✅`;
                html += `</span>`;
                html += `<span style="font-weight:700;color:#087F5B;">${percentage}%</span>`;
                html += `</div>`;
                html += `<div style="background:#e0e0e0;border-radius:4px;height:8px;overflow:hidden;">`;
                html += `<div style="background:${isSelected ? '#087F5B' : '#a7f3d0'};height:100%;width:${percentage}%;transition:width 0.5s;"></div>`;
                html += `</div></div>`;
            });
            
            html += `<p style="font-size:13px;color:#777;margin:16px 0 0;text-align:center;">${lang === "fa" ? "مجموع آرا: " + totalVotes : "Total des votes: " + totalVotes}</p>`;
            html += `</div>`;
            
            html += `<button onclick="resetPoll('${poll.id}')" style="width:100%;padding:12px;font-size:14px;font-weight:600;border:1px solid #e0e0e0;border-radius:6px;background:#fff;color:#777;cursor:pointer;">🔄 ${lang === "fa" ? "تغییر رای" : "Changer mon vote"}</button>`;
        } else {
            // گزینه‌ها
            poll.options.forEach(option => {
                const label = lang === "fa" ? option.labelFa : option.labelFr;
                html += `<button onclick="votePoll('${poll.id}', '${option.id}')" style="width:100%;padding:16px 20px;font-size:15px;font-weight:600;border:2px solid #e0e0e0;border-radius:8px;background:#fff;color:#1a1a1a;cursor:pointer;margin-bottom:12px;text-align:left;">`;
                html += `${label}`;
                html += `</button>`;
            });
        }
        
        html += `</div></div>`;
        return html;
    } catch (e) {
        console.error("Poll error:", e);
        return "";
    }
}

function votePoll(pollId, choice) {
    localStorage.setItem("dino_poll_voted_" + pollId, "true");
    localStorage.setItem("dino_poll_choice_" + pollId, choice);
    
    const currentCount = parseInt(localStorage.getItem("dino_poll_" + pollId + "_" + choice) || "0");
    localStorage.setItem("dino_poll_" + pollId + "_" + choice, currentCount + 1);
    
    const totalVotes = parseInt(localStorage.getItem("dino_poll_total_" + pollId) || "0");
    localStorage.setItem("dino_poll_total_" + pollId, totalVotes + 1);
    
    showHome();
}

function resetPoll(pollId) {
    const previousChoice = localStorage.getItem("dino_poll_choice_" + pollId);
    if (previousChoice) {
        const previousCount = parseInt(localStorage.getItem("dino_poll_" + pollId + "_" + previousChoice) || "1");
        localStorage.setItem("dino_poll_" + pollId + "_" + previousChoice, Math.max(0, previousCount - 1));
        
        const totalVotes = parseInt(localStorage.getItem("dino_poll_total_" + pollId) || "1");
        localStorage.setItem("dino_poll_total_" + pollId, Math.max(0, totalVotes - 1));
    }
    
    localStorage.removeItem("dino_poll_voted_" + pollId);
    localStorage.removeItem("dino_poll_choice_" + pollId);
    
    showHome();
}
