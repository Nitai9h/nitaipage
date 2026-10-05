<script setup>
// 按钮
// 一行里并排的两个按钮（e.g.新增 / 重置、保存 / 取消、更新 / 调序）
defineProps({
    id: { type: String, default: '' }
})
const emit = defineEmits(['click'])
</script>

<template>
    <div class="panel_btn" :id="id || undefined" @click="emit('click', $event)">
        <span class="set_quick_text"><slot /></span>
    </div>
</template>
