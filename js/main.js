$(function () {
    // 加载动画
    frameStyle.createLoading();

    // 获取时间
    t = setTimeout(time, 1000);

    iziToast.settings({
        timeout: 3000,
        progressBar: false,
        close: false,
        closeOnEscape: true,
        position: 'topCenter',
        transitionIn: 'bounceInDown',
        transitionOut: 'fadeOutUp',
        transitionInMobile: 'fadeInDown',
        transitionOutMobile: 'fadeOutUp',
        displayMode: 'replace',
        layout: '1'
    });

    // 初始化日期显示和时钟闪烁状态
    updateDateDisplay();
    updateClockBlink();

    //初始化页脚信息
    updateFooterDisplay();

    // 搜索模糊效果加载
    updateSearchBlur();
    updateBlurPlusStyle();

    // 折叠状态
    foldInit();

    // 初始化时钟数字切换动画
    updateClockNumAnimation();

    // 初始化 (持久化元素加载)
    init();
})

// 控制台信息
const VersionInfo = {
    // 常量
    STYLES: {
        title: 'font-size: 20px; font-weight: 600; color: rgb(244,167,89);',
        version: 'font-size:14px; color: rgb(244,167,89);',
        content: 'color: rgb(30,152,255);'
    },
    TITLE: 'NitaiPage',
    VERSION: 'v2.3.3',
    COMMIT: '',

    // 格式化 版本 信息
    formatUpdates(updates) {
        return updates.map(update => `    - ${update}`).join('\n' + `    `);
    },

    // 格式化 关于 信息
    formatLinks(links) {
        return Object.entries(links)
            .map(([name, url]) => `    ${name}: ${url}`)
            .join('\n' + '    ');
    },

    // 获取 更新 信息
    async displayVersionInfo() {
        try {
            const data = await getInfo();
            const currentVersionInfo = this.findVersionInfo(data.versions);

            if (currentVersionInfo) {
                this.COMMIT = currentVersionInfo.commit;
                this.logVersionInfo(currentVersionInfo, data.link);
                return currentVersionInfo;
            } else {
                console.warn(`版本缺失：${this.VERSION}`);
            }
        } catch (error) {
            return error;
        }
    },

    // 查找 版本 信息
    findVersionInfo(versions) {
        return versions.find(v => v.version === this.VERSION);
    },

    // 控制台输出
    logVersionInfo(versionInfo, links) {
        const linkContent = this.formatLinks(links);
        const content = `
    更新日期：${versionInfo.date}
    本次提交：${this.COMMIT}
    更新内容：
    ${this.formatUpdates(versionInfo.updates)}

    关于：
    ${linkContent}
    `;
        console.log(
            `%c${this.TITLE} 
        %c${this.VERSION}
        %c${content}`,
            this.STYLES.title,
            this.STYLES.version,
            this.STYLES.content
        );
    }
};

//加载完成后执行
window.addEventListener('load', async function () {
    setupTabsScrolling('.set .tabs');
    setupTabsScrolling('#storePage .tabs');
}, false)

// 进入问候
const hour = new Date().getHours();
const greetings = [
    { limit: 6, text: "凌晨啦" },
    { limit: 8, text: "早上好" },
    { limit: 12, text: "上午好" },
    { limit: 14, text: "中午好" },
    { limit: 17, text: "下午好" },
    { limit: 19, text: "傍晚啦" },
    { limit: 21, text: "晚上好" },
    { limit: Infinity, text: "夜深了" }
];
const hello = greetings.find(item => hour < item.limit).text;

// Tab 书签页
$(function () {
    $(".mark .tab .tab-item").click(function () {
        $(this).addClass("active").siblings().removeClass("active");
        $(".products .mainCont").eq($(this).index()).css("display", "flex").siblings().css("display", "none");
    })
})

// Store 商店页
$(function () {
    $(".store .tabs .tab-items").click(function () {
        $(this).addClass("active").siblings().removeClass("active");
    })
    $("#storeManage").click(function () {
        loadPluginManagementPage()
        $('#storeContent').css('display', 'none');
        $('#manageContent').css('display', 'flex');
        $('.store-button').css('display', 'flex');
    })
})

// 设置
$(function () {
    $(".set .tabs .tab-items").click(function () {
        $(this).addClass("actives").siblings().removeClass("actives");
        $(".productss .mainConts").eq($(this).index()).css("display", "flex").siblings().css("display", "none");
    })
})

// 搜索跳转
$(window).keydown(function (e) {
    var key = window.event ? e.keyCode : e.which;
    if (key.toString() == "13") {
        if ($(".wd").val() == "") {
            return false;
        }
    }
});

//点击搜索按钮
$(document).on('click', '.sou-button', function () {
    if ($("body").attr("class") === "onsearch") {
        if ($(".wd").val() != "") {
            $("#search-submit").click();
        }
    }
});

// Tab 点击事件
$(window).keydown(function (event) {
    if (event.key === 'Tab') {
        $("#time_text").click();
    }
});