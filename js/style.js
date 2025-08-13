//禁用右键
document.oncontextmenu = new Function("return false");

var t = null;

// 时钟等宽效果辅助函数
function wrapTimeDigits(numStr) {
    return numStr.split('').map(digit => `<div class="timeNum">${digit}</div>`).join('');
}
function wrapDayDigits(numStr) {
    return numStr.split('').map(digit => `<div class="dayNum">${digit}</div>`).join('');
}

function time() {
    clearTimeout(t);
    dt = new Date();
    var mm = dt.getMonth() + 1;
    var d = dt.getDate();
    var weekday = ["周日", "周一", "周二", "周三", "周四", "周五", "周六"];
    var day = dt.getDay();
    var h = dt.getHours();
    var m = dt.getMinutes();

    const is12Hour = localStorage.getItem('timeFormat12h') === 'true';
    const zeroPad = localStorage.getItem('zeroPadding') === 'true';

    if (is12Hour) {
        var ampm = h >= 12 ? 'PM' : 'AM';
        ampmHTML = '<span class="ampm">' + ampm + '</span>';
        h = h % 12 || 12;
    } else {
        ampmHTML = '';
    }

    // 格式化
    h = zeroPad ? (h < 10 ? "0" + h : h) : h;
    m = m < 10 ? "0" + m : m;
    mm = zeroPad ? (mm < 10 ? "0" + mm : mm) : mm;
    d = zeroPad ? (d < 10 ? "0" + d : d) : d;

    $("#time_text").html(
        wrapTimeDigits(h.toString())
        + '<span id="point">:</span>' + wrapTimeDigits(m.toString())
    );
    $("#ampm").html(
        ampmHTML
    );
    $("#day").html(wrapDayDigits(mm.toString()) + "&nbsp;月&nbsp;" + '<span id="point"></span>'
        + wrapDayDigits(d.toString()) + "&nbsp;日&nbsp;" + '<span id="point"></span>'
        + weekday[day]);
    t = setTimeout(time, 1000);
}

function updateSearchBlur() {
    const isEnabled = localStorage.getItem('searchBlur') === 'true';
    if (isEnabled) {
        document.documentElement.style.setProperty('--search-blur', 'var(--main-box-gauss-plus)');
    } else {
        document.documentElement.style.setProperty('--search-blur', 'blur(0px)');
    }
}

function updateBlurPlusStyle() {
    const isEnabled = localStorage.getItem('blurPlus') === 'true';
    if (isEnabled) {
        document.documentElement.style.setProperty('--main-box-gauss-plus', 'blur(calc(var(--main-box-gauss) * 1.533))');
    } else {
        document.documentElement.style.setProperty('--main-box-gauss-plus', 'blur(var(--main-box-gauss))');
    }
}

function updateBgCover() {
    const isEnabled = localStorage.getItem('bgCover') === 'true';
    if (isEnabled) {
        $('.bg-all .cover').css('opacity', '1');
    } else {
        $('.bg-all .cover').css('opacity', '0');
    }
}

function updateDateDisplay() {
    const isEnabled = localStorage.getItem('dateDisplay') === 'true';
    if (isEnabled) {
        document.documentElement.style.setProperty('--date-display-opacity', '1');
        document.documentElement.style.setProperty('--date-display-margin', '0px');
    } else {
        document.documentElement.style.setProperty('--date-display-opacity', '0');
        document.documentElement.style.setProperty('--date-display-margin', '-12px');
    }
}

function updateClockBlink() {
    const isEnabled = localStorage.getItem('clockBlink') === 'true';
    if (isEnabled) {
        document.documentElement.style.setProperty('--clock-blink-animation', 'fadenum 2s infinite');
    } else {
        document.documentElement.style.setProperty('--clock-blink-animation', 'none');
    }
}

const blurValue = localStorage.getItem('gaussianBlur') || '12px';
document.documentElement.style.setProperty('--main-box-gauss', `${blurValue}px`);

var frameStyle = frameStyle || {}; // 定义一个命名空间

