<script setup>
// 表单行
// 左侧标签 + 右侧输入
defineProps({
    label: { type: String, default: '' }
})
</script>

<template>
    <div class="from_items">
        <div v-if="label" class="from_text">{{ label }}</div>
        <slot />
    </div>
</template>
