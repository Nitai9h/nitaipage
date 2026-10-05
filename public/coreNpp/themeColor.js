// ==Npplication==
// @name    主题色
// @id    themeColor
// @version    0.4.3
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

// 依赖：window.chroma / window.ColorThief
// 对外暴露：window.nppThemeColor
(function () {
    'use strict';

    // 开关读取

    function isDynamicThemeEnabled() {
        return localStorage.getItem('dynamicTheme') === 'on';
    }

    function isWhiteThemeEnabled() {
        return localStorage.getItem('whiteTheme') === 'on';
    }

    function chromaOf() {
        return typeof window !== 'undefined' ? window.chroma : undefined;
    }

    function calculateContrastRatio(color1, color2) {
        const chroma = chromaOf();
        if (!chroma) return 0;
        return chroma.contrast(color1, color2);
    }

    // 恢复默认主题颜色
    function resetThemeColors() {
        const root = document.documentElement.style;
        root.setProperty('--main-text-color', '#efefef');
        root.setProperty('--main-text-form-hover-color', '#efefef');
        root.setProperty('--main-background-color', '#00000040');
        root.setProperty('--main-background-hover-color', '#acacac60');
        root.setProperty('--main-background-active-color', '#8a8a8a80');
        root.setProperty('--border-bottom-color-hover', '#efefef80');
        root.setProperty('--border-bottom-color-active', '#efefef');

        root.setProperty('--main-button-color', '#ffffff40');
        root.setProperty('--main-button-hover-color', '#00000030');
        root.setProperty('--main-button-active-color', '#00000020');

        root.setProperty('--main-input-color', '#ffffff30');
        root.setProperty('--main-input-text-placeholder-color', '#ffffff70');

        root.setProperty('--main-bg-blur', 'blur(calc(var(--main-box-gauss) * 0.666))');
    }

    // 应用白色主题
    function applyWhiteTheme() {
        const root = document.documentElement.style;
        root.setProperty('--main-text-color', '#ffffff');
        root.setProperty('--main-text-form-hover-color', '#ffffff');
        root.setProperty('--main-background-color', '#ffffff30');
        root.setProperty('--main-background-hover-color', '#ffffff70');
        root.setProperty('--main-background-active-color', '#ffffff30');
        root.setProperty('--border-bottom-color-hover', '#ffffff57');
        root.setProperty('--border-bottom-color-active', '#ffffff38');

        root.setProperty('--main-button-color', '#ffffff30');
        root.setProperty('--main-button-hover-color', '#ffffff45');
        root.setProperty('--main-button-active-color', '#ffffff17');

        root.setProperty('--main-input-color', '#ffffff30');
        root.setProperty('--main-input-text-placeholder-color', '#ffffff70');

        root.setProperty('--main-bg-blur', 'blur(calc(var(--main-box-gauss) * 0.666)) brightness(0.90)');
    }

    // 根据主色数组应用主题（对比度筛选 + 变量写入）
    function applyThemeColors(originalColors) {
        resetThemeColors();
        const bgColor = '#00000040';

        const colorsWithContrast = originalColors.map(function (color) {
            const ratio = calculateContrastRatio(color, bgColor);
            return { color: color, ratio: ratio, meetsStandard: ratio >= 4.5 };
        });

        const sortedColors = colorsWithContrast.slice().sort(function (a, b) {
            return b.ratio - a.ratio;
        });
        const bestColor = sortedColors.find(function (c) { return c.meetsStandard; }) || sortedColors[0];
        const textColor = bestColor.color;

        const chroma = chromaOf();
        if (!chroma) {
            console.warn('[nppThemeColor] 缺少 chroma，跳过主题色计算');
            return;
        }

        try {
            const primaryColor = originalColors[0];

            document.documentElement.style.setProperty('--main-background-color', chroma(primaryColor).saturate(-0.2).alpha(0.25).hex());
            document.documentElement.style.setProperty('--main-background-hover-color', chroma(primaryColor).saturate(-0.2).alpha(0.35).hex());
            document.documentElement.style.setProperty('--main-background-active-color', chroma(primaryColor).saturate(-0.2).alpha(0.5).hex());
            document.documentElement.style.setProperty('--main-text-color', chroma(textColor).brighten(0.3).hex());
            document.documentElement.style.setProperty('--main-text-form-hover-color', chroma(textColor).brighten(0.3).hex());
            document.documentElement.style.setProperty('--border-bottom-color-hover', chroma(textColor).brighten(0.3).hex() + 80);
            document.documentElement.style.setProperty('--border-bottom-color-active', chroma(textColor).brighten(0.3).hex());

            document.documentElement.style.setProperty('--main-button-color', chroma(textColor).alpha(0.25).hex());
            document.documentElement.style.setProperty('--main-button-hover-color', chroma(textColor).alpha(0.18).hex());
            document.documentElement.style.setProperty('--main-button-active-color', chroma(textColor).alpha(0.12).hex());

            document.documentElement.style.setProperty('--main-input-color', chroma(textColor).alpha(0.18).hex());
            document.documentElement.style.setProperty('--main-input-text-placeholder-color', chroma(textColor).alpha(0.43).hex());

            document.documentElement.style.setProperty('--main-bg-blur', 'blur(calc(var(--main-box-gauss) * 0.666)) brightness(0.90)');
        } catch (error) {
            console.error('应用主题颜色时出错:', error);
        }
    }

    // 根据背景图片设置主题颜色
    async function setThemeByImage(imageUrl) {
        try {
            const colors = await getMonetColors(imageUrl, 3);
            applyThemeColors(colors);
        } catch (error) {
            console.error('设置主题颜色失败:', error);
        }
    }

    // 等待背景图加载完成的广播通道
    let bgChannel = null;

    function ensureBgChannel() {
        if (bgChannel) return bgChannel;
        if (typeof BroadcastChannel === 'undefined') return null;

        bgChannel = new BroadcastChannel('bgLoad');
        bgChannel.onmessage = function (event) {
            if (event.data === 'bgImgLoadinged' && isDynamicThemeEnabled()) {
                const bgImage = document.getElementById('bg');
                if (bgImage && bgImage.complete && bgImage.src) {
                    if (bgImage.naturalWidth !== 0 && bgImage.naturalHeight !== 0) {
                        setThemeByImage(bgImage.src);
                    } else {
                        console.warn('Background image not fully loaded, skipping theme update');
                    }
                } else if (bgImage && bgImage.src) {
                    bgImage.addEventListener('load', function () { setThemeByImage(bgImage.src); }, { once: true });
                }
            }
        };
        return bgChannel;
    }

    // 获取图片主色（quality: 1-10）
    function getColors(source, quality) {
        quality = quality === undefined ? 5 : quality;
        return new Promise(function (resolve, reject) {
            const ColorThiefCtor = typeof window !== 'undefined' ? window.ColorThief : undefined;
            if (!ColorThiefCtor) {
                console.warn('[nppThemeColor] 缺少 ColorThief，无法取色');
                reject();
                return;
            }
            const colorThief = new ColorThiefCtor();

            if (typeof quality !== 'number' || quality < 1 || quality > 10) {
                console.error('The number of colors must be between 1-10');
                reject();
                return;
            }

            const processImage = function (img) {
                try {
                    const colors = quality === 1
                        ? [colorThief.getColor(img)]
                        : colorThief.getPalette(img, quality);
                    const hexColors = [];
                    for (let i = 0; i < colors.length; i++) {
                        const color = colors[i];
                        const r = color[0], g = color[1], b = color[2];
                        const hexColor = '#' + [r, g, b].map(function (c) {
                            return c.toString(16).padStart(2, '0');
                        }).join('');
                        hexColors.push(hexColor);
                    }
                    resolve(hexColors);
                } catch (error) {
                    console.error('颜色获取失败:' + error);
                    reject();
                }
            };

            if (typeof source === 'string') {
                const img = new Image();
                img.crossOrigin = 'Anonymous';
                img.src = source;
                img.onload = function () { processImage(img); };
                img.onerror = function (e) {
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
    }

    // 莫奈色系转换
    function turnToMonet(color) {
        if (!color || !color.startsWith('#') || color.length !== 7) {
            return '#000000';
        }
        const chroma = chromaOf();
        if (!chroma) return color;
        try {
            return chroma(color).saturate(0.5).brighten(0.8).hex();
        } catch (e) {
            console.error('颜色转换失败:', e);
            return color;
        }
    }

    // 获取图片主色（莫奈色系）
    async function getMonetColors(source, quality) {
        try {
            const originalColors = await getColors(source, quality === undefined ? 5 : quality);
            return originalColors.map(function (color) { return turnToMonet(color); });
        } catch (error) {
            console.error('getMonetColors:' + error);
            throw new Error(error);
        }
    }

    // 初始化
    function initThemeColor() {
        if (typeof window === 'undefined') return;

        ensureBgChannel();

        if (isWhiteThemeEnabled()) {
            applyWhiteTheme();
        } else if (isDynamicThemeEnabled()) {
            const bgImage = document.getElementById('bg');
            if (bgImage && bgImage.src) {
                const imgUrl = sessionStorage.getItem('bgImageFinalURL') || bgImage.src;
                setThemeByImage(imgUrl);
            }
        }
    }

    // 对外暴露
    window.nppThemeColor = {
        isDynamicThemeEnabled: isDynamicThemeEnabled,
        isWhiteThemeEnabled: isWhiteThemeEnabled,
        resetThemeColors: resetThemeColors,
        applyWhiteTheme: applyWhiteTheme,
        applyThemeColors: applyThemeColors,
        setThemeByImage: setThemeByImage,
        getColors: getColors,
        turnToMonet: turnToMonet,
        getMonetColors: getMonetColors,
        initThemeColor: initThemeColor
    };
})();
