// localStorage 读写
// bool值偏好有 'true'/'false' 与 'on'/'off' 两种风格，均原样保留

export const LS = {
    raw: {
        get(key, def = null) {
            const value = localStorage.getItem(key);
            return value === null ? def : value;
        },
        set(key, value) {
            localStorage.setItem(key, value);
        },
        remove(key) {
            localStorage.removeItem(key);
        }
    },

    // 'true'/'false' 风格，默认值 false
    bool(key, def = false) {
        const value = localStorage.getItem(key);
        if (value === null) return def;
        return value === 'true';
    },

    setBool(key, value) {
        localStorage.setItem(key, value ? 'true' : 'false');
    },

    // 'on'/'off' 风格，默认值 off
    toggle(key, def = 'off') {
        return localStorage.getItem(key) || def;
    },

    isOn(key, def = 'off') {
        return (localStorage.getItem(key) || def) === 'on';
    },

    setOn(key, on) {
        localStorage.setItem(key, on ? 'on' : 'off');
    },

    // 数字型偏好
    num(key, def = 0) {
        const value = parseInt(localStorage.getItem(key), 10);
        return Number.isNaN(value) ? def : value;
    },

    setNum(key, value) {
        localStorage.setItem(key, String(value));
    }
};

// 统一设置存储写入口
// 当前仅写 localStorage
// 后续还可加入 配置档案 / 多套主题 时不用再改每个 setter
export function persist(key, value) {
    localStorage.setItem(key, value === true ? 'true' : value === false ? 'false' : String(value));
}

// 默认值
const DEFAULTS = {
    timeFormat12h: 'false',
    zeroPadding: 'true',
    searchBlur: 'true',
    blurPlus: 'false',
    bgCover: 'true',
    dateDisplay: 'true',
    clockBlink: 'true',
    clockNumAnimation: 'true',
    bgVideoSound: 'true',
    footerDisplay: 'true',
    autoUpdatePlugins: 'on'
};

// 跳过已存在的键
export function initDefaultSettings() {
    Object.entries(DEFAULTS).forEach(([key, value]) => {
        if (localStorage.getItem(key) === null) localStorage.setItem(key, value);
    });
}

export const KEY = {
    // 时钟
    timeFontSize: 'timeFontSize',
    timeFontWeight: 'timeFontWeight',
    timeFontOpacity: 'timeFontOpacity',
    timeFontWidth: 'timeFontWidth',
    dateFontSize: 'dateFontSize',
    dateFontWeight: 'dateFontWeight',
    dateFontOpacity: 'dateFontOpacity',
    dateFontWidth: 'dateFontWidth',
    dateDisplay: 'dateDisplay',
    zeroPadding: 'zeroPadding',
    timeFormat12h: 'timeFormat12h',
    clockBlink: 'clockBlink',
    clockNumAnimation: 'clockNumAnimation',
    // 页面
    mainBoxBlur: 'mainBoxBlur',
    mainFontWeight: 'mainFontWeight',
    blurPlus: 'blurPlus',
    searchBlur: 'searchBlur',
    footerDisplay: 'footerDisplay',
    gaussianBlur: 'gaussianBlur',
    gaussianOpacity: 'gaussianOpacity',
    blackCover: 'blackCover',
    colorCover: 'colorCover',
    bgCover: 'bgCover',
    bgVideoSound: 'bgVideoSound',
    foldTime: 'foldTime',
    // 搜索 / 捷径
    seDefault: 'se_default',
    // 壁纸
    wallpaperType: 'bg_img',
    // 插件
    autoUpdatePlugins: 'autoUpdatePlugins',
    // i18n
    installedTranslationLang: 'installedTranslationLang',
    autoInstallTranslation: 'autoInstallTranslation',
    autoInstallTranslationGlobal: 'autoInstallTranslationGlobal',
    // 主题
    dynamicTheme: 'dynamicTheme',
    whiteTheme: 'whiteTheme',
    advancedSettingEnabled: 'advancedSettingEnabled',
    // 引导
    visited: 'nitaiPageVisited',
};

export const VISITED_VERSION = '3';
