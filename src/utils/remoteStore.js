// 自建服务器的存储接口
// 用于将 IndexedDB 和 localStorage 的操作映射成 HTTP 请求
//
// nitaiPage 与 API 同源时用 cookie 鉴权

import { SOURCE_SERVER, dataServerToken, dataServerUrl, dataSource, resolveDataSource } from './dataSource'

// 设置偏好保存的库
const PREFS_DB = 'nitaiPageDB'
const PREFS_STORE = 'prefs'

let active = false
let baseUrl = ''
let token = ''
let crossOrigin = false
const errorHandlers = new Set()

// 注册错误回调
export function onRemoteError(handler) {
    errorHandlers.add(handler)
    return () => errorHandlers.delete(handler)
}

function reportError(error) {
    errorHandlers.forEach((handler) => {
        try {
            handler(error)
        } catch (reportFailure) {
            console.error('远端错误回调自身出错:', reportFailure)
        }
    })
    console.error('自建 Server 请求失败:', error)
}

// 启动时初始化
export function initRemoteStore() {
    const resolved = resolveDataSource()
    active = resolved.mode === SOURCE_SERVER && !!resolved.url
    baseUrl = resolved.url
    token = resolved.token || ''

    // 同域用 cookie，跨域用 Token
    crossOrigin = active && new URL(baseUrl, location.href).origin !== location.origin

    // 同步显示到设置界面
    dataSource.value = resolved.mode
    dataServerUrl.value = resolved.url
    dataServerToken.value = token

    return { active, url: baseUrl, crossOrigin, token: !!token }
}

export function isRemote() {
    return active
}

export function remoteBase() {
    return baseUrl
}

const seg = (value) => encodeURIComponent(String(value))

async function request(path, options = {}) {
    const headers = { ...(options.headers || {}) }
    if (options.body !== undefined && options.body !== null) headers['Content-Type'] = 'application/json'
    if (token) headers.Authorization = `Bearer ${token}`

    const response = await fetch(baseUrl + path, {
        ...options,
        // 跨域时不带凭证
        credentials: crossOrigin ? 'omit' : 'include',
        headers
    })

    let payload = null
    try {
        payload = await response.json()
    } catch (error) {
        payload = null
    }

    if (!response.ok) {
        throw Object.assign(new Error(payload?.error || `HTTP ${response.status}`), {
            status: response.status,
            detail: path
        })
    }

    // 检查响应格式是否正确
    if (!payload || typeof payload !== 'object' || payload.ok !== true) {
        throw Object.assign(new Error('not-nitai-page-api'), { status: 0, detail: path })
    }

    return payload
}

/* 数据库操作 */

export async function remoteGet(dbName, storeName, key) {
    try {
        const payload = await request(`/db/${seg(dbName)}/${seg(storeName)}/${seg(key)}`)
        return payload?.value
    } catch (error) {
        // 没找到时返回 undefined
        if (error.status === 404) return undefined
        throw error
    }
}

export async function remotePut(dbName, storeName, value, key) {
    // 普通表用 id，插件专属表用 key
    const effective = key !== undefined ? key : (value?.id ?? value?.key)

    if (effective === undefined) {
        // 没有 effective 则让服务器自动生成
        const payload = await request(`/db/${seg(dbName)}/${seg(storeName)}`, {
            method: 'POST',
            body: JSON.stringify(value)
        })
        return payload?.key
    }

    await request(`/db/${seg(dbName)}/${seg(storeName)}/${seg(effective)}`, {
        method: 'PUT',
        body: JSON.stringify(value)
    })

    return effective
}

export async function remoteDelete(dbName, storeName, key) {
    await request(`/db/${seg(dbName)}/${seg(storeName)}/${seg(key)}`, { method: 'DELETE' })
}

// 获取所有记录，原样返回
export async function remoteGetAll(dbName, storeName) {
    const payload = await request(`/db/${seg(dbName)}/${seg(storeName)}`)
    return Array.isArray(payload?.values) ? payload.values : []
}

// 获取所有记录的 key
export async function remoteGetAllKeys(dbName, storeName) {
    const rows = await remoteGetAll(dbName, storeName)
    return rows.map((row) => row?.id ?? row?.key)
}

export async function remoteReplaceAll(dbName, storeName, values) {
    const entries = (values || []).map((value) => ({ key: value?.id ?? value?.key, value }))
    const payload = await request(`/db/${seg(dbName)}/${seg(storeName)}/_all`, {
        method: 'PUT',
        body: JSON.stringify({ entries })
    })
    return payload?.count ?? entries.length
}

export async function remoteClear(dbName, storeName) {
    await remoteReplaceAll(dbName, storeName, [])
}

/* 偏好设置 */

export async function loadRemotePrefs() {
    const rows = await remoteGetAll(PREFS_DB, PREFS_STORE)
    const prefs = new Map()
    rows.forEach((row) => {
        if (row && typeof row === 'object' && typeof row.id === 'string') prefs.set(row.id, String(row.value ?? ''))
    })
    return prefs
}

export async function saveRemotePref(key, value) {
    try {
        await remotePut(PREFS_DB, PREFS_STORE, { id: key, value: String(value) }, key)
    } catch (error) {
        reportError(error)
    }
}

export async function removeRemotePref(key) {
    try {
        await remoteDelete(PREFS_DB, PREFS_STORE, key)
    } catch (error) {
        reportError(error)
    }
}

// 清空所有偏好
export async function clearRemotePrefs() {
    await remoteReplaceAll(PREFS_DB, PREFS_STORE, [])
}

/* 文件操作（壁纸等） */

function authHeaders() {
    return token ? { Authorization: `Bearer ${token}` } : {}
}

// 上传文件，返回 { ref, size }
export async function remotePutFile(file, name) {
    const response = await fetch(`${baseUrl}/files?name=${encodeURIComponent(name || 'file')}`, {
        method: 'POST',
        credentials: crossOrigin ? 'omit' : 'include',
        headers: { ...authHeaders(), 'Content-Type': 'application/octet-stream' },
        body: file
    })

    const payload = await response.json().catch(() => null)
    if (!response.ok || !payload?.ok) {
        throw Object.assign(new Error(payload?.error || `HTTP ${response.status}`), {
            status: response.status,
            detail: 'files'
        })
    }

    return { ref: payload.ref, size: payload.size }
}

// 下载文件
// 不能直接把地址 <img> ，跨域时图片请求带不上 Token 会 401，同源时靠 cookie
// 因此统一 fetch 下载后转成 blob URL，避免 canvas 跨域问题
export async function remoteGetFile(ref) {
    const response = await fetch(`${baseUrl}/files/${encodeURIComponent(ref)}`, {
        credentials: crossOrigin ? 'omit' : 'include',
        headers: authHeaders()
    })

    if (!response.ok) {
        throw Object.assign(new Error(`HTTP ${response.status}`), { status: response.status, detail: 'files' })
    }
    return response.blob()
}

// 删除服务端文件
export async function remoteDeleteFile(ref) {
    const response = await fetch(`${baseUrl}/files/${encodeURIComponent(ref)}`, {
        method: 'DELETE',
        credentials: crossOrigin ? 'omit' : 'include',
        headers: authHeaders()
    })

    // 文件不存在也成功
    const payload = await response.json().catch(() => null)
    if (!response.ok || !payload?.ok) {
        throw Object.assign(new Error(payload?.error || `HTTP ${response.status}`), {
            status: response.status,
            detail: 'files'
        })
    }
    return true
}
