import {
    dbGet, dbPut, dbDelete,
    ensurePluginStore,
    PAGEDB_NAME, PAGEDB_STORE, NPP_DB_NAME,
    NPPSTORE_NAME, NPPSTORE_STORE
} from '@/utils/db';
import { escapeHtml } from '@/utils/dom';
import { hideToastById } from '@/composables/useToast';
import iziToast from 'izitoast';
import { officialStoreUrl, isOfficialUrl, isOfficialHost, fetchOfficial, loadNodeTable } from './nodes.js';

// 复用 dom 的导出
export { escapeHtml };

/* 常量 */
const PLUGIN_LIST_KEY = 'npp_plugins';
const STORE_SOURCES_KEY = 'storeSources';
const STORE_SOURCES_DEFAULT = [officialStoreUrl()];

// 自动将老商店源更新为新商店源
const LEGACY_STORE_SOURCES = {
    'https://nfdb.nitai.us.kg/nitaiPage/store': officialStoreUrl(),
    'https://nfdb.nitai.us.kg/store': officialStoreUrl()
};

// 旧商店源
const LEGACY_UPDATE_HOSTS = ['nfdb.nitai.us.kg'];


/* 元数据解析 */

// 单个网络请求的超时上限
const FETCH_TIMEOUT = 10000;

// 元数据缓存【要最新数据时传 force 即可】
const metadataCache = new Map();

// 超时
// 官方地址自动切换节点重试，第三方地址按原样请求
function fetchWithTimeout(url, options = {}) {
    return fetchOfficial(url, options, FETCH_TIMEOUT);
}

/**
 * 提取单个插件 JS 文件中的元数据块
 * @param {string} url JS 文件 URL（也支持 blob:xxx）
 * @param {Object} [options] force=true 时跳过缓存重新拉取
 * @returns {Promise<Object|undefined>}
 */
export async function extractMetadata(url, options = {}) {
    if (!url) return undefined;

    const force = options.force === true;
    if (!force && metadataCache.has(url)) return metadataCache.get(url);

    const promise = parseMetadata(url).then((metadata) => {
        // 解析失败删除缓存
        if (!metadata) metadataCache.delete(url);
        return metadata;
    });
    metadataCache.set(url, promise);
    return promise;
}

// 拉取并解析
// 任何失败都返回 undefined
async function parseMetadata(url) {
    try {
        const response = await fetchWithTimeout(url, { cache: 'no-store' });
        if (!response.ok) {
            console.error(`获取元数据失败 ${response.status}: ${url}`);
            return;
        }

        // 排除不存在的脚本地址
        const contentType = response.headers.get('content-type') || '';
        if (contentType.includes('text/html')) {
            console.error(`该地址非插件脚本: ${url}`);
            return;
        }

        const scriptText = await response.text();

        const urlMetadata = scriptText.match(
            /\/\/\s*==Npplication==\s*\n([\s\S]*?)\n\/\/\s*==\/Npplication==/
        );

        if (!urlMetadata || !urlMetadata[1]) {
            console.error('未找到元数据');
            return;
        }

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

        // 名字 / id / 版本 为必填
        if (!metadata.name || !metadata.id || !metadata.version) {
            console.error('缺少必要元数据字段');
            return;
        }

        // 翻译插件必须带 translates
        if (metadata.type === 'translate' && !metadata.translates) {
            console.error('翻译插件缺少必要的 translates 字段');
            return;
        }

        // 非翻译插件必须带 time
        if (metadata.type !== 'translate' && !metadata.time) {
            console.error('缺少必要的 time 字段');
            return;
        }

        // id 格式校验（coreNpp / translate 跳过）
        if (metadata.type !== 'coreNpp' && metadata.type !== 'translate') {
            const idPattern = /^([0-9]{13})_[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-4[0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}$/;
            const match = metadata.id.match(idPattern);
            if (!match) {
                console.error('错误的 ID 格式');
                return;
            }
            const timestamp = parseInt(match[1]);
            if (timestamp < 1749401460000) {
                console.error('ID 无效');
                return;
            }
        }

        // 加载时机
        if (metadata.type !== 'translate') {
            if (!metadata.time || !['head', 'body'].includes(metadata.time.toLowerCase())) {
                metadata.time = 'body';
            }
        }

        const isTranslatePlugin = metadata.type === 'translate';

        return {
            name: metadata.name,
            id: metadata.id,
            version: metadata.version,
            // 更新地址不再允许插件使用自定义更新地址
            updateUrl: url,
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
            translates: metadata.translates || ''
        };
    } catch (error) {
        console.error(error);
        return;
    }
}

// 验证 JS 文件 URL 是否合法（扩展名 + 内容类型 / Range 支持）
export async function verifyJSUrl(url) {
    if (!url || typeof url !== 'string') return false;

    // 带查询串的地址（x.js?v=1）不能直接按结尾判断
    let pathname = url;
    try {
        pathname = new URL(url, typeof location !== 'undefined' ? location.href : undefined).pathname;
    } catch (error) {
        pathname = url.split('?')[0];
    }
    if (!pathname.endsWith('.js')) return false;

    try {
        const response = await fetchWithTimeout(url, {
            method: 'HEAD',
            mode: 'cors',
            cache: 'no-cache'
        });

        const contentType = response.headers.get('content-type');
        if (contentType && contentType.includes('application/javascript')) {
            return true;
        }

        const rangeResponse = await fetchWithTimeout(url, {
            method: 'GET',
            headers: { 'Range': 'bytes=0-1' },
            mode: 'cors',
            cache: 'no-cache'
        });

        return !!rangeResponse.headers.get('content-range');
    } catch (error) {
        console.error('验证 JS 文件地址失败:', error);
        return false;
    }
}

/* 关系项（依赖 / 关联 / 翻译）解析与检查 */

// 关系项类型对应的文案 key
const RELATION_TYPE_NAMES = {
    dependencies: '@npplication:dependencies',
    associations: '@npplication:associations',
    translates: '@npplication:translates'
};

function parseRelationItems(relationStr, type) {
    if (typeof relationStr !== 'string' || !relationStr.trim()) return {};

    try {
        const cleanStr = relationStr.trim().replace(/^\[|\]$/g, '');
        if (!cleanStr) return {};

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
                    console.warn(`无法解析的${RELATION_TYPE_NAMES[type]}:${entry}`);
                    return;
                }
            }

            relations[url] = version;
        });
        return relations;
    } catch (error) {
        console.error(`${RELATION_TYPE_NAMES[type]}解析失败:` + error);
        return {};
    }
}

