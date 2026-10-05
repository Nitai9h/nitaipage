<script setup>
// 可折叠块
// 标题 + fold 按钮 + 内容
// 切换时按内容实际高度计算 max-height，展开状态下内容变化也要重算
import { ref, onMounted, onBeforeUnmount, watch, nextTick } from 'vue'

const props = defineProps({
    title: { type: String, default: '' },
    // 初始是否展开
    open: { type: Boolean, default: true },
    // 内容容器额外 class
    bodyClass: { type: String, default: '' }
})

const expanded = ref(props.open)
const bodyEl = ref(null)
const maxHeight = ref('0px')
let observer = null

// 获取真实高度
async function syncHeight() {
    await nextTick()
    const el = bodyEl.value
    if (!el) return
    maxHeight.value = expanded.value ? el.scrollHeight + 'px' : '0px'
}

function onContentChange() {
    if (expanded.value) syncHeight()
}

function observe() {
    if (!bodyEl.value || observer) return
    // 监听 DOM 子树的异步变更（e.g.插件列表的异步渲染）
    // 确保展开状态下 max-height 能随内容动态更新
    observer = new MutationObserver(onContentChange)
    observer.observe(bodyEl.value, { childList: true, subtree: true })
    // 图片加载后修正 max-height
    bodyEl.value.addEventListener('load', onContentChange, true)
}

onMounted(async () => {
    await syncHeight()
    observe()
})

onBeforeUnmount(() => {
    if (observer) observer.disconnect()
    observer = null
    if (bodyEl.value) bodyEl.value.removeEventListener('load', onContentChange, true)
})

watch(expanded, syncHeight)
</script>

<template>
    <div class="panel_fold">
        <div class="panel_fold_header">
            <h3>{{ title }}</h3>
            <button class="panel_fold_toggle" type="button" @click="expanded = !expanded">
                <i class="iconfont" :class="expanded ? 'icon-unfolding' : 'icon-folding'"></i>
            </button>
        </div>
        <div
            ref="bodyEl"
            :class="[bodyClass || 'panel_fold_body', { expanded }]"
            :style="{ maxHeight }"
        >
            <slot />
        </div>
    </div>
</template>
