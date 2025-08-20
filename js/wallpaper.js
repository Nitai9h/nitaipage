// 默认设置
var bg_img_preinstall = {
    "type": "1"
};

// 默认随机壁纸列表
const defaultPictures = [
    './img/background1.webp',
    './img/background2.webp',
    './img/background3.webp',
    './img/background4.webp',
    './img/background5.webp',
    './img/background6.webp',
    './img/background7.webp',
    './img/background8.webp',
    './img/background9.webp',
    './img/background10.webp'
];

// 默认壁纸列表
const defaultWallpaperOptions = [
    {
        label: "<i class='iconfont icon-add'></i>",
        url: '',
        description: '添加壁纸项'
    },
    {
        label: '随机壁纸',
        url: '',
        description: '随机壁纸，每次刷新后更换'
    },
    {
        label: '纯色背景',
        url: 'solid-color',
        description: '纯色背景，可自定义颜色'
    },
    {
        label: '必应 4K',
        url: 'https://bing.biturl.top/?resolution=UHD&format=image',
        description: '必应每日一图 4K UHD 超高清，每天更新'
    },
    {
        label: '必应 1080P',
        url: 'https://bing.biturl.top/?resolution=1920&format=image',
        description: '必应每日一图 1080P FHD 全高清，每天更新'
    },
    {
        label: '风景',
        url: 'https://tu.ltyuanfang.cn/api/fengjing.php',
        description: '随机风景图，每次刷新后更换'
    },
    {
        label: '二次元',
        url: 'https://www.loliapi.com/acg',
        description: '随机二次元图，每次刷新后更换'
    }
];

window.wallpaperOptions = [...defaultWallpaperOptions];
let wallpaperOptions = window.wallpaperOptions;

let wallpaperPictures = [...defaultPictures];

const WALLPAPER_DB_NAME = 'nitaiPageDB';
const WALLPAPER_STORE_NAME = 'nitaiPage';
const WALLPAPER_KEY = 'wallpaperOptions';

const WALLPAPER_MEDIA_RANDOM_STORE_NAME = 'randomWallpaper';
const WALLPAPER_MEDIA_CUSTOM_STORE_NAME = 'customWallpaper';

// 初始化数据库
function initIndexedDB() {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open(WALLPAPER_DB_NAME, 2);

        request.onerror = (event) => {
            console.error('数据库打开失败:', event.target.error);
            reject(event.target.error);
        };

        request.onsuccess = (event) => {
            const db = event.target.result;
            resolve(db);
        };

        request.onupgradeneeded = (event) => {
            const db = event.target.result;
            if (!db.objectStoreNames.contains(WALLPAPER_STORE_NAME)) {
                db.createObjectStore(WALLPAPER_STORE_NAME, { keyPath: 'id' });
            }
            if (!db.objectStoreNames.contains(WALLPAPER_MEDIA_RANDOM_STORE_NAME)) {
                db.createObjectStore(WALLPAPER_MEDIA_RANDOM_STORE_NAME, { keyPath: 'id', autoIncrement: true });
            }
            if (!db.objectStoreNames.contains(WALLPAPER_MEDIA_CUSTOM_STORE_NAME)) {
                db.createObjectStore(WALLPAPER_MEDIA_CUSTOM_STORE_NAME, { keyPath: 'id', autoIncrement: true });
            }
        };
    });
}

// 初始化壁纸加载
async function initWallpaerLoader() {
    // 从 indexedDB 获取随机图片列表
    await loadWallpaperPictures();

    // 渲染壁纸列表
    await renderWallpaperList();

    // 初始化并设置背景图片
    setBgImgInit();

    const startTime = Date.now(); // 记录开始加载时间

    const bg = new BroadcastChannel("bgLoad");
    let loadTimeout;

    // 设置加载超时定时器
    loadTimeout = setTimeout(() => {
        const elapsedTime = Date.now() - startTime;
        const remainingTime = Math.max(0, 300 - elapsedTime);
        setTimeout(() => {
            frameStyle.removeLoading();
            $('.tool-all').css('transform', 'translateY(-120%)');
            $('.tool-all').css('opacity', '1');
            $('.all-search').css('transform', 'translateY(0%)');
            $('#section').css("cssText", "opacity: 1;transition: ease 1.5s;");
            $('.cover').css("cssText", "opacity: 1;transition: ease 1.5s;");
            showWelcomeMessage();
            bg.onmessage = (event) => {
                if (event.data === "bgImgLoadinged") {
                    $('#bg-video').css({ 'opacity': '1', 'transform': 'scale(1)' });
                    $('#bg').css({ 'opacity': '1', 'transform': 'scale(1)' });
                    bg.close();
                }
            };
        }, remainingTime);
    }, 1500);

    bg.onmessage = (event) => {
        if (event.data === "bgImgLoadinged") {
            clearTimeout(loadTimeout);
            const elapsedTime = Date.now() - startTime;
            const remainingTime = Math.max(0, 300 - elapsedTime);
            setTimeout(() => {
                frameStyle.removeLoading();
                $('.tool-all').css('transform', 'translateY(-120%)');
                $('.tool-all').css('opacity', '1');
                $('#bg-video').css({ 'opacity': '1', 'transform': 'scale(1)' });
                $('#bg').css({ 'opacity': '1', 'transform': 'scale(1)' });
                $('.all-search').css('transform', 'translateY(0%)');
                $('#section').css("cssText", "opacity: 1;transition: ease 1.5s;");
                $('.cover').css("cssText", "opacity: 1;transition: ease 1.5s;");
                bg.close();
                showWelcomeMessage();
            }, remainingTime);
        }
    };
}

