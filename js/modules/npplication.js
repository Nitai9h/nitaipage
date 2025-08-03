/*
作者: Nitai9h
Github：https://github.com/Nitai9h/npplicaiton
日期：2025-07-13
*/
const DB_NAME = 'nppstore';
const NPP_STORE = 'Npp';

/**
* JS文件校验
* @param {string} url
* @returns {Promise<boolean>} 校验结果 true/false
*/
async function verifyJSUrl(url) {
    try {
        // 检查URL扩展名
        if (!url.endsWith('.js')) {
            // 非 js 文件 --> false
            return false;
        }

        // 获取文件元信息 (HEAD)
        const response = await fetch(url, {
            method: 'HEAD',
            mode: 'cors',
            cache: 'no-cache'
        });

        // 提取 Content-Type (响应头)
        const contentType = response.headers.get('content-type');
        if (contentType && contentType.includes('application/javascript')) {
            // 是 js 文件 --> true
            return true;
        }

        // 进一步验证 (Range)
        const rangeResponse = await fetch(url, {
            method: 'GET',
            headers: { 'Range': 'bytes=0-1' },
            mode: 'cors',
            cache: 'no-cache'
        });

        const contentRange = rangeResponse.headers.get('content-range');
        // 是 js 文件 --> true
        if (!!contentRange) {
            return true;
        };

    } catch (error) {
        console.error('Error verifying JS URL:', error);
        return false;
    }
}

/**
* 提取元数据
* @param {string} url - JS 文件 URL
* @returns {Object} 元数据
*/
async function extractMetadata(url) {
    try {
        const response = await fetch(url, { cache: 'no-store' });
        const scriptText = await response.text();

        // 提取元数据块
        const urlMetadata = scriptText.match(
            /\/\/\s*==Npplication==\s*\n([\s\S]*?)\n\/\/\s*==\/Npplication==/
        );

        if (!urlMetadata || !urlMetadata[1]) {
            console.error('未找到元数据');
            return;
        }

        // 解析元数据
        const metadataLines = urlMetadata[1].split('\n');
        const metadata = {};

        for (const line of metadataLines) {
            const trimmedLine = line.trim();
            if (trimmedLine.startsWith('// @')) {
                const [key, ...valueParts] = trimmedLine.replace('// @', '').trim().split(' ');
                const value = valueParts.join(' ').trim();
                if (key && value) {
                    metadata[key] = value;
                }
            }
        }

        // 验证 名字/id/版本
        if (!metadata.name
            || !metadata.id
            || !metadata.version
            || !metadata.time
        ) {
            console.error('缺少必要元数据字段');
            return;
        }

        // 验证 id 格式
        if (metadata.type !== 'coreNpp') {
            // UUID v4 格式
            const idPattern = /^([0-9]{13})_[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-4[0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}$/;
            const match = metadata.id.match(idPattern);
            if (!match) {
                console.error('错误的 ID 格式');
                return;
            }

            // 验证 id 有效性
            const timestamp = parseInt(match[1]);
            if (timestamp < 1749401460000) {
                console.error('ID 无效');
                return;
            }
        }

        // 验证 加载时机
        if (!metadata.time || !['head', 'body'].includes(metadata.time.toLowerCase())) {
            metadata.time = 'body'; // 默认
        }

        return {
            name: metadata.name,
            id: metadata.id,
            version: metadata.version,
            updateUrl: metadata.updateUrl || url,
            description: metadata.description || '未提供',
            author: metadata.author || '未知',
            type: metadata.type || '',
            time: metadata.time.toLowerCase(),
            icon: metadata.icon || 'https://nitai-images.pages.dev/nitaiPage/defeatNpp.svg',
            screen: metadata.screen || '',
            forceUpdate: metadata.forced || 'false',
            setting: metadata.setting || 'false',
            dependencies: metadata.dependencies || '',
        };
    } catch (error) {
        console.error(error);
        return;
    }
}

/**
 * 解析依赖项字符串为对象
 * @param {string} dependenciesStr - 依赖项字符串
 * @returns {Object} 依赖项对象; 键为 URL,值为版本要求
 */
function parseDependencies(dependenciesStr) {
    try {
        // 移除前后的括号和空格
        const cleanStr = dependenciesStr.trim().replace(/^\[|\]$/g, '');
        if (!cleanStr) {
            return {};
        }

        // 分割多个依赖项
        const depEntries = cleanStr.split(',').map(entry => entry.trim());
        const dependencies = {};

        // 解析每个依赖项
        depEntries.forEach(entry => {
            // 标准格式 [`url`:`version`]
            let match = entry.match(/`\s*([^`]+?)\s*`\s*:\s*`\s*([^`]+?)\s*`/);
            let depUrl = null;
            let version = 'Latest'; // 默认Latest

            // 标准格式
            if (match && match.length >= 3) {
                depUrl = match[1].trim().replace(/`/g, '');
                version = match[2].trim().replace(/`/g, '');
            } else {
                // [`URL`]
                match = entry.match(/`\s*([^`]+?)\s*`/);
                if (match && match.length >= 2) {
                    depUrl = match[1].trim().replace(/`/g, '');
                } else {
                    console.warn('无法解析的依赖项:' + entry);
                    return;
                }
            }

            dependencies[depUrl] = version;
        });
        return dependencies;
    } catch (error) {
        console.error('依赖项解析失败:' + error);
        return {};
    }
}

/**
 * 检查依赖项状态
 * @param {Object} dependencies - 依赖项对象; 键为 URL,值为版本要求
 * @returns {Promise<{status: boolean, details: Object}>} - 对象; 包含整体状态和每个依赖项状态
 */
async function checkDependencies(dependencies) {

    // 无依赖项
    if (!dependencies || Object.keys(dependencies).length === 0) {
        return { status: true, details: {} };
    }

    try {
        const plugins = JSON.parse(localStorage.getItem('npp_plugins') || '[]');

        const details = {};
        let allDependenciesMet = true;

        // 检查每个依赖项
        for (const [depUrl, requiredVersion] of Object.entries(dependencies)) {

            try {
                // 获取依赖项的元数据
                const depMetadata = await extractMetadata(depUrl);
                if (!depMetadata || !depMetadata.id) {
                    console.error('无法获取依赖项有效元数据:' + depUrl);
                    details[depUrl] = { status: 'failed', message: '获取依赖项信息失败' };
                    allDependenciesMet = false;
                    continue;
                }

                // 检查依赖项是否已安装
                const installedPlugin = plugins.find(p => p.id === depMetadata.id);
                if (!installedPlugin) {
                    details[depUrl] = {
                        status: 'not_installed',
                        message: '未安装',
                        requiredVersion: requiredVersion,
                        metadata: depMetadata
                    };
                    allDependenciesMet = false;
                    continue;
                }

                // 检查版本
                const versionCompare = compareVersions(installedPlugin.version, requiredVersion);

                if (versionCompare < 0) {
                    details[depUrl] = {
                        status: 'version_mismatch',
                        message: '需安装更新版本',
                        installedVersion: installedPlugin.version,
                        requiredVersion: requiredVersion,
                        metadata: depMetadata
                    };
                    allDependenciesMet = false;
                } else {
                    details[depUrl] = {
                        status: 'satisfied',
                        message: '已安装',
                        installedVersion: installedPlugin.version,
                        requiredVersion: requiredVersion,
                        metadata: depMetadata
                    };
                }
            } catch (error) {
                console.error('检查依赖项失败:' + depUrl, error);
                details[depUrl] = { status: 'failed', message: '检查依赖项时出错' };
                allDependenciesMet = false;
            }
        }

        return { status: allDependenciesMet, details: details };
    } catch (error) {
        console.error('依赖项检查过程中发生错误:', error);
        return { status: false, details: {} };
    }
}

