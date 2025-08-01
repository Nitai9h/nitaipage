// 默认快捷方式
var quick_list_preinstall = {
    '1': {
        title: "Vercel",
        url: "https://vercel.com/",
    },
    '2': {
        title: "GitHub",
        url: "https://github.com/",
    },
    '3': {
        title: "Cloudflare",
        url: "https://dash.cloudflare.com/",
    },
    '4': {
        title: "W3school",
        url: "https://www.w3school.com.cn/",
    },
    '5': {
        title: "腾讯云",
        url: "https://console.cloud.tencent.com/",
    },
    '6': {
        title: "阿里云",
        url: "https://console.aliyun.com/",
    },
    '7': {
        title: "百度网盘",
        url: "https://pan.baidu.com/",
    },
    '8': {
        title: "阿里云盘",
        url: "https://www.aliyundrive.com/drive/",
    },
    '9': {
        title: "Office",
        url: "https://www.office.com/",
    },
    '10': {
        title: "又拍云",
        url: "https://console.upyun.com/",
    },
    '11': {
        title: "CSDN",
        url: "https://www.csdn.net/",
    },
    '12': {
        title: "哔哩哔哩",
        url: "https://www.bilibili.com/",
    }
};

// 默认搜索引擎列表
var se_list_preinstall = {
    '1': {
        id: 1,
        title: "百度",
        url: "https://www.baidu.com/s",
        name: "wd",
        icon: "iconfont icon-baidu",
    },
    '2': {
        id: 2,
        title: "必应",
        url: "https://cn.bing.com/search",
        name: "q",
        icon: "iconfont icon-bing",
    },
    '3': {
        id: 3,
        title: "谷歌",
        url: "https://www.google.com/search",
        name: "q",
        icon: "iconfont icon-google",
    },
    '4': {
        id: 4,
        title: "Yandex",
        url: "https://yandex.eu/search",
        name: "text",
        icon: "iconfont icon-yandex",
    },
    '5': {
        id: 5,
        title: "Duckduckgo",
        url: "https://duckduckgo.com",
        name: "t=h_&q",
        icon: "iconfont icon-duckduckgo",
    },
    '6': {
        id: 6,
        title: "搜狗",
        url: "https://www.sogou.com/web",
        name: "query",
        icon: "iconfont icon-sougousousuo",
    },
    '7': {
        id: 7,
        title: "360",
        url: "https://www.so.com/s",
        name: "q",
        icon: "iconfont icon-a-360sousuo",
    },
    '8': {
        id: 8,
        title: "微博",
        url: "https://s.weibo.com/weibo",
        name: "q",
        icon: "iconfont icon-xinlangweibo",
    },
    '9': {
        id: 9,
        title: "知乎",
        url: "https://www.zhihu.com/search",
        name: "q",
        icon: "iconfont icon-zhihu",
    },
    '10': {
        id: 10,
        title: "Github",
        url: "https://github.com/search",
        name: "q",
        icon: "iconfont icon-github",
    },
    '11': {
        id: 11,
        title: "BiliBili",
        url: "https://search.bilibili.com/all",
        name: "keyword",
        icon: "iconfont icon-bilibilidonghua",
    },
    '12': {
        id: 12,
        title: "淘宝",
        url: "https://s.taobao.com/search",
        name: "q",
        icon: "iconfont icon-taobao",
    },
    '13': {
        id: 13,
        title: "京东",
        url: "https://search.jd.com/Search",
        name: "keyword",
        icon: "iconfont icon-jingdong",
    }
};

const PAGEDB_NAME = 'nitaiPageDB';
const PAGEDB_STORE = 'nitaiPage';

/**
* 数据库初始化
* @returns {Promise<void>}
*/
function initializaNitaiPageDB() {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open(PAGEDB_NAME, 1);

        request.onupgradeneeded = (event) => {
            const db = event.target.result;
            if (!db.objectStoreNames.contains(PAGEDB_STORE)) {
                db.createObjectStore(PAGEDB_STORE, { keyPath: 'id' });
            }
        };
        request.onsuccess = (event) => {
            const db = event.target.result;
            // 验证
            if (!db.objectStoreNames.contains(PAGEDB_STORE)) {
                console.error('缺少必要的对象存储: ' + PAGEDB_STORE);
                reject();
                return;
            }
            db.close();
            resolve();
        };
        request.onerror = (event) => {
            console.error('数据库初始化失败: ' + event.target.error.message);
            reject();
        };

    });
}

