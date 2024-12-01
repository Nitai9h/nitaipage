//加载完成后执行
window.addEventListener('load', function () {
    //载入动画
    $('#loading-box').attr('class', 'loaded');
    $('#bg').css("cssText", "transform: scale(1);filter: blur(0px);transition: ease 1.5s;");
    $('#section').css("cssText", "opacity: 1;transition: ease 1.5s;");
    $('.cover').css("cssText", "opacity: 1;transition: ease 1.5s;");

    //用户欢迎
    iziToast.settings({
        timeout: 3000,
        backgroundColor: '#ffffff40',
        titleColor: '#efefef',
        messageColor: '#efefef',
        progressBar: false,
        close: false,
        closeOnEscape: true,
        position: 'topCenter',
        transitionIn: 'bounceInDown',
        transitionOut: 'flipOutX',
        displayMode: 'replace',
        layout: '1'
    });
    setTimeout(function () {
        iziToast.show({
            title: hello,
            message: '欢迎使用 拟态起始页'
        });
    }, 800);

    //中文字体缓加载-此处写入字体源文件
    //先行加载简体中文子集，后续补全字集
    //由于压缩过后的中文字体仍旧过大，可转移至对象存储或 CDN 加载
    const font = new FontFace(
        "MiSans",
        "url(" + "./font/MiSans-Regular.woff2" + ")"
    );
    document.fonts.add(font);

    // 初始化时间秒数状态
    const timesState = getCookie('times');
    if (timesState === 'on') {
        $("#toggletimes").addClass('on');
        if ($('#switchSetOn').hasClass('switchon')) {
            $("#toggletimes").addClass('switchon');
        }
    }
    if (timesState === 'off') {
        $("#toggletimes").removeClass('on');
        if ($('#switchSetOn').hasClass('switchon')) {
            $("#toggletimes").removeClass('switchon');
        }
    }

    //初始化三大滑块
    //time
    fontSizeSlider.value = parseInt(getCookie('fontSize'), 10) || 0;
    timeText.style.fontSize = 2.75 + 3 * (fontSizeSlider.value / 100) + 'rem';
    fontThickSlider.value = parseInt(getCookie('fontThick'), 10) || 0;
    timeText.style.fontWeight = 100 + 800 * (fontThickSlider.value / 100);
    opacitySlider.value = parseInt(getCookie('opacity'), 10) || 100;
    timeText.style.opacity = opacitySlider.value / 100;
    //day
    dayFontSizeSlider.value = parseInt(getCookie('dayFontSize'), 10) || 0;
    day.style.fontSize = 1.05 + 3 * (dayFontSizeSlider.value / 100) + 'rem';
    dayFontThickSlider.value = parseInt(getCookie('dayFontThick'), 10) || 0;
    day.style.fontWeight = 100 + 800 * (dayFontThickSlider.value / 100);
    dayOpacitySlider.value = parseInt(getCookie('dayOpacity'), 10) || 100;
    day.style.opacity = dayOpacitySlider.value / 100;
    //lunar
    lunarFontSizeSlider.value = parseInt(getCookie('lunarFontSize'), 10) || 0;
    lunar.style.fontSize = 0.8 + 2.5 * (lunarFontSizeSlider.value / 100) + 'rem';
    lunarFontThickSlider.value = parseInt(getCookie('lunarFontThick'), 10) || 0;
    lunar.style.fontWeight = 100 + 800 * (lunarFontThickSlider.value / 100);
    lunarOpacitySlider.value = parseInt(getCookie('lunarOpacity'), 10) || 100;
    lunar.style.opacity = lunarOpacitySlider.value / 100;

}, false)

//进入问候
now = new Date(), hour = now.getHours()
if (hour < 6) {
    var hello = "凌晨好";
} else if (hour < 9) {
    var hello = "早上好";
} else if (hour < 12) {
    var hello = "上午好";
} else if (hour < 14) {
    var hello = "中午好";
} else if (hour < 17) {
    var hello = "下午好";
} else if (hour < 19) {
    var hello = "傍晚好";
} else if (hour < 22) {
    var hello = "晚上好";
} else {
    var hello = "夜深了";
}

