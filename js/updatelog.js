async function fetchAndDisplayUpdates() {
    try {
        const response = await fetch('./api/update.json');
        const data = await response.json();
        const updateLogDiv = document.getElementById('updateLog');

        // 最新版本信息
        const latestVersionInfo = data.versions[0];
        const latestVersion = latestVersionInfo.version;
        const latestDate = latestVersionInfo.date;

        // 更新 HTML 中的版本信息
        const versionNumberElement = document.getElementById('version-number');
        if (versionNumberElement) {
            versionNumberElement.textContent = `${latestVersion}`;
        }

        const footerVersionElement = document.getElementById('footer-version');
        if (footerVersionElement) {
            footerVersionElement.textContent = `${latestVersion}`;
        }

        data.versions.forEach(version => {
            const versionElement = document.createElement('ul');
            const versionItem = document.createElement('li');
            versionElement.setAttribute('class', 'update_ul'); // 添加 class="update_ul"
            versionItem.textContent = `${version.version} (${version.date})`;
            versionElement.appendChild(versionItem);

            const updatesList = document.createElement('ul');
            updatesList.className = 'update_log_text';
            version.updates.forEach(update => {
                const updateItem = document.createElement('li');
                updateItem.setAttribute('type', 'none'); // 添加 type="none"
                updatesList.setAttribute('class', 'update_text_ul'); // 添加 class="update_text_ul"
                updateItem.innerHTML = `<span class="update_log_text">- ${update}</span>`;
                updatesList.appendChild(updateItem);
            });

            versionElement.appendChild(updatesList);
            updateLogDiv.appendChild(versionElement);
        });
    } catch (error) {
        console.error('获取日志失败:', error);
    }
}