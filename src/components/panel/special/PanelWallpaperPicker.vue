<script setup>
// 按钮 + 壁纸列表
// 上方是壁纸类型按钮（#wallpaper），下方是壁纸预览 grid + 按钮 （#wallpaper-list-add）
defineProps({
    // 预览壁纸列表
    pictures: { type: Array, default: () => [] },
    // 是否显示随机壁纸列表（选中随机壁纸时才显示）
    show: { type: Boolean, default: true }
})

const emit = defineEmits(['add', 'delete'])
</script>

<template>
    <!-- 壁纸类型 -->
    <div id="wallpaper">
        <slot name="options" />
    </div>

    <div class="wallpaper-list-setting" :class="{ show }">
        <div class="setting-item">
            <div class="wallpaper-list-container">
                <div class="wallpaper-list-content">
                    <div class="wallpaper-list">
                        <div v-for="(pic, index) in pictures" :key="index" class="wallpaper-item">
                            <img :src="pic" :alt="''">
                            <button type="button" class="delete-btn" @click="emit('delete', index)">
                                <i class="iconfont icon-delete"></i>
                            </button>
                        </div>
                    </div>
                </div>
                <div class="wallpaper-list-add">
                    <button type="button" id="add-wallpaper-btn" @click="emit('add')">
                        <slot name="add-text" />
                    </button>
                </div>
            </div>
        </div>
    </div>
</template>
