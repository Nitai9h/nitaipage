import { ref, computed } from 'vue'
import {
    PAGEDB_NAME,
    PAGEDB_STORE,
    dbGet,
    dbPut,
    initPageDB
} from '@/utils/db'
import { KEY, LS } from '@/utils/storage'
import { se_list_preinstall } from '@/core/presets'

// 搜取存储位置： nitaiPageDB -> nitaiPage -> { id:'se_list', value: JSON }

const SE_LIST_KEY = 'se_list'

// 单例状态
// 首页搜索框与设置面板共用同一份数据
const seList = ref({})
const seDefault = ref(LS.raw.get(KEY.seDefault, '1'))
const loaded = ref(false)

// 读取搜索引擎列表
export async function getSeList() {
    await initPageDB()
    const record = await dbGet(PAGEDB_NAME, PAGEDB_STORE, SE_LIST_KEY)
    if (record && record.value) {
        return JSON.parse(record.value)
    }
    // 没有数据时写入预置数据
    await setSeList(se_list_preinstall)
    return se_list_preinstall
}

// 写入搜索引擎列表
export async function setSeList(list) {
    if (!list) throw new Error('se_list is required')
    await initPageDB()
    await dbPut(PAGEDB_NAME, PAGEDB_STORE, { id: SE_LIST_KEY, value: JSON.stringify(list) })
}

// 当前默认搜索引擎 id
export function getSeDefault() {
    const value = LS.raw.get(KEY.seDefault, '')
    return value ? value : '1'
}

// 设置默认搜索引擎
export function setSeDefault(id) {
    LS.raw.set(KEY.seDefault, String(id))
    seDefault.value = String(id)
}

// 刷新内存中的列表
// 首页与设置面板共用
export async function refreshSeList() {
    try {
        seList.value = await getSeList()
        seDefault.value = getSeDefault()
        loaded.value = true
    } catch (error) {
        console.error('加载搜索引擎数据失败:', error)
    }
    return seList.value
}

export function useSearchEngines() {
    // 当前生效的搜索引擎对象
    const currentEngine = computed(() => {
        const key = seDefault.value || '1'
        return seList.value[key] || null
    })

    // 表单 action
    const action = computed(() => currentEngine.value?.url || 'https://www.baidu.com/s')

    // 表单字段名
    const fieldName = computed(() => currentEngine.value?.name || 'wd')

    // 引擎图标 class
    const iconClass = computed(() => currentEngine.value?.icon || 'iconfont icon-baidu')

    // 按 id 顺序排列的列表
    // 供设置面板用
    const orderedList = computed(() => {
        const keys = Object.keys(seList.value)
        return keys.map((key) => ({ key, ...seList.value[key] }))
    })

    return {
        seList,
        seDefault,
        loaded,
        currentEngine,
        action,
        fieldName,
        iconClass,
        orderedList,
        refreshSeList,
        getSeList,
        setSeList,
        getSeDefault,
        setSeDefault
    }
}
