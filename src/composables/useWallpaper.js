import { ref, reactive } from 'vue'
import {
    PAGEDB_NAME, PAGEDB_STORE, RANDOM_WALLPAPER_STORE, CUSTOM_WALLPAPER_STORE,
    dbGet, dbPut, dbDelete, dbGetAll, dbReplaceAll, initPageDB
} from '@/utils/db'
import { isRemote, remoteDeleteFile, remoteGetFile, remotePutFile } from '@/utils/remoteStore'
import { opfsReady, opfsPut, opfsGet, opfsDelete, opfsNames, newFileName, fileExt, mimeExt } from '@/utils/opfs'
import { bg_img_preinstall, defaultPictures, defaultWallpaperOptions } from '@/core/presets'
import { KEY, LS } from '@/utils/storage'
import { normalizeLocalUrl } from '@/utils/dom'
import { useToast } from '@/composables/useToast'

const { message: toastMessage, show: toastShow } = useToast()

/* 模块级单例状态 */

// 壁纸选项列表（0=上传/自定义、1=随机、2=纯色、3+=已保存 URL / IndexedDB 壁纸）
const wallpaperOptions = ref([...defaultWallpaperOptions])
// 随机壁纸图片列表（data: URL 或 /img/ 路径）
const wallpaperPictures = ref([...defaultPictures])
// 当前选中的壁纸类型
const currentType = ref(0)
// 设置面板中壁纸说明文本（#wallpaper_text）
const wallpaperText = ref('@global:setting-set-wallpaper-switch-desc2')
// 纯色背景色
const solidColor = ref('#BFBFBF')
// #bg 是否处于 error 状态（CSS img.error 会隐藏）
const bgHasError = ref(false)
// 是否启用 #bg 的 error 处理（固态背景/切换过程中临时关闭，避免 src='' 误触发 error）
const bgErrorEnabled = ref(true)

// 设置面板各区块的显示/隐藏
const ui = reactive({
    listSettingShow: false,   // #wallpaper-list-setting（随机壁纸列表）
    colorShow: false,        // #wallpaper_color（纯色选择）
    buttonShow: false,       // #wallpaper-button（保存）
    containerShow: false,    // .wallpaper_container（名称/URL/上传）
    blocksHide: false        // .set_blocks_content.hide（选定具体 URL 壁纸后隐藏表单）
})

// 标记当前活跃的 video 加载（避免被旧的事件回调误处理）
let activeVideoId = null

// 数据库初始化标记
let dbReady = false
async function ensureDB() {
    if (dbReady) return
    await initPageDB()
    dbReady = true
}

// 同步到 window，便于在控制台调试壁纸选项
function syncWindowOptions() {
    window.wallpaperOptions = wallpaperOptions.value
}

// 用于与 themeColor 通信
function createBgChannel() {
    try {
        return new BroadcastChannel('bgLoad')
    } catch (error) {
        return null
    }
}

// 广播并关闭 channel
// 用于通知 themeColor
function notifyBgLoaded(channel) {
    try {
        if (channel && typeof channel.postMessage === 'function') {
            channel.postMessage('bgImgLoadinged')
            channel.close()
        }
    } catch (error) {
        console.error('与壁纸通信失败:' + error)
    }
}

// 壁纸加载完成后的 UI 揭示
function revealUI() {
    try {
        if (window.frameStyle && typeof window.frameStyle.removeLoading === 'function') {
            window.frameStyle.removeLoading()
        }
    } catch (error) { /* 忽略 */ }

    const setProps = (selector, props) => {
        const el = document.querySelector(selector)
        if (!el) return
        Object.assign(el.style, props)
    }
    setProps('.tool-all', { opacity: '1', transform: 'translateY(-120%)' })
    setProps('.all-search', { transform: 'translateY(0%)' })

    // #section 与 .cover 需要用 cssText 替换
    const setCssText = (selector, cssText) => {
        const el = document.querySelector(selector)
        if (el) el.style.cssText = cssText
    }
    setCssText('#section', 'opacity:1;transition:ease 1.5s;')
    setCssText('.cover', 'opacity:1;transition:ease 1.5s;')

    // 首屏完成，通知初始化或者展示问候语
    try {
        window.dispatchEvent(new Event('nitaipage:revealed'))
    } catch (e) { /* 忽略 */ }
}

function fadeInBg() {
    const bg = document.getElementById('bg')
    const video = document.getElementById('bg-video')
    // 纯色背景 #bg 透明
    const isSolid = (parseInt(getBgImg().type) || 0) === 2
    if (bg && !isSolid) bg.style.cssText = 'opacity:1;transform:scale(1);filter:blur(0px);transition:ease 0.7s;'
    if (video) video.style.cssText = 'opacity:1;transform:scale(1);filter:blur(0px);transition:ease 0.7s;'
}

