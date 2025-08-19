// ==Npplication==
// @name    主题色
// @id    themeColor
// @version    0.4.0
// @updateUrl    https://nfdb.nitai.us.kg/themeColor.js
// @description    主题扩展插件
// @author    Nitai
// @type    coreNpp
// @time    head
// @icon    https://nitai-images.pages.dev/nitaiPage/themeColor.svg
// @forced    true
// @setting    true
// @screen    [`https://nitai-images.pages.dev/nitaiPage/store/themeColor_screen.webp`]
// ==/Npplication==

// 检查动态主题是否启用
function isDynamicThemeEnabled() {
    return localStorage.getItem('dynamicTheme') === 'on';
}

// 检查白色主题是否启用
function isWhiteThemeEnabled() {
    return localStorage.getItem('whiteTheme') === 'on';
}

// 对比度计算
function calculateContrastRatio(color1, color2) {
    // 使用 chroma 计算对比度
    return chroma.contrast(color1, color2);
}

// 引入三方库
let colorThiefLoaded = false;
let chromaLoaded = false;

function checkLibrariesLoaded() {
    if (colorThiefLoaded && chromaLoaded && isDynamicThemeEnabled() && !isWhiteThemeEnabled()) {
        // 初始化主题颜色
        if (document.getElementById('bg') && document.getElementById('bg').src) {
            setTimeout(() => {
                setThemeByImage(document.getElementById('bg').src);
            }, 1000);
        }
    }
}

// 创建设置
function createThemeSetting() {
    const pluginId = 'themeColor';
    const mainConts = document.querySelector(`.mainConts[data-value="${pluginId}"]`);

    if (mainConts) {
        const dythemeDiv = document.createElement('div');
        dythemeDiv.id = 'themeColor_dytheme';
        dythemeDiv.className = 'set_tip set_tip_new';
        dythemeDiv.style = 'width: 100%';
        dythemeDiv.innerHTML = `
                <style>
                .themeColor_switch-container {
                    display: flex;
                    flex-direction: row;
                    flex-wrap: nowrap;
                    justify-content: space-between;
                    align-items: center;
                }
                </style>
                <div class="themeColor_switch-container">
                    <div>
                        <span class="set_text"><big>白色主题&nbsp;</big><br></span>
                        <span class="set_text" style="color: gray;"><small>是否切换为白色主题</small></span>
                    </div>
                    <div class="switch" id="togglewhitetheme"></div>
                </div>
                <div class="themeColor_switch-container">
                    <div>
                        <span class="set_text"><big>动态主题(Beta)&nbsp;</big><br></span>
                        <span class="set_text" style="color: gray;"><small>根据壁纸切换主题</small></span>
                    </div>
                    <div class="switch" id="toggledytheme"></div>
                </div>
            `;
        mainConts.appendChild(dythemeDiv);
    }
}

(function () {
    // 加载 color-thief
    const colorThiefScript = document.createElement('script');
    colorThiefScript.src = './js/modules/color-thief.min.js';
    colorThiefScript.onload = () => {
        colorThiefLoaded = true;
        checkLibrariesLoaded();
    };

    // 加载 chroma.js
    const chromaScript = document.createElement('script');
    chromaScript.src = './js/modules/chroma.min.js';
    chromaScript.onload = () => {
        chromaLoaded = true;
        checkLibrariesLoaded();
    };
    document.head.appendChild(chromaScript);

    // 等待插件设置创建完成后再初始化设置
    document.addEventListener('pluginSettingsTemplateReady', function () {
        createThemeSetting();

        // 初始化主题开关
        const toggleSwitch = $('#toggledytheme');
        const savedState = localStorage.getItem('dynamicTheme') || 'off';

        // 设置初始状态
        if (savedState === 'on') {
            toggleSwitch.addClass('on');
        }

        // 初始化白色主题状态
        if (isWhiteThemeEnabled()) {
            applyWhiteTheme();
        }

        // 开关点击
        toggleSwitch.on('click', function () {
            const isOn = $(this).hasClass('on');
            if (isOn) {
                $(this).removeClass('on');
                localStorage.setItem('dynamicTheme', 'off');
                resetThemeColors();
            } else {
                $(this).addClass('on');
                localStorage.setItem('dynamicTheme', 'on');
                // 关闭白色主题
                $('#togglewhitetheme').removeClass('on');
                localStorage.setItem('whiteTheme', 'off');
                resetThemeColors();
                // 应用主题
                if (document.getElementById('bg') && document.getElementById('bg').src) {
                    const imgUrl = sessionStorage.getItem('bgImageFinalURL');
                    setThemeByImage(imgUrl);
                }
            }
        });

        // 白色主题开关
        const whiteThemeSwitch = $('#togglewhitetheme');
        const whiteThemeState = localStorage.getItem('whiteTheme') || 'off';

        // 设置初始状态
        if (whiteThemeState === 'on') {
            whiteThemeSwitch.addClass('on');
        }

        // 白色主题开关点击
        whiteThemeSwitch.on('click', function () {
            const isOn = $(this).hasClass('on');
            if (isOn) {
                $(this).removeClass('on');
                localStorage.setItem('whiteTheme', 'off');
                resetThemeColors();
            } else {
                $(this).addClass('on');
                localStorage.setItem('whiteTheme', 'on');
                // 关闭动态主题
                $('#toggledytheme').removeClass('on');
                localStorage.setItem('dynamicTheme', 'off');
                applyWhiteTheme();
            }
        });
    });
    document.head.appendChild(colorThiefScript);
})();

