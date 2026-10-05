<script setup>
// 页脚
import { computed } from 'vue'
import { VERSION, COMMIT } from '@/core/version'
import { KEY, LS } from '@/utils/storage'

const footerVisible = computed(() => LS.bool(KEY.footerDisplay, true))
</script>

<template>
    <div class="foot" :style="{ opacity: footerVisible ? 1 : 0 }">
        <div class="power">
            @global:nitaipage {{ VERSION }} <div v-if="COMMIT" class="commit">({{ COMMIT }})</div>
        </div>
    </div>
</template>
