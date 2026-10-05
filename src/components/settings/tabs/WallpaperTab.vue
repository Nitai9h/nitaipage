<script setup>
// 壁纸 tab
// Text key 用 @global:setting-set-wallpaper-*
// 数据层走 useWallpaper()
import { ref, computed } from 'vue'
import { useSettingsStore } from '@/stores/settings'
import { useWallpaper } from '@/composables/useWallpaper'
import { useToast } from '@/composables/useToast'
import { useI18n } from 'vue-i18n'
import PanelSwitch from '@/components/panel/items/PanelSwitch.vue'
import PanelText from '@/components/panel/items/PanelText.vue'
import PanelButton from '@/components/panel/items/PanelButton.vue'
import PanelWallpaperPicker from '@/components/panel/special/PanelWallpaperPicker.vue'

const { t } = useI18n()

const props = defineProps({
    settingsStore: { type: Object, default: null }
})

const settings = computed(() => props.settingsStore || useSettingsStore())

const {
    wallpaperOptions, wallpaperPictures, currentType, wallpaperText, solidColor, ui,
    getBgImg, setBgImg, changeWallpaper, refreshWallpaperOptions, renderWallpaperList,
    saveWallpaperOptionsToDB, saveMediaFileToDB, generateIndexedDBMediaUrl,
    addWallpaperToList, removeWallpaperFromList, deleteMediaFileFromDB,
    addWallpaperOption, removeWallpaperOption,
    handleSolidColorBackground
} = useWallpaper()

const { message: toastMessage, show: toastShow } = useToast()

// 表单引用
const nameInput = ref(null)
const urlInput = ref(null)
const fileInput = ref(null)
const colorInput = ref(null)
const colorPickerInput = ref(null)
const randomFileInput = ref(null)

// 长按 / 右键显/隐删除按钮
const longPressedIndex = ref(null)
let isLongPress = false
let pressTimer = null
let lastToggleTime = 0
const COOLDOWN_TIME = 800

// i18n 跳过判定
// 翻译内置预设的 label
// 不翻译用户自定义壁纸的 label
function isTranslatableLabel(label) {
    return typeof label === 'string' && label.trim().startsWith('@')
}

/* 选中壁纸类型 */
function onSelectWallpaper(index) {
    const bg_img = getBgImg()
    bg_img.type = String(index)
    setBgImg(bg_img)

    if (index === 0) {
        wallpaperText.value = t('@global:setting-set-new-wallpaper-add')
    } else if (index === 2) {
        wallpaperText.value = t('@global:setting-set-wallpaper-solid-color')
        toastMessage(t('@global:toast-switch-success'), { timeout: 2000 })
    } else {
        toastMessage(t('@global:toast-switch-success'), { timeout: 2000 })
    }

    // index 在有效范围内时覆盖为对应描述
    if (index < wallpaperOptions.value.length) {
        wallpaperText.value = wallpaperOptions.value[index].description
    }

    changeWallpaper()
}

