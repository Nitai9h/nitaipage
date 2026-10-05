<script setup>
// 左右两组按钮正常隐藏，鼠标靠近对应角落时才渐显
import { computed, ref, onMounted, onBeforeUnmount } from 'vue'
import { useUiStore, PANEL } from '@/stores/ui'

const uiStore = useUiStore()

// 渐显范围
const PROXIMITY = 90

const leftRef = ref(null)
const rightRef = ref(null)
const leftNear = ref(false)
const rightNear = ref(false)

// 小屏常显
let alwaysVisible = false

let rafId = 0
let pointerX = -1
let pointerY = -1

// fold 按钮图标切换
const foldIconClass = computed(() => (uiStore.foldOn ? 'iconfont icon-unfold' : 'iconfont icon-fold'))

// 判断鼠标是否靠近
function hit(el) {
    if (!el) return false
    const r = el.getBoundingClientRect()
    return pointerX >= r.left - PROXIMITY && pointerX <= r.right + PROXIMITY &&
        pointerY >= r.top - PROXIMITY && pointerY <= r.bottom + PROXIMITY
}

function evaluate() {
    rafId = 0
    leftNear.value = alwaysVisible || hit(leftRef.value)
    rightNear.value = alwaysVisible || hit(rightRef.value)
}

// 性能优化，mousemove 频率很高，合并到下一帧统一判断
function schedule() {
    if (rafId) return
    rafId = requestAnimationFrame(evaluate)
}

function onPointerMove(e) {
    pointerX = e.clientX
    pointerY = e.clientY
    schedule()
}

// 鼠标远离
function onPointerLeave() {
    if (alwaysVisible) return
    leftNear.value = false
    rightNear.value = false
}

onMounted(() => {
    alwaysVisible = window.matchMedia('(hover: none)').matches
    window.addEventListener('mousemove', onPointerMove, { passive: true })
    document.documentElement.addEventListener('mouseleave', onPointerLeave)
})

onBeforeUnmount(() => {
    window.removeEventListener('mousemove', onPointerMove)
    document.documentElement.removeEventListener('mouseleave', onPointerLeave)
    if (rafId) cancelAnimationFrame(rafId)
})

// 点击折叠
// 仅在 Box 已打开时才响应
function onFoldClick() {
    const canToggle = uiStore.boxOpen || uiStore.activePanel === PANEL.SET || uiStore.activePanel === PANEL.STORE
    if (!canToggle) return
    uiStore.toggleFold()
}

// 设置
function onMenuClick() {
    if (uiStore.activePanel === PANEL.SET) {
        uiStore.closePanel()
    } else {
        uiStore.openPanel(PANEL.SET)
    }
}

// 商店
function onStoreClick() {
    if (uiStore.activePanel === PANEL.STORE) {
        uiStore.closePanel()
    } else {
        uiStore.openPanel(PANEL.STORE)
    }
}

// 点击空白处
// 关闭 Box 、退出搜索
function onEntryClick(event) {
    if (event.target !== event.currentTarget) return
    uiStore.blurSearch()
    uiStore.closePanel()
}
</script>

<template>
    <div class="entry" @click="onEntryClick">
        <div class="entry-left" ref="leftRef" :class="{ near: leftNear }">
            <div class="entry-items" :class="uiStore.boxOpen ? 'active' : 'inactive'" id="fold"
                @click="onFoldClick">
                <i :id="'icon-fold'" :class="foldIconClass"></i>
            </div>
        </div>
        <div class="entry-right" ref="rightRef" :class="{ near: rightNear }">
            <div class="entry-items" id="menu" :class="{ on: uiStore.activePanel === PANEL.SET }"
                @click="onMenuClick">
                <i id="icon-menu" :class="uiStore.menuIconClass"></i>
            </div>
            <div class="entry-items" id="store" :class="{ on: uiStore.activePanel === PANEL.STORE }"
                @click="onStoreClick">
                <i id="icon-store" :class="uiStore.storeIconClass"></i>
            </div>
        </div>
    </div>
</template>