/**
 * 加载依赖项
 * @param {HTMLElement} container - 需要依赖项的插件容器
 * @param {Object} dependencies - 依赖项对象
 * @param {string} source - 插件来源
 */
async function renderDependencies(container, dependencies, source = '') {

    if (!dependencies || Object.keys(dependencies).length === 0) {
        container.innerHTML = '<p>无需依赖项</p>';
        return { status: true };
    }

    try {
        const dependencyCheckResult = await checkDependencies(dependencies);
        const details = dependencyCheckResult.details;

        let html = '<div class="dependencies-list">';
        if (Object.keys(details).length === 0) {
            html += '<p>无需依赖项</p>';
        } else {
            for (const [depUrl, depDetails] of Object.entries(details)) {
                const metadata = depDetails.metadata || {};
                const statusClass =
                    depDetails.status === 'satisfied' ? 'satisfied' :
                        depDetails.status === 'version_mismatch' ? 'warning' :
                            depDetails.status === 'not_installed' ? 'error' : 'failed';

                html += `
                    <div class="plugin-item dependency-item ${statusClass}" data-url="${depUrl}">
                        <img src="${metadata.icon || 'https://nitai-images.pages.dev/nitaiPage/defeatNpp.svg'}" alt="${metadata.name || '依赖项'}" class="plugin-icon">
                        <div class="plugin-info">
                            <strong translate="none">${metadata.name || depUrl}</strong>
                            <p translate="none">${metadata.description || 'Unknown'}</p>
                            <p>所需版本: <span translate="none">${depDetails.requiredVersion || 'Latest'}</span>
                            <span translate="none">${depDetails.installedVersion ? `| 已安装版本: <span translate="none">${depDetails.installedVersion}</span>` : ''}</p>
                            <p class="status" translate="none">${depDetails.message}</p>
                        </div>
                    </div>
                `;
            }
        }
        html += '</div>';
        container.innerHTML = html;

        // 依赖点击
        container.querySelectorAll('.dependency-item').forEach(item => {
            item.addEventListener('click', async () => {
                const depUrl = item.dataset.url;
                try {
                    const metadata = await extractMetadata(depUrl);
                    if (metadata) {
                        showPluginDetails({ url: depUrl, ...metadata, source: source });
                    }
                } catch (error) {
                    console.error('打开依赖项详情失败:' + error);
                    iziToast.show({
                        timeout: 3000,
                        message: '读取依赖项时出错'
                    });
                }
            });
        });

        return dependencyCheckResult;
    } catch (error) {
        console.error('渲染依赖项失败:', error);
        container.innerHTML = '<p>加载失败,请尝试重载</p>';
        return { status: false, details: {} };
    }
}

/**
* 保存元数据
* @param {Object} metadata - 元数据
*/
function savePluginMetadata(metadata) {
    return new Promise((resolve, reject) => {
        try {
            // 验证metadata有效性
            if (!metadata || typeof metadata !== 'object' || !metadata.id) {
                console.error('无效的插件: 缺少必要的id字段');
                reject();
            }

            // 获取列表
            const pluginsStr = localStorage.getItem('npp_plugins') || '[]';
            const plugins = JSON.parse(pluginsStr);

            if (!Array.isArray(plugins)) {
                console.error('本地存储的插件数据格式无效，预期为数组');
                reject();
            }

            // 在数据库查找 NPP
            const existingIndex = plugins.findIndex(p => p.id === metadata.id);
            const existing = existingIndex > -1 ? plugins[existingIndex] : null;

            // 保留安装时间戳
            const installTime = existing?.installTime || Date.now();

            // 保存
            if (existing) {
                plugins[existingIndex] = {
                    ...metadata,
                    installTime,
                    ignoreUpdatePrompt: metadata.ignoreUpdatePrompt || false
                };
            } else {
                plugins.push({
                    ...metadata,
                    installTime,
                    ignoreUpdatePrompt: false
                });
            }

            // 元数据保存
            localStorage.setItem('npp_plugins', JSON.stringify(plugins));
            resolve();
        } catch (error) {
            reject(error);
            console.error('保存插件元数据失败:', error.message);
            return;
        }
    });
}

/**
* 下载并保存NPP
* @param {string} id
* @param {string} url
*/
function saveJSFile(id, url) {
    return new Promise((resolve, reject) => {
        // 参数验证
        if (!id || !url) {
            console.error('缺少必要参数: ' + (id ? '' : 'id ') + (url ? '' : 'url'));
            reject();
            return;
        }

        fetch(url, { cache: 'no-store' })
            .then(response => {
                if (!response.ok) {
                    console.error(`HTTP错误: ${response.status} ${response.statusText}`);
                    reject();
                    return;
                }
                return response.text();
            })
            .then(content => {
                // 数据库
                const request = indexedDB.open(DB_NAME, 1);

                request.onsuccess = (event) => {
                    const db = event.target.result;
                    const transaction = db.transaction(NPP_STORE, 'readwrite');
                    const store = transaction.objectStore(NPP_STORE);

                    // 存储文件
                    const putRequest = store.put({ id, content });

                    putRequest.onsuccess = () => {
                        console.log('下载成功');
                        resolve();
                    };

                    putRequest.onerror = () => {
                        console.error('下载失败');
                        reject();
                    };
                };

                request.onerror = () => {
                    console.error('文件读取失败失败');
                    reject();
                };
            })
            .catch(error => {
                console.error('下载失败:', error);
                reject();
            });
    });
}

