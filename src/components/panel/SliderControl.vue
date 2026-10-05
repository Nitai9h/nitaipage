<script setup>
// 滑块
import { ref, computed } from 'vue'

const props = defineProps({
    modelValue: { type: Number, default: 0 },
    id: { type: String, default: '' },
    min: { type: Number, default: 0 },
    max: { type: Number, default: 100 }
})
const emit = defineEmits(['update:modelValue'])

// 数值气泡
const showValue = ref(false)

const progress = computed(() => {
    const span = props.max - props.min
    if (span <= 0) return 0
    return ((props.modelValue - props.min) / span) * 100
})

function onInput(e) {
    emit('update:modelValue', Number(e.target.value))
}
</script>

<template>
    <div class="slider-container">
        <input
            type="range"
            class="slider"
            :min="min"
            :max="max"
            :value="modelValue"
            :id="id"
            :style="{ '--slider-progress': progress + '%' }"
            @input="onInput"
            @mousedown="showValue = true"
            @mouseup="showValue = false"
            @mouseleave="showValue = false"
            @touchstart="showValue = true"
            @touchend="showValue = false"
            @touchcancel="showValue = false"
        />
        <span class="slider-value" :class="{ show: showValue }" :data-slider="id">{{ modelValue }}</span>
    </div>
</template>
