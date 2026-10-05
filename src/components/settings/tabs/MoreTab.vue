<script setup>
// 更多 tab
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'
import { useBackup, wipeAllData } from '@/composables/useBackup'
import { useToast } from '@/composables/useToast'
import { useUiStore, PANEL } from '@/stores/ui'
import { useI18n } from 'vue-i18n'
import {
    DATA_SERVER_KEY,
    DATA_SOURCE_KEY,
    DATA_TOKEN_KEY,
    SOURCE_LOCAL,
    SOURCE_SERVER,
    dataServerToken,
    dataServerUrl,
    lockedByBuild,
    normalizeServerUrl
} from '@/utils/dataSource'
import PanelTextButton from '@/components/panel/items/PanelTextButton.vue'
import PanelSection from '@/components/panel/items/PanelSection.vue'

const { t } = useI18n()

const { exportData, parseBackup, applyBackup } = useBackup()
const toast = useToast()
const uiStore = useUiStore()

const fileInput = ref(null)

/* 数据保存方式 */

// 改完要刷新才生效
const currentSource = ref(lockedByBuild || localStorage.getItem(DATA_SOURCE_KEY) === SOURCE_SERVER
    ? SOURCE_SERVER
    : SOURCE_LOCAL)
const urlInput = ref(lockedByBuild ? dataServerUrl.value : (localStorage.getItem(DATA_SERVER_KEY) || ''))
const tokenInput = ref(lockedByBuild ? dataServerToken.value : (localStorage.getItem(DATA_TOKEN_KEY) || ''))

// 点击保存后检查改动项
const savedUrl = ref(urlInput.value)
const savedToken = ref(tokenInput.value)
const dirty = computed(() => urlInput.value.trim() !== savedUrl.value || tokenInput.value.trim() !== savedToken.value)

const showUrl = computed(() => currentSource.value === SOURCE_SERVER)
const locked = computed(() => lockedByBuild)

/* 连通指示器 */
const phase = ref('idle')
// 服务端使用 pairing 则显示命令，password 则显示输入框
const authKind = ref('')
const pairCommand = ref('')
const pairError = ref('')
const pairCode = ref('')
let pairTimer = 0
let pairSession = null

const statusText = computed(() => ({
    idle: t('@global:data-source-idle'),
    checking: t('@global:data-source-checking'),
    failed: pairError.value || t('@global:data-source-failed'),
    waiting: t('@global:data-source-waiting'),
    credential: t('@global:data-source-need-credential'),
    unauthorized: t('@global:data-source-unauthorized'),
    online: t('@global:data-source-online')
}[phase.value] || t('@global:data-source-idle')))

const statusKind = computed(() => (phase.value === 'online' ? 'online' : (phase.value === 'idle' ? 'idle' : 'busy')))
// 凭证框延后出现
const showCredential = computed(() => authKind.value === 'password')
const showPairCommand = computed(() => authKind.value === 'pairing' && !!pairCommand.value)

function chooseSource(source) {
    if (locked.value) return
    currentSource.value = source

    // 切回本机存储立刻生效
    if (source === SOURCE_LOCAL) {
        stopPairing()
        localStorage.setItem(DATA_SOURCE_KEY, SOURCE_LOCAL)
        toast.show({ timeout: 2500, message: t('@global:data-source-reload') })
        return
    }

    syncFromStored()
}

// 等待连通性检验后再切换数据源
function activateServer() {
    if (locked.value) return
    localStorage.setItem(DATA_SOURCE_KEY, SOURCE_SERVER)
}

function stopPairing() {
    clearInterval(pairTimer)
    pairTimer = 0
    pairSession = null
}

// 探测服务端受保护接口，以验证连通性及凭证有效性
async function probeApi(url, token) {
    const headers = token ? { Authorization: `Bearer ${token}` } : {}
    // 同源且没有凭证时靠 cookie，跨源则靠 Bearer 且不能带凭凭证
    const sameOrigin = new URL(url, location.href).origin === location.origin

    try {
        const response = await fetch(`${url}/db/${'nitaiPageDB'}/${'prefs'}`, {
            headers,
            credentials: token || !sameOrigin ? 'omit' : 'include'
        })
        if (response.ok || response.status === 404) return 'online'
        if (response.status === 401 || response.status === 403) return 'unauthorized'
        return 'failed'
    } catch (error) {
        return 'failed'
    }
}

