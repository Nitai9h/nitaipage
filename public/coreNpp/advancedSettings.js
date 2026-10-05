// ==Npplication==
// @name    高级设置
// @id    advancedSettings
// @version    1.0.7
// @updateUrl    https://nfdb.nitai.us.kg/advancedSettings.js
// @description    用于开关高级设置
// @author    Nitai
// @type    coreNpp
// @time    head
// @icon    https://nitai-images.pages.dev/nitaiPage/advancedSettings.svg
// @forced    true
// @setting    true
// @screen    [`https://nitai-images.pages.dev/nitaiPage/advancedSettings_screen.webp`]
// ==/Npplication==

// 对外暴露：window.nppAdvancedSettings
(function () {
    'use strict';

    // 检查高级设置是否启用
    function isAdvancedSettingEnabled() {
        return localStorage.getItem('advancedSettingEnabled') === 'on';
    }

    function initAdvancedSettings() {
        if (typeof window === 'undefined') return;

        const applyVisibility = function () {
            const style = document.createElement('style');
            if (!isAdvancedSettingEnabled()) {
                style.textContent = '.advancedSetting { display: none !important; }';
                document.head.appendChild(style);
                setInterval(function () {
                    document.querySelectorAll('.advancedSetting').forEach(function (el) { el.remove(); });
                }, 10000);
            } else {
                style.textContent = '.unAdvancedSetting { display: none !important; }';
                document.head.appendChild(style);
                setInterval(function () {
                    document.querySelectorAll('.unAdvancedSetting').forEach(function (el) { el.remove(); });
                }, 10000);
            }
        };

        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', applyVisibility);
        } else {
            applyVisibility();
        }
    }

    // 对外暴露
    window.nppAdvancedSettings = {
        isAdvancedSettingEnabled: isAdvancedSettingEnabled,
        isEnabled: isAdvancedSettingEnabled,
        initAdvancedSettings: initAdvancedSettings,
        init: initAdvancedSettings
    };
})();