// 获取搜索引擎列表
function getSeList() {
    return new Promise((resolve, reject) => {
        initializaNitaiPageDB().then(() => {
            const request = indexedDB.open(PAGEDB_NAME);
            request.onsuccess = (event) => {
                const db = event.target.result;
                const transaction = db.transaction(PAGEDB_STORE, 'readonly');
                const store = transaction.objectStore(PAGEDB_STORE);
                const getRequest = store.get('se_list');

                getRequest.onsuccess = () => {
                    const result = getRequest.result;
                    db.close();
                    if (result && result.value) {
                        resolve(JSON.parse(result.value));
                    } else {
                        setSeList(se_list_preinstall).then(() => {
                            resolve(se_list_preinstall);
                        }).catch(reject);
                    }
                };

                getRequest.onerror = (error) => {
                    db.close();
                    reject(error);
                };
            };

            request.onerror = (error) => {
                reject(error);
            };
        }).catch(reject);
    });
}

// 设置搜索引擎列表
function setSeList(se_list) {
    return new Promise((resolve, reject) => {
        if (!se_list) {
            reject(new Error('se_list is required'));
            return;
        }

        initializaNitaiPageDB().then(() => {
            const request = indexedDB.open(PAGEDB_NAME);
            request.onsuccess = (event) => {
                const db = event.target.result;
                const transaction = db.transaction(PAGEDB_STORE, 'readwrite');
                const store = transaction.objectStore(PAGEDB_STORE);
                const putRequest = store.put({ id: 'se_list', value: JSON.stringify(se_list) });

                putRequest.onsuccess = () => {
                    db.close();
                    resolve();
                };

                putRequest.onerror = (error) => {
                    db.close();
                    reject(error);
                };
            };

            request.onerror = (error) => {
                reject(error);
            };
        }).catch(reject);
    });
}

// 获得默认搜索引擎
function getSeDefault() {
    var se_default = Cookies.get('se_default');
    return se_default ? se_default : "1";
}

//背景图片
var bg_img_preinstall = {
    "type": "1", // 1:使用主题默认的背景图片 2:关闭背景图片 3:使用自定义的背景图片
    "path": "", //自定义图片
};

// 获取背景图片
function getBgImg() {
    var bg_img_local = Cookies.get('bg_img');
    if (bg_img_local && bg_img_local !== "{}") {
        return JSON.parse(bg_img_local);
    } else {
        setBgImg(bg_img_preinstall);
        return bg_img_preinstall;
    }
}

// 设置背景图片
function setBgImg(bg_img) {
    if (bg_img) {
        Cookies.set('bg_img', bg_img, {
            expires: 36500
        });
        return true;
    }
    return false;
}

// 初始化折叠状态
function foldInit() {
    var foldValue = Cookies.get('foldTime');
    if (foldValue == "true") {
        $("#icon-fold").attr("class", "iconfont icon-unfold");
    } else {
        $("#icon-fold").attr("class", "iconfont icon-fold");
    }
}

// 设置-壁纸
function setBgImgInit() {
    const bg = new BroadcastChannel("bgLoad");

    var bg_img = getBgImg();
    $(":input[name='wallpaper-type'][value='" + bg_img["type"] + "']").prop("checked", true);
    if (bg_img["type"] === "6") {
        $("#wallpaper-url").val(bg_img["path"]);
        $("#wallpaper-button").fadeIn(100);
        $("#wallpaper_url").fadeIn(100);
    } else {
        $("#wallpaper_url").fadeOut(300);
        $("#wallpaper-button").fadeOut(300);
    }

    switch (bg_img["type"]) {
        case "1":
            var pictures = new Array();
            pictures[0] = './img/background1.webp';
            pictures[1] = './img/background2.webp';
            pictures[2] = './img/background3.webp';
            pictures[3] = './img/background4.webp';
            pictures[4] = './img/background5.webp';
            pictures[5] = './img/background6.webp';
            pictures[6] = './img/background7.webp';
            pictures[7] = './img/background8.webp';
            pictures[8] = './img/background9.webp';
            pictures[9] = './img/background10.webp';
            var rd = Math.floor(Math.random() * 10);
            var pictureURL = pictures[rd]; //随机默认壁纸
            break;
        case "2":
            var pictureURL = 'https://bing.biturl.top/?resolution=UHD&format=image'; //必应每日 4K
            break;
        case "3":
            var pictureURL = 'https://bing.biturl.top/?resolution=1920&format=image'; //必应每日 1080P
            break;
        case "4":
            var pictureURL = 'https://api.vvhan.com/api/wallpaper/views'; //随机风景
            break;
        case "5":
            var pictureURL = 'https://www.loliapi.com/acg'; //随机二次元
            break;
        case "6":
            var pictureURL = bg_img["path"]; //自定义
            break;
        default:
            var pictureURL = getCookie('bgImage'); // 插件接口
    }
    bg.postMessage("bgImgLoadingStart");
    // 跟踪API重定向
    fetch(pictureURL)
        .then(response => {
            const finalUrl = response.url;
            $('#bg').attr('src', finalUrl)
            sessionStorage.setItem('bgImageFinalURL', finalUrl);
            const img = new Image();
            img.onload = function () {
                $('#bg').css("cssText", "opacity: 1;transform: scale(1);filter: blur(0px);transition: ease 1.2s;");
                bg.postMessage("bgImgLoadinged");
                bg.close();
            };
            img.src = finalUrl;
        })
        .catch(error => {
            // 原始方法
            $('#bg').attr('src', pictureURL)
            console.error('Failed to track image redirect:', error);
            const img = new Image();
            img.onload = function () {
                $('#bg').css("cssText", "opacity: 1;transform: scale(1);filter: blur(0px);transition: ease 1.2s;");
                sessionStorage.setItem('bgImageFinalURL', img.src);
                bg.postMessage("bgImgLoadinged");
                bg.close();
            };
            img.src = pictureURL;
        });
};

