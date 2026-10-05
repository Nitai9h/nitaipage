<script setup>
// 应用调度
import { ref, computed, watch, onMounted } from 'vue'
import { useUiStore, PANEL } from '@/stores/ui'
import { initPageDB, initNppStore, initNppDB } from '@/utils/db'
import { installFrameStyle, frameStyle } from '@/utils/frameStyle'
import { loadNpp, checkUpdates, migrateLegacyUpdateUrls } from '@/core/npp/npplication.js'
import { loadNodeTable } from '@/core/npp/nodes.js'
import { logVersionInfo } from '@/core/version'
import { useSearchEngines } from '@/composables/useSearchEngines'
import { useShortcuts, initShortcutSync } from '@/composables/useShortcuts'
import { initDataSourceSync } from '@/utils/dataSource'
import { useWallpaper } from '@/composables/useWallpaper'
import { useWelcome } from '@/composables/useWelcome'
import { initExtensionBridge } from '@/composables/useExtension'

// 首页
import BackgroundLayer from '@/components/home/BackgroundLayer.vue'
import ClockPanel from '@/components/home/ClockPanel.vue'
import SearchBar from '@/components/home/SearchBar.vue'
import EntryBar from '@/components/home/EntryBar.vue'
import FooterBar from '@/components/home/FooterBar.vue'
// 其它页
import ShortcutGrid from '@/components/shortcut/ShortcutGrid.vue'
import SettingsPanel from '@/components/settings/SettingsPanel.vue'
import StorePanel from '@/components/plugins/StorePanel.vue'
import PluginSettingsPanel from '@/components/plugins/PluginSettingsPanel.vue'

const uiStore = useUiStore()
const { refreshSeList } = useSearchEngines()
const { refreshQuickList } = useShortcuts()
const { initWallpaperSettings } = useWallpaper()

const searchRef = ref(null)
const shortcutRef = ref(null)

// 首屏只渲染引导页时，不启动主 app
const booted = ref(false)

/* body 全局 class */

const bodyClass = computed(() => {
    const classes = [uiStore.boxOpen ? 'open' : 'close']
    if (uiStore.searchFocused) classes.push('onsearch')
    return classes.join(' ')
})

watch(
    bodyClass,
    (value) => {
        document.body.className = value
    },
    { immediate: true, flush: 'sync' }// 必须 flush:'sync'，否则 .onsearch 比面板首帧晚，多一次 800ms 过渡
)

/* Box 展开/收起时的样式 */

// 先时钟再布局
watch(
    () => [uiStore.boxOpen, uiStore.clockHidden],
    ([open, clockHidden]) => {
        applyTimeVisibility(clockHidden)
        applyBoxStyles(open)
    }
)

// 时钟上移/下移
function applyTimeVisibility(hidden) {
    const toolAll = document.querySelector('.tool-all')
    if (toolAll) {
        toolAll.style.opacity = hidden ? '0' : '1'
        toolAll.style.pointerEvents = hidden ? 'none' : 'unset'
    }

    document.querySelectorAll('.set, .mark, .store, .plugin_set').forEach((el) => {
        el.style.marginTop = hidden ? '0px' : '180px'
        el.style.maxHeight = hidden ? '480px' : '400px'
        el.style.height = hidden ? '480px' : '400px'
    })

    const dialogHeight = hidden ? '390px' : '310px'
    const listHeight = hidden ? '340px' : '260px'
    const blockHeight = hidden ? '420px' : '340px'

    document.querySelectorAll('.dialog-content, .storeContent').forEach((el) => {
        el.style.height = dialogHeight
    })
    document.querySelectorAll('.panel_list').forEach((el) => {
        el.style.height = listHeight
    })
    document.querySelectorAll('.set_blocks, .panelContent, .plugin_set .contents').forEach((el) => {
        el.style.height = blockHeight
    })
}

