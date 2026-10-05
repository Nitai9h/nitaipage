import { i18n, t, BASE_LOCALE } from '@/i18n'
import { hideToastById } from '@/composables/useToast'
import iziToast from 'izitoast'
import {
    getNpp, verifyJSUrl, checkDependencies,
    savePluginMetadata, saveJSFile, compareVersions, showUpdateDialog,
    parseDependencies, getPluginsList, checkUpdates
} from './npplication.js'
import { officialUrl, isOfficialHost } from './nodes.js'

/* 文本翻译 */

let keyMatcher = null
let cachedLocale = ''

function escapeRegExp(str) {
    return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

// 合成单个正则后只需一次扫描
function keyPattern() {
    const locale = i18n.global.locale.value
    if (locale !== cachedLocale || keyMatcher === undefined) {
        const messages = i18n.global.getLocaleMessage(locale) || {}
        const keys = Object.keys(messages).sort((a, b) => b.length - a.length)
        keyMatcher = keys.length ? new RegExp(keys.map(escapeRegExp).join('|'), 'g') : null
        cachedLocale = locale
    }
    return keyMatcher
}

// locale 或字典变化后让缓存失效
function invalidateKeyCache() {
    cachedLocale = ''
    keyMatcher = undefined
}

// 文本里出现的已知 key 一律换成译文
function translateText(raw) {
    if (!raw || typeof raw !== 'string') return raw
    if (raw.indexOf('@') === -1) return raw   // 无 key 特征，直接跳过

    const re = keyPattern()
    if (!re) return raw
    // 全局正则的一次 replace 即完成全部替换（replace 内部会自行归零 lastIndex）
    return raw.replace(re, (key) => t(key))
}

const SKIP_TAGS = new Set(['SCRIPT', 'STYLE', 'NOSCRIPT', 'IFRAME', 'OBJECT', 'EMBED'])

// 是否跳过翻译
function isSkipRoot(element) {
    return !!element.getAttribute && element.getAttribute('translate') === 'none'
}

// 判断是否上级存在跳过标签
function inSkipSubtree(element) {
    if (!element || element.nodeType !== Node.ELEMENT_NODE) return false
    return element.closest('[translate="none"]') !== null
}

function markTranslated(element) {
    if (element && element.dataset) element.dataset.translated = 'true'
}

// 只负责替换文本，不含跳过判断
function applyTextTranslation(node) {
    const original = node.textContent
    const translated = translateText(original)
    if (original === translated) return

    node.textContent = translated
    markTranslated(node.parentNode)
}

// characterData 变化时使用
// 上级可能存在跳过标签
function translateTextNode(node) {
    if (inSkipSubtree(node.parentNode)) return
    applyTextTranslation(node)
}

// 翻译属性值（placeholder / title / alt ）
function translateAttr(element, attrName) {
    const attr = element.getAttributeNode(attrName)
    if (!attr) return
    const translated = translateText(attr.value)
    if (attr.value === translated) return
    attr.value = translated
    markTranslated(element)
}

// 递归时把「上级存在跳过标签」带下去，省得每个节点都找一次 closest
function translateNode(node, skipped = false) {
    if (!node) return

    // 文本节点
    if (node.nodeType === Node.TEXT_NODE) {
        if (skipped) return
        if (inSkipSubtree(node.parentNode)) return
        applyTextTranslation(node)
        return
    }

    if (node.nodeType !== Node.ELEMENT_NODE) return

    // 元素本身可翻译时清掉上一次的标记
    if (node.dataset && node.dataset.translated) delete node.dataset.translated

    if (SKIP_TAGS.has(node.tagName.toUpperCase())) return
    if (skipped || isSkipRoot(node)) return

    // 直接或取三个属性节点
    // 避免遍历整份 attributes
    translateAttr(node, 'placeholder')
    translateAttr(node, 'title')
    translateAttr(node, 'alt')

    // 处理过程只改文本与属性，不动子节点结构，可以按索引同步遍历
    const children = node.childNodes
    for (let i = 0; i < children.length; i++) {
        translateNode(children[i], false)
    }
}

/* MutationObserver */

let observer = null

// 先全量扫描一遍 body，然后再持续监听后续插入的节点
export function startDomTranslation() {
    translateNode(document.body)

    if (observer) observer.disconnect()
    observer = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
            if (mutation.addedNodes && mutation.addedNodes.length) {
                mutation.addedNodes.forEach(translateNode)
            }
            if (mutation.type === 'characterData' &&
                mutation.target.nodeType === Node.TEXT_NODE) {
                translateTextNode(mutation.target)
            }
        })
    })
    observer.observe(document.body, { childList: true, subtree: true, characterData: true })
}

/*翻译插件（type=translate）安装流程 */

