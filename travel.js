// تست: آیا travel.js لود می‌شود؟
alert("✅ travel.js لود شد!");

async function showTravelPage() {
    alert("✅ تابع showTravelPage فراخوانی شد!");
    app.innerHTML = "<h1>تست موفق!</h1><p>travel.js کار می‌کند.</p>";
}