//获取时间
var t = null;
t = setTimeout(time, 1000);

function time() {
    clearTimeout(t);
    const dt = new Date();
    const mm = dt.getMonth() + 1;
    const d = dt.getDate();
    const weekday = ["周日", "周一", "周二", "周三", "周四", "周五", "周六"];
    const day = dt.getDay();
    let h = dt.getHours();
    let m = dt.getMinutes();
    let s = dt.getSeconds(); // 获取秒数

    // 格式化小时、分钟和秒数
    h = h < 10 ? "0" + h : h;
    m = m < 10 ? "0" + m : m;
    s = s < 10 ? "0" + s : s;

    let sDisplay = '';

    if ($('#toggletimes').hasClass('on')) {
        $("#second").addClass('times_block');
        sDisplay = '<span id="point">:</span>' + '<span class="clock_num clock">' + s + '</span>';
    }

    // 农历
    var lunarD = Lunar.fromDate(new Date());
    var ganZhiYear = lunarD.getYearInGanZhiByLiChun();
    var shengXiao = lunarD.getYearShengXiao();
    var lunarMonth = lunarD.getMonthInChinese();
    var lunarDay = lunarD.getDayInChinese();

    $("#time_text").html('<span class="clock_num clock">' + h + '</span>' + '<span id="point">:</span>' + '<span class="clock_num clock">' + m + '</span>' + sDisplay);

    $("#day").html('<span class="clock_num clock">' + mm + "</span>" + "&nbsp;月&nbsp;" + '<span class="clock_num clock">' + d + '</span>' + "&nbsp;日&nbsp;" + weekday[day]);

    $("#lunar_date").html(ganZhiYear + shengXiao + "年 " + lunarMonth + "月" + lunarDay);

    t = setTimeout(time, 1000);
}

// 引用农历库
function convertToLunar(date) {
    return lunar.year + "年 " + lunar.month + "月 " + lunar.day + "日";
}

//Tab书签页
$(function () {
    $(".mark .tab .tab-item").click(function () {
        $(this).addClass("active").siblings().removeClass("active");
        $(".products .mainCont").eq($(this).index()).css("display", "flex").siblings().css("display", "none");
    })
})

//设置
$(function () {
    $(".set .tabs .tab-items").click(function () {
        $(this).addClass("actives").siblings().removeClass("actives");
        $(".productss .mainConts").eq($(this).index()).css("display", "flex").siblings().css("display", "none");
    })
    //初始化搜索建议状态
    const searchSuggestState = getCookie('searchSuggests');
    if (searchSuggestState === 'on') {
        $("#toggleSuggests").addClass('on');
        if ($('#switchSetOn').hasClass('switchon')) {
            $("#toggleSuggests").add('switchon');
        }
    }
    if (searchSuggestState === 'off') {
        $("#toggleSuggests").removeClass('on');
        if ($('#switchSetOn').hasClass('switchon')) {
            $("#toggleSuggests").removeClass('switchon');
        }
    }
    // 初始化农历显示状态
    const lunarSuggestState = getCookie('lunarSuggests');
    if (lunarSuggestState === 'on') {
        $("#togglelunar").addClass('on');
        $(".lunar_date_off").addClass('lunar_date_on');
    }
    if (lunarSuggestState === 'off') {
        $("#togglelunar").removeClass('on');
        $(".lunar_date_off").removeClass('lunar_date_on');
    }
    // 初始化快速使用开关状态
    const quickStartState = getCookie('quickStart');
    if (quickStartState === 'on') {
        document.getElementById('toggleStart').classList.add('on');
    }
    if (quickStartState === 'off') {
        document.getElementById('toggleStart').classList.remove('on');
    }
    //初始化搜索失焦开关状态
    const searchLoseState = getCookie('searchLose');
    if (searchLoseState === 'on') {
        document.getElementById('toggleSearchLose').classList.add('on');
    }
    if (searchLoseState === 'off') {
        document.getElementById('toggleSearchLose').classList.remove('on');
    }
    //初始化搜索建议、主题、时钟字体
    setTimeout(1)
    const applyThemeState = cookieManager.get('applyTheme');
    applyTheme(applyThemeState || 'dark');
    updateSelectedOptionText(applyThemeState === 'light' ? '浅色模式' : '深色模式');

    const selectedSearchAPI = cookieManager.get('selectedSearchAPI');
    if (selectedSearchAPI === 'bing') {
        selectOption('必应', document.getElementById('dropdown-suggest-bing'));
    } else if (selectedSearchAPI === 'google') {
        selectOption('谷歌', document.getElementById('dropdown-suggest-google'));
    } else {
        selectOption('百度', document.getElementById('dropdown-suggest-baidu'));
    }

    const selectedFont = cookieManager.get('ClockFont');
    if (selectedFont) {
        applyClockFont(selectedFont);
    }
})


