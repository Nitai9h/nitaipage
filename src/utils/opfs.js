// OPFS 壁纸文件存储（IndexedDB 只留文件名、类型、顺序）

const DIR_NAME = 'wallpapers'

export function opfsSupported() {
    return typeof navigator !== 'undefined'
        && !!navigator.storage
        && typeof navigator.storage.getDirectory === 'function'
}

let usable = null
export async function opfsReady() {
    if (usable !== null) return usable
    if (!opfsSupported()) {
        usable = false
        return usable
    }
    try {
        await navigator.storage.getDirectory()
        usable = true
    } catch (error) {
        usable = false
    }
    return usable
}

async function wallpaperDir() {
    const root = await navigator.storage.getDirectory()
    return root.getDirectoryHandle(DIR_NAME, { create: true })
}

// 取文件的扩展名（输出.xxx）
export function fileExt(name) {
    const match = String(name || '').match(/\.[a-z0-9]+$/i)
    return match ? match[0].toLowerCase() : ''
}

// 从 MIME 获取扩展名
export function mimeExt(type) {
    const sub = String(type || '').split('/')[1]
    return sub ? '.' + sub.replace(/[^a-z0-9]/gi, '').toLowerCase() : ''
}

// 生成随机文件名
export function newFileName(ext) {
    return `wp_${Date.now()}_${Math.random().toString(36).slice(2, 8)}${ext || ''}`
}

export async function opfsPut(name, blob) {
    const dir = await wallpaperDir()
    const handle = await dir.getFileHandle(name, { create: true })
    const writable = await handle.createWritable()
    await writable.write(blob)
    await writable.close()
    return name
}

// 不存在返回 null
export async function opfsGet(name) {
    try {
        const dir = await wallpaperDir()
        const handle = await dir.getFileHandle(name)
        return await handle.getFile()
    } catch (error) {
        return null
    }
}

export async function opfsDelete(name) {
    try {
        const dir = await wallpaperDir()
        await dir.removeEntry(name)
        return true
    } catch (error) {
        return false
    }
}

export async function opfsNames() {
    try {
        const dir = await wallpaperDir()
        const names = []
        for await (const [name, handle] of dir.entries()) {
            if (handle.kind === 'file') names.push(name)
        }
        return names
    } catch (error) {
        return []
    }
}

export async function opfsClear() {
    try {
        const root = await navigator.storage.getDirectory()
        await root.removeEntry(DIR_NAME, { recursive: true })
        return true
    } catch (error) {
        return false
    }
}
