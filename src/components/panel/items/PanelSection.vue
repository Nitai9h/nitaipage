<script setup>
// 不同设置项之间的分区
// 标题 + 内容
defineProps({
    title: { type: String, default: '' }
})
</script>

<template>
    <div class="tip_new_ac expanded">
        <div>
            <span class="set_text"><big>{{ title }} &nbsp;</big></span>
        </div>
    </div>
    <div class="tip_new_setting expanded">
        <slot />
    </div>
</template>