// 检查服务端的鉴权方式
async function detectAuthKind(url) {
    try {
        const response = await fetch(`${url}/version`, { credentials: 'omit' })
        if (!response.ok) return 'unknown'
        const data = await response.json()
        return data && data.authMode === 'password' ? 'password' : (data?.authMode === 'pairing' ? 'pairing' : 'unknown')
    } catch (error) {
        return 'unknown'
    }
}

// 如果已经保存过配置就直接检查
async function syncFromStored() {
    const url = normalizeServerUrl(savedUrl.value)
    if (!url) {
        phase.value = 'idle'
        authKind.value = ''
        return
    }

    const storedToken = savedToken.value
    if (storedToken) {
        phase.value = 'checking'
        const kind = await detectAuthKind(url)
        authKind.value = kind === 'unknown' ? '' : kind
        phase.value = await probeApi(url, storedToken)
        return
    }

    phase.value = 'checking'
    const kind = await detectAuthKind(url)
    authKind.value = kind === 'unknown' ? '' : kind
    const result = await probeApi(url, '')
    if (result === 'online') {
        // 同源部署靠 cookie ，不走配对或凭证
        phase.value = 'online'
        activateServer()
        return
    }

    phase.value = kind === 'password' ? 'credential' : (kind === 'pairing' ? 'idle' : result)
}

// 保存服务端配置：
//   1.若地址变了（或尚未判定鉴权方式）：先清除旧凭证，再探测服务端鉴权模式
//   2.若地址没变且为 password 模式：携带用户刚填入的凭证重新验证连通性
async function saveServer() {
    if (locked.value) return

    const url = normalizeServerUrl(urlInput.value)
    if (!url) {
        toast.show({ timeout: 2500, message: t('@global:data-source-url-invalid') })
        return
    }

    if (url !== savedUrl.value || authKind.value === '') {
        stopPairing()
        pairError.value = ''
        urlInput.value = url
        localStorage.setItem(DATA_SERVER_KEY, url)
        savedUrl.value = url

        // 地址变更，旧凭证失效
        tokenInput.value = ''
        savedToken.value = ''
        localStorage.removeItem(DATA_TOKEN_KEY)

        phase.value = 'checking'
        const kind = await detectAuthKind(url)
        if (kind === 'unknown') {
            authKind.value = ''
            phase.value = 'failed'
            return
        }

        authKind.value = kind
        if (kind === 'password') {
            phase.value = 'credential'
            return
        }
        await startPairing(url)
        return
    }

    if (authKind.value !== 'password') return

    const token = tokenInput.value.trim()
    if (!token) {
        phase.value = 'credential'
        toast.show({ timeout: 2500, message: t('@global:data-source-need-credential') })
        return
    }

    localStorage.setItem(DATA_TOKEN_KEY, token)
    savedToken.value = token

    phase.value = 'checking'
    phase.value = await probeApi(url, token)
    if (phase.value === 'online') {
        activateServer()
        toast.show({ timeout: 2500, message: t('@global:data-source-reload') })
    }
}

/* 配对 */
async function startPairing(url) {
    stopPairing()
    phase.value = 'waiting'

    try {
        const response = await fetch(`${url}/pair/request`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'omit',
            body: JSON.stringify({ name: '站点设置', platform: navigator.platform || '' })
        })
        const data = await response.json().catch(() => null)
        if (!response.ok || !data?.ok) {
            // 确认服务端是 nitaiPage-Server
            pairError.value = t('@global:data-source-pair-unavailable')
            phase.value = 'failed'
            return
        }

        pairError.value = ''
        pairCode.value = data.code
        pairCommand.value = `npm run pair -- ${String(data.code).replace('-', '')}`
        pairSession = { url, deviceId: data.deviceId, secret: data.secret }
        pairTimer = setInterval(pollPairing, 2000)
    } catch (error) {
        pairError.value = t('@global:data-source-pair-unavailable')
        phase.value = 'failed'
    }
}

async function pollPairing() {
    if (!pairSession) return stopPairing()

    try {
        const response = await fetch(`${pairSession.url}/pair/claim`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'omit',
            body: JSON.stringify({ deviceId: pairSession.deviceId, secret: pairSession.secret })
        })
        const data = await response.json().catch(() => null)

        if (data?.status === 'claimed' && data.token) {
            const url = pairSession.url
            stopPairing()
            pairCommand.value = ''
            pairCode.value = ''
            tokenInput.value = data.token
            localStorage.setItem(DATA_TOKEN_KEY, data.token)
            savedToken.value = data.token
            phase.value = await probeApi(url, data.token)
            if (phase.value === 'online') {
                activateServer()
                toast.show({ timeout: 2500, message: t('@global:data-source-reload') })
            }
            return
        }
        if (data?.status === 'denied' || data?.status === 'expired' || data?.status === 'unknown') {
            stopPairing()
            phase.value = 'failed'
        }
    } catch (error) {
        // 网络问题不算失败
    }
}

