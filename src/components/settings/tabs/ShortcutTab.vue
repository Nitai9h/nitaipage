<script setup>
// 捷径 tab
import { ref, reactive, computed, onMounted } from 'vue'
import { useShortcuts } from '@/composables/useShortcuts'
import { nextNumericKey } from '@/utils/keys'
import { quick_list_preinstall } from '@/core/presets'
import { useToast } from '@/composables/useToast'
import { useI18n } from 'vue-i18n'
import PanelList from '@/components/panel/items/PanelList.vue'
import PanelRowButton from '@/components/panel/items/PanelRowButton.vue'
import PanelButton from '@/components/panel/items/PanelButton.vue'
import PanelForm from '@/components/panel/items/PanelForm.vue'
import PanelFormRow from '@/components/panel/items/PanelFormRow.vue'
import PanelFormActions from '@/components/panel/items/PanelFormActions.vue'

const { t } = useI18n()

const { quickList, refreshQuickList, setQuickList } = useShortcuts()
const toast = useToast()

const showForm = ref(false)
const listHidden = ref(false)
// editingKey 为空表示新增，非空表示改这一条
const form = reactive({ editingKey: '', title: '', url: '' })

// PanelList 需要 name，捷径用 title 当名字
// key 为正整数，遍历顺序就是添加顺序
const items = computed(() =>
    Object.keys(quickList.value).map((key) => ({ key, name: quickList.value[key].title }))
)

onMounted(() => {
    refreshQuickList()
})

function showAdd() {
    form.editingKey = ''
    form.title = ''
    form.url = ''
    showForm.value = true
    listHidden.value = true
}

function cancel() {
    showForm.value = false
    listHidden.value = false
}

function deleteItem(key) {
    toast.show({
        timeout: 8000,
        message: t('@global:quick-set-shortcut') + key + ' @global:delete-confirm',
        buttons: [
            ['<button>@global:toast-ok</button>', async function (instance, toastEl) {
                const next = { ...quickList.value }
                delete next[key]
                await setQuickList(next)
                await refreshQuickList()
                instance.hide({ transitionOut: 'fadeOutUp' }, toastEl, 'buttonName')
                toast.show({ timeout: 2000, message: t('@global:delete-success') })
            }, true],
            ['<button>@global:toast-close</button>', function (instance, toastEl) { instance.hide({ transitionOut: 'fadeOutUp' }, toastEl, 'buttonName') }]
        ]
    })
}

function editItem(key) {
    const item = quickList.value[key]
    if (!item) return
    form.editingKey = key
    form.title = item.title
    form.url = item.url
    showForm.value = true
    listHidden.value = true
}

async function save() {
    const next = { ...quickList.value }
    const isEdit = !!form.editingKey
    // 新增用尾 key+1，编辑则使用原 key
    const key = isEdit ? form.editingKey : nextNumericKey(next)

    // 保留原图标等，只改 title 和 url
    next[key] = { ...next[form.editingKey], title: form.title, url: form.url }

    await setQuickList(next)
    await refreshQuickList()
    showForm.value = false
    listHidden.value = false
    toast.show({ timeout: 2000, message: isEdit ? t('@global:se-set-cover-success') : t('@global:add-success') })
}

function preinstall() {
    toast.show({
        timeout: 8000,
        message: t('@global:quick-set-preinstall-data'),
        buttons: [
            ['<button>@global:toast-ok</button>', async function (instance, toastEl) {
                await setQuickList(quick_list_preinstall)
                await refreshQuickList()
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
                    <span translate="none">{{ item.key }}</span>
                </template>
                <template #actions="{ item }">
                    <PanelRowButton icon="iconfont icon-edit" :value="item.key" radius="left"
                                    @click="editItem(item.key)" />
                    <PanelRowButton icon="iconfont icon-delete" :value="item.key" radius="right"
                                    @click="deleteItem(item.key)" />
                </template>
            </PanelList>
            <div class="panel_list_actions_row" v-show="!listHidden">
                <PanelButton @click="showAdd">{{ $t('@global:setting-set-quick-list-add') }}</PanelButton>
                <PanelButton @click="preinstall">{{ $t('@global:setting-set-quick-list-reset') }}</PanelButton>
            </div>
            <PanelForm variant="quick_add_content" v-show="showForm">
                <PanelFormRow :label="$t('@global:setting-set-quick-list-name')">
                    <input type="text" name="title" v-model="form.title"
                        :placeholder="$t('@global:setting-set-quick-list-name-placeholder')" autocomplete="off">
                </PanelFormRow>
                <PanelFormRow :label="$t('@global:setting-set-quick-list-url')">
                    <input type="url" name="url" v-model="form.url"
                        :placeholder="$t('@global:setting-set-quick-list-url-placeholder')" autocomplete="off">
                </PanelFormRow>
                <template #actions>
                    <PanelFormActions :saveText="$t('@global:setting-set-quick-list-add')"
                        :cancelText="$t('@global:setting-set-quick-list-cancel')"
                        @save="save" @cancel="cancel" />
                </template>
            </PanelForm>
        </div>
    </div>
</template>
