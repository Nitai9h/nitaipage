<script setup>
// 商店面板外壳
import { ref, onMounted, computed, nextTick, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import iziToast from 'izitoast'
import Sortable from 'sortablejs'
import {
    loadStoreData, getPluginsList, savePluginsList,
    checkUpdates, showRefreshDialog
} from '@/core/npp/npplication.js'
import { useUiStore } from '@/stores/ui'
import PanelLayout from '@/components/panel/PanelLayout.vue'
import PanelButton from '@/components/panel/items/PanelButton.vue'
import StorePluginList from './StorePluginList.vue'
import PluginManagePage from './PluginManagePage.vue'
import PluginDetailDialog from './PluginDetailDialog.vue'

const { t } = useI18n()
const uiStore = useUiStore()

const storeData = ref({ category: {} })
const categoryTabs = ref([])
const activeTab = ref('manage')
const currentPlugins = ref([])

const detailPlugin = ref(null)
const detailOpen = ref(false)

// 调序
const orderForm = ref(false)
const orderPlugins = ref([])
const orderListRef = ref(null)
let sortable = null

const isManage = computed(() => activeTab.value === 'manage')

// 左侧导航
const tabs = computed(() => [
    { key: 'manage', name: t('@global:store-manage'), id: 'storeManage' },
    ...categoryTabs.value
])

watch(activeTab, (key) => {
    closeDetail()
    closeOrder()
    if (key !== 'manage') {
        currentPlugins.value = storeData.value[key] || []
    }
})

async function load() {
    const data = await loadStoreData()
    storeData.value = data || { category: {} }
    categoryTabs.value = Object.entries(storeData.value.category || {})
        .map(([key, name]) => ({ key, name }))
}

function openDetail(plugin) {
    closeOrder()
    detailPlugin.value = plugin
    detailOpen.value = true
}
function closeDetail() {
    detailOpen.value = false
    detailPlugin.value = null
}

function checkUpdateAll() {
    checkUpdates('all')
}

// 打开插件排序表单
// 获取并过滤已安装插件（排除 i18n）
// 渲染排序列表视图
// 等待 DOM 更新后初始化 Sortable 拖拽实例
async function openOrder() {
    const plugins = (await getPluginsList()).filter((p) => p.id !== 'i18n')
    if (plugins.length === 0) {
        iziToast.show({ timeout: 2000, message: '@npplication:no-configurable-plugins-desc' })
        return
    }
    orderPlugins.value = plugins
    orderForm.value = true

    await nextTick()
    if (!orderListRef.value) return
    sortable = new Sortable(orderListRef.value, {
        animation: 150, draggable: '.plugin-item', ghostClass: 'sortable-ghost',
        chosenClass: 'sortable-chosen', dragClass: 'sortable-drag', touchStartThreshold: 30,
        delay: 150, delayOnTouchOnly: true, scrollSpeed: 30, forceFallback: true
    })
}

function closeOrder() {
    if (sortable) {
        sortable.destroy()
        sortable = null
    }
    orderForm.value = false
    orderPlugins.value = []
}

// 按拖拽后的顺序写回插件列表
async function saveOrder() {
    if (!orderListRef.value) return
    const newOrder = [...orderListRef.value.querySelectorAll('.plugin-item')].map((el) => el.dataset.id)

    const updated = await getPluginsList()
    const map = Object.fromEntries(updated.map((p) => [p.id, p]))
    const ordered = newOrder.map((id) => map[id]).filter(Boolean)
    const remaining = updated.filter((p) => !newOrder.includes(p.id) && p.id !== 'i18n')
    const i18nPlugin = updated.find((p) => p.id === 'i18n')

    const final = [...ordered, ...remaining]
    if (i18nPlugin) final.push(i18nPlugin)

    await savePluginsList(final)
    closeOrder()
    showRefreshDialog()
}

onMounted(load)
</script>

<template>
    <PanelLayout
        id="storePage"
        :title="$t('@global:store')"
        :tabs="tabs"
        active-class="active"
        scroller-id="storeTabs"
        v-model:active-key="activeTab"
        :open="uiStore.storeActive"
    >
        <div class="mainConts" id="manageContent" :class="{ selected: isManage && !orderForm && !detailOpen }">
            <PluginManagePage :visible="isManage && !orderForm && !detailOpen" />
        </div>

        <div class="mainConts" id="storeContent" :class="{ selected: !isManage && !orderForm && !detailOpen }">
            <StorePluginList :plugins="currentPlugins" @open="openDetail" />
        </div>

        <!-- 插件详情 -->
        <div class="mainConts" :class="{ selected: detailOpen }">
            <PluginDetailDialog
                v-if="detailOpen"
                :key="detailPlugin && (detailPlugin.id || detailPlugin.url)"
                :plugin="detailPlugin"
                @close="closeDetail"
                @open="openDetail" />
        </div>

        <!-- 调序表单-->
        <div v-if="orderForm" class="store_order_content">
            <div class="plugin-list" ref="orderListRef">
                <div v-for="p in orderPlugins" :key="p.id" class="plugin-item" :data-id="p.id">
                    <div class="drag-handle"></div>
                    <div class="plugin-info">
                        <strong translate="none">{{ p.name }}</strong>
                        <p>NID: <span translate="none">{{ p.id }}</span></p>
                        <p>@npplication:version: <span translate="none">{{ p.version }}</span></p>
                    </div>
                </div>
            </div>
            <div class="from_items button">
                <PanelButton @click="saveOrder">@npplication:save</PanelButton>
                <PanelButton @click="closeOrder">@npplication:cancel</PanelButton>
            </div>
        </div>

        <div class="store-button" v-show="isManage && !orderForm && !detailOpen">
            <PanelButton @click="checkUpdateAll">{{ $t('@global:store-check-update') }}</PanelButton>
            <PanelButton @click="openOrder">{{ $t('@global:store-order-set') }}</PanelButton>
        </div>
    </PanelLayout>
</template>
