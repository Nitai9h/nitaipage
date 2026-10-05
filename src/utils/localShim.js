// 重新实现 localStorage（内存 + 远端存储）
//
// 在自建 Server 的模式下才直接替换掉全局 localStorage：
// 
// 从启动时加载的内存副本里读取
// 写入时同时更新内存和服务器
//
// 若启动时从服务器拉取数据失败，则不启用此方案

import { DATA_SERVER_KEY, DATA_SOURCE_KEY, DATA_TOKEN_KEY } from './dataSource'
import { loadRemotePrefs, removeRemotePref, saveRemotePref } from './remoteStore'

// 只保存在本地，不上传服务器的 Key
const LOCAL_ONLY_KEYS = new Set([DATA_SOURCE_KEY, DATA_SERVER_KEY, DATA_TOKEN_KEY])

// 接管原生 localStorage，用于读写数据源配置
const nativeStorage = (() => {
    try {
        return globalThis.localStorage
    } catch (error) {
        return null
    }
})()

const memory = new Map()
let installed = false

function nativeKeys() {
    if (!nativeStorage) return []
    return [...LOCAL_ONLY_KEYS].filter((key) => nativeStorage.getItem(key) !== null)
}

function createStorage() {
    return {
        getItem(key) {
            const name = String(key)
            if (LOCAL_ONLY_KEYS.has(name)) return nativeStorage ? nativeStorage.getItem(name) : null
            return memory.has(name) ? memory.get(name) : null
        },
        setItem(key, value) {
            const name = String(key)
            if (LOCAL_ONLY_KEYS.has(name)) {
                if (nativeStorage) nativeStorage.setItem(name, String(value))
                return
            }
            memory.set(name, String(value))
            saveRemotePref(name, value)
        },
        removeItem(key) {
            const name = String(key)
            if (LOCAL_ONLY_KEYS.has(name)) {
                if (nativeStorage) nativeStorage.removeItem(name)
                return
            }
            memory.delete(name)
            removeRemotePref(name)
        },
        // 清除时要把源配置一起清掉，否则会连接到旧的服务器
        clear() {
            const keys = [...memory.keys()]
            memory.clear()
            keys.forEach((name) => removeRemotePref(name))
            if (nativeStorage) nativeKeys().forEach((name) => nativeStorage.removeItem(name))
        },
        key(index) {
            const all = [...nativeKeys(), ...memory.keys()]
            return all[index] ?? null
        },
        get length() {
            return nativeKeys().length + memory.size
        }
    }
}

// false 无法读取数据服务，启动时中断加载过程
export async function installLocalStorageShim() {
    if (installed) return true

    let prefs
    try {
        prefs = await loadRemotePrefs()
    } catch (error) {
        console.error('读取远端设置失败，暂不接管本地存储:', error)
        return false
    }

    prefs.forEach((value, key) => {
        // 忽略服务器上的旧的连接配置
        if (LOCAL_ONLY_KEYS.has(key)) return
        memory.set(key, value)
    })

    Object.defineProperty(globalThis, 'localStorage', {
        value: createStorage(),
        configurable: true,
        writable: true
    })

    installed = true
    return true
}

export function isShimInstalled() {
    return installed
}