// 配对命令点击复制
async function copyPairCommand() {
    const text = pairCommand.value
    if (!text) return
    try {
        await navigator.clipboard.writeText(text)
    } catch (error) {
        // 复制失败时允许直接复制
        const node = document.getElementById('data_source_pair_command')
        if (node) {
            const range = document.createRange()
            range.selectNodeContents(node)
            const selection = window.getSelection()
            selection.removeAllRanges()
            selection.addRange(range)
        }
    }
    toast.show({ timeout: 2000, message: t('@global:data-source-copied') })
}

onBeforeUnmount(stopPairing)

// 指示器状态初始化
onMounted(() => {
    if (showUrl.value) syncFromStored()
})

function openPluginSettings() {
    uiStore.openPanel(PANEL.PLUGIN_SET)
}

function onExport() {
    exportData()
}

function onImportClick() {
    fileInput.value?.click()
}

async function onFileChange(e) {
    const selected = e.target.files && e.target.files[0]
    e.target.value = ''
    if (!selected) return

    const name = selected.name
    const size = (selected.size / 1024).toFixed(2)

    let parsed
    try {
        parsed = await parseBackup(selected)
    } catch (err) {
        toast.show({ timeout: 2000, message: err.message || t('@global:data-parse-error') })
        return
    }

    toast.show({
        timeout: 8000,
        message: t('@global:my-data-import-confirm') + '"' + name + '"' + t('@global:my-data-import-confirm-2'),
        buttons: [
            ['<button>@global:toast-ok</button>', async function (instance, toastEl) {
                try {
                    await applyBackup(parsed.payload, parsed.media)
                } catch (err) {
                    console.error('导入数据失败:', err)
                }
                // 先刷新，出错不影响新数据生效
                setTimeout(() => window.location.reload(), 1000)
                instance.hide({ transitionOut: 'fadeOutUp' }, toastEl, 'buttonName')
                toast.show({ timeout: 2000, message: t('@global:my-data-import-success') + size + ' KB' })
            }, true],
            ['<button>@global:toast-cancel</button>', function (instance, toastEl) {
                instance.hide({ transitionOut: 'fadeOutUp' }, toastEl, 'buttonName')
                setTimeout(() => window.location.reload(), 1000)
            }]
        ]
    })
}

function onReset() {
    toast.show({
        timeout: 8000,
        message: t('@global:my-data-preinstall-confirm'),
        buttons: [
            ['<button>@global:toast-ok</button>', async function () {
                // cookie
                const cookies = document.cookie.split('; ')
                for (const cookie of cookies) {
                    const eqPos = cookie.indexOf('=')
                    const name = eqPos > -1 ? cookie.substr(0, eqPos) : cookie
                    document.cookie = name + '=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/'
                }
                // localStorage
                localStorage.clear()
                // 本地模式删 IndexedDB，自建模式删服务端的 store
                await wipeAllData()
                toast.show({ timeout: 1500, message: t('@global:preinstall-success') })
                window.location.reload()
            }, true],
            ['<button>@global:toast-cancel</button>', function (instance, toastEl) { instance.hide({ transitionOut: 'fadeOutUp' }, toastEl, 'buttonName') }]
        ]
    })
}
</script>