// 初始化壁纸设置状态
function initWallpaperSettingsState(typeIndex) {
    // 根据已选项设置选中的 radio
    $(":input[name='wallpaper-type']").each(function (index) {
        if (index === typeIndex) {
            $(this).prop("checked", true);
        } else {
            $(this).prop("checked", false);
        }
    });

    $("#wallpaper-list-setting").removeClass('show');
    $("#wallpaper_color").removeClass('show');
    $("#wallpaper-button").removeClass('show');
    $(".wallpaper_container").removeClass('show');
    $(".wallpapers_content .set_blocks_content").removeClass('hide');

    if (typeIndex === 0) {
        $("#wallpaper-button").addClass('show');
        $(".wallpaper_container").addClass('show');
    } else if (typeIndex === 1) {
        $("#wallpaper-list-setting").addClass('show');
    } else if (typeIndex === 2) {
        // 移除 onerror 事件处理器
        // 避免触发 error
        $('#bg').removeAttr('onerror');
        $('#bg').attr('src', '');
        $('#bg').removeClass('error');

        // 纯色背景选项
        $("#wallpaper_color").addClass('show');
        $("#wallpaper-button").addClass('show');

        // 从 localStorage 读取保存的颜色
        const savedColor = localStorage.getItem('solidColorBackground') || '#ffffff';
        $('#wallpaper-color-input').val(savedColor);
        $('#wallpaper-color-picker').val(savedColor);
    } else {
        $(".wallpapers_content .set_blocks_content").addClass('hide');
    }
}

// 获取随机壁纸 URL
function getWallpaperURL(typeIndex) {
    if (typeIndex === 0) {
        return './img/background5.webp';
    } else if (typeIndex === 1) {
        return getRandomDefaultWallpaperURL(); //随机默认壁纸
    } else if (typeIndex < wallpaperOptions.length && wallpaperOptions[typeIndex].url) {
        // 使用 wallpaperOptions 中的 url
        return wallpaperOptions[typeIndex].url;
    } else {
        // 默认壁纸
        return getRandomDefaultWallpaperURL(); // 随机默认壁纸
    }
}

// 纯色背景处理
function handleSolidColorBackground(bg) {
    const savedColor = localStorage.getItem('solidColorBackground') || '#ffffff';
    // 应用纯色背景
    $('#bg').attr('src', '');
    $('#bg').css({ 'opacity': '1', 'filter': 'var(--main-box-gauss-plus)', 'transition': 'ease 0.7s', 'background-color': savedColor });
    bg.postMessage("bgImgLoadinged");
    bg.close();
}

// 视频壁纸处理
function setupVideoElement(videoElement, url, bg) {
    // 检查视频 URL
    if (!url) {
        console.error('视频 URL 为空');
        // 回退为默认壁纸
        loadDefaultWallpaper(bg);
        return;
    }

    // 添加唯一标识符
    const videoId = 'video_' + Date.now();
    videoElement.data('video-id', videoId);

    videoElement.attr('src', url);
    videoElement.attr('loop', true);
    videoElement.attr('muted', false);
    videoElement.attr('autoplay', true);
    videoElement.css({ 'filter': 'blur(0px)', 'transition': 'ease 0.7s' });

    // 加载超时
    let loadTimeout = setTimeout(function () {
        // 检查视频元素是否仍然有效
        if (videoElement.data('video-id') === videoId) {
            iziToast.message({
                title: '加载超时',
                message: '已加载默认壁纸',
                timeout: 2000
            });
            loadDefaultWallpaper(bg);
        }
    }, 10000);

    // 清除定时器
    videoElement.on('loadeddata', function () {
        if (videoElement.data('video-id') === videoId) {
            clearTimeout(loadTimeout);
        }
    });

    videoElement.on('error', function () {
        if (videoElement.data('video-id') === videoId) {
            clearTimeout(loadTimeout);
        }
    });

    // 加载完成处理
    videoElement.on('loadeddata', function () {
        // 检查视频元素是否有效
        if (videoElement.data('video-id') !== videoId) {
            return;
        }

        const hasSeenInitialPrompt = localStorage.getItem('wallpaperSoundPromptShown') === 'true';
        const isEnabled = localStorage.getItem('bgVideoSound') === 'true';

        if (isEnabled && !hasSeenInitialPrompt) {
            iziToast.show({
                timeout: 8000,
                message: '已开启壁纸音效，是否现在打开声音?',
                position: 'bottomCenter',
                transitionIn: 'bounceInUp',
                transitionOut: 'fadeOutDown',
                transitionInMobile: 'fadeInUp',
                transitionOutMobile: 'fadeOutDown',
                buttons: [
                    ['<button>确定</button>', (instance, toast) => {
                        this.muted = false;
                        this.play();
                        instance.hide({ transitionOut: 'fadeOutDown' }, toast, 'button');
                    }, true],
                    ['<button>取消</button>', (instance, toast) => {
                        this.muted = true;
                        this.play();
                        instance.hide({ transitionOut: 'fadeOutDown' }, toast, 'button');
                    }]
                ]
            });
            localStorage.setItem('wallpaperSoundPromptShown', 'true');
        }

        this.play().catch(e => {
            console.error('播放失败:' + e);
            if (hasSeenInitialPrompt && isEnabled) {
                this.muted = true;
                this.play();
            }
        });

        try {
            if (bg && bg.postMessage) {
                // 加载完成后播放
                bg.postMessage("bgImgLoadinged");
                bg.close();
            }
        } catch (e) {
            console.error('与壁纸通信失败:' + e);
        }
    });

    // 加载失败处理
    videoElement.on('error', function () {
        // 检查视频元素是否有效
        if (videoElement.data('video-id') !== videoId) {
            return;
        }

        console.error('视频加载失败' + this);
        // 回退为默认壁纸
        loadDefaultWallpaper(bg);
    });
}

