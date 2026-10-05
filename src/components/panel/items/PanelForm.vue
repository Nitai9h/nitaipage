<script setup>
// 表单
// 标签 + 输入框，底部可放按钮
defineProps({
    // 额外 class （se_add_content / quick_add_content）
    variant: { type: String, default: '' }
})
</script>

<template>
    <div class="add_content" :class="variant">
        <div class="froms">
            <slot />
        </div>
        <slot name="actions" />
    </div>
</template>
