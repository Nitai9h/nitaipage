// 基础字典存在 public/basicLanguageSetting.json
// key 格式： @global:xxx
import { createI18n } from 'vue-i18n'

const LOCALE_KEY = 'nitaiPageLocale'

// 基础语言
export const BASE_LOCALE = 'zh-CN'

// 字典地址
const DICT_URL = import.meta.env.BASE_URL + 'basicLanguageSetting.json'

function readStoredLocale() {
    try {
        return localStorage.getItem(LOCALE_KEY) || BASE_LOCALE
    } catch (error) {
        // localStorage 不可用时回退默认
        return BASE_LOCALE
    }
}

export const i18n = createI18n({
    legacy: false,
    globalInjection: true,
    locale: readStoredLocale(),
    fallbackLocale: BASE_LOCALE,
    messages: {},
    warnHtmlMessage: false
})

// 读取基础字典
async function loadBaseMessages() {
    const resp = await fetch(DICT_URL, { cache: 'no-store' })
    if (!resp.ok) {
        throw new Error('加载字典失败: HTTP ' + resp.status + ' ' + DICT_URL)
    }
    return resp.json()
}

// 初始化
export async function setupI18n() {
    try {
        const dict = await loadBaseMessages()
        i18n.global.setLocaleMessage(BASE_LOCALE, dict)
    } catch (error) {
        console.error(error)
    }
    return i18n
}

// 翻译函数
// 供插件适配使用，缺词时回退为 key 本身
export function t(key, named) {
    return i18n.global.t(key, named)
}

export default i18n
