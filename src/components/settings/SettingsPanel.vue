<script setup>
// 设置面板外壳
import { ref, onMounted, nextTick } from 'vue'
import { useUiStore, PANEL } from '@/stores/ui'
import { useSettingsStore } from '@/stores/settings'
import PanelLayout from '@/components/panel/PanelLayout.vue'
import PanelTab from '@/components/settings/tabs/PanelTab.vue'
import SearchTab from '@/components/settings/tabs/SearchTab.vue'
import ShortcutTab from '@/components/settings/tabs/ShortcutTab.vue'
import WallpaperTab from '@/components/settings/tabs/WallpaperTab.vue'
import MoreTab from '@/components/settings/tabs/MoreTab.vue'
import AboutTab from '@/components/settings/tabs/AboutTab.vue'
import { useI18n } from 'vue-i18n'

const { t } = useI18n()

const uiStore = useUiStore()
const settings = useSettingsStore()

const activeTab = ref(0)
// 左侧导航区
const tabs = [
    { key: 0, name: t('@global:setting-panel'), id: 'set-panel-menu' },
    { key: 1, name: t('@global:setting-search'), id: '' },
    { key: 2, name: t('@global:setting-quick'), id: 'set-quick-menu' },
    { key: 3, name: t('@global:setting-wallpaper'), id: '' },
    { key: 4, name: t('@global:setting-more'), id: '' },
    { key: 5, name: t('@global:setting-about'), id: 'set-about-menu' }
]

onMounted(async () => {
    await nextTick()
    // 把已持久化的设置同步到 CSS 变量 / DOM
    settings.applyAll()
})
</script>

<template>
    <PanelLayout
        class="set"
        id="set"
        :class="{ active: uiStore.setActive, inactive: !uiStore.setActive }"
        :title="$t('@global:setting-set-more')"
        :tabs="tabs"
        item-class="mark-items"
        v-model:active-key="activeTab"
        :open="uiStore.setActive"
    >
        <PanelTab :class="{ selected: activeTab === 0 }" :settings="settings" />
        <SearchTab :class="{ selected: activeTab === 1 }" :settings="settings" />
        <ShortcutTab :class="{ selected: activeTab === 2 }" :settings="settings" />
        <WallpaperTab :class="{ selected: activeTab === 3 }" :settings-store="settings" />
        <MoreTab :class="{ selected: activeTab === 4 }" :settings="settings" />
        <AboutTab :class="{ selected: activeTab === 5 }" :settings="settings" />
    </PanelLayout>
</template>