/**
* 获取插件元数据和资源地址
* @param {Object} option - id 或 url
* @returns {Promise<Object>} 
*/
function getNpp(option) {
    return new Promise(async (resolve, reject) => {
        if (option.id) {

            // 从 localStorage 获取元数据
            const plugins = JSON.parse(localStorage.getItem('npp_plugins') || '[]');
            const metadata = plugins.find(p => p.id === option.id);
            if (!metadata) {
                console.error('未找到元数据: ' + option.id);
                reject('未找到元数据');
                return;
            }
            // 从 indexedDB 获取文件内容
            const request = indexedDB.open(DB_NAME, 1);
            request.onsuccess = (event) => {
                const db = event.target.result;
                const transaction = db.transaction(NPP_STORE, 'readonly');
                const store = transaction.objectStore(NPP_STORE);
                const getRequest = store.get(option.id);
                getRequest.onsuccess = () => {
                    const fileRecord = getRequest.result;
                    if (fileRecord) {
                        const blob = new Blob([fileRecord.content], { type: 'application/javascript' });
                        const url = URL.createObjectURL(blob);
                        resolve({ metadata, url });
                    } else {
                        // indexedDB 不存在则只返回 metadata
                        // coreNpp 可忽略此提示
                        console.warn('在 indexedDB 内未找到内容' + option.id);
                        resolve({ metadata });
                    }
                };
            };
            request.onerror = (event) => {
                console.error('数据库打开失败: ' + event.target.error.message);
                reject('数据库打开失败');
            };
        } else if (option.url) {
            try {
                const metadata = await extractMetadata(option.url);
                resolve({ metadata });
            } catch (error) {
                console.error('获取插件元数据失败:', error);
                reject();
            }

        }
    });
}

/**
* 注入 NPP
* @param {string} id
* @param {string} time - 加载时机 (head/body)
*/
function loadTime(id, time) {
    getNpp({ id })
        .then(({ url }) => {
            // 查找现有的 script
            const existingScript = document.querySelector(`script[data-npp-id="${id}"]`);
            if (existingScript) {
                // 更新 src
                existingScript.src = url;
            } else {
                // 创建新的 script
                const script = document.createElement('script');
                script.src = url;
                script.type = 'text/javascript';
                script.dataset.nppId = id;
                // 根据 @time 注入
                if (time === 'head') {
                    document.head.appendChild(script);
                } else if (time === 'body') {
                    document.body.appendChild(script);
                } else {
                    console.error('加载时机无效');
                    return;
                }
            }
        })
        .catch(error => {
            console.error('获取插件失败:', error);
            return;
        });
}


/**
* 版本比较
* return:
* [1] version1 > version2
* [-1] version1 < version2
* [0] version1 = version2
*/
function compareVersions(version1, version2) {
    if (version1 === version2) {
        return 0;
    } else if (version1 > version2) {
        return 1;
    } else {
        return -1;
    }
}

/**
* 检查插件更新
* @param {string} id - 传入单个插件 id / 'all'
*/
async function checkUpdates(id, info = 'show') {
    const checkSinglePluginUpdate = async (pluginId, info) => {
        try {
            // 获取本地插件信息
            const localData = await getNpp({ "id": pluginId });
            if (!localData || !localData.metadata) {
                console.error(`未知的Npp: ${pluginId}`);
                return;
            }
            const localMetadata = localData.metadata;

            // 获取远程最新版本信息
            const remoteMetadata = await extractMetadata(localMetadata.updateUrl);
            if (!remoteMetadata) {
                console.error(`无法获取插件 ${pluginId} 的元数据`);
                return;
            }

            // 比较版本
            const versionComparison = compareVersions(localMetadata.version, remoteMetadata.version);
            if (versionComparison < 0) {
                // 发现新版本
                if (localMetadata.forceUpdate == 'true') {
                    // 更新 JS 文件
                    await saveJSFile(remoteMetadata.id, remoteMetadata.updateUrl);
                    // 更新元数据
                    await savePluginMetadata({
                        ...remoteMetadata,
                        ignoreUpdatePrompt: false
                    });

                    iziToast.show({
                        timeout: 2000,
                        title: '自动更新',
                        message: `${localMetadata.name} 已更新至版本 ${remoteMetadata.version}`,
                    });
                    if ($('#checkUpdateToast').length) {
                        if ($('#checkUpdateToast').length) { iziToast.hide({}, '#checkUpdateToast'); }
                    }
                    showRefreshDialog();
                } else {
                    await new Promise((resolve) => {
                        iziToast.show({
                            timeout: 8000,
                            title: '更新',
                            message: `${localMetadata.name} 有新版本 ${remoteMetadata.version} 可用，是否更新？`,
                            buttons: [
                                ['<button>更新</button>', async function (instance, toast) {
                                    instance.hide({ transitionOut: 'flipOutX' }, toast, 'update');

                                    // 下载并保存
                                    await saveJSFile(remoteMetadata.id, remoteMetadata.updateUrl);
                                    // 更新元数据
                                    await savePluginMetadata({
                                        ...remoteMetadata,
                                        ignoreUpdatePrompt: false
                                    });

                                    iziToast.show({
                                        timeout: 2000,
                                        title: '更新',
                                        message: `${localMetadata.name} 已更新至版本 ${remoteMetadata.version}`
                                    });
                                    resolve();
                                    showRefreshDialog();
                                }, true],
                                ['<button>不再提示</button>', function (instance, toast) {
                                    instance.hide({ transitionOut: 'flipOutX' }, toast, 'noUpdate');
                                    // 保存用户选择：不再提示更新
                                    savePluginMetadata({
                                        ...localMetadata,
                                        ignoreUpdatePrompt: true
                                    });
                                    resolve();
                                }],
                                ['<button>稍后</button>', function (instance, toast) {
                                    instance.hide({ transitionOut: 'flipOutX' }, toast, 'cancel');
                                    resolve();
                                }]
                            ],
                            onClosed: function () {
                                resolve();
                            }
                        });
                        if ($('#checkUpdateToast').length) { iziToast.hide({}, '#checkUpdateToast'); }
                    });
                }
            } else {
                // 使用Promise确保逐个显示提示
                if (info !== 'hide') {
                    await new Promise((toastResolve) => {
                        iziToast.show({
                            timeout: 2000,
                            message: `${localMetadata.name} 已是最新版本 ${localMetadata.version}`,
                            onClosed: function () {
                                toastResolve();
                            }
                        });
                        if ($('#checkUpdateToast').length) { iziToast.hide({}, '#checkUpdateToast'); }
                    });
                }
            }
        } catch (error) {
            console.error(`检查插件 ${pluginId} 更新失败:`, error);
            iziToast.show({
                timeout: 8000,
                message: `检查插件 ${pluginId} 更新时发生错误`
            });
            if ($('#checkUpdateToast').length) { iziToast.hide({}, '#checkUpdateToast'); }
        }
    };

    if (id === 'all') {
        // 检查所有插件，使用顺序队列确保逐个询问
        const plugins = JSON.parse(localStorage.getItem('npp_plugins') || '[]');
        for (const plugin of plugins) {
            await checkSinglePluginUpdate(plugin.id, 'hide');
        }
        // 检查完成
        if (info === 'show') {
            iziToast.show({
                timeout: 2000,
                message: '所有 Npp 均已更新到最新版本或已提交更新申请'
            });
        }
        if ($('#checkUpdateToast').length) { iziToast.hide({}, '#checkUpdateToast'); }
    } else {
        // 检查单个插件
        await checkSinglePluginUpdate(id);
    }
}

