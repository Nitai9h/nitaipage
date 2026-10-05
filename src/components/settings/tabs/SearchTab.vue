<script setup>
// 搜取 tab
import { ref, reactive, computed, onMounted } from 'vue'
import { useSearchEngines } from '@/composables/useSearchEngines'
import { nextNumericKey } from '@/utils/keys'
import { se_list_preinstall } from '@/core/presets'
import { useToast } from '@/composables/useToast'
import { useI18n } from 'vue-i18n'
import PanelList from '@/components/panel/items/PanelList.vue'
import PanelRowButton from '@/components/panel/items/PanelRowButton.vue'
import PanelButton from '@/components/panel/items/PanelButton.vue'
import PanelForm from '@/components/panel/items/PanelForm.vue'
import PanelFormRow from '@/components/panel/items/PanelFormRow.vue'
import PanelFormActions from '@/components/panel/items/PanelFormActions.vue'

const { t } = useI18n()

const { seList, seDefault, orderedList, refreshSeList, setSeList, getSeDefault, setSeDefault } = useSearchEngines()
const toast = useToast()

const showForm = ref(false)
const listHidden = ref(false)
// editingKey 为空表示新增，非空表示改这一条
const form = reactive({ editingKey: '', title: '', url: '', name: '' })

// PanelList 需要 name，key 为正整数，遍历顺序就是添加顺序
const items = computed(() => orderedList.value.map((it) => ({ key: it.key, name: it.title })))

onMounted(() => {
    refreshSeList()
})

function showAdd() {
    form.editingKey = ''
    form.title = ''
    form.url = ''
    form.name = ''
    showForm.value = true
    listHidden.value = true
}

function cancel() {
    showForm.value = false
    listHidden.value = false
}

function setDefault(key) {
    toast.show({
        timeout: 8000,
        message: t('@global:se-set-default-search-engine'),
        buttons: [
            ['<button>@global:toast-ok</button>', async function (instance, toastEl) {
                setSeDefault(key)
                await refreshSeList()
                instance.hide({ transitionOut: 'fadeOutUp' }, toastEl, 'buttonName')
                toast.show({
                    message: t('@global:se-set-default-search-engine-success'),
                    buttons: [
                        ['<button>@global:toast-ok</button>', function (i2, t2) { i2.hide({ transitionOut: 'fadeOutUp' }, t2, 'buttonName') }, true],
                        ['<button>@global:toast-later</button>', function (i2, t2) { i2.hide({ transitionOut: 'fadeOutUp' }, t2, 'buttonName') }]
                    ]
                })
            }, true],
            ['<button>@global:toast-close</button>', function (instance, toastEl) { instance.hide({ transitionOut: 'fadeOutUp' }, toastEl, 'buttonName') }]
        ]
    })
}

function deleteItem(key) {
    if (key === getSeDefault()) {
        toast.show({ message: t('@global:se-set-search-engine-delete-default') })
        return
    }
    toast.show({
        timeout: 8000,
        message: t('@global:se-set-search-engine-delete') + key + ' @global:delete-confirm',
        buttons: [
            ['<button>@global:toast-ok</button>', async function (instance, toastEl) {
                const next = { ...seList.value }
                delete next[key]
                await setSeList(next)
                await refreshSeList()
                instance.hide({ transitionOut: 'fadeOutUp' }, toastEl, 'buttonName')
                toast.show({ message: t('@global:delete-success') })
            }, true],
            ['<button>@global:toast-close</button>', function (instance, toastEl) { instance.hide({ transitionOut: 'fadeOutUp' }, toastEl, 'buttonName') }]
        ]
    })
}

function editItem(key) {
    const item = seList.value[key]
    if (!item) return
    form.editingKey = key
    form.title = item.title
    form.url = item.url
    form.name = item.name
    showForm.value = true
    listHidden.value = true
}

async function save() {
    const next = { ...seList.value }
    const isEdit = !!form.editingKey
    // 新增用尾 key+1，编辑则使用原 key
    const key = isEdit ? form.editingKey : nextNumericKey(next)

    next[key] = {
        id: Number(key),
        title: form.title,
        url: form.url,
        name: form.name,
        // 编辑保留原有图标，新增用通用图标
        icon: next[form.editingKey]?.icon || 'iconfont icon-internet'
    }

    await setSeList(next)
    await refreshSeList()
    showForm.value = false
    listHidden.value = false
    toast.show({ timeout: 2000, message: isEdit ? t('@global:se-set-cover-success') : t('@global:add-success') })
}

function preinstall() {
    toast.show({
        timeout: 8000,
        message: t('@global:se-set-search-engine-preinstall-confirm'),
        buttons: [
            ['<button>@global:toast-ok</button>', async function (instance, toastEl) {
                await setSeList(se_list_preinstall)
                setSeDefault('1')
                await refreshSeList()
                instance.hide({ transitionOut: 'fadeOutUp' }, toastEl, 'buttonName')
                toast.show({ timeout: 2000, message: t('@global:preinstall-success') })
            }, true],
            ['<button>@global:toast-close</button>', function (instance, toastEl) { instance.hide({ transitionOut: 'fadeOutUp' }, toastEl, 'buttonName') }]
        ]
    })
}
</script>

<template>
    <div class="mainConts set_blocks">
        <div class="set_blocks_content">
            <PanelList v-show="!listHidden" :items="items">
                <template #num="{ item }">
                    <i v-if="item.key === seDefault" class="iconfont icon-home"></i>
                    <template v-else>{{ item.key }}</template>
                </template>
                <template #actions="{ item }">
                    <PanelRowButton icon="iconfont icon-home" :value="item.key"
                                    radius="left"
                                    @click="setDefault(item.key)" />
                    <PanelRowButton icon="iconfont icon-edit" :value="item.key" radius="none"
                                    @click="editItem(item.key)" />
                    <PanelRowButton icon="iconfont icon-delete" :value="item.key"
                                    radius="right"
                                    @click="deleteItem(item.key)" />
                </template>
            </PanelList>
            <div class="panel_list_actions_row" v-show="!listHidden">
                <PanelButton @click="showAdd">{{ $t('@global:setting-set-se-list-add') }}</PanelButton>
                <PanelButton @click="preinstall">{{ $t('@global:setting-set-se-list-preinstall') }}</PanelButton>
            </div>
            <PanelForm variant="se_add_content" v-show="showForm">
                <PanelFormRow :label="$t('@global:setting-set-se-list-name')">
                    <input type="text" name="title" v-model="form.title"
                        :placeholder="$t('@global:setting-set-se-list-name-placeholder')" autocomplete="off">
                </PanelFormRow>
                <PanelFormRow :label="$t('@global:setting-set-se-list-url')">
                    <input type="url" name="url" v-model="form.url"
                        :placeholder="$t('@global:setting-set-se-list-url-placeholder')" autocomplete="off">
                </PanelFormRow>
                <PanelFormRow :label="$t('@global:setting-set-se-list-field')">
                    <input type="text" name="name" v-model="form.name"
                        :placeholder="$t('@global:setting-set-se-list-field-placeholder')" autocomplete="off">
                </PanelFormRow>
                <template #actions>
                    <PanelFormActions :saveText="$t('@global:setting-set-se-list-save')"
                        :cancelText="$t('@global:setting-set-se-list-cancel')"
                        @save="save" @cancel="cancel" />
                </template>
            </PanelForm>
        </div>
    </div>
</template>
