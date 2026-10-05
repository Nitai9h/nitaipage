// 版本号按库名从 DB_SCHEMA 解析
// 自建 Server 模式下的导出都转到 utils/remoteStore.js
// 连接按库名缓存复用，防止每次读写都 open + close

import {
    isRemote,
    remoteClear,
    remoteDelete,
    remoteGet,
    remoteGetAll,
    remoteGetAllKeys,
    remotePut,
    remoteReplaceAll
} from './remoteStore';

export const PAGEDB_NAME = 'nitaiPageDB';
export const PAGEDB_STORE = 'nitaiPage';
export const RANDOM_WALLPAPER_STORE = 'randomWallpaper';
export const CUSTOM_WALLPAPER_STORE = 'customWallpaper';

export const NPP_DB_NAME = 'nppDB';
export const NPP_DB_STORE = 'Npp';

export const NPPSTORE_NAME = 'nppstore';
export const NPPSTORE_STORE = 'Npp';

// 各数据库的版本与固定 store 结构
export const DB_SCHEMA = {
    [PAGEDB_NAME]: {
        version: 2,
        stores: [
            [PAGEDB_STORE, { keyPath: 'id' }],
            [RANDOM_WALLPAPER_STORE, { keyPath: 'id', autoIncrement: true }],
            [CUSTOM_WALLPAPER_STORE, { keyPath: 'id', autoIncrement: true }]
        ]
    },
    [NPPSTORE_NAME]: {
        version: 1,
        stores: [[NPPSTORE_STORE, { keyPath: 'id' }]]
    },
    [NPP_DB_NAME]: {
        version: 1,
        stores: [[NPP_DB_STORE, { keyPath: 'id' }]]
    }
};

// 动态版本库
// 占位 store 随插件数增长，不按固定版本打开
const DYNAMIC_VERSION_DBS = [NPP_DB_NAME];

// 已确认存在专属 store 的插件，避免每次读写都重新查找库结构
const ensuredPluginStores = new Set();

// 进行中的确保任务，并发调用时共用
const ensuringPluginStores = new Map();

// 已校验过 store 结构的固定库，重复 init 直接短路
const initialized = new Set();

// 连接缓存
// 库名 → { promise, version }
const connections = new Map();

// 升级超时
const BLOCKED_TIMEOUT = 4000;

// 未指定版本时取 schema 登记值，动态库给 indexedDB.open 用当前版本
function resolveVersion(dbName, version) {
    if (version) return version;
    if (DYNAMIC_VERSION_DBS.includes(dbName)) return undefined;
    return DB_SCHEMA[dbName] ? DB_SCHEMA[dbName].version : undefined;
}

// 组装 upgradeneeded 回调
// 先按 schema 补齐 store，再跑调用方逻辑
function upgradeWithSchema(dbName, extraCallback) {
    return (db, event) => {
        const schema = DB_SCHEMA[dbName];
        if (schema) {
            for (const [name, options] of schema.stores) {
                if (!db.objectStoreNames.contains(name)) {
                    db.createObjectStore(name, options);
                }
            }
        }
        if (extraCallback) extraCallback(db, event);
    };
}

// 关闭并丢弃某个库的连接
function closeDB(dbName) {
    const cached = connections.get(dbName);
    connections.delete(dbName);
    if (!cached) return;
    cached.promise
        .then((db) => {
            try { db.close(); } catch (error) { /* 已关闭 */ }
        })
        .catch(() => { /* 本来就没打开成功 */ });
}

// 库结构被改动后，清除所有 已探测过 的结论
function invalidateStructureCache(dbName) {
    ensuredPluginStores.clear();
    ensuringPluginStores.clear();
    if (dbName) initialized.delete(dbName);
    else initialized.clear();
}