export function parseDependencies(dependenciesStr) {
    return parseRelationItems(dependenciesStr, 'dependencies');
}
export function parseAssociations(associationsStr) {
    return parseRelationItems(associationsStr, 'associations');
}
export function parseTranslates(translatesStr) {
    return parseRelationItems(translatesStr, 'translates');
}

// 检查关系项是否满足要求，返回 { status, details }
// 只有 dependencies 才含 status
export async function checkRelationItems(relations, type) {
    if (!relations || Object.keys(relations).length === 0) {
        return type === 'dependencies' ? { status: true, details: {} } : { details: {} };
    }

    const typeName = RELATION_TYPE_NAMES[type];

    try {
        const plugins = await getPluginsList();
        const details = {};
        let allSatisfied = true;

        // 各项检查互相独立，先取元数据
        // 循环内命中的为缓存
        await Promise.all(
            Object.keys(relations).map((url) => extractMetadata(url).catch(() => null))
        );

        for (const [url, requiredVersion] of Object.entries(relations)) {
            try {
                const metadata = await extractMetadata(url);
                if (!metadata || !metadata.id) {
                    console.error(`无法获取${typeName}有效元数据:` + url);
                    details[url] = { status: 'failed', message: `@npplication:get-details-failed ${typeName}` };
                    if (type === 'dependencies') allSatisfied = false;
                    continue;
                }

                let actualRequiredVersion = requiredVersion;
                if (String(requiredVersion).toLowerCase() === 'latest') {
                    actualRequiredVersion = metadata.version;
                }

                const installedPlugin = plugins.find(p => p.id === metadata.id);
                if (!installedPlugin) {
                    const messages = {
                        dependencies: '@npplication:not-installed',
                        associations: '@npplication:can-install',
                        translates: '@npplication:can-install'
                    };
                    details[url] = {
                        status: 'not_installed',
                        message: messages[type],
                        requiredVersion: requiredVersion,
                        metadata
                    };
                    if (type === 'dependencies') allSatisfied = false;
                    continue;
                }

                const versionCompare = compareVersions(installedPlugin.version, actualRequiredVersion);
                if (versionCompare < 0) {
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
                        metadata
                    };
                    if (type === 'dependencies') allSatisfied = false;
                } else {
                    details[url] = {
                        status: 'satisfied',
                        message: '@npplication:installed',
                        installedVersion: installedPlugin.version,
                        requiredVersion: requiredVersion,
                        metadata
                    };
                }
            } catch (error) {
                console.error(`检查${typeName}失败:` + url, error);
                details[url] = { status: 'failed', message: `@npplication:check-failed ${typeName}` };
                if (type === 'dependencies') allSatisfied = false;
            }
        }

        return type === 'dependencies' ? { status: allSatisfied, details } : { details };
    } catch (error) {
        console.error(`${typeName}检查过程中发生错误:`, error);
        return type === 'dependencies' ? { status: false, details: {} } : { details: {} };
    }
}