// 图片壁纸处理
function setupImageElement(url, bg, saveToSession = true) {
    $('#bg').attr('src', url);
    if (saveToSession) {
        sessionStorage.setItem('bgImageFinalURL', url);
    }
    const img = new Image();
    img.onload = function () {
        $('#bg').css({ 'filter': 'blur(0px)', 'transition': 'ease 0.7s' });
        try {
            if (bg && bg.postMessage) {
                bg.postMessage("bgImgLoadinged");
                bg.close();
            }
        } catch (e) {
            console.error('与壁纸通信失败:' + e);
        }
    };
    img.src = url;
}

// indexedDB 壁纸处理
function handleIndexedDBMedia(mediaInfo, bg) {
    if (mediaInfo && mediaInfo.url) {
        // 检查是否是视频
        if (mediaInfo.type && mediaInfo.type.startsWith('video/')) {
            let videoElement = $('#bg-video');
            if (videoElement.length === 0) {
                videoElement = $('<video id="bg-video"></video>');
                $('#bg').after(videoElement);
            }

            $('#wallpaper-sound-option').addClass('active');

            $('#bg').hide();
            videoElement.show();

            // 应用壁纸
            setupVideoElement(videoElement, mediaInfo.url, bg);
        } else {
            $('#bg-video').hide();
            $('#bg').show();

            // 应用壁纸
            setupImageElement(mediaInfo.url, bg);
        }
    } else {
        console.error('未获取到壁纸文件');
        iziToast.message({
            title: '未获取到壁纸文件',
            message: '已加载默认壁纸',
            timeout: 2000
        });
        // 回退为默认壁纸
        loadDefaultWallpaper(bg);
    }
}

// URL 重定向处理
function handleRedirectMedia(finalUrl, bg) {
    // 检查是否是视频
    const videoExtensions = ['.mp4', '.webm', '.ogg', '.mov', '.avi'];
    const isVideo = videoExtensions.some(ext => finalUrl.toLowerCase().includes(ext));

    if (isVideo) {
        let videoElement = $('#bg-video');
        if (videoElement.length === 0) {
            videoElement = $('<video id="bg-video"></video>');
            $('#bg').after(videoElement);
        }

        $('#wallpaper-sound-option').addClass('active');

        $('#bg').hide();
        videoElement.show();

        // 应用壁纸
        setupVideoElement(videoElement, finalUrl, bg);
    } else {
        $('#bg-video').hide();
        $('#bg').show();

        // 应用壁纸
        setupImageElement(finalUrl, bg);
    }
}

// 直接加载 URL (URL 重定向失败时)
function handleOriginalImageLoad(pictureURL, bg) {
    $('#bg').attr('src', pictureURL);
    const img = new Image();
    img.onload = function () {
        $('#bg').css("cssText", "opacity: 1;filter: blur(0px);transition: ease 0.7s;");
        sessionStorage.setItem('bgImageFinalURL', img.src);
        try {
            if (bg && bg.postMessage) {
                bg.postMessage("bgImgLoadinged");
                bg.close();
            }
        } catch (e) {
            console.error('与壁纸通信失败:' + e);
        }
    };
    img.src = pictureURL;
}

// 清理初始化元素
function cleanupPreviousWallpaper() {
    const videoElement = $('#bg-video');
    if (videoElement.length > 0) {
        videoElement.off(); // 移除事件监听器
        videoElement.removeAttr('src');
        videoElement.hide();
    }

    $('#wallpaper-sound-option').removeClass('active');
    $('#bg').off(); // 移除事件监听器
    $('#bg').removeAttr('src');
    $('#bg').show();
}

// 设置-壁纸初始化
function setBgImgInit() {
    // 清理初始化元素
    cleanupPreviousWallpaper();

    const bg = new BroadcastChannel("bgLoad");

    var bg_img = getBgImg();
    var typeIndex = parseInt(bg_img["type"]) || 0;

    // 初始化壁纸设置状态
    initWallpaperSettingsState(typeIndex);

    bg.postMessage("bgImgLoadingStart");

    // 纯色背景处理
    if (typeIndex === 2) {
        handleSolidColorBackground(bg);
        return;
    }

    // 获取壁纸 URL
    var pictureURL = getWallpaperURL(typeIndex);

    // 检查是否是 indexedDB URL
    const mediaId = parseIndexedDBMediaUrl(pictureURL);
    if (mediaId) {
        // 从 indexedDB 获取文件
        getMediaFileFromDB(mediaId).then(mediaInfo => {
            handleIndexedDBMedia(mediaInfo, bg);
        }).catch(error => {
            console.error('从 indexedDB 获取文件失败:' + error);
            iziToast.message({
                title: '获取壁纸失败',
                message: '已加载默认壁纸',
                timer: 2000
            });
            // 回退为默认壁纸
            loadDefaultWallpaper(bg);
        });
    } else {
        // 跟踪 API 重定向
        fetch(pictureURL)
            .then(response => {
                const finalUrl = response.url;
                handleRedirectMedia(finalUrl, bg);
            })
            .catch(error => {
                console.error('Failed to track media redirect:', error);
                // 原始方法
                handleOriginalImageLoad(pictureURL, bg);
            });
    }
}

// 获取随机壁纸 URL
function getRandomDefaultWallpaperURL() {
    if (wallpaperPictures.length === 0) {
        // 默认返回第一张
        return defaultPictures[0];
    }
    const rd = Math.floor(Math.random() * wallpaperPictures.length);
    return wallpaperPictures[rd];
}

// 获取背景图片
function getBgImg() {
    var bg_img_local = localStorage.getItem('bg_img');
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
        localStorage.setItem('bg_img', JSON.stringify(bg_img));
        return true;
    }
    return false;
}