// 搜索框高亮
function focusWd() {
    $("body").addClass("onsearch");
}

// 搜索框取消高亮
function blurWd() {
    $("body").removeClass("onsearch");
    //隐藏输入
    $(".wd").val("");
    //隐藏搜索建议
    $("#keywords").hide();
}

// 搜索建议提示
function keywordReminder() {
    var keyword = $(".wd").val();
    if (keyword != "") {
        $.ajax({
            url: 'https://suggestion.baidu.com/su?wd=' + keyword,
            dataType: 'jsonp',
            jsonp: 'cb', //回调函数的参数名(键值)key
            success: function (data) {
                //获取宽度
                $("#keywords").css("width", $('.sou').width());
                $("#keywords").empty().show();
                $.each(data.s, function (i, val) {
                    $('#keywords').append(`<div class="keyword" data-id="${i + 1}"><i class='iconfont icon-sousuo'></i>${val}</div>`);
                });
                $("#keywords").attr("data-length", data.s["length"]);
                $(".keyword").click(function () {
                    $(".wd").val($(this).text());
                    $("#search-submit").click();
                });
            },
            error: function () {
                $("#keywords").empty().show();
                $("#keywords").hide();
            }
        })
    } else {
        $("#keywords").empty().show();
        $("#keywords").hide();
    }
}

// 搜索框数据加载
async function searchData() {
    try {
        var se_default = getSeDefault();
        var se_list = await getSeList();
        var defaultSe = se_list[se_default];
        if (defaultSe) {
            $(".search").attr("action", defaultSe["url"]);
            $("#icon-se").attr("class", defaultSe["icon"]);
            $(".wd").attr("name", defaultSe["name"]);
        }
    } catch (error) {
        console.error("加载搜索数据失败:", error);
    }
}

// 搜索引擎列表加载
async function seList() {
    var html = "";
    try {
        var se_list = await getSeList();
        for (var i in se_list) {
            html += `<div class='se-li' data-url='${se_list[i]["url"]}' data-name='${se_list[i]["name"]}' data-icon='${se_list[i]["icon"]}'>
            <a class='se-li-text'><i id='icon-sou-list' class='${se_list[i]["icon"]}'></i><span>${se_list[i]["title"]}</span></a></div>`;
        }
        $(".search-engine-list").html(html);
    } catch (error) {
        console.error("获取搜索引擎列表失败:", error);
    }
}

// 设置-搜索引擎列表加载
async function setSeInit() {
    try {
        var se_default = getSeDefault();
        var se_list = await getSeList();
        var html = "";
        for (var i in se_list) {
            var tr = `<div class='se_list_div'><div class='se_list_num'>${i}</div>`;
            if (i === se_default) {
                tr = `<div class='se_list_div'><div class='se_list_num'>
                <i class='iconfont icon-home'></i></div>`;
            }
            tr += `<div class='se_list_name'>${se_list[i]["title"]}</div>
            <div class='se_list_button'>
            <button class='set_se_default' value='${i}' style='border-radius: 8px 0px 0px 8px;'>
            <i class='iconfont icon-home'></i></button>
            <button class='edit_se' value='${i}'>
            <i class='iconfont icon-edit'></i></button>
            <button class='delete_se' value='${i}' style='border-radius: 0px 8px 8px 0px;'>
            <i class='iconfont icon-delete'></i></button></div>
            </div>`;
            html += tr;
        }
        $(".se_list_table").html(html);
    } catch (error) {
        console.error("初始化搜索引擎设置失败:", error);
    }
}