/* OPFS */

// blob URL 对应 OPFS 文件名
// 列表里只放 URL
const opfsUrlNames = new Map()

// 建 blob URL 并登记对应文件
function trackOpfsUrl(blob, name) {
    const url = URL.createObjectURL(blob)
    if (name) opfsUrlNames.set(url, name)
    return url
}

/* IndexedDB 媒体存储 */

// 保存文件到 customWallpaper store，返回自增 id
async function saveMediaFileToDB(file) {
    await ensureDB()

    // 自建 Server 模式：文件上传到服务端，库里只留引用
    if (isRemote()) {
        const { ref, size } = await remotePutFile(file, file.name)
        return dbPut(PAGEDB_NAME, CUSTOM_WALLPAPER_STORE, {
            name: file.name,
            type: file.type,
            size: size || file.size,
            ref,
            uploadTime: new Date().toISOString()
        })
    }

    // 本地模式：文件写进 OPFS，库里只留文件名
    if (await opfsReady()) {
        try {
            const opfsName = newFileName(fileExt(file.name))
            await opfsPut(opfsName, file)
            return await dbPut(PAGEDB_NAME, CUSTOM_WALLPAPER_STORE, {
                name: file.name,
                type: file.type,
                size: file.size,
                opfsName,
                uploadTime: new Date().toISOString()
            })
        } catch (error) {
            console.error('写入 OPFS 失败，改用内联存储:', error)
        }
    }

    // 回退：内联 base64
    return new Promise((resolve, reject) => {
        const reader = new FileReader()
        reader.onload = async () => {
            const base64Data = reader.result.split(',')[1]
            const mediaRecord = {
                name: file.name,
                type: file.type,
                size: file.size,
                data: base64Data,
                uploadTime: new Date().toISOString()
            }
            try {
                // dbPut 自动以 autoIncrement 生成 id 并返回该 id
                const id = await dbPut(PAGEDB_NAME, CUSTOM_WALLPAPER_STORE, mediaRecord)
                resolve(id)
            } catch (e) {
                reject(e)
            }
        }
        reader.onerror = (e) => reject(e)
        reader.readAsDataURL(file)
    })
}

// base64 转 Blob
// 性能优化，节省大壁纸的编码时间
function base64ToBlob(base64, type) {
    const binary = atob(base64)
    const bytes = new Uint8Array(binary.length)
    for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i)
    return new Blob([bytes], { type: type || '' })
}

// Blob 转 base64
// 用于去除 data URL 前缀
function blobToBase64(blob) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader()
        reader.onload = () => resolve(String(reader.result).split(',')[1])
        reader.onerror = () => reject(new Error('文件读取失败'))
        reader.readAsDataURL(blob)
    })
}

// 把内联 base64 迁移到 OPFS
// 迁移失败不影响读取
async function migrateInlineMedia(record, blob, storeName) {
    if (!await opfsReady()) return null
    try {
        const opfsName = newFileName(fileExt(record.name) || mimeExt(record.type))
        await opfsPut(opfsName, blob)
        const next = { ...record, opfsName }
        delete next.data
        await dbPut(PAGEDB_NAME, storeName, next)
        return opfsName
    } catch (error) {
        console.error('迁移壁纸到 OPFS 失败:', error)
        return null
    }
}

// 将 Data URL 或站内图片路径读取为 Blob
async function readPictureBlob(pic) {
    if (typeof pic !== 'string') return null

    if (pic.startsWith('data:')) {
        const sep = pic.indexOf(',')
        if (sep < 0) return null
        try {
            return base64ToBlob(pic.slice(sep + 1), pic.slice(5, sep).split(';')[0])
        } catch (error) {
            console.error('解析壁纸数据失败:' + error)
            return null
        }
    }

    if (/(^\.{0,2}\/)?img\//.test(pic)) {
        // ./img/x 、 /img/x 、 img/x
        try {
            return await (await fetch(pic)).blob()
        } catch (error) {
            console.error('获取图片失败:' + error)
        }
    }

    return null
}