// 淡入
frameStyle.fadeIn = function (id, duration = 1000, delay = 0, direction = '') {
    const referenceId = document.getElementById(id);
    if (!referenceId) {
        console.error(`Element with id "${id}" not found`);
        return;
    }

    referenceId.classList.remove('fadeHidden');

    // 初始化
    let initialTransform = '';
    switch (direction) {
        case 'top': initialTransform = 'translateY(-42%)'; break;
        case 'bottom': initialTransform = 'translateY(42%)'; break;
        case 'left': initialTransform = 'translateX(-38%)'; break;
        case 'right': initialTransform = 'translateX(38%)'; break;
        case 'center': initialTransform = 'scale(0.7)'; break;
        default: initialTransform = 'translate(0)';
    }

    referenceId.style.opacity = '0';
    referenceId.style.transform = initialTransform;
    referenceId.style.transition = 'none';

    void referenceId.offsetWidth;

    // 持续时间
    referenceId.style.transition = `opacity ${duration}ms ease, transform ${duration}ms ease`;

    setTimeout(() => {
        referenceId.style.opacity = '1';
        referenceId.style.transform = 'translate(0)';
    }, delay);
};

// 淡出
frameStyle.fadeOut = function (id, duration = 1000, delay = 0, direction = '') {
    const referenceId = document.getElementById(id);
    if (!referenceId) {
        console.error(`Element with id "${id}" not found`);
        return;
    }

    // 初始化
    referenceId.classList.remove('fadeHidden');

    // 持续时间
    referenceId.style.transition = `opacity ${duration}ms ease, transform ${duration}ms ease`;

    void referenceId.offsetWidth;

    setTimeout(() => {
        let transformStyle = '';
        switch (direction) {
            case 'top': transformStyle = 'translateY(-42%)'; break;
            case 'bottom': transformStyle = 'translateY(42%)'; break;
            case 'left': transformStyle = 'translateX(-38%)'; break;
            case 'right': transformStyle = 'translateX(38%)'; break;
            case 'center': transformStyle = 'scale(0.7)'; break;
            default: transformStyle = 'translate(0)';
        }

        // 监听过渡结束事件
        const handleTransitionEnd = () => {
            referenceId.classList.add('fadeHidden');
            referenceId.removeEventListener('transitionend', handleTransitionEnd);
        };
        referenceId.addEventListener('transitionend', handleTransitionEnd);

        // 应用变换和透明度
        referenceId.style.transform = transformStyle;
        referenceId.style.opacity = '0';
    }, delay);
};

// 置顶
frameStyle.zTop = function (id) {
    const target = document.getElementById(id);
    if (!target) {
        console.error(`Element with id "${id}" not found`);
        return;
    }

    // 遍历并找出 z-index 最大值
    let maxZIndex = 0;
    document.querySelectorAll('*').forEach(el => {
        const zIndex = window.getComputedStyle(el).zIndex;
        if (zIndex !== 'auto') {
            const z = parseInt(zIndex, 10);
            if (!isNaN(z) && z > maxZIndex) {
                maxZIndex = z;
            }
        }
    });

    target.style.zIndex = maxZIndex + 1;
};

// 普通遮罩
// 创建一个默认隐藏的遮罩
frameStyle.blackCover = function (id, opacityParam, colorParam) {
    let cover = document.getElementById('blackCover');
    if (cover) {
        console.warn('There is already a mask, wait for it to be destroyed before creating it again');
        return;
    } else {
        frameStyle.zTop(id);
    }

    // 透明度
    let opacity;
    if (typeof opacityParam === 'number' && opacityParam >= 0 && opacityParam <= 100) {
        opacity = opacityParam / 100;
    } else {
        const blackCover = localStorage.getItem('blackCover');
        opacity = blackCover ? parseInt(blackCover) / 100 : 0.5;
    }

    // 颜色
    let isWhite;
    if (colorParam === 'white' || colorParam === 'black') {
        isWhite = (colorParam === 'white');
    } else {
        const colorCover = localStorage.getItem('colorCover');
        isWhite = colorCover ? colorCover.toLowerCase() === 'white' : false;
    }

    // 创建遮罩
    cover = document.createElement('div');
    cover.id = 'blackCover';
    cover.classList.add('fadeHidden');
    document.body.appendChild(cover);

    // 设置样式
    Object.assign(cover.style, {
        position: 'fixed',
        top: '0',
        left: '0',
        width: '100%',
        height: '100%',
        zIndex: '999',
        backgroundColor: `rgba(${isWhite ? '255,255,255' : '0,0,0'}, ${opacity})`,
        pointerEvents: 'auto'
    });
};

