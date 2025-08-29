// ==Npplication==
// @name    自定义样式
// @id    customStyle
// @version    1.0.0
// @updateUrl    https://nfdb.nitai.us.kg/customStyle.js
// @description    用户可以自定义CSS
// @author    Nitai
// @type    coreNpp
// @time    body
// @icon    https://nitai-images.pages.dev/nitaiPage/customStyle.svg
// @forced    true
// @setting    true
// ==/Npplication==

// 创建自定义样式设置
function createCustomStyleSetting() {
    const pluginId = 'customStyle';
    const mainConts = document.querySelector(`.mainConts[data-value="${pluginId}"]`);

    if (mainConts) {
        const customStyleDiv = document.createElement('div');
        customStyleDiv.id = 'customStyle_setting';
        customStyleDiv.className = 'set_tip set_tip_new';
        customStyleDiv.style = 'width: 100%';
        customStyleDiv.innerHTML = `
                <style>
                #customStyle_setting {
                    width: 100%;
                    height: -webkit-fill-available;
                    height: -moz-available;
                }
                .customStyle-container {
                    display: flex;
                    flex-direction: column;
                    gap: 15px;
                    width: 100%;
                    overflow-y: auto;
                    justify-content: space-between;
                    height: 100%;
                }
                .customStyle-container > div { 
                    display: flex;
                    flex-direction: column;
                    gap: 5px;
                }
                .customStyle-textarea {
                    min-height: 20px;
                    padding: 10px;
                    border-radius: 8px;
                    background: var(--main-background-color);
                    color: var(--main-text-color);
                    border: 0px !important;
                    margin-right: 5px;
                    -webkit-user-select: auto;
                    user-select: auto;
                }
                .customStyle-buttons {
                    justify-content: flex-end;
                    flex-direction: row !important;
                    margin-right: 5px;
                    justify-content: center;
                }
                .customStyle-button {
                    width: 25%;
                    display: flex;
                    height: 40px;
                    border-radius: 8px;
                    background: var(--main-background-color);
                    margin: 0 20px;
                    justify-content: center;
                    align-items: center;
                    transition: 0.3s;
                    border-style: unset;
                    box-shadow: var(--main-search-shadow);
                    -webkit-box-shadow: var(--main-search-shadow);
                }
                .customStyle-button:hover {
                    cursor: pointer;
                    background: var(--main-background-hover-color);
                    transition: 0.3s;
                }
                .customStyle-button:active {
                    transform: scale(0.90);
                    background: var(--main-background-active-color);
                    transition: 0.3s;
                }
                </style>
                <div class="customStyle-container">
                    <div>
                        <span class="set_text"><big>自定义CSS&nbsp;</big><br></span>
                        <span class="set_text" style="color: gray;"><small>添加自定义CSS样式</small></span>
                        <textarea id="customCSS" class="customStyle-textarea" placeholder="在此粘贴 CSS 样式..."></textarea>
                    </div>
                    <div class="customStyle-buttons">
                        <button id="resetCustomStyle" class="customStyle-button">重置</button>
                        <button id="saveCustomStyle" class="customStyle-button">保存</button>
                    </div>
                </div>
            `;
        mainConts.appendChild(customStyleDiv);
    }
}

function applyCustomCSS(cssText) {
    removeCustomCSS();

    const styleElement = document.createElement('style');
    styleElement.id = 'customUserStyle';
    styleElement.innerHTML = cssText;

    document.body.appendChild(styleElement);
}

// 移除 CSS
function removeCustomCSS() {
    const customStyle = document.getElementById('customUserStyle');
    if (customStyle) {
        customStyle.remove();
    }
}

(function () {
    // 等待插件设置创建完成
    document.addEventListener('pluginSettingsTemplateReady', function () {
        createCustomStyleSetting();

        const savedCSSForInput = localStorage.getItem('customCSS');
        if (savedCSSForInput) {
            $('#customCSS').val(savedCSSForInput);
        }

        $(document).on('click', '#saveCustomStyle', function () {
            const cssText = $('#customCSS').val();
            localStorage.setItem('customCSS', cssText);
            applyCustomCSS(cssText);
        });

        $(document).on('click', '#resetCustomStyle', function () {
            $('#customCSS').val('');
            localStorage.removeItem('customCSS');
            removeCustomCSS();
        });
    });

    $(document).ready(function () {
        const savedCSS = localStorage.getItem('customCSS');
        if (savedCSS) {
            applyCustomCSS(savedCSS);
        }
    });
})();