// 从 customWallpaper store 读取文件，返回 { id, name, type, url(blob URL), blob }
async function getMediaFileFromDB(id) {
    await ensureDB()
    try {
        const result = await dbGet(PAGEDB_NAME, CUSTOM_WALLPAPER_STORE, id)
        if (!result) return null

        // 存在服务端的文件，先取回再做成 blob
        if (result.ref) {
            try {
                const blob = await remoteGetFile(result.ref)
                return {
                    id: result.id,
                    name: result.name,
                    type: result.type,
                    ref: result.ref,
                    url: URL.createObjectURL(blob),
                    blob
                }
            } catch (error) {
                console.error('读取服务端壁纸失败:', error)
                return null
            }
        }

        // 文件在 OPFS
        if (result.opfsName) {
            const blob = await opfsGet(result.opfsName)
            if (!blob) {
                console.error('OPFS 里找不到壁纸文件:', result.opfsName)
                return null
            }
            return {
                id: result.id,
                name: result.name,
                type: result.type,
                opfsName: result.opfsName,
                url: URL.createObjectURL(blob),
                blob
            }
        }

        // 若存在 base64，则迁移到 OPFS
        try {
            const blob = base64ToBlob(result.data, result.type)
            await migrateInlineMedia(result, blob, CUSTOM_WALLPAPER_STORE)
            return {
                id: result.id,
                name: result.name,
                type: result.type,
                url: URL.createObjectURL(blob),
                blob
            }
        } catch (e) {
            console.error('Base64 转 Blob 失败:', e)
            return null
        }
    } catch (e) {
        console.error('获取文件时加载数据库失败:', e)
        return null
    }
}

// 从 customWallpaper store 删除文件
async function deleteMediaFileFromDB(id) {
    await ensureDB()
    try {
        const record = await dbGet(PAGEDB_NAME, CUSTOM_WALLPAPER_STORE, id)

        // 删除服务端文件
        if (isRemote() && record?.ref) {
            try {
                await remoteDeleteFile(record.ref)
            } catch (error) {
                console.error('删除服务端壁纸文件失败:', error)
            }
        }

        // 删除 OPFS 文件
        if (record?.opfsName) {
            await opfsDelete(record.opfsName)
        }

        return await dbDelete(PAGEDB_NAME, CUSTOM_WALLPAPER_STORE, id)
    } catch (e) {
        console.error('删除文件时加载数据库失败:', e)
        return false
    }
}

// 生成可被解析的 URL
function generateIndexedDBMediaUrl(id) {
    return `indexeddb://wallpaper/${id}`
}

// 解析 indexeddb://wallpaper/{id}，返回 id 或者 null
function parseIndexedDBMediaUrl(url) {
    if (url && typeof url === 'string' && url.startsWith('indexeddb://wallpaper/')) {
        const id = parseInt(url.replace('indexeddb://wallpaper/', ''))
        return Number.isNaN(id) ? null : id
    }
    return null
}

/* 壁纸选项列表（URL） */

async function getWallpaperOptionsFromDB() {
    await ensureDB()
    try {
        const rec = await dbGet(PAGEDB_NAME, PAGEDB_STORE, 'wallpaperOptions')
        if (rec && rec.data && Array.isArray(rec.data)) return rec.data
        return null
    } catch (e) {
        console.error('获取壁纸选项时加载数据库失败:', e)
        return null
    }
}

async function saveWallpaperOptionsToDB(options) {
    await ensureDB()
    // key 走记录里的 id
    return dbPut(PAGEDB_NAME, PAGEDB_STORE, { id: 'wallpaperOptions', data: options })
}

async function loadWallpaperOptions() {
    try {
        const saved = await getWallpaperOptionsFromDB()
        if (saved && Array.isArray(saved)) {
            wallpaperOptions.value = saved
        } else {
            wallpaperOptions.value = [...defaultWallpaperOptions]
        }
    } catch (e) {
        console.error('加载壁纸列表失败:', e)
        wallpaperOptions.value = [...defaultWallpaperOptions]
    }
    syncWindowOptions()
}

async function loadCustomWallpaperOptions() {
    await loadWallpaperOptions()
    syncWindowOptions()
}

// 重新渲染壁纸选项列表
// 触发响应式更新
function refreshWallpaperOptions() {
    wallpaperOptions.value = [...wallpaperOptions.value]
    syncWindowOptions()
    const bg_img = getBgImg()
    currentType.value = parseInt(bg_img.type) || 0
}

// 保存新壁纸项
function addWallpaperOption(option) {
    wallpaperOptions.value.push(option)
    syncWindowOptions()
}

function removeWallpaperOption(index) {
    wallpaperOptions.value.splice(index, 1)
    syncWindowOptions()
}

/* 随机壁纸图片列表 */

