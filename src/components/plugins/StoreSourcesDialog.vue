<script setup>
// 商店源管理
import { ref, onMounted } from 'vue'
import iziToast from 'izitoast'
import { getStoreSources, addStoreSource, removeStoreSource } from '@/core/npp/npplication.js'
import PanelFold from '@/components/panel/items/PanelFold.vue'

const sources = ref([])
const newSource = ref('')

function load() {
    sources.value = getStoreSources()
}

function add() {
    const url = newSource.value.trim()
    if (!url) {
        iziToast.show({ timeout: 2000, message: '@npplication:invalid-url' })
        return
    }
    const res = addStoreSource(url)
    if (!res.ok) {
        iziToast.show({
            timeout: 2000,
            message: res.reason === 'exists' ? '@npplication:source-exists' : '@npplication:invalid-url'
        })
        return
    }
    newSource.value = ''
    load()
    iziToast.show({ timeout: 2000, message: '@npplication:add-success' })
}
function remove(url) {
    const res = removeStoreSource(url)
    if (!res.ok) {
        iziToast.show({ timeout: 2000, message: '@npplication:at-least-one-source' })
        return
    }
    load()
    iziToast.show({ timeout: 2000, message: '@npplication:delete-success' })
}

onMounted(load)
defineExpose({ load })
</script>

<template>
    <div class="store_sources_management">
        <PanelFold title="@npplication:store-sources-management" :open="false">
            <div class="store_sources_list">
                <div v-for="s in sources" :key="s" class="store_source_item" :data-url="s">
                    <div class="store_source_url" translate="none">{{ s }}</div>
                    <div class="store_source_buttons">
                        <button class="delete_store_source" :data-url="s" @click="remove(s)">
                            <i class="iconfont icon-delete"></i>
                        </button>
                    </div>
                </div>
            </div>
            <div class="add_store_source">
                <input type="text" id="new_store_source" v-model="newSource"
                    placeholder="@npplication:store-sources-management-placeholder">
                <button id="add_store_source_btn" @click="add">
                    <i class="iconfont icon-add"></i>
                </button>
            </div>
        </PanelFold>
    </div>
</template>
