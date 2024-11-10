// 时间time

// 字体大小
const fontSizeSlider = document.getElementById('font-size-slider');
const timeText = document.getElementById('time_text');

// 字体粗细
const fontThickSlider = document.getElementById('font-thick-slider');

// 字体透明度
const opacitySlider = document.getElementById('font-opacity-slider');

function setCookie(name, value, days) {
    let expires = '';
    if (days) {
        let date = new Date();
        date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
        expires = '; expires=' + date.toUTCString();
    }
    document.cookie = name + '=' + (value || '') + expires + '; path=/';
}

function getCookie(name) {
    let cookieName = name + '=';
    let decodedCookie = decodeURIComponent(document.cookie);
    let ca = decodedCookie.split(';');
    for (let i = 0; i < ca.length; i++) {
        let c = ca[i];
        while (c.charAt(0) === ' ') {
            c = c.substring(1);
        }
        if (c.indexOf(cookieName) === 0) {
            return c.substring(cookieName.length, c.length);
        }
    }
    return '';
}

// 初始化滑块
fontSizeSlider.value = parseInt(getCookie('fontSize'), 10) || 0;
fontThickSlider.value = parseInt(getCookie('fontThick'), 10) || 0;
opacitySlider.value = parseInt(getCookie('opacity'), 10) || 100;

// 字体大小
fontSizeSlider.addEventListener('input', function() {
    const maxIncrease = 3; // 最大增加量为 3rem
    const fontSize = 2.75 + (this.value / 100) * maxIncrease; // 计算字体大小
    timeText.style.fontSize = fontSize + 'rem'; // 设置新字体大小
    setCookie('fontSize', this.value, 365); // 保存字体大小到 cookie
});

// 字体粗细
fontThickSlider.addEventListener('input', function() {
    const fontWeight = 100 + (this.value / 100) * 800; // 计算 font-weight
    timeText.style.fontWeight = fontWeight; // 设置新 font-weight
    setCookie('fontThick', this.value, 365); // 保存字体粗细到 cookie
});

// 字体透明度
opacitySlider.addEventListener('input', function() {
    const opacity = this.value / 100; // 计算 opacity
    timeText.style.opacity = opacity; // 设置新 opacity
    setCookie('opacity', this.value, 365); // 保存透明度到 cookie
});

// 日期date

// 字体大小
const dayFontSizeSlider = document.getElementById('font-size-date');
const day = document.getElementById('day');

// 字体粗细
const dayFontThickSlider = document.getElementById('font-thick-date');

// 字体透明度
const dayOpacitySlider = document.getElementById('font-opacity-date');

function setCookie(name, value, days) {
    let expires = '';
    if (days) {
        let date = new Date();
        date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
        expires = '; expires=' + date.toUTCString();
    }
    document.cookie = name + '=' + (value || '') + expires + '; path=/';
}

function getCookie(name) {
    let cookieName = name + '=';
    let decodedCookie = decodeURIComponent(document.cookie);
    let ca = decodedCookie.split(';');
    for (let i = 0; i < ca.length; i++) {
        let c = ca[i];
        while (c.charAt(0) === ' ') {
            c = c.substring(1);
        }
        if (c.indexOf(cookieName) === 0) {
            return c.substring(cookieName.length, c.length);
        }
    }
    return '';
}

// 初始化滑块
dayFontSizeSlider.value = parseInt(getCookie('dayFontSize'), 10) || 0;
dayFontThickSlider.value = parseInt(getCookie('dayFontThick'), 10) || 0;
dayOpacitySlider.value = parseInt(getCookie('dayOpacity'), 10) || 100;


// 字体大小
dayFontSizeSlider.addEventListener('input', function() {
    const maxIncrease = 3; // 最大增加量为 3rem
    const fontSize = 1.05 + (this.value / 100) * maxIncrease; // 计算字体大小
    day.style.fontSize = fontSize + 'rem'; // 设置新字体大小
    setCookie('dayFontSize', this.value, 30); // 保存字体大小到 cookie
});

// 字体粗细
dayFontThickSlider.addEventListener('input', function() {
    const fontWeight = 100 + (this.value / 100) * 800; // 计算 font-weight
    day.style.fontWeight = fontWeight; // 设置新 font-weight
    setCookie('dayFontThick', this.value, 30); // 保存字体粗细到 cookie
});

// 字体透明度
dayOpacitySlider.addEventListener('input', function() {
    const opacity = this.value / 100; // 计算 opacity
    day.style.opacity = opacity; // 设置新 opacity
    setCookie('dayOpacity', this.value, 30); // 保存透明度到 cookie
});

// 日期lunar

// 字体大小
const lunarFontSizeSlider = document.getElementById('font-size-lunar');
const lunar = document.getElementById('lunar_date');

// 字体粗细
const lunarFontThickSlider = document.getElementById('font-thick-lunar');

// 字体透明度
const lunarOpacitySlider = document.getElementById('font-opacity-lunar');

function setCookie(name, value, days) {
    let expires = '';
    if (days) {
        let date = new Date();
        date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
        expires = '; expires=' + date.toUTCString();
    }
    document.cookie = name + '=' + (value || '') + expires + '; path=/';
}

function getCookie(name) {
    let cookieName = name + '=';
    let decodedCookie = decodeURIComponent(document.cookie);
    let ca = decodedCookie.split(';');
    for (let i = 0; i < ca.length; i++) {
        let c = ca[i];
        while (c.charAt(0) === ' ') {
            c = c.substring(1);
        }
        if (c.indexOf(cookieName) === 0) {
            return c.substring(cookieName.length, c.length);
        }
    }
    return '';
}

// 初始化滑块
lunarFontSizeSlider.value = parseInt(getCookie('lunarFontSize'), 10) || 0;
lunarFontThickSlider.value = parseInt(getCookie('lunarFontThick'), 10) || 0;
lunarOpacitySlider.value = parseInt(getCookie('lunarOpacity'), 10) || 100;


// 字体大小
lunarFontSizeSlider.addEventListener('input', function() {
    const maxIncrease = 2.5; // 最大增加量为 2.5rem
    const fontSize = 0.8 + (this.value / 100) * maxIncrease; // 计算字体大小
    lunar.style.fontSize = fontSize + 'rem'; // 设置新字体大小
    setCookie('lunarFontSize', this.value, 30); // 保存字体大小到 cookie
});

// 字体粗细
lunarFontThickSlider.addEventListener('input', function() {
    const fontWeight = 100 + (this.value / 100) * 800; // 计算 font-weight
    lunar.style.fontWeight = fontWeight; // 设置新 font-weight
    setCookie('lunarFontThick', this.value, 30); // 保存字体粗细到 cookie
});

// 字体透明度
lunarOpacitySlider.addEventListener('input', function() {
    const opacity = this.value / 100; // 计算 opacity
    lunar.style.opacity = opacity; // 设置新 opacity
    setCookie('lunarOpacity', this.value, 30); // 保存透明度到 cookie
});