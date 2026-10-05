<script setup>
// tabs 横向滚动容器
import { ref, onMounted, nextTick } from 'vue'
import { setupTabsScrolling } from '@/core/npp/tabsScroll.js'

const tabsRef = ref(null)

onMounted(async () => {
    await nextTick()
    if (tabsRef.value) setupTabsScrolling(tabsRef.value)
})
</script>

<template>
    <div ref="tabsRef" class="tabs">
        <slot />
    </div>
</template>
