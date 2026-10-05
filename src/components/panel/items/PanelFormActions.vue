<script setup>
// 表单底部的保存 / 取消按钮
defineProps({
    saveText: { type: String, default: '' },
    cancelText: { type: String, default: '' }
})

const emit = defineEmits(['save', 'cancel'])
</script>

<template>
    <div class="from_items button">
        <div class="panel_btn" @click="emit('save', $event)">
            <span class="set_quick_text">{{ saveText }}</span>
        </div>
        <div class="panel_btn" @click="emit('cancel', $event)">
            <span class="set_quick_text">{{ cancelText }}</span>
        </div>
    </div>
</template>
