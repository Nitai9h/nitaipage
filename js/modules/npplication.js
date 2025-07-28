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
            forceUpdate: metadata.force || 'false', //如果为 false 则以通知形式弹出
        };
    } catch (error) {
        console.error(error);
        return;
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
        }

        fetch(url, { cache: 'no-store' })
            .then(response => {
                if (!response.ok) {
                    console.error(`HTTP错误: ${response.status} ${response.statusText}`);
                    reject();
                }
                return response.blob();
            })
            .then(blob => {
                const reader = new FileReader();
                reader.onload = () => {
                    // 数据库
                    const request = indexedDB.open(DB_NAME, 1);

                    request.onsuccess = (event) => {
                        const db = event.target.result;
                        const transaction = db.transaction(NPP_STORE, 'readwrite');
                        const store = transaction.objectStore(NPP_STORE);

                        // 存储文件
                        const putRequest = store.put({ id, content: reader.result });

                        putRequest.onsuccess = () => {
                            console.log('下载成功');
                            resolve();
                        };

                        putRequest.onerror = () => {
                            console.error('下载失败');
                            reject();
                        };
                    };
                };

                reader.onerror = () => {
                    console.error('文件读取失败');
                    reject();
                }
                reader.readAsArrayBuffer(blob);
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
            if (!metadata) { return; }
            // 从 indexDB 获取文件 URL
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
                        // indexDB 不存在则只返回 metadata
                        resolve({ metadata });
                    }
                };
            };
            request.onerror = (event) => {
                console.error('数据库打开失败: ' + event.target.error.message);
                reject();
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
async function checkUpdates(id) {
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
                if (remoteMetadata.forceUpdate == 'true') {
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
                    iziToast.hide({}, '#checkUpdateToast');
                    showRefreshDialog();
                } else {
                    await new Promise((resolve) => {
                        iziToast.show({
                            timeout: 8000,
                            title: '更新',
                            message: `插件 ${localMetadata.name} 有新版本 ${remoteMetadata.version} 可用，是否更新？`,
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
                        iziToast.hide({}, '#checkUpdateToast');
                    });
                }
            } else {
                // 使用Promise确保逐个显示提示
                if (info !== 'show') {
                    await new Promise((toastResolve) => {
                        iziToast.show({
                            timeout: 2000,
                            message: `插件 ${localMetadata.name} 已是最新版本 ${localMetadata.version}`,
                            onClosed: function () {
                                toastResolve();
                            }
                        });
                        iziToast.hide({}, '#checkUpdateToast');
                    });
                }
            }
        } catch (error) {
            console.error(`检查插件 ${pluginId} 更新失败:`, error);
            iziToast.show({
                timeout: 8000,
                message: `检查插件 ${pluginId} 更新时发生错误`
            });
            iziToast.hide({}, '#checkUpdateToast');
        }
    };

    if (id === 'all') {
        // 检查所有插件，使用顺序队列确保逐个询问
        const plugins = JSON.parse(localStorage.getItem('npp_plugins') || '[]');
        for (const plugin of plugins) {
            await checkSinglePluginUpdate(plugin.id, 'show');
        }
        // 检查完成
        iziToast.show({
            timeout: 2000,
            message: '所有 Npp 均已更新到最新版本或已提交更新申请'
        });
        iziToast.hide({}, '#checkUpdateToast');
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
    // 指定文件
    const coreNppFiles = [
        'themeColor.js'
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
                    loadTime(metadata.id, metadata.time);
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
    list.style.transition = 'all 0.3s ease';

    // 创建列表项
    const items = plugins.map(plugin => {
        const item = document.createElement('div');
        item.className = 'plugin-item';
        item.dataset.id = plugin.id;
        item.innerHTML = `
                <div class="drag-handle"></div>
                <div class="plugin-info">
                    <strong>${plugin.name}</strong>
                    <p>ID: ${plugin.id}</p>
                    <p>版本: ${plugin.version}</p>
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
    iziToast.hide({}, '#installToast');
    iziToast.show({
        timeout: 8000,
        message: `确定要覆盖安装插件"${metadata.name}"吗?`,
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
            iziToast.hide({}, '#installToast');
            return;
        }
        // 来源验证
        if (metadata.type === 'coreNpp' && !url.startsWith[
            'https://nfdb.nitai.us.kg/'
        ]) {
            console.warn('核心应用只能从指定源安装');
            iziToast.show({
                timeout: 2000,
                message: '安装失败'
            });
            iziToast.hide({}, '#installToast');
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
            iziToast.hide({}, '#installToast');
            return;
        }
        // 覆盖弹窗
        if (existing) {
            if (existing.version === metadata.version) {
                showUpdateDialog(metadata);
            }
        }
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
        iziToast.hide({}, '#installToast');
    } catch (error) {
        console.error(`安装失败: ${error.message}`);
        iziToast.show({
            timeout: 2000,
            message: '安装失败'
        });
        iziToast.hide({}, '#installToast');
    }
}