export function getBrowserLanguage() {
    const languages = navigator.languages || [navigator.language]
    for (const lang of languages) {
        if (lang && lang.length >= 2) return lang
    }
    return 'en-US'
}

// 安装全局翻译插件
async function installGlobalTranslateNpplication(url) {
    try {
        const { metadata } = await getNpp({ url })
        if (!await verifyJSUrl(url)) {
            console.error('无效的JS文件URL:' + url)
            iziToast.show({ timeout: 2000, message: '@npplication:install-fail' })
            hideToastById('#installToast')
            return
        }

        const dependencies = parseDependencies(metadata.dependencies || '')
        const dependencyCheckResult = await checkDependencies(dependencies)
        if (metadata.type !== 'translate' && !dependencyCheckResult.status) {
            hideToastById('#installToast')
            return
        }

        let isAllowedCoreSource = false
        try {
            const parsedUrl = new URL(url)
            isAllowedCoreSource = parsedUrl.protocol === 'https:' && isOfficialHost(parsedUrl.hostname)
        } catch (e) {
            isAllowedCoreSource = false
        }
        if (metadata.type === 'coreNpp' && !isAllowedCoreSource) {
            console.warn('核心应用只能从指定源安装')
            iziToast.show({ timeout: 2000, message: '@npplication:install-fail' })
            hideToastById('#installToast')
            return
        }

        const plugins = await getPluginsList()
        const existing = plugins.find((p) => p.id === metadata.id)
        if (metadata.type === 'coreNpp' && !existing) {
            console.warn('核心应用禁止安装')
            iziToast.show({ timeout: 2000, message: '@npplication:install-fail' })
            hideToastById('#installToast')
            return
        }

        if (existing) {
            const cmp = compareVersions(existing.version, metadata.version)
            if (cmp === 0) {
                showUpdateDialog(metadata)
            } else if (cmp < 0) {
                iziToast.show({ id: 'checkUpdateToast', message: '@npplication:installing' })
                checkUpdates(metadata.id)
            }
        } else {
            if (!['head', 'body'].includes(metadata.time)) {
                console.error('无有效的加载时机')
                return
            }
            await savePluginMetadata(metadata)
            await saveJSFile(metadata.id, url)
            hideToastById('#installToast')
        }
    } catch (error) {
        console.error(`安装失败: ${error.message}`)
        iziToast.show({ timeout: 2000, message: '@npplication:install-fail' })
        hideToastById('#installToast')
    }
}

// 安装指定语言的全局翻译插件，失败则回退 en-US
export async function installTranslationPlugin(langCode) {
    try {
        await installGlobalTranslateNpplication(officialUrl(`translateGlobal-${langCode}.js`))
        localStorage.setItem('installedTranslationLang', langCode)
        iziToast.show({ timeout: 3000, message: '@i18n:global-tanslate-install-success' })
        return true
    } catch (error) {
        try {
            console.warn(`安装${langCode}失败, 尝试安装en-US`, error)
            await installGlobalTranslateNpplication(officialUrl('translateGlobal-en-US.js'))
            localStorage.setItem('installedTranslationLang', 'en-US')
            iziToast.show({ timeout: 3000, message: '@i18n:global-tanslate-install-success' })
            return true
        } catch (error2) {
            console.warn('全局插件获取失败:', error2)
            return false
        }
    }
}

/* 初始化 */

// 插件侧国际化
// 先扫描 DOM，再在后台装翻译插件
export function initPluginI18n() {
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', startDomTranslation)
    } else {
        startDomTranslation()
    }

    // 后台执行
    ensureTranslationPlugin()
}

// 首次访问时装一个跟随浏览器语言的全局翻译插件；已有记录则跳过
async function ensureTranslationPlugin() {
    const installedLang = localStorage.getItem('installedTranslationLang')
    // 安装工作由 guide 页面负责，无需再判断 visited 的值
    if (installedLang) return

    const installed = await installTranslationPlugin(getBrowserLanguage())
    if (!installed) localStorage.setItem('installedTranslationLang', 'basic')
}

/* 全局暴露 window.i18n */

// 将翻译插件通过 window.i18n.addTranslationEntries() 注入的词条 转给 vue-i18n
function addTranslationEntries(entries) {
    if (!entries || typeof entries !== 'object' || Array.isArray(entries)) {
        console.error('请传入对象')
        return false
    }
    const locale = i18n.global.locale.value || BASE_LOCALE
    i18n.global.mergeLocaleMessage(locale, entries)
    invalidateKeyCache()
    // 词条合并后重扫一遍已有 DOM
    startDomTranslation()
    return true
}

if (typeof window !== 'undefined') {
    window.i18n = { addTranslationEntries }
}
