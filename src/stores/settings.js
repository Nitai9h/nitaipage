// 设置面板偏好状态
import { defineStore } from 'pinia'
import { KEY, LS, persist } from '@/utils/storage'

export const useSettingsStore = defineStore('settings', {
    state: () => ({
        // 时钟（时间）
        timeFontSize: LS.num(KEY.timeFontSize, 0),
        timeFontWeight: LS.num(KEY.timeFontWeight, 50),
        timeFontOpacity: LS.num(KEY.timeFontOpacity, 100),
        timeFontWidth: LS.num(KEY.timeFontWidth, 0),
        // 时钟（日期）
        dateFontSize: LS.num(KEY.dateFontSize, 0),
        dateFontWeight: LS.num(KEY.dateFontWeight, 50),
        dateFontOpacity: LS.num(KEY.dateFontOpacity, 100),
        dateFontWidth: LS.num(KEY.dateFontWidth, 0),
        // 页面
        mainBoxBlur: LS.num(KEY.mainBoxBlur, 50),
        mainFontWeight: LS.num(KEY.mainFontWeight, 50),
        blurPlus: LS.bool(KEY.blurPlus, false),
        searchBlur: LS.bool(KEY.searchBlur, true),
        footerDisplay: LS.bool(KEY.footerDisplay, true),
        // 开关（均为 'true'/'false' ）
        dateDisplay: LS.bool(KEY.dateDisplay, true),
        zeroPadding: LS.bool(KEY.zeroPadding, true),
        timeFormat12h: LS.bool(KEY.timeFormat12h, false),
        clockBlink: LS.bool(KEY.clockBlink, true),
        clockNumAnimation: LS.bool(KEY.clockNumAnimation, true),
        // 壁纸
        bgCover: LS.bool(KEY.bgCover, true),
        bgVideoSound: LS.bool(KEY.bgVideoSound, true)
    }),

    actions: {
        /* 时钟：时间 */
        setTimeFontSize(v) {
            this.timeFontSize = Number(v)
            persist(KEY.timeFontSize, v)
            this.updateTimeStyle()
        },
        setTimeFontWeight(v) {
            this.timeFontWeight = Number(v)
            persist(KEY.timeFontWeight, v)
            this.updateTimeStyle()
        },
        setTimeFontOpacity(v) {
            this.timeFontOpacity = Number(v)
            persist(KEY.timeFontOpacity, v)
            this.updateTimeStyle()
        },
        setTimeFontWidth(v) {
            this.timeFontWidth = Number(v)
            persist(KEY.timeFontWidth, v)
            this.updateTimeStyle()
        },

        /* 时钟：日期 */
        setDateFontSize(v) {
            this.dateFontSize = Number(v)
            persist(KEY.dateFontSize, v)
            this.updateDateStyle()
        },
        setDateFontWeight(v) {
            this.dateFontWeight = Number(v)
            persist(KEY.dateFontWeight, v)
            this.updateDateStyle()
        },
        setDateFontOpacity(v) {
            this.dateFontOpacity = Number(v)
            persist(KEY.dateFontOpacity, v)
            this.updateDateStyle()
        },
        setDateFontWidth(v) {
            this.dateFontWidth = Number(v)
            persist(KEY.dateFontWidth, v)
            this.updateDateStyle()
        },

        /* 页面：模糊 / 字重 */
        setMainBoxBlur(v) {
            this.mainBoxBlur = Number(v)
            persist(KEY.mainBoxBlur, v)
            this.updateMainStyle()
        },
        setMainFontWeight(v) {
            this.mainFontWeight = Number(v)
            persist(KEY.mainFontWeight, v)
            this.updateMainStyle()
        },

        /* 开关类 */
        setBlurPlus(v) {
            this.blurPlus = !!v
            persist(KEY.blurPlus, v)
            this.updateBlurPlusStyle()
        },
        setSearchBlur(v) {
            this.searchBlur = !!v
            persist(KEY.searchBlur, v)
            this.updateSearchBlur()
        },
        setFooterDisplay(v) {
            this.footerDisplay = !!v
            persist(KEY.footerDisplay, v)
            this.updateFooterDisplay()
        },
        setDateDisplay(v) {
            this.dateDisplay = !!v
            persist(KEY.dateDisplay, v)
            this.updateDateDisplay()
        },
        setZeroPadding(v) {
            this.zeroPadding = !!v
            persist(KEY.zeroPadding, v)
            // 仅进行持久化并触发时钟重绘，渲染由背景模块负责
        },
        setTimeFormat12h(v) {
            this.timeFormat12h = !!v
            persist(KEY.timeFormat12h, v)
        },
        setClockBlink(v) {
            this.clockBlink = !!v
            persist(KEY.clockBlink, v)
            this.updateClockBlink()
        },
        setClockNumAnimation(v) {
            this.clockNumAnimation = !!v
            persist(KEY.clockNumAnimation, v)
            this.updateClockNumAnimation()
        },
        setBgCover(v) {
            this.bgCover = !!v
            persist(KEY.bgCover, v)
            this.updateBgCover()
        },
        setBgVideoSound(v) {
            this.bgVideoSound = !!v
            persist(KEY.bgVideoSound, v)
            this.updateBgVideoSound()
        },

        /* 样式应用 */
        // 时间样式（0-100）
        updateTimeStyle() {
            const baseFontSize = 2.75
            const maxIncrease = 5
            const fontSize = baseFontSize + (this.timeFontSize / 100) * maxIncrease
            const fontWeight = 100 + (this.timeFontWeight / 100) * 800
            const opacityValue = this.timeFontOpacity / 100
            const fontWidth = 29.5 + (this.timeFontWidth / 100) * 50

            const root = document.documentElement.style
            root.setProperty('--time-font-size', `${fontSize}rem`)
            root.setProperty('--time-font-weight', fontWeight)
            root.setProperty('--time-opacity', opacityValue)
            root.setProperty('--time-width', `${fontWidth}px`)
        },

        // 日期样式（0-100）
        updateDateStyle() {
            const baseFontSize = 1.15
            const maxIncrease = 5
            const fontSize = baseFontSize + (this.dateFontSize / 100) * maxIncrease
            const fontWeight = 100 + (this.dateFontWeight / 100) * 800
            const opacityValue = this.dateFontOpacity / 100
            const fontWidth = 13.5 + (this.dateFontWidth / 100) * 50

            const root = document.documentElement.style
            root.setProperty('--date-font-size', `${fontSize}rem`)
            root.setProperty('--date-font-weight', fontWeight)
            root.setProperty('--date-opacity', opacityValue)
            root.setProperty('--date-width', `${fontWidth}px`)
        },

        // 全局样式（blur 0-100 → 0-24px，字重 100-900）
        updateMainStyle() {
            const mainFontWeight = 100 + (this.mainFontWeight / 100) * 800
            const blurValue = (this.mainBoxBlur / 100) * 24

            const root = document.documentElement.style
            root.setProperty('--main-font-weight', mainFontWeight)
            root.setProperty('--main-box-gauss', `${blurValue}px`)
        },

        updateSearchBlur() {
            const disabled = !this.searchBlur
            document.documentElement.style.setProperty(
                '--search-blur',
                disabled ? 'blur(0px)' : 'var(--main-box-gauss-plus)'
            )
        },

        updateBlurPlusStyle() {
            const enabled = this.blurPlus
            document.documentElement.style.setProperty(
                '--main-box-gauss-plus',
                enabled
                    ? 'blur(calc(var(--main-box-gauss) * 1.533))'
                    : 'blur(var(--main-box-gauss))'
            )
        },

        updateBgCover() {
            const cover = document.querySelector('.bg-all .cover')
            if (cover) cover.style.opacity = this.bgCover ? '1' : '0'
        },

        updateDateDisplay() {
            const root = document.documentElement.style
            const toggleDate = document.getElementById('toggle_date')
            if (!this.dateDisplay) {
                root.setProperty('--date-display-opacity', '0')
                root.setProperty('--date-display-margin', '-12px')
                if (toggleDate) toggleDate.style.display = 'none'
            } else {
                root.setProperty('--date-display-opacity', 'var(--date-opacity)')
                root.setProperty('--date-display-margin', '0px')
                if (toggleDate) toggleDate.style.display = ''
            }
        },

        updateClockBlink() {
            document.documentElement.style.setProperty(
                '--clock-blink-animation',
                this.clockBlink ? 'fadenum 2s infinite' : 'none'
            )
        },

        updateClockNumAnimation() {
            document.documentElement.style.setProperty(
                '--clock-num-animation-enabled',
                this.clockNumAnimation ? 'running' : 'paused'
            )
        },

        updateFooterDisplay() {
            const foot = document.querySelector('.foot')
            if (foot) foot.style.opacity = this.footerDisplay ? '1' : '0'
        },

        updateBgVideoSound() {
            const video = document.getElementById('bg-video')
            if (video) video.muted = !this.bgVideoSound
        },

        /* 初始化
            读取并应用全部样式 */
        applyAll() {
            // `--main-box-gauss` 初始值优先使用遗留的 gaussianBlur
            const legacyGauss = LS.raw.get(KEY.gaussianBlur)
            if (legacyGauss !== null) {
                document.documentElement.style.setProperty('--main-box-gauss', legacyGauss)
            }

            this.updateTimeStyle()
            this.updateDateStyle()
            this.updateMainStyle()
            this.updateBlurPlusStyle()
            this.updateSearchBlur()
            this.updateBgCover()
            this.updateDateDisplay()
            this.updateClockBlink()
            this.updateClockNumAnimation()
            this.updateFooterDisplay()
            this.updateBgVideoSound()
        }
    }
})
