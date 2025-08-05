// 彩带
function createConfetti() {
    const container = document.getElementById('confetti-container');
    container.innerHTML = '';
    container.classList.add('active');

    for (let i = 0; i < 200; i++) {
        const confetti = document.createElement('div');
        confetti.classList.add('confetti');

        const left = Math.random() * 100;
        const animationDelay = Math.random() * 5;
        const animationDuration = Math.random() * 3 + 3;

        confetti.style.left = `${left}%`;
        confetti.style.animationDelay = `${animationDelay}s`;
        confetti.style.animationDuration = `${animationDuration}s`;

        container.appendChild(confetti);
    }

    // 5秒后移除
    setTimeout(() => {
        container.classList.remove('active');
    }, 5000);
}

// 重置数据并继续
async function resetAndContinue() {
    // 清除 cookie
    const cookies = document.cookie.split("; ");
    for (let cookie of cookies) {
        const eqPos = cookie.indexOf("=");
        const name = eqPos > -1 ? cookie.substr(0, eqPos) : cookie;
        document.cookie = name + "=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/";
    }

    // 清除 localStorage
    localStorage.clear();

    // 清除 IndexedDB
    const dbs = await indexedDB.databases();
    for (const db of dbs) {
        indexedDB.deleteDatabase(db.name);
    }

    localStorage.setItem('nitaiPageVisited', 'true');

    setTimeout(() => {
        window.location.href = './';
    }, 1000);
}

// 页面加载完成后执行
document.addEventListener('DOMContentLoaded', () => {
    createConfetti();

    // 为按钮添加点击事件
    const continueButton = document.getElementById('continueButton');
    if (continueButton) {
        continueButton.addEventListener('click', resetAndContinue);
    }
});