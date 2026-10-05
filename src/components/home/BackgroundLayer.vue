<script setup>
// .bg-all > (#bg / #bg-video / .cover)
import { onMounted } from 'vue'
import { useWallpaper } from '@/composables/useWallpaper'

const { bgHasError, bgErrorEnabled, initWallpaerLoader } = useWallpaper()

// #bg 加载失败
// 仅当 error 处理启用时标记 error 类
function onBgError() {
    if (!bgErrorEnabled.value) return
    bgHasError.value = true
}

onMounted(() => {
    // 首屏壁纸加载
    // 内部会广播 bgImgLoadinged 供 themeColor 取色
    initWallpaerLoader()
})
</script>

<template>
    <div class="bg-all">
        <img id="bg" :class="{ error: bgHasError }" @error="onBgError" alt="" />
        <video id="bg-video" loop muted autoplay playsinline>{{ $t('@global:bg-video') }}</video>
        <div class="cover"></div>
    </div>
</template>
