// 第三方插件全局依赖

import iziToast from 'izitoast';
import Cookies from 'js-cookie';
import Sortable from 'sortablejs';
import chroma from 'chroma-js';
import { getColorSync, getPaletteSync } from 'colorthief';

// colorthief 3.x 改为命名导出，new ColorThief() + getColor/getPalette 同步返回 [r,g,b]
class ColorThief {
    getColor(source, quality = 10) {
        const options = quality && typeof quality === 'object' ? { ...quality } : { quality };
        const color = getColorSync(source, options);
        return color ? [...color.srgb] : null;
    }

    getPalette(source, colorCount = 10, quality = 10) {
        const options = colorCount && typeof colorCount === 'object' ? { ...colorCount } : { colorCount, quality };
        const palette = getPaletteSync(source, options);
        return palette ? palette.map((color) => [...color.srgb]) : null;
    }
}

// 时钟数位
// 返回 HTML 串，供插件拼进 innerHTML
const prevTimeDigits = {};
const prevDayDigits = {};

function wrapDigitsHtml(numStr, type, digitClass, store) {
    const previous = store[type] || '';
    const animate = localStorage.getItem('clockNumAnimation') === 'true';
    const html = String(numStr).split('').map((digit, index) => {
        const changing = previous[index] !== digit && animate ? 'changing' : '';
        return `<div class="${digitClass} ${changing}">${digit}</div>`;
    }).join('');
    store[type] = String(numStr);
    return html;
}

const wrapTimeDigits = (numStr, type) => wrapDigitsHtml(numStr, type, 'timeNum', prevTimeDigits);
const wrapDayDigits = (numStr, type) => wrapDigitsHtml(numStr, type, 'dayNum', prevDayDigits);

// 居中公告弹窗
function showAnnouncement(title, content, buttonText = '@global:toast-close') {
    const formatted = content ? content.replace(/\n/g, '<br>') : '@global:toast-no-content';
    iziToast.show({
        title: title || '@global:toast-no-title',
        message: formatted,
        position: 'center',
        timeout: false,
        close: false,
        overlay: true,
        transitionIn: 'fadeIn',
        transitionOut: 'fadeOut',
        transitionInMobile: 'fadeIn',
        transitionOutMobile: 'fadeOut',
        buttons: [
            ['<button>' + buttonText + '</button>', function (instance, toast) {
                instance.hide({ transitionOut: 'fadeOut' }, toast, 'button');
            }, true]
        ]
    });
}

const GLOBALS = {
    iziToast,
    Cookies,
    Sortable,
    chroma,
    ColorThief,
    wrapTimeDigits,
    wrapDayDigits,
    showAnnouncement
};

/**
 * 把兼容全局暴露到 window（已存在的同名全局不覆盖）
 * @returns {string[]} 本次新暴露的全局名
 */
export function installPluginGlobals() {
    if (typeof window === 'undefined') return [];

    const installed = [];

    for (const [name, value] of Object.entries(GLOBALS)) {
        if (value === undefined || value === null) continue;
        if (window[name] !== undefined) continue;
        window[name] = value;
        installed.push(name);
    }

    return installed;
}

export { GLOBALS };
