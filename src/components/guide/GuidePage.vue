<script setup>
// 老用户：visited = true / 1 
// 注意：翻译工作已由 页面初始化 负责转到由 guide 页负责，不再产生 visited = 1
import { ref, onMounted } from 'vue'
import { KEY, VISITED_VERSION } from '@/utils/storage'
import { VERSION } from '@/core/version'
import { pruneUnsupportedData } from '@/utils/backupSchema'
import { forceUpdateAllPlugins } from '@/core/npp/npplication.js'

const confettiRef = ref(null)
const confettiList = ref([])


const currentYear = new Date().getFullYear()

// 流程进行中避免重复点击
const entering = ref(false)

onMounted(() => {
    createConfetti()
})

// 彩带
function createConfetti() {
    const list = []
    for (let i = 0; i < 200; i++) {
        list.push({
            left: Math.random() * 100 + '%',
            animationDelay: Math.random() * 5 + 's',
            animationDuration: Math.random() * 3 + 3 + 's'
        })
    }
    confettiList.value = list
    if (confettiRef.value) confettiRef.value.classList.add('active')
    // 5 秒后移除激活状态
    setTimeout(() => {
        if (confettiRef.value) confettiRef.value.classList.remove('active')
    }, 5000)
}

// 进入起始页
// 移除不支持的配置项 → 强制更新全部插件 → 回首页
async function enterStartPage() {
    if (entering.value) return
    entering.value = true

    try {
        const removed = await pruneUnsupportedData()
        if (removed.localStorage.length || removed.databases.length || removed.pluginSources.length) {
            console.log('[guide] 已移除不支持的配置项：', removed)
        }
    } catch (error) {
        // 清理失败不阻塞进入
        console.error('[guide] 移除不支持的配置项失败:', error)
    }

    try {
        const { updated, failed } = await forceUpdateAllPlugins()
        if (updated.length || failed.length) {
            console.log('[guide] 插件强制更新完成，已更新:', updated, failed.length ? '失败: ' + failed.join(', ') : '')
        }
    } catch (error) {
        // 更新失败不阻塞进入
        console.error('[guide] 强制更新插件失败:', error)
    }

    localStorage.setItem(KEY.visited, VISITED_VERSION)

    setTimeout(() => {
        window.location.href = './'
    }, 1000)
}
</script>

<template>
    <div class="page-container">
        <div class="confetti-container" id="confetti-container" ref="confettiRef">
            <div
                v-for="(c, i) in confettiList"
                :key="i"
                class="confetti"
                :style="{ left: c.left, animationDelay: c.animationDelay, animationDuration: c.animationDuration }"
            ></div>
        </div>

        <section class="page-section active" id="cover">
            <div class="cover-container">
                <div class="cover-logo">
                    <span class="emoji">✨</span>
                </div>
                <h1 class="cover-title">
                    <p class="cover-subtitle">{{ $t('@global:guide-hello') }}</p>
                    <p class="cover-subtitle">{{ $t('@global:guide-welcome') }}</p>
                </h1>
                <h1 class="cover-title">NitaiPage {{ VERSION }}
                    <br>
                    <button class="btn" id="continueButton" :disabled="entering"
                            :style="entering ? { opacity: 0.7, cursor: 'wait' } : null"
                            @click="enterStartPage">
                        <span v-if="entering">{{ $t('@global:check-update-message') }}</span>
                        <span v-else>
                            @global:guide-enter<br>{{ $t('@global:guide-enter-subtitle') }}
                        </span>
                    </button>
                </h1>
            </div>
        </section>

        <footer class="footer">
            <p>Copyright &copy; {{ currentYear }} Nitai.<br>
                Released under the Apache-2.0 License.
            </p>
        </footer>
    </div>
</template>