// 按指定顺序加载所以插件
async function loadNpp() {
    // 顺序
    const plugins = JSON.parse(localStorage.getItem('npp_plugins') || '[]');
    plugins.forEach(plugin => {
        if (plugin.id
            && plugin.time && plugin.type !== 'coreNpp') {
            loadTime(plugin.id, plugin.time);
        }
    });
}

// 初始化 coreNpp
async function initCoreNpp() {
    // 指定目录
    const coreNppDir = './js/coreNpp/';
    // 指定文件(指定完请添加链接到HTML内，否则不加载)
    // 只有在这里指定的文件才会加载元数据
    // 否则不会出现在商店管理的列表内
    // coreNpp 会触发 (npplication.js:490) 在 indexedDB 内未找到内容的提示，可以忽略
    const coreNppFiles = [
        'themeColor.js',
        'advancedSettings.js'
    ];

    for (const fileName of coreNppFiles) {
        const pluginUrl = `${coreNppDir}${fileName}`;
        try {
            // 提取元数据 (文件)
            const metadata = await extractMetadata(pluginUrl);
            // 跳过非 coreNpp 类型的插件
            if (metadata.type !== 'coreNpp') {
                console.warn(`File ${fileName} is not a coreNpp plugin`);
                continue;
            }
            // 查找元数据 (localStorage)
            const storedPlugins = JSON.parse(localStorage.getItem('npp_plugins') || '[]');
            const existingPlugin = storedPlugins.find(p => p.id === metadata.id);

            if (existingPlugin) {
                // localStorage 版本 > 文件版本
                if (compareVersions(existingPlugin.version, metadata.version) > 0) {
                    // 使用 localStorage 的版本 (更新的版本)
                    const scriptTag = document.querySelector(`script[src*="${fileName}"]`);
                    if (scriptTag) {
                        const { url } = await getNpp({ id: metadata.id });
                        scriptTag.src = url;
                    }
                }
                // localStorage 没有记录插件
            } else {
                // 保存元数据 localStorage
                await savePluginMetadata(metadata);
            }
        } catch (error) {
            console.error('加载核心应用失败:', error);
        }
    }
}

// 获取已安装插件数量
function getNum() {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open(DB_NAME);
        request.onsuccess = (event) => {
            const db = event.target.result;
            const store = db.transaction(NPP_STORE, 'readonly').objectStore(NPP_STORE);
            const countRequest = store.count();

            countRequest.onsuccess = () => {
                resolve(countRequest.result);
                db.close();
            };
            countRequest.onerror = () => {
                console.warn('获取插件数量失败');
                reject();
                db.close();
            };
        };

        request.onerror = (event) => {
            console.error('数据库打开失败');
            reject();
        };
    });
}

/**
* 数据库初始化
* @returns {Promise<void>}
*/
function initializaNppDB() {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open(DB_NAME, 1);

        request.onupgradeneeded = (event) => {
            const db = event.target.result;
            if (!db.objectStoreNames.contains(NPP_STORE)) {
                db.createObjectStore(NPP_STORE, { keyPath: 'id' });
            }
            /* console.log('Successful database initialization'); */
        };
        request.onsuccess = (event) => {
            const db = event.target.result;
            // 验证
            if (!db.objectStoreNames.contains(NPP_STORE)) {
                console.error('缺少必要的对象存储: ' + NPP_STORE);
                reject();
                return;
            }
            db.close();
            resolve();
        };
        request.onerror = (event) => {
            console.error('数据库初始化失败: ' + event.target.error.message);
            reject();
        };

    });
}

// 拖动排序配置页面
function showOrderConfigDialog() {
    const storePage = document.getElementById('storePage');
    const plugins = JSON.parse(localStorage.getItem('npp_plugins') || '[]');
    if (plugins.length === 0) {
        console.error('没有可配置的插件');
        iziToast.show({
            timeout: 2000,
            message: '没有可配置的插件'
        });
        return;
    }

    // 创建对话框
    const dialog = document.createElement('div');
    dialog.className = 'order-dialog';
    // 生成拖动列表容器
    const list = document.createElement('div');
    list.className = 'plugin-list';

    // 创建列表项
    const items = plugins.map(plugin => {
        const item = document.createElement('div');
        item.className = 'plugin-item';
        item.dataset.id = plugin.id;
        item.innerHTML = `
                <div class="drag-handle"></div>
                <div class="plugin-info">
                    <strong translate="none">${plugin.name}</strong>
                    <p>NID: <span translate="none">${plugin.id}</span></p>
                    <p>版本: <span translate="none">${plugin.version}</span></p>
                </div>
                `;
        return item;
    });

    // 所有项添加到容器
    items.forEach(item => list.appendChild(item));

    // 初始化Sortable
    new Sortable(list, {
        animation: 150, // 动画时长（毫秒）
        draggable: '.plugin-item', // 指定可拖动元素
        ghostClass: 'sortable-ghost', // 拖动时的临时类
        chosenClass: 'sortable-chosen', // 选中时的类
        dragClass: 'sortable-drag', // 拖动中的类
        touchStartThreshold: 30, // 优化触摸触发阈值
        delay: 150, // 调整延迟使滑动更流畅
        delayOnTouchOnly: true, // 仅在触屏设备应用延迟
        scrollSpeed: 30, // 滚动速度
        forceFallback: true, // 允许拖动时滚动
        onEnd: function () {
            // 拖动结束时可以添加额外的动画效果
            list.style.opacity = '0.8';
            setTimeout(() => list.style.opacity = '1', 300);
        }
    });

    // 创建按钮
    const buttons = document.createElement('div');
    buttons.className = 'store-button';
    const saveBtn = document.createElement('button');
    saveBtn.className = 'store-order-save';
    saveBtn.textContent = '保存';
    const cancelBtn = document.createElement('button');
    cancelBtn.className = 'store-order-cancel';
    cancelBtn.textContent = '取消';

    buttons.appendChild(saveBtn);
    buttons.appendChild(cancelBtn);

    // 组装对话框
    dialog.innerHTML = '<div class="dialog-content"></div>';
    dialog.querySelector('.dialog-content').appendChild(list);
    dialog.querySelector('.dialog-content').appendChild(buttons);
    storePage.appendChild(dialog);

    // 事件绑定
    cancelBtn.addEventListener('click', () => {
        storePage.removeChild(dialog);
        $('#storeTabs').css('display', 'flex');
        $('.store-block').css('display', 'flex');
    });
    saveBtn.addEventListener('click', () => {
        // 收集排序
        const newOrder = Array.from(list.querySelectorAll('.plugin-item')).map(
            item => item.dataset.id
        );
        // 更新排序
        const updatedPlugins = JSON.parse(localStorage.getItem('npp_plugins') || '[]');
        const pluginMap = updatedPlugins.reduce((acc, plugin) => {
            acc[plugin.id] = plugin;
            return acc;
        }, {});
        // 重组列表
        const orderedPlugins = newOrder
            .map(id => pluginMap[id])
            .filter(plugin => plugin);
        // 保留未选中的插件
        const remainingPlugins = updatedPlugins.filter(
            plugin => !newOrder.includes(plugin.id)
        );
        // 合并所有插件
        const finalPlugins = [...orderedPlugins, ...remainingPlugins];
        // 保存至localStorage
        localStorage.setItem('npp_plugins', JSON.stringify(finalPlugins));
        // 关闭对话框
        storePage.removeChild(dialog);
        $('#storeTabs').css('display', 'flex');
        $('.store-block').css('display', 'flex');

        // 刷新提示
        showRefreshDialog();
    });
}

