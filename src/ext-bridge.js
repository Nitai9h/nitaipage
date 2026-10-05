// 用于与扩展通信

export const ENVELOPE_CHANNEL = 'nppext'

/* 站点调用扩展 */

export const EXT_HELLO = 'ext.hello' // 扩展握手
export const EXT_REQUEST_PERMISSION = 'ext.requestPermission' // 请求用户授权
export const EXT_GET_FAVICON = 'ext.getFavicon' // 获取网站图标

/* 扩展能力声明 */

export const CAPABILITY_FAVICON = 'favicon'

/* 扩展调用站点 */

export const SITE_ADD_SHORTCUT = 'site.addShortcut' // 添加捷径
export const SITE_SET_DATA_SOURCE = 'site.setDataSource' // 自建 Server 数据源

/* 单向通知（无需响应） */

export const SITE_READY = 'site.ready' // 站点就绪
export const EXT_PERMISSION_GRANTED = 'ext.permissionGranted' // 扩展权限已授予通知

// 来源校验
const EXTENSION_ORIGIN = /^(?:chrome|moz|safari-web)-extension:\/\//


// 校验数据是否为合法通信信封
export function isEnvelope(data) {
    return !!data && typeof data === 'object' && data.channel === ENVELOPE_CHANNEL
}


// 校验消息是否来自 iframe
export function isFromExtensionFrame(event) {
    return event.source === window.parent && EXTENSION_ORIGIN.test(event.origin)
}

let sequence = 0

// 生成全局唯一消息 ID
function nextId() {
    sequence += 1
    return `${Date.now().toString(36)}-${sequence}`
}


// 构建 Request 信封
export function makeRequest(method, params) {
    return { channel: ENVELOPE_CHANNEL, type: 'request', id: nextId(), method, params: params ?? {} }
}

// 构建 Notice 信封（无需响应）
export function makeNotice(method, params) {
    return { channel: ENVELOPE_CHANNEL, type: 'notice', id: nextId(), method, params: params ?? {} }
}

// 构建 Response 信封
export function makeResponse(id, ok, payload) {
    if (ok) {
        return { channel: ENVELOPE_CHANNEL, type: 'response', id, ok: true, data: payload ?? null }
    }
    return {
        channel: ENVELOPE_CHANNEL,
        type: 'response',
        id,
        ok: false,
        error: payload?.error || 'failed',
        detail: payload?.detail ?? null
    }
}

// 创建request caller
// 用于向扩展发送请求并等待响应

export function createCaller() {
    const pending = new Map()

    // 发送请求
    function call(target, targetOrigin, method, params, timeoutMs = 8000) {
        return new Promise((resolve, reject) => {
            const message = makeRequest(method, params)
            const timer = setTimeout(() => {
                pending.delete(message.id)
                reject(Object.assign(new Error('timeout'), { detail: method }))
            }, timeoutMs)

            pending.set(message.id, { resolve, reject, timer })
            target.postMessage(message, targetOrigin)
        })
    }

    // 处理接收到的响应消息
    // 返回 true 表示这条消息是本端某个请求的回应
    function settle(data) {
        if (!isEnvelope(data) || data.type !== 'response') return false

        const entry = pending.get(data.id)
        if (!entry) return false

        pending.delete(data.id)
        clearTimeout(entry.timer)

        if (data.ok) entry.resolve(data.data)
        else entry.reject(Object.assign(new Error(data.error || 'failed'), { detail: data.detail }))

        return true
    }

    return { call, settle }
}

// 创建 request dispatcher
// 用于接收扩展发来的请求，并 route 到对应的处理函数

export function createDispatcher(handlers) {
    return async function dispatch(data) {
        if (!isEnvelope(data) || data.type !== 'request') return null

        const handler = handlers[data.method]
        if (!handler) return makeResponse(data.id, false, { error: 'unknown-method' })

        try {
            return makeResponse(data.id, true, await handler(data.params ?? {}))
        } catch (error) {
            return makeResponse(data.id, false, {
                error: error?.message || 'handler-failed',
                detail: error?.detail
            })
        }
    }
}
