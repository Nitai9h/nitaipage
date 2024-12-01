<div align="center">

<img src="./img/icon/favicon_128.png" width="150" height="150" />

# 拟态起始页

### 一个优雅的起始页

![license](https://img.shields.io/github/license/nitai9h/nitaipage?color=FF5531)

📢 网站: [发行版](https://www.nitai.us.kg/) / [开发版](https://dev-www.nitai.us.kg/)

📖 Readme: [English](./README.md)/[简体中文](./README_zh-cn.md)

</div>

![Nitaipage宣传图](https://nitai-images.pages.dev/nitaipage/%E5%A4%A7%E4%BF%83%E9%94%80%E8%B4%B4.png)

*Powered Snavigation V1.1 ( Open Source by imsyy )*

---

## 注意事项

在线版可能因浏览器缓存原因，无法及时预览最新效果

可通过清除浏览器缓存与 `Ctrl + F5` 来刷新页面

## 本地部署

```shell
# 安装 node（这里不再过多赘述）

node -v

# 安装 http-server

npm install http-server -g

http-server -v

# 进入文件夹（更换 /nitaipage 为你自己的路径）

cd /nitaipage

# 启动服务

# -p 指定端口 -o 立即打开浏览器
http-server -p 11123 -o
```

## 一键部署到 Netlify

[![Deploy to Netlify](https://www.netlify.com/img/deploy/button.svg)](https://app.netlify.com/start/deploy?repository=https://github.com/Nitai9h/nitaipage)

## 一键部署到 Vercel

[![Vercel](https://vercel.com/button)](https://vercel.com/import/project?template=https://github.com/Nitai9h/nitaipage)

## 开发版 (Dev) 说明

每一阶段开发完成后与 main 分支同步，更新将会比较频繁

可通过[地址](https://dev-www.nitai.us.kg)访问最新提交的更改

## API 说明

##### 本地api地址

    http://localhost:11123/api/update.json

##### 线上api地址

    https://dev-www.nitai.us.kg/api/update.json

## 未来计划

### 网站

* 备忘
* 节日显示
* 动态背景

### 浏览器扩展

* 点击扩展图标添加捷径 

# 鸣谢

#### 个人、团体、项目、插件（排名不分先后）

---

* [imsyy](https://www.imsyy.top/)
* [青柠起始页](https://limestart.cn/)
* [sou2](https://github.com/yeetime/sou2/)

###### 插件

* [iziToast](https://izitoast.marcelodolza.com/)
* [Iconfont](https://www.iconfont.cn/)
* [jQuery](https://jquery.com/)
* [Lunar](https://6tail.cn/calendar/api.html)

###### API

* [Bing : https://api.dujin.org/bing/1920.php](https://api.dujin.org/bing/1920.php)
* [随机风景 : https://unsplash.it/1600/900?random](https://unsplash.it/1600/900?random)
* [随机二次元 : https://api.lolimi.cn/API/dmt/api.php?type=image](https://api.lolimi.cn/API/dmt/api.php?type=image)
