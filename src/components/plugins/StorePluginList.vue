<script setup>
// 商店插件列表
import { ref, watch, onBeforeUnmount } from 'vue'
import { extractMetadata, isTrustedStoreMetadata } from '@/core/npp/npplication.js'
import { cleanUrl } from '@/utils/dom'
import { mapLimit } from '@/utils/async'

const props = defineProps({
    plugins: { type: Array, default: () => [] }
})
const emit = defineEmits(['open'])

const loadingVisible = ref(true)
const fadeOut = ref(false)
const loadingState = ref('loading') // loading | success | error
const items = ref([])

let controller = null
let renderToken = 0

async function render(list) {
    // 每次渲染领一个 token，避免异步渲染结果被后续渲染覆盖
    const token = ++renderToken

    if (controller) controller.abort()
    controller = new AbortController()
    loadingVisible.value = true
    fadeOut.value = false
    loadingState.value = 'loading'
    items.value = []

    let hasError = false

    // 性能优化，插件越多逐个 await 的时间越长，这里改为限制并发获取元数据
    const rendered = await mapLimit(list, 6, async (plugin) => {
        if (controller.signal.aborted) return null

        // 若商店源带了元数据就直接用，防止重复抓取（仅官方源）
        if (isTrustedStoreMetadata(plugin) && plugin.name && plugin.version) {
            return {
                ...plugin,
                dependencies: plugin.dependencies || '',
                associations: plugin.associations || '',
                translates: plugin.translates || ''
            }
        }

        try {
            const metadata = await extractMetadata(plugin.url)
            if (!metadata) return null
            return {
                ...plugin,
                ...metadata,
                dependencies: metadata.dependencies || '',
                associations: metadata.associations || '',
                translates: metadata.translates || ''
            }
        } catch (error) {
            if (error.name !== 'AbortError') {
                console.error(`加载插件失败: ${plugin.url}`, error)
                hasError = true
            }
            return null
        }
    })

    // 旧渲染结果作废
    if (token !== renderToken) return

    items.value = rendered.filter(Boolean)
    loadingState.value = hasError ? 'error' : 'success'

    if (!hasError) {
        setTimeout(() => {
            if (token !== renderToken) return
            fadeOut.value = true
            setTimeout(() => { if (token === renderToken) loadingVisible.value = false }, 300)
        }, 2000)
    }
}

watch(() => props.plugins, (v) => render(v || []), { immediate: true })

onBeforeUnmount(() => { if (controller) controller.abort() })

function open(item) {
    emit('open', item)
}
</script>

<template>
    <div>
        <div v-if="loadingVisible" class="store-loading" :class="[loadingState, { 'fade-out': fadeOut }]">
            <div class="store-loading-spinner"></div>
            <i class="store-loading-icon iconfont icon-right1"></i>
            <i class="store-loading-icon iconfont icon-wrong"></i>
            <span class="store-loading-text">
                {{ loadingState === 'loading' ? '@npplication:loading-text'
                    : (loadingState === 'success' ? '@npplication:loading-success' : '@npplication:loading-fail') }}
            </span>
        </div>

        <div class="store-plugins-container">
            <div v-for="(item, idx) in items" :key="item.url" class="plugin-item"
                 :style="{ animationDelay: (idx * 0.05) + 's' }" @click="open(item)">
                <img :src="cleanUrl(item.icon || '')" :alt="item.name || '插件'" class="plugin-icon">
                <div class="plugin-info">
                    <strong translate="none">{{ item.name || '@npplication:no-name' }}</strong>
                    <p translate="none">{{ item.description || '@npplication:no-description' }}</p>
                </div>
            </div>
        </div>
    </div>
</template>