// 获取快捷方式列表
async function getQuickList() {
    try {
        await initializaNitaiPageDB();
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(PAGEDB_NAME);
            request.onsuccess = (event) => {
                const db = event.target.result;
                const transaction = db.transaction(PAGEDB_STORE, 'readonly');
                const store = transaction.objectStore(PAGEDB_STORE);
                const getRequest = store.get('quick_list');

                getRequest.onsuccess = () => {
                    const data = getRequest.result;
                    db.close();
                    if (data && data.value && data.value !== '{}') {
                        resolve(JSON.parse(data.value));
                    } else {
                        // 如果没有数据，使用预安装数据并保存
                        setQuickList(quick_list_preinstall).then(() => {
                            resolve(quick_list_preinstall);
                        }).catch(error => {
                            console.error('设置默认快捷方式列表失败:', error);
                            resolve(quick_list_preinstall);
                        });
                    }
                };

                getRequest.onerror = () => {
                    db.close();
                    reject(getRequest.error);
                };
            };

            request.onerror = (event) => {
                reject(event.target.error);
            };
        });
    } catch (error) {
        console.error('获取快捷方式列表失败:', error);
        // 出错时返回预安装数据
        return quick_list_preinstall;
    }
}

// 设置快捷方式列表
async function setQuickList(quick_list) {
    if (!quick_list) return false;

    try {
        await initializaNitaiPageDB();
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(PAGEDB_NAME);

            request.onsuccess = (event) => {
                const db = event.target.result;
                const transaction = db.transaction(PAGEDB_STORE, 'readwrite');
                const store = transaction.objectStore(PAGEDB_STORE);

                // 存储数据，使用'quick_list'作为键
                const putRequest = store.put({
                    id: 'quick_list',
                    value: JSON.stringify(quick_list)
                });

                putRequest.onsuccess = () => {
                    db.close();
                    resolve(true);
                };

                putRequest.onerror = () => {
                    db.close();
                    reject(putRequest.error);
                };
            };

            request.onerror = (event) => {
                reject(event.target.error);
            };
        });
    } catch (error) {
        console.error('设置快捷方式列表失败:', error);
        return false;
    }
}

// 快捷方式数据加载
async function quickData() {
    try {
        var html = "";
        var quick_list = await getQuickList();
        for (var i in quick_list) {
            html += `<div class="quick">
                        <a href="${quick_list[i]['url']}" target="_blank">${quick_list[i]['title']}</a>
                    </div>`;
        }
        $(".quick-all").html(html);
    } catch (error) {
        console.error('加载快捷方式数据失败:', error);
    }
}

// 设置-快捷方式加载
async function setQuickInit() {
    try {
        var quick_list = await getQuickList();
        var html = "";
        for (var i in quick_list) {
            tr = `
            <div class='quick_list_div'>
                <div class='quick_list_div_num'>${i}</div>
                <div class='quick_list_div_name'>${quick_list[i]['title']}</div>
                <div class='quick_list_div_button'>
                    <button class='edit_quick' value='${i}' style='border-radius: 8px 0px 0px 8px;'>
                    <i class='iconfont icon-edit'></i></button>
                    <button class='delete_quick' value='${i}' style='border-radius: 0px 8px 8px 0px;'>
                    <i class='iconfont icon-delete'></i></button>
                </div>
            </div>`;
            html += tr;
        }
        $(".quick_list_table").html(html);
    } catch (error) {
        console.error('设置快捷方式初始化失败:', error);
    }
}

/**
 * 下载文本为文件
 * @param filename 文件名
 * @param text     内容
 */
function download(filename, text) {
    var element = document.createElement('a');
    element.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(text));
    element.setAttribute('download', filename);

    element.style.display = 'none';
    document.body.appendChild(element);

    element.click();

    document.body.removeChild(element);
}

// 隐藏时钟
function hideTime() {
    $(".tool-all").hide();
    $(".set").css({
        "margin-top": "0px",
        "max-height": "480px",
        "height": "480px",
    });
    $(".mark").css({
        "margin-top": "0px",
        "max-height": "480px",
        "height": "480px",
    });
    $(".store").css({
        "margin-top": "0px",
        "max-height": "480px",
        "height": "480px",
    });
    $(".plugin_set").css({
        "margin-top": "0px",
        "max-height": "480px",
        "height": "480px",
    });
    $(".order-dialog .dialog-content").css({
        "height": "490px !important"
    });
    $(".dialog-content").css({
        "height": "390px"
    })
    $(".storeContent").css({
        "height": "390px"
    });
    $(".se_list").css({
        "height": "340px"
    });
    $(".quick_list").css({
        "height": "340px"
    });
    $(".set_blocks").css({
        "height": "420px"
    });
    $(".plugin_set .contents").css({
        "height": "420px"
    });
}

