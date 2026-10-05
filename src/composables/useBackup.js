import {
    CUSTOM_WALLPAPER_STORE, DB_SCHEMA, PAGEDB_NAME, RANDOM_WALLPAPER_STORE, resetDBConnections
} from '@/utils/db'
import { clearRemotePrefs, isRemote, remoteGetAll, remoteGetFile, remotePutFile, remoteReplaceAll } from '@/utils/remoteStore'
import { BACKUP_VERSION, filterBackupData, hasBackupVersion, isSupportedDB } from '@/utils/backupSchema'
import {
    FILES_PREFIX, base64ToBlob, blobToBytes, bytesToBlob, isZipBuffer, packArchive, unpackArchive
} from '@/utils/backupArchive'
import { downloadBlob } from '@/utils/dom'
import { fileExt, mimeExt, newFileName, opfsClear, opfsGet, opfsPut, opfsReady } from '@/utils/opfs'
import { useToast } from './useToast'

// 数据备份 / 恢复
// 产物为 zip：backup.json 存原 JSON 数据，files/ 下存壁纸
// 兼容 v3.0.0 之前的 JSON 备份

/* IndexedDB Promise 化 + async/await，分支收敛到一处 */

// 把 IDBRequest 包成 Promise
// 失败抛出 resolve(undefined)
function toPromise(request) {
    return new Promise((resolve) => {
        request.onsuccess = () => resolve(request.result)
        request.onerror = () => resolve(undefined)
    })
}

// 壁纸所在的 store
function isMediaRow(dbName, storeName) {
    return dbName === PAGEDB_NAME
        && (storeName === RANDOM_WALLPAPER_STORE || storeName === CUSTOM_WALLPAPER_STORE)
}

// 取出某一壁纸
// 本地在 OPFS，自建在服务端
// 老备份（v3.0.0 以前）则内联成 base64
async function readMediaBlob(row) {
    if (row.opfsName && await opfsReady()) {
        const blob = await opfsGet(row.opfsName)
        if (blob) return blob
    }

    if (row.ref && isRemote()) {
        try {
            return await remoteGetFile(row.ref)
        } catch (error) {
            console.error('读取服务端壁纸文件失败:', error)
        }
    }

    return inlineBlob(row)
}

// 解析老备份里的 base64
function inlineBlob(row) {
    if (!row || !row.data) return null
    try {
        return base64ToBlob(row.data, row.type)
    } catch (error) {
        console.error('解析内联壁纸数据失败:', error)
        return null
    }
}

// 导出前把壁纸抽出
// 只留 zipPath，不内联 base64
async function collectMedia(rows, dbName, storeName, media) {
    if (!Array.isArray(rows) || rows.length === 0) return rows
    if (!isMediaRow(dbName, storeName)) return rows

    const out = []
    for (const row of rows) {
        if (!row || typeof row !== 'object') {
            out.push(row)
            continue
        }

        const blob = await readMediaBlob(row)
        if (!blob) {
            out.push(row)
            continue
        }

        const path = FILES_PREFIX + media.length + (fileExt(row.name) || mimeExt(row.type))
        media.push({ path, bytes: await blobToBytes(blob) })

        const next = { ...row, zipPath: path }
        delete next.data
        delete next.ref
        out.push(next)
    }

    return out
}

// 导入数据到当前配置的数据来源
async function restoreMedia(rows, dbName, storeName, media) {
    if (!Array.isArray(rows) || rows.length === 0) return rows
    if (!isMediaRow(dbName, storeName)) return rows

    const out = []
    for (const row of rows) {
        if (!row || typeof row !== 'object') {
            out.push(row)
            continue
        }

        const packed = row.zipPath && media ? media.get(row.zipPath) : null
        const blob = packed ? bytesToBlob(packed, row.type) : inlineBlob(row)
        if (!blob) {
            out.push(row)
            continue
        }

        const next = { ...row }
        delete next.zipPath
        delete next.data

        if (isRemote()) {
            try {
                const uploaded = await remotePutFile(blob, row.name || 'wallpaper')
                next.ref = uploaded.ref
                delete next.opfsName
            } catch (error) {
                console.error('恢复服务端壁纸文件失败:', error)
            }
        } else {
            // 本地模式沿用原文件名
            const opfsName = row.opfsName || newFileName(fileExt(row.name) || mimeExt(row.type))
            if (await opfsReady()) await opfsPut(opfsName, blob)
            next.opfsName = opfsName
            delete next.ref
        }

        out.push(next)
    }

    return out
}