//输入框为空时阻止跳转
$(window).keydown(function (e) {
    var key = window.event ? e.keyCode : e.which;
    if (key.toString() == "13") {
        if ($(".wd").val() == "") {
            return false;
        }
    }
});

//点击搜索按钮
$(".sou-button").click(function () {
    if ($("body").attr("class") === "onsearch") {
        if ($(".wd").val() != "") {
            $("#search-submit").click();
            //搜索失焦
            const searchLoseElement = document.getElementById('toggleSearchLose');
            if (searchLoseElement.classList.contains('on')) {
                blurWd();
            }
        }
    }
});

//鼠标中键点击事件
$(window).mousedown(function (event) {
    if (event.button == 1) {
        $("#time_text").click();
    }
});

//取消鼠标右键菜单
document.body.oncontextmenu = function () {
    return false;
};

// Tab 键点击事件
$(document).on('keydown', function (event) {
    if (event.keyCode === 9) {
        $("#time_text").click();
    }
});

//重置
document.getElementById('resetButton').addEventListener('click', function () {
    // 清除所有 cookie
    iziToast.show({
        timeout: 8000,
        message: '是否重置？',
        buttons: [
            ['<button>确认</button>', function (instance, toast) {
                setSeInit();
                instance.hide({
                    transitionOut: 'flipOutX',
                }, toast, 'buttonName');
                iziToast.show({
                    message: '设置成功'
                });
                var cookies = document.cookie.split(";");
                for (var i = 0; i < cookies.length; i++) {
                    var cookie = cookies[i];
                    var eqPos = cookie.indexOf("=");
                    var name = eqPos > -1 ? cookie.substr(0, eqPos) : cookie;
                    document.cookie = name + "=;expires=Thu, 01 Jan 1970 00:00:00 GMT";
                }
                // 清除 localStorage
                localStorage.clear();

                // 刷新页面
                location.reload();
            }, true],
            ['<button>取消</button>', function (instance, toast) {
                instance.hide({
                    transitionOut: 'flipOutX',
                }, toast, 'buttonName');
            }]
        ]
    });
});

//控制台输出
var styleTitle1 = `
font-size: 20px;
font-weight: 600;
color: rgb(244,167,89);
`
var styleTitle2 = `
font-size:12px;
color: rgb(244,167,89);
`
var styleContent = `
color: rgb(30,152,255);
`
var title1 = 'NitaiPage';
var title2 = `Welcome to my Homepage`;

async function fetchData() {
    try {
        const response = await fetch('./api/update.json');
        const data = await response.json();

        // 获取最后一个版本信息
        const latestVersionInfo = data.versions[0];
        const latestVersion = latestVersionInfo.version;
        const latestDate = latestVersionInfo.date;

        var content = `
版 本 号：${latestVersion}
更新日期：${latestDate}

About:  https://nitaipage.nitai.us.kg
`;

        console.log(`%c${title1} %c${title2}
%c${content}`, styleTitle1, styleTitle2, styleContent);
    } catch (error) {
        console.error('Error fetching data:', error);
    }
}

fetchAndDisplayUpdates()
fetchData();