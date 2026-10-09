import { createApp, h } from 'vue'
import { createPinia } from 'pinia'
import iziToast from 'izitoast'

import { i18n, setupI18n } from '@/i18n'
import { initDefaultSettings, KEY, VISITED_VERSION } from '@/utils/storage'
import { installPluginGlobals } from '@/core/npp/pluginGlobals.js'
import { initPluginI18n } from '@/core/npp/pluginI18n.js'
import { initCoreNpp } from '@/core/npp/npplication.js'
import { initRemoteStore, onRemoteError } from '@/utils/remoteStore'
import { DATA_TOKEN_KEY, lockedByBuild } from '@/utils/dataSource'
import { installLocalStorageShim } from '@/utils/localShim'
import { runMigrationReceiver } from '@/migrate/receiver'

function showDataServerError(remote) {
    const url = remote?.url || ''
    const mount = document.getElementById('app')
    if (!mount) return

    document.documentElement.style.cssText = 'color-scheme:dark;background:#333333;height:100%'
    document.body.style.cssText = 'margin:0;background:#333333;overflow:hidden;height:100%'

    const hint = lockedByBuild
        ? '暂时无法连接服务器，请配对或者检查服务器状态'
        : '当前使用的自建服务器无法连接，请检查地址与网络后重试'

    const buttons = lockedByBuild
        ? ''
        : `<button id="fallback-data-server" style="font:inherit;padding:8px 18px;border-radius:8px;cursor:pointer;
                border:1px solid #378add;background:#0c447c;color:inherit">修改存储方式为浏览器 (默认)</button>`

    mount.innerHTML = `
        <div style="position:fixed;inset:0;display:grid;place-items:center;background:#333333;color:#f1efe8;
                    font:14px/1.7 system-ui,-apple-system,'Segoe UI',sans-serif">
            <div style="width:min(92vw,420px);text-align:center">
                <h1 style="font-size:18px;font-weight:500;margin:0 0 10px">无法连接到数据</h1>
                <p style="color:#b4b2a9;margin:0 0 6px">${hint}</p>
                <p style="color:#888780;margin:0 0 18px;word-break:break-all">${url || '地址未填写'}</p>
                <div style="display:flex;gap:10px;justify-content:center">
                    <button id="retry-data-server" style="font:inherit;padding:8px 18px;border-radius:8px;cursor:pointer;
                            border:1px solid #5f5e5a;background:transparent;color:inherit">重试</button>
                    ${buttons}
                </div>
                <div id="locked-fix-slot"></div>
                <div id="pair-data-box" style="display:none;margin-top:22px">
                    <p style="color:#b4b2a9;margin:0 0 8px">在服务器上执行以下命令批准：</p>
                    <code style="display:block;padding:10px 12px;border-radius:8px;background:#1c1c1b;border:1px solid #4a4a47;
                        font:12px/1.5 ui-monospace,Consolas,monospace;word-break:break-all">npm run pair -- <span id="pair-data-code"></span></code>
                    <p id="pair-data-status" style="color:#888780;margin:8px 0 0">等待批准…</p>
                </div>
            </div>
        </div>`

    document.getElementById('retry-data-server')?.addEventListener('click', () => location.reload())

    document.getElementById('fallback-data-server')?.addEventListener('click', () => {
        try {
            localStorage.removeItem('dataServerUrl')
            localStorage.removeItem('dataServerToken')
            localStorage.setItem('dataSource', 'local')
        } catch (error) {
            console.error('改回本机存储失败:', error)
        }
        location.reload()
    })

    // 传递服务端鉴权方式
    if (lockedByBuild) renderLockedFix(url)
}

// 错误页配对
async function startDataPairing(url) {
    const box = document.getElementById('pair-data-box')
    const codeEl = document.getElementById('pair-data-code')
    const statusEl = document.getElementById('pair-data-status')
    if (!box || !statusEl) return
    box.style.display = 'block'
    statusEl.textContent = '正在发起配对…'

    const sameOrigin = (() => {
        try {
            return new URL(url, location.origin).origin === location.origin
        } catch (error) {
            return false
        }
    })()
    const credentials = sameOrigin ? 'include' : 'omit'

    let session
    try {
        const response = await fetch(`${url}/pair/request`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials,
            body: JSON.stringify({ name: '站点页面', platform: navigator.platform || '' })
        })
        const data = await response.json().catch(() => null)
        if (!response.ok || !data?.ok) throw new Error()
        session = { deviceId: data.deviceId, secret: data.secret }
        if (codeEl) codeEl.textContent = String(data.code || '').replace('-', '')
        statusEl.textContent = '等待批准…'
    } catch (error) {
        statusEl.textContent = '配对服务不可用，请确认地址和网络后重试'
        return
    }

    const timer = setInterval(async () => {
        try {
            const response = await fetch(`${url}/pair/claim`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials,
                body: JSON.stringify(session)
            })
            const data = await response.json().catch(() => null)
            if (data?.status === 'claimed' && data.token) {
                clearInterval(timer)
                statusEl.textContent = '配对成功，正在刷新…'
                localStorage.setItem(DATA_TOKEN_KEY, data.token)
                location.reload()
                return
            }
            if (data?.status === 'denied' || data?.status === 'expired' || data?.status === 'unknown') {
                clearInterval(timer)
                statusEl.textContent = '申请已失效，请重试'
            }
        } catch (error) {
            // 忽略网络问题
        }
    }, 2000)
}

