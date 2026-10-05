<script setup>
// 面板 tab
import PanelSection from '@/components/panel/items/PanelSection.vue'
import PanelSlider from '@/components/panel/items/PanelSlider.vue'
import PanelSwitch from '@/components/panel/items/PanelSwitch.vue'
import { useI18n } from 'vue-i18n'

const { t } = useI18n()

const props = defineProps({
    settings: { type: Object, required: true }
})

</script>

<template>
    <div class="mainConts set_blocks">
        <div class="panelContent">
            <!-- 时间 / 日期 分区 -->
            <div class="slider-container">
                <PanelSection :title="$t('@global:setting-time-date')">
                    <!-- 时间 -->
                    <div id="toggle_time" class="set_tip set_tip_new text_right"
                        style="display: flex; flex-direction: column; flex-wrap: nowrap; justify-content: center; align-items: center;">
                        <PanelSlider id="font-size-slider" advanced
                            :title="$t('@global:setting-font-size')" :description="$t('@global:setting-font-size-description')"
                            :model-value="settings.timeFontSize" @update:model-value="settings.setTimeFontSize" />
                        <PanelSlider id="font-width-time" advanced
                            :title="$t('@global:setting-font-width')" :description="$t('@global:setting-font-width-description')"
                            :model-value="settings.timeFontWidth" @update:model-value="settings.setTimeFontWidth" />
                        <PanelSlider id="font-thick-slider"
                            :title="$t('@global:setting-font-thickness')" :description="$t('@global:setting-font-thickness-description')"
                            :model-value="settings.timeFontWeight" @update:model-value="settings.setTimeFontWeight" />
                        <PanelSlider id="font-opacity-slider"
                            :title="$t('@global:setting-font-opacity')" :description="$t('@global:setting-font-opacity-description')"
                            :model-value="settings.timeFontOpacity" @update:model-value="settings.setTimeFontOpacity" />
                    </div>
                    <!-- 日期 -->
                    <div id="toggle_date" class="set_tip set_tip_new text_right"
                        style="display: flex; flex-direction: column; flex-wrap: nowrap; justify-content: center; align-items: center;">
                        <PanelSlider id="font-size-date" advanced
                            :title="$t('@global:setting-font-size-date')" :description="$t('@global:setting-font-size-date-description')"
                            :model-value="settings.dateFontSize" @update:model-value="settings.setDateFontSize" />
                        <PanelSlider id="font-width-date" advanced
                            :title="$t('@global:setting-font-width-date')" :description="$t('@global:setting-font-width-date-description')"
                            :model-value="settings.dateFontWidth" @update:model-value="settings.setDateFontWidth" />
                        <PanelSlider id="font-thick-date"
                            :title="$t('@global:setting-font-thickness-date')" :description="$t('@global:setting-font-thickness-date-description')"
                            :model-value="settings.dateFontWeight" @update:model-value="settings.setDateFontWeight" />
                        <PanelSlider id="font-opacity-date"
                            :title="$t('@global:setting-font-opacity-date')" :description="$t('@global:setting-font-opacity-date-description')"
                            :model-value="settings.dateFontOpacity" @update:model-value="settings.setDateFontOpacity" />
                    </div>
                    <!-- 日期显示 / 补零 / 12 小时制 -->
                    <div class="set_tip set_tip_new">
                        <PanelSwitch id="toggle-date-display"
                            :title="$t('@global:setting-date-display')" :description="$t('@global:setting-date-display-description')"
                            :model-value="settings.dateDisplay" @update:model-value="settings.setDateDisplay" />
                        <PanelSwitch id="toggle-zero-padding"
                            :title="$t('@global:setting-zero-padding')" :description="$t('@global:setting-zero-padding-description')"
                            :model-value="settings.zeroPadding" @update:model-value="settings.setZeroPadding" />
                        <PanelSwitch id="toggle-time-format"
                            :title="$t('@global:setting-time-format')" :description="$t('@global:setting-time-format-description')"
                            :model-value="settings.timeFormat12h" @update:model-value="settings.setTimeFormat12h" />
                    </div>
                    <!-- 时钟闪烁 / 数字动效 -->
                    <div class="set_tip set_tip_new">
                        <PanelSwitch id="toggle-clock-blink"
                            :title="$t('@global:setting-clock-blink')" :description="$t('@global:setting-clock-blink-description')"
                            :model-value="settings.clockBlink" @update:model-value="settings.setClockBlink" />
                        <PanelSwitch id="toggle-clock-num"
                            :title="$t('@global:setting-clock-num')" :description="$t('@global:setting-clock-num-description')"
                            :model-value="settings.clockNumAnimation" @update:model-value="settings.setClockNumAnimation" />
                    </div>
                </PanelSection>
            </div>

            <!-- 页面 分区 -->
            <div class="global-settings">
                <PanelSection :title="$t('@global:setting-page')">
                    <div class="switch-container">
                        <div class="set_tip set_tip_new">
                            <PanelSwitch id="toggle-blur-plus"
                                :title="$t('@global:setting-blur-plus')" :description="$t('@global:setting-blur-plus-description')"
                                :model-value="settings.blurPlus" @update:model-value="settings.setBlurPlus" />
                            <PanelSwitch id="toggle-search-blur"
                                :title="$t('@global:setting-search-blur')" :description="$t('@global:setting-search-blur-description')"
                                :model-value="settings.searchBlur" @update:model-value="settings.setSearchBlur" />
                            <PanelSlider id="main-box-gauss"
                                :title="$t('@global:setting-blur-plus-gauss')" :description="$t('@global:setting-blur-plus-gauss-description')"
                                :model-value="settings.mainBoxBlur" @update:model-value="settings.setMainBoxBlur" />
                        </div>
                        <div class="set_tip set_tip_new">
                            <PanelSlider id="main-font-weight"
                                :title="$t('@global:setting-font-weight')" :description="$t('@global:setting-font-weight-description')"
                                :model-value="settings.mainFontWeight" @update:model-value="settings.setMainFontWeight" />
                        </div>
                        <div class="set_tip set_tip_new">
                            <PanelSwitch id="toggle-footer-display"
                                :title="$t('@global:setting-footer-display')" :description="$t('@global:setting-footer-display-description')"
                                :model-value="settings.footerDisplay" @update:model-value="settings.setFooterDisplay" />
                        </div>
                    </div>
                </PanelSection>
            </div>
        </div>
    </div>
</template>