async function getWallpaperPicturesFromDB() {
    await ensureDB()
    try {
        const all = await dbGetAll(PAGEDB_NAME, RANDOM_WALLPAPER_STORE)
        if (!all || all.length === 0) return null

        const urls = []
        for (const item of all) {
            // 文件在 OPFS
            if (item.opfsName) {
                const blob = await opfsGet(item.opfsName)
                if (blob) urls.push(trackOpfsUrl(blob, item.opfsName))
                continue
            }

            // 将 base64 迁移到 OPFS
            if (item.data) {
                let blob = null
                try {
                    blob = base64ToBlob(item.data, item.type)
                } catch (error) {
                    console.error('Base64 转 Blob 失败:', error)
                }
                if (!blob) continue
                const migrated = await migrateInlineMedia(item, blob, RANDOM_WALLPAPER_STORE)
                urls.push(migrated ? trackOpfsUrl(blob, migrated) : `data:${item.type};base64,${item.data}`)
            }
        }

        return urls.length > 0 ? urls : null
    } catch (e) {
        console.error('获取壁纸列表时加载数据库失败:', e)
        return null
    }
}

// 整表替换随机壁纸列表
// 用于首次初始化（默认壁纸入库）或不支持 OPFS 时的回退路径
async function saveWallpaperPicturesToDB(pictures) {
    await ensureDB()

    // 文件写进 OPFS，库里只保留文件名
    if (!isRemote() && await opfsReady()) {
        const existing = await dbGetAll(PAGEDB_NAME, RANDOM_WALLPAPER_STORE)
        const known = new Map(existing.filter(r => r.opfsName).map(r => [r.opfsName, r]))
        const records = []
        const keep = new Set()
        const nameByIndex = []

        for (let i = 0; i < pictures.length; i++) {
            const pic = pictures[i]

            // 若图片已存在于 OPFS 中，则直接复用原有数据库记录，避免重复写入
            const tracked = typeof pic === 'string' && pic.startsWith('blob:') ? opfsUrlNames.get(pic) : null
            if (tracked && known.has(tracked)) {
                records.push(known.get(tracked))
                keep.add(tracked)
                continue
            }

            const blob = await readPictureBlob(pic)
            if (!blob) continue

            const opfsName = newFileName(mimeExt(blob.type))
            try {
                await opfsPut(opfsName, blob)
            } catch (error) {
                console.error('写入 OPFS 失败:' + error)
                continue
            }
            records.push({
                name: `wallpaper_${records.length + 1}`,
                type: blob.type,
                size: blob.size,
                opfsName,
                uploadTime: new Date().toISOString()
            })
            keep.add(opfsName)
            nameByIndex[i] = opfsName
        }

        // 清掉没人引用的文件
        // 注意：自定义壁纸的文件也在同一个目录里，若只按随机列表判断会误删
        const custom = await dbGetAll(PAGEDB_NAME, CUSTOM_WALLPAPER_STORE)
        const keepAll = new Set(keep)
        custom.forEach((row) => {
            if (row && row.opfsName) keepAll.add(row.opfsName)
        })

        for (const name of await opfsNames()) {
            if (!keepAll.has(name)) await opfsDelete(name)
        }

        await dbReplaceAll(PAGEDB_NAME, RANDOM_WALLPAPER_STORE, records)

        // 直接换成 blob URL，避免重复 IO
        for (let i = 0; i < nameByIndex.length; i++) {
            if (!nameByIndex[i]) continue
            const blob = await opfsGet(nameByIndex[i])
            if (blob) pictures[i] = trackOpfsUrl(blob, nameByIndex[i])
        }
        return true
    }

    // 性能优化，先准备好需要提交的记录，避免每张图都单独起事务
    const records = []
    for (let i = 0; i < pictures.length; i++) {
        const pic = pictures[i]
        if (pic.startsWith('data:')) {
            const sep = pic.indexOf(',')
            if (sep < 0) continue
            records.push({
                name: `wallpaper_${i + 1}`,
                type: pic.slice(5, sep).split(';')[0],
                size: 0,
                data: pic.slice(sep + 1),
                uploadTime: new Date().toISOString()
            })
        } else if (/(^\.{0,2}\/)?img\//.test(pic)) {
            // 本地默认壁纸读成 base64 入库
            try {
                const blob = await (await fetch(pic)).blob()
                records.push({
                    name: `wallpaper_${i + 1}`,
                    type: blob.type,
                    size: blob.size,
                    data: await blobToBase64(blob),
                    uploadTime: new Date().toISOString()
                })
            } catch (e) {
                console.error('获取图片失败:' + e)
            }
        }
    }

    await dbReplaceAll(PAGEDB_NAME, RANDOM_WALLPAPER_STORE, records)
    return true
}