// 显示时钟
function showTime() {
    $(".tool-all").show();
    $(".set").css({
        "margin-top": "180px",
        "max-height": "400px",
        "height": "400px",
    });
    $(".mark").css({
        "margin-top": "180px",
        "max-height": "400px",
        "height": "400px",
    });
    $(".store").css({
        "margin-top": "180px",
        "max-height": "400px",
        "height": "400px",
    });
    $(".plugin_set").css({
        "margin-top": "180px",
        "max-height": "400px",
        "height": "400px",
    });
    $(".order-dialog .dialog-content").css({
        "height": "390px !important"
    });
    $(".dialog-content").css({
        "height": "310px"
    });
    $(".storeContent").css({
        "height": "310px"
    });
    $(".se_list").css({
        "height": "260px"
    });
    $(".quick_list").css({
        "height": "260px"
    });
    $(".set_blocks").css({
        "height": "340px"
    });
    $(".plugin_set .contents").css({
        "height": "340px"
    });
}

// 书签显示
function openBox() {
    if ($('#fold').attr("class") === "entry-items on"
        || window.matchMedia('(max-width: 260px)').matches) {
        hideTime();
    }
    const content = $("#content");
    const mark = $(".mark");
    const toolAll = $(".tool-all");
    const bg = $('#bg');
    const iconFold = $("#fold");
    const searchContainer = $("#search-form-container");
    const pluginSet = $(".plugin_set");

    content.addClass('box');
    mark.css("display", "flex");
    toolAll.css("transform", "translateY(-190%)");
    searchContainer.css("transform", "translateY(90%)");
    bg.css({ transform: 'scale(1.08)', filter: "var(--main-box-gauss)", transition: "ease 0.3s" });
    iconFold.css("display", "flex");
    pluginSet.css("display", "none");
}

// 书签关闭
function closeBox() {

    showTime();

    const content = $("#content");
    const mark = $(".mark");
    const toolAll = $(".tool-all");
    const bg = $('#bg');
    const iconFold = $("#fold");
    const searchContainer = $("#search-form-container");
    const pluginSet = $(".plugin_set");

    content.removeClass('box');
    mark.css("display", "none");
    toolAll.css("transform", "translateY(-120%)");
    searchContainer.css("transform", "translateY(0%)");
    bg.css({ transform: 'scale(1)', filter: "blur(0px)", transition: "ease 1.2s" });
    iconFold.css("display", "none");
    pluginSet.css("display", "none");
}

// 打开设置
function openSet() {
    if ($("#fold").attr("class") === "entry-items on") {
        hideTime();
    }

    $('body').removeClass('onsearch');
    $('#menu').addClass('on');

    closeStore();
    openBox();

    //更改设置图标
    $("#icon-menu").attr("class", "iconfont icon-home");

    // .set元素过渡动画
    $("set").css({ display: "flex", opacity: 0, transition: "opacity 0.3s" });
    setTimeout(() => $("set").css({ opacity: 1 }), 10);
    // .mark元素过渡动画
    $("mark").css({ opacity: 0, transition: "opacity 0.3s" });
    setTimeout(() => $("mark").css({ display: "none" }), 300);
    $(".mark").css({
        "display": "none",
    });
    $(".store").css({
        "display": "none",
    });
    $(".set").css({
        "display": "flex",
    });
    $(".plugin_set").css({
        "display": "none",
    });
    $("#fold").css({
        "display": "flex",
        "transition": "all 0.3s"
    });
}

// 关闭设置
function closeSet() {
    if ($("#fold").attr("class") === "entry-items on") {
        showTime();
    }

    $("#menu").removeClass('on');

    closeBox();

    //更改设置图标
    $("#icon-menu").attr("class", "iconfont icon-settings");

    $(".set").css({
        "display": "none",
    });
    $(".plugin_set").css({
        "display": "none",
    });
    $("#fold").css({
        "display": "none",
        "transition": "all 0.3s"
    });
    // .store元素过渡动画
    $("store").css({ opacity: 0, transition: "opacity 0.3s" });
    setTimeout(() => $("store").css({ display: "none" }), 300);

    // 刷新主页数据
    seList();
    quickData();
}

// 商店显示
function openStore() {
    if ($("#fold").attr("class") === "entry-items on") {
        hideTime();
    }

    $('body').removeClass('onsearch');
    $('#store').addClass('on');

    closeSet();
    openBox();

    //更改商店图标
    $("#icon-store").attr("class", "iconfont icon-home");

    $(".mark").css({
        "display": "none",
    });
    $(".store").css({
        "display": "flex",
    });
    $(".set").css({
        "display": "none",
    });
    $(".plugin_set").css({
        "display": "none",
    });
    $("#fold").css({
        "display": "flex",
        "transition": "all 0.3s"
    });
}

