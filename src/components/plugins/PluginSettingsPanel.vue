<script setup>
// 插件设置面板
import { ref, onMounted, nextTick, watch, computed } from 'vue'
import iziToast from 'izitoast'
import {
    getPluginsList
} from '@/core/npp/npplication.js'
import PanelLayout from '@/components/panel/PanelLayout.vue'
import PanelSwitch from '@/components/panel/items/PanelSwitch.vue'
import { useUiStore } from '@/stores/ui'
import { useI18n } from 'vue-i18n'

const { t } = useI18n()
// 核心插件的调用入口，coreNpp 是独立脚本，只能走 window.nppXxx
// 每次取用时再解析，不在 setup 顶层缓存
const nppTheme = () => globalThis.nppThemeColor || {}
const nppStyle = () => globalThis.nppCustomStyle || {}

const isWhiteThemeEnabled = () => nppTheme().isWhiteThemeEnabled?.()
const isDynamicThemeEnabled = () => nppTheme().isDynamicThemeEnabled?.()
const applyWhiteTheme = () => nppTheme().applyWhiteTheme?.()
const resetThemeColors = () => nppTheme().resetThemeColors?.()
const setThemeByImage = (url) => nppTheme().setThemeByImage?.(url)
const applyCustomCSS = (css) => nppStyle().applyCustomCSS?.(css)
const removeCustomCSS = () => nppStyle().removeCustomCSS?.()
const validateLocalStorageCSS = (css) => nppStyle().validateLocalStorageCSS?.(css)

const emit = defineEmits(['close'])

const uiStore = useUiStore()

const settingPlugins = ref([])
const activeTab = ref('returnToSettings')

// 左侧导航
// 首项是 返回，其余来自带设置项的插件
const tabs = computed(() => [
    { key: '__return__', id: 'close-pluginSettings', name: t('@global:plugin_settings-return') },
    ...settingPlugins.value.map((p) => ({ key: p.id, name: p.name, translate: false }))
])

const autoInstallTranslationOn = ref(localStorage.getItem('autoInstallTranslation') !== 'off')
const whiteThemeOn = ref(false)
const dynamicThemeOn = ref(false)
const advancedOn = ref(false)
const customCSS = ref('')

// 读取 带设置项 的插件重建 tab 列表（每次打开都重读）
async function loadSettingPlugins() {
    const plugins = await getPluginsList()
    settingPlugins.value = plugins.filter((p) => p.setting === 'true')

    // activeTab 只在 当前选中的插件已经不在列表里 时才重新确定
    // returnToSettings 用于关闭面板
    if (!settingPlugins.value.some((p) => p.id === activeTab.value)) {
        activeTab.value = settingPlugins.value.length > 0
            ? settingPlugins.value[0].id
            : 'returnToSettings'
    }
}

// 不清理 coreNpp 的设置项
const BUILTIN_SETTING_IDS = ['themeColor', 'advancedSettings', 'customStyle']

// 清理插件上一轮挂载的设置项
function clearThirdPartySettings() {
    document.querySelectorAll('.pluginMainConts').forEach((el) => {
        if (BUILTIN_SETTING_IDS.includes(el.dataset.value)) return
        el.innerHTML = ''
    })
}

// 挂载事件（面板每次打开都要重新派发）
async function dispatchSettingsReady() {
    await nextTick()
    clearThirdPartySettings()
    document.dispatchEvent(new CustomEvent('pluginSettingsTemplateReady'))
}

onMounted(async () => {
    await loadSettingPlugins()

    whiteThemeOn.value = isWhiteThemeEnabled()
    dynamicThemeOn.value = isDynamicThemeEnabled()
    advancedOn.value = localStorage.getItem('advancedSettingEnabled') === 'on'

    const savedCSS = localStorage.getItem('customCSS')
    const validated = validateLocalStorageCSS(savedCSS)
    if (validated) customCSS.value = savedCSS || ''

    await dispatchSettingsReady()
})

// 面板每次显示时重读插件列表并重新派发，加载插件的设置
watch(() => uiStore.pluginSetActive, async (on) => {
    if (!on) return
    await loadSettingPlugins()
    await dispatchSettingsReady()
})

function selectTab(value) {
    if (value === 'returnToSettings') {
        emit('close')
        return
    }
    activeTab.value = value
}

// 点击 返回 时 activeKey 变成 '__return__'
watch(activeTab, (val) => {
    if (val === '__return__') selectTab('returnToSettings')
})