// 配对页面
async function renderLockedFix(url) {
    const slot = document.getElementById('locked-fix-slot')
    if (!slot) return

    const kind = await detectAuthKind(url)

    if (kind === 'pairing') {
        slot.innerHTML = `
            <button id="pair-data-server" style="font:inherit;padding:8px 18px;border-radius:8px;cursor:pointer;margin-top:14px;
                    border:1px solid #378add;background:#0c447c;color:inherit">设备配对</button>`
        document.getElementById('pair-data-server')?.addEventListener('click', (event) => {
            event.currentTarget.disabled = true
            startDataPairing(url)
        })
        return
    }

    if (kind === 'password') {
        slot.innerHTML = `
            <div style="margin-top:16px">
                <input id="token-data-input" type="password" autocomplete="off" spellcheck="false"
                    placeholder="请填写 API_TOKEN"
                    style="font:inherit;padding:8px 12px;border-radius:8px;border:1px solid #5f5e5a;background:#1c1c1b;color:inherit;
                    width:min(100%,260px);text-align:center">
                <button id="token-data-save" style="font:inherit;padding:8px 18px;border-radius:8px;cursor:pointer;margin-left:8px;
                    border:1px solid #378add;background:#0c447c;color:inherit">保存</button>
            </div>`
        const input = document.getElementById('token-data-input')
        if (input) {
            try {
                input.value = localStorage.getItem(DATA_TOKEN_KEY) || ''
            } catch (error) {
                // 读不到跳过
            }
            input.addEventListener('keydown', (event) => {
                if (event.key === 'Enter') saveDataToken(url)
            })
        }
        document.getElementById('token-data-save')?.addEventListener('click', () => saveDataToken(url))
        return
    }

    slot.innerHTML = `<p style="color:#888780;margin:12px 0 0;font-size:13px">暂时无法连接到服务器，请检查网络后重试</p>`
}

// 获取鉴权方式
async function detectAuthKind(url) {
    try {
        const controller = new AbortController()
        const timer = setTimeout(() => controller.abort(), 5000)
        const response = await fetch(`${url}/version`, { credentials: 'omit', signal: controller.signal })
        clearTimeout(timer)
        if (!response.ok) return 'unknown'
        const data = await response.json().catch(() => null)
        if (data?.authMode === 'password') return 'password'
        if (data?.authMode === 'pairing') return 'pairing'
        return 'unknown'
    } catch (error) {
        return 'unknown'
    }
}

// password
async function saveDataToken(url) {
    const input = document.getElementById('token-data-input')
    const statusEl = document.getElementById('token-data-status')
    const token = String(input?.value || '').trim()
    if (!token) {
        if (statusEl) statusEl.textContent = '请填写 API_TOKEN'
        return
    }

    try {
        localStorage.setItem(DATA_TOKEN_KEY, token)
    } catch (error) {
        if (statusEl) statusEl.textContent = '保存失败：' + error.message
        return
    }

    if (statusEl) statusEl.textContent = '正在验证…'
    try {
        const response = await fetch(`${url}/db/nitaiPageDB/prefs`, {
            headers: { Authorization: `Bearer ${token}` },
            credentials: 'omit'
        })
        if (response.ok || response.status === 404) {
            if (statusEl) statusEl.textContent = '验证通过，正在刷新…'
            location.reload()
            return
        }
        if (statusEl) {
            statusEl.textContent = response.status === 401
                ? 'API_TOKEN 无效，请重新确认后重试'
                : `连接失败（HTTP ${response.status}）`
        }
    } catch (error) {
        if (statusEl) statusEl.textContent = '连接失败，请确认地址和网络后重试'
    }
}

// 完成当前版本的 Guide 后才进入主 APP
async function start() {
    if (await runMigrationReceiver()) return

    const remote = initRemoteStore()
    if (remote.active && !await installLocalStorageShim()) {
        showDataServerError(remote)
        return
    }

    onRemoteError((error) => {
        iziToast.show({ timeout: 4000, message: `数据保存失败：${error.message}` })
    })

    const visited = localStorage.getItem(KEY.visited)

    // 判断是否跳过引导页
    const hasVisited = visited === VISITED_VERSION
    const hasSkipCookie = document.cookie.split(';').some((item) => item.trim() === 'skipguide=1')
    const skipGuide = hasVisited || hasSkipCookie

    initDefaultSettings()

    // 第三方插件取库用的全局变量
    installPluginGlobals()

    // 避免首屏出现像 @global: 这样的原始 key
    await setupI18n()

    // 插件 DOM 翻译 + 后台安装全局翻译插件
    initPluginI18n()

    let Root

    // 只有等于当前版本的完成标记才直接进主 app
    // true / 1/ 空 直接进入引导页
    if (skipGuide) {
        // 主 app style与 components 延后加载
        await import('@/styles/main.css')
        const { default: App } = await import('@/App.vue')
        Root = App

        // 初始化 coreNpp
        await initCoreNpp()
    } else {
        // 引导页只加载引导页 style
        await import('@/styles/guide.css')
        const { default: GuidePage } = await import('@/components/guide/GuidePage.vue')
        Root = GuidePage
    }

    createApp({
        render: () => h(Root)
    })
        .use(createPinia())
        .use(i18n)
        .mount('#app')
}

start()