/* 保存壁纸项（名称 / URL / 文件） */
function onSave() {
    const currentTypeVal = parseInt(getBgImg().type) || 0

    // 纯色背景保存
    if (currentTypeVal === 2) {
        const color = (solidColor.value || '').trim()
        if (!color || !/^#[0-9A-F]{6}$/i.test(color)) {
            toastMessage(t('@global:setting-set-wallpaper-solid-color-invalid'), { timeout: 2000 })
            return
        }
        localStorage.setItem('solidColorBackground', color)

        // 纯色保存
        handleSolidColorBackground()

        toastMessage(t('@global:toast-save-success'), { timeout: 2000 })
        return
    }

    const name = (nameInput.value?.value || '').trim()
    const url = (urlInput.value?.value || '').trim()
    const file = fileInput.value?.files?.[0]

    if (!name) {
        toastMessage(t('@global:setting-set-wallpaper-name-invalid'), { timeout: 2000 })
        return
    }

    const existingIndex = wallpaperOptions.value.findIndex(option => option.label === name)
    if (existingIndex !== -1) {
        toastMessage(t('@global:setting-set-wallpaper-name-exists'), { timeout: 2000 })
        return
    }

    // 优先使用文件（图片 / 视频，存入 IndexedDB）
    if (file) {
        if (!file.type.startsWith('image/') && !file.type.startsWith('video/')) {
            toastMessage(t('@global:setting-set-wallpaper-file-invalid'), { timeout: 2000 })
            return
        }

        toastShow({ id: 'upload', message: t('@global:setting-set-wallpaper-uploading'), timeout: 2000 })

        saveMediaFileToDB(file).then((mediaId) => {
            const indexedDBUrl = generateIndexedDBMediaUrl(mediaId)
            addWallpaperOption({
                label: name,
                url: indexedDBUrl,
                description: `@global:setting-set-new-option-wallpaper-description ${name}`,
                mediaId
            })
            saveWallpaperOptionsToDB(wallpaperOptions.value)

            if (nameInput.value) nameInput.value.value = ''
            if (urlInput.value) {
                urlInput.value.value = ''
                urlInput.value.disabled = false
                urlInput.value.classList.remove('disabled')
            }
            if (fileInput.value) fileInput.value.value = ''

            refreshWallpaperOptions()

            toastShow({ id: 'upload', message: t('@global:toast-upload-success'), timeout: 2000 })
        }).catch((error) => {
            console.error('文件保存失败:' + error)
            toastShow({ id: 'upload', message: t('@global:toast-upload-fail'), timeout: 2000 })
        })

        return
    }

    if (!url) {
        toastMessage(t('@global:setting-set-wallpaper-url-fail'), { timeout: 2000 })
        return
    }

    if (!url.startsWith('http://') && !url.startsWith('https://')) {
        toastMessage(t('@global:setting-set-wallpaper-url-format'), { timeout: 2000, color: 'red' })
        return
    }

    addWallpaperOption({
        label: name,
        url,
        description: `@global:setting-set-new-option-wallpaper-description ${name}`
    })
    saveWallpaperOptionsToDB(wallpaperOptions.value)

    if (nameInput.value) nameInput.value.value = ''
    if (urlInput.value) urlInput.value.value = ''

    refreshWallpaperOptions()

    toastMessage(t('@global:toast-save-success'), { timeout: 2000 })
}

/* 自定义上传（名称/URL) */
function onUploadClick() {
    fileInput.value?.click()
}

function onFileChange(e) {
    const file = e.target.files?.[0]
    if (!file) return
    // 预填写 URL 并禁用输入
    if (urlInput.value) {
        urlInput.value.value = `File:${file.name}`
        urlInput.value.disabled = true
        urlInput.value.classList.add('disabled')
    }
    // 自动填充名称（去掉扩展名）
    if (nameInput.value) {
        nameInput.value.value = file.name.replace(/\.[^/.]+$/, '')
    }
}

/* 颜色选择 */
function onColorPickerClick() {
    colorPickerInput.value?.click()
}

/* 随机壁纸列表 */
function onAddWallpaperClick() {
    randomFileInput.value?.click()
}

async function onAddWallpaperFile(e) {
    const file = e.target.files?.[0]
    if (!file) return
    if (!file.type.startsWith('image/')) {
        toastMessage(t('@global:setting-set-wallpaper-file-format-invalid'), { timeout: 2000 })
        e.target.value = ''
        return
    }
    try {
        await addWallpaperToList(file)
        renderWallpaperList()
        toastMessage(t('@global:toast-upload-success'), { timeout: 2000 })
    } catch (error) {
        console.error(error)
        toastMessage(t('@global:toast-upload-fail'), { timeout: 2000 })
    }
    e.target.value = ''
}

async function onDeleteRandom(index) {
    if (wallpaperPictures.value.length <= 1) {
        toastMessage(t('@global:render-wallpaper-minium'), { timeout: 2000 })
        return
    }
    toastShow({
        message: t('@global:delete-confirm'),
        timeout: 8000,
        buttons: [
            ['<button>@global:toast-ok</button>', async (instance, toastEl) => {
                try {
                    await removeWallpaperFromList(index)
                    renderWallpaperList()
                    toastMessage(t('@global:delete-success'), { timeout: 2000 })
                } catch (error) {
                    console.error(error)
                    toastMessage(t('@global:delete-fail'), { timeout: 2000 })
                }
                if (instance) instance.hide({ transitionOut: 'fadeOut' }, toastEl, 'button')
            }, true],
            ['<button>@global:toast-cancel</button>', (instance, toastEl) => {
                if (instance) instance.hide({ transitionOut: 'fadeOut' }, toastEl, 'button')
            }]
        ]
    })
}