// 设置-壁纸选项初始化
async function initWallpaperSettings() {
    // 从 indexedDB 加载壁纸列表
    await loadWallpaperOptions();

    // 刷新壁纸列表
    refreshWallpaperOptions();

    // 壁纸设置
    $("#wallpaper").on("click", ".set-wallpaper", function () {
        var index = parseInt($(this).val());
        var bg_img = getBgImg();

        bg_img["type"] = index.toString();
        setBgImg(bg_img);

        if (index === 0) {
            $('#wallpaper_text').html("添加壁纸项");
        } else if (index === 2) {
            $('#wallpaper_text').html("纯色背景");
            iziToast.show({
                message: '切换成功',
                timeout: 2000
            });
        } else {
            iziToast.show({
                message: '切换成功',
                timeout: 2000
            });
        }

        if (index < wallpaperOptions.length) {
            $('#wallpaper_text').html(wallpaperOptions[index].description);
        }

        changeWallpaper();
    });

    $(".wallpaper_save").click(function () {
        const currentType = parseInt(getBgImg()["type"]) || 0;

        // 纯色背景
        if (currentType === 2) {
            const color = $('#wallpaper-color-input').val().trim();

            // 验证颜色格式
            if (!color || !/^#[0-9A-F]{6}$/i.test(color)) {
                iziToast.show({
                    message: '请输入16进制颜色',
                    timeout: 2000
                });
                return;
            }

            // 保存颜色到 localStorage
            localStorage.setItem('solidColorBackground', color);

            // 应用颜色
            $('#bg').css('background-color', color);
            $('#bg').attr('src', '');
            $('#bg').css({ 'opacity': '1', 'filter': 'blur(0px)', 'transition': 'ease 0.7s' });

            iziToast.show({
                message: '保存成功',
                timeout: 2000
            });

            return;
        }

        const name = $('#wallpaper-name').val().trim(); // 壁纸 NAME
        const url = $('#wallpaper-url').val().trim(); // 壁纸 URL
        const fileInput = $('#wallpaper-file')[0];
        const file = fileInput.files[0];

        // 验证
        if (!name) {
            iziToast.show({
                message: '请输入壁纸名',
                timeout: 2000
            });
            return;
        }

        const existingIndex = wallpaperOptions.findIndex(option => option.label === name);
        if (existingIndex !== -1) {
            iziToast.show({
                message: '已存在相同名称的壁纸',
                timeout: 2000
            });
            return;
        }

        // 优先使用文件
        if (file) {
            // 验证文件类型
            if (!file.type.startsWith('image/') && !file.type.startsWith('video/')) {
                iziToast.show({
                    message: '请上传正确的图片或视频',
                    timeout: 2000
                });
                return;
            }

            iziToast.show({
                id: 'upload',
                message: '正在上传',
                timeout: 2000
            });

            // 保存到 indexedDB
            saveMediaFileToDB(file).then(mediaId => {
                const indexedDBUrl = generateIndexedDBMediaUrl(mediaId);

                // 添加新壁纸项
                const newOption = {
                    label: name,
                    url: indexedDBUrl,
                    description: `自定义壁纸项: ${name}`,
                    mediaId: mediaId
                };

                wallpaperOptions.push(newOption);
                window.wallpaperOptions = wallpaperOptions;

                // 保存新列表到 indexedDB
                saveWallpaperOptionsToDB(wallpaperOptions)

                // 清空输入框
                $('#wallpaper-name').val('');
                $('#wallpaper-url').val('').prop('disabled', false).removeClass('disabled');
                $('#wallpaper-file').val('');

                // 刷新壁纸列表
                refreshWallpaperOptions();

                iziToast.show({
                    id: 'upload',
                    message: '上传成功',
                    timeout: 2000
                });
            }).catch(error => {
                console.error('文件保存失败:' + error);
                iziToast.show({
                    id: 'upload',
                    message: '上传失败',
                    timeout: 2000
                });
            });

            return;
        }

        // 使用 URL (未选择文件)
        if (!url) {
            iziToast.show({
                message: '请输入壁纸 URL 或上传文件',
                timeout: 2000
            });
            return;
        }

        // 验证格式
        if (!url.startsWith('http://') && !url.startsWith('https://')) {
            iziToast.show({
                message: 'URL必须以 http:// 或 https:// 开头',
                timeout: 2000,
                color: 'red'
            });
            return;
        }

        // 添加新壁纸项
        const newOption = {
            label: name,
            url: url,
            description: `自定义壁纸项: ${name}`
        };

        wallpaperOptions.push(newOption);
        window.wallpaperOptions = wallpaperOptions;

        // 保存新列表到 indexedDB
        saveWallpaperOptionsToDB(wallpaperOptions)

        // 清空输入框
        $('#wallpaper-name').val('');
        $('#wallpaper-url').val('');

        // 刷新壁纸列表
        refreshWallpaperOptions();

        iziToast.show({
            message: '添加成功',
            timeout: 2000
        });
    });

    $("#add-wallpaper-btn").click(function () {
        const tempFileInput = document.createElement('input');
        tempFileInput.type = 'file';
        tempFileInput.accept = 'image/*';
        tempFileInput.style.display = 'none';

        document.body.appendChild(tempFileInput);

        tempFileInput.addEventListener('change', async function () {
            const file = this.files[0];
            if (file) {
                if (!file.type.startsWith('image/')) {
                    iziToast.show({
                        message: '随机壁纸仅支持图片文件',
                        timeout: 2000
                    });
                    document.body.removeChild(this);
                    return;
                }

                try {
                    await addWallpaperToList(file);
                    renderWallpaperList();
                    iziToast.show({
                        message: '上传成功',
                        timeout: 2000
                    });
                } catch (error) {
                    console.error(error);
                    iziToast.show({
                        message: '上传失败',
                        timeout: 2000
                    });
                }
            }
            document.body.removeChild(this);
        });

        tempFileInput.click();
    });

    $("#wallpaper-upload-btn").click(function () {
        $('#wallpaper-file').click();
    });

    $("#wallpaper-file").change(function () {
        const file = this.files[0];
        if (file) {
            // 预填写
            $('#wallpaper-url').val(`File:${file.name}`);
            // 禁用链接输入
            $('#wallpaper-url').prop('disabled', true).addClass("disabled");;

            // 自动填充名称
            const nameWithoutExt = file.name.replace(/\.[^/.]+$/, "");
            $('#wallpaper-name').val(nameWithoutExt);
        }
    });

    $("#color-picker-btn").click(function () {
        $('#wallpaper-color-picker').click();
    });

    $("#wallpaper-color-picker").change(function () {
        const selectedColor = $(this).val();
        $('#wallpaper-color-input').val(selectedColor);
    });

    $("#wallpaper-color-input").on('input', function () {
        const inputColor = $(this).val();
        // 验证是否为16进制颜色
        if (/^#[0-9A-F]{6}$/i.test(inputColor)) {
            $('#wallpaper-color-picker').val(inputColor);
        }
    });

    function initColorPicker() {
        const savedColor = localStorage.getItem('solidColorBackground') || '#ffffff';
        $('#wallpaper-color-input').val(savedColor);
        $('#wallpaper-color-picker').val(savedColor);
    }

    // 初始化调色盘
    $('input[name="wallpaper-type"][value="2"]').click(() => setTimeout(
        initColorPicker, 100
    ));

}

