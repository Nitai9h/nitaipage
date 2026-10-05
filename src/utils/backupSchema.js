// 备份文件自带 version 字段；没有该字段的视为 v3.0.0 之前的结构，
// 导入前按当前支持范围过滤

import {
    PAGEDB_NAME, NPPSTORE_NAME, NPPSTORE_STORE, NPP_DB_NAME,
    DB_SCHEMA, dbGet, dbDelete, resetDBConnections
} from '@/utils/db'
import { SEMVER } from '@/core/version'

// 当前备份格式版本
export const BACKUP_VERSION = SEMVER

// 先前保存的 coreNpp 依赖 jQuery，现已不可用，必须清掉才能回退到内置版
export const CACHED_CORE_NPP_IDS = [
    'themeColor',
    'advancedSettings',
    'customStyle'
]

// 从 DB_SCHEMA 获取支持的 store
// null 表示 store 不限
function schemaStores(dbName) {
    const schema = DB_SCHEMA[dbName]
    return schema ? schema.stores.map(([name]) => name) : []
}

// 当前支持的 IndexedDB 结构
// nppDB 的 store 由插件按 id 动态创建，无法技术，因此不限
export const SUPPORTED_DB_STORES = {
    [PAGEDB_NAME]: schemaStores(PAGEDB_NAME),
    [NPPSTORE_NAME]: schemaStores(NPPSTORE_NAME),
    [NPP_DB_NAME]: null
}

// v3.0.0 起不再使用的 localStorage
export const REMOVED_LOCAL_STORAGE_KEYS = ['customStyle']

// 查询该库当前是否支持
export function isSupportedDB(dbName) {
    return Object.prototype.hasOwnProperty.call(SUPPORTED_DB_STORES, dbName)
}

function isSupportedStore(dbName, storeName) {
    const allow = SUPPORTED_DB_STORES[dbName]
    if (allow === undefined) return false
    if (allow === null) return true
    return allow.includes(storeName)
}

// 不再使用先前下载的 coreNpp 源码
function isRemovedPluginSource(dbName, storeName, row) {
    return dbName === NPPSTORE_NAME
        && storeName === NPPSTORE_STORE
        && !!row
        && CACHED_CORE_NPP_IDS.includes(row.id)
}

// 判断备份文件是否带版本号（ X.Y.Z）
export function hasBackupVersion(data) {
    return !!(data && typeof data.version === 'string' && /^\d+\.\d+\.\d+/.test(data.version))
}

/**
 * 按当前支持范围过滤备份内容
 * @param {object} data 解析后的备份内容
 * @returns {{data: object, dropped: string[]}} 过滤后的内容与被废弃清单
 */
export function filterBackupData(data) {
    const source = data && typeof data === 'object' ? data : {}
    const dropped = []

    const result = {
        version: source.version,
        backupTime: source.backupTime,
        localStorage: {},
        cookies: source.cookies && typeof source.cookies === 'object' ? source.cookies : {},
        indexedDB: { databases: [] }
    }

    // 移除无效 localStorage 配置
    const storage = source.localStorage && typeof source.localStorage === 'object' ? source.localStorage : {}
    Object.entries(storage).forEach(([key, value]) => {
        if (REMOVED_LOCAL_STORAGE_KEYS.includes(key)) {
            dropped.push('localStorage: ' + key)
            return
        }
        result.localStorage[key] = value
    })

    // 只保留支持的库和IndexedDB store
    const databases = source.indexedDB && Array.isArray(source.indexedDB.databases)
        ? source.indexedDB.databases
        : []
    databases.forEach((db) => {
        if (!db || !isSupportedDB(db.name)) {
            if (db && db.name) dropped.push('indexedDB 库: ' + db.name)
            return
        }

        const stores = {}
        Object.entries(db.data || {}).forEach(([storeName, rows]) => {
            if (!isSupportedStore(db.name, storeName)) {
                dropped.push('indexedDB store: ' + db.name + '.' + storeName)
                return
            }

            const list = Array.isArray(rows) ? rows : []
            stores[storeName] = list.filter((row) => {
                if (isRemovedPluginSource(db.name, storeName, row)) {
                    dropped.push('indexedDB 记录: ' + db.name + '.' + storeName + ' / ' + row.id)
                    return false
                }
                return true
            })
        })

        result.indexedDB.databases.push({ name: db.name, data: stores })
    })

    return { data: result, dropped }
}

/**
 * 移除当前浏览器里不再支持的配置项
 * @returns {Promise<{localStorage: string[], databases: string[], pluginSources: string[]}>} 实际移除的项
 */
export async function pruneUnsupportedData() {
    const removed = { localStorage: [], databases: [], pluginSources: [] }

    REMOVED_LOCAL_STORAGE_KEYS.forEach((key) => {
        if (localStorage.getItem(key) === null) return
        localStorage.removeItem(key)
        removed.localStorage.push(key)
    })

    if (typeof indexedDB !== 'undefined' && typeof indexedDB.databases === 'function') {
        const databases = await indexedDB.databases().catch(() => [])

        for (const db of databases) {
            if (!db || !db.name || isSupportedDB(db.name)) continue
            await new Promise((resolve) => {
                const request = indexedDB.deleteDatabase(db.name)
                // 报错时继续执行
                request.onsuccess = resolve
                request.onerror = resolve
                request.onblocked = resolve
            })
            removed.databases.push(db.name)
        }

        if (removed.databases.length) resetDBConnections()
    }

    // 删掉保存的 coreNpp，回退到内置的  coreNpp
    for (const id of CACHED_CORE_NPP_IDS) {
        const record = await dbGet(NPPSTORE_NAME, NPPSTORE_STORE, id).catch(() => null)
        if (!record) continue
        await dbDelete(NPPSTORE_NAME, NPPSTORE_STORE, id).catch(() => { /* 删除失败继续 */ })
        removed.pluginSources.push(id)
    }

    return removed
}