export async function checkDependencies(dependencies) {
    return checkRelationItems(dependencies, 'dependencies');
}
export async function checkAssociations(associations) {
    return checkRelationItems(associations, 'associations');
}
export async function checkTranslates(translates) {
    return checkRelationItems(translates, 'translates');
}

// 版本比较：1 = v1>v2，0 = 相等，-1 = v1<v2
// 按段作数值比较
export function compareVersions(version1, version2) {
    const a = String(version1 ?? '').trim();
    const b = String(version2 ?? '').trim();
    if (a === b) return 0;

    const partsA = a.split('.');
    const partsB = b.split('.');
    const length = Math.max(partsA.length, partsB.length);

    for (let i = 0; i < length; i++) {
        // 缺段按 0 处理（即 1.2 = 1.2.0）
        const segA = partsA[i] ?? '0';
        const segB = partsB[i] ?? '0';
        if (segA === segB) continue;
        // 两段都是纯数字时按数值比，否则退化为字符串比较（如 1.0-beta）
        if (/^\d+$/.test(segA) && /^\d+$/.test(segB)) {
            return Number(segA) > Number(segB) ? 1 : -1;
        }
        return segA > segB ? 1 : -1;
    }
    return 0;
}

/* 插件列表与元数据读写 */

// 读取 localStorage 里遗留的插件列表（一次性迁移用）
function readLegacyPluginList() {
    try {
        const raw = localStorage.getItem(PLUGIN_LIST_KEY);
        return raw ? JSON.parse(raw) : [];
    } catch (error) {
        console.error('从 localStorage 读取插件列表失败:' + error);
        return [];
    }
}

// 从 IndexedDB 读取插件列表，首次会从旧 localStorage 迁移
export async function getPluginsList() {
    try {
        const record = await dbGet(PAGEDB_NAME, PAGEDB_STORE, PLUGIN_LIST_KEY);
        if (record) {
            if (Array.isArray(record.data)) return record.data;
            console.error('插件列表数据格式异常，已忽略');
        }
    } catch (error) {
        console.error('获取插件列表失败，回退到 localStorage:', error);
    }

    // localStorage 里的存量列表，存在则回退进 IndexedDB
    const legacy = readLegacyPluginList();
    if (legacy.length) {
        dbPut(PAGEDB_NAME, PAGEDB_STORE, { id: PLUGIN_LIST_KEY, data: legacy })
            .catch(() => { /* 迁移失败不影响本次读取 */ });
    }
    return legacy;
}

// 保存整个插件列表
export function savePluginsList(plugins) {
    return dbPut(PAGEDB_NAME, PAGEDB_STORE, { id: PLUGIN_LIST_KEY, data: plugins });
}

// 保存 / 更新单个插件元数据，保留安装时间戳
export async function savePluginMetadata(metadata) {
    try {
        if (!metadata || typeof metadata !== 'object' || !metadata.id) {
            console.error('无效的插件: 缺少必要的 ID 字段');
            return false;
        }

        let plugins;
        try {
            plugins = await getPluginsList();
        } catch (error) {
            console.error('获取插件列表失败:', error);
            return false;
        }

        if (!Array.isArray(plugins)) {
            console.error('插件数据格式无效，预期为数组');
            return false;
        }

        const existingIndex = plugins.findIndex(p => p.id === metadata.id);
        const existing = existingIndex > -1 ? plugins[existingIndex] : null;
        const installTime = existing?.installTime || Date.now();

        if (existing) {
            plugins[existingIndex] = {
                ...metadata,
                installTime,
                ignoreUpdatePrompt: metadata.ignoreUpdatePrompt || false
            };
        } else {
            plugins.push({ ...metadata, installTime, ignoreUpdatePrompt: false });
        }

        try {
            await savePluginsList(plugins);
            return true;
        } catch (error) {
            console.error('保存插件元数据失败:', error);
            return false;
        }
    } catch (error) {
        console.error('保存插件元数据失败:', error.message);
        return false;
    }
}

// 下载 JS 文件内容并存入 nppstore/Npp
export async function saveJSFile(id, url) {
    if (!id || !url) {
        console.error('缺少必要参数: ' + (id ? '' : 'id ') + (url ? '' : 'url'));
        return false;
    }
    try {
        const response = await fetchWithTimeout(url, { cache: 'no-store' });
        if (!response.ok) {
            console.error(`HTTP错误: ${response.status} ${response.statusText}`);
            return false;
        }
        const content = await response.text();
        await dbPut(NPPSTORE_NAME, NPPSTORE_STORE, { id, content });
        // 源码已换新，之前解析的元数据作废
        metadataCache.delete(url);
        console.log('下载成功');
        return true;
    } catch (error) {
        console.error('下载失败:', error);
        return false;
    }
}

