<script setup>
// 关于 tab
import { VERSION } from '@/core/version'
import PanelLink from '@/components/panel/items/PanelLink.vue'

const year = new Date().getFullYear()
const faviconUrl = import.meta.env.BASE_URL + 'favicon.ico'
</script>

<template>
    <div class="mainConts set_blocks">
        <div class="aboutContainer set_blocks_content">
            <div class="set_tip_about">
                <span class="set_text" style="text-align: center;">
                    <img id="favo-icon" :src="faviconUrl" style="width: 32px; height: 32px;"><br>
                    <span id="version-number">{{ VERSION }}</span>
                    <br><big>{{ $t('@global:nitaipage') }}</big>
                </span>
            </div>
            <div class="set_tip_about">
                <div class="set_version">
                    <span class="set_text"><big>{{ $t('@global:setting-set-more-copyright-info') }}</big></span>
                    <span class="set_version-text set_version-text-mobile">Copyright&nbsp;©
                        {{ year }}&nbsp;<a class="text_hover" href="https://nitai.us.kg/">Nitai</a>
                    </span>
                    <span class="set_version-text2 mobile">
                        Released&nbsp;under&nbsp;the&nbsp;Apache-2.0&nbsp;License.&nbsp;All&nbsp;rights&nbsp;reserved.
                    </span>
                    <span class="set_version-text2 desktop" style="font-size:0.7rem">
                        Released&nbsp;under&nbsp;the&nbsp;Apache-2.0&nbsp;License.
                    </span>
                    <span class="set_version-text2 desktop" style="font-size:0.7rem">
                        All&nbsp;rights&nbsp;reserved.
                    </span>
                    <span class="set_version-text2 mobile">Powered&nbsp;By&nbsp;<a target="_blank">Snavigation-v1.1</a>&nbsp;
                        (Open&nbsp;Source&nbsp;By&nbsp;<a class="text_hover" href="https://www.imsyy.top/" target="_blank">imsyy</a>)
                    </span>
                    <span class="set_version-text2 desktop">Powered&nbsp;By&nbsp;<a target="_blank" style="font-size: 0.8rem;">Snavigation-v1.1</a>
                    </span>
                    <span class="set_version-text2 desktop">
                        (Open&nbsp;Source&nbsp;By&nbsp;<a class="text_hover" href="https://www.imsyy.top/" target="_blank">imsyy</a>)
                    </span>
                </div>
            </div>
            <PanelLink title="@global:setting-set-more-update-log" href="https://nitaipage.nitai.cc/guide/updatelog.html" />
            <PanelLink title="Github" href="https://github.com/Nitai9h/nitaipage" />
        </div>
    </div>
</template>
