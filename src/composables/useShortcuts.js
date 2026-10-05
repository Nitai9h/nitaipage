import { ref } from 'vue'
import { PAGEDB_NAME, PAGEDB_STORE, dbGet, dbPut, initPageDB } from '@/utils/db'
import { nextNumericKey } from '@/utils/keys'
import { quick_list_preinstall } from '@/core/presets'

// 捷径存储位置： nitaiPageDB -> nitaiPage -> { id:'quick_list', value: JSON }

const QUICK_LIST_KEY = 'quick_list'

// 用于扩展与起始页间的通信（扩展新增捷径后，起始页重载）
const SYNC_CHANNEL = 'nitaiPage/shortcut'
const SYNC_ADDED = 'shortcut-added'

// 单例状态
const quickList = ref({})
const loaded = ref(false)

// 读取捷径列表
export async function getQuickList() {
    await initPageDB()
    const record = await dbGet(PAGEDB_NAME, PAGEDB_STORE, QUICK_LIST_KEY)
    if (record && record.value && record.value !== '{}') {
        return JSON.parse(record.value)
    }
    await setQuickList(quick_list_preinstall)
    return quick_list_preinstall
}

// 写入捷径列表
export async function setQuickList(list) {
    if (!list) return false
    await initPageDB()
    await dbPut(PAGEDB_NAME, PAGEDB_STORE, { id: QUICK_LIST_KEY, value: JSON.stringify(list) })
    return true
}

// 追加一条捷径（按 URL 去重），返回 { created, key }
// 每次从数据库重新读取后再合并写入，避免内存副本覆盖他人改动
// icon 为可选字段，仅在扩展抓取到图标时携带
export async function appendShortcut({ title, url, icon }) {
    if (!url) throw new Error('missing-url')

    const list = await getQuickList()
    const existingKey = Object.keys(list).find((key) => list[key]?.url === url)
    if (existingKey) return { created: false, key: existingKey }

    const key = nextNumericKey(list)
    const record = { title: title || url, url }
    if (icon) record.icon = icon
    list[key] = record

    await setQuickList(list)
    await refreshQuickList()
    return { created: true, key }
}

// 重新读取到内存
export async function refreshQuickList() {
    try {
        quickList.value = await getQuickList()
        loaded.value = true
    } catch (error) {
        console.error('加载捷径数据失败:', error)
        quickList.value = quick_list_preinstall
    }
    return quickList.value
}

// 插件写入完成后页面重载
export function broadcastShortcutAdded() {
    // 页面即将销毁，提前关闭可能导致消息丢失，不主动 close
    new BroadcastChannel(SYNC_CHANNEL).postMessage({ type: SYNC_ADDED })
}

// 监听扩展写入
export function initShortcutSync() {
    const channel = new BroadcastChannel(SYNC_CHANNEL)
    channel.addEventListener('message', (event) => {
        if (event.data?.type !== SYNC_ADDED) return
        refreshQuickList()
    })
}

export function useShortcuts() {
    return {
        quickList,
        loaded,
        refreshQuickList,
        getQuickList,
        setQuickList,
        appendShortcut,
        broadcastShortcutAdded,
        initShortcutSync
    }
}
