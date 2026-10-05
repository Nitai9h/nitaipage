<script setup>
// 行内图标按钮
// 列表每一行右侧的 40×40 按钮（e.g.捷径、搜取页的表内项右侧按钮）
defineProps({
    icon: { type: String, required: true },
    value: { type: [String, Number], default: '' },
    // 圆角位置：left / right / both / none
    radius: { type: String, default: 'none' }
})

const emit = defineEmits(['click'])
</script>

<template>
    <button type="button" class="panel_row_btn" :class="'radius-' + radius" :value="value"
            @click="emit('click', $event)">
        <span :class="icon"></span>
    </button>
</template>