<template>
    <div class="mainConts set_blocks set_blocks_content set_blocks_more">
        <PanelTextButton variant="plain" id="entryPluginSettings" title="Npplication"
            :text="$t('@global:setting-set-more')" @click="openPluginSettings" />
        <PanelSection :title="$t('@global:setting-set-more-data-source')">
            <div class="data_source">
                <label class="source_option" :class="{ disabled: locked }">
                    <span class="container">
                        <input type="radio" name="nppDataSource" value="local" :checked="currentSource === 'local'"
                            :disabled="locked" @change="chooseSource('local')">
                        <svg viewBox="0 0 64 64" height="1.15em" width="1.15em">
                            <path
                                d="M 0 16 V 56 A 8 8 90 0 0 8 64 H 56 A 8 8 90 0 0 64 56 V 8 A 8 8 90 0 0 56 0 H 8 A 8 8 90 0 0 0 8 V 16 L 32 48 L 64 16 V 8 A 8 8 90 0 0 56 0 H 8 A 8 8 90 0 0 0 8 V 56 A 8 8 90 0 0 8 64 H 56 A 8 8 90 0 0 64 56 V 16"
                                pathLength="575.0541381835938" class="path"></path>
                        </svg>
                    </span>
                    <span class="source_title">{{ $t('@global:data-source-local') }}</span>
                    <span class="source_desc">{{ $t('@global:data-source-local-desc') }}</span>
                </label>
                <label class="source_option" :class="{ disabled: locked }">
                    <span class="container">
                        <input type="radio" name="nppDataSource" value="server" :checked="currentSource === 'server'"
                            :disabled="locked" @change="chooseSource('server')">
                        <svg viewBox="0 0 64 64" height="1.15em" width="1.15em">
                            <path
                                d="M 0 16 V 56 A 8 8 90 0 0 8 64 H 56 A 8 8 90 0 0 64 56 V 8 A 8 8 90 0 0 56 0 H 8 A 8 8 90 0 0 0 8 V 16 L 32 48 L 64 16 V 8 A 8 8 90 0 0 56 0 H 8 A 8 8 90 0 0 0 8 V 56 A 8 8 90 0 0 8 64 H 56 A 8 8 90 0 0 64 56 V 16"
                                pathLength="575.0541381835938" class="path"></path>
                        </svg>
                    </span>
                    <span class="source_title">{{ $t('@global:data-source-server') }}</span>
                    <span class="source_desc">{{ $t('@global:data-source-server-desc') }}</span>
                </label>

                <div class="source_url" :class="{ open: showUrl }">
                    <div class="source_url_inner">
                        <input type="url" id="data_server_url" v-model="urlInput" :disabled="locked"
                            autocomplete="off" :placeholder="$t('@global:data-source-url-placeholder')"
                            @keydown.enter="saveServer">

                        <!-- pairing -->
                        <div class="source_pair" v-if="showPairCommand">
                            <span class="source_pair_hint">{{ $t('@global:data-source-pair-hint') }}</span>
                            <code id="data_source_pair_command" class="source_pair_code" @click="copyPairCommand">{{
                                pairCommand }}</code>
                        </div>

                        <!-- password -->
                        <input v-else-if="showCredential" type="text" id="data_server_token" v-model="tokenInput"
                            :disabled="locked" autocomplete="off" spellcheck="false"
                            :placeholder="$t('@global:data-source-credential-placeholder')"
                            @keydown.enter="saveServer">

                        <div class="source_footer">
                            <!-- 连通指示器 -->
                            <p class="source_hint" :class="statusKind">
                                <span class="source_dot" aria-hidden="true"></span>
                                <span id="data_source_status">{{ showUrl ? statusText : $t('@global:data-source-locked') }}</span>
                            </p>
                            <button type="button" id="data_server_save" class="source_save" :disabled="locked || !dirty"
                                @click="saveServer">{{ $t('@global:data-source-save') }}</button>
                        </div>
                    </div>
                </div>
            </div>
        </PanelSection>
        <PanelSection :title="$t('@global:setting-set-more-data-backup')">
            <div class="data_backup">
                <PanelTextButton variant="card" id="my_data_in" :title="$t('@global:setting-import')"
                    :description="$t('@global:setting-import-description')" :text="$t('@global:setting-import')"
                    @click="onImportClick" />
                <PanelTextButton variant="card" id="my_data_out" :title="$t('@global:setting-export')"
                    :description="$t('@global:setting-export-description')" :text="$t('@global:setting-export')"
                    @click="onExport" />
                <PanelTextButton variant="card" id="my_data_reset" :title="$t('@global:setting-reset')"
                    :description="$t('@global:setting-reset-description')" :text="$t('@global:setting-reset')"
                    @click="onReset" />
                <input type="file" id="my_data_file" ref="fileInput" style="display: none;" accept=".zip,.json"
                    @change="onFileChange">
            </div>
        </PanelSection>
    </div>
</template>

<style scoped>
/* 数据保存方式 */
.data_source {
    display: flex;
    flex-direction: column;
    gap: 10px;
    margin: 20px 10px 0px 0px;
    padding: 6px 0;
}

.source_option {
    display: grid;
    grid-template-columns: 1.6em 1fr;
    grid-template-areas: "check title" "check desc";
    align-items: center;
    gap: 2px 10px;
    padding: 10px 12px;
    border-radius: 10px;
    background: var(--main-background-color);
    cursor: pointer;
    transition: background .25s cubic-bezier(.4, 0, .2, 1), transform .25s cubic-bezier(.4, 0, .2, 1);
}

.source_option:hover {
    background: var(--main-background-hover-color);
}