// 壁纸切换
function changeWallpaper() {
    // 淡出效果
    $('#bg').css("cssText", "opacity: 0;transform: scale(1);filter: blur(var(--main-box-gauss));transition: ease 0.3s;");
    $('#bg-video').css("cssText", "opacity: 0;transform: scale(1);filter: blur(var(--main-box-gauss));transition: ease 0.3s;");

    setTimeout(() => {
        // 移除 onerror 事件处理器
        // 避免触发 error
        $('#bg').removeAttr('onerror');
        $('#bg').attr('src', '');
        $('#bg').removeClass('error');

        // 重置视频
        const videoElement = $('#bg-video');
        if (videoElement.length > 0) {
            videoElement[0].pause();
            videoElement.attr('src', '');
            videoElement.hide();
        }

        $('#bg').show();

        // 重新监听加载完成事件
        const bg = new BroadcastChannel("bgLoad");

        bg.onmessage = function (event) {
            if (event.data === "bgImgLoadinged") {
                $('#bg-video').css({ 'opacity': '1', 'transform': 'scale(1.08)', 'filter': 'var(--main-box-gauss-plus)', 'transition': 'ease 0.7s' });
                $('#bg').css({ 'opacity': '1', 'transform': 'scale(1.08)', 'filter': 'var(--main-box-gauss-plus)', 'transition': 'ease 0.7s' });
                bg.close();
            }
        };

        bg.postMessage("bgImgLoadingStart");

        setBgImgInit();

        var bg_img = getBgImg();
        var typeIndex = parseInt(bg_img["type"]) || 0;
        if (typeIndex !== 2) {
            setTimeout(() => {
                $('#bg').attr('onerror', 'this.classList.add("error");');
            }, 100);
        }
    }, 300);
}

// 刷新壁纸列表
function refreshWallpaperOptions() {
    const wallpaperContainer = $('#wallpaper');
    wallpaperContainer.empty();

    // 获取当前选中的壁纸类型
    const bg_img = getBgImg();
    const currentType = parseInt(bg_img["type"]) || 0;

    wallpaperOptions.forEach((option, index) => {
        const radioDiv = $('<div class="form-radio">');
        const radioInput = $(`<input type="radio" id="radio${index}" class="set-wallpaper ${index === 0 ? 'wallpaper-custom' : ''}" name="wallpaper-type" value="${index}" style="display: none;">`);
        const radioLabel = $(`<label class="form-radio-label" for="radio${index}">${option.label}</label>`);

        radioDiv.append(radioInput);
        radioDiv.append(radioLabel);

        // 限定删除
        if (index > 1 && index !== 2) {
            const deleteBtn = $(`<div class="delete-wallpaper" style="height: 24px !important;" data-index="${index}"><i class="iconfont icon-delete"></i></div>`);

            radioDiv.append(deleteBtn);

            // 长按显示删除按钮
            let pressTimer;
            let isLongPress = false;
            let lastToggleTime = 0; // 记录切换时间
            const COOLDOWN_TIME = 800; // 间隔时间 (ms)

            radioDiv.on('mousedown touchstart', function (e) {
                // 排除删除按钮
                if ($(e.target).closest('.delete-wallpaper').length > 0) {
                    return;
                }

                isLongPress = false;
                pressTimer = setTimeout(function () {
                    isLongPress = true;
                    const currentTime = Date.now();

                    // 检查是否在间隔时间内
                    if (currentTime - lastToggleTime < COOLDOWN_TIME) {
                        return; // 在间隔时间内，不切换
                    }

                    // 删除按钮显隐切换
                    if (radioDiv.hasClass('long-pressed')) {
                        radioDiv.removeClass('long-pressed');
                    } else {
                        radioDiv.addClass('long-pressed');
                    }

                    // 更新切换时间
                    lastToggleTime = currentTime;
                }, 800); // 长按 0.8s
            });

            radioDiv.on('mouseup mouseleave touchend', function () {
                clearTimeout(pressTimer);
                // 重置长按状态
                setTimeout(() => {
                    isLongPress = false;
                }, 100);
            });

            // 长按不触发壁纸切换
            radioDiv.on('click', function (e) {
                if (isLongPress) {
                    e.preventDefault();
                    e.stopPropagation();
                    isLongPress = false;
                }
            });

            // 右键显示删除按钮
            radioDiv.on('contextmenu', function (e) {
                e.preventDefault(); // 阻止右键菜单

                // 排除删除按钮
                if ($(e.target).closest('.delete-wallpaper').length > 0) {
                    return;
                }

                const currentTime = Date.now();

                // 检查是否在间隔时间内
                if (currentTime - lastToggleTime < COOLDOWN_TIME) {
                    return; // 在间隔时间内，不切换
                }

                // 按钮显隐切换
                if (radioDiv.hasClass('long-pressed')) {
                    radioDiv.removeClass('long-pressed');
                } else {
                    radioDiv.addClass('long-pressed');
                }

                // 更新切换时间
                lastToggleTime = currentTime;
            });

            // 删除按钮点击
            deleteBtn.on('click', function (e) {
                e.stopPropagation();
                const deleteIndex = parseInt($(this).data('index'));

                // 读取 localStorage 中的值来判断
                // 当前壁纸项是否正在使用
                const bg_img = getBgImg();
                const currentWallpaperType = parseInt(bg_img["type"]) || 0;

                if (deleteIndex === currentWallpaperType) {
                    iziToast.show({
                        message: '无法删除正在使用的壁纸',
                        timeout: 2000
                    });
                    return;
                }

                // 获取壁纸列表
                const wallpaperToDelete = wallpaperOptions[deleteIndex];

                // 二次确认
                iziToast.show({
                    message: `确定删除?`,
                    buttons: [
                        ['<button><b>确定</b></button>', function (instance, toast) {
                            if (wallpaperToDelete.mediaId) {
                                deleteMediaFileFromDB(wallpaperToDelete.mediaId)
                            }

                            // 保存新列表到 indexedDB
                            wallpaperOptions.splice(deleteIndex, 1);
                            window.wallpaperOptions = wallpaperOptions;
                            saveWallpaperOptionsToDB(wallpaperOptions)

                            iziToast.show({
                                message: '删除成功',
                                timeout: 2000
                            });

                            // 重置长按状态
                            radioDiv.removeClass('long-pressed');

                            // 刷新列表
                            refreshWallpaperOptions();

                            instance.hide({ transitionOut: 'fadeOut' }, toast, 'button');
                        }, true],
                        ['<button>取消</button>', function (instance, toast) {
                            instance.hide({ transitionOut: 'fadeOut' }, toast, 'button');
                        }]
                    ]
                });
            });
        }

        wallpaperContainer.append(radioDiv);
    });

    // 恢复当前选中的壁纸状态
    setTimeout(() => {
        $(`:input[name='wallpaper-type'][value='${currentType}']`).prop('checked', true);
    }, 10);
}