async function loadWallpaperPictures() {
    try {
        const saved = await getWallpaperPicturesFromDB()
        if (saved && Array.isArray(saved) && saved.length > 0) {
            wallpaperPictures.value = saved
        } else {
            wallpaperPictures.value = [...defaultPictures]
            await saveWallpaperPicturesToDB(wallpaperPictures.value)
        }
    } catch (e) {
        console.error('加载壁纸列表失败:', e)
        wallpaperPictures.value = [...defaultPictures]
    }
}

// 重新渲染随机壁纸列表
// 触发响应式更新
function renderWallpaperList() {
    wallpaperPictures.value = [...wallpaperPictures.value]
}

function getRandomDefaultWallpaperURL() {
    if (wallpaperPictures.value.length === 0) {
        return normalizeLocalUrl(defaultPictures[0])
    }
    const rd = Math.floor(Math.random() * wallpaperPictures.value.length)
    return normalizeLocalUrl(wallpaperPictures.value[rd])
}

async function addWallpaperToList(file) {
    if (!file.type.startsWith('image/') && !file.type.startsWith('video/')) {
        throw new Error('仅支持图片或视频')
    }

    // 本地模式直接写 OPFS，列表放 blob URL
    if (!isRemote() && await opfsReady()) {
        const opfsName = newFileName(fileExt(file.name))
        await opfsPut(opfsName, file)
        wallpaperPictures.value.push(trackOpfsUrl(file, opfsName))
        await dbPut(PAGEDB_NAME, RANDOM_WALLPAPER_STORE, {
            name: file.name,
            type: file.type,
            size: file.size,
            opfsName,
            uploadTime: new Date().toISOString()
        })
        return true
    }

    const base64Data = await new Promise((resolve, reject) => {
        const reader = new FileReader()
        reader.onload = (e) => resolve(e.target.result)
        reader.onerror = () => reject(new Error('文件读取失败'))
        reader.readAsDataURL(file)
    })
    wallpaperPictures.value.push(base64Data)
    await saveWallpaperPicturesToDB(wallpaperPictures.value)
    return true
}

async function removeWallpaperFromList(index) {
    if (index < 0 || index >= wallpaperPictures.value.length) {
        throw new Error('无效壁纸索引')
    }

    const url = wallpaperPictures.value[index]
    const opfsName = typeof url === 'string' ? opfsUrlNames.get(url) : null
    wallpaperPictures.value.splice(index, 1)

    // OPFS
    if (opfsName) {
        opfsUrlNames.delete(url)
        try { URL.revokeObjectURL(url) } catch (error) { /* 忽略 */ }
        await opfsDelete(opfsName)
        const all = await dbGetAll(PAGEDB_NAME, RANDOM_WALLPAPER_STORE)
        const record = all.find(item => item.opfsName === opfsName)
        if (record) await dbDelete(PAGEDB_NAME, RANDOM_WALLPAPER_STORE, record.id)
        return true
    }

    await saveWallpaperPicturesToDB(wallpaperPictures.value)
    return true
}

// 背景配置缓存
// 命中时跳过 JSON.parse
// 留下原始字符串用于感知外部改写
let bgImgCache = { raw: null, value: null }

// 读取当前背景配置
function getBgImg() {
    const raw = LS.raw.get(KEY.wallpaperType)

    if (raw && raw !== '{}') {
        if (raw === bgImgCache.raw && bgImgCache.value) return { ...bgImgCache.value }
        try {
            const parsed = JSON.parse(raw)
            if (parsed && typeof parsed === 'object') {
                bgImgCache = { raw, value: parsed }
                return { ...parsed }
            }
        } catch (error) {
            console.warn('背景配置解析失败，回退到默认值')
        }
    }

    setBgImg(bg_img_preinstall)
    return { ...bgImgCache.value }
}

// 保存背景配置
function setBgImg(img) {
    if (!img) return false
    const raw = JSON.stringify(img)
    LS.raw.set(KEY.wallpaperType, raw)
    bgImgCache = { raw, value: { ...img } }
    return true
}

// 按壁纸类型取实际 URL
function getWallpaperURL(index) {
    if (index === 0) return defaultPictures[4]
    if (index === 1) return getRandomDefaultWallpaperURL()
    if (index < wallpaperOptions.value.length && wallpaperOptions.value[index].url) {
        return wallpaperOptions.value[index].url
    }
    return getRandomDefaultWallpaperURL()
}

