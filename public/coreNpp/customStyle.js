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

// 对外暴露：window.nppCustomStyle
(function () {
    'use strict';

    const MAX_CSS_LENGTH = 100000;

    // 净化自定义 CSS
    function sanitizeCSS(cssText) {
        if (!cssText || typeof cssText !== 'string') return '';

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
            /<script\b[^>]*>[\s\S]*?<\/script\b[^>]*>/gi,
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

        dangerousPatterns.forEach(function (pattern) {
            sanitized = sanitized.replace(pattern, '');
        });

        const urlPattern = /url\s*\(\s*['"]?([^'")\s]+)['"]?\s*\)/gi;
        sanitized = sanitized.replace(urlPattern, function (match, url) {
            if (/^(https?:|\/)/i.test(url)) return match;
            return '';
        });

        const contentPattern = /content\s*:\s*['"]([^'"]*)['"]/gi;
        sanitized = sanitized.replace(contentPattern, function (match, content) {
            const safeContent = content.replace(/[<>&'"]/g, function (c) {
                const entities = { '<': '&lt;', '>': '&gt;', '&': '&amp;', "'": '&#39;', '"': '&quot;' };
                return entities[c];
            });
            return match.replace(content, safeContent);
        });

        return sanitized;
    }

    // 校验 localStorage 中的 CSS 是否可安全注入
    function validateLocalStorageCSS(css) {
        if (!css || typeof css !== 'string') return null;
        const sanitized = sanitizeCSS(css);
        if (!sanitized || sanitized.trim() === '') return null;
        return sanitized;
    }

    // 注入 / 替换自定义 CSS（#customUserStyle）
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

    // 移除已注入的自定义 CSS
    function removeCustomCSS() {
        const customStyle = document.getElementById('customUserStyle');
        if (customStyle) customStyle.remove();
    }

    // 启动时应用已保存的自定义 CSS（由应用在插件加载完成后调用）
    function initCustomStyle() {
        if (typeof window === 'undefined') return;
        const run = function () {
            const savedCSS = localStorage.getItem('customCSS');
            const validatedCSS = validateLocalStorageCSS(savedCSS);
            if (validatedCSS) applyCustomCSS(validatedCSS);
        };
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', run);
        } else {
            run();
        }
    }

    // 对外暴露
    window.nppCustomStyle = {
        sanitizeCSS: sanitizeCSS,
        validateLocalStorageCSS: validateLocalStorageCSS,
        applyCustomCSS: applyCustomCSS,
        removeCustomCSS: removeCustomCSS,
        initCustomStyle: initCustomStyle,
        init: initCustomStyle
    };
})();
