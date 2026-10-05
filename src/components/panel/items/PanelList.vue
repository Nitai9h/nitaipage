<script setup>
// 列表
// 序号 + 名称 + 按钮（e.g.捷径、搜取页的表内项）
defineProps({
    // [{ key, name, icon? }]
    items: { type: Array, default: () => [] }
})
</script>

<template>
    <div class="panel_list">
        <div class="panel_list_table">
            <div v-for="item in items" :key="item.key" class="panel_list_row">
                <div class="panel_list_num">
                    <slot name="num" :item="item">
                        <i v-if="item.icon" :class="item.icon"></i>
                        <template v-else>{{ item.key }}</template>
                    </slot>
                </div>
                <div class="panel_list_name" translate="none">{{ item.name }}</div>
                <div class="panel_list_actions">
                    <slot name="actions" :item="item" />
                </div>
            </div>
        </div>
    </div>
</template>