// 商店关闭
function closeStore() {
    if ($("#fold").attr("class") === "entry-items on") {
        showTime();
    }

    $("#store").removeClass('on');

    closeBox();

    //更改商店图标
    $("#icon-store").attr("class", "iconfont icon-store");

    //隐藏商店
    $('.store').css({
        "display": "none",
    });
    $("#fold").css({
        "display": "none",
        "transition": "all 0.3s"
    });
}

//显示设置搜索引擎列表
function showSe() {
    $(".se_list").show();
    $(".se_add_preinstall").show();
}

//隐藏设置搜索引擎列表
function hideSe() {
    $(".se_list").hide();
    $(".se_add_preinstall").hide();
}

//显示设置快捷方式列表
function showQuick() {
    $(".quick_list").show();
    $(".se_add_preinstalls").show();
}

//隐藏设置快捷方式列表
function hideQuick() {
    $(".quick_list").hide();
    $(".se_add_preinstalls").hide();
}

// 初始化各项已持久化的元素
async function init() {
    // 搜索框数据加载
    await searchData();

    // 搜索引擎列表加载
    await seList();

    // 快捷方式数据加载
    await quickData();

    // Npp插件加载
    await initCoreNpp();
    await loadNpp();

    // 应用管理加载
    await loadPluginManagementPage()

    // 壁纸数据加载
    setBgImgInit();

    // 折叠状态
    foldInit();

    // 加载商店数据
    loadStoreData();

    // 检查更新
    checkUpdates('all', 'hide');
}

// 或取信息 JSON
async function getInfo() {
    try {
        const response = await fetch('https://nfdb.nitai.us.kg/nitaiPage/updateLog');
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        return data;
    } catch (error) {
        throw error;
    }
}

// indexedDB 导出
function getAllIndexedDBData() {
    return new Promise((resolve, reject) => {
        if (!window.indexedDB) {
            resolve({});
            return;
        }

        const databases = [];
        let completed = 0;

        // 获取所有数据库名称
        indexedDB.databases().then(dbList => {
            if (dbList.length === 0) {
                resolve({});
                return;
            }

            dbList.forEach(dbInfo => {
                const dbName = dbInfo.name;
                if (!dbName) { completed++; return; }

                const request = indexedDB.open(dbName);
                request.onsuccess = function (event) {
                    const db = event.target.result;
                    const transaction = db.transaction(db.objectStoreNames, 'readonly');
                    const dbData = {};
                    let storesCompleted = 0;

                    if (db.objectStoreNames.length === 0) {
                        databases.push({ name: dbName, data: dbData });
                        completed++;
                        if (completed === dbList.length) resolve({ databases: databases });
                        db.close();
                        return;
                    }

                    Array.from(db.objectStoreNames).forEach(storeName => {
                        const store = transaction.objectStore(storeName);
                        const getAllRequest = store.getAll();

                        getAllRequest.onsuccess = function () {
                            dbData[storeName] = getAllRequest.result;
                            storesCompleted++;

                            if (storesCompleted === db.objectStoreNames.length) {
                                databases.push({ name: dbName, data: dbData });
                                completed++;
                                if (completed === dbList.length) resolve({ databases: databases });
                                db.close();
                            }
                        };

                        getAllRequest.onerror = function () {
                            storesCompleted++;
                            if (storesCompleted === db.objectStoreNames.length) {
                                databases.push({ name: dbName, data: dbData });
                                completed++;
                                if (completed === dbList.length) resolve({ databases: databases });
                                db.close();
                            }
                        };
                    });
                };

                request.onerror = function () {
                    completed++;
                    if (completed === dbList.length) resolve({ databases: databases });
                };
            });
        }).catch(err => reject(err));
    });
}