// 高斯模糊遮罩
// 创建一个默认隐藏的遮罩
frameStyle.guassianCover = function (id, blurParam, opacityParam) {
    let cover = document.getElementById('guassianCover');
    if (cover) {
        console.warn('There is already a Gaussian mask, wait for it to be destroyed before creating it again');
        return;
    } else {
        frameStyle.zTop(id);
    }

    // 创建遮罩
    cover = document.createElement('div');
    cover.id = 'guassianCover';
    cover.classList.add('fadeHidden');
    document.body.appendChild(cover);

    // 模糊度
    let blur;
    if (typeof blurParam === 'number' && blurParam >= 0) {
        blur = `${blurParam}px`;
    } else {
        blur = localStorage.getItem('gaussianBlur') || '5px';
    }

    // 透明度
    let opacity;
    if (typeof opacityParam === 'number' && opacityParam >= 0 && opacityParam <= 1) {
        opacity = opacityParam;
    } else {
        opacity = localStorage.getItem('gaussianOpacity') || '0.5';
    }

    // 设置样式
    Object.assign(cover.style, {
        position: 'fixed',
        top: '0',
        left: '0',
        width: '100%',
        height: '100%',
        zIndex: '998',
        backgroundColor: `rgba(255, 255, 255, ${opacity})`,
        backdropFilter: `blur(${blur})`,
        pointerEvents: 'auto',
        transition: 'opacity 0.3s ease, filter 0.3s ease'
    });
};

// 创建 Loading
frameStyle.createLoading = function () {
    const loadingId = 'loading';
    let loading = document.getElementById(loadingId);
    if (loading) {
        console.warn('Loading element already exists');
        return false;
    }

    loading = document.createElement('div');
    loading.id = loadingId;
    Object.assign(loading.style, {
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'transparent',
        opacity: 1,
    });

    document.body.appendChild(loading)

    this.loaderLoading(loading);

    return;
};

// 加载 Loading
frameStyle.loaderLoading = function (loading) {

    // 创建遮罩
    this.blackCover('loading');
    this.guassianCover('loading', 15, 0.2);

    const loader = document.createElement('div');
    loader.className = 'loader';

    // 设置样式
    Object.assign(loader.style, {
        position: 'relative',
        width: '100px',
        height: '100px',
        borderRadius: '50%',
        background: 'linear-gradient(#14ffe9, #ffeb3b, #ff00e0)',
        animation: 'animate 0.8s linear infinite'
    });

    // 内圆
    const center = document.createElement('div');
    Object.assign(center.style, {
        position: 'absolute',
        top: '10px',
        left: '10px',
        right: '10px',
        bottom: '10px',
        background: '#240229',
        borderRadius: '50%'
    });

    // 外圆
    for (let i = 0; i < 4; i++) {
        const span = document.createElement('span');
        Object.assign(span.style, {
            position: 'absolute',
            width: '100%',
            height: '100%',
            borderRadius: '50%',
            background: 'linear-gradient(#14ffe9, #ffeb3b, #ff00e0)',
            animation: 'animate 0.8s linear infinite'
        });
        loader.appendChild(span);
    }

    const spans = loader.querySelectorAll('span');
    spans[0].style.filter = 'blur(5px)';
    spans[1].style.filter = 'blur(10px)';
    spans[2].style.filter = 'blur(25px)';
    spans[3].style.filter = 'blur(50px)';

    // 动画
    const styleSheet = document.createElement('style');
    styleSheet.textContent = `
        @keyframes animate {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
        }
    `;
    document.head.appendChild(styleSheet);

    loader.appendChild(center);
    loading.appendChild(loader);

    // 淡入
    this.fadeIn('loading', 650, 0, 'center');
    this.fadeIn('blackCover', 650, 0);
    this.fadeIn('guassianCover', 650, 0);
};

// 移除 Loading
frameStyle.removeLoading = function () {
    const loading = document.getElementById('loading');
    if (!loading) {
        console.error('Loading element with id "loading" not found');
        return;
    }

    // 淡出
    this.fadeOut('loading', 800, 0, 'center');
    this.fadeOut('blackCover', 800, 0);
    this.fadeOut('guassianCover', 800, 0);

    setTimeout(() => {
        const loading = document.getElementById('loading');
        const blackCover = document.getElementById('blackCover');
        const guassianCover = document.getElementById('guassianCover');

        if (loading) loading.remove();
        if (blackCover) blackCover.remove();
        if (guassianCover) guassianCover.remove();
    }, 800);
};