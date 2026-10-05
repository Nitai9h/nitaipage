import { createApp, h } from 'vue'
import { createPinia } from 'pinia'
import iziToast from 'izitoast'

import { i18n, setupI18n } from '@/i18n'
import { initDefaultSettings, KEY, VISITED_VERSION } from '@/utils/storage'
import { installPluginGlobals } from '@/core/npp/pluginGlobals.js'
import { initPluginI18n } from '@/core/npp/pluginI18n.js'
import { initCoreNpp } from '@/core/npp/npplication.js'
import { initRemoteStore, onRemoteError } from '@/utils/remoteStore'
import { installLocalStorageShim } from '@/utils/localShim'
import { runMigrationReceiver } from '@/migrate/receiver'

function showDataServerError(url) {
    const mount = document.getElementById('app')
    if (!mount) return

    document.documentElement.style.cssText = 'color-scheme:dark;background:#333333;height:100%'
    document.body.style.cssText = 'margin:0;background:#333333;overflow:hidden;height:100%'

    mount.innerHTML = `
        <div style="position:fixed;inset:0;display:grid;place-items:center;background:#333333;color:#f1efe8;
                    font:14px/1.7 system-ui,-apple-system,'Segoe UI',sans-serif">
            <div style="width:min(92vw,420px);text-align:center">
                <h1 style="font-size:18px;font-weight:500;margin:0 0 10px">无法连接到数据</h1>
                <p style="color:#b4b2a9;margin:0 0 6px">当前绑定的服务器开启了仅支持服务器存储，但目前无法连接服务器</p>
                <p style="color:#888780;margin:0 0 18px;word-break:break-all">${url || '地址未填写'}</p>
                <div style="display:flex;gap:10px;justify-content:center">
                    <button id="retry-data-server" style="font:inherit;padding:8px 18px;border-radius:8px;cursor:pointer;
                            border:1px solid #5f5e5a;background:transparent;color:inherit">重试</button>
                    <button id="fallback-data-server" style="font:inherit;padding:8px 18px;border-radius:8px;cursor:pointer;
                            border:1px solid #378add;background:#0c447c;color:inherit">修改存储方式为浏览器 (默认)</button>
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
}

// 完成当前版本的 Guide 后才进入主 APP
async function start() {
    if (await runMigrationReceiver()) return

    const remote = initRemoteStore()
    if (remote.active && !await installLocalStorageShim()) {
        showDataServerError(remote.url)
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