// indexedDB 导入
function importIndexedDBData(indexedDBData) {
    return new Promise((resolve, reject) => {
        if (!window.indexedDB || !indexedDBData.databases) {
            resolve();
            return;
        }

        let completed = 0;
        const totalDatabases = indexedDBData.databases.length;

        if (totalDatabases === 0) {
            resolve();
            return;
        }

        indexedDBData.databases.forEach(dbInfo => {
            const dbName = dbInfo.name;
            const dbData = dbInfo.data;

            // 删除现有数据库
            const deleteRequest = indexedDB.deleteDatabase(dbName);
            deleteRequest.onsuccess = function () {
                // 创建新数据库
                const openRequest = indexedDB.open(dbName);

                openRequest.onupgradeneeded = function (event) {
                    const db = event.target.result;
                    // 创建对象存储
                    Object.keys(dbData).forEach(storeName => {
                        if (!db.objectStoreNames.contains(storeName)) {
                            db.createObjectStore(storeName, { keyPath: 'id', autoIncrement: true });
                        }
                    });
                };

                openRequest.onsuccess = function (event) {
                    const db = event.target.result;
                    const transaction = db.transaction(Object.keys(dbData), 'readwrite');
                    let storesCompleted = 0;

                    Object.keys(dbData).forEach(storeName => {
                        const store = transaction.objectStore(storeName);
                        const data = dbData[storeName];

                        if (data.length === 0) {
                            storesCompleted++;
                            if (storesCompleted === Object.keys(dbData).length) {
                                completed++;
                                if (completed === totalDatabases) resolve();
                                db.close();
                            }
                            return;
                        }

                        let addedCount = 0;
                        data.forEach(item => {
                            const addRequest = store.add(item);
                            addRequest.onsuccess = function () {
                                addedCount++;
                                if (addedCount === data.length) {
                                    storesCompleted++;
                                    if (storesCompleted === Object.keys(dbData).length) {
                                        completed++;
                                        if (completed === totalDatabases) resolve();
                                        db.close();
                                    }
                                }
                            };

                            addRequest.onerror = function () {
                                addedCount++;
                                if (addedCount === data.length) {
                                    storesCompleted++;
                                    if (storesCompleted === Object.keys(dbData).length) {
                                        completed++;
                                        if (completed === totalDatabases) resolve();
                                        db.close();
                                    }
                                }
                            };
                        });
                    });
                };

                openRequest.onerror = function () {
                    completed++;
                    if (completed === totalDatabases) resolve();
                };
            };

            deleteRequest.onerror = function () {
                completed++;
                if (completed === totalDatabases) resolve();
            };
        });
    });
}

// 设置 tabs 横向滑动和自动隐藏
function setupTabsScrolling(selector) {
    $(function () {
        const tabs = $(selector);
        let scrollTimer;

        if (!tabs.length) return;

        // 自动隐藏滚动条
        tabs.on('scroll', function () {
            tabs.removeClass('scrollbar-hidden');
            clearTimeout(scrollTimer);
            scrollTimer = setTimeout(() => tabs.addClass('scrollbar-hidden'), 1500);
        });

        // 横向滚动支持
        tabs.on('wheel', function (e) {
            e.preventDefault();
            $(this).scrollLeft($(this).scrollLeft() + e.originalEvent.deltaY);
        });

        // 初始隐藏
        setTimeout(() => tabs.addClass('scrollbar-hidden'), 1500);
    });
}


function showWelcomeMessage() {
    //用户欢迎
    setTimeout(function () {
        iziToast.show({
            title: hello,
            message: '欢迎使用 NitaiPage'
        });
    }, 800);
}

function showContain_plugin() {
    $(".dialog-container").remove();
    $('#storeTabs').css('display', 'flex');
    $('.store-block').css('display', 'flex');
}

