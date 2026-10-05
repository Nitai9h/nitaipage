<script setup>
// 跳转链接
defineProps({
    title: { type: String, default: '' },
    href: { type: String, default: '' },
    icon: { type: String, default: 'iconfont icon-link' }
})
</script>

<template>
    <div class="set_tip_about">
        <a class="text_hover about-link" :href="href" target="_blank" rel="noopener">
            <span class="set_text">{{ title }}</span>
            <span :class="icon"></span>
        </a>
    </div>
</template>
