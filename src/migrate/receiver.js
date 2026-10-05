// 用于接收域名迁移的数据

import { useBackup } from '@/composables/useBackup'

// 旧源
const OLD_ORIGINS = ['https://www.nitai.us.kg', 'https://dev-www.nitai.us.kg']

const MESSAGE = {
    READY: 'nitaiPage-migrate:ready',
    DATA: 'nitaiPage-migrate:data',
    DONE: 'nitaiPage-migrate:done',
    ERROR: 'nitaiPage-migrate:error'
}

function isAllowedOrigin(origin) {
    if (OLD_ORIGINS.includes(origin)) return true
    try {
        const url = new URL(origin)
        const host = url.hostname.replace(/^\[|\]$/g, '')
        return url.protocol === 'http:' && ['localhost', '127.0.0.1', '::1'].includes(host)
    } catch (error) {
        return false
    }
}

// 必须为被顶层窗口主动打开的请求
function isMigrationRequest() {
    if (window.parent !== window || !window.opener) return false
    return new URLSearchParams(location.search).get('migrate') === '1'
}

// 旧源只处理JSON格式
function createChunks() {
    const parts = []

    return {
        push(chunk) {
            if (typeof chunk === 'string') parts.push(chunk)
        },
        toBytes() {
            return new TextEncoder().encode(parts.join(''))
        }
    }
}

function parsePayload(bytes) {
    return JSON.parse(new TextDecoder().decode(bytes))
}

/* 界面 */
function renderPanel() {
    const mount = document.getElementById('app')
    if (!mount) return { setStatus() { } }

    document.documentElement.style.cssText = 'color-scheme:dark;background:#1c1c1b;height:100%'
    document.body.style.cssText = 'margin:0;background:#1c1c1b;overflow:hidden;height:100%'

    mount.innerHTML = `
        <div style="position:fixed;inset:0;display:grid;place-items:center;background:#1c1c1b;color:#f1efe8;
                    font:14px/1.7 system-ui,-apple-system,'Segoe UI',sans-serif">
            <div style="width:min(92vw,420px);text-align:center">
                <h1 style="font-size:18px;font-weight:500;margin:0 0 10px">正在迁移数据</h1>
                <p id="migrate-status" style="color:#b4b2a9;margin:0">等待数据传入…</p>
            </div>
        </div>`

    return {
        setStatus(text, color) {
            const el = document.getElementById('migrate-status')
            if (!el) return
            el.textContent = text
            el.style.color = color || '#b4b2a9'
        },
        done() {
            const title = mount.querySelector('h1')
            if (title) title.textContent = '迁移完成'
        }
    }
}

/**
 * 若处于迁移模式，拦截正常启动并建立跨窗口通信通道以接收数据
 * @returns {Promise<boolean>} true 表示已接管，不要再走正常启动
 */
export function runMigrationReceiver() {
    if (!isMigrationRequest()) return Promise.resolve(false)

    const panel = renderPanel()
    const opener = window.opener
    const chunks = createChunks()
    const received = new Set()
    let total = 0
    let peerOrigin = ''

    const post = (message, target) => opener.postMessage(message, target || peerOrigin || '*')

    return new Promise((resolve) => {
        function settle(ok) {
            window.removeEventListener('message', onMessage)
            resolve(ok)
        }

        function fail(message) {
            panel.setStatus(message, '#e5a0a0')
            post({ type: MESSAGE.ERROR, message }, peerOrigin || '*')
            settle(true)
        }

        async function finish() {
            panel.setStatus('正在写入本机存储…')
            try {
                const payload = parsePayload(chunks.toBytes())
                await useBackup().applyBackup(payload)
            } catch (error) {
                console.error('迁移写入失败:', error)
                fail('数据写入失败：' + (error?.message || error))
                return
            }

            // 优先发送完成会心，避免旧站点因等待当前页面刷新阻塞
            post({ type: MESSAGE.DONE })
            panel.done()
            panel.setStatus('数据已写入，页面即将刷新…', '#a5d6a7')
            setTimeout(() => location.replace(location.pathname), 1500)
            settle(true)
        }

        function onMessage(event) {
            if (event.source !== opener) return

            const data = event.data
            if (!data || typeof data.type !== 'string') return

            if (data.type !== MESSAGE.DATA) return

            if (!peerOrigin) {
                if (!isAllowedOrigin(event.origin)) {
                    fail('数据来自未授权的来源：' + event.origin)
                    return
                }
                peerOrigin = event.origin
            }
            if (event.origin !== peerOrigin) return

            if (typeof data.index !== 'number' || typeof data.total !== 'number') return
            total = data.total

            if (!received.has(data.index)) {
                received.add(data.index)
                chunks.push(data.chunk)
            }

            // 逐片确认，旧站点继续发送后续数据分片
            post({ type: MESSAGE.DATA, index: data.index }, peerOrigin)
            panel.setStatus(`正在接收数据… ${received.size} / ${total}`)

            if (total > 0 && received.size >= total) finish()
        }

        window.addEventListener('message', onMessage)
        post({ type: MESSAGE.READY })
    })
}
