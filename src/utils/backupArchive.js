// 备份压缩包的编/解码

import { zip, unzip } from 'fflate'

export const ARCHIVE_ENTRY = 'backup.json'

// 文件
export const FILES_PREFIX = 'files/'

// 压缩级别
const STORED_LEVEL = 0
const JSON_LEVEL = 6

const startsWith = (bytes, magic) => magic.every((byte, index) => bytes[index] === byte)

// 判断是否压缩过
function isPreCompressed(bytes) {
    if (!bytes || bytes.length < 12) return false

    if (startsWith(bytes, [0x89, 0x50, 0x4e, 0x47])) return true // PNG
    if (startsWith(bytes, [0xff, 0xd8, 0xff])) return true // JPEG
    if (startsWith(bytes, [0x47, 0x49, 0x46, 0x38])) return true // GIF8
    if (startsWith(bytes, [0x1a, 0x45, 0xdf, 0xa3])) return true // WebM / MKV
    if (startsWith(bytes, [0x4f, 0x67, 0x67, 0x53])) return true // Ogg
    if (startsWith(bytes, [0x66, 0x4c, 0x61, 0x43])) return true // FLAC
    if (startsWith(bytes, [0x49, 0x44, 0x33])) return true // MP3
    if (startsWith(bytes, [0x52, 0x49, 0x46, 0x46]) //RIFF(除Webp)
        && startsWith(bytes.subarray(8), [0x57, 0x45, 0x42, 0x50])) return true
    // ISO BMFF
    if (startsWith(bytes.subarray(4), [0x66, 0x74, 0x79, 0x70])) return true

    return false
}

const encoder = new TextEncoder()
const decoder = new TextDecoder()

// 备份文件头
// 本地文件头 / 空档 / 分卷结束 / 数据描述
const ZIP_MAGIC = [[0x50, 0x4b, 0x03, 0x04], [0x50, 0x4b, 0x05, 0x06], [0x50, 0x4b, 0x07, 0x08]]

export function isZipBuffer(buffer) {
    const head = new Uint8Array(buffer, 0, Math.min(4, buffer.byteLength))
    return ZIP_MAGIC.some((magic) => magic.every((byte, index) => head[index] === byte))
}

export async function blobToBytes(blob) {
    return new Uint8Array(await blob.arrayBuffer())
}

export function bytesToBlob(bytes, type) {
    return new Blob([bytes], type ? { type } : undefined)
}

export function base64ToBlob(base64, type) {
    const binary = atob(base64)
    const bytes = new Uint8Array(binary.length)
    for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i)
    return new Blob([bytes], { type: type || '' })
}

// 打包
// media 每项是 { path, bytes }
export function packArchive(payload, media = []) {
    const input = {}
    input[ARCHIVE_ENTRY] = [encoder.encode(JSON.stringify(payload)), { level: JSON_LEVEL }]

    for (const item of media) {
        input[item.path] = [item.bytes, { level: isPreCompressed(item.bytes) ? STORED_LEVEL : JSON_LEVEL }]
    }

    return new Promise((resolve, reject) => {
        zip(input, { level: JSON_LEVEL }, (error, data) => {
            if (error) reject(error)
            else resolve(data)
        })
    })
}

// 解包
// 返回 { payload, media }，media 是 path → 字节 的表
export function unpackArchive(buffer) {
    return new Promise((resolve, reject) => {
        unzip(new Uint8Array(buffer), (error, files) => {
            if (error) {
                reject(new Error('bad-archive'))
                return
            }

            const entry = files[ARCHIVE_ENTRY]
            if (!entry) {
                reject(new Error('missing-entry'))
                return
            }

            let payload
            try {
                payload = JSON.parse(decoder.decode(entry))
            } catch (parseError) {
                reject(new Error('bad-entry'))
                return
            }

            const media = new Map()
            for (const [path, bytes] of Object.entries(files)) {
                if (path.startsWith(FILES_PREFIX)) media.set(path, bytes)
            }

            resolve({ payload, media })
        })
    })
}
