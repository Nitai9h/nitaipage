// tabs 滚动与自动隐藏
// 按 .tabs 的 flex-direction 判断方向
// column 走上下，row 走左右

// 已登记的 tabs 元素
// 窗口 resize 时统一重算。【用 Set 而非数组，重复调用天然去重】
const registered = new Set();
let resizeBound = false;

// rAF 节流
// 把一帧内的多次 scroll 合并成一次重算
const pending = new Set();
let rafId = 0;

// 每个 tabs 上次应用过的状态签名，用于跳过无变化的 DOM 写入
const lastState = new WeakMap();

// 每个 tabs 的观察器，元素脱离文档时一并断开
const watchers = new WeakMap();

// 判断当前 tabs 是纵向还是横向
function isVertical(tabs) {
    return getComputedStyle(tabs).flexDirection === 'column';
}

export function setupTabsScrolling(selector) {
    // 适配选择器 / 单个 DOM 元素
    const tabsList = typeof selector === 'string'
        ? Array.from(document.querySelectorAll(selector))
        : [selector];

    tabsList.forEach((tabs) => {
        if (!tabs) return;
        setupOne(tabs);
        registered.add(tabs);
    });

    if (!resizeBound) {
        window.addEventListener('resize', onWindowResize, { passive: true });
        resizeBound = true;
    }
}

function onWindowResize() {
    registered.forEach((tabs) => {
        if (!tabs.isConnected) {
            teardown(tabs);
            return;
        }
        scheduleResize(tabs);
    });
}

// 断开某个 tabs 的观察器并移出注册表
function teardown(tabs) {
    const w = watchers.get(tabs);
    if (!w) return;
    w.mutation.disconnect();
    w.resize.disconnect();
    watchers.delete(tabs);
    registered.delete(tabs);
}

// tab 项由组件动态增删、容器尺寸随面板动画变化时都不会触发 scroll，
// 靠观察器补一次重算，否则溢出后指示器不会出现
function watch(tabs) {
    if (watchers.has(tabs)) return;

    const mutation = new MutationObserver(() => scheduleResize(tabs));
    mutation.observe(tabs, { childList: true });

    const resize = new ResizeObserver(() => scheduleResize(tabs));
    resize.observe(tabs);

    watchers.set(tabs, { mutation, resize });
}

function scheduleResize(tabs) {
    pending.add(tabs);
    if (rafId) return;

    rafId = requestAnimationFrame(() => {
        rafId = 0;
        const list = [...pending];
        pending.clear();
        list.forEach((tabs) => {
            if (!tabs.isConnected) {
                teardown(tabs);
                return;
            }
            resizeOne(tabs);
        });
    });
}

function setupOne(tabs) {
    // 已经包裹过则跳过重裹，只补观察器
    if (tabs.parentElement && tabs.parentElement.classList.contains('tabs-container')) {
        watch(tabs);
        return;
    }

    const vertical = isVertical(tabs);

    const container = document.createElement('div');
    container.className = vertical ? 'tabs-container vertical' : 'tabs-container';

    const leftArrow = document.createElement('div');
    leftArrow.className = 'scroll-arrow-left';
    leftArrow.innerHTML = '<i class="iconfont icon-right_button"></i>';

    const rightArrow = document.createElement('div');
    rightArrow.className = 'scroll-arrow-right';
    rightArrow.innerHTML = '<i class="iconfont icon-left_button"></i>';

    const parent = tabs.parentNode;
    parent.insertBefore(container, tabs);
    container.appendChild(tabs);
    container.appendChild(leftArrow);
    container.appendChild(rightArrow);

    // 箭头一次滚动的距离
    const step = (dir) => {
        if (isVertical(tabs)) tabs.scrollTop += dir * tabs.clientHeight * 0.7;
        else tabs.scrollLeft += dir * tabs.clientWidth * 0.7;
    };

    tabs.addEventListener('wheel', (e) => {
        e.preventDefault();
        if (isVertical(tabs)) tabs.scrollTop += e.deltaY;
        else tabs.scrollLeft += e.deltaY;
    }, { passive: false });

    // 滚动只需被动监听，且合并到下一帧统一处理
    tabs.addEventListener('scroll', () => scheduleResize(tabs), { passive: true });

    leftArrow.addEventListener('click', () => step(-1));
    rightArrow.addEventListener('click', () => step(1));

    watch(tabs);
    resizeOne(tabs);
}

// 端点容差（px）
// scrollHeight / clientHeight 都是取整后的值，浏览器实际能滚到的最大值可能比 total - size 少 1~2px
// 【不留容差会出现「滚到底还显示 97.9%」、下箭头不消失的情况】
const END_TOLERANCE = 2;

function resizeOne(tabs) {
    if (!tabs || !tabs.isConnected) return;

    const container = tabs.parentElement;
    if (!container || !container.classList.contains('tabs-container')) return;

    const vertical = isVertical(tabs);
    const pos = vertical ? tabs.scrollTop : tabs.scrollLeft;
    const total = vertical ? tabs.scrollHeight : tabs.scrollWidth;
    const size = vertical ? tabs.clientHeight : tabs.clientWidth;

    const max = total - size;
    const canScroll = max > END_TOLERANCE;

    // 贴住两端时直接判 0 / 100，避免比值永远差一点
    let pct = 0;
    if (canScroll) {
        if (pos <= END_TOLERANCE) pct = 0;
        else if (pos >= max - END_TOLERANCE) pct = 100;
        else pct = Math.min(100, Math.max(0, (pos / max) * 100));
    }

    // 状态签名
    // 百分比（保留一位小数即可驱动进度条）+ 是否可滚动
    const sig = canScroll ? pct.toFixed(1) : 'none';
    if (lastState.get(tabs) === sig) return;
    lastState.set(tabs, sig);

    // 更新 CSS 变量（驱动滚动进度条）
    tabs.style.setProperty('--scrollbar', canScroll ? sig + '%' : '0%');

    // 到两端就隐藏对应箭头；无需滚动则两侧都收
    container.classList.toggle('can-scroll-left', canScroll && pct > 0);
    container.classList.toggle('can-scroll-right', canScroll && pct < 100);
}