// 渲染壁纸列表
function renderWallpaperList() {
    const wallpaperList = document.getElementById('wallpaper-list');
    if (!wallpaperList) return;

    wallpaperList.innerHTML = '';

    wallpaperPictures.forEach((picture, index) => {
        const wallpaperItem = document.createElement('div');
        wallpaperItem.className = 'wallpaper-item';

        const img = document.createElement('img');
        if (picture.startsWith('data:')) {
            img.src = picture;
        } else {
            img.src = picture;
        }
        img.alt = `壁纸 ${index + 1}`;

        const deleteBtn = document.createElement('button');
        deleteBtn.className = 'delete-btn';
        deleteBtn.innerHTML = '<i class="iconfont icon-delete"></i>';

        deleteBtn.addEventListener('click', async () => {
            // 弹出二次确认对话框
            iziToast.show({
                message: '确定删除?',
                buttons: [
                    ['<button>确定</button>', async (instance, toast) => {
                        try {
                            await removeWallpaperFromList(index);
                            renderWallpaperList();
                            iziToast.show({
                                message: '删除成功',
                                timeout: 2000
                            });
                        } catch (error) {
                            console.error(error);
                            iziToast.show({
                                message: '删除失败',
                                timeout: 2000
                            });
                        }
                        instance.hide({ transitionOut: 'fadeOut' }, toast, 'button');
                    }, true],
                    ['<button>取消</button>', (instance, toast) => {
                        instance.hide({ transitionOut: 'fadeOut' }, toast, 'button');
                    }]
                ]
            });
        });

        wallpaperItem.appendChild(img);
        wallpaperItem.appendChild(deleteBtn);
        wallpaperList.appendChild(wallpaperItem);
    });
}

// 加载壁纸列表
async function loadCustomWallpaperOptions() {
    try {
        await loadWallpaperOptions();
        window.wallpaperOptions = wallpaperOptions;
    } catch (e) {
        console.error('从 IndexedDB 加载壁纸列表失败:' + e);
    }
}

// 从 indexedDB 加载壁纸列表
async function loadWallpaperOptions() {
    try {
        const savedOptions = await getWallpaperOptionsFromDB();
        if (savedOptions && Array.isArray(savedOptions)) {
            wallpaperOptions = savedOptions;
            window.wallpaperOptions = wallpaperOptions;
        } else {
            // 使用默认壁纸列表
            wallpaperOptions = [...defaultWallpaperOptions];
            window.wallpaperOptions = wallpaperOptions;
        }
    } catch (error) {
        // 使用默认壁纸列表
        console.error('加载壁纸列表失败:', error);
        wallpaperOptions = [...defaultWallpaperOptions];
        window.wallpaperOptions = wallpaperOptions;
    }
}

// 从 indexedDB 获取壁纸列表保存的图片
async function getWallpaperPicturesFromDB() {
    try {
        const db = await initIndexedDB();
        return new Promise((resolve, reject) => {
            const transaction = db.transaction([WALLPAPER_MEDIA_RANDOM_STORE_NAME], 'readonly');
            const store = transaction.objectStore(WALLPAPER_MEDIA_RANDOM_STORE_NAME);
            const request = store.getAll();

            request.onsuccess = (event) => {
                const result = event.target.result;
                if (result && result.length > 0) {
                    // 获取 URL
                    const pictures = result.map(item => {
                        if (item.data) {
                            return `data:${item.type};base64,${item.data}`;
                        }
                        return null;
                    }).filter(url => url !== null);
                    resolve(pictures);
                } else {
                    resolve(null);
                }
            };

            request.onerror = (event) => {
                console.error('从 indexedDB 获取壁纸列表失败:' + event.target.error);
                reject(event.target.error);
            };
        });
    } catch (error) {
        console.error('获取壁纸列表时加载数据库失败:' + error);
        return null;
    }
}