// 按选中类型切换各区块显/隐
function initWallpaperSettingsState(type) {
    ui.listSettingShow = type === 1
    ui.colorShow = type === 2
    ui.buttonShow = type === 0 || type === 2
    ui.containerShow = type === 0
    ui.blocksHide = type > 2
    solidColor.value = LS.raw.get('solidColorBackground') || '#BFBFBF'
    currentType.value = type
    bgErrorEnabled.value = type !== 2
}

// 纯色背景
function handleSolidColorBackground(channel) {
    const color = LS.raw.get('solidColorBackground') || '#BFBFBF'
    const bg = document.getElementById('bg')
    if (bg) bg.removeAttribute('src')
    document.documentElement.classList.add('solid-bg')
    document.body.style.backgroundColor = color
    bgErrorEnabled.value = false
    bgHasError.value = false
    notifyBgLoaded(channel)
}

// 显示视频 同时 隐藏图片
function showVideo() {
    const video = document.getElementById('bg-video')
    const bg = document.getElementById('bg')
    if (video) video.style.display = 'block'
    if (bg) bg.style.display = 'none'
    document.documentElement.classList.remove('solid-bg')
    document.body.style.backgroundColor = ''
}

// 显示图片 同时 隐藏并暂停视频
function showImage() {
    const video = document.getElementById('bg-video')
    const bg = document.getElementById('bg')
    if (video) {
        video.style.display = 'none'
        try { video.pause() } catch (error) { /* 忽略 */ }
    }
    if (bg) bg.style.display = 'block'
    document.documentElement.classList.remove('solid-bg')
    document.body.style.backgroundColor = ''
}

// 视频壁纸加载
function setupVideoElement(videoElement, url, channel) {
    if (!videoElement || !url) {
        loadDefaultWallpaper(channel)
        return
    }

    const videoId = 'video_' + Date.now()
    activeVideoId = videoId
    const soundOn = LS.bool(KEY.bgVideoSound, true)

    videoElement.src = url
    videoElement.loop = true
    videoElement.muted = !soundOn
    videoElement.autoplay = true
    videoElement.style.cssText = 'filter:blur(0px);transition:ease 0.7s;'

    const timeoutId = setTimeout(() => {
        if (activeVideoId !== videoId) return
        toastMessage('@global:setting-set-wallpaper-video-load-timeout', {
            title: '@global:setting-set-wallpaper-video-load-default',
            timeout: 2000
        })
        loadDefaultWallpaper(channel)
    }, 10000)

    videoElement.onloadeddata = () => {
        if (activeVideoId !== videoId) return
        clearTimeout(timeoutId)

        const promptShown = LS.raw.get('wallpaperSoundPromptShown') === 'true'
        const soundEnabled = LS.bool(KEY.bgVideoSound, true)

        // 首次播放视频时询问是否开启声音
        if (soundEnabled && !promptShown) {
            LS.raw.set('wallpaperSoundPromptShown', 'true')
            toastShow({
                timeout: 8000,
                message: '@global:setting-set-wallpaper-video-sound-prompt',
                position: 'bottomCenter',
                transitionIn: 'bounceInUp',
                transitionOut: 'fadeOutDown',
                transitionInMobile: 'fadeInUp',
                transitionOutMobile: 'fadeOutDown',
                buttons: [
                    ['<button>@global:toast-ok</button>', (instance, toastEl) => {
                        videoElement.muted = false
                        videoElement.play().catch((error) => { /* 忽略 */ })
                        if (instance) instance.hide({ transitionOut: 'fadeOutDown' }, toastEl, 'button')
                    }, true],
                    ['<button>@global:toast-cancel</button>', (instance, toastEl) => {
                        videoElement.muted = true
                        videoElement.play().catch((error) => { /* 忽略 */ })
                        if (instance) instance.hide({ transitionOut: 'fadeOutDown' }, toastEl, 'button')
                    }]
                ]
            })
        }

        videoElement.play().catch((error) => {
            console.error('播放失败:' + error)
            // 自动播放被拦截 且 当前为有声播放，回退到静音重试
            if (promptShown && soundEnabled) {
                videoElement.muted = true
                videoElement.play().catch((error) => { /* 忽略 */ })
            }
        })
        notifyBgLoaded(channel)
    }

    videoElement.onerror = () => {
        if (activeVideoId !== videoId) return
        clearTimeout(timeoutId)
        console.error('视频加载失败')
        loadDefaultWallpaper(channel)
    }
}

// 图片壁纸加载
function setupImageElement(url, channel, saveUrl = true) {
    const bg = document.getElementById('bg')
    if (bg) bg.src = url
    if (saveUrl) {
        sessionStorage.setItem('bgImageFinalURL', url)
        sessionStorage.setItem('bgImageOriginalURL', url)
    }

    const probe = new Image()
    probe.onload = () => {
        if (bg) bg.style.cssText = 'filter:blur(0px);transition:ease 0.7s;'
        notifyBgLoaded(channel)
    }
    probe.src = url
}

