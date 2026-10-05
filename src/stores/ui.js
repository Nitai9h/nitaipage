import { defineStore } from 'pinia'
import { KEY, LS } from '@/utils/storage'

// 全局界面状态

export const PANEL = {
    MARK: 'mark',
    SET: 'set',
    STORE: 'store',
    PLUGIN_SET: 'plugin_set'
}

export const useUiStore = defineStore('ui', {
    state: () => ({
        // 当前激活的面板
        activePanel: PANEL.MARK,
        // Box 是否展开（body.open / body.close）
        boxOpen: false,
        // 搜索框是否聚焦（body.onsearch）
        searchFocused: false,
        // 折叠按钮开关（#fold.on）
        foldOn: LS.isOn(KEY.foldTime, 'off'),
        // 商店管理页 / 详情弹窗是否打开
        storeManageOpen: false,
        pluginDetailOpen: false,
        // 首页加载动画是否可见
        loading: true
    }),

    getters: {
        // 时钟是否上移/下移
        clockHidden(state) {
            if (!state.boxOpen) return false
            if (state.foldOn) return true
            return typeof window !== 'undefined' && window.matchMedia('(max-width: 260px)').matches
        },
        bodyClass(state) {
            return state.boxOpen ? 'open' : 'close'
        },
        // 面板显/隐 = Box已展开 且 它是当前面板
        // 不能只看 activePanel，初始值就是 MARK，会导致面板永远可见
        markActive: (state) => state.boxOpen && state.activePanel === PANEL.MARK,
        setActive: (state) => state.boxOpen && state.activePanel === PANEL.SET,
        storeActive: (state) => state.boxOpen && state.activePanel === PANEL.STORE,
        pluginSetActive: (state) => state.boxOpen && state.activePanel === PANEL.PLUGIN_SET,
        // 点击后变更图标
        menuIconClass: (state) =>
            state.activePanel === PANEL.SET ? 'iconfont icon-home' : 'iconfont icon-settings',
        storeIconClass: (state) =>
            state.activePanel === PANEL.STORE ? 'iconfont icon-home' : 'iconfont icon-store'
    },

    actions: {
        // 展开 Box
        openBox() {
            this.boxOpen = true
        },

        // 收起 Box
        closeBox() {
            this.boxOpen = false
        },

        // 切到指定面板
        openPanel(panel) {
            this.searchFocused = false
            this.activePanel = panel
            this.openBox()
        },

        // 回到主页
        closePanel() {
            this.activePanel = PANEL.MARK
            this.closeBox()
            this.storeManageOpen = false
            this.pluginDetailOpen = false
        },

        // 折叠开关
        toggleFold() {
            this.foldOn = !this.foldOn
            LS.setOn(KEY.foldTime, this.foldOn)
        },

        setFold(on) {
            this.foldOn = !!on
            LS.setOn(KEY.foldTime, this.foldOn)
        },

        setSearchFocused(focused) {
            this.searchFocused = !!focused
        },

        // 退出搜索并清空输入
        // 用 nitaipage:blur-search 通知 SearchBar 复位
        blurSearch() {
            this.searchFocused = false
            if (typeof window !== 'undefined') {
                window.dispatchEvent(new Event('nitaipage:blur-search'))
            }
        },

        setLoading(loading) {
            this.loading = !!loading
        }
    }
})
