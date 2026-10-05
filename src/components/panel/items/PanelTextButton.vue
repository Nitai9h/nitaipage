<script setup>
// 带文字按钮
// 左侧标题（可带描述），右侧是一个带文字的按钮
// plain —— 单行：左标题 + 右按钮（e.g.插件设置入口）
// card  —— 卡片：标题 + 描述在上，按钮在下（e.g.数据备份的导入 / 导出 / 重置）
defineProps({
    title: { type: String, default: '' },
    description: { type: String, default: '' },
    // 按钮上的文字
    text: { type: String, default: '' },
    id: { type: String, default: '' },
    variant: { type: String, default: 'plain' }
})

const emit = defineEmits(['click'])
</script>

<template>
    <div v-if="variant === 'plain'" class="entry-pluginSettings set_tip">
        <span class="set_text">{{ title }}</span>
        <div class="panel_btn_text" :id="id || undefined" @click="emit('click', $event)">{{ text }}</div>
    </div>

    <div v-else class="data_backup_tip set_tip">
        <div>
            <span class="set_text"><big>{{ title }}&nbsp;</big><br></span>
            <span v-if="description" class="set_text set_text_desc"><small>{{ description }}</small></span>
        </div>
        <div class="but-ordinary" :id="id || undefined" @click="emit('click', $event)">{{ text }}</div>
    </div>
</template>
