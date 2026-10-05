<script setup>
// 面板：Top 栏（折叠按钮 + 标题）+ 左侧导航 + 右侧内容
// 设置 / 插件设置 / 商店共用
import { ref } from 'vue'
import TabScroller from './TabScroller.vue'

const props = defineProps({
    // Top 栏标题
    title: { type: String, default: '' },
    // 左侧导航：[{ key, name, id?, translate? }]
    tabs: { type: Array, default: () => [] },
    // 选中状态：设置、插件设置：actives，商店：active
    activeClass: { type: String, default: 'actives' },
    // 左侧导航项额外 class（设置面板要带 mark-items）
    itemClass: { type: String, default: '' },
    // 左侧滚动容器 class 与 id
    scrollerClass: { type: String, default: 'tabs' },
    scrollerId: { type: String, default: '' },
    // 右侧内容容器 div class
    contentClass: { type: String, default: 'contents productss' },
})

const activeKey = defineModel('activeKey', { default: 0 })

const menuCollapsed = ref(false)

</script>

<template>
    <div>
        <div class="panel-header">
            <button class="panel-menu" type="button" @click="menuCollapsed = !menuCollapsed">
                <span class="iconfont" :class="menuCollapsed ? 'icon-round-right' : 'icon-round-left'"></span>
            </button>
            <span class="panel-title">{{ title }}</span>
        </div>

        <div class="panel-body" :class="{ 'menu-collapsed': menuCollapsed }">
            <TabScroller :class="scrollerClass" :id="scrollerId || undefined">
                <div
                    v-for="tab in tabs"
                    :key="tab.key"
                    class="tab-items"
                    :class="[itemClass, { [activeClass]: activeKey === tab.key }]"
                    :id="tab.id || undefined"
                    :data-value="tab.key"
                    @click="activeKey = tab.key"
                >
                    <span class="tab_text" :translate="tab.translate === false ? 'none' : undefined">{{ tab.name }}</span>
                </div>
            </TabScroller>

            <div :class="contentClass">
                <slot />
            </div>
        </div>
    </div>
</template>