// 刷新提示
function showRefreshDialog() {
    iziToast.show({
        timeout: 4000,
        message: '安装成功，刷新生效',
        buttons: [
            ['<button class="refresh-btn">刷新</button>', function (instance, toast) {
                instance.hide({ transitionOut: 'flipOutX' }, toast, 'confirm');
                window.location.reload(true);
            }, true],
            ['<button class="later-btn">稍后</button>', function (instance, toast) {
                instance.hide({ transitionOut: 'flipOutX' }, toast, 'cancel');
            }]
        ]
    });
}

// 覆盖安装确认对话框
function showUpdateDialog(metadata) {
    if ($('#installToast').length) { iziToast.hide({}, '#installToast'); }
    iziToast.show({
        timeout: 8000,
        message: `确定要覆盖安装插件"${metadata.name}"?`,
        buttons: [
            ['<button class="confirm-btn">覆盖</button>', async function (instance, toast) {
                instance.hide({ transitionOut: 'flipOutX' }, toast, 'confirm');
                try {
                    // 下载并保存
                    await saveJSFile(metadata.id, metadata.updateUrl);
                    // 更新元数据
                    await savePluginMetadata({
                        ...metadata,
                        ignoreUpdatePrompt: false
                    });
                    showRefreshDialog();
                } catch (error) {
                    console.error('覆盖失败:' + error.message);
                    iziToast.show({
                        timeout: 3000,
                        message: '覆盖失败'
                    });
                }
            }, true],
            ['<button class="cancel-btn">取消</button>', function (instance, toast) {
                instance.hide({ transitionOut: 'flipOutX' }, toast, 'cancel');
            }]
        ]
    });
}

/**
* 主安装函数
* @param {string} url - JS 文件 URL
*/
async function installNpplication(url) {
    try {
        // 获取元数据
        const { metadata } = await getNpp({ url });
        // 验证 URL
        if (!await verifyJSUrl(url)) {
            console.error('无效的JS文件URL:' + url);
            iziToast.show({
                timeout: 2000,
                message: '安装失败'
            });
            if ($('#installToast').length) { iziToast.hide({}, '#installToast'); }
            return;
        }

        // 检查依赖项
        const dependencies = parseDependencies(metadata.dependencies || '');
        const dependencyCheckResult = await checkDependencies(dependencies);

        if (!dependencyCheckResult.status) {
            if ($('#installToast').length) { iziToast.hide({}, '#installToast'); }
            return;
        }
        // 来源验证
        if (metadata.type === 'coreNpp' && !url.startsWith(
            'https://nfdb.nitai.us.kg'
        )) {
            console.warn('核心应用只能从指定源安装');
            iziToast.show({
                timeout: 2000,
                message: '安装失败'
            });
            if ($('#installToast').length) { iziToast.hide({}, '#installToast'); }
            return;
        }

        // 从 localStorage 获取现有插件列表
        const plugins = JSON.parse(localStorage.getItem('npp_plugins') || '[]');
        const existing = plugins.find(p => p.id === metadata.id);
        // 检查核心应用是否存在
        if (metadata.type === 'coreNpp' && !existing) {
            console.warn('核心应用禁止安装');
            iziToast.show({
                timeout: 2000,
                message: '安装失败'
            });
            if ($('#installToast').length) { iziToast.hide({}, '#installToast'); }
            return;
        }
        // 覆盖弹窗
        if (existing) {
            const versionComparison = compareVersions(existing.version, metadata.version);
            if (versionComparison === 0) {
                showUpdateDialog(metadata);
            } else if (versionComparison < 0) {
                iziToast.show({
                    id: 'checkUpdateToast',
                    message: '正在安装'
                });
                checkUpdates(metadata.id);
            }
        } else {
            // 验证加载时机
            if (!['head', 'body'].includes(metadata.time)) {
                console.error('无有效的加载时机');
                return;
            }
            // 保存元数据
            await savePluginMetadata(metadata);
            // 下载并保存
            await saveJSFile(metadata.id, url);
            // 显示刷新提示
            showRefreshDialog();
            if ($('#installToast').length) { iziToast.hide({}, '#installToast'); }
        }
    } catch (error) {
        console.error(`安装失败: ${error.message}`);
        iziToast.show({
            timeout: 2000,
            message: '安装失败'
        });
        if ($('#installToast').length) { iziToast.hide({}, '#installToast'); }
    }
}

