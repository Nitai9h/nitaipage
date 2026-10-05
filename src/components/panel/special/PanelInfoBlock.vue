<script setup>
// 插件详细信息
// 图标 + 名称 + 版本 / 作者 / NID
// 下方可追加自定义（e.g.source）
defineProps({
    icon: { type: String, default: '' },
    name: { type: String, default: '' },
    version: { type: String, default: '' },
    author: { type: String, default: '' },
    nid: { type: String, default: '' }
})
</script>

<template>
    <div class="plugin-detail-header">
        <img :src="icon" :alt="name" class="detail-icon">
        <div class="detail-title">
            <h2 translate="none">{{ name }}</h2>
            <div class="detail-source">
                <p>@npplication:version:</p>
                <p translate="none">{{ version }}</p>
                <p class="sourceNonCritical">|</p>
                <p>@npplication:author:</p>
                <p translate="none">{{ author }}</p>
            </div>
            <p translate="none">NID: {{ nid }}</p>
            <slot />
        </div>
    </div>
</template>