// 从 nppstore 取插件源码并转成 blob URL
// 没有源码时返回 null
async function getNppSourceUrl(id) {
    const fileRecord = await dbGet(NPPSTORE_NAME, NPPSTORE_STORE, id).catch(() => null);
    if (!fileRecord || typeof fileRecord.content !== 'string') return null;
    const blob = new Blob([fileRecord.content], { type: 'application/javascript' });
    return URL.createObjectURL(blob);
}

// 获取插件元数据 + 内容 Blob URL
// 可用 id 或 url 查询
export async function getNpp(option) {
    if (!option || typeof option !== 'object') {
        throw new Error('getNpp 需要 id 或 url');
    }

    if (option.id) {
        const metadata = (await getPluginsList()).find(p => p.id === option.id);
        if (!metadata) {
            console.error('未找到元数据: ' + option.id);
            throw new Error('未找到元数据');
        }

        const url = await getNppSourceUrl(option.id);
        return url ? { metadata, url } : { metadata };
    }

    if (option.url) {
        const metadata = await extractMetadata(option.url, { force: option.force === true });
        return { metadata };
    }

    throw new Error('getNpp 需要 id 或 url');
}

/* 安装 / 卸载 / 更新 */

// 核心插件安装来源白名单校验
function isAllowedCoreSource(url) {
    try {
        const parsedUrl = new URL(url);
        return parsedUrl.protocol === 'https:' && isOfficialHost(parsedUrl.hostname);
    } catch (e) {
        return false;
    }
}

// 判断是否来自官方源
// 用于跳过二次确认
function isOfficialSource(url) {
    return isOfficialUrl(url);
}

// 第三方源的插件安装前的二次确认
function confirmThirdPartySource(url) {
    let host = url;
    try {
        host = new URL(url).hostname;
    } catch (error) {
        console.error('插件地址解析失败:' + error);
    }

    return new Promise((resolve) => {
        iziToast.show({
            timeout: 15000,
            message: `@npplication:third-party-source ${host}`,
            buttons: [
                ['<button class="confirm-btn">@global:toast-ok</button>', function (instance, toast) {
                    instance.hide({ transitionOut: 'flipOutX' }, toast, 'confirm');
                    resolve(true);
                }, true],
                ['<button class="cancel-btn">@global:toast-cancel</button>', function (instance, toast) {
                    instance.hide({ transitionOut: 'flipOutX' }, toast, 'cancel');
                    resolve(false);
                }]
            ],
            onClosed: function () { resolve(false); }
        });
    });
}

