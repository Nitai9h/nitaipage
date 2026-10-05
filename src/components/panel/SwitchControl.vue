<script setup>
// 开关
defineProps({
    modelValue: { type: Boolean, default: false },
    id: { type: String, default: '' }
})
const emit = defineEmits(['update:modelValue'])
</script>

<template>
    <div
        class="switch"
        :id="id || undefined"
        :class="{ on: modelValue }"
        @click="emit('update:modelValue', !modelValue)"
    ></div>
</template>
