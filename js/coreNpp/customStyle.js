// ==Npplication==
// @name    自定义样式
// @id    customStyle
// @version    1.1.3
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
        customStyleDiv.innerHTML = `
                <style>
                .customStyle-container > .set_tip {
                    flex-direction: row;
                    align-items: center;
                    gap: 5px;
                    margin: 0px;
                    background-color: unset;
                    padding: 0px;
                }
                #customStyle_setting {
                    width: -webkit-fill-available;
                    width: -moz-available;
                    max-height: -webkit-fill-available;
                    max-height: -moz-available;
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
                    min-height: 40px;
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
                    <div class="set_tip">
                        <i class="iconfont icon-act" style="font-size: 32px;"></i>
                        <span class="set_text">
                            @customStyle:setting-custom-style-warning1
                            <span class="unAdvancedSetting">@customStyle:setting-custom-style-warning2</span>
                        </span>
                    </div>
                    <div class="advancedSetting">
                        <span class="set_text"><big>@customStyle:setting-custom-css-style-title &nbsp;</big><br></span>
                        <span class="set_text" style="color: gray;"><small>@customStyle:setting-custom-css-style-desc</small></span>
                        <textarea id="customCSS" class="customStyle-textarea" placeholder="@customStyle:setting-custom-css-style-placeholder"></textarea>
                    </div>
                    <div class="customStyle-buttons advancedSetting">
                        <button id="resetCustomStyle" class="customStyle-button">@customStyle:setting-custom-css-style-reset</button>
                        <button id="saveCustomStyle" class="customStyle-button">@customStyle:setting-custom-css-style-save</button>
                    </div>
                </div>
            `;
        mainConts.appendChild(customStyleDiv);
    }
}

function sanitizeCSS(cssText) {
    if (!cssText || typeof cssText !== 'string') return '';

    const MAX_CSS_LENGTH = 100000;
    if (cssText.length > MAX_CSS_LENGTH) return '';

    let sanitized = cssText;

    const dangerousPatterns = [
        /\bexpression\s*\(/gi,
        /javascript:/gi,
        /vbscript:/gi,
        /data:\s*text\/html/gi,
        /data:\s*text\/javascript/gi,
        /data:\s*application\/javascript/gi,
        /data:\s*image\/svg\+xml/gi,
        /@import\s+/gi,
        /behavior:\s*url\(/gi,
        /-moz-binding\s*:/gi,
        /-webkit-binding\s*:/gi,
        /@-webkit-keyframes/gi,
        /@-moz-keyframes/gi,
        /@keyframes\s*\{[^}]*\}/gi,
        /@-webkit-keyframes\s*\{[^}]*\}/gi,
        /@-moz-keyframes\s*\{[^}]*\}/gi,
        /@font-face\s*\{[^}]*\}/gi,
        /<script[^>]*>.*?<\/script>/gis,
        /<iframe[^>]*>.*?<\/iframe>/gis,
        /<object[^>]*>.*?<\/object>/gis,
        /<embed[^>]*>.*?<\/embed>/gis,
        /on\w+\s*=/gi,
        /eval\s*\(/gi,
        /setTimeout\s*\(/gi,
        /setInterval\s*\(/gi,
        /Function\s*\(/gi,
        /document\.(write|writeln)/gi,
        /window\.location/gi,
        /\.innerHTML\s*=/gi,
        /\.outerHTML\s*=/gi,
        /document\.cookie/gi,
        /localStorage\.getItem/gi,
        /sessionStorage\.getItem/gi
    ];

    dangerousPatterns.forEach(pattern => {
        sanitized = sanitized.replace(pattern, '');
    });

    const urlPattern = /url\s*\(\s*['"]?([^'")\s]+)['"]?\s*\)/gi;
    sanitized = sanitized.replace(urlPattern, function (match, url) {
        if (/^(https?:|\/)/i.test(url)) {
            return match;
        }
        return '';
    });

    const contentPattern = /content\s*:\s*['"]([^'"]*)['"]/gi;
    sanitized = sanitized.replace(contentPattern, function (match, content) {
        const safeContent = content.replace(/[<>&'"]/g, function (c) {
            const entities = {
                '<': '&lt;',
                '>': '&gt;',
                '&': '&amp;',
                "'": '&#39;',
                '"': '&quot;'
            };
            return entities[c];
        });
        return match.replace(content, safeContent);
    });

    return sanitized;
}

function applyCustomCSS(cssText) {
    removeCustomCSS();

    if (!cssText || typeof cssText !== 'string') return;

    const sanitizedCSS = sanitizeCSS(cssText);

    if (!sanitizedCSS || sanitizedCSS.trim() === '') return;

    const styleElement = document.createElement('style');
    styleElement.id = 'customUserStyle';
    styleElement.textContent = sanitizedCSS;

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
    const validateLocalStorageCSS = function (css) {
        if (!css || typeof css !== 'string') return null;

        const sanitized = sanitizeCSS(css);
        if (!sanitized || sanitized.trim() === '') return null;

        return sanitized;
    };

    document.addEventListener('pluginSettingsTemplateReady', function () {
        createCustomStyleSetting();

        const savedCSSForInput = localStorage.getItem('customCSS');
        const validatedCSSForInput = validateLocalStorageCSS(savedCSSForInput);
        if (validatedCSSForInput) {
            $('#customCSS').val(savedCSSForInput);
        }

        $(document).on('click', '#saveCustomStyle', function () {
            const cssText = $('#customCSS').val();
            localStorage.setItem('customCSS', cssText);
            iziToast.show({
                message: '@global:setting-save-success',
                timeout: 2000
            });
            applyCustomCSS(cssText);
        });

        $(document).on('click', '#resetCustomStyle', function () {
            $('#customCSS').val('');
            localStorage.removeItem('customCSS');
            iziToast.show({
                message: '@customStyle:setting-custom-css-style-reset-success',
                timeout: 2000
            });
            removeCustomCSS();
        });
    });

    $(document).ready(function () {
        const savedCSS = localStorage.getItem('customCSS');
        const validatedCSS = validateLocalStorageCSS(savedCSS);
        if (validatedCSS) {
            applyCustomCSS(validatedCSS);
        }
    });
})();