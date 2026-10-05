<script setup>
// 大按钮
// 图标 + 标题 + 描述 的大按钮（e.g.插件商店中插件分类内的插件）
defineProps({
    title: { type: String, default: '' },
    description: { type: String, default: '' },
    // font icon class
    iconClass: { type: String, default: '' },
    // icon src（与 icon class 二选一）
    iconSrc: { type: String, default: '' }
})

const emit = defineEmits(['click'])
</script>

<template>
    <div class="npp_tip_new switch-item tip_new_both" @click="emit('click', $event)">
        <div class="panel_big_main">
            <div v-if="iconClass || iconSrc" class="panel_big_icon">
                <img v-if="iconSrc" :src="iconSrc" alt="">
                <i v-else :class="iconClass"></i>
            </div>
            <div>
                <span class="set_text"><big>{{ title }} &nbsp;</big><br></span>
                <span v-if="description" class="set_text set_text_desc"><small>{{ description }}</small></span>
            </div>
        </div>
        <slot />
    </div>
</template>
