// 站点与浏览器扩展之间的通信
// 只在 iframe 内时启用
import { ref } from 'vue'
import {
    CAPABILITY_FAVICON,
    EXT_GET_FAVICON,
    EXT_HELLO,
    EXT_PERMISSION_GRANTED,
    EXT_REQUEST_PERMISSION,
    SITE_READY,
    createCaller,
    isEnvelope,
    isFromExtensionFrame,
    makeNotice
} from '@/ext-bridge'

const HELLO_TIMEOUT_MS = 4000

const isExtension = ref(false)
const extensionVersion = ref('')
const capabilities = ref([])

const caller = createCaller()

// 权限授予事件的回调
const grantedHandlers = new Set()

let initialized = false

async function handleMessage(event) {
    if (!isFromExtensionFrame(event)) return
    if (!isEnvelope(event.data)) return

    // 扩展对请求的应答
    if (caller.settle(event.data)) return

    // 返回授权结果
    if (event.data.type !== 'notice' || event.data.method !== EXT_PERMISSION_GRANTED) return

    grantedHandlers.forEach((handler) => {
        try {
            handler(event.data.params?.permission)
        } catch (error) {
            console.error('授权失败:', error)
        }
    })
}

async function handshake() {
    try {
        const reply = await caller.call(window.parent, '*', EXT_HELLO, {}, HELLO_TIMEOUT_MS)
        isExtension.value = true
        extensionVersion.value = reply?.version ?? ''
        capabilities.value = Array.isArray(reply?.capabilities) ? reply.capabilities : []
    } catch {
        isExtension.value = false
    }

    window.parent.postMessage(makeNotice(SITE_READY, {}), '*')
}

// 询问扩展是否已有某项授权，未授予时扩展会弹横幅让用户点确认
export async function requestExtensionPermission(permission) {
    if (window.parent === window && window.__nppExtBridge && typeof window.__nppExtBridge.requestPermission === 'function') {
        return await window.__nppExtBridge.requestPermission(permission)
    }
    if (!isExtension.value) return { granted: false }

    try {
        return await caller.call(window.parent, '*', EXT_REQUEST_PERMISSION, { permission })
    } catch {
        return { granted: false }
    }
}

export function onExtensionPermissionGranted(handler) {
    grantedHandlers.add(handler)
    return () => grantedHandlers.delete(handler)
}

// 按地址取网站图标，取不到一律返回 null，由调用方回退
export async function requestFavicon(url, size = 32) {
    if (window.parent === window && window.__nppExtBridge && typeof window.__nppExtBridge.getFavicon === 'function') {
        return await window.__nppExtBridge.getFavicon(url, size)
    }
    if (!isExtension.value) return null
    if (!capabilities.value.includes(CAPABILITY_FAVICON)) return null

    try {
        const result = await caller.call(window.parent, '*', EXT_GET_FAVICON, { url, size })
        return result?.dataUrl ?? null
    } catch {
        return null
    }
}

let topBridgeTimer = 0

function adoptTopBridge() {
    const bridge = window.__nppExtBridge
    if (!bridge) return false
    isExtension.value = true
    extensionVersion.value = bridge.version || ''
    capabilities.value = Array.isArray(bridge.capabilities) ? bridge.capabilities : []
    return true
}

function watchTopBridge() {
    if (topBridgeTimer || adoptTopBridge()) return
    let tries = 0
    topBridgeTimer = setInterval(function () {
        tries += 1
        if (adoptTopBridge() || tries > 50) {
            clearInterval(topBridgeTimer)
            topBridgeTimer = 0
        }
    }, 100)
}

export function initExtensionBridge() {
    if (initialized) return
    initialized = true

    // 插件是裸 script 注入的，只能通过全局变量拿到这套能力
    window.nppExt = {
        get isExtension() {
            return isExtension.value
        },
        get version() {
            return extensionVersion.value
        },
        get capabilities() {
            return capabilities.value
        },
        requestPermission: requestExtensionPermission,
        onPermissionGranted: onExtensionPermissionGranted,
        getFavicon: requestFavicon
    }

    // 用户来源分为 直接用浏览器打开 与 安装扩展后使用http连接到自部署站点

    // 前者 bridge 不存在，nppExt 保持为空，isExtension 为 false

    // 后者扩展页无法 iframe 嵌入（Mixed Content Security Policy）
    // 扩展通过 content script 注入 window.__nppExtBridge 提供同等能力

    // page-bridge 由扩展在 document_start 注入
    if (window.parent === window) {
        adoptTopBridge()
        watchTopBridge()
        return
    }

    window.addEventListener('message', handleMessage)
    handshake()
}
