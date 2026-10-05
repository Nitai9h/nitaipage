<script setup>
// 插件详情弹窗
import { ref, onMounted, computed } from 'vue'
import iziToast from 'izitoast'
import {
    checkDependencies, checkAssociations, checkTranslates,
    installNpplication,
    parseDependencies, parseAssociations, parseTranslates
} from '@/core/npp/npplication.js'
import { hideToastById } from '@/composables/useToast'
import { isOfficialUrl } from '@/core/npp/nodes.js'
import { cleanUrl } from '@/utils/dom'
import PanelInfoBlock from '@/components/panel/special/PanelInfoBlock.vue'
import PanelFold from '@/components/panel/items/PanelFold.vue'

const props = defineProps({
    plugin: { type: Object, required: true }
})
const emit = defineEmits(['close', 'open'])

const loading = ref(true)
const depResult = ref({ details: {} })
const assocResult = ref({ details: {} })
const transResult = ref({ details: {} })

const screenshots = computed(() => {
    const raw = props.plugin.screen || props.plugin.screenshots || []
    const arr = Array.isArray(raw) ? raw : [raw]
    return arr
        .flatMap(shot => shot.toString().split(',').map(url => url.trim().replace(/[\[\]]/g, '')))
        .map(url => url.trim())
        .filter(url => url)
})

const canInstall = computed(() => depResult.value.status)

// 官方源域名由节点表下发
const isFromOfficialSource = computed(() => isOfficialUrl(props.plugin.source))

function statusClass(status, type) {
    if (status === 'satisfied') return 'satisfied'
    if (status === 'version_mismatch') return type === 'dependencies' ? 'warning' : 'info'
    if (status === 'not_installed') return type === 'dependencies' ? 'error' : 'info'
    return 'failed'
}

function buildRelationList(details, type) {
    const detailsObj = details || {}
    const hasAnyInstalled = type === 'translates'
        && Object.values(detailsObj).some(d => d.status === 'satisfied')

    return Object.entries(detailsObj).map(([url, d]) => {
        const isInstalled = d.status === 'satisfied'
        const isDisabled = type === 'translates' && hasAnyInstalled && !isInstalled
        return {
            url,
            metadata: d.metadata || {},
            status: d.status,
            message: d.message,
            requiredVersion: d.requiredVersion,
            installedVersion: d.installedVersion,
            cls: statusClass(d.status, type),
            isDisabled
        }
    })
}

const depList = computed(() => buildRelationList(depResult.value.details, 'dependencies'))
const assocList = computed(() => buildRelationList(assocResult.value.details, 'associations'))
const transList = computed(() => buildRelationList(transResult.value.details, 'translates'))

const hasDepContent = computed(() => depList.value.length > 0)
const hasAssocContent = computed(() => assocList.value.length > 0)
const hasTransContent = computed(() => transList.value.length > 0)
const hasScreenshotContent = computed(() => screenshots.value.length > 0)

const showTransHint = computed(() =>
    hasTransContent.value && transList.value.some(i => i.status === 'satisfied'))

function openRelation(item) {
    if (item.isDisabled) return
    emit('open', { ...(item.metadata || {}), url: item.url, source: props.plugin.source || '' })
}

async function install() {
    iziToast.show({ id: 'installToast', message: '@npplication:installing' })
    await installNpplication(props.plugin.url)
    hideToastById('#installToast')

    if (localStorage.getItem('autoInstallTranslation') !== 'off') {
        const targetLang = localStorage.getItem('autoInstallTranslationGlobal') || 'zh-CN'
        if (transResult.value && transResult.value.details) {
            for (const [, details] of Object.entries(transResult.value.details)) {
                if (details.metadata && details.metadata.translates) {
                    if (details.metadata.translates === targetLang && details.status !== 'satisfied') {
                        await installNpplication(details.metadata.updateUrl || details.metadata.id)
                        iziToast.show({ message: '@npplication:translate-install-success-desc', timeout: 3000 })
                        break
                    }
                }
            }
        }
    }
}

onMounted(async () => {
    try {
        const deps = parseDependencies(props.plugin.dependencies || '')
        const assoc = parseAssociations(props.plugin.associations || '')
        const trans = parseTranslates(props.plugin.translates || '')

        const [dRes, aRes, tRes] = await Promise.all([
            checkDependencies(deps),
            checkAssociations(assoc),
            checkTranslates(trans)
        ])
        depResult.value = dRes
        assocResult.value = aRes
        transResult.value = tRes
    } catch (error) {
        console.error('加载插件详情失败:', error)
        iziToast.show({ timeout: 3000, message: '@npplication:load-plugin-error' })
        emit('close')
    } finally {
        loading.value = false
    }
})
</script>