// 导入壁纸到当前配置的数据来源
// 顺便将老备份的 base64 转成文件
async function restoreAllMedia(indexedDBData, media) {
    if (!indexedDBData?.databases) return

    for (const database of indexedDBData.databases) {
        for (const [storeName, rows] of Object.entries(database.data || {})) {
            database.data[storeName] = await restoreMedia(rows, database.name, storeName, media)
        }
    }
}

// 打开数据库
// 只在需要升级（新建）时调用
function openDatabase(name, onUpgrade) {
    return new Promise((resolve) => {
        const request = indexedDB.open(name)
        if (onUpgrade) request.onupgradeneeded = (event) => onUpgrade(event.target.result)
        request.onsuccess = () => resolve(request.result)
        request.onerror = () => resolve(undefined)
    })
}

// 删除数据库
// 导入前先删干净，避免残留无用数据
function deleteDatabase(name) {
    return new Promise((resolve) => {
        const request = indexedDB.deleteDatabase(name)
        request.onsuccess = () => resolve(true)
        request.onerror = () => resolve(false)
    })
}

// 备份时跳过当前不支持的库
// 翻译字典体积大且可重新下载，不进备份文件
function isSkippedDB(name) {
    return !name || !isSupportedDB(name)
}

// 服务端按 schema 逐个取出，db/store 写死在 DB_SCHEMA 中
function knownDatabases() {
    return Object.entries(DB_SCHEMA).filter(([name]) => !isSkippedDB(name))
}

async function getAllRemoteData(media) {
    const databases = []

    for (const [name, schema] of knownDatabases()) {
        const data = {}
        for (const [storeName] of schema.stores) {
            const rows = await remoteGetAll(name, storeName).catch(() => [])
            data[storeName] = await collectMedia(rows, name, storeName, media)
        }
        databases.push({ name, data })
    }

    return { databases }
}

// 清空当前配置的数据源里的全部数据
export async function wipeAllData() {
    if (isRemote()) {
        // 保存的设置项
        await clearRemotePrefs().catch(() => { /* 失败不阻塞 */ })

        for (const [name, schema] of knownDatabases()) {
            for (const [storeName] of schema.stores) {
                await remoteReplaceAll(name, storeName, []).catch(() => { /* 单个 store 失败不阻塞 */ })
            }
        }
        return
    }

    const dbs = await indexedDB.databases().catch(() => [])
    for (const db of dbs) {
        if (db.name) indexedDB.deleteDatabase(db.name)
    }

    // 壁纸文件单独清
    await opfsClear()
}

// 导出全部 IndexedDB 数据
// 壁纸直接放入 media
export async function getAllIndexedDBData(media = []) {
    if (isRemote()) return getAllRemoteData(media)

    if (!window.indexedDB) return {}

    const dbList = await indexedDB.databases().catch(() => [])
    if (dbList.length === 0) return {}

    const databases = await Promise.all(
        dbList.filter((info) => !isSkippedDB(info.name)).map(async ({ name }) => {
            const db = await openDatabase(name)
            if (!db) return null

            try {
                const storeNames = Array.from(db.objectStoreNames)
                if (storeNames.length === 0) return { name, data: {} }

                // 性能优化，只用一个只读事务读取所有 store
                const transaction = db.transaction(storeNames, 'readonly')
                const rows = {}
                await Promise.all(storeNames.map(async (storeName) => {
                    rows[storeName] = await toPromise(transaction.objectStore(storeName).getAll())
                }))

                // OPFS 的读取需等事务结束
                const data = {}
                for (const [storeName, list] of Object.entries(rows)) {
                    data[storeName] = await collectMedia(list ?? [], name, storeName, media)
                }
                return { name, data }
            } finally {
                db.close()
            }
        })
    )

    return { databases: databases.filter(Boolean) }
}

