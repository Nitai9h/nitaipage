<script setup>
// 纯文字块
// 一行或多行
defineProps({
    // 单行文字，需要多行时用默认插槽
    text: { type: String, default: '' },
    id: { type: String, default: '' }
})
</script>

<template>
    <div class="set_tip set_tip_new panel_text_block">
        <span v-if="text" class="set_text_wallpaper" :id="id || undefined">{{ text }}</span>
        <slot />
    </div>
</template>