// IndexedDB 壁纸（图片 / 视频）加载
function handleIndexedDBMedia(mediaInfo, channel) {
    if (mediaInfo && mediaInfo.url) {
        const soundOption = document.getElementById('wallpaper-sound-option')
        if (mediaInfo.type && mediaInfo.type.startsWith('video/')) {
            if (soundOption) soundOption.classList.add('active')
            showVideo()
            setupVideoElement(document.getElementById('bg-video'), mediaInfo.url, channel)
        } else {
            if (soundOption) soundOption.classList.remove('active')
            showImage()
            setupImageElement(mediaInfo.url, channel)
        }
    } else {
        console.error('未获取到壁纸文件')
        toastMessage('@global:setting-set-wallpaper-file-load-fail', {
            title: '@global:setting-set-wallpaper-video-load-default',
            timeout: 2000
        })
        loadDefaultWallpaper(channel)
    }
}

// URL 壁纸（按扩展名判断视频还是图片）
function handleRedirectMedia(finalUrl, channel) {
    const videoExtensions = ['.mp4', '.webm', '.ogg', '.mov', '.avi']
    const isVideo = videoExtensions.some((ext) => finalUrl.toLowerCase().includes(ext))
    const soundOption = document.getElementById('wallpaper-sound-option')

    if (isVideo) {
        if (soundOption) soundOption.classList.add('active')
        showVideo()
        setupVideoElement(document.getElementById('bg-video'), finalUrl, channel)
    } else {
        if (soundOption) soundOption.classList.remove('active')
        showImage()
        setupImageElement(finalUrl, channel)
    }
}

// 直链图片track 失败时加载
function handleOriginalImageLoad(url, channel) {
    const bg = document.getElementById('bg')
    if (bg) bg.src = url

    const probe = new Image()
    probe.onload = () => {
        if (bg) bg.style.cssText = 'opacity:1;filter:blur(0px);transition:ease 0.7s;'
        sessionStorage.setItem('bgImageFinalURL', probe.src)
        sessionStorage.setItem('bgImageOriginalURL', probe.src)
        notifyBgLoaded(channel)
    }
    probe.src = url
}

// 清理上一个壁纸
function cleanupPreviousWallpaper() {
    const video = document.getElementById('bg-video')
    if (video) {
        video.onloadeddata = null
        video.onerror = null
        video.removeAttribute('src')
        video.style.display = 'none'
        try { video.pause() } catch (error) { /* 忽略 */ }
    }

    const soundOption = document.getElementById('wallpaper-sound-option')
    if (soundOption) soundOption.classList.remove('active')

    const bg = document.getElementById('bg')
    if (bg) {
        bg.onerror = null
        bg.removeAttribute('src')
        bg.style.display = 'block'
    }
    bgErrorEnabled.value = false
    bgHasError.value = false
}

// 按当前配置加载壁纸
function setBgImgInit() {
    cleanupPreviousWallpaper()

    const channel = createBgChannel()
    const bgImg = getBgImg()
    const type = parseInt(bgImg.type) || 0

    initWallpaperSettingsState(type)
    if (channel) channel.postMessage('bgImgLoadingStart')

    if (type === 2) {
        handleSolidColorBackground(channel)
        return
    }

    const url = getWallpaperURL(type)
    const mediaId = parseIndexedDBMediaUrl(url)

    if (mediaId) {
        getMediaFileFromDB(mediaId)
            .then((media) => handleIndexedDBMedia(media, channel))
            .catch((error) => {
                console.error('从 indexedDB 获取文件失败:' + error)
                toastMessage('@global:setting-set-wallpaper-file-load-fail', {
                    title: '@global:setting-set-wallpaper-video-load-default',
                    timeout: 2000
                })
                loadDefaultWallpaper(channel)
            })
    } else {
        fetch(url)
            .then((response) => handleRedirectMedia(response.url, channel))
            .catch((error) => {
                console.error('Failed to track media redirect:', error)
                handleOriginalImageLoad(url, channel)
            })
    }
}

// 加载默认随机壁纸
function loadDefaultWallpaper(channel) {
    const url = getRandomDefaultWallpaperURL()
    const bg = document.getElementById('bg')
    if (bg) bg.src = url
    sessionStorage.setItem('bgImageFinalURL', url)
    sessionStorage.setItem('bgImageOriginalURL', url)

    const probe = new Image()
    probe.onload = () => {
        if (bg) bg.style.cssText = 'opacity:1;transform:scale(1);filter:blur(0px);transition:ease 0.7s;'
        notifyBgLoaded(channel)
    }
    probe.src = url
}