// 保存图片到 indexedDB (增加壁纸列表时上传的文件)
async function saveMediaFileToDB(file) {
    try {
        const db = await initIndexedDB();
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = async function (event) {
                // 读取 Base64
                const base64Data = event.target.result;
                const base64Content = base64Data.split(',')[1];

                const mediaRecord = {
                    name: file.name,
                    type: file.type,
                    size: file.size,
                    data: base64Content,
                    uploadTime: new Date().toISOString()
                };

                const transaction = db.transaction([WALLPAPER_MEDIA_CUSTOM_STORE_NAME], 'readwrite');
                const store = transaction.objectStore(WALLPAPER_MEDIA_CUSTOM_STORE_NAME);
                const request = store.add(mediaRecord);

                request.onsuccess = (event) => {
                    resolve(event.target.result);
                };

                request.onerror = (event) => {
                    console.error('保存媒体文件到 indexedDB 失败:' + event.target.error);
                    reject(event.target.error);
                };
            };

            reader.onerror = (error) => {
                console.error('读取文件失败:' + error);
                reject(error);
            };

            reader.readAsDataURL(file);
        });
    } catch (error) {
        console.error('保存媒体文件时加载数据库失败:' + error);
        throw error;
    }
}

// 从 indexedDB 获取图片 (壁纸列表)
async function getMediaFileFromDB(id) {
    try {
        const db = await initIndexedDB();
        return new Promise((resolve, reject) => {
            const transaction = db.transaction([WALLPAPER_MEDIA_CUSTOM_STORE_NAME], 'readonly');
            const store = transaction.objectStore(WALLPAPER_MEDIA_CUSTOM_STORE_NAME);
            const request = store.get(id);

            request.onsuccess = (event) => {
                const result = event.target.result;
                if (result) {
                    // 将 Base64 转换为 Blob
                    const base64Data = `data:${result.type};base64,${result.data}`;
                    fetch(base64Data)
                        .then(res => res.blob())
                        .then(blob => {
                            // 创建 URL
                            const url = URL.createObjectURL(blob);
                            resolve({
                                id: result.id,
                                name: result.name,
                                type: result.type,
                                url: url,
                                blob: blob
                            });
                        })
                        .catch(error => {
                            console.error('Base64 转换为 Blob 失败:', error);
                            reject(error);
                        });
                } else {
                    resolve(null);
                }
            };

            request.onerror = (event) => {
                console.error('从 indexedDB 获取文件失败:', event.target.error);
                reject(event.target.error);
            };
        });
    } catch (error) {
        console.error('获取文件时加载数据库失败:', error);
        return null;
    }
}

// 从 indexedDB 删除图片 (壁纸列表)
async function deleteMediaFileFromDB(id) {
    try {
        const db = await initIndexedDB();
        return new Promise((resolve, reject) => {
            const transaction = db.transaction([WALLPAPER_MEDIA_CUSTOM_STORE_NAME], 'readwrite');
            const store = transaction.objectStore(WALLPAPER_MEDIA_CUSTOM_STORE_NAME);
            const request = store.delete(id);

            request.onsuccess = (event) => {
                resolve(true);
            };

            request.onerror = (event) => {
                console.error('从 indexedDB 删除文件失败:', event.target.error);
                reject(event.target.error);
            };
        });
    } catch (error) {
        console.error('删除文件时加载数据库失败:', error);
        return false;
    }
}

// 创建保存到 indexedDB 的图片 URL
function generateIndexedDBMediaUrl(id) {
    return `indexeddb://wallpaper/${id}`;
}

// 解析 indexedDB 图片 URL
function parseIndexedDBMediaUrl(url) {
    if (url && url.startsWith('indexeddb://wallpaper/')) {
        const id = parseInt(url.replace('indexeddb://wallpaper/', ''));
        return id;
    }
    return null;
}

// 应用随机壁纸
function loadDefaultWallpaper(bg) {
    const defaultPictureURL = getRandomDefaultWallpaperURL();

    $('#bg').attr('src', defaultPictureURL);
    sessionStorage.setItem('bgImageFinalURL', defaultPictureURL);
    const img = new Image();
    img.onload = function () {
        $('#bg').css("cssText", "opacity: 1;transform: scale(1);filter: blur(0px);transition: ease 0.7s;");
        try {
            if (bg && bg.postMessage) {
                bg.postMessage("bgImgLoadinged");
                bg.close();
            }
        } catch (e) {
            console.error('与壁纸通信失败:' + e);
        }
    };
    img.src = defaultPictureURL;
}

// 从 indexedDB 获取随机图片列表
async function loadWallpaperPictures() {
    try {
        const savedPictures = await getWallpaperPicturesFromDB();
        if (savedPictures && Array.isArray(savedPictures) && savedPictures.length > 0) {
            wallpaperPictures = savedPictures;
        } else {
            // 使用默认数据
            wallpaperPictures = [...defaultPictures];
            await saveWallpaperPicturesToDB(wallpaperPictures);
        }
    } catch (error) {
        console.error('加载壁纸列表失败:' + error);
        wallpaperPictures = [...defaultPictures];
    }
}