// 插件管理页面加载函数
async function loadPluginManagementPage() {
    try {
        const plugins = JSON.parse(localStorage.getItem('npp_plugins') || '[]');
        // 获取商店源
        let storeSources = JSON.parse(localStorage.getItem('storeSources')) || storeSourcesDefault;

        let html = `<div class='store_sources_management'>
                    <div class='store_sources_header'>
                        <h3>商店源管理</h3>
                        <button class='toggle_store_sources'>
                            <i class='iconfont icon-folding'></i>
                        </button>
                    </div>
                    <div class='store_sources_content'>
                        <div class='store_sources_list'>
                            ${storeSources.map(source => `
                                <div class='store_source_item' data-url='${source}'>
                                    <div class='store_source_url' translate='none'>${source}</div>
                                    <div class='store_source_buttons'>
                                        <button class='delete_store_source' data-url='${source}'>
                                            <i class='iconfont icon-delete'></i>
                                        </button>
                                    </div>
                                </div>`).join('')}
                        </div>
                        <div class='add_store_source'>
                            <input type='text' id='new_store_source' placeholder='输入商店源...'>
                            <button id='add_store_source_btn'>
                                <i class='iconfont icon-add'></i>
                            </button>
                        </div>
                    </div>
                </div>

                <div class='plugin_management'>
                    <h3>Npplication 列表</h3> 
                    <div class='plugin_list_table'>`;

        // 生成插件列表
        for (const plugin of plugins) {
            html += `<div class='plugin_item ${plugin.type === "coreNpp" ? "coreNpp" : ""}'>
                <div class='plugin_info'>
                    <div class='plugin_icon'>
                        <img src='${plugin.icon}'>
                    </div>
                    <div class='plugin_text'>
                        <div class='plugin_name' translate='none'>${plugin.name}</div>
                        <div class='plugin_details'>
                            <span>版本: <span translate='none'>${plugin.version}</span></span>
                        </div>
                    </div>
                </div>
                <div class='plugin_actions' id='${plugin.id}'>
                    <button class='update_plugin' data-id='${plugin.id}'>
                    <i class="iconfont icon-refresh"></i>
                    </button>
                    <button class='uninstall_plugin' data-id='${plugin.id}'>
                    <i class="iconfont icon-delete"></i>
                    </button>
                </div>
            </div>`;
        }

        html += `</div></div>`;

        // 插入到页面
        const manageContent = document.querySelector('#manageContent');
        if (manageContent) {
            manageContent.innerHTML = html;
            requestAnimationFrame(() => {
                checkStoreContent('manageContent', plugins.length === 0);
            });
        }

        // 折叠/展开
        const toggleBtn = document.querySelector('.toggle_store_sources');
        const content = document.querySelector('.store_sources_content');
        if (toggleBtn && content) {
            // 默认折叠
            content.style.maxHeight = null;
            toggleBtn.innerHTML = '<i class="iconfont icon-folding"></i>';
            toggleBtn.addEventListener('click', () => {
                if (content.style.maxHeight) {
                    content.style.maxHeight = null;
                    toggleBtn.innerHTML = '<i class="iconfont icon-folding"></i>';
                } else {
                    content.style.maxHeight = content.scrollHeight + 'px';
                    toggleBtn.innerHTML = '<i class="iconfont icon-unfolding"></i>';
                }
            });
        }

        // 添加源
        const addBtn = document.getElementById('add_store_source_btn');
        if (addBtn) {
            addBtn.addEventListener('click', () => {
                const newSourceInput = document.getElementById('new_store_source');
                if (newSourceInput && newSourceInput.value.trim()) {
                    const newSource = newSourceInput.value.trim();
                    // 验证 URL
                    const urlRegex = /^https?:\/\/[^\s/$.?#].[^\s]*$/;
                    if (!urlRegex.test(newSource)) {
                        iziToast.show({
                            timeout: 2000,
                            message: 'URL 无效'
                        });
                        return;
                    }
                    // 获取当前商店源
                    let storeSources = JSON.parse(localStorage.getItem('storeSources')) || storeSourcesDefault;
                    // 检查是否重复
                    if (!storeSources.includes(newSource)) {
                        storeSources.push(newSource);
                        // 更新存储
                        localStorage.setItem('storeSources', JSON.stringify(storeSources));
                        // 重载
                        loadPluginManagementPage();
                        iziToast.show({
                            timeout: 2000,
                            message: '添加成功'
                        });
                    } else {
                        iziToast.show({
                            timeout: 2000,
                            message: '源已存在'
                        });
                    }
                    // 清空输入框
                    newSourceInput.value = '';
                } else {
                    iziToast.show({
                        timeout: 2000,
                        message: 'URL 无效'
                    });
                }
            });
        }

        // 删除
        document.querySelectorAll('.delete_store_source').forEach(button => {
            button.addEventListener('click', () => {
                const url = button.getAttribute('data-url');
                // 获取当前商店源
                let storeSources = JSON.parse(localStorage.getItem('storeSources')) || storeSourcesDefault;
                const newStoreSources = storeSources.filter(source => source !== url);
                if (newStoreSources.length === 0) {
                    iziToast.show({
                        timeout: 2000,
                        message: '至少保留一个商店源'
                    });
                    return;
                }
                // 更新存储
                localStorage.setItem('storeSources', JSON.stringify(newStoreSources));
                // 重载
                loadPluginManagementPage();
                iziToast.show({
                    timeout: 2000,
                    message: '删除成功'
                });
            });
        });

        // 绑定更新按钮事件
        document.querySelectorAll('.update_plugin').forEach(button => {
            button.addEventListener('click', async () => {
                const pluginId = button.dataset.id;
                if (!pluginId) {
                    iziToast.show({
                        timeout: 3000,
                        message: '未找到插件' + pluginId
                    });
                    return;
                }

                try {
                    iziToast.show({
                        id: 'checkUpdateToast',
                        message: '正在检查更新...'
                    });
                    // 调用更新检查函数
                    await checkUpdates(pluginId);
                } catch (error) {
                    iziToast.show({
                        timeout: 3000,
                        message: '检查更新时发生错误'
                    });
                    console.error('更新按钮点击事件错误:', error);
                }
            });
        });

        // 绑定卸载按钮事件
        document.querySelectorAll('.uninstall_plugin').forEach(button => {
            button.addEventListener('click', async () => {
                const pluginId = button.getAttribute('data-id');
                // 获取本地插件信息
                const localData = await getNpp({ "id": pluginId });
                if (!localData || !localData.metadata) {
                    console.error(`未知的Npp: ${pluginId}`);
                    return;
                }
                const localMetadata = localData.metadata;
                try {
                    if (localMetadata.type !== 'coreNpp') {
                        iziToast.show({
                            timeout: 8000,
                            message: '是否要卸载此插件吗?',
                            buttons: [
                                ['<button>确认</button>', async function (instance, toast) {
                                    instance.hide({
                                        transitionOut: 'flipOutX',
                                    }, toast, 'buttonName');
                                    // 核心插件禁止卸载
                                    if (localMetadata.type === 'coreNpp') {
                                        iziToast.show({
                                            timeout: 2000,
                                            message: `${localMetadata.name}不支持卸载`,
                                        });
                                        return;
                                    } else {
                                        // 移除localStorage元数据
                                        let plugins = JSON.parse(localStorage.getItem('npp_plugins') || '[]'); plugins = plugins.filter(p => p.id !== pluginId);
                                        localStorage.setItem('npp_plugins', JSON.stringify(plugins));
                                        // 删除indexedDB文件
                                        const request = indexedDB.open('nppstore');
                                        request.onsuccess = (event) => {
                                            const db = event.target.result;
                                            const transaction = db.transaction('Npp', 'readwrite');
                                            const store = transaction.objectStore('Npp');
                                            const deleteRequest = store.delete(pluginId);
                                            deleteRequest.onsuccess = () => {
                                                db.close();
                                                iziToast.show({
                                                    timeout: 3000,
                                                    message: '插件已卸载，刷新页面生效',
                                                    buttons: [
                                                        ['<button class="refresh-btn">刷新</button>', function (instance, toast) {
                                                            instance.hide({ transitionOut: 'flipOutX' }, toast, 'confirm');
                                                            window.location.reload(true);
                                                        }, true],
                                                        ['<button class="later-btn">稍后</button>', function (instance, toast) {
                                                            instance.hide({ transitionOut: 'flipOutX' }, toast, 'cancel');
                                                        }]
                                                    ]
                                                });
                                                loadPluginManagementPage();
                                            };
                                            deleteRequest.onerror = () => { db.close(); throw new Error('删除插件文件失败'); };
                                        };
                                        request.onerror = () => { throw new Error('打开数据库失败'); };
                                    }
                                }, true],
                                ['<button>取消</button>', function (instance, toast) {
                                    instance.hide({
                                        transitionOut: 'flipOutX',
                                    }, toast, 'buttonName');
                                }]
                            ]
                        });
                    }
                } catch (error) {
                    iziToast.show({ timeout: 8000, message: '卸载失败:' + error.message });
                }
            });
        });
    } catch (error) {
        console.error('加载插件管理页面失败:' + error);
        iziToast.show({ timeout: 8000, message: '加载插件管理页面失败' });
    }
}

function checkStoreContent(containerId = 'storeContent', isEmpty = false) {
    let div = document.getElementById(containerId);
    if (!div) return;

    // 移除已有提示
    const existingEmpty = div.querySelector('.storeContentEmpty');
    if (existingEmpty) {
        existingEmpty.remove();
    }

    var emptyState = isEmpty

    if (emptyState === true) {
        const tabElement = document.createElement('div');
        tabElement.className = 'tab-items storeContentEmpty';
        tabElement.innerHTML = `
            <div>
                <p>还未安装插件</p>
            </div>
        `;
        div.appendChild(tabElement);
    } else {
        const storeItem = div.querySelector('.storeContentEmpty');
        if (storeItem) {
            storeItem.remove();
        }
    }
}

// 商店源
const storeSourcesDefault = [
    'https://nfdb.nitai.us.kg/nitaiPage/store'
];

// 加载源
let storeSources = JSON.parse(localStorage.getItem('storeSources'));
if (!storeSources || !Array.isArray(storeSources) || storeSources.length === 0) {
    storeSources = storeSourcesDefault;
    localStorage.setItem('storeSources', JSON.stringify(storeSources));
}

async function loadStoreData() {
    try {
        const responses = await Promise.all(storeSources.map(url =>
            fetch(url)
                .then(res => res.json().then(data => ({ url, data })))
                .catch(err => {
                    console.error(`加载商店源 ${url} 失败:`, err);
                    return null;
                })
        ));

        const validData = responses.filter(data => data !== null);
        if (validData.length === 0) {
            console.error('没有可用的商店源数据');
            return;
        }

        const mergedData = mergeStoreData(validData);
        window.storeData = mergedData;
        renderStoreTabs(mergedData.category);
    } catch (error) {
        console.error('加载商店数据失败:', error);
    }
}

function mergeStoreData(sources) {
    const merged = { category: {} };

    sources.forEach(({ url, data }) => {
        // 合并分类
        if (data.category && data.category[0]) {
            Object.entries(data.category[0]).forEach(([key, name]) => {
                if (!merged.category[key]) merged.category[key] = name;
            });
        }

        // 合并插件
        Object.entries(data).forEach(([key, value]) => {
            if (key === 'category') return;
            if (!merged[key]) merged[key] = [];
            if (Array.isArray(value) && value[0] && typeof value[0] === 'object') {
                const plugins = Object.values(value[0]).map(plugin => ({
                    url: plugin.url,
                    screenshots: plugin.screenshots,
                    source: url
                }));
                merged[key].push(...plugins);
            }
        });
    });

    return merged;
}

function renderStoreTabs(categories) {
    const tabsContainer = document.getElementById('storeTabs');
    if (!tabsContainer) return;

    Object.entries(categories).forEach(([key, name]) => {
        const tab = document.createElement('div');
        tab.className = `tab-items`;
        tab.textContent = name;
        tab.dataset.category = key;

        tab.addEventListener('click', () => {
            document.querySelectorAll('#storeTabs .tab-items').forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            renderPlugins(window.storeData[key] || []);

            $('#storeContent').css('display', 'flex');
            $('#manageContent').css('display', 'none');
            $('.store-button').css('display', 'none');
        });

        tabsContainer.appendChild(tab);
    });
}

async function renderPlugins(pluginsArray) {
    const contentContainer = document.getElementById('storeContent');
    if (!contentContainer) return;
    contentContainer.innerHTML = '';

    pluginsArray.forEach(async (plugin) => {
        try {
            const metadata = await extractMetadata(plugin.url);
            const pluginWithMetadata = {
                ...plugin,
                ...(metadata || {}),
                dependencies: (metadata && metadata.dependencies) || ''
            };
            const cleanUrl = (url) => url.replace(/`/g, '').trim();

            const pluginItem = document.createElement('div');
            pluginItem.className = 'plugin-item';
            pluginItem.innerHTML = `
                    <img src="${cleanUrl(pluginWithMetadata.icon || '')}" alt="${pluginWithMetadata.name || '插件'}" class="plugin-icon">
                    <div class="plugin-info">
                        <strong translate="none">${pluginWithMetadata.name || 'Unknown'}</strong>
                        <p translate="none">${pluginWithMetadata.description || 'Unknown'}</p>
                    </div>
                `;

            contentContainer.appendChild(pluginItem);
            pluginItem.addEventListener('click', () => showPluginDetails(pluginWithMetadata));
        } catch (error) {
            console.error(`加载插件失败: ${plugin.url}`, error);
        }
    });
}

function showPluginDetails(pluginWithMetadata) {
    showContain_plugin();

    // 清理数据中的多余引号和空格
    const cleanUrl = (url) => url.replace(/`/g, '').trim();

    // 创建详情对话框
    const page = document.getElementById('storePage');
    const dialog = document.createElement('div');
    dialog.className = 'details-dialog';
    dialog.innerHTML = `
            <div class="dialog-content">
                <div class="plugin-detail-header">
                    <img src="${cleanUrl(pluginWithMetadata.icon)}" alt="${pluginWithMetadata.name}" class="detail-icon">
                        <div class="detail-title">
                            <h2 translate="none">${pluginWithMetadata.name || 'Unknown'}</h2>
                            <p>版本: <span translate="none">${pluginWithMetadata.version || 'Unknown'}</span> | 作者: <span translate="none">${pluginWithMetadata.author || 'Unknown'}</span></p>
                            <p translate="none">NID: ${pluginWithMetadata.id || 'Unknown'}</p>
                            <p>来源:<span translate="none"> ${pluginWithMetadata.source}</span></p>
                    </div>
                </div>
                <div class="plugin-detail-body">
                    <h3>描述</h3>
                    <p translate="none">${pluginWithMetadata.description}</p>
                    <h3>依赖</h3>
                    <div id="dependencies-container"></div>
                    <h3>截图</h3>
                    <div class="screenshots">
                        ${(() => {
            const screenshots = pluginWithMetadata.screen || pluginWithMetadata.screenshots || [];
            if (screenshots.length === 0) {
                return '<div class="no-screenshots">暂时没有截图</div>';
            }
            return (Array.isArray(screenshots) ? screenshots : [screenshots])
                .flatMap(shot => shot.toString().split(',').map(url => url.trim().replace(/[\[\]]/g, '')))
                .map(url => `
                                <a href="${url.trim().startsWith('http') ? url.trim() : cleanUrl(url)}" target="_blank"><img src="${url.trim().startsWith('http') ? url.trim() : cleanUrl(url)}" alt="截图" class="screenshot-img"></a>
                            `).join('');
        })()}
                    </div>
                </div>
            </div>
        `;

    const btn = document.createElement('div');
    btn.className = 'dialog-btn';
    btn.innerHTML = `
            <div class="dialog-cancel">返回</div>
            <div class="dialog-install" data-plugin-url="${cleanUrl(pluginWithMetadata.url)}">安装</div>
        `;

    // 依赖项详细页
    async function showDependencyDetailsDialog() {
        const dependencies = parseDependencies(pluginWithMetadata.dependencies || '');
        const dependenciesContainer = dialog.querySelector('#dependencies-container');
        const dependencyCheckResult = await renderDependencies(dependenciesContainer, dependencies, pluginWithMetadata.source || '');

        // 按钮
        const btn = document.createElement('div');
        btn.className = 'dialog-btn';

        // 检查插件状态
        const canInstall = dependencyCheckResult.status;

        btn.innerHTML = `
                <div class="dialog-cancel">返回</div>
                ${canInstall ? `<div class="dialog-install" data-plugin-url="${cleanUrl(pluginWithMetadata.url)}">安装</div>` : ''}
            `;

        btn.querySelector('.dialog-cancel').addEventListener('click', showContain_plugin);

        if (canInstall) {
            btn.querySelector('.dialog-install').addEventListener('click', function () {
                iziToast.show({
                    id: 'installToast',
                    message: '开始安装...'
                });
                installNpplication(this.dataset.pluginUrl);
            });
        }

        dialogContain.appendChild(dialog);
        dialogContain.appendChild(btn);
        page.appendChild(dialogContain);
    }

    const dialogContain = document.createElement('div');
    dialogContain.className = 'dialog-container';

    // 加载依赖项详细页
    showDependencyDetailsDialog().catch(error => {
        iziToast.show({
            timeout: 3000,
            message: '加载插件时出错'
        });
        showContain_plugin();
    });

    $('#storeTabs').css('display', 'none');
    $('.store-block').css('display', 'none');
}

var npp = npp || {}; // 定义一个命名空间

// 获取当前npp的元数据
async function getCurrentPluginMetadata() {
    try {
        const scriptUrl = document.currentScript.src;
        return await extractMetadata(scriptUrl);
    } catch (error) {
        console.error('获取当前插件元数据失败:', error);
        return undefined;
    }
}

// 初始化插件存储库
npp.init = function (pluginId) {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open('nppDB', 1);

        request.onupgradeneeded = (event) => {
            const db = event.target.result;
            if (!db.objectStoreNames.contains(pluginId)) {
                db.createObjectStore(pluginId, { keyPath: 'key' });
            }
        };

        request.onsuccess = (event) => {
            const db = event.target.result;
            db.close();
            resolve();
        };

        request.onerror = (event) => {
            console.error('插件存储数据库初始化失败:', event.target.error);
            reject(event.target.error);
        };
    })
}

/**
 * 存储数据到当前插件的存储空间
 * @param {string} key - 存储键名
 * @param {any} value - 存储值
 * @returns {Promise<boolean>} - 是否存储成功
 */
npp.set = async function (key, value) {
    const metadata = await getCurrentPluginMetadata();
    if (!metadata || !metadata.id) return false;

    try {
        await npp.init(metadata.id);
        return new Promise((resolve, reject) => {
            const request = indexedDB.open('nppDB');

            request.onsuccess = (event) => {
                const db = event.target.result;
                const transaction = db.transaction(metadata.id, 'readwrite');
                const store = transaction.objectStore(metadata.id);
                const putRequest = store.put({ key, value });

                putRequest.onsuccess = () => {
                    db.close();
                    resolve(true);
                };

                putRequest.onerror = () => {
                    console.error('存储插件数据失败:', putRequest.error);
                    db.close();
                    reject(false);
                };
            };

            request.onerror = (event) => {
                console.error('打开插件存储数据库失败:', event.target.error);
                reject(false);
            };
        });
    } catch (error) {
        console.error('设置插件存储失败:', error);
        return false;
    }
}

/**
 * 从当前插件的存储空间获取数据
 * @param {string} key - 存储键名
 * @returns {Promise<any>} - 存储的值或undefined
 */
npp.get = async function (key) {
    const metadata = await getCurrentPluginMetadata();
    if (!metadata || !metadata.id) return undefined;

    try {
        await npp.init(metadata.id);
        return new Promise((resolve, reject) => {
            const request = indexedDB.open('nppDB');

            request.onsuccess = (event) => {
                const db = event.target.result;
                const transaction = db.transaction(metadata.id, 'readonly');
                const store = transaction.objectStore(metadata.id);
                const getRequest = store.get(key);

                getRequest.onsuccess = () => {
                    db.close();
                    resolve(getRequest.result ? getRequest.result.value : undefined);
                };

                getRequest.onerror = () => {
                    console.error('获取插件数据失败:', getRequest.error);
                    db.close();
                    reject(undefined);
                };
            };

            request.onerror = (event) => {
                console.error('打开插件存储数据库失败:', event.target.error);
                reject(undefined);
            };
        });
    } catch (error) {
        console.error('获取插件存储失败:', error);
        return undefined;
    }
}

/**
 * 从当前插件的存储空间删除数据
 * @param {string} key - 存储键名
 * @returns {Promise<boolean>} - 是否删除成功
 */
npp.remove = async function (key) {
    const metadata = await getCurrentPluginMetadata();
    if (!metadata || !metadata.id) return false;

    try {
        await npp.init(metadata.id);
        return new Promise((resolve, reject) => {
            const request = indexedDB.open('nppDB');

            request.onsuccess = (event) => {
                const db = event.target.result;
                const transaction = db.transaction(metadata.id, 'readwrite');
                const store = transaction.objectStore(metadata.id);
                const deleteRequest = store.delete(key);

                deleteRequest.onsuccess = () => {
                    db.close();
                    resolve(true);
                };

                deleteRequest.onerror = () => {
                    console.error('删除插件数据失败:', deleteRequest.error);
                    db.close();
                    reject(false);
                };
            };

            request.onerror = (event) => {
                console.error('打开插件存储数据库失败:', event.target.error);
                reject(false);
            };
        });
    } catch (error) {
        console.error('删除插件存储失败:', error);
        return false;
    }
}