.source_option.disabled {
    cursor: not-allowed;
    opacity: .6;
}

/* 复选框勾选动画 */
.container {
    grid-area: check;
    display: flex;
    align-items: center;
    cursor: pointer;
}

.container input {
    display: none;
}

.container svg {
    overflow: visible;
}

.path {
    fill: none;
    stroke: var(--main-text-color);
    stroke-width: 6;
    stroke-linecap: round;
    stroke-linejoin: round;
    transition: stroke-dasharray 0.5s ease, stroke-dashoffset 0.5s ease;
    stroke-dasharray: 241 9999999;
    stroke-dashoffset: 0;
}

.container input:checked~svg .path {
    stroke-dasharray: 70.5096664428711 9999999;
    stroke-dashoffset: -262.2723388671875;
}

.source_title {
    grid-area: title;
    color: var(--main-text-color);
    font-weight: var(--main-font-weight);
}

.source_desc {
    grid-area: desc;
    color: var(--main-text-color);
    opacity: .55;
    font-size: .85em;
}

/* 地址栏 */
.source_url {
    max-height: 0;
    overflow: hidden;
    opacity: 0;
    transition: max-height .34s cubic-bezier(.4, 0, .2, 1), opacity .28s cubic-bezier(.4, 0, .2, 1);
}

.source_url.open {
    max-height: 200px;
    opacity: 1;
}

.source_url_inner {
    padding: 2px 2px 0;
}

.source_url input {
    width: 100%;
    box-sizing: border-box;
    padding: 8px 10px;
    border: 1px solid transparent;
    border-radius: 8px;
    background: var(--main-input-color);
    color: var(--main-text-color);
    font: inherit;
    transition: border-color .25s cubic-bezier(.4, 0, .2, 1), background .25s cubic-bezier(.4, 0, .2, 1);
}

.source_url input + input {
    margin-top: 8px;
}

.source_url input:focus {
    outline: 0;
    border-color: var(--border-bottom-color-hover);
}

.source_url input::placeholder {
    color: var(--main-input-text-placeholder-color);
}

.source_footer {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 10px;
    margin-top: 8px;
}

/* 连通性指示器 */
.source_hint {
    display: flex;
    flex: 1;
    align-items: center;
    gap: 6px;
    min-width: 0;
    margin: 0 2px;
    color: var(--main-text-color);
    opacity: .7;
    font-size: .82em;
}

.source_hint.idle {
    opacity: .5;
}

.source_hint.online {
    opacity: 1;
}

.source_dot {
    flex: none;
    width: 7px;
    height: 7px;
    border-radius: 50%;
    background: currentColor;
}

.source_hint.busy .source_dot {
    background: #f9b44e;
    animation: source-dot-pulse 1.4s ease-in-out infinite;
}

.source_hint.online .source_dot {
    background: #5ec98d;
}

@keyframes source-dot-pulse {

    0%,
    100% {
        opacity: 1;
    }

    50% {
        opacity: .35;
    }
}

/* 配对命令 */
.source_pair {
    margin-top: 8px;
}

.source_pair_hint {
    display: block;
    margin-bottom: 4px;
    color: var(--main-text-color);
    opacity: .5;
    font-size: .82em;
}

.source_pair_code {
    display: block;
    padding: 8px 10px;
    border: 1px dashed var(--border-bottom-color-hover);
    border-radius: 8px;
    background: var(--main-background-color);
    color: var(--main-text-color);
    font-size: .85em;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    cursor: pointer;
    transition: background .25s cubic-bezier(.4, 0, .2, 1);
}

.source_pair_code:hover {
    background: var(--main-background-hover-color);
}

.source_save {
    flex: none;
    width: 74px;
    padding: 6px 16px;
    border: 1px solid transparent;
    border-radius: 8px;
    background: var(--main-background-color);
    color: var(--main-text-color);
    font: inherit;
    font-weight: var(--main-font-weight);
    white-space: nowrap;
    cursor: pointer;
    transition: background .25s cubic-bezier(.4, 0, .2, 1), opacity .25s cubic-bezier(.4, 0, .2, 1);
}

.source_save:hover:not(:disabled) {
    background: var(--main-background-hover-color);
}

.source_save:active:not(:disabled) {
    background: var(--main-background-active-color);
}

.source_save:disabled {
    opacity: .4;
    cursor: not-allowed;
}

@media (prefers-reduced-motion: reduce) {

    .source_option,
    .source_url,
    .source_url input,
    .source_save,
    .path,
    .source_dot {
        transition: none;
    }
}
</style>
