// ==Npplication==
// @name    高级设置
// @id    advancedSettings
// @version    1.0.4
// @updateUrl    https://nfdb.nitai.us.kg/advancedSettings.js
// @description    用于开关高级设置
// @author    Nitai
// @type    coreNpp
// @time    head
// @icon    https://nitai-images.pages.dev/nitaiPage/advancedSettings.svg
// @forced    true
// @setting    true
// @screen    [`https://nitai-images.pages.dev/nitaiPage/store/advancedSettings_screen.webp`]
// ==/Npplication==

// 检查高级设置是否启用
function isAdvancedSettingEnabled() {
    return localStorage.getItem('advancedSettingEnabled') === 'on';
}

// 创建设置开关
function createAdvancedSettingSwitch() {
    const pluginId = 'advancedSettings';
    const mainConts = document.querySelector(`.mainConts[data-value="${pluginId}"]`);

    if (mainConts) {
        const settingDiv = document.createElement('div');
        settingDiv.className = 'set_tip';
        settingDiv.style = 'width: 100%';
        settingDiv.innerHTML = `
                <style>
                .advancedSetting_switch-container {
                    display: flex;
                    flex-direction: row;
                    flex-wrap: nowrap;
                    justify-content: space-between;
                    align-items: center;
                }
                </style>
                <div class="advancedSetting_switch-container">
                    <div>
                        <span class="set_text"><big>高级设置开关&nbsp;</big><br></span>
                        <span class="set_text" style="color: gray;"><small>启用高级功能设置</small></span>
                    </div>
                    <div class="switch" id="toggleAdvancedSetting"></div>
                </div>
            `;
        mainConts.appendChild(settingDiv);
    }
}

(function () {
    // 等待插件设置创建完成后再初始化设置
    document.addEventListener('pluginSettingsTemplateReady', function () {
        // 初始化设置开关
        createAdvancedSettingSwitch();

        const toggleSwitch = $('#toggleAdvancedSetting');
        const savedState = localStorage.getItem('advancedSettingEnabled') || 'off';

        // 设置初始状态
        if (savedState === 'on') {
            toggleSwitch.addClass('on');
        }

        // 开关点击事件
        toggleSwitch.on('click', function () {
            const isOn = $(this).hasClass('on');
            if (isOn) {
                $(this).removeClass('on');
                localStorage.setItem('advancedSettingEnabled', 'off');
                iziToast.show({
                    timeout: 4000,
                    message: '设置成功，刷新生效',
                    buttons: [
                        ['<button class="refresh-btn">刷新</button>', function (instance, toast) {
                            instance.hide({ transitionOut: 'flipOutX' }, toast, 'confirm');
                            window.location.reload(true);
                        }, true],
                        ['<button class="later-btn">稍后</button>', function (instance, toast) {
                            instance.hide({ transitionOut: 'flipOutX' }, toast, 'cancel');
                        }]
                    ]
                });
            } else {
                $(this).addClass('on');
                localStorage.setItem('advancedSettingEnabled', 'on');
                iziToast.show({
                    timeout: 4000,
                    message: '设置成功，刷新生效',
                    buttons: [
                        ['<button class="refresh-btn">刷新</button>', function (instance, toast) {
                            instance.hide({ transitionOut: 'flipOutX' }, toast, 'confirm');
                            window.location.reload(true);
                        }, true],
                        ['<button class="later-btn">稍后</button>', function (instance, toast) {
                            instance.hide({ transitionOut: 'flipOutX' }, toast, 'cancel');
                        }]
                    ]
                });
            }
        });
    });
})();

//加载完成后执行
window.addEventListener('load', function () {
    if (!isAdvancedSettingEnabled()) {
        var style = document.createElement('style');
        style.textContent = '.advancedSetting { display: none !important; }';
        document.head.appendChild(style);
        setInterval(() => {
            document.querySelectorAll('.advancedSetting').forEach(function (el) {
                el.remove();
            });
        }, 10000);
    }
});
