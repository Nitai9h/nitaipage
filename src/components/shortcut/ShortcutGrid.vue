<script setup>
// 捷径
import { onMounted } from 'vue'
import { useShortcuts } from '@/composables/useShortcuts'
import { useUiStore } from '@/stores/ui'

const uiStore = useUiStore()
const { quickList, refreshQuickList } = useShortcuts()

// 对外暴露刷新，供设置面板保存后调用
defineExpose({ refresh: refreshQuickList })

onMounted(refreshQuickList)
</script>

<template>
    <div class="mark" :class="uiStore.markActive ? 'active' : 'inactive'">
        <div class="tab">
            <div class="tab-item active" style="width: 100%;">
                <span class="tab_text">{{ $t('@global:shortcut') }}</span>
            </div>
        </div>
        <div class="content products">
            <div class="mainCont selected">
                <div class="quick-all">
                    <div v-for="(item, key) in quickList" :key="key" class="quick">
                        <a translate="none" :href="item.url" target="_blank">{{ item.title }}</a>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>
