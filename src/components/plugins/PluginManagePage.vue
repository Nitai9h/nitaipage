<script setup>
// 插件管理页
import { ref, onMounted, watch } from 'vue'
import iziToast from 'izitoast'
import {
    getPluginsList, uninstallNpp, checkUpdates
} from '@/core/npp/npplication.js'
import { hideToastById } from '@/composables/useToast'
import PanelBigButton from '@/components/panel/special/PanelBigButton.vue'
import SwitchControl from '@/components/panel/SwitchControl.vue'
import PanelFold from '@/components/panel/items/PanelFold.vue'
import StoreSourcesDialog from './StoreSourcesDialog.vue'

const props = defineProps({
    visible: { type: Boolean, default: false }
})

const sourcesRef = ref(null)
const normalPlugins = ref([])
const translatePlugins = ref([])
const autoUpdateOn = ref(localStorage.getItem('autoUpdatePlugins') === 'on')

async function load() {
    const plugins = await getPluginsList()
    normalPlugins.value = plugins.filter(p => p.type !== 'translate')
    translatePlugins.value = plugins.filter(p => p.type === 'translate')
}

function toggleAutoUpdate() {
    autoUpdateOn.value = !autoUpdateOn.value
    localStorage.setItem('autoUpdatePlugins', autoUpdateOn.value ? 'on' : 'off')
}

async function doUpdate(id) {
    iziToast.show({ id: 'checkUpdateToast', message: '@npplication:checking-update' })
    try {
        await checkUpdates(id)
    } catch (e) {
        iziToast.show({ timeout: 3000, message: '@npplication:checking-update-error' })
    }
    hideToastById('#checkUpdateToast')
}

function doUninstall(id) {
    iziToast.show({
        timeout: 8000,
        message: '@npplication:confirm-uninstall',
        buttons: [
            ['<button>@global:toast-ok</button>', async function (instance, toast) {
                instance.hide({ transitionOut: 'fadeOutUp' }, toast, 'buttonName')
                const ok = await uninstallNpp(id)
                if (ok) {
                    iziToast.show({
                        timeout: 3000,
                        message: '@npplication:uninstall-success',
                        buttons: [
                            ['<button class="refresh-btn">@global:toast-refresh</button>', function (i, toastEl) {
                                i.hide({ transitionOut: 'flipOutX' }, toastEl, 'confirm')
                                window.location.reload(true)
                            }, true],
                            ['<button class="later-btn">@global:toast-later</button>', function (i, toastEl) {
                                i.hide({ transitionOut: 'flipOutX' }, toastEl, 'cancel')
                            }]
                        ]
                    })
                    await load()
                    sourcesRef.value && sourcesRef.value.load()
                } else {
                    iziToast.show({ timeout: 3000, message: '@npplication:uninstall-fail' })
                }
            }, true],
            ['<button>@global:toast-cancel</button>', function (instance, toast) {
                instance.hide({ transitionOut: 'fadeOutUp' }, toast, 'buttonName')
            }]
        ]
    })
}

onMounted(load)
watch(() => props.visible, (v) => {
    if (v) {
        load()
        sourcesRef.value && sourcesRef.value.load()
    }
})
</script>

<template>
    <PanelBigButton
        :title="'@npplication:setting-auto-update-plugins'"
        :description="'@npplication:setting-auto-update-plugins-desc'"
    >
        <SwitchControl :model-value="autoUpdateOn" id="toggleAutoUpdatePlugins" @update:model-value="toggleAutoUpdate" />
    </PanelBigButton>

    <StoreSourcesDialog ref="sourcesRef" />

    <div class="plugin_management">
        <PanelFold title="Npplications" :open="true">
            <div v-for="p in normalPlugins" :key="p.id" class="plugin_item" :class="{ coreNpp: p.type === 'coreNpp' }">
                <div class="plugin_info">
                    <div class="plugin_icon"><img :src="p.icon"></div>
                    <div class="plugin_text">
                        <div class="plugin_name" translate="none">{{ p.name }}</div>
                        <div class="plugin_details">
                            <span>@npplication:version: <span translate="none">{{ p.version }}</span></span>
                        </div>
                    </div>
                </div>
                <div class="plugin_actions" :id="p.id">
                    <button class="update_plugin" :data-id="p.id" @click="doUpdate(p.id)">
                        <i class="iconfont icon-refresh"></i>
                    </button>
                    <button class="uninstall_plugin" :data-id="p.id" @click="doUninstall(p.id)">
                        <i class="iconfont icon-delete"></i>
                    </button>
                </div>
            </div>
        </PanelFold>
    </div>

    <div class="plugin_management" v-if="translatePlugins.length > 0">
        <PanelFold title="@npplication:installed-translate-plugins" :open="false">
            <div v-for="p in translatePlugins" :key="p.id" class="plugin_item translate-plugin">
                <div class="plugin_info">
                    <div class="plugin_icon"><img :src="p.icon"></div>
                    <div class="plugin_text">
                        <div class="plugin_name" translate="none">{{ p.name }}</div>
                        <div class="plugin_details">
                            <span>@npplication:version: <span translate="none">{{ p.version }}</span></span>
                        </div>
                    </div>
                </div>
                <div class="plugin_actions" :id="p.id">
                    <button class="update_plugin" :data-id="p.id" @click="doUpdate(p.id)">
                        <i class="iconfont icon-refresh"></i>
                    </button>
                    <button class="uninstall_plugin" :data-id="p.id" @click="doUninstall(p.id)">
                        <i class="iconfont icon-delete"></i>
                    </button>
                </div>
            </div>
        </PanelFold>
    </div>
</template>
