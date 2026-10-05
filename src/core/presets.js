// 预置数据

// 默认快捷方式
export const quick_list_preinstall = {
    '1': { title: 'Vercel', url: 'https://vercel.com/' },
    '2': { title: 'GitHub', url: 'https://github.com/' },
    '3': { title: 'Cloudflare', url: 'https://dash.cloudflare.com/' },
    '4': { title: 'W3school', url: 'https://www.w3school.com.cn/' },
    '5': { title: '腾讯云', url: 'https://console.cloud.tencent.com/' },
    '6': { title: '阿里云', url: 'https://console.aliyun.com/' },
    '7': { title: '百度网盘', url: 'https://pan.baidu.com/' },
    '8': { title: '阿里云盘', url: 'https://www.aliyundrive.com/drive/' },
    '9': { title: 'Office', url: 'https://www.office.com/' },
    '10': { title: '又拍云', url: 'https://console.upyun.com/' },
    '11': { title: 'CSDN', url: 'https://www.csdn.net/' },
    '12': { title: '哔哩哔哩', url: 'https://www.bilibili.com/' }
};

// 默认搜索引擎列表
export const se_list_preinstall = {
    '1': { id: 1, title: '百度', url: 'https://www.baidu.com/s', name: 'wd', icon: 'iconfont icon-baidu' },
    '2': { id: 2, title: '必应', url: 'https://cn.bing.com/search', name: 'q', icon: 'iconfont icon-bing' },
    '3': { id: 3, title: '谷歌', url: 'https://www.google.com/search', name: 'q', icon: 'iconfont icon-google' },
    '4': { id: 4, title: 'Yandex', url: 'https://yandex.eu/search', name: 'text', icon: 'iconfont icon-yandex' },
    '5': { id: 5, title: 'Duckduckgo', url: 'https://duckduckgo.com', name: 't=h_&q', icon: 'iconfont icon-duckduckgo' },
    '6': { id: 6, title: '搜狗', url: 'https://www.sogou.com/web', name: 'query', icon: 'iconfont icon-sougousousuo' },
    '7': { id: 7, title: '360', url: 'https://www.so.com/s', name: 'q', icon: 'iconfont icon-a-360sousuo' },
    '8': { id: 8, title: '微博', url: 'https://s.weibo.com/weibo', name: 'q', icon: 'iconfont icon-xinlangweibo' },
    '9': { id: 9, title: '知乎', url: 'https://www.zhihu.com/search', name: 'q', icon: 'iconfont icon-zhihu' },
    '10': { id: 10, title: 'Github', url: 'https://github.com/search', name: 'q', icon: 'iconfont icon-github' },
    '11': { id: 11, title: 'BiliBili', url: 'https://search.bilibili.com/all', name: 'keyword', icon: 'iconfont icon-bilibilidonghua' },
    '12': { id: 12, title: '淘宝', url: 'https://s.taobao.com/search', name: 'q', icon: 'iconfont icon-taobao' },
    '13': { id: 13, title: '京东', url: 'https://search.jd.com/Search', name: 'keyword', icon: 'iconfont icon-jingdong' }
};

// 默认壁纸设置
export const bg_img_preinstall = {
    type: '1'
};

// 静态资源基路径
const BASE_URL = import.meta.env.BASE_URL;

// 默认随机壁纸列表
export const defaultPictures = [
    `${BASE_URL}img/background1.webp`,
    `${BASE_URL}img/background2.webp`,
    `${BASE_URL}img/background3.webp`,
    `${BASE_URL}img/background4.webp`,
    `${BASE_URL}img/background5.webp`,
    `${BASE_URL}img/background6.webp`,
    `${BASE_URL}img/background7.webp`,
    `${BASE_URL}img/background8.webp`,
    `${BASE_URL}img/background9.webp`,
    `${BASE_URL}img/background10.webp`
];

// 默认壁纸列表
export const defaultWallpaperOptions = [
    {
        label: "<i class='iconfont icon-add'></i>",
        url: '',
        description: '@global:setting-set-wallpaper-add'
    },
    {
        label: '@global:setting-set-wallpaper-random',
        url: '',
        description: '@global:setting-set-wallpaper-random-desc'
    },
    {
        label: '@global:setting-set-wallpaper-solid-color',
        url: 'solid-color',
        description: '@global:setting-set-wallpaper-solid-color-desc'
    },
    {
        label: '@global:setting-set-wallpaper-bing-4k',
        url: 'https://bing.biturl.top/?resolution=UHD&format=image',
        description: '@global:setting-set-wallpaper-bing-4k-desc'
    },
    {
        label: '@global:setting-set-wallpaper-bing-1080p',
        url: 'https://bing.biturl.top/?resolution=1920&format=image',
        description: '@global:setting-set-wallpaper-bing-1080p-desc'
    },
    {
        label: '@global:setting-set-wallpaper-scene',
        url: 'https://tu.ltyuanfang.cn/api/fengjing.php',
        description: '@global:setting-set-wallpaper-scene-desc'
    },
    {
        label: '@global:setting-set-wallpaper-anime',
        url: 'https://www.loliapi.com/acg',
        description: '@global:setting-set-wallpaper-anime-desc'
    }
];