// 初始化滑块控件并加载Cookie设置
function initSliderControls() {
    // 获取滑块元素
    const timeFontSizeSlider = document.getElementById('font-size-slider');
    const timeFontWeightSlider = document.getElementById('font-thick-slider');
    const timeFontOpacitySlider = document.getElementById('font-opacity-slider');
    const timeFontWidthSlider = document.getElementById('font-width-time');
    const dateFontSizeSlider = document.getElementById('font-size-date');
    const dateFontWeightSlider = document.getElementById('font-thick-date');
    const dateFontOpacitySlider = document.getElementById('font-opacity-date');
    const dateFontWidthSlider = document.getElementById('font-width-date');

    // 从Cookie加载设置或使用默认值
    const timeSettings = {
        size: parseInt(Cookies.get('timeFontSize')) || 0,
        weight: parseInt(Cookies.get('timeFontWeight')) || 50,
        opacity: parseInt(Cookies.get('timeFontOpacity')) || 100,
        width: parseInt(Cookies.get('timeFontWidth')) || 0
    };
    const dateSettings = {
        size: parseInt(Cookies.get('dateFontSize')) || 0,
        weight: parseInt(Cookies.get('dateFontWeight')) || 50,
        opacity: parseInt(Cookies.get('dateFontOpacity')) || 100,
        width: parseInt(Cookies.get('dateFontWidth')) || 0
    };

    // 设置滑块初始值
    timeFontSizeSlider.value = timeSettings.size;
    timeFontWeightSlider.value = timeSettings.weight;
    timeFontOpacitySlider.value = timeSettings.opacity;
    timeFontWidthSlider.value = timeSettings.width;
    dateFontSizeSlider.value = dateSettings.size;
    dateFontWeightSlider.value = dateSettings.weight;
    dateFontOpacitySlider.value = dateSettings.opacity;
    dateFontWidthSlider.value = dateSettings.width;

    // 应用初始样式
    updateTimeStyle(timeSettings.size, timeSettings.weight, timeSettings.opacity, timeSettings.width);
    updateDateStyle(dateSettings.size, dateSettings.weight, dateSettings.opacity, dateSettings.width);

    // 添加滑块事件监听器
    timeFontSizeSlider.addEventListener('input', function () {
        const value = parseInt(this.value);
        updateTimeStyle(value, timeSettings.weight, timeSettings.opacity, timeSettings.width);
        Cookies.set('timeFontSize', value, { expires: 365 });
        timeSettings.size = value;
    });

    timeFontWeightSlider.addEventListener('input', function () {
        const value = parseInt(this.value);
        updateTimeStyle(timeSettings.size, value, timeSettings.opacity, timeSettings.width);
        Cookies.set('timeFontWeight', value, { expires: 365 });
        timeSettings.weight = value;
    });

    timeFontOpacitySlider.addEventListener('input', function () {
        const value = parseInt(this.value);
        updateTimeStyle(timeSettings.size, timeSettings.weight, value, timeSettings.width);
        Cookies.set('timeFontOpacity', value, { expires: 365 });
        timeSettings.opacity = value;
    });

    timeFontWidthSlider.addEventListener('input', function () {
        const value = parseInt(this.value);
        updateTimeStyle(timeSettings.size, timeSettings.weight, timeSettings.opacity, value);
        Cookies.set('timeFontWidth', value, { expires: 365 });
        timeSettings.width = value;
    });

    dateFontSizeSlider.addEventListener('input', function () {
        const value = parseInt(this.value);
        updateDateStyle(value, dateSettings.weight, dateSettings.opacity, dateSettings.width);
        Cookies.set('dateFontSize', value, { expires: 365 });
        dateSettings.size = value;
    });

    dateFontWeightSlider.addEventListener('input', function () {
        const value = parseInt(this.value);
        updateDateStyle(dateSettings.size, value, dateSettings.opacity, dateSettings.width);
        Cookies.set('dateFontWeight', value, { expires: 365 });
        dateSettings.weight = value;
    });

    dateFontOpacitySlider.addEventListener('input', function () {
        const value = parseInt(this.value);
        updateDateStyle(dateSettings.size, dateSettings.weight, value, dateSettings.width);
        Cookies.set('dateFontOpacity', value, { expires: 365 });
        dateSettings.opacity = value;
    });

    dateFontWidthSlider.addEventListener('input', function () {
        const value = parseInt(this.value);
        updateDateStyle(dateSettings.size, dateSettings.weight, dateSettings.opacity, value);
        Cookies.set('dateFontWidth', value, { expires: 365 });
        dateSettings.width = value;
    });
}

// 更新时间样式
function updateTimeStyle(size, weight, opacity, width) {
    // 转换滑块值
    const baseFontSize = 2.75; // 基础字体大小
    const maxIncrease = 5; // 最大增加 5rem
    const fontSize = baseFontSize + (size / 100) * maxIncrease; // 计算字体大小
    const fontWeight = 100 + (weight / 100) * 800; // 100-900
    const opacityValue = opacity / 100; // 0-1
    const fontWidth = 29.5 + (width / 100) * 50; // 29.5-79.5

    // 更新 CSS
    document.documentElement.style.setProperty('--time-font-size', `${fontSize}rem`);
    document.documentElement.style.setProperty('--time-font-weight', fontWeight);
    document.documentElement.style.setProperty('--time-opacity', opacityValue);
    document.documentElement.style.setProperty('--time-width', `${fontWidth}px`);
}

// 更新日期样式
function updateDateStyle(size, weight, opacity, width) {
    // 转换滑块值
    const baseFontSize = 1.05; // 基础字体大小
    const maxIncrease = 5; // 最大增加 5rem
    const fontSize = baseFontSize + (size / 100) * maxIncrease; // 计算字体大小
    const fontWeight = 100 + (weight / 100) * 800; // 100-900
    const opacityValue = opacity / 100; // 0-1
    const fontWidth = 12.5 + (width / 100) * 50; // 12.5-62.5

    // 更新 CSS
    document.documentElement.style.setProperty('--date-font-size', `${fontSize}rem`);
    document.documentElement.style.setProperty('--date-font-weight', fontWeight);
    document.documentElement.style.setProperty('--date-opacity', opacityValue);
    document.documentElement.style.setProperty('--date-width', `${fontWidth}px`);
}