function applyThemeColors(originalColors) {
    // 获取背景颜色
    const bgColor = getComputedStyle(document.documentElement).getPropertyValue('--main-background-color') || '#ffffff';

    // 计算每个颜色的对比度
    const colorsWithContrast = originalColors.map(color => {
        const ratio = calculateContrastRatio(color, bgColor);
        return {
            color,
            ratio,
            meetsStandard: ratio >= 4.5 // WCAG-AA标准
        };
    });

    // 按对比度排序
    const sortedColors = [...colorsWithContrast]
        .sort((a, b) => b.ratio - a.ratio);

    // 选择最佳颜色
    const bestColor = sortedColors.find(c => c.meetsStandard) || sortedColors[0];
    const textColor = bestColor.color;

    try {
        // 获取主色调
        const primaryColor = originalColors[0];

        // 应用
        document.documentElement.style.setProperty('--main-background-color', chroma(primaryColor).saturate(-0.2).alpha(0.25).hex());
        document.documentElement.style.setProperty('--main-background-hover-color', chroma(primaryColor).saturate(-0.2).alpha(0.35).hex());
        document.documentElement.style.setProperty('--main-background-active-color', chroma(primaryColor).saturate(-0.2).alpha(0.5).hex());
        document.documentElement.style.setProperty('--main-text-color', chroma(textColor).brighten(0.3).hex());
        document.documentElement.style.setProperty('--main-text-form-hover-color', chroma(textColor).brighten(0.3).hex());
        document.documentElement.style.setProperty('--border-bottom-color-hover', chroma(textColor).brighten(0.3).hex() + 80);
        document.documentElement.style.setProperty('--border-bottom-color-active', chroma(textColor).brighten(0.3).hex());

        // 应用按钮颜色
        document.documentElement.style.setProperty('--main-button-color', chroma(textColor).alpha(0.25).hex());
        document.documentElement.style.setProperty('--main-button-hover-color', chroma(textColor).alpha(0.18).hex());
        document.documentElement.style.setProperty('--main-button-active-color', chroma(textColor).alpha(0.12).hex());

        // 应用输入框颜色
        document.documentElement.style.setProperty('--main-input-color', chroma(textColor).alpha(0.18).hex());
        document.documentElement.style.setProperty('--main-input-text-placeholder-color', chroma(textColor).alpha(0.43).hex());

        // 壁纸遮罩
        document.documentElement.style.setProperty('--main-bg-blur', 'blur(calc(var(--main-box-gauss) * 0.666)) brightness(0.90)');

    } catch (error) {
        console.error('应用主题颜色时出错:', error);
    }
}

// 恢复默认主题颜色
function resetThemeColors() {
    document.documentElement.style.setProperty('--main-text-color', '#efefef');
    document.documentElement.style.setProperty('--main-text-form-hover-color', '#efefef');
    document.documentElement.style.setProperty('--main-background-color', '#00000040');
    document.documentElement.style.setProperty('--main-background-hover-color', '#acacac60');
    document.documentElement.style.setProperty('--main-background-active-color', '#8a8a8a80');
    document.documentElement.style.setProperty('--border-bottom-color-hover', '#efefef80');
    document.documentElement.style.setProperty('--border-bottom-color-active', '#efefef');

    // 重置按钮颜色
    document.documentElement.style.setProperty('--main-button-color', '#ffffff40');
    document.documentElement.style.setProperty('--main-button-hover-color', '#00000030');
    document.documentElement.style.setProperty('--main-button-active-color', '#00000020');

    // 重置输入框颜色
    document.documentElement.style.setProperty('--main-input-color', '#ffffff30');
    document.documentElement.style.setProperty('--main-input-text-placeholder-color', '#ffffff70');

    // 壁纸遮罩
    document.documentElement.style.setProperty('--main-bg-blur', 'blur(calc(var(--main-box-gauss) * 0.666))');
}