// 关闭前先确认
function toggleAutoInstallTranslation() {
    if (!autoInstallTranslationOn.value) {
        autoInstallTranslationOn.value = true
        localStorage.setItem('autoInstallTranslation', 'on')
        return
    }

    iziToast.show({
        timeout: 8000,
        message: '@i18n:setting-auto-install-translation-plugin-warn',
        buttons: [
            ['<button>@global:toast-ok</button>', function (instance, toastEl) {
                instance.hide({ transitionOut: 'fadeOutUp' }, toastEl, 'buttonName')
                autoInstallTranslationOn.value = false
                localStorage.setItem('autoInstallTranslation', 'off')
            }, true],
            ['<button>@global:toast-cancel</button>', function (instance, toastEl) {
                instance.hide({ transitionOut: 'fadeOutUp' }, toastEl, 'buttonName')
            }]
        ]
    })
}

function toggleWhiteTheme() {
    whiteThemeOn.value = !whiteThemeOn.value
    localStorage.setItem('whiteTheme', whiteThemeOn.value ? 'on' : 'off')
    if (whiteThemeOn.value) {
        applyWhiteTheme()
    } else {
        resetThemeColors()
    }
}

function toggleDynamicTheme() {
    dynamicThemeOn.value = !dynamicThemeOn.value
    localStorage.setItem('dynamicTheme', dynamicThemeOn.value ? 'on' : 'off')
    if (dynamicThemeOn.value) {
        whiteThemeOn.value = false
        localStorage.setItem('whiteTheme', 'off')
        resetThemeColors()
        const bgImage = document.getElementById('bg')
        if (bgImage && bgImage.src) {
            const imgUrl = sessionStorage.getItem('bgImageFinalURL') || bgImage.src
            setThemeByImage(imgUrl)
        }
    } else {
        resetThemeColors()
    }
}

function toggleAdvanced() {
    advancedOn.value = !advancedOn.value
    localStorage.setItem('advancedSettingEnabled', advancedOn.value ? 'on' : 'off')
    iziToast.show({
        timeout: 4000,
        message: '@advancedSettings:setting-advanced-switch-success',
        buttons: [
            ['<button class="refresh-btn">@global:toast-refresh</button>', function (instance, toast) {
                instance.hide({ transitionOut: 'flipOutX' }, toast, 'confirm')
                window.location.reload(true)
            }, true],
            ['<button class="later-btn">@global:toast-later</button>', function (instance, toast) {
                instance.hide({ transitionOut: 'flipOutX' }, toast, 'cancel')
            }]
        ]
    })
}

function saveCustomStyle() {
    localStorage.setItem('customCSS', customCSS.value)
    iziToast.show({ message: t('@global:setting-save-success'), timeout: 2000 })
    applyCustomCSS(customCSS.value)
}

function resetCustomStyle() {
    customCSS.value = ''
    localStorage.removeItem('customCSS')
    iziToast.show({ message: '@customStyle:setting-custom-css-style-reset-success', timeout: 2000 })
    removeCustomCSS()
}
</script>

