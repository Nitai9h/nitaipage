<script setup>
// 搜索引擎切换窗口打开 / 关闭
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useSearchEngines } from '@/composables/useSearchEngines'
import { useUiStore } from '@/stores/ui'

const uiStore = useUiStore()
const { seList, orderedList, refreshSeList } = useSearchEngines()

// 生效的搜索引擎（或回退为默认）
const activeEngine = ref({ url: 'https://www.baidu.com/s', name: 'wd', icon: 'iconfont icon-baidu' })

const keyword = ref('')
const enginePanelOpen = ref(false)
const enginePanelRef = ref(null)
const souRef = ref(null)
const formRef = ref(null)

const formAction = computed(() => activeEngine.value.url || 'https://www.baidu.com/s')
const fieldName = computed(() => activeEngine.value.name || 'wd')
const iconClass = computed(() => activeEngine.value.icon || 'iconfont icon-baidu')

// 设置默认生效引擎
async function syncActiveEngine() {
    await refreshSeList()
    const defaultKey = localStorage.getItem('se_default') || '1'
    const engine = seList.value[defaultKey]
    if (engine) {
        activeEngine.value = { ...engine }
    }
}

// 切换展开 / 收起
const PANEL_ANIM = 160

// 面板显隐
function toggleEnginePanel() {
    // .se 用 .stop 阻止了冒泡，收不到 .sou 的聚焦，必须补上聚焦状态
    // 否则 .onsearch 的图标变色与位移缩放都不生效
    uiStore.setSearchFocused(true)

    if (enginePanelOpen.value) {
        closeEnginePanel()
    } else {
        openEnginePanel()
    }
}

// 读取滑动动画用的盒模型尺寸（= 原 jQuery slideDown 的测量方式）
// scrollHeight / offsetHeight 已包含 padding，无法直接作为 height 的动画值
function readBox(panel) {
    const cs = getComputedStyle(panel)
    const padTop = parseFloat(cs.paddingTop) || 0
    const padBot = parseFloat(cs.paddingBottom) || 0
    const marginTop = parseFloat(cs.marginTop) || 0
    return {
        padTop,
        padBot,
        marginTop,
        // content 高度 = 当前总高 − 上下 padding
        contentH: Math.max(panel.offsetHeight - padTop - padBot, 0)
    }
}

// swing(p) = 0.5 - cos(pπ) / 2，用线性分布的关键帧手动采样
const swing = (p) => 0.5 - Math.cos(p * Math.PI) / 2

// 生成滑动关键帧：
// height / 上下 padding / 上 margin 同步从 startRatio 到 endRatio
function slideFrames(box, startRatio, endRatio, steps = 16) {
    const frames = []
    for (let i = 0; i <= steps; i++) {
        const p = i / steps
        const r = startRatio + (endRatio - startRatio) * swing(p)
        frames.push({
            offset: p,
            height: box.contentH * r + 'px',
            paddingTop: box.padTop * r + 'px',
            paddingBottom: box.padBot * r + 'px',
            marginTop: box.marginTop * r + 'px'
        })
    }
    return frames
}

function openEnginePanel() {
    const panel = enginePanelRef.value
    if (!panel) return

    // 宽度跟随搜索框
    const souWidth = souRef.value ? souRef.value.offsetWidth : 0
    if (souWidth) panel.style.width = souWidth + 40 + 'px'

    panel.style.display = 'block'
    panel.style.overflow = 'hidden'

    const box = readBox(panel)

    // 用 WAAPI 同时动画 height、上下 padding 与上 margin（只动画 height 展开不了）
    // 为了不覆盖 CSS 里 panel 位移缩放所需的过渡 不用使用内联 transition
    const anim = panel.animate(
        slideFrames(box, 0, 1),
        { duration: PANEL_ANIM, easing: 'linear' }
    )
    anim.onfinish = () => {
        // 动画结束后清除尺寸
        panel.style.height = ''
        panel.style.overflow = ''
    }

    enginePanelOpen.value = true
}

function closeEnginePanel() {
    const panel = enginePanelRef.value
    if (!panel || !enginePanelOpen.value) return

    const box = readBox(panel)
    panel.style.overflow = 'hidden'

    const anim = panel.animate(
        slideFrames(box, 1, 0),
        { duration: PANEL_ANIM, easing: 'linear' }
    )
    anim.onfinish = () => {
        panel.style.display = 'none'
        panel.style.height = ''
        panel.style.overflow = ''
    }

    enginePanelOpen.value = false
}

// 选择搜索引擎（仅本次窗口内生效）
function selectEngine(engine) {
    activeEngine.value = { ...engine }
    closeEnginePanel()
}

// 点击搜索框
function onSearchFocus() {
    uiStore.setSearchFocused(true)
    closeEnginePanel()
}

// 搜索按钮
function onSubmitClick() {
    if (!uiStore.searchFocused) return
    if (keyword.value) {
        formRef.value?.requestSubmit?.() ?? formRef.value?.submit()
    }
}

// 空关键词不提交
function onSubmit(event) {
    if (!keyword.value) {
        event.preventDefault()
    }
}

// 点击空白处收起面板
function onDocumentClick(event) {
    const panel = enginePanelRef.value
    if (!panel) return
    if (panel.contains(event.target)) return
    if (event.target.closest?.('.se')) return
    closeEnginePanel()
}

// 清空搜索框并退出聚焦
// 多个收起点，使用 nitaipage:blur-search 通知
function blurSearch() {
    keyword.value = ''
    uiStore.setSearchFocused(false)
    closeEnginePanel()
}

onMounted(async () => {
    await syncActiveEngine()
    document.addEventListener('click', onDocumentClick)
    window.addEventListener('nitaipage:blur-search', blurSearch)
})

onUnmounted(() => {
    document.removeEventListener('click', onDocumentClick)
    window.removeEventListener('nitaipage:blur-search', blurSearch)
})

// 供 App.vue 在 关闭搜索 时调用
defineExpose({ closeEnginePanel, blur: blurSearch })
</script>

<template>
    <div class="sou" ref="souRef" @click="onSearchFocus">
        <div id="search-form-container">
            <form class="search" ref="formRef" :action="formAction" target="_Blank" @submit="onSubmit">
                <div class="all-search">
                    <div class="se" @click.stop="toggleEnginePanel">
                        <i id="icon-se" :class="iconClass"></i>
                    </div>
                    <input class="wd" v-model="keyword" type="text" :name="fieldName"
                        :placeholder="$t('@global:search-placeholder')" autocomplete="off">
                    <div class="sou-button" @click.stop="onSubmitClick">
                        <div class="s" id="s-button">
                            <i id="icon-sou" class="iconfont icon-sousuo"></i>
                        </div>
                    </div>
                </div>
                <input type="submit" id="search-submit" style="display: none;">
            </form>

            <div class="search-engine" id="search-engine" ref="enginePanelRef" style="display: none;"
                @click.stop>
                <div class="search-engine-list">
                    <div v-for="engine in orderedList" :key="engine.key" class="se-li"
                        :data-url="engine.url" :data-name="engine.name" :data-icon="engine.icon"
                        @click="selectEngine(engine)">
                        <a class="se-li-text">
                            <i id="icon-sou-list" :class="engine.icon"></i>
                            <span translate="none">{{ engine.title }}</span>
                        </a>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>