// 安装插件
export async function installNpplication(url) {
    try {
        // 安装最新内容，不使用缓存
        const { metadata } = await getNpp({ url, force: true });
        if (!metadata) {
            console.error('无法解析插件元数据:' + url);
            iziToast.show({ timeout: 2000, message: '@npplication:install-fail' });
            hideToastById('#installToast');
            return;
        }

        // 非官方源二次确认
        if (!isOfficialSource(url) && !await confirmThirdPartySource(url)) {
            hideToastById('#installToast');
            return;
        }

        if (!await verifyJSUrl(url)) {
            console.error('无效的JS文件URL:' + url);
            iziToast.show({ timeout: 2000, message: '@npplication:install-fail' });
            hideToastById('#installToast');
            return;
        }

        const dependencies = parseDependencies(metadata.dependencies || '');
        const dependencyCheckResult = await checkDependencies(dependencies);
        if (metadata.type !== 'translate' && !dependencyCheckResult.status) {
            hideToastById('#installToast');
            return;
        }

        if (metadata.type === 'coreNpp' && !isAllowedCoreSource(url)) {
            console.warn('核心应用只能从指定源安装');
            iziToast.show({ timeout: 2000, message: '@npplication:install-fail' });
            hideToastById('#installToast');
            return;
        }

        const plugins = await getPluginsList();
        const existing = plugins.find(p => p.id === metadata.id);
        if (metadata.type === 'coreNpp' && !existing) {
            console.warn('核心应用禁止安装');
            iziToast.show({ timeout: 2000, message: '@npplication:install-fail' });
            hideToastById('#installToast');
            return;
        }

        if (existing) {
            const versionComparison = compareVersions(existing.version, metadata.version);
            if (versionComparison === 0) {
                showUpdateDialog(metadata);
            } else if (versionComparison < 0) {
                iziToast.show({ id: 'checkUpdateToast', message: '@npplication:installing' });
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
        iziToast.show({ timeout: 2000, message: '@npplication:install-fail' });
        hideToastById('#installToast');
    }
}

// 卸载插件
export async function uninstallNpp(id) {
    try {
        const localData = await getNpp({ id });
        if (!localData || !localData.metadata) {
            console.error(`未知的Npp: ${id}`);
            return false;
        }
        const localMetadata = localData.metadata;
        if (localMetadata.type === 'coreNpp') {
            iziToast.show({ timeout: 2000, message: '@npplication:core-npp-uninstall-confirm' });
            return false;
        }

        let plugins = await getPluginsList();
        plugins = plugins.filter(p => p.id !== id);
        await savePluginsList(plugins);
        await dbDelete(NPPSTORE_NAME, NPPSTORE_STORE, id);
        return true;
    } catch (error) {
        console.error('卸载失败:' + error.message);
        return false;
    }
}

// 覆盖安装确认弹窗（已安装且版本一致时的二次确认）
export function showUpdateDialog(metadata) {
    hideToastById('#installToast');
    iziToast.show({
        timeout: 8000,
        message: `@npplication:are-you-sure-to-cover-version"${metadata.name}"?`,
        buttons: [
            ['<button class="confirm-btn">@global:toast-ok</button>', async function (instance, toast) {
                instance.hide({ transitionOut: 'flipOutX' }, toast, 'confirm');
                try {
                    await saveJSFile(metadata.id, metadata.updateUrl);
                    await savePluginMetadata({ ...metadata, ignoreUpdatePrompt: false });
                    showRefreshDialog();
                } catch (error) {
                    console.error('覆盖失败:' + error.message);
                    iziToast.show({ timeout: 3000, message: '@npplication:cover-fail' });
                }
            }, true],
            ['<button class="cancel-btn">@global:toast-cancel</button>', function (instance, toast) {
                instance.hide({ transitionOut: 'flipOutX' }, toast, 'cancel');
            }]
        ]
    });
}

// 检查单个 / 全部插件更新
export async function checkUpdates(id, info = 'show') {
    // 列表只读一次供内部复用，避免每检查一个插件都重读一遍
    const plugins = await getPluginsList();

    const checkSinglePluginUpdate = async (pluginId, info, silent = false, preloaded = false) => {
        const localMetadata = plugins.find(p => p.id === pluginId);
        if (!localMetadata) {
            console.error(`未知的Npp: ${pluginId}`);
            return;
        }

        try {
            // 检查最新内容
            const remoteMetadata = await extractMetadata(localMetadata.updateUrl, { force: !preloaded });
            if (!remoteMetadata) {
                console.error(`无法获取插件 ${pluginId} 的元数据`);
                return;
            }

            const versionComparison = compareVersions(localMetadata.version, remoteMetadata.version);
            if (versionComparison < 0) {
                if (localMetadata.forceUpdate === 'true' || silent) {
                    await saveJSFile(remoteMetadata.id, remoteMetadata.updateUrl);
                    await savePluginMetadata({ ...remoteMetadata, ignoreUpdatePrompt: false });
                    iziToast.show({
                        timeout: 2000,
                        title: '@npplication:auto-update',
                        message: `${localMetadata.name} @npplication:installed-latest-version-desc ${remoteMetadata.version}`
                    });
                    if (info !== 'hide') hideToastById('#checkUpdateToast');
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
                                    await saveJSFile(remoteMetadata.id, remoteMetadata.updateUrl);
                                    await savePluginMetadata({ ...remoteMetadata, ignoreUpdatePrompt: false });
                                    iziToast.show({
                                        timeout: 2000, title: '@npplication:update',
                                        message: `${localMetadata.name} @npplication:installed-version-desc ${remoteMetadata.version}`
                                    });
                                    resolve();
                                    showRefreshDialog();
                                }, true],
                                ['<button>@npplication:dont-ask-to-update</button>', function (instance, toast) {
                                    instance.hide({ transitionOut: 'flipOutX' }, toast, 'noUpdate');
                                    savePluginMetadata({ ...localMetadata, ignoreUpdatePrompt: true });
                                    resolve();
                                }],
                                ['<button>@global:toast-later</button>', function (instance, toast) {
                                    instance.hide({ transitionOut: 'flipOutX' }, toast, 'cancel');
                                    resolve();
                                }]
                            ],
                            onClosed: function () { resolve(); }
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
                            onClosed: function () { toastResolve(); }
                        });
                        hideToastById('#checkUpdateToast');
                    });
                }
            }
        } catch (error) {
            console.error(`检查插件 ${pluginId} 更新失败:`, error);
            iziToast.show({ timeout: 8000, message: `${localMetadata?.name || ''} @npplication:check-update-error-desc` });
            hideToastById('#checkUpdateToast');
        }
    };

    if (id === 'all') {
        const autoUpdateEnabled = localStorage.getItem('autoUpdatePlugins') !== 'off';

        // 逐个获取元数据太慢，先预热
        // 为避免互相打断，写入与提示此处仍是串行
        await Promise.all(plugins.map((plugin) => (
            plugin && plugin.updateUrl
                ? extractMetadata(plugin.updateUrl, { force: true }).catch(() => null)
                : null
        )));

        for (const plugin of plugins) {
            await checkSinglePluginUpdate(plugin.id, 'hide', autoUpdateEnabled, true);
        }
        if (info === 'show') {
            iziToast.show({ timeout: 2000, message: '@npplication:all-updated-desc' });
        }
        hideToastById('#checkUpdateToast');
    } else {
        await checkSinglePluginUpdate(id);
    }
}