<template>
    <PanelLayout
        class="plugin_set"
        id="plugin_set"
        :title="$t('@global:setting-set-more')"
        :tabs="tabs"
        v-model:active-key="activeTab"
        :open="uiStore.pluginSetActive"
    >
        <div class="mainConts" :class="{ selected: activeTab === 'returnToSettings' }"
            data-value="returnToSettings" id="noPluginSetting">
            @global:plugin_settings-no-plugin
        </div>

        <div v-for="p in settingPlugins" :key="p.id"
            class="mainConts pluginMainConts" :class="{ selected: activeTab === p.id }"
            :data-value="p.id">

            <!-- themeColor 设置 -->
            <div v-if="p.id === 'themeColor'" id="themeColor_dytheme" class="set_tip set_tip_new">
                <PanelSwitch
                    id="togglewhitetheme"
                    :model-value="whiteThemeOn"
                    @update:model-value="toggleWhiteTheme"
                    title="@themeColor:setting-white-theme"
                    description="@themeColor:setting-white-theme-desc"
                />
                <PanelSwitch
                    id="toggledytheme"
                    :model-value="dynamicThemeOn"
                    @update:model-value="toggleDynamicTheme"
                    title="@themeColor:setting-dynamic-theme"
                    description="@themeColor:setting-dynamic-theme-desc"
                />
            </div>

            <!-- advancedSettings 设置 -->
            <div v-else-if="p.id === 'advancedSettings'" class="set_tip">
                <PanelSwitch
                    id="toggleAdvancedSetting"
                    :model-value="advancedOn"
                    @update:model-value="toggleAdvanced"
                    title="@advancedSettings:setting-advanced-switch"
                    description="@advancedSettings:setting-advanced-switch-desc"
                />
                <PanelSwitch
                    id="toggleAutoInstallTranslation"
                    :model-value="autoInstallTranslationOn"
                    @update:model-value="toggleAutoInstallTranslation"
                    title="@i18n:setting-auto-install-translation-plugin"
                    :description="[
                        '@i18n:setting-auto-install-translation-plugin-desc',
                        '@i18n:setting-auto-install-translation-plugin-lang'
                    ]"
                />
            </div>

            <!-- customStyle 设置 -->
            <div v-else-if="p.id === 'customStyle'" id="customStyle_setting" class="set_tip set_tip_new">
                <div class="customStyle-container">
                    <div class="set_tip">
                        <i class="iconfont icon-act" style="font-size: 32px;"></i>
                        <span class="set_text">
                            @customStyle:setting-custom-style-warning1
                            <span class="unAdvancedSetting">@customStyle:setting-custom-style-warning2</span>
                        </span>
                    </div>
                    <div class="advancedSetting">
                        <span class="set_text"><big>@customStyle:setting-custom-css-style-title &nbsp;</big><br></span>
                        <span class="set_text set_text_desc"><small>@customStyle:setting-custom-css-style-desc</small></span>
                        <textarea id="customCSS" class="customStyle-textarea"
                                placeholder="@customStyle:setting-custom-css-style-placeholder"
                                v-model="customCSS"></textarea>
                    </div>
                    <div class="customStyle-buttons advancedSetting">
                        <button id="resetCustomStyle" class="customStyle-button"
                                @click="resetCustomStyle">@customStyle:setting-custom-css-style-reset</button>
                        <button id="saveCustomStyle" class="customStyle-button"
                                @click="saveCustomStyle">@customStyle:setting-custom-css-style-save</button>
                    </div>
                </div>
            </div>

            <!-- 安装的插件 -->
        </div>
    </PanelLayout>
</template>

<style>
    .i18n-switch-container {
        display: flex;
        flex-direction: row;
        flex-wrap: nowrap;
        justify-content: space-between;
        align-items: center;
    }

    .themeColor_switch-container {
        display: flex;
        flex-direction: row;
        flex-wrap: nowrap;
        justify-content: space-between;
        align-items: center;
    }

    .advancedSetting_switch-container {
        display: flex;
        flex-direction: row;
        flex-wrap: nowrap;
        justify-content: space-between;
        align-items: center;
    }

    .customStyle-container > .set_tip {
        flex-direction: row;
        align-items: center;
        gap: 5px;
        margin: 0px;
        background-color: unset;
        padding: 0px;
    }

    #customStyle_setting {
        width: -webkit-fill-available;
        width: -moz-available;
        max-height: -webkit-fill-available;
        max-height: -moz-available;
    }

    .customStyle-container {
        display: flex;
        flex-direction: column;
        gap: 15px;
        width: 100%;
        overflow-y: auto;
        justify-content: space-between;
        height: 100%;
    }

    .customStyle-container > div {
        display: flex;
        flex-direction: column;
        gap: 5px;
    }

    .customStyle-textarea {
        min-height: 40px;
        padding: 10px;
        border-radius: 8px;
        background: var(--main-background-color);
        color: var(--main-text-color);
        border: 0px !important;
        margin-right: 5px;
        -webkit-user-select: auto;
        user-select: auto;
    }

    .customStyle-buttons {
        justify-content: flex-end;
        flex-direction: row !important;
        margin-right: 5px;
        justify-content: center;
    }

    .customStyle-button {
        width: 25%;
        display: flex;
        height: 40px;
        border-radius: 8px;
        background: var(--main-background-color);
        margin: 0 20px;
        justify-content: center;
        align-items: center;
        transition: 0.3s;
        border-style: unset;
        box-shadow: var(--main-search-shadow);
        -webkit-box-shadow: var(--main-search-shadow);
    }

    .customStyle-button:hover {
        cursor: pointer;
        background: var(--main-background-hover-color);
        transition: 0.3s;
    }

    .customStyle-button:active {
        transform: scale(0.90);
        background: var(--main-background-active-color);
        transition: 0.3s;
    }
</style>
