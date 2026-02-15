/*
作者: Nitai9h
Github：https://github.com/Nitai9h/npplicaiton
日期：2025-07-13
*/
const DB_NAME = 'nppstore';
const NPP_STORE = 'Npp';
const NITAI_PAGE_DB_NAME = 'nitaiPageDB';
const NITAI_PAGE_STORE = 'nitaiPage';
const NPP_DB_NAME = 'nppDB';

// HTML 转义
function escapeHtml(unsafe) {
    if (typeof unsafe !== 'string') return unsafe;
    return unsafe
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

function openIndexedDB(dbName, version, upgradeCallback) {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open(dbName, version);

        if (upgradeCallback) {
            request.onupgradeneeded = (event) => {
                upgradeCallback(event.target.result);
            };
        }

        request.onsuccess = (event) => {
            resolve(event.target.result);
        };

        request.onerror = (event) => {
            console.error(`打开数据库 ${dbName} 失败: ` + event.target.error.message);
            reject(event.target.error);
        };
    });
}

function getFromIndexedDB(dbName, storeName, key, version = 1) {
    return new Promise((resolve, reject) => {
        openIndexedDB(dbName, version).then(db => {
            const transaction = db.transaction(storeName, 'readonly');
            const store = transaction.objectStore(storeName);
            const request = store.get(key);

            request.onsuccess = () => {
                db.close();
                resolve(request.result);
            };

            request.onerror = () => {
                console.error(`从 ${storeName} 获取数据失败`);
                db.close();
                reject(request.error);
            };
        }).catch(error => {
            reject(error);
        });
    });
}

function putToIndexedDB(dbName, storeName, data, version = 1) {
    return new Promise((resolve, reject) => {
        openIndexedDB(dbName, version).then(db => {
            const transaction = db.transaction(storeName, 'readwrite');
            const store = transaction.objectStore(storeName);
            const request = store.put(data);

            request.onsuccess = () => {
                db.close();
                resolve();
            };

            request.onerror = () => {
                console.error(`保存数据到 ${storeName} 失败`);
                db.close();
                reject(request.error);
            };
        }).catch(error => {
            reject(error);
        });
    });
}

function deleteFromIndexedDB(dbName, storeName, key, version = 1) {
    return new Promise((resolve, reject) => {
        openIndexedDB(dbName, version).then(db => {
            const transaction = db.transaction(storeName, 'readwrite');
            const store = transaction.objectStore(storeName);
            const request = store.delete(key);

            request.onsuccess = () => {
                db.close();
                resolve();
            };

            request.onerror = () => {
                console.error(`从 ${storeName} 删除数据失败`);
                db.close();
                reject(request.error);
            };
        }).catch(error => {
            reject(error);
        });
    });
}

function countFromIndexedDB(dbName, storeName, version = 1) {
    return new Promise((resolve, reject) => {
        openIndexedDB(dbName, version).then(db => {
            const transaction = db.transaction(storeName, 'readonly');
            const store = transaction.objectStore(storeName);
            const request = store.count();

            request.onsuccess = () => {
                db.close();
                resolve(request.result);
            };

            request.onerror = () => {
                console.error(`统计 ${storeName} 数据失败`);
                db.close();
                reject(request.error);
            };
        }).catch(error => {
            reject(error);
        });
    });
}

// 添加加载遮罩层
function showLoadingOverlay() {
    if (window._currentDialogContent) {
        window._currentDialogContent.style.filter = 'blur(3px)';
    }

    const loadingOverlay = document.createElement('div');
    loadingOverlay.className = 'details-loading-overlay';
    loadingOverlay.innerHTML = `
        <div class="details-loading-spinner"></div>
        <div class="details-loading-text">@npplication:loading-text</div>
    `;

    if (window._currentDialogContain) {
        const dialog = window._currentDialogContain.querySelector('.details-dialog');
        if (dialog) {
            dialog.appendChild(loadingOverlay);
        }
    }
    return loadingOverlay;
}

// 隐藏加载遮罩层
function hideLoadingOverlay(loadingOverlay) {
    if (loadingOverlay && loadingOverlay.parentNode) {
        loadingOverlay.classList.add('fade-out');
        setTimeout(() => {
            if (loadingOverlay && loadingOverlay.parentNode) {
                loadingOverlay.remove();
            }
        }, 300);
    }
    if (window._currentDialogContent) {
        window._currentDialogContent.style.filter = '';
    }
}