<template>
    <div class="dialog-container">
        <div class="details-dialog">
            <div class="dialog-content">
                <PanelInfoBlock
                    :icon="cleanUrl(plugin.icon)"
                    :name="plugin.name || '@npplication:no-name'"
                    :version="plugin.version || '@npplication:no-version'"
                    :author="plugin.author || '@npplication:no-author'"
                    :nid="plugin.id || '@npplication:no-nid'"
                >
                    <div class="detail-source">
                        <p>@npplication:source:
                            <template v-if="isFromOfficialSource">
                                <p class="sourceSign">@npplication:official-source</p>
                                <p class="sourceNonCritical" translate="none">[{{ plugin.source }}]</p>
                            </template>
                            <template v-else>
                                <span translate="none">{{ plugin.source }}</span>
                            </template>
                        </p>
                    </div>
                </PanelInfoBlock>

                <div class="plugin-detail-body">
                    <!-- 描述 -->
                    <PanelFold class="detail-section" title="@npplication:description" :open="true">
                        <p translate="none">{{ plugin.description }}</p>
                    </PanelFold>

                    <!-- 依赖 -->
                    <PanelFold class="detail-section" v-if="hasDepContent"
                        title="@npplication:dependencies" :open="true">
                        <div class="plugin-relation-list">
                            <div v-for="item in depList" :key="item.url"
                                class="plugin-item plugin-relation-item" :class="[item.cls, { 'data-disabled': item.isDisabled }]"
                                :data-url="item.url" :data-disabled="item.isDisabled ? 'true' : null"
                                @click="openRelation(item)">
                                <img :src="item.metadata.icon || 'https://nitai-images.pages.dev/nitaiPage/defeatNpp.svg'"
                                    :alt="item.metadata.name || '@npplication:dependencies'" class="plugin-icon">
                                <div class="plugin-info">
                                    <strong translate="none">{{ item.metadata.name || item.url }}</strong>
                                    <div class="detail-source">
                                        <p>@npplication:required-version: <span translate="none">{{ item.requiredVersion || 'Latest' }}</span>
                                            <span translate="none" v-if="item.installedVersion">
                                                <p class="sourceNonCritical">|</p>
                                                <p>@npplication:installed: <span translate="none">{{ item.installedVersion }}</span></p>
                                            </span>
                                        </p>
                                    </div>
                                    <p class="status" v-if="item.status !== 'satisfied'">{{ item.message }}</p>
                                </div>
                            </div>
                        </div>
                    </PanelFold>

                    <!-- 关联 -->
                    <PanelFold class="detail-section" v-if="hasAssocContent"
                        title="@npplication:associations" :open="true">
                        <div class="plugin-relation-list">
                            <div v-for="item in assocList" :key="item.url"
                                class="plugin-item plugin-relation-item" :class="[item.cls, { 'data-disabled': item.isDisabled }]"
                                :data-url="item.url" :data-disabled="item.isDisabled ? 'true' : null"
                                @click="openRelation(item)">
                                <img :src="item.metadata.icon || 'https://nitai-images.pages.dev/nitaiPage/defeatNpp.svg'"
                                    :alt="item.metadata.name || '@npplication:associations'" class="plugin-icon">
                                <div class="plugin-info">
                                    <strong translate="none">{{ item.metadata.name || item.url }}</strong>
                                    <div class="detail-source">
                                        <p>@npplication:recommended-version: <span translate="none">{{ item.requiredVersion || 'Latest' }}</span></p>
                                    </div>
                                    <p class="status" v-if="item.status !== 'satisfied'">{{ item.message }}</p>
                                </div>
                            </div>
                        </div>
                    </PanelFold>

                    <!-- 翻译 -->
                    <PanelFold class="detail-section" v-if="hasTransContent"
                        title="@npplication:translates" :open="false">
                        <div class="translate-installed-hint" v-if="showTransHint">
                            <i class="iconfont icon-wrong"></i>@npplication:installed-translate-desc
                        </div>
                        <div class="plugin-relation-list">
                            <div v-for="item in transList" :key="item.url"
                                class="plugin-item plugin-relation-item" :class="[item.cls, { 'data-disabled': item.isDisabled }]"
                                    :data-url="item.url" :data-disabled="item.isDisabled ? 'true' : null"
                                    @click="openRelation(item)">
                                <img :src="item.metadata.icon || 'https://nitai-images.pages.dev/nitaiPage/defeatNpp.svg'"
                                    :alt="item.metadata.name || '@npplication:translates'" class="plugin-icon">
                                <div class="plugin-info">
                                    <strong translate="none">{{ item.metadata.name || item.url }}</strong>
                                    <p translate="none" v-if="item.metadata.translates">{{ item.metadata.translates }}</p>
                                    <div class="detail-source">
                                        <p v-if="item.installedVersion">@npplication:installed-version: <span translate="none">{{ item.installedVersion }}</span></p>
                                        <p v-else>@npplication:required-version: <span translate="none">{{ item.requiredVersion || 'Latest' }}</span></p>
                                    </div>
                                    <p class="status" v-if="item.status !== 'satisfied'">{{ item.message }}</p>
                                    <div class="translate-installed-text" v-if="item.status === 'satisfied'">@npplication:installed</div>
                                </div>
                            </div>
                        </div>
                    </PanelFold>

                    <!-- 截图 -->
                    <PanelFold class="detail-section" v-if="hasScreenshotContent"
                            title="@npplication:screenshots" :open="false">
                        <div class="screenshots" translate="none">
                            <a v-for="(shot, i) in screenshots" :key="i"
                                :href="shot.startsWith('http') ? shot : cleanUrl(shot)" target="_blank">
                                <img :src="shot.startsWith('http') ? shot : cleanUrl(shot)" alt="截图" class="screenshot-img">
                            </a>
                        </div>
                    </PanelFold>
                </div>
            </div>

            <div class="dialog-btn">
                <div class="dialog-cancel" @click="emit('close')">@npplication:return</div>
                <div v-if="canInstall" class="dialog-install" :data-plugin-url="cleanUrl(plugin.url)" @click="install">
                    @npplication:install
                </div>
            </div>

            <div class="details-loading-overlay" v-if="loading">
                <div class="details-loading-spinner"></div>
                <div class="details-loading-text">@npplication:loading-text</div>
            </div>
        </div>
    </div>
</template>