function applyBoxStyles(open) {
    const toolAll = document.querySelector('.tool-all')
    const searchContainer = document.getElementById('search-form-container')
    const bg = document.getElementById('bg')
    const bgVideo = document.getElementById('bg-video')

    if (open) {
        if (toolAll) {
            toolAll.style.transform = 'translateY(-190%)'
            toolAll.style.scale = '0.9'
        }
        if (searchContainer) searchContainer.style.transform = 'translateY(85%)'
    } else {
        if (toolAll) {
            toolAll.style.transform = 'translateY(-120%)'
            toolAll.style.scale = '1'
        }
        if (searchContainer) searchContainer.style.transform = 'translateY(-70%)'

        // 背景复位
        ;[bg, bgVideo].forEach((el) => {
            if (!el) return
            el.style.transform = 'scale(1)'
            el.style.filter = 'blur(0px)'
            el.style.transition = 'ease 0.6s'
        })
    }
}

/* 全局交互 */

// 点击外部收起 Box
function onCloseSou() {
    uiStore.blurSearch()
    uiStore.closePanel()
}

// Tab 键打开捷径面板
function onKeydown(event) {
    if (event.key === 'Tab') {
        event.preventDefault()
        document.getElementById('time_text')?.click()
    }
}

/*  启动  */

async function bootstrap() {
    // 禁用右键
    document.oncontextmenu = () => false

    // 加载动画
    installFrameStyle()
    frameStyle.createLoading()

    // 数据库初始化
    await Promise.all([
        initPageDB().catch((error) => console.error('nitaiPageDB 初始化失败:', error)),
        initNppStore().catch((error) => console.error('nppstore 初始化失败:', error)),
        initNppDB().catch((error) => console.error('nppDB 初始化失败:', error))
    ])

    // 注入安装的插件脚本
    await loadNpp()

    // 核心插件初始化（coreNpp 是独立脚本，用 window.nppXxx 暴露）
    globalThis.nppThemeColor?.initThemeColor?.()
    globalThis.nppAdvancedSettings?.initAdvancedSettings?.()
    globalThis.nppCustomStyle?.initCustomStyle?.()

    // 首页数据与壁纸设置一起加载
    await Promise.all([
        refreshSeList(),
        refreshQuickList(),
        initWallpaperSettings()
    ])

    // 与浏览器扩展建立通信
    initExtensionBridge()

    // 同步扩展写入的捷径
    initShortcutSync()
    // 用于扩展填入数据来源时更新数据
    initDataSourceSync()

    // Npp 官方商店节点表
    loadNodeTable().catch((error) => console.warn('节点表加载失败:', error.message))

    // 检查插件更新
    // 老插件的更新地址迁到新入口
    checkUpdates('all', 'hide')
        .catch((error) => console.error('检查插件更新失败:', error))
        .then(() => migrateLegacyUpdateUrls())
        .catch((error) => console.error('插件更新地址迁移失败:', error))

    // 控制台版本信息
    logVersionInfo()

    booted.value = true
    uiStore.setLoading(false)
}

onMounted(async () => {
    window.addEventListener('keydown', onKeydown)
    useWelcome()
    await bootstrap()
})
</script>

<template>
    <div class="app">
        <!-- 背景 -->
        <BackgroundLayer />

        <!-- 主体内容 -->
        <section id="section" class="section">
            <div id="content" :class="{ box: uiStore.boxOpen }">
                <div class="con">
                    <!-- 时间 -->
                    <ClockPanel />

                    <!-- 搜索框 -->
                    <div class="close_sou" @click="onCloseSou"></div>
                    <SearchBar ref="searchRef" />

                    <!-- 捷径 -->
                    <ShortcutGrid ref="shortcutRef" />

                    <!-- 入口 -->
                    <EntryBar />

                    <!-- 商店 -->
                    <div class="store" :class="uiStore.storeActive ? 'active' : 'inactive'">
                        <StorePanel />
                    </div>

                    <!-- 设置 -->
                    <SettingsPanel />

                    <!-- 插件设置 -->
                    <PluginSettingsPanel
                        :class="uiStore.pluginSetActive ? 'active' : 'inactive'"
                        @close="uiStore.openPanel(PANEL.SET)" />
                </div>
            </div>

            <!-- 版本信息 -->
            <FooterBar />
        </section>
    </div>
</template>