// 切换壁纸
// 先淡出再清理然后按新配置加载
function changeWallpaper() {
    const bg = document.getElementById('bg')
    const video = document.getElementById('bg-video')

    if (bg) bg.style.cssText = 'opacity:0;transform:scale(1);filter:blur(var(--main-box-gauss));transition:ease 0.3s;'
    if (video) video.style.cssText = 'opacity:0;transform:scale(1);filter:blur(var(--main-box-gauss));transition:ease 0.3s;'

    setTimeout(() => {
        bgErrorEnabled.value = false
        if (bg) {
            bg.removeAttribute('src')
            bgHasError.value = false
        }
        if (video) {
            try { video.pause() } catch (error) { /* 忽略 */ }
            video.removeAttribute('src')
            video.style.display = 'none'
        }
        if (bg) bg.style.display = 'block'

        // 新壁纸加载完成后画面缩放 + 高斯
        const channel = createBgChannel()
        if (channel) {
            channel.onmessage = (event) => {
                if (event.data !== 'bgImgLoadinged') return
                if (bg) bg.style.cssText = 'opacity:1;transform:scale(1.08);filter:var(--main-box-gauss-plus);transition:ease 0.7s;'
                if (video) video.style.cssText = 'opacity:1;transform:scale(1.08);filter:var(--main-box-gauss-plus);transition:ease 0.7s;'
                channel.close()
            }
            channel.postMessage('bgImgLoadingStart')
        }

        setBgImgInit()

        const bgImg = getBgImg()
        if ((parseInt(bgImg.type) || 0) !== 2) {
            setTimeout(() => { bgErrorEnabled.value = true }, 100)
        }
    }, 300)
}

// 初始化壁纸设置数据
// App.vue 启动时使用
async function initWallpaperSettings() {
    await loadWallpaperOptions()
    refreshWallpaperOptions()
}

// 首屏壁纸加载
async function initWallpaerLoader() {
    await ensureDB()
    await loadWallpaperPictures()
    await loadWallpaperOptions()
    await renderWallpaperList()
    setBgImgInit()

    // 加载完成后显示 UI
    // 加载时间 ≥ 300ms，≤ 1500ms
    const startTime = Date.now()
    const channel = createBgChannel()
    const reveal = () => {
        const delay = Math.max(0, 300 - (Date.now() - startTime))
        setTimeout(() => {
            revealUI()
            fadeInBg()
            if (channel) channel.close()
        }, delay)
    }
    const fallbackTimer = setTimeout(reveal, 1500)

    if (channel) {
        channel.onmessage = (event) => {
            if (event.data !== 'bgImgLoadinged') return
            clearTimeout(fallbackTimer)
            reveal()
        }
    }
}

export function useWallpaper() {

    // 暴露到全局
    if (typeof window !== 'undefined') {
        window.getBgImg = getBgImg
        window.setBgImgInit = setBgImgInit
    }
    return {
        // 状态
        wallpaperOptions,
        wallpaperPictures,
        currentType,
        wallpaperText,
        solidColor,
        bgHasError,
        bgErrorEnabled,
        ui,

        // 媒体存储
        saveMediaFileToDB,
        getMediaFileFromDB,
        deleteMediaFileFromDB,
        generateIndexedDBMediaUrl,
        parseIndexedDBMediaUrl,

        // 壁纸选项管理
        getWallpaperOptionsFromDB,
        saveWallpaperOptionsToDB,
        loadWallpaperOptions,
        loadCustomWallpaperOptions,
        addWallpaperOption,
        removeWallpaperOption,
        refreshWallpaperOptions,
        initWallpaperSettings,

        // 图片列表
        getWallpaperPicturesFromDB,
        saveWallpaperPicturesToDB,
        loadWallpaperPictures,
        addWallpaperToList,
        removeWallpaperFromList,
        getRandomDefaultWallpaperURL,
        renderWallpaperList,

        // 背景加载
        initWallpaerLoader,
        setBgImgInit,
        getBgImg,
        setBgImg,
        handleSolidColorBackground,
        setupVideoElement,
        setupImageElement,
        handleIndexedDBMedia,
        handleRedirectMedia,
        handleOriginalImageLoad,
        cleanupPreviousWallpaper,
        changeWallpaper,
        initWallpaperSettingsState,
        loadDefaultWallpaper,
        getWallpaperURL
    }
}
