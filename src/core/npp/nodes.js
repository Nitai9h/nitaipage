// 官方节点表

const OFFICIAL_ENTRY = 'https://nppdb.nitai.cc/'

const BUILTIN_HOSTS = [
    'nppdb.nitai.cc',
    'nppstore.nitai.de5.net',
    'nppstore.nitai.cc.cd',
    'nppstore.nitai.dpdns.org',
    'nppstore.nitai.us.kg',
    'nppstore.nitai.cc'
]

const NODES_CACHE_KEY = 'officialNodes'

// 节点表请求超时
const NODES_TIMEOUT = 8000

let nodeCache = null

export function getOfficialEntry() {
    return OFFICIAL_ENTRY
}

export function officialStoreUrl() {
    return OFFICIAL_ENTRY + 'store'
}

// 兼容旧版地址
export function officialUrl(path) {
    return OFFICIAL_ENTRY + String(path ?? '').replace(/^\/+/, '')
}

function readCache() {
    if (nodeCache) return nodeCache

    try {
        const parsed = JSON.parse(localStorage.getItem(NODES_CACHE_KEY))
        nodeCache = parsed && Array.isArray(parsed.hosts) && Array.isArray(parsed.bases) ? parsed : null
    } catch (error) {
        nodeCache = null
    }

    return nodeCache
}

// 入口 + 节点表
export function officialBases() {
    const cached = readCache()
    const bases = [OFFICIAL_ENTRY, ...(cached ? cached.bases : [])]

    return bases.filter((value, index) => bases.indexOf(value) === index)
}

export function isOfficialHost(host) {
    if (!host) return false
    if (host === new URL(OFFICIAL_ENTRY).host) return true
    if (BUILTIN_HOSTS.includes(host)) return true

    const cached = readCache()
    return !!cached && cached.hosts.includes(host)
}

export function isOfficialUrl(url) {
    try {
        return isOfficialHost(new URL(url).host)
    } catch (error) {
        return false
    }
}

// 拉取并缓存节点表
// 不用 fetchOfficial，避免递归
export async function loadNodeTable(force = false) {
    if (!force && readCache()) return readCache()

    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), NODES_TIMEOUT)

    try {
        const response = await fetch(officialUrl('nodes.json'), {
            cache: 'no-store',
            signal: controller.signal
        })
        if (!response.ok) return readCache()

        const data = await response.json()
        const hosts = Array.isArray(data?.officialHosts) ? data.officialHosts.filter(Boolean) : []
        const bases = (Array.isArray(data?.nodes) ? data.nodes : [])
            .map((item) => {
                try {
                    return new URL(item).origin + '/'
                } catch (error) {
                    return ''
                }
            })
            .filter(Boolean)

        if (!hosts.length) return readCache()

        nodeCache = { at: Date.now(), hosts, bases }
        localStorage.setItem(NODES_CACHE_KEY, JSON.stringify(nodeCache))
        return nodeCache
    } catch (error) {
        console.warn('节点表获取失败，沿用内置地址:', error.message)
        return readCache()
    } finally {
        clearTimeout(timer)
    }
}

// 生成基于官方节点表的 URL 列表，原地址排第一
export function alternateUrls(url) {
    if (!isOfficialUrl(url)) return [url]

    let parsed
    try {
        parsed = new URL(url)
    } catch (error) {
        return [url]
    }

    const suffix = parsed.pathname + parsed.search
    const candidates = [url]

    officialBases().forEach((base) => {
        try {
            const target = new URL(suffix.replace(/^\/+/, ''), base)
            if (target.host === parsed.host) return
            if (!candidates.includes(target.href)) candidates.push(target.href)
        } catch (error) {
            /* 忽略失败 */
        }
    })

    return candidates
}

// 带节点重试的请求
// 401/403/404 不重试
function shouldRetryStatus(status) {
    return status === 429 || status >= 500
}

export async function fetchOfficial(url, options = {}, timeoutMs = 10000) {
    const candidates = alternateUrls(url)
    let lastError

    for (let index = 0; index < candidates.length; index += 1) {
        const candidate = candidates[index]
        const controller = new AbortController()
        const timer = setTimeout(() => controller.abort(), timeoutMs)

        try {
            const response = await fetch(candidate, { ...options, signal: controller.signal })
            const isLast = index === candidates.length - 1
            if (isLast || !shouldRetryStatus(response.status)) return response

            console.warn(`节点返回 ${response.status}，更换下一个节点重试: ${candidate}`)
            lastError = new Error(`HTTP ${response.status}`)
        } catch (error) {
            lastError = error
            if (index < candidates.length - 1) {
                console.warn(`节点请求失败，更换下一个节点重试: ${candidate}`)
            }
        } finally {
            clearTimeout(timer)
        }
    }

    throw lastError || new Error('节点暂时不可用')
}
