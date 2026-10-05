import { ref } from 'vue'

// localStorage 里的 key
export const DATA_SOURCE_KEY = 'dataSource'
export const DATA_SERVER_KEY = 'dataServerUrl'
export const DATA_TOKEN_KEY = 'dataServerToken'

export const SOURCE_LOCAL = 'local'
export const SOURCE_SERVER = 'server'

// 自建 Server 锁定
export const onlyServer = __ONLY_SERVER__ === true
const buildServerUrl = typeof __SERVER_URL__ === 'string' ? __SERVER_URL__ : ''

// 当前生效的来源
export const dataSource = ref(SOURCE_LOCAL)
export const dataServerUrl = ref('')
export const dataServerToken = ref('')
export const lockedByBuild = onlyServer

// 地址处理，去掉末尾的斜杠，补上 /api
export function normalizeServerUrl(value) {
    const raw = String(value ?? '').trim()
    if (!raw) return ''

    try {
        const url = new URL(raw, location.origin)
        if (url.protocol !== 'http:' && url.protocol !== 'https:') return ''

        url.search = ''
        url.hash = ''

        const trimmed = url.pathname.replace(/\/+$/, '')
        url.pathname = /\/api$/.test(trimmed) ? trimmed : trimmed + '/api'

        return url.href.replace(/\/+$/, '')
    } catch (error) {
        return ''
    }
}

// 判断数据源
export function resolveDataSource() {
    if (onlyServer) {
        return {
            mode: SOURCE_SERVER,
            url: normalizeServerUrl(buildServerUrl) || defaultServerUrl(),
            token: readStoredToken()
        }
    }

    let stored = ''
    try {
        stored = localStorage.getItem(DATA_SOURCE_KEY) || ''
    } catch (error) {
        stored = ''
    }

    if (stored !== SOURCE_SERVER) return { mode: SOURCE_LOCAL, url: '', token: '' }

    // 若填了 Docker 变量就不使用 localStorage
    const url = normalizeServerUrl(buildServerUrl)
        || normalizeServerUrl(readStoredUrl())
        || defaultServerUrl()

    return { mode: SOURCE_SERVER, url, token: readStoredToken() }
}

// Docker 部署时页面与 /api 同源，无需填地址
export function defaultServerUrl() {
    return normalizeServerUrl(location.origin)
}

// 不同源时使用设备凭证
export function readStoredToken() {
    try {
        return localStorage.getItem(DATA_TOKEN_KEY) || ''
    } catch (error) {
        return ''
    }
}

function readStoredUrl() {
    try {
        return localStorage.getItem(DATA_SERVER_KEY) || ''
    } catch (error) {
        return ''
    }
}

/* 数据源需刷新生效 */

const SYNC_CHANNEL = 'nitaiPage/dataSource'

// 扩展内填写数据源后通知已打开的 nitaiPage 刷新
export function broadcastDataSourceChanged() {
    try {
        new BroadcastChannel(SYNC_CHANNEL).postMessage({ type: 'changed' })
    } catch (error) { }
}

export function initDataSourceSync() {
    let channel
    try {
        channel = new BroadcastChannel(SYNC_CHANNEL)
    } catch (error) {
        return () => { }
    }

    const onMessage = (event) => {
        if (event.data?.type === 'changed') location.reload()
    }

    channel.addEventListener('message', onMessage)

    return () => {
        channel.removeEventListener('message', onMessage)
        channel.close()
    }
}
