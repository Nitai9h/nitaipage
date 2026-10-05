// 只处理扩展发起的一次性写入，不加载整个应用，供 bridge 使用
import { appendShortcut, broadcastShortcutAdded } from '@/composables/useShortcuts'
import {
    DATA_SERVER_KEY,
    DATA_SOURCE_KEY,
    DATA_TOKEN_KEY,
    SOURCE_LOCAL,
    SOURCE_SERVER,
    broadcastDataSourceChanged,
    lockedByBuild,
    normalizeServerUrl
} from '@/utils/dataSource'
import {
    SITE_ADD_SHORTCUT,
    SITE_READY,
    SITE_SET_DATA_SOURCE,
    createDispatcher,
    isEnvelope,
    isFromExtensionFrame,
    makeNotice
} from '@/ext-bridge'

// 将扩展传递的 Payload 转换为标准的捷径
// 扩展获取不到 icon 时，回退到 url
function toShortcut(payload) {
    const url = String(payload?.url ?? '').trim()
    if (!/^https?:/i.test(url)) throw new Error('invalid-url')

    const record = {
        title: String(payload?.title ?? '').trim() || url,
        url
    }

    // 过滤无法加载的无效地址
    const icon = String(payload?.icon ?? '').trim()
    if (/^(data:|https?:)/i.test(icon)) record.icon = icon

    return record
}

// 把数据存到自建服务上
// 写 origin 站点的 localStorage
function applyDataSource(payload) {
    if (lockedByBuild) throw new Error('locked-by-build')

    if (payload?.mode === 'local') {
        localStorage.setItem(DATA_SOURCE_KEY, SOURCE_LOCAL)
        localStorage.removeItem(DATA_SERVER_KEY)
        localStorage.removeItem(DATA_TOKEN_KEY)
        broadcastDataSourceChanged()
        return { mode: SOURCE_LOCAL }
    }

    const url = normalizeServerUrl(payload?.url)
    if (!url) throw new Error('invalid-url')

    // 凭证由扩展配对后一起传入
    const token = String(payload?.token ?? '').trim()
    if (!token) throw new Error('missing-token')

    localStorage.setItem(DATA_SERVER_KEY, url)
    localStorage.setItem(DATA_TOKEN_KEY, token)
    localStorage.setItem(DATA_SOURCE_KEY, SOURCE_SERVER)
    broadcastDataSourceChanged()

    return { mode: SOURCE_SERVER, url }
}

const dispatch = createDispatcher({
    [SITE_ADD_SHORTCUT]: async (params) => {
        const result = await appendShortcut(toShortcut(params))
        // 用于让已打开的起始页刷新数据
        broadcastShortcutAdded()
        return { created: result.created, key: result.key }
    },

    [SITE_SET_DATA_SOURCE]: async (params) => applyDataSource(params)
})

window.addEventListener('message', async (event) => {
    if (!isFromExtensionFrame(event)) return
    if (!isEnvelope(event.data)) return

    const response = await dispatch(event.data)
    if (response) window.parent.postMessage(response, event.origin)
})

// 通知扩展初始化完毕
window.parent.postMessage(makeNotice(SITE_READY, {}), '*')