/* 壁纸选项删除（长按 / 右键） */
function onPressStart(index, e) {
    // 排除删除按钮自身
    if (e.target.closest('.delete-wallpaper')) return
    isLongPress = false
    pressTimer = setTimeout(() => {
        isLongPress = true
        const currentTime = Date.now()
        if (currentTime - lastToggleTime < COOLDOWN_TIME) return
        longPressedIndex.value = longPressedIndex.value === index ? null : index
        lastToggleTime = currentTime
    }, 800)
}

function onPressEnd() {
    clearTimeout(pressTimer)
    setTimeout(() => { isLongPress = false }, 100)
}

function onRadioClick(index, e) {
    if (isLongPress) {
        e.preventDefault()
        e.stopPropagation()
        isLongPress = false
    }
}

function onContextMenu(index, e) {
    e.preventDefault()
    if (e.target.closest('.delete-wallpaper')) return
    const currentTime = Date.now()
    if (currentTime - lastToggleTime < COOLDOWN_TIME) return
    longPressedIndex.value = longPressedIndex.value === index ? null : index
    lastToggleTime = currentTime
}

function onDeleteWallpaper(index) {
    const deleteIndex = parseInt(index)
    const bg_img = getBgImg()
    const currentWallpaperType = parseInt(bg_img.type) || 0

    // 不能删除正在使用的壁纸
    if (deleteIndex === currentWallpaperType) {
        toastMessage(t('@global:toast-delete-current-wallpaper'), { timeout: 2000 })
        return
    }

    const wallpaperToDelete = wallpaperOptions.value[deleteIndex]

    toastShow({
        message: t('@global:delete-confirm'),
        timeout: 8000,
        buttons: [
            ['<button>@global:toast-ok</button>', (instance, toastEl) => {
                if (wallpaperToDelete && wallpaperToDelete.mediaId) {
                    deleteMediaFileFromDB(wallpaperToDelete.mediaId)
                }
                removeWallpaperOption(deleteIndex)
                saveWallpaperOptionsToDB(wallpaperOptions.value)

                toastMessage(t('@global:toast-delete-success'), { timeout: 2000 })
                longPressedIndex.value = null
                refreshWallpaperOptions()

                if (instance) instance.hide({ transitionOut: 'fadeOut' }, toastEl, 'button')
            }, true],
            ['<button>@global:toast-cancel</button>', (instance, toastEl) => {
                if (instance) instance.hide({ transitionOut: 'fadeOut' }, toastEl, 'button')
            }]
        ]
    })
}
</script>