// 打开数据库（可选升级回调），同库同版本直接复用已缓存的连接
export function openDB(dbName, version, upgradeCallback) {
    const wantVersion = version === undefined || version === null ? null : version;
    const cached = connections.get(dbName);

    if (cached) {
        // 请求版本不高于现连接时直接复用；要升级必须先让出旧连接
        if (wantVersion === null || wantVersion <= cached.version) return cached.promise;
        closeDB(dbName);
    }

    const promise = new Promise((resolve, reject) => {
        // version 为空时不传第二个参数，让 IndexedDB 直接使用当前版本
        const request = wantVersion === null
            ? indexedDB.open(dbName)
            : indexedDB.open(dbName, wantVersion);

        // 兜底计时器
        // 升级被别的标签页占用时会 onblocked，状态解除后仍 successful
        // 成功/失败都要把它清掉
        let blockedTimer = 0;
        const clearBlockedTimer = () => {
            if (blockedTimer) {
                clearTimeout(blockedTimer);
                blockedTimer = 0;
            }
        };

        if (upgradeCallback) {
            request.onupgradeneeded = (event) => {
                upgradeCallback(event.target.result, event);
            };
        }

        request.onsuccess = (event) => {
            clearBlockedTimer();
            const db = event.target.result;
            // 别处要升级时主动让出连接，否则都卡在 blocked
            db.onversionchange = () => {
                db.close();
                connections.delete(dbName);
            };
            db.onclose = () => {
                connections.delete(dbName);
            };
            resolve(db);
        };

        request.onerror = (event) => {
            clearBlockedTimer();
            const error = event.target.error;
            console.error(`打开数据库 ${dbName} 失败: ` + (error && error.message));
            reject(error || new Error(`打开数据库 ${dbName} 失败`));
        };

        request.onblocked = () => {
            if (blockedTimer) return;
            console.warn(`数据库 ${dbName} 被其他标签页占用，等待其释放连接`);
            blockedTimer = setTimeout(() => {
                blockedTimer = 0;
                reject(new Error(`打开数据库 ${dbName} 超时：被其他标签页占用`));
            }, BLOCKED_TIMEOUT);
        };
    });

    // 动态库【版本未知】先按已有值占位，成功后用真实版本校正
    connections.set(dbName, { promise, version: wantVersion === null ? 0 : wantVersion });
    promise
        .then((db) => {
            const entry = connections.get(dbName);
            if (entry && entry.promise === promise) entry.version = db.version;
        })
        .catch(() => {
            const entry = connections.get(dbName);
            if (entry && entry.promise === promise) connections.delete(dbName);
        });

    return promise;
}

// 删除整个数据库（用于重建 store）
export function deleteDB(dbName) {
    closeDB(dbName);
    invalidateStructureCache(dbName);
    return new Promise((resolve, reject) => {
        const request = indexedDB.deleteDatabase(dbName);
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
        request.onblocked = () => reject(new Error(`删除数据库 ${dbName} 被阻塞`));
    });
}

// 外部直接操作过 IndexedDB（如备份、导入、先删库后重建）后必须调用，丢弃旧连接
export function resetDBConnections() {
    Array.from(connections.keys()).forEach(closeDB);
    invalidateStructureCache();
}

// 打开 nitaiPageDB
// 需要起事务时用这个【不要用 openDB(PAGEDB_NAME, 2)】
export function openPageDB() {
    return openDB(PAGEDB_NAME, DB_SCHEMA[PAGEDB_NAME].version, upgradeWithSchema(PAGEDB_NAME));
}

// 在给定连接上跑一次事务
// 写操作要等事务真正提交才算成功
function withStore(dbName, storeName, mode, version, run) {
    return openDB(dbName, resolveVersion(dbName, version), upgradeWithSchema(dbName)).then((db) => {
        return new Promise((resolve, reject) => {
            let transaction;
            try {
                transaction = db.transaction(storeName, mode);
            } catch (error) {
                // store 不存在说明库结构被别处改过
                // 作废探测结论让下次重来
                if (error && error.name === 'NotFoundError') invalidateStructureCache();
                reject(error);
                return;
            }

            let settled = false;
            let result;
            const fail = (error) => {
                if (settled) return;
                settled = true;
                if (error && error.name === 'NotFoundError') invalidateStructureCache();
                reject(error || new Error(`事务失败: ${dbName}.${storeName}`));
            };

            // 事务被中止时 request 未必报错，靠事务本身的完成 / 中止事件收口
            transaction.oncomplete = () => {
                if (settled) return;
                settled = true;
                resolve(result);
            };
            transaction.onerror = () => fail(transaction.error);
            transaction.onabort = () => fail(transaction.error || new Error('事务已中止'));

            let request;
            try {
                request = run(transaction.objectStore(storeName));
            } catch (error) {
                fail(error);
                return;
            }

            request.onsuccess = () => {
                result = request.result;
            };
            request.onerror = () => fail(request.error);
        });
    });
}

// 单次读取
export function dbGet(dbName, storeName, key, version) {
    if (isRemote()) return remoteGet(dbName, storeName, key);
    return withStore(dbName, storeName, 'readonly', version, (store) => store.get(key));
}

// 单次写入
export function dbPut(dbName, storeName, value, version) {
    // 兼容旧版 API 签名 (dbName, storeName, value, key, version)
    let targetVersion = version
    if (arguments.length > 4) {
        console.error(`dbPut 不再接受 key 参数（${dbName}.${storeName}），主键请写进 value`)
        targetVersion = arguments[4]
    }
    if (isRemote()) return remotePut(dbName, storeName, value);
    return withStore(dbName, storeName, 'readwrite', targetVersion, (store) => store.put(value));
}

// 单次删除
export function dbDelete(dbName, storeName, key, version) {
    if (isRemote()) return remoteDelete(dbName, storeName, key);
    return withStore(dbName, storeName, 'readwrite', version, (store) => store.delete(key));
}