// 应用白色主题
function applyWhiteTheme() {
    document.documentElement.style.setProperty('--main-text-color', '#ffffff');
    document.documentElement.style.setProperty('--main-text-form-hover-color', '#ffffff');
    document.documentElement.style.setProperty('--main-background-color', '#ffffff30');
    document.documentElement.style.setProperty('--main-background-hover-color', '#ffffff70');
    document.documentElement.style.setProperty('--main-background-active-color', '#ffffff30');
    document.documentElement.style.setProperty('--border-bottom-color-hover', '#ffffff57');
    document.documentElement.style.setProperty('--border-bottom-color-active', '#ffffff38');

    // 设置按钮颜色
    document.documentElement.style.setProperty('--main-button-color', '#ffffff30');
    document.documentElement.style.setProperty('--main-button-hover-color', '#ffffff45');
    document.documentElement.style.setProperty('--main-button-active-color', '#ffffff17');

    // 设置输入框颜色
    document.documentElement.style.setProperty('--main-input-color', '#ffffff30');
    document.documentElement.style.setProperty('--main-input-text-placeholder-color', '#ffffff70');

    // 壁纸遮罩
    document.documentElement.style.setProperty('--main-bg-blur', 'blur(calc(var(--main-box-gauss) * 0.666)) brightness(0.90)');
}

/**
 * 根据背景图片设置主题颜色
 * @param {string} imageUrl 图片URL
 */
async function setThemeByImage(imageUrl) {
    try {
        // 获取莫奈风格的主色调
        const colors = await getMonetColors(imageUrl, 3);

        // 应用
        applyThemeColors(colors);
    } catch (error) {
        console.error('设置主题颜色失败:', error);
    }
}

// 等待背景图片加载完成
const bgChannel = new BroadcastChannel("bgLoad");
bgChannel.onmessage = (event) => {
    if (event.data === "bgImgLoadinged" && isDynamicThemeEnabled()) {
        // 获取背景图片
        const bgImage = document.getElementById('bg');
        if (bgImage && bgImage.complete && bgImage.src) {
            // 检查图片有效性
            if (bgImage.naturalWidth !== 0 && bgImage.naturalHeight !== 0) {
                setThemeByImage(bgImage.src);
            } else {
                console.warn('Background image not fully loaded, skipping theme update');
            }
        } else if (bgImage && bgImage.src) {
            // 图片存在但未加载完成，等待加载完成
            bgImage.addEventListener('load', () => {
                setThemeByImage(bgImage.src);
            }, { once: true });
        }
    }
};

/**
 * 获取图片主色
 * @param {string|HTMLImageElement} source 图片地址/DOM元素
 * @param {number} [quality=5] 颜色数量[01-10]
 * @returns {Promise<string[]>} 颜色十六进制字符串数组
 */
async function getColors(source, quality = 5) {
    return new Promise((resolve, reject) => {
        const colorThief = new ColorThief();

        // 参数验证
        if (typeof quality !== 'number' || quality < 1 || quality > 10) {
            console.error('The number of colors must be between 1-10');
            return reject();
        }

        const processImage = (img) => {
            try {
                // 获取颜色数据
                const colors = quality === 1 ? [colorThief.getColor(img)] : colorThief.getPalette(img, quality);

                // 转换为十六进制
                const hexColors = [];
                for (let i = 0; i < colors.length; i++) {
                    const color = colors[i];
                    // 提取RGB值并验证
                    const [r, g, b] = color;
                    // 转换为十六进制
                    const hexColor = `#${[r, g, b].map(c => c.toString(16).padStart(2, '0')).join('')}`;
                    hexColors.push(hexColor);
                }
                resolve(hexColors);
            } catch (error) {
                console.error('颜色获取失败:' + error);
                reject();
            }
        };

        // 处理
        if (typeof source === 'string') {
            const img = new Image();
            img.crossOrigin = 'Anonymous';
            img.src = source;
            img.onload = () => processImage(img);
            img.onerror = (e) => {
                console.error('Image load failed:' + e.errorMsg);
                reject();
            };
        } else if (source instanceof HTMLImageElement) {
            processImage(source);
        } else {
            console.error('未获取到图片资源');
            reject();
        }
    });
};

/**
 * 莫奈色系转换
 * @param {string} color 传入颜色[HEX]
 * @returns {string} 输出颜色[HEX]
 */
function turnToMonet(color) {
    // 验证输入颜色的格式
    if (!color || !color.startsWith('#') || color.length !== 7) {
        return '#000000';
    }

    // 处理
    try {
        let monetColor = chroma(color)
            .saturate(0.5)  // 提高饱和度
            .brighten(0.8)   // 提高亮度
            .hex();
        return monetColor;
    } catch (e) {
        console.error('颜色转换失败:', e);
    }
};

/**
 * 获取图片主色 (莫奈色系)
 * @param {string|HTMLImageElement} source 图片地址/DOM元素
 * @param {number} [quality=5] 颜色数量[01-10]
 * @returns {Promise<string[]>} 莫奈风格颜色数组
 */
async function getMonetColors(source, quality = 5) {
    try {
        const originalColors = await getColors(source, quality);
        return originalColors.map(color => turnToMonet(color));
    } catch (error) {
        console.error('getMonetColors:' + error);
        throw new Error(error);
    }
};