// 保存图片到 indexedDB (随机图片)
async function saveWallpaperPicturesToDB(pictures) {
    try {
        const db = await initIndexedDB();

        // 清空现有的壁纸数据
        await new Promise((resolve, reject) => {
            const transaction = db.transaction([WALLPAPER_MEDIA_RANDOM_STORE_NAME], 'readwrite');
            const store = transaction.objectStore(WALLPAPER_MEDIA_RANDOM_STORE_NAME);
            const clearRequest = store.clear();

            clearRequest.onsuccess = () => {
                resolve(true);
            };

            clearRequest.onerror = () => {
                reject(new Error('清空壁纸数据失败'));
            };
        });

        // 处理
        for (let index = 0; index < pictures.length; index++) {
            const pictureUrl = pictures[index];

            if (pictureUrl.startsWith('data:')) {
                // 直接保存 Base64
                await new Promise((resolve, reject) => {
                    const transaction = db.transaction([WALLPAPER_MEDIA_RANDOM_STORE_NAME], 'readwrite');
                    const store = transaction.objectStore(WALLPAPER_MEDIA_RANDOM_STORE_NAME);

                    const base64Data = pictureUrl.split(',')[1];
                    const type = pictureUrl.split(',')[0].split(':')[1].split(';')[0];

                    const mediaRecord = {
                        name: `wallpaper_${index + 1}`,
                        type: type,
                        size: 0,
                        data: base64Data,
                        uploadTime: new Date().toISOString()
                    };

                    const addRequest = store.add(mediaRecord);
                    addRequest.onsuccess = () => {
                        resolve(true);
                    };
                    addRequest.onerror = () => {
                        reject(new Error('保存壁纸数据失败'));
                    };
                });
            } else if (pictureUrl.startsWith('./img/')) {
                // 针对默认随机壁纸
                // 获取文件内容
                try {
                    const response = await fetch(pictureUrl);
                    const blob = await response.blob();

                    // 读取 Base64
                    const base64Data = await new Promise((resolve, reject) => {
                        const reader = new FileReader();
                        reader.onload = (event) => {
                            resolve(event.target.result.split(',')[1]);
                        };
                        reader.onerror = () => {
                            reject(new Error('文件读取失败'));
                        };
                        reader.readAsDataURL(blob);
                    });

                    // 保存到 indexedDB
                    await new Promise((resolve, reject) => {
                        const transaction = db.transaction([WALLPAPER_MEDIA_RANDOM_STORE_NAME], 'readwrite');
                        const store = transaction.objectStore(WALLPAPER_MEDIA_RANDOM_STORE_NAME);

                        const mediaRecord = {
                            name: `wallpaper_${index + 1}`,
                            type: blob.type,
                            size: blob.size,
                            data: base64Data,
                            uploadTime: new Date().toISOString()
                        };

                        const addRequest = store.add(mediaRecord);
                        addRequest.onsuccess = () => {
                            resolve(true);
                        };
                        addRequest.onerror = () => {
                            reject(new Error('保存壁纸数据失败'));
                        };
                    });
                } catch (error) {
                    console.error('获取图片失败:' + error);
                    throw error;
                }
            }
        }

        return true;
    } catch (error) {
        console.error('获取图片时读取数据库失败:' + error);
        return false;
    }
}

// 保存图片到随机图片列表
async function addWallpaperToList(file) {
    try {
        // 验证类型
        if (!file.type.startsWith('image/') && !file.type.startsWith('video/')) {
            throw new Error('仅支持图片或视频');
        }

        // 读取 Base64
        const reader = new FileReader();
        const base64Data = await new Promise((resolve, reject) => {
            reader.onload = (event) => {
                resolve(event.target.result);
            };
            reader.onerror = () => {
                reject(new Error('文件读取失败'));
            };
            reader.readAsDataURL(file);
        });

        // 添加到列表
        wallpaperPictures.push(base64Data);

        // 保存到 indexedDB
        await saveWallpaperPicturesToDB(wallpaperPictures);

        return true;
    } catch (error) {
        console.error('添加壁纸失败:' + error);
        throw error;
    }
}

// 从随机图片列表删除图片
async function removeWallpaperFromList(index) {
    try {
        if (wallpaperPictures.length <= 1) {
            throw new Error('列表中至少保留一张图片');
        }

        if (index < 0 || index >= wallpaperPictures.length) {
            throw new Error('无效壁纸索引');
        }

        // 从列表中删除
        wallpaperPictures.splice(index, 1);

        // 保存到 indexedDB
        await saveWallpaperPicturesToDB(wallpaperPictures);

        return true;
    } catch (error) {
        console.error('删除壁纸失败:' + error);
        throw error;
    }
}

// 从 indexedDB 获取壁纸选项
async function getWallpaperOptionsFromDB() {
    try {
        const db = await initIndexedDB();
        return new Promise((resolve, reject) => {
            const transaction = db.transaction([WALLPAPER_STORE_NAME], 'readonly');
            const store = transaction.objectStore(WALLPAPER_STORE_NAME);
            const request = store.get(WALLPAPER_KEY);

            request.onsuccess = (event) => {
                const result = event.target.result;
                if (result && result.data) {
                    resolve(result.data);
                } else {
                    resolve(null);
                }
            };

            request.onerror = (event) => {
                console.error('从 indexedDB 获取壁纸选项失败:' + event.target.error);
                reject(event.target.error);
            };
        });
    } catch (error) {
        console.error('获取壁纸选项时加载数据库失败:' + error);
        return null;
    }
}

// 保存壁纸选项到 indexedDB
async function saveWallpaperOptionsToDB(options) {
    try {
        const db = await initIndexedDB();
        return new Promise((resolve, reject) => {
            const dataRecord = {
                id: WALLPAPER_KEY,
                data: options,
                saveTime: new Date().toISOString()
            };

            const transaction = db.transaction([WALLPAPER_STORE_NAME], 'readwrite');
            const store = transaction.objectStore(WALLPAPER_STORE_NAME);
            const request = store.put(dataRecord);

            request.onsuccess = (event) => {
                resolve(true);
            };

            request.onerror = (event) => {
                console.error('保存壁纸选项到 indexedDB 失败:' + event.target.error);
                reject(event.target.error);
            };
        });
    } catch (error) {
        console.error('保存壁纸选项时加载数据库失败:' + error);
        return false;
    }
}