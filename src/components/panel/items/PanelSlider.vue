<script setup>
// 带文字的滑块
// 左侧标题 + 描述，右侧滑块
import { computed } from 'vue'
import SliderControl from '../SliderControl.vue'

const props = defineProps({
    title: { type: String, default: '' },
    // 单行字符串，多行数组
    description: { type: [String, Array], default: '' },
    id: { type: String, default: '' },
    modelValue: { type: Number, default: 0 },
    min: { type: Number, default: 0 },
    max: { type: Number, default: 100 },
    // 是否为高级设置
    advanced: { type: Boolean, default: false }
})

const emit = defineEmits(['update:modelValue'])

const descLines = computed(() =>
    (Array.isArray(props.description) ? props.description : [props.description]).filter(Boolean)
)
</script>

<template>
    <div class="tip_new_both tip_new_slider" :class="{ advancedSetting: advanced }">
        <div>
            <span class="set_text"><big>{{ title }} &nbsp;</big><br></span>
            <span v-for="(line, i) in descLines" :key="i" class="set_text set_text_desc"><small>{{ line }}</small><br
                v-if="i < descLines.length - 1"></span>
        </div>
        <SliderControl :id="id" :model-value="modelValue" :min="min" :max="max"
            @update:model-value="emit('update:modelValue', $event)" />
    </div>
</template>