// 读取整个 store
export function dbGetAll(dbName, storeName, version) {
    if (isRemote()) return remoteGetAll(dbName, storeName);
    return withStore(dbName, storeName, 'readonly', version, (store) => store.getAll());
}

// 读取 store 全部 key
export function dbGetAllKeys(dbName, storeName, version) {
    if (isRemote()) return remoteGetAllKeys(dbName, storeName);
    return withStore(dbName, storeName, 'readonly', version, (store) => store.getAllKeys());
}

// 清空 store
export function dbClear(dbName, storeName, version) {
    if (isRemote()) return remoteClear(dbName, storeName);
    return withStore(dbName, storeName, 'readwrite', version, (store) => store.clear());
}

// 清空并重写整个 store
// 放在同一事务里，避免中途失败留下半份数据
export function dbReplaceAll(dbName, storeName, values, version) {
    if (isRemote()) return remoteReplaceAll(dbName, storeName, values);
    return withStore(dbName, storeName, 'readwrite', version, (store) => {
        store.clear();
        (values || []).forEach((value) => store.put(value));
        return store.count();
    });
}

// 初始化主数据库 store 结构
// nitaiPage(id) / randomWallpaper(-) / customWallpaper(-)
export function initPageDB() {
    // 自建 Server 不建本地结构
    if (isRemote()) return Promise.resolve();
    if (initialized.has(PAGEDB_NAME)) return Promise.resolve();
    return openPageDB().then((db) => {
        const requiredStores = [PAGEDB_STORE, RANDOM_WALLPAPER_STORE, CUSTOM_WALLPAPER_STORE];
        const missingStores = requiredStores.filter((store) => !db.objectStoreNames.contains(store));

        if (missingStores.length > 0) {
            console.error('缺少必要的对象: ' + missingStores.join(', '));
            return Promise.reject(new Error('missing object stores'));
        }
        initialized.add(PAGEDB_NAME);
    });
}

// 初始化插件源码库 nppstore
// 必须显式调用，否则 saveJSFile 会找不到对象仓库
export function initNppStore() {
    if (isRemote()) return Promise.resolve();
    if (initialized.has(NPPSTORE_NAME)) return Promise.resolve();
    return openDB(NPPSTORE_NAME, DB_SCHEMA[NPPSTORE_NAME].version, upgradeWithSchema(NPPSTORE_NAME))
        .then(() => {
            initialized.add(NPPSTORE_NAME);
        });
}

// 初始化 nppDB 的公共 store
// 不写死版本号（随插件数升版，写死会 VersionError）
export function initNppDB() {
    if (isRemote()) return Promise.resolve();
    if (initialized.has(NPP_DB_NAME)) return Promise.resolve();
    return openDB(NPP_DB_NAME, undefined, upgradeWithSchema(NPP_DB_NAME)).then(() => {
        initialized.add(NPP_DB_NAME);
    });
}

// 确保 nppDB 中存在某个插件专属 store
// 先检查当前版本与已有 store，库为空则重建，否则升版触发结构升级
export function ensurePluginStore(pluginId) {
    if (!pluginId) return Promise.reject(new Error('缺少插件 ID'));

    // 自建 Server 的 store 为按需建表，不存在 结构不存在 的问题
    if (isRemote()) return Promise.resolve();

    // 已确认过就直接返回，插件读写走的是高频路径
    if (ensuredPluginStores.has(pluginId)) return Promise.resolve();

    // 并发调用用同一个任务，避免同时探测 / 升级同一个库
    const pending = ensuringPluginStores.get(pluginId);
    if (pending) return pending;

    const task = createPluginStore(pluginId)
        .then(() => {
            ensuredPluginStores.add(pluginId);
        })
        .finally(() => {
            ensuringPluginStores.delete(pluginId);
        });

    ensuringPluginStores.set(pluginId, task);
    return task;
}

async function createPluginStore(pluginId) {
    const db = await openDB(NPP_DB_NAME);
    const version = db.version;
    const alreadyExists = db.objectStoreNames.contains(pluginId);
    const isEmpty = db.objectStoreNames.length === 0;

    if (alreadyExists) return;

    if (isEmpty) {
        // 全新空库
        // 直接重建，保持版本 1
        await deleteDB(NPP_DB_NAME);
        await openDB(NPP_DB_NAME, DB_SCHEMA[NPP_DB_NAME].version, upgradeWithSchema(NPP_DB_NAME, (d) => {
            if (!d.objectStoreNames.contains(pluginId)) {
                d.createObjectStore(pluginId, { keyPath: 'key' });
            }
        }));
        return;
    }

    // 已存在其他 store
    // 升版触发结构升级
    await openDB(NPP_DB_NAME, version + 1, upgradeWithSchema(NPP_DB_NAME, (d) => {
        if (!d.objectStoreNames.contains(pluginId)) {
            d.createObjectStore(pluginId, { keyPath: 'key' });
        }
    }));
}
