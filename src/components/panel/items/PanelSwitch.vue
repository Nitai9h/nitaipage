<script setup>
// 带文字的开关
// 左侧标题 + 描述，右侧开关
import { computed } from 'vue'
import SwitchControl from '../SwitchControl.vue'

const props = defineProps({
    title: { type: String, default: '' },
    // 单行字符串，多行数组
    description: { type: [String, Array], default: '' },
    id: { type: String, default: '' },
    modelValue: { type: Boolean, default: false },
    // 是否为高级设置项
    advanced: { type: Boolean, default: false }
})

const emit = defineEmits(['update:modelValue'])

const descLines = computed(() =>
    (Array.isArray(props.description) ? props.description : [props.description]).filter(Boolean)
)
</script>

<template>
    <div class="switch-item tip_new_both" :class="{ advancedSetting: advanced }">
        <div>
            <span class="set_text"><big>{{ title }} &nbsp;</big><br></span>
            <span v-for="(line, i) in descLines" :key="i" class="set_text set_text_desc"><small>{{ line }}</small><br
                v-if="i < descLines.length - 1"></span>
        </div>
        <SwitchControl :id="id" :model-value="modelValue"
            @update:model-value="emit('update:modelValue', $event)" />
    </div>
</template>