// 隐藏指定 ID 的 toast
function hideToastById(toastId) {
    if ($(toastId).length) {
        iziToast.hide({}, toastId);
    }
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

npp.init = function (pluginId) {
    return new Promise((resolve, reject) => {
        openIndexedDB(NPP_DB_NAME, 1, (db) => {
            if (!db.objectStoreNames.contains(pluginId)) {
                db.createObjectStore(pluginId, { keyPath: 'key' });
            }
        }).then(db => {
            db.close();
            resolve();
        }).catch(error => {
            console.error('插件存储数据库初始化失败:', error);
            reject(error);
        });
    });
}

npp.set = async function (key, value) {
    const metadata = await getCurrentPluginMetadata();
    if (!metadata || !metadata.id) return false;

    try {
        await npp.init(metadata.id);
        return putToIndexedDB(NPP_DB_NAME, metadata.id, { key, value }, 1)
            .then(() => true)
            .catch(() => false);
    } catch (error) {
        console.error('设置插件存储失败:', error);
        return false;
    }
}

npp.get = async function (key) {
    const metadata = await getCurrentPluginMetadata();
    if (!metadata || !metadata.id) return undefined;

    try {
        await npp.init(metadata.id);
        return getFromIndexedDB(NPP_DB_NAME, metadata.id, key, 1)
            .then(result => result ? result.value : undefined)
            .catch(() => undefined);
    } catch (error) {
        console.error('获取插件存储失败:', error);
        return undefined;
    }
}

npp.remove = async function (key) {
    const metadata = await getCurrentPluginMetadata();
    if (!metadata || !metadata.id) return false;

    try {
        await npp.init(metadata.id);
        return deleteFromIndexedDB(NPP_DB_NAME, metadata.id, key, 1)
            .then(() => true)
            .catch(() => false);
    } catch (error) {
        console.error('删除插件存储失败:', error);
        return false;
    }
}

function cleanUrl(url) {
    // 清理URL中的反引号和空格
    return url.replace(/`/g, '').trim();
}

async function verifyJSUrl(url) {
    try {
        // 检查URL扩展名
        if (!url.endsWith('.js')) {
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
            return true;
        }

        // 进一步验证 (Range)
        const rangeResponse = await fetch(url, {
            method: 'GET',
            headers: { 'Range': 'bytes=0-1' },
            mode: 'cors',
            cache: 'no-cache'
        });

        // 检查 Content-Range
        const contentRange = rangeResponse.headers.get('content-range');
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
        ) {
            console.error('缺少必要元数据字段');
            return;
        }

        // 验证 translates
        if (metadata.type === 'translate' && !metadata.translates) {
            console.error('翻译插件缺少必要的 translates 字段');
            return;
        }

        // 验证 time
        if (metadata.type !== 'translate' && !metadata.time) {
            console.error('缺少必要的 time 字段');
            return;
        }

        // 验证 id 格式
        if (metadata.type !== 'coreNpp' && metadata.type !== 'translate') {
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
        if (metadata.type !== 'translate') {
            if (!metadata.time || !['head', 'body'].includes(metadata.time.toLowerCase())) {
                metadata.time = 'body'; // 默认
            }
        }

        // translate: 不解析关联项和依赖项
        const isTranslatePlugin = metadata.type === 'translate';

        return {
            name: metadata.name,
            id: metadata.id,
            version: metadata.version,
            updateUrl: metadata.updateUrl || url,
            description: metadata.description || '@npplication:no-description',
            author: metadata.author || '@npplication:no-author',
            type: metadata.type || '',
            time: isTranslatePlugin ? 'body' : metadata.time.toLowerCase(),
            icon: metadata.icon || 'https://nitai-images.pages.dev/nitaiPage/defeatNpp.svg',
            screen: metadata.screen || '',
            forceUpdate: metadata.forced || 'false',
            setting: metadata.setting || 'false',
            dependencies: isTranslatePlugin ? '' : (metadata.dependencies || ''),
            associations: isTranslatePlugin ? '' : (metadata.associations || ''),
            translates: metadata.translates || '',
        };
    } catch (error) {
        console.error(error);
        return;
    }
}

/**
 * 解析关系项字符串为对象
 * @param {string} relationStr - 关系项字符串
 * @param {string} type - 类型: 'dependencies'/'associations'/'translates'
 * @returns {Object} 关系项对象; 键为 URL,值为版本要求
 */
function parseRelationItems(relationStr, type) {
    try {
        const cleanStr = relationStr.trim().replace(/^\[|\]$/g, '');
        if (!cleanStr) {
            return {};
        }

        const entries = cleanStr.split(',').map(entry => entry.trim());
        const relations = {};

        entries.forEach(entry => {
            let match = entry.match(/`\s*([^`]+?)\s*`\s*:\s*`\s*([^`]+?)\s*`/);
            let url = null;
            let version = 'Latest';

            if (match && match.length >= 3) {
                url = match[1].trim().replace(/`/g, '');
                version = match[2].trim().replace(/`/g, '');
            } else {
                match = entry.match(/`\s*([^`]+?)\s*`/);
                if (match && match.length >= 2) {
                    url = match[1].trim().replace(/`/g, '');
                } else {
                    const typeNames = {
                        dependencies: '@npplication:dependencies',
                        associations: '@npplication:associations',
                        translates: '@npplication:translates'
                    };
                    console.warn(`无法解析的${typeNames[type]}:${entry}`);
                    return;
                }
            }

            relations[url] = version;
        });
        return relations;
    } catch (error) {
        const typeNames = {
            dependencies: '@npplication:dependencies',
            associations: '@npplication:associations',
            translates: '@npplication:translates'
        };
        console.error(`${typeNames[type]}解析失败:` + error);
        return {};
    }
}

function parseDependencies(dependenciesStr) {
    return parseRelationItems(dependenciesStr, 'dependencies');
}

function parseAssociations(associationsStr) {
    return parseRelationItems(associationsStr, 'associations');
}

function parseTranslates(translatesStr) {
    return parseRelationItems(translatesStr, 'translates');
}

// 检查关联项或依赖项是否满足要求
async function checkRelationItems(relations, type) {
    if (!relations || Object.keys(relations).length === 0) {
        return type === 'dependencies' ? { status: true, details: {} } : { details: {} };
    }

    try {
        const plugins = await getPluginsList();
        const details = {};
        let allSatisfied = true;

        for (const [url, requiredVersion] of Object.entries(relations)) {
            try {
                const metadata = await extractMetadata(url);
                if (!metadata || !metadata.id) {
                    const typeNames = {
                        dependencies: '@npplication:dependencies',
                        associations: '@npplication:associations',
                        translates: '@npplication:translates'
                    };
                    console.error(`无法获取${typeNames[type]}有效元数据:` + url);
                    details[url] = { status: 'failed', message: `@npplication:get-details-failed ${typeNames[type]}` };
                    if (type === 'dependencies') allSatisfied = false;
                    continue;
                }

                let actualRequiredVersion = requiredVersion;
                if (requiredVersion.toLowerCase() === 'latest') {
                    actualRequiredVersion = metadata.version;
                }

                const installedPlugin = plugins.find(p => p.id === metadata.id);
                if (!installedPlugin) {
                    const typeNames = {
                        dependencies: '@npplication:dependencies',
                        associations: '@npplication:associations',
                        translates: '@npplication:translates'
                    };
                    const messages = {
                        dependencies: '@npplication:not-installed',
                        associations: '@npplication:can-install',
                        translates: '@npplication:can-install'
                    };
                    details[url] = {
                        status: 'not_installed',
                        message: messages[type],
                        requiredVersion: requiredVersion,
                        metadata: metadata
                    };
                    if (type === 'dependencies') allSatisfied = false;
                    continue;
                }

                const versionCompare = compareVersions(installedPlugin.version, actualRequiredVersion);

                if (versionCompare < 0) {
                    const typeNames = {
                        dependencies: '@npplication:dependencies',
                        associations: '@npplication:associations',
                        translates: '@npplication:translates'
                    };
                    const messages = {
                        dependencies: '@npplication:need-update',
                        associations: '@npplication:has-newer',
                        translates: '@npplication:has-newer'
                    };
                    details[url] = {
                        status: 'version_mismatch',
                        message: messages[type],
                        installedVersion: installedPlugin.version,
                        requiredVersion: requiredVersion,
                        metadata: metadata
                    };
                    if (type === 'dependencies') allSatisfied = false;
                } else {
                    details[url] = {
                        status: 'satisfied',
                        message: '@npplication:installed',
                        installedVersion: installedPlugin.version,
                        requiredVersion: requiredVersion,
                        metadata: metadata
                    };
                }
            } catch (error) {
                const typeNames = {
                    dependencies: '@npplication:dependencies',
                    associations: '@npplication:associations',
                    translates: '@npplication:translates'
                };
                console.error(`检查${typeNames[type]}失败:` + url, error);
                details[url] = { status: 'failed', message: `@npplication:check-failed ${typeNames[type]}` };
                if (type === 'dependencies') allSatisfied = false;
            }
        }

        return type === 'dependencies' ? { status: allSatisfied, details: details } : { details: details };
    } catch (error) {
        const typeNames = {
            dependencies: '@npplication:dependencies',
            associations: '@npplication:associations',
            translates: '@npplication:translates'
        };
        console.error(`${typeNames[type]}检查过程中发生错误:`, error);
        return type === 'dependencies' ? { status: false, details: {} } : { details: {} };
    }
}

async function checkDependencies(dependencies) {
    return checkRelationItems(dependencies, 'dependencies');
}

async function checkAssociations(associations) {
    return checkRelationItems(associations, 'associations');
}

async function checkTranslates(translates) {
    return checkRelationItems(translates, 'translates');
}

// 渲染关联项
async function renderRelationItems(container, relations, type, source = '') {
    if (!relations || Object.keys(relations).length === 0) {
        container.innerHTML = '';
        return type === 'dependencies' ? { status: true, details: {}, hasContent: false } : { details: {}, hasContent: false };
    }

    try {
        const checkResult = type === 'dependencies' ? await checkDependencies(relations) :
            type === 'associations' ? await checkAssociations(relations) : await checkTranslates(relations);
        const details = checkResult.details;

        let html = '<div class="plugin-relation-list">';
        if (Object.keys(details).length > 0) {
            const typeNames = {
                dependencies: '@npplication:dependencies',
                associations: '@npplication:associations',
                translates: '@npplication:translates'
            };
            const versionLabels = {
                dependencies: '@npplication:required-version',
                associations: '@npplication:recommended-version',
                translates: '@npplication:installed-version'
            };

            if (type === 'translates') {
                const hasAnyInstalled = Object.values(details).some(d => d.status === 'satisfied');
                if (hasAnyInstalled) {
                    html += `
                    <div class="translate-installed-hint"><i class="iconfont icon-wrong"></i>@npplication:installed-translate-desc</div>
                    `;
                }
            }

            for (const [url, itemDetails] of Object.entries(details)) {
                const metadata = itemDetails.metadata || {};
                const isInstalled = itemDetails.status === 'satisfied';
                const isDisabled = type === 'translates' && Object.values(details).some(d => d.status === 'satisfied') && !isInstalled;

                const statusClass =
                    itemDetails.status === 'satisfied' ? 'satisfied' :
                        itemDetails.status === 'version_mismatch' ? (type === 'dependencies' ? 'warning' : 'info') :
                            itemDetails.status === 'not_installed' ? (type === 'dependencies' ? 'error' : 'info') : 'failed';

                html += `
                    <div class="plugin-item plugin-relation-item ${statusClass}" data-url="${url}" ${isDisabled ? 'data-disabled="true"' : ''}>
                        <img src="${metadata.icon || 'https://nitai-images.pages.dev/nitaiPage/defeatNpp.svg'}" alt="${metadata.name || typeNames[type]}" class="plugin-icon">
                        <div class="plugin-info">
                            <strong translate="none">${metadata.name || url}</strong>
                            ${type === 'translates' ? `<p translate="none">${metadata.translates}</p>` : `
                            <div class="detail-source">
                                <p>${versionLabels[type]}: <span translate="none">${itemDetails.requiredVersion || 'Latest'}</span>
                                <span translate="none">${itemDetails.installedVersion ? `<p class="sourceNonCritical">|</p> <p>@npplication:installed: <span translate="none">${itemDetails.installedVersion}</span></p>` : ''}</p>
                            </div>
                            `}
                            ${isInstalled && type === 'translates' ? '<div class="translate-installed-text">@npplication:installed</div>' : ''}
                            ${type !== 'translates' ? `<p class="status">${itemDetails.message}</p>` : ''}
                        </div>
                    </div>
                `;
            }
        }
        html += '</div>';
        container.innerHTML = html;

        const errorMessages = {
            dependencies: '@npplication:check-failed-dependencies',
            associations: '@npplication:check-failed-associations',
            translates: '@npplication:check-failed-translates'
        };

        container.querySelectorAll('.plugin-relation-item').forEach(item => {
            const isDisabled = item.dataset.disabled === 'true';

            if (isDisabled) {
                item.style.pointerEvents = 'none';
                item.style.opacity = '0.6';
            } else {
                item.addEventListener('click', async () => {
                    const itemUrl = item.dataset.url;
                    const loadingOverlay = showLoadingOverlay();

                    try {
                        const metadata = await extractMetadata(itemUrl);
                        if (metadata) {
                            showPluginDetails({ url: itemUrl, ...metadata, source: source });
                        }
                    } catch (error) {
                        console.error(`${errorMessages[type]}:` + error);
                        hideLoadingOverlay(loadingOverlay);
                        iziToast.show({
                            timeout: 3000,
                            message: errorMessages[type]
                        });
                    }
                });
            }
        });

        return { ...checkResult, hasContent: Object.keys(details).length > 0 };
    } catch (error) {
        console.error(`渲染${type === 'dependencies' ? '依赖项' : type === 'associations' ? '关联项' : '翻译项'}失败:`, error);
        container.innerHTML = '';
        return type === 'dependencies' ? { status: false, details: {}, hasContent: false } : { details: {}, hasContent: false };
    }
}

async function renderDependencies(container, dependencies, source = '') {
    return renderRelationItems(container, dependencies, 'dependencies', source);
}

async function renderAssociations(container, associations, source = '') {
    return renderRelationItems(container, associations, 'associations', source);
}

async function renderTranslates(container, translates, source = '') {
    return renderRelationItems(container, translates, 'translates', source);
}

/**
* 从 indexedDB 获取插件列表
* @returns {Promise<Array>} 插件列表
*/
function getPluginsList() {
    return new Promise((resolve, reject) => {
        openIndexedDB(NITAI_PAGE_DB_NAME, 2, (db) => {
            if (!db.objectStoreNames.contains(NITAI_PAGE_STORE)) {
                db.createObjectStore(NITAI_PAGE_STORE, { keyPath: 'id' });
            }
        }).then(db => {
            const transaction = db.transaction(NITAI_PAGE_STORE, 'readonly');
            const store = transaction.objectStore(NITAI_PAGE_STORE);
            const getRequest = store.get('npp_plugins');

            getRequest.onsuccess = () => {
                const result = getRequest.result;
                let plugins = result ? result.data : null;

                if (plugins === null) {
                    try {
                        const localStorageData = localStorage.getItem('npp_plugins');
                        if (localStorageData) {
                            plugins = JSON.parse(localStorageData);
                            putToIndexedDB(NITAI_PAGE_DB_NAME, NITAI_PAGE_STORE, { id: 'npp_plugins', data: plugins }, 2)
                                .then(() => {
                                    console.log('已从 localStorage 加载并迁移插件列表');
                                    db.close();
                                    resolve(plugins);
                                })
                                .catch(() => {
                                    console.warn('已从 localStorage 加载插件列表, 但数据迁移失败');
                                    db.close();
                                    resolve(plugins);
                                });
                        } else {
                            plugins = [];
                            db.close();
                            resolve(plugins);
                        }
                    } catch (error) {
                        console.error('从 localStorage 读取插件列表失败:' + error);
                        plugins = [];
                        db.close();
                        resolve(plugins);
                    }
                } else {
                    db.close();
                    resolve(plugins);
                }
            };

            getRequest.onerror = () => {
                console.error('获取插件列表失败');
                db.close();
                reject();
            };
        }).catch(error => {
            console.error('打开数据库失败: ' + error.message);
            try {
                const localStorageData = localStorage.getItem('npp_plugins');
                const plugins = localStorageData ? JSON.parse(localStorageData) : [];
                resolve(plugins);
            } catch (error) {
                console.error('从 localStorage 读取插件列表失败:' + error);
                resolve([]);
            }
        });
    });
}

function savePluginsList(plugins) {
    return putToIndexedDB(NITAI_PAGE_DB_NAME, NITAI_PAGE_STORE, { id: 'npp_plugins', data: plugins }, 2);
}

/**
* 保存元数据
* @param {Object} metadata - 元数据
*/
function savePluginMetadata(metadata) {
    return new Promise(async (resolve, reject) => {
        try {
            // 验证metadata有效性
            if (!metadata || typeof metadata !== 'object' || !metadata.id) {
                console.error('无效的插件: 缺少必要的 ID 字段');
                reject();
                return;
            }

            // 获取列表
            let plugins;
            try {
                plugins = await getPluginsList();
            } catch (error) {
                console.error('获取插件列表失败:', error);
                reject();
                return;
            }

            if (!Array.isArray(plugins)) {
                console.error('插件数据格式无效，预期为数组');
                reject();
                return;
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
            try {
                await savePluginsList(plugins);
                resolve();
            } catch (error) {
                console.error('保存插件元数据失败:', error);
                reject();
            }
        } catch (error) {
            console.error('保存插件元数据失败:', error.message);
            reject();
        }
    });
}

/**
* 下载并保存 NPP
* @param {string} id
* @param {string} url
*/
function saveJSFile(id, url) {
    return new Promise((resolve, reject) => {
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
                putToIndexedDB(DB_NAME, NPP_STORE, { id, content })
                    .then(() => {
                        console.log('下载成功');
                        resolve();
                    })
                    .catch(() => {
                        console.error('下载失败');
                        reject();
                    });
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
            const plugins = await getPluginsList();
            const metadata = plugins.find(p => p.id === option.id);
            if (!metadata) {
                console.error('未找到元数据: ' + option.id);
                reject('未找到元数据');
                return;
            }

            openIndexedDB(DB_NAME, 1).then(db => {
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
                        console.warn('在 indexedDB 内未找到内容' + option.id);
                        resolve({ metadata });
                    }
                    db.close();
                };

                getRequest.onerror = () => {
                    console.error('获取文件内容失败');
                    db.close();
                    reject('获取文件内容失败');
                };
            }).catch(error => {
                console.error('数据库打开失败: ' + error.message);
                reject('数据库打开失败');
            });
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
* @returns {Promise}
*/
async function loadTime(id, time) {
    function addScript(url, resolve, reject) {
        const existingScript = document.querySelector(`script[data-npp-id="${id}"]`);
        if (existingScript) {
            existingScript.src = url;
            resolve();
        } else {
            const script = document.createElement('script');
            script.src = url;
            script.type = 'text/javascript';
            script.dataset.nppId = id;
            script.onload = () => resolve();
            script.onerror = () => reject(new Error(`加载插件 ${id} 失败`));

            if (time === 'head') {
                document.head.appendChild(script);
            } else if (time === 'body') {
                document.body.appendChild(script);
            } else {
                reject(new Error('加载时机无效'));
            }
        }
    }
    return new Promise((resolve, reject) => {
        getNpp({ id })
            .then(({ url }) => {
                addScript(url, resolve, reject);
            })
            .catch(error => {
                console.error('获取插件失败:', error);
                reject(error);
            });
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
                        title: '@npplication:auto-update',
                        message: `${localMetadata.name} @npplication:installed-latest-version-desc ${remoteMetadata.version}`,
                    });
                    hideToastById('#checkUpdateToast');
                    showRefreshDialog();
                } else {
                    await new Promise((resolve) => {
                        iziToast.show({
                            timeout: 8000,
                            title: '@npplication:update',
                            message: `${localMetadata.name} @npplication:has-new-version-desc ${remoteMetadata.version}`,
                            buttons: [
                                ['<button>@npplication:update</button>', async function (instance, toast) {
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
                                        title: '@npplication:update',
                                        message: `${localMetadata.name} @npplication:installed-version-desc ${remoteMetadata.version}`
                                    });
                                    resolve();
                                    showRefreshDialog();
                                }, true],
                                ['<button>@npplication:dont-ask-to-update</button>', function (instance, toast) {
                                    instance.hide({ transitionOut: 'flipOutX' }, toast, 'noUpdate');
                                    // 保存用户选择：不再提示更新
                                    savePluginMetadata({
                                        ...localMetadata,
                                        ignoreUpdatePrompt: true
                                    });
                                    resolve();
                                }],
                                ['<button>@global:toast-later</button>', function (instance, toast) {
                                    instance.hide({ transitionOut: 'flipOutX' }, toast, 'cancel');
                                    resolve();
                                }]
                            ],
                            onClosed: function () {
                                resolve();
                            }
                        });
                        hideToastById('#checkUpdateToast');
                    });
                }
            } else {
                if (info !== 'hide') {
                    await new Promise((toastResolve) => {
                        iziToast.show({
                            timeout: 2000,
                            message: `${localMetadata.name} @npplication:installed-latest-version-desc ${localMetadata.version}`,
                            onClosed: function () {
                                toastResolve();
                            }
                        });
                        hideToastById('#checkUpdateToast');
                    });
                }
            }
        } catch (error) {
            console.error(`检查插件 ${pluginId} 更新失败:`, error);
            iziToast.show({
                timeout: 8000,
                message: `${localMetadata.name} @npplication:check-update-error-desc`
            });
            hideToastById('#checkUpdateToast');
        }
    };

    if (id === 'all') {
        const plugins = await getPluginsList();
        for (const plugin of plugins) {
            await checkSinglePluginUpdate(plugin.id, 'hide');
        }
        if (info === 'show') {
            iziToast.show({
                timeout: 2000,
                message: `@npplication:all-updated-desc`
            });
        }
        hideToastById('#checkUpdateToast');
    } else {
        // 检查单个插件
        await checkSinglePluginUpdate(id);
    }
}

async function loadNpp() {
    const plugins = await getPluginsList(); // 获取插件列表
    const loadPromises = plugins
        .filter(plugin =>
            plugin.id
            && plugin.time
            && plugin.type !== 'coreNpp') // 排除核心插件
        .map(plugin => loadTime(plugin.id, plugin.time));

    await Promise.all(loadPromises);
}

async function initCoreNpp() {
    const coreNppDir = './js/coreNpp/';
    var coreNppFiles = [
        'themeColor.js',
        'advancedSettings.js',
        'customStyle.js',
        'i18n.js'
    ];

    for (const fileName of coreNppFiles) {
        const pluginUrl = `${coreNppDir}${fileName}`;
        try {
            const metadata = await extractMetadata(pluginUrl);
            if (metadata.type !== 'coreNpp') { // 跳过非核心插件
                console.warn(`File ${fileName} is not a coreNpp plugin`);
                continue;
            }
            const storedPlugins = await getPluginsList(); // 获取已存储的插件列表
            const existingPlugin = storedPlugins.find(p => p.id === metadata.id);

            if (existingPlugin) {
                if (compareVersions(existingPlugin.version, metadata.version) > 0) {
                    const scriptTag = document.querySelector(`script[src*="${fileName}"]`);
                    if (scriptTag) {
                        const { url } = await getNpp({ id: metadata.id });
                        scriptTag.src = url;
                    }
                }
            } else {
                await savePluginMetadata(metadata);
            }
        } catch (error) {
            console.error('加载核心应用失败:', error);
        }
    }
}

// 从 IndexedDB 统计插件数量
function getNum() {
    return countFromIndexedDB(DB_NAME, NPP_STORE, 1);
}

function initializaNppDB() {
    return new Promise((resolve, reject) => {
        openIndexedDB(DB_NAME, 1, (db) => {
            if (!db.objectStoreNames.contains(NPP_STORE)) {
                db.createObjectStore(NPP_STORE, { keyPath: 'id' });
            }
        }).then(db => {
            if (!db.objectStoreNames.contains(NPP_STORE)) {
                console.error('缺少必要的对象存储: ' + NPP_STORE);
                db.close();
                reject();
                return;
            }
            db.close();
            resolve();
        }).catch(error => {
            console.error('数据库初始化失败: ' + error.message);
            reject();
        });
    });
}

// 拖动排序配置页面
async function showOrderConfigDialog() {
    const storePage = document.getElementById('storePage');
    const plugins = await getPluginsList();
    if (plugins.filter(plugin => plugin.id !== 'i18n').length === 0) {
        console.error('没有可配置的插件');
        iziToast.show({
            timeout: 2000,
            message: '@npplication:no-configurable-plugins-desc'
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
    const items = plugins.filter(plugin => plugin.id !== 'i18n').map(plugin => {
        const item = document.createElement('div');
        item.className = 'plugin-item';
        item.dataset.id = plugin.id;

        const dragHandle = document.createElement('div');
        dragHandle.className = 'drag-handle';

        const pluginInfo = document.createElement('div');
        pluginInfo.className = 'plugin-info';

        const nameStrong = document.createElement('strong');
        nameStrong.setAttribute('translate', 'none');
        $(nameStrong).text(plugin.name);

        const nidParagraph = document.createElement('p');
        nidParagraph.innerHTML = 'NID: ';
        const nidSpan = document.createElement('span');
        nidSpan.setAttribute('translate', 'none');
        $(nidSpan).text(plugin.id);
        nidParagraph.appendChild(nidSpan);

        const versionParagraph = document.createElement('p');
        versionParagraph.innerHTML = '@npplication:version: ';
        const versionSpan = document.createElement('span');
        versionSpan.setAttribute('translate', 'none');
        $(versionSpan).text(plugin.version);
        versionParagraph.appendChild(versionSpan);

        pluginInfo.appendChild(nameStrong);
        pluginInfo.appendChild(nidParagraph);
        pluginInfo.appendChild(versionParagraph);

        item.appendChild(dragHandle);
        item.appendChild(pluginInfo);

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
    saveBtn.textContent = '@npplication:save';
    const cancelBtn = document.createElement('button');
    cancelBtn.className = 'store-order-cancel';
    cancelBtn.textContent = '@npplication:cancel';

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
    saveBtn.addEventListener('click', async () => {
        // 收集排序
        const newOrder = Array.from(list.querySelectorAll('.plugin-item')).map(
            item => item.dataset.id
        );
        // 更新排序
        const updatedPlugins = await getPluginsList();
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
            plugin => !newOrder.includes(plugin.id) && plugin.id !== 'i18n'
        );
        // 将 i18n 放在最后
        const i18nPlugin = updatedPlugins.find(plugin => plugin.id === 'i18n');
        const finalPlugins = [...orderedPlugins, ...remainingPlugins];
        if (i18nPlugin) {
            finalPlugins.push(i18nPlugin);
        }
        // 保存至indexedDB
        await savePluginsList(finalPlugins);
        // 关闭对话框
        storePage.removeChild(dialog);
        $('#storeTabs').css('display', 'flex');
        $('.store-block').css('display', 'flex');

        // 刷新提示
        showRefreshDialog();
    });
}

function showRefreshDialog() {
    iziToast.show({
        timeout: 4000,
        message: '@npplication:install-success-desc',
        buttons: [
            ['<button class="refresh-btn">@global:toast-refresh</button>', function (instance, toast) {
                instance.hide({ transitionOut: 'flipOutX' }, toast, 'confirm');
                window.location.reload(true);
            }, true],
            ['<button class="later-btn">@global:toast-later</button>', function (instance, toast) {
                instance.hide({ transitionOut: 'flipOutX' }, toast, 'cancel');
            }]
        ]
    });
}

function showUpdateDialog(metadata) {
    hideToastById('#installToast');
    iziToast.show({
        timeout: 8000,
        message: `@npplication:are-you-sure-to-cover-version"${metadata.name}"?`,
        buttons: [
            ['<button class="confirm-btn">@global:toast-ok</button>', async function (instance, toast) {
                instance.hide({ transitionOut: 'flipOutX' }, toast, 'confirm');
                try {
                    await saveJSFile(metadata.id, metadata.updateUrl);
                    await savePluginMetadata({
                        ...metadata,
                        ignoreUpdatePrompt: false
                    });
                    showRefreshDialog();
                } catch (error) {
                    console.error('覆盖失败:' + error.message);
                    iziToast.show({
                        timeout: 3000,
                        message: '@npplication:cover-fail'
                    });
                }
            }, true],
            ['<button class="cancel-btn">@global:toast-cancel</button>', function (instance, toast) {
                instance.hide({ transitionOut: 'flipOutX' }, toast, 'cancel');
            }]
        ]
    });
}

async function installNpplication(url) {
    try {
        const { metadata } = await getNpp({ url });
        if (!await verifyJSUrl(url)) {
            console.error('无效的JS文件URL:' + url);
            iziToast.show({
                timeout: 2000,
                message: '@npplication:install-fail'
            });
            hideToastById('#installToast');
            return;
        }

        const dependencies = parseDependencies(metadata.dependencies || '');
        const dependencyCheckResult = await checkDependencies(dependencies);

        if (metadata.type !== 'translate' && !dependencyCheckResult.status) {
            hideToastById('#installToast');
            return;
        }
        let isAllowedCoreSource = false;
        try {
            const parsedUrl = new URL(url);
            isAllowedCoreSource =
                parsedUrl.protocol === 'https:' &&
                parsedUrl.hostname === 'nfdb.nitai.us.kg';
        } catch (e) {
            isAllowedCoreSource = false;
        }
        if (metadata.type === 'coreNpp' && !isAllowedCoreSource) {
            console.warn('核心应用只能从指定源安装');
            iziToast.show({
                timeout: 2000,
                message: '@npplication:install-fail'
            });
            hideToastById('#installToast');
            return;
        }

        const plugins = await getPluginsList();
        const existing = plugins.find(p => p.id === metadata.id);
        if (metadata.type === 'coreNpp' && !existing) {
            console.warn('核心应用禁止安装');
            iziToast.show({
                timeout: 2000,
                message: '@npplication:install-fail'
            });
            hideToastById('#installToast');
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
                    message: '@npplication:installing'
                });
                checkUpdates(metadata.id);
            }
        } else {
            if (!['head', 'body'].includes(metadata.time)) {
                console.error('无有效的加载时机');
                return;
            }
            await savePluginMetadata(metadata);
            await saveJSFile(metadata.id, url);
            showRefreshDialog();
            hideToastById('#installToast');
        }
    } catch (error) {
        console.error(`安装失败: ${error.message}`);
        iziToast.show({
            timeout: 2000,
            message: '@npplication:install-fail'
        });
        hideToastById('#installToast');
    }
}

// 插件管理页面加载函数
async function loadPluginManagementPage() {
    try {
        const plugins = await getPluginsList();
        // 获取商店源
        let storeSources = JSON.parse(localStorage.getItem('storeSources')) || storeSourcesDefault;

        let html = `<div class='store_sources_management'>
                    <div class='store_sources_header'>
                        <h3>@npplication:store-sources-management</h3>
                        <button class='toggle_store_sources'>
                            <i class='iconfont icon-folding'></i>
                        </button>
                    </div>
                    <div class='store_sources_content'>
                        <div class='store_sources_list'>
                            ${storeSources.map(source => `
                                <div class='store_source_item' data-url='${escapeHtml(source)}'>
                                    <div class='store_source_url' translate='none'>${escapeHtml(source)}</div>
                                    <div class='store_source_buttons'>
                                        <button class='delete_store_source' data-url='${escapeHtml(source)}'>
                                            <i class='iconfont icon-delete'></i>
                                        </button>
                                    </div>
                                </div>`).join('')}
                        </div>
                        <div class='add_store_source'>
                            <input type='text' id='new_store_source' placeholder='@npplication:store-sources-management-placeholder'>
                            <button id='add_store_source_btn'>
                                <i class='iconfont icon-add'></i>
                            </button>
                        </div>
                    </div>
                </div>

                <div class='plugin_management'>
                    <div class='plugin_management_header'>
                        <h3>Npplications</h3>
                        <button class='toggle_plugin_list'>
                            <i class='iconfont icon-unfolding'></i>
                        </button>
                    </div>
                    <div class='plugin_list_table expanded'>`;

        // 生成插件列表
        for (const plugin of plugins.filter(p => p.type !== 'translate')) {
            html += `<div class='plugin_item ${plugin.type === "coreNpp" ? "coreNpp" : ""}'>
                <div class='plugin_info'>
                    <div class='plugin_icon'>
                        <img src='${escapeHtml(plugin.icon)}'>
                    </div>
                    <div class='plugin_text'>
                        <div class='plugin_name' translate='none'>${escapeHtml(plugin.name)}</div>
                        <div class='plugin_details'>
                            <span>@npplication:version: <span translate='none'>${escapeHtml(plugin.version)}</span></span>
                        </div>
                    </div>
                </div>
                <div class='plugin_actions' id='${escapeHtml(plugin.id)}'>
                    <button class='update_plugin' data-id='${escapeHtml(plugin.id)}'>
                    <i class="iconfont icon-refresh"></i>
                    </button>
                    <button class='uninstall_plugin' data-id='${escapeHtml(plugin.id)}'>
                    <i class="iconfont icon-delete"></i>
                    </button>
                </div>
            </div>`;
        }

        html += `</div>`;

        // 生成翻译项列表
        const translatePlugins = plugins.filter(p => p.type === 'translate');
        if (translatePlugins.length > 0) {
            html += `
                    <div class='plugin_management_header'>
                        <h3>@npplication:installed-translate-plugins</h3>
                        <button class='toggle_translate_list'>
                            <i class='iconfont icon-folding'></i>
                        </button>
                    </div>
                    <div class='plugin_list_table'>`;

            for (const plugin of translatePlugins) {
                html += `<div class='plugin_item translate-plugin'>
                    <div class='plugin_info'>
                        <div class='plugin_icon'>
                            <img src='${escapeHtml(plugin.icon)}'>
                        </div>
                        <div class='plugin_text'>
                            <div class='plugin_name' translate='none'>${escapeHtml(plugin.name)}</div>
                            <div class='plugin_details'>
                                <span>@npplication:version: <span translate='none'>${escapeHtml(plugin.version)}</span></span>
                            </div>
                        </div>
                    </div>
                    <div class='plugin_actions' id='${escapeHtml(plugin.id)}'>
                        <button class='update_plugin' data-id='${escapeHtml(plugin.id)}'>
                            <i class="iconfont icon-refresh"></i>
                        </button>
                        <button class='uninstall_plugin' data-id='${escapeHtml(plugin.id)}'>
                            <i class="iconfont icon-delete"></i>
                        </button>
                    </div>
                </div>`;
            }

            html += `</div>`;
        }

        html += `</div></div>`;

        // 插入到页面
        const manageContent = document.querySelector('#manageContent');
        if (manageContent) {
            manageContent.innerHTML = html;
            requestAnimationFrame(() => {
                checkStoreContent('manageContent', plugins.length === 0);

                // Npplication 列表折叠
                const $togglePluginBtn = $('.toggle_plugin_list', manageContent);
                const $pluginContent = $('.plugin_list_table', manageContent).first();
                if ($togglePluginBtn.length && $pluginContent.length) {
                    $togglePluginBtn.on('click', function () {
                        $pluginContent.toggleClass('expanded');
                        const isExpanded = $pluginContent.hasClass('expanded');
                        $(this).html(isExpanded ? '<i class="iconfont icon-unfolding"></i>' : '<i class="iconfont icon-folding"></i>');
                    });
                }

                // translates 列表折叠
                const $toggleTranslateBtn = $('.toggle_translate_list', manageContent);
                const $translateContent = $('.plugin_list_table', manageContent).last();
                if ($toggleTranslateBtn.length && $translateContent.length) {
                    // 默认不展开
                    $translateContent.removeClass('expanded');
                    $toggleTranslateBtn.html('<i class="iconfont icon-folding"></i>');
                    $toggleTranslateBtn.on('click', function () {
                        $translateContent.toggleClass('expanded');
                        const isExpanded = $translateContent.hasClass('expanded');
                        $(this).html(isExpanded ? '<i class="iconfont icon-unfolding"></i>' : '<i class="iconfont icon-folding"></i>');
                    });
                }
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
                            message: '@npplication:invalid-url'
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
                            message: '@npplication:add-success'
                        });
                    } else {
                        iziToast.show({
                            timeout: 2000,
                            message: '@npplication:source-exists'
                        });
                    }
                    // 清空输入框
                    newSourceInput.value = '';
                } else {
                    iziToast.show({
                        timeout: 2000,
                        message: '@npplication:invalid-url'
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
                        message: '@npplication:at-least-one-source'
                    });
                    return;
                }
                // 更新存储
                localStorage.setItem('storeSources', JSON.stringify(newStoreSources));
                // 重载
                loadPluginManagementPage();
                iziToast.show({
                    timeout: 2000,
                    message: '@npplication:delete-success'
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
                        message: '@npplication:plugin-not-found' + pluginId
                    });
                    return;
                }

                try {
                    iziToast.show({
                        id: 'checkUpdateToast',
                        message: '@npplication:checking-update'
                    });
                    // 调用更新检查函数
                    await checkUpdates(pluginId);
                } catch (error) {
                    iziToast.show({
                        timeout: 3000,
                        message: '@npplication:checking-update-error'
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
                            message: '@npplication:confirm-uninstall',
                            buttons: [
                                ['<button>@global:toast-ok</button>', async function (instance, toast) {
                                    instance.hide({
                                        transitionOut: 'fadeOutUp',
                                    }, toast, 'buttonName');
                                    // 核心插件禁止卸载
                                    if (localMetadata.type === 'coreNpp') {
                                        iziToast.show({
                                            timeout: 2000,
                                            message: `@npplication:core-npp-uninstall-confirm`,
                                        });
                                        return;
                                    } else {
                                        let plugins = await getPluginsList();
                                        plugins = plugins.filter(p => p.id !== pluginId);
                                        await savePluginsList(plugins);
                                        await deleteFromIndexedDB(DB_NAME, NPP_STORE, pluginId, 1);

                                        iziToast.show({
                                            timeout: 3000,
                                            message: '@npplication:uninstall-success',
                                            buttons: [
                                                ['<button class="refresh-btn">@global:toast-refresh</button>', function (instance, toast) {
                                                    instance.hide({ transitionOut: 'flipOutX' }, toast, 'confirm');
                                                    window.location.reload(true);
                                                }, true],
                                                ['<button class="later-btn">@global:toast-later</button>', function (instance, toast) {
                                                    instance.hide({ transitionOut: 'flipOutX' }, toast, 'cancel');
                                                }]
                                            ]
                                        });
                                        loadPluginManagementPage();
                                    }
                                }, true],
                                ['<button>@global:toast-cancel</button>', function (instance, toast) {
                                    instance.hide({
                                        transitionOut: 'fadeOutUp',
                                    }, toast, 'buttonName');
                                }]
                            ]
                        });
                    }
                } catch (error) {
                    iziToast.show({ timeout: 8000, message: '@npplication:uninstall-fail:' + error.message });
                }
            });
        });
    } catch (error) {
        console.error('加载插件管理页面失败:' + error);
        iziToast.show({ timeout: 8000, message: '@npplication:load-plugin-management-fail' });
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
                <p>@npplication:store-empty</p>
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
        tab.innerHTML = `<span class="tab_text">${name}</span>`;
        tab.dataset.category = key;

        tab.addEventListener('click', () => {
            document.querySelectorAll('#storeTabs .tab-items').forEach(t => t.classList.remove('active'));
            tab.classList.add('active');

            $('#storeContent').css('display', 'flex');
            $('#manageContent').css('display', 'none');
            $('.store-button').css('display', 'none');

            renderPlugins(window.storeData[key] || []);
        });

        tabsContainer.appendChild(tab);
    });
}

async function renderPlugins(pluginsArray) {
    const contentContainer = document.getElementById('storeContent');
    if (!contentContainer) return;

    contentContainer.innerHTML = '';

    contentContainer.style.animation = 'none';
    contentContainer.offsetHeight;
    contentContainer.style.animation = 'fadeIn 0.45s ease';

    const loadingElement = document.createElement('div');
    loadingElement.className = 'store-loading';
    loadingElement.innerHTML = `
        <div class="store-loading-spinner"></div>
        <i class="store-loading-icon iconfont icon-right1"></i>
        <i class="store-loading-icon iconfont icon-wrong"></i>
        <span class="store-loading-text">@npplication:loading-text</span>
    `;
    contentContainer.appendChild(loadingElement);

    const pluginsContainer = document.createElement('div');
    pluginsContainer.className = 'store-plugins-container';
    contentContainer.appendChild(pluginsContainer);

    window._renderingStorePlugins = true;

    const controller = new AbortController();
    window._lastStoreController?.abort();
    window._lastStoreController = controller;

    let loadedCount = 0;
    let hasError = false;
    const totalPlugins = pluginsArray.length;

    for (const plugin of pluginsArray) {
        if (controller.signal.aborted) break;
        try {
            const metadata = await extractMetadata(plugin.url);
            const pluginWithMetadata = {
                ...plugin,
                ...(metadata || {}),
                dependencies: (metadata && metadata.dependencies) || '',
                associations: (metadata && metadata.associations) || '',
                translates: (metadata && metadata.translates) || ''
            };

            const pluginItem = document.createElement('div');
            pluginItem.className = 'plugin-item';
            pluginItem.style.animationDelay = `${loadedCount * 0.05}s`;
            pluginItem.innerHTML = `
                    <img src="${cleanUrl(pluginWithMetadata.icon || '')}" alt="${pluginWithMetadata.name || '插件'}" class="plugin-icon">
                    <div class="plugin-info">
                        <strong translate="none">${pluginWithMetadata.name || '@npplication:no-name'}</strong>
                        <p translate="none">${pluginWithMetadata.description || '@npplication:no-description'}</p>
                    </div>
                `;

            if (!controller.signal.aborted) {
                pluginsContainer.appendChild(pluginItem);
            }
            pluginItem.addEventListener('click', () => showPluginDetails(pluginWithMetadata));

            loadedCount++;
        } catch (error) {
            if (error.name !== 'AbortError') {
                console.error(`加载插件失败: ${plugin.url}`, error);
                hasError = true;
            }
            loadedCount++;
        }
    }

    window._renderingStorePlugins = false;

    const loadingText = loadingElement.querySelector('.store-loading-text');
    if (hasError) {
        loadingElement.classList.add('error');
        loadingText.textContent = '@npplication:loading-fail';
    } else {
        loadingElement.classList.add('success');
        loadingText.textContent = '@npplication:loading-success';
    }

    if (!hasError) {
        setTimeout(() => {
            loadingElement.classList.add('fade-out');
            setTimeout(() => {
                if (loadingElement.parentNode) {
                    loadingElement.remove();
                }
            }, 500);
        }, 2000);
    }
}

function showPluginDetails(pluginWithMetadata) {
    showContain_plugin();

    const page = document.getElementById('storePage');
    const dialogContain = document.createElement('div');
    dialogContain.className = 'dialog-container';

    const dialog = document.createElement('div');
    dialog.className = 'details-dialog';

    const loadingOverlay = document.createElement('div');
    loadingOverlay.className = 'details-loading-overlay';
    loadingOverlay.innerHTML = `
        <div class="details-loading-spinner"></div>
        <div class="details-loading-text">@npplication:loading-text</div>
    `;

    dialog.innerHTML = `
            <div class="dialog-content">
                <div class="plugin-detail-header">
                    <img src="${cleanUrl(pluginWithMetadata.icon)}" alt="${pluginWithMetadata.name}" class="detail-icon">
                        <div class="detail-title">
                            <h2 translate="none">${pluginWithMetadata.name || '@npplication:no-name'}</h2>
                            <div class="detail-source">
                                <p>@npplication:version:</p> <p translate="none">${pluginWithMetadata.version || '</p><p>@npplication:no-version'}</p>
                                <p class="sourceNonCritical">|</p>
                                <p>@npplication:author:</p> <p translate="none">${pluginWithMetadata.author || '</p><p>@npplication:no-author'}</p>
                            </div>
                            <p translate="none">NID: ${pluginWithMetadata.id || '</p><p>@npplication:no-nid'}</p>
                            <div class="detail-source">
                                <p>@npplication:source:
                                    ${pluginWithMetadata.source === 'https://nfdb.nitai.us.kg/nitaiPage/store' ? '<p class="sourceSign">@npplication:official-source</p>' : ''}
                                    ${pluginWithMetadata.source === 'https://nfdb.nitai.us.kg/nitaiPage/store' ? '<p class="sourceNonCritical" translate="none">[' + pluginWithMetadata.source + ']</p>' : pluginWithMetadata.source}
                                </p>
                            </div>
                    </div>
                </div>
                <div class="plugin-detail-body">
                    <div class="detail-section">
                        <div class="detail-header">
                            <i class="iconfont icon-folding on"></i>
                            <h3>@npplication:description</h3>
                        </div>
                        <div class="detail-content expanded">
                            <p translate="none">${pluginWithMetadata.description}</p>
                        </div>
                    </div>
                    <div class="detail-section">
                        <div class="detail-header">
                            <i class="iconfont icon-folding on"></i>
                            <h3>@npplication:dependencies</h3>
                        </div>
                        <div class="detail-content expanded">
                            <div id="dependencies-container" translate="none"></div>
                        </div>
                    </div>
                    <div class="detail-section">
                        <div class="detail-header">
                            <i class="iconfont icon-folding on"></i>
                            <h3>@npplication:associations</h3>
                        </div>
                        <div class="detail-content expanded">
                            <div id="associations-container" translate="none"></div>
                        </div>
                    </div>
                    <div class="detail-section">
                        <div class="detail-header">
                            <i class="iconfont icon-folding"></i>
                            <h3>@npplication:translates</h3>
                        </div>
                        <div class="detail-content">
                            <div id="translates-container" translate="none"></div>
                        </div>
                    </div>
                    <div class="detail-section">
                        <div class="detail-header">
                            <i class="iconfont icon-folding"></i>
                            <h3>@npplication:screenshots</h3>
                        </div>
                        <div class="detail-content">
                            <div class="screenshots" translate="none">
                        ${(() => {
            const screenshots = pluginWithMetadata.screen || pluginWithMetadata.screenshots || [];
            return (Array.isArray(screenshots) ? screenshots : [screenshots])
                .flatMap(shot => shot.toString().split(',').map(url => url.trim().replace(/[\[\]]/g, '')))
                .map(url => `
                            <a href="${url.trim().startsWith('http') ? url.trim() : cleanUrl(url)}" target="_blank"><img src="${url.trim().startsWith('http') ? url.trim() : cleanUrl(url)}" alt="截图" class="screenshot-img"></a>
                        `).join('');
        })()}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;

    dialog.appendChild(loadingOverlay);
    dialogContain.appendChild(dialog);
    page.appendChild(dialogContain);

    const dialogContent = dialog.querySelector('.dialog-content');
    dialogContent.style.filter = 'blur(3px)';

    window._currentDialogContent = dialogContent;
    window._currentDialogContain = dialogContain;

    async function showDependencyDetailsDialog() {
        const dependencies = parseDependencies(pluginWithMetadata.dependencies || '');
        const dependenciesContainer = dialog.querySelector('#dependencies-container');
        const dependenciesSection = dialog.querySelector('#dependencies-container').closest('.detail-section');
        const dependencyCheckResult = await renderDependencies(dependenciesContainer, dependencies, pluginWithMetadata.source || '');

        const associations = parseAssociations(pluginWithMetadata.associations || '');
        const associationsContainer = dialog.querySelector('#associations-container');
        const associationsSection = dialog.querySelector('#associations-container').closest('.detail-section');
        const associationCheckResult = await renderAssociations(associationsContainer, associations, pluginWithMetadata.source || '');

        const translates = parseTranslates(pluginWithMetadata.translates || '');
        const translatesContainer = dialog.querySelector('#translates-container');
        const translatesSection = dialog.querySelector('#translates-container').closest('.detail-section');
        const translateCheckResult = await renderTranslates(translatesContainer, translates, pluginWithMetadata.source || '');

        if (loadingOverlay && loadingOverlay.parentNode) {
            loadingOverlay.classList.add('fade-out');
            setTimeout(() => {
                if (loadingOverlay && loadingOverlay.parentNode) {
                    loadingOverlay.remove();
                }
            }, 300);
        }

        dialogContent.style.filter = '';

        if (!dependencyCheckResult.hasContent && dependenciesSection) {
            dependenciesSection.style.display = 'none';
        }
        if (!associationCheckResult.hasContent && associationsSection) {
            associationsSection.style.display = 'none';
        }
        if (!translateCheckResult.hasContent && translatesSection) {
            translatesSection.style.display = 'none';
        }

        // 截图处理
        const screenshots = pluginWithMetadata.screen || pluginWithMetadata.screenshots || [];
        const screenshotsSection = dialog.querySelector('.screenshots').closest('.detail-section');
        if (screenshots.length === 0 && screenshotsSection) {
            screenshotsSection.style.display = 'none';
        }

        // 按钮
        const btn = document.createElement('div');
        btn.className = 'dialog-btn';

        // 检查插件状态
        const canInstall = dependencyCheckResult.status;

        btn.innerHTML = `
                <div class="dialog-cancel">@npplication:return</div>
                ${canInstall ? `<div class="dialog-install" data-plugin-url="${cleanUrl(pluginWithMetadata.url)}">@npplication:install</div>` : ''}
            `;

        btn.querySelector('.dialog-cancel').addEventListener('click', showContain_plugin);

        if (canInstall) {
            btn.querySelector('.dialog-install').addEventListener('click', async function () {
                iziToast.show({
                    id: 'installToast',
                    message: '@npplication:installing'
                });

                await installNpplication(this.dataset.pluginUrl);

                if (localStorage.getItem('autoInstallTranslation') === 'on') {
                    const targetLang = localStorage.getItem('autoInstallTranslationGlobal') || 'zh-CN';

                    if (translateCheckResult && translateCheckResult.details) {
                        for (const [url, details] of Object.entries(translateCheckResult.details)) {
                            if (details.metadata && details.metadata.translates) {
                                const translateLang = details.metadata.translates;
                                if (translateLang === targetLang && details.status !== 'satisfied') {
                                    await installNpplication(url);
                                    iziToast.show({
                                        message: '@npplication:translate-install-success-desc',
                                        timeout: 3000
                                    });
                                    break;
                                }
                            }
                        }
                    }
                }
            });
        }

        dialogContain.appendChild(btn);

        $('.detail-header', dialog).on('click', function (e) {
            e.preventDefault();
            e.stopPropagation();

            const $this = $(this);
            const $content = $this.next('.detail-content');
            const $icon = $this.find('.icon-folding');

            if ($content.length) {
                $content.toggleClass('expanded');
                $icon.toggleClass('on');
            }
        });
    }

    showDependencyDetailsDialog().catch(error => {
        if (loadingOverlay && loadingOverlay.parentNode) {
            loadingOverlay.classList.add('fade-out');
            setTimeout(() => {
                if (loadingOverlay && loadingOverlay.parentNode) {
                    loadingOverlay.remove();
                }
            }, 300);
        }
        if (dialogContent) {
            dialogContent.style.filter = '';
        }
        iziToast.show({
            timeout: 3000,
            message: '@npplication:load-plugin-error'
        });
        showContain_plugin();
    });

    $('#storeTabs').css('display', 'none');
    $('.store-block').css('display', 'none');
}