<template>
    <div class="mainConts">
        <div class="set_blocks wallpapers_content">
            <!-- 壁纸遮罩 / 视频音效开关 -->
            <div class="set_tip set_tip_new">
                <PanelSwitch id="toggle-bg-cover" :model-value="settings.bgCover"
                    @update:model-value="settings.setBgCover($event)"
                    :title="$t('@global:setting-set-wallpaper-cover')"
                    :description="$t('@global:setting-set-wallpaper-cover-desc')" />
                <div id="wallpaper-sound-option">
                    <PanelSwitch id="toggle-bg-video-sound" :model-value="settings.bgVideoSound"
                    @update:model-value="settings.setBgVideoSound($event)"
                    :title="$t('@global:setting-set-wallpaper-sound-notify')"
                    :description="$t('@global:setting-set-wallpaper-sound-notify-desc')" />
                </div>
            </div>

            <!-- 壁纸选择说明 -->
            <PanelText>
                <span class="set_text_wallpaper">{{ $t('@global:setting-set-wallpaper-switch-desc') }}</span>
                <span class="set_text_wallpaper" id="wallpaper_text">{{ wallpaperText }}</span>
            </PanelText>

            <div class="set_blocks_content" :class="{ hide: ui.blocksHide }">
                <div class="from_container">
                    <div class="froms">
                        <div class="from_row">
                            <div class="from_row_content">
                                <!-- 壁纸类别按钮 + 随机壁纸列表 -->
                                <PanelWallpaperPicker :pictures="wallpaperPictures" :show="ui.listSettingShow"
                                    @add="onAddWallpaperClick" @delete="onDeleteRandom">
                                    <template #options>
                                        <div class="form-radio" v-for="(option, index) in wallpaperOptions" :key="index"
                                            :class="{ 'long-pressed': longPressedIndex === index }"
                                            :translate="isTranslatableLabel(option.label) ? undefined : 'none'"
                                            @mousedown="onPressStart(index, $event)" @touchstart="onPressStart(index, $event)"
                                            @mouseup="onPressEnd" @mouseleave="onPressEnd" @touchend="onPressEnd"
                                            @click="onRadioClick(index, $event)" @contextmenu="onContextMenu(index, $event)">
                                            <input type="radio" :id="'radio' + index" class="set-wallpaper"
                                                :class="{ 'wallpaper-custom': index === 0 }" name="wallpaper-type"
                                                :value="index" style="display: none;" v-model="currentType"
                                                @change="onSelectWallpaper(index)">
                                            <label class="form-radio-label" :for="'radio' + index" v-html="option.label"></label>
                                            <div v-if="index > 1 && index !== 2" class="delete-wallpaper" :data-index="index"
                                                @click.stop="onDeleteWallpaper(index)">
                                                <i class="iconfont icon-delete"></i>
                                            </div>
                                        </div>
                                    </template>
                                    <template #add-text>@global:setting-set-wallpaper-add</template>
                                </PanelWallpaperPicker>
                                <input type="file" id="wallpaper-file-input" ref="randomFileInput"
                                    accept="image/*" style="display: none;" @change="onAddWallpaperFile">
                            </div>
                        </div>

                        <!-- 自定义上传（名称 / URL / 文件） -->
                        <div class="wallpaper_container" :class="{ show: ui.containerShow }">
                            <div id="wallpaper_name">
                                <div class="from_row">
                                    <div class="from_items">
                                        <input type="text" name="wallpaper-name" id="wallpaper-name" ref="nameInput"
                                            class="form-input" :placeholder="$t('@global:setting-set-wallpaper-name-placeholder')"
                                            autocomplete="off">
                                    </div>
                                </div>
                            </div>
                            <div class="wallpaper-custom-container">
                                <div id="wallpaper_url">
                                    <div class="from_row">
                                        <div class="from_items">
                                            <input type="text" name="wallpaper-url" id="wallpaper-url" ref="urlInput"
                                                class="form-input" :placeholder="$t('@global:setting-set-wallpaper-url-placeholder')"
                                                autocomplete="off">
                                        </div>
                                    </div>
                                </div>
                                <div id="wallpaper_upload">
                                    <div class="from_row">
                                        <div class="from_items">
                                            <input type="file" id="wallpaper-file" ref="fileInput"
                                                accept="image/*,video/*" style="display: none;" @change="onFileChange">
                                            <div class="wallpaper-upload-btn" id="wallpaper-upload-btn" @click="onUploadClick">
                                                @global:setting-set-wallpaper-add
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <!-- 纯色背景（type === 2 时显示） -->
                        <div id="wallpaper_color" :class="{ show: ui.colorShow }">
                            <div class="from_row">
                                <div class="from_items">
                                    <div class="color-input-container">
                                        <input type="text" name="wallpaper-color" id="wallpaper-color-input" ref="colorInput"
                                            class="form-input" :placeholder="$t('@global:setting-set-wallpaper-color-placeholder')"
                                            autocomplete="off" maxlength="7" v-model="solidColor">
                                        <input type="color" id="wallpaper-color-picker" ref="colorPickerInput"
                                            class="color-picker" v-model="solidColor">
                                        <div class="color-picker-btn" id="color-picker-btn" @click="onColorPickerClick">
                                            @global:setting-set-wallpaper-color-picker
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- 保存按钮 -->
                <div class="from_items button" id="wallpaper-button" :class="{ show: ui.buttonShow }">
                    <PanelButton @click="onSave">{{ $t('@global:setting-set-wallpaper-save') }}</PanelButton>
                </div>
            </div>
        </div>
    </div>
</template>