// 导入 IndexedDB 数据（先删库重建，再导入记录）
export async function importIndexedDBData(indexedDBData) {
    if (!indexedDBData?.databases) return

    // 自建 Serve 模式
    if (isRemote()) {
        for (const { name, data } of indexedDBData.databases) {
            if (isSkippedDB(name)) continue
            for (const [storeName, rows] of Object.entries(data || {})) {
                await remoteReplaceAll(name, storeName, Array.isArray(rows) ? rows : [])
            }
        }
        return
    }

    if (!window.indexedDB) return

    resetDBConnections()

    const targets = indexedDBData.databases.filter((info) => !isSkippedDB(info.name))

    await Promise.all(targets.map(async ({ name, data }) => {
        const dbData = data || {}
        const storeNames = Object.keys(dbData)

        // 先删掉旧库
        // open() 不带版本号，重建时才能触发 onupgradeneeded 建 store
        await deleteDatabase(name)

        const db = await openDatabase(name, (upgradingDb) => {
            storeNames.forEach((storeName) => {
                if (!upgradingDb.objectStoreNames.contains(storeName)) {
                    upgradingDb.createObjectStore(storeName, { keyPath: 'id', autoIncrement: true })
                }
            })
        })
        if (!db) return

        try {
            if (storeNames.length === 0) return

            const transaction = db.transaction(storeNames, 'readwrite')
            storeNames.forEach((storeName) => {
                const rows = dbData[storeName]
                if (!rows || rows.length === 0) return
                const store = transaction.objectStore(storeName)
                rows.forEach((item) => {
                    // add 失败不中断整库恢复
                    // 由事务自行决定结束
                    try {
                        store.add(item)
                    } catch (error) {
                        // 忽略单条失败
                    }
                })
            })

            // 等待事务完成
            await new Promise((resolve) => {
                transaction.oncomplete = resolve
                transaction.onerror = resolve
                transaction.onabort = resolve
            })
        } finally {
            db.close()
        }
    }))
}

// 获取全部 localStorage
export function getAllLocalStorage() {
    const data = {}
    for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i)
        data[key] = localStorage.getItem(key)
    }
    return data
}

// 恢复 localStorage
export function setAllLocalStorage(data = {}) {
    Object.entries(data).forEach(([key, value]) => {
        localStorage.setItem(key, value)
    })
}

// 获取全部 cookie
export function getAllCookies() {
    const cookies = {}
    const pairs = document.cookie ? document.cookie.split('; ') : []
    pairs.forEach((pair) => {
        const eq = pair.indexOf('=')
        if (eq === -1) return
        cookies[pair.slice(0, eq)] = pair.slice(eq + 1)
    })
    return cookies
}

// 恢复 cookie
export function setAllCookies(cookies = {}) {
    Object.entries(cookies).forEach(([name, value]) => {
        document.cookie = `${name}=${value};path=/`
    })
}

export function useBackup() {
    const toast = useToast()

    // 导出 zip：JSON 数据 + 壁纸本体
    async function exportData() {
        const media = []
        const payload = {
            version: BACKUP_VERSION,
            backupTime: new Date().toISOString(),
            localStorage: getAllLocalStorage(),
            cookies: getAllCookies(),
            indexedDB: await getAllIndexedDBData(media)
        }

        const bytes = await packArchive(payload, media)
        downloadBlob(`nitaiPage-backup-${Date.now()}.zip`, bytesToBlob(bytes, 'application/zip'))
        toast.message('@global:backup-export-success')
    }

    /**
     * 解析备份文件
     * zip 单独处理，其余按老版本的 JSON 备份处理
     * @returns {Promise<{payload: object, media: Map<string, Uint8Array>}>}
     */
    async function parseBackup(file) {
        let buffer
        try {
            buffer = await file.arrayBuffer()
        } catch (error) {
            throw new Error('@global:data-parse-error')
        }

        if (isZipBuffer(buffer)) {
            try {
                return await unpackArchive(buffer)
            } catch (error) {
                throw new Error('@global:data-parse-error')
            }
        }

        try {
            const payload = JSON.parse(new TextDecoder().decode(buffer))
            if (!payload || typeof payload !== 'object') {
                throw new Error('format')
            }
            return { payload, media: new Map() }
        } catch (error) {
            throw new Error('@global:data-parse-error')
        }
    }

    // 应用备份数据
    // 没有版本号的备份视为v3.0.0 之前，先过滤再导入
    async function applyBackup(data, media = new Map()) {
        const isLegacy = !hasBackupVersion(data)
        const { data: normalized, dropped } = filterBackupData(data)

        if (isLegacy) {
            console.warn('[Backup] 备份文件来自旧版本，将会过滤不支持的项')
        }
        if (dropped.length) {
            console.warn('[Backup] 已忽略当前不支持的项：', dropped)
        }

        await restoreAllMedia(normalized.indexedDB, media)

        if (normalized.cookies) setAllCookies(normalized.cookies)
        setAllLocalStorage(normalized.localStorage)
        await importIndexedDBData(normalized.indexedDB)

        return { isLegacy, dropped }
    }

    return { exportData, parseBackup, applyBackup }
}