/**
 * 把所有已装插件强制更新到最新版
 * 全程静默，不弹任何提示（供引导页初始化用）
 * @returns {Promise<{updated: string[], failed: string[]}>} 更新成功 / 失败的插件 id
 */
export async function forceUpdateAllPlugins() {
    const result = { updated: [], failed: [] };

    let plugins;
    try {
        plugins = await getPluginsList();
    } catch (error) {
        console.error('强制更新插件时读取列表失败:', error);
        return result;
    }
    if (!Array.isArray(plugins) || plugins.length === 0) return result;

    // 并发拉取元数据，单个失败不中断
    const remotes = await Promise.all(plugins.map((plugin) => (
        plugin && plugin.updateUrl
            ? extractMetadata(plugin.updateUrl, { force: true }).catch(() => null)
            : null
    )));

    // 下载与写库保持串行
    // 并发写同一份插件列表会导致互相覆盖
    for (let i = 0; i < plugins.length; i++) {
        const local = plugins[i];
        const remote = remotes[i];
        if (!local || !local.id || !remote || !remote.id) continue;

        // 有新版本才下载
        if (compareVersions(local.version, remote.version) >= 0) continue;

        try {
            const saved = await saveJSFile(remote.id, remote.updateUrl);
            if (!saved) {
                result.failed.push(local.id);
                continue;
            }
            await savePluginMetadata({ ...remote, ignoreUpdatePrompt: false });
            result.updated.push(local.id);
        } catch (error) {
            console.error(`强制更新插件 ${local.id} 失败:`, error);
            result.failed.push(local.id);
        }
    }

    return result;
}

// 安装 / 更新完成后提示刷新
export function showRefreshDialog() {
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

/* 商店源 */

// 读商店源列表
function readStoreSources() {
    try {
        const parsed = JSON.parse(localStorage.getItem(STORE_SOURCES_KEY));
        if (!Array.isArray(parsed)) return [];

        const sources = parsed
            .filter((item) => typeof item === 'string' && item)
            .map((item) => LEGACY_STORE_SOURCES[item] || item);

        // 更换旧官方商店源
        if (sources.join('\n') !== parsed.join('\n')) writeStoreSources(sources);
        return sources;
    } catch (error) {
        console.warn('商店源配置解析失败，回退到默认源');
    }
    return [];
}

function writeStoreSources(sources) {
    try {
        localStorage.setItem(STORE_SOURCES_KEY, JSON.stringify(sources));
        return true;
    } catch (error) {
        console.error('保存商店源配置失败:', error);
        return false;
    }
}

export function getStoreSources() {
    let sources = readStoreSources();
    if (sources.length === 0) {
        sources = [...STORE_SOURCES_DEFAULT];
        writeStoreSources(sources);
    }
    return sources;
}

// http（内网）/ https 过滤
function isAllowedStoreSource(value) {
    let url;
    try {
        url = new URL(value);
    } catch (error) {
        return false;
    }

    if (url.protocol === 'https:') return true;
    if (url.protocol !== 'http:') return false;

    const host = url.hostname.replace(/^\[|\]$/g, '');
    if (host === 'localhost' || host === '127.0.0.1' || host === '::1') return true;

    const parts = host.split('.');
    if (parts.length !== 4) return false;
    if (parts.some(part => !/^\d{1,3}$/.test(part) || Number(part) > 255)) return false;

    const [a, b] = parts.map(Number);
    return a === 10
        || (a === 172 && b >= 16 && b <= 31)
        || (a === 192 && b === 168)
        || (a === 169 && b === 254);
}

export function addStoreSource(newSource) {
    if (typeof newSource !== 'string') return { ok: false, reason: 'invalid-url' };

    const sources = getStoreSources();
    if (!isAllowedStoreSource(newSource)) return { ok: false, reason: 'invalid-url' };
    if (sources.includes(newSource)) return { ok: false, reason: 'exists' };
    sources.push(newSource);
    writeStoreSources(sources);
    return { ok: true, sources };
}

export function removeStoreSource(url) {
    const sources = getStoreSources();
    const newSources = sources.filter(source => source !== url);
    if (newSources.length === 0) return { ok: false, reason: 'at-least-one' };
    writeStoreSources(newSources);
    return { ok: true, sources: newSources };
}

export function isTrustedStoreMetadata(plugin) {
    if (!plugin || typeof plugin !== 'object') return false;
    if (!plugin.source || !plugin.url) return false;
    return isOfficialUrl(plugin.source) && isOfficialUrl(plugin.url);
}

// 多源合并
export function mergeStoreData(sources) {
    const metaFields = [
        'name', 'id', 'version', 'type', 'time', 'description', 'author', 'icon',
        'screen', 'setting', 'forced', 'dependencies', 'associations', 'translates'
    ];
    const merged = { category: {} };

    (Array.isArray(sources) ? sources : []).forEach((source) => {
        const sourceUrl = source && source.url;
        const data = source && source.data;
        if (!data || typeof data !== 'object') return;

        const categories = data.category && data.category[0];
        if (categories && typeof categories === 'object') {
            Object.entries(categories).forEach(([key, name]) => {
                if (!merged.category[key]) merged.category[key] = name;
            });
        }

        Object.entries(data).forEach(([key, value]) => {
            if (key === 'category') return;
            if (!Array.isArray(value) || !value[0] || typeof value[0] !== 'object') return;

            if (!merged[key]) merged[key] = [];
            Object.values(value[0]).forEach((plugin) => {
                if (!plugin || typeof plugin !== 'object' || !plugin.url) return;
                // 官方商店源插件元数据
                const meta = {};
                for (const field of metaFields) {
                    if (typeof plugin[field] === 'string' && plugin[field]) meta[field] = plugin[field];
                }

                merged[key].push({
                    url: plugin.url,
                    screenshots: plugin.screenshots,
                    source: sourceUrl,
                    ...meta
                });
            });
        });
    });

    return merged;
}

// 加载并合并所有商店源并将结果写入 window.storeData 后返回
export async function loadStoreData() {
    try {
        const sources = getStoreSources();
        const responses = await Promise.all(sources.map(url =>
            fetchWithTimeout(url)
                .then(res => {
                    if (!res.ok) throw new Error(`HTTP ${res.status}`);
                    return res.json().then(data => ({ url, data }));
                })
                .catch(err => {
                    console.error(`加载商店源 ${url} 失败:`, err);
                    return null;
                })
        ));

        const validData = responses.filter(data => data !== null);
        if (validData.length === 0) {
            console.error('没有可用的商店源数据');
            window.storeData = { category: {} };
            return window.storeData;
        }

        const mergedData = mergeStoreData(validData);
        window.storeData = mergedData;
        return mergedData;
    } catch (error) {
        console.error('加载商店数据失败:', error);
        window.storeData = { category: {} };
        return window.storeData;
    }
}

// 老插件更新地址迁移
export async function migrateLegacyUpdateUrls() {
    const fileNameOf = (url) => {
        try {
            return new URL(url).pathname.split('/').pop();
        } catch (error) {
            return '';
        }
    };

    const plugins = await getPluginsList();
    const legacy = plugins.filter((plugin) => {
        try {
            return LEGACY_UPDATE_HOSTS.includes(new URL(plugin.updateUrl).hostname);
        } catch (error) {
            return false;
        }
    });
    if (legacy.length === 0) return { migrated: 0 };

    const storeData = await loadStoreData();
    const byFileName = new Map();
    Object.entries(storeData).forEach(([key, value]) => {
        if (key === 'category' || !Array.isArray(value)) return;
        value.forEach((item) => {
            if (!item || typeof item.url !== 'string') return;
            const name = fileNameOf(item.url);
            if (name && !byFileName.has(name)) byFileName.set(name, item.url);
        });
    });

    let migrated = 0;
    legacy.forEach((plugin) => {
        const target = byFileName.get(fileNameOf(plugin.updateUrl));
        if (!target || target === plugin.updateUrl) return;

        console.log(`插件更新地址迁移: ${plugin.updateUrl} → ${target}`);
        plugin.updateUrl = target;
        migrated += 1;
    });

    if (migrated > 0) await savePluginsList(plugins);
    return { migrated };
}

/* 核心插件注册 + 插件脚本注入 */

// 核心插件文件名清单，数组顺序即加载顺序
const CORE_NPP_FILES = ['themeColor.js', 'advancedSettings.js', 'customStyle.js'];

// coreNpp 所在目录
function coreNppDir() {
    return import.meta.env.BASE_URL + 'coreNpp/';
}

// 解析元数据
// 先与 nppstore 同 id 插件比版本
// 再按 @time 注入 <script>
export async function initCoreNpp() {
    const dir = coreNppDir();

    // 元数据解析互相独立，先并发取回，再按 CORE_NPP_FILES 的顺序进行
    const entries = await Promise.all(CORE_NPP_FILES.map(async (fileName) => {
        const pluginUrl = dir + fileName;
        try {
            const metadata = await extractMetadata(pluginUrl);
            if (!metadata || metadata.type !== 'coreNpp') {
                console.warn(`File ${fileName} is not a coreNpp plugin`);
                return null;
            }
            return { pluginUrl, metadata };
        } catch (error) {
            console.error('加载核心应用失败:', error);
            return null;
        }
    }));

    const storedPlugins = await getPluginsList();

    for (const entry of entries) {
        if (!entry) continue;
        const { pluginUrl, metadata } = entry;

        try {
            const existingPlugin = storedPlugins.find(p => p.id === metadata.id);

            let scriptSrc = pluginUrl;

            if (!existingPlugin) {
                await savePluginMetadata(metadata);
            } else if (compareVersions(existingPlugin.version, metadata.version) > 0) {
                const { url } = await getNpp({ id: metadata.id });
                if (url) scriptSrc = url;
            }

            await injectCoreScript(metadata.id, scriptSrc, metadata.time);
        } catch (error) {
            console.error('加载核心应用失败:', error);
        }
    }
}

// 注入 coreNpp 脚本
// 已存在同 id 的标签则只换 src
function injectCoreScript(id, src, time) {
    return new Promise((resolve) => {
        const existing = document.querySelector(`script[data-npp-id="${id}"]`);
        if (existing) {
            existing.src = src;
            resolve();
            return;
        }

        const script = document.createElement('script');
        script.src = src;
        script.type = 'text/javascript';
        script.dataset.nppId = id;
        script.onload = () => resolve();
        // 单个核心插件加载失败
        script.onerror = () => {
            console.error(`加载核心插件 ${id} 失败: ${src}`);
            resolve();
        };

        if (time === 'head') document.head.appendChild(script);
        else document.body.appendChild(script);
    });
}

// 注入插件脚本（按 time 注入到 head / body），coreNpp 跳过
export async function loadNpp() {
    const plugins = await getPluginsList();
    const targets = plugins.filter(plugin => plugin.id && plugin.time && plugin.type !== 'coreNpp');

    const results = await Promise.allSettled(targets.map(plugin => loadTime(plugin)));
    results.forEach((result, index) => {
        if (result.status === 'rejected') {
            console.error(`加载插件 ${targets[index].id} 失败:`, result.reason);
        }
    });
}

// 注入单个插件脚本
// 源码下载到了 nppstore 里，取出转成 blob URL
async function loadTime(metadata) {
    const { id, time } = metadata;

    const url = await getNppSourceUrl(id);
    if (!url) return;

    const existingScript = document.querySelector(`script[data-npp-id="${id}"]`);
    if (existingScript) {
        existingScript.src = url;
        return;
    }

    if (time !== 'head' && time !== 'body') {
        console.error(`插件 ${id} 的加载时机无效: ${time}`);
        return;
    }

    await new Promise((resolve, reject) => {
        const script = document.createElement('script');
        script.src = url;
        script.type = 'text/javascript';
        script.dataset.nppId = id;
        script.onload = () => resolve();
        script.onerror = () => reject(new Error(`加载插件 ${id} 失败`));
        (time === 'head' ? document.head : document.body).appendChild(script);
    });
}

/* window.npp 全局公开 API */

// 换成 const 后自引用会直接命中 TDZ，此处显式取一次全局对象
const npp = (typeof window !== 'undefined' && window.npp) || {};

async function getCurrentPluginMetadata() {
    // 插件在事件 / 定时器 / Promise 回调 里调用时 currentScript 已是 null
    const script = document.currentScript;
    if (!script || !script.src) return undefined;

    try {
        return await extractMetadata(script.src);
    } catch (error) {
        console.error('获取当前插件元数据失败:', error);
        return undefined;
    }
}

npp.init = async function (pluginId) {
    try {
        await ensurePluginStore(pluginId);
    } catch (error) {
        console.error('插件存储数据库初始化失败:', error);
        throw error;
    }
};

npp.set = async function (key, value) {
    const metadata = await getCurrentPluginMetadata();
    if (!metadata || !metadata.id) return false;
    try {
        await npp.init(metadata.id);
        // nppDB 会随插件数量升版
        return dbPut(NPP_DB_NAME, metadata.id, { key, value })
            .then(() => true).catch(() => false);
    } catch (error) {
        console.error('设置插件存储失败:', error);
        return false;
    }
};

npp.get = async function (key) {
    const metadata = await getCurrentPluginMetadata();
    if (!metadata || !metadata.id) return undefined;
    try {
        await npp.init(metadata.id);
        return dbGet(NPP_DB_NAME, metadata.id, key)
            .then(result => result ? result.value : undefined)
            .catch(() => undefined);
    } catch (error) {
        console.error('获取插件存储失败:', error);
        return undefined;
    }
};

npp.remove = async function (key) {
    const metadata = await getCurrentPluginMetadata();
    if (!metadata || !metadata.id) return false;
    try {
        await npp.init(metadata.id);
        return dbDelete(NPP_DB_NAME, metadata.id, key)
            .then(() => true).catch(() => false);
    } catch (error) {
        console.error('删除插件存储失败:', error);
        return false;
    }
};

// 暴露到 window
if (typeof window !== 'undefined') {
    window.npp = npp;
}

export { npp };
