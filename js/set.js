/*
作者:D.Young
主页：https://yyv.me/
github：https://github.com/5iux/sou
日期：2019-07-26
版权所有，请勿删除
========================================
由 yeetime 修改
github：https://github.com/yeetime/sou2
日期：2019-12-13
========================================
由 imsyy 二次修改
github：https://github.com/imsyy/sou2
日期：2022-03-10
========================================
由 Nitai 第三次修改
github：https://github.com/Nitai9h/nitaipage
日期：2024-08-30
*/

$(document).ready(function () {

    // 点击事件
    $(document).on('click', function (e) {
        // 选择搜索引擎点击
        if ($(".search-engine").is(":hidden") && $(".se").is(e.target) || $(".search-engine").is(":hidden") && $("#icon-se").is(e.target)) {
            if ($(".se").is(e.target) || $("#icon-se").is(e.target)) {
                // 隐藏搜索建议
                $("#keywords").hide();
                //获取宽度
                $(".search-engine").css("width", $('.sou').width() - 30);
                //出现动画
                $(".search-engine").slideDown(160);
            }
        } else {
            if (!$(".search-engine").is(e.target) && $(".search-engine").has(e.target).length === 0) {
                $(".search-engine").slideUp(160);
            }
        }

        // 自动提示隐藏
        if (!$(".sou").is(e.target) && $(".sou").has(e.target).length === 0) {
            $("#keywords").hide();
        }
    });

    // 时间点击
    $("#time_text").click(function () {
        if ($("#content").hasClass("box")) {
            blurWd();
            closeBox();
            closeSet();
            closeStore();
        } else {
            $("body").removeClass("onsearch");
            openBox();
        }
    });

    // Npp 设置打开
    $(function () {
        $("#entryPluginSettings").click(function () {
            $(".set").addClass("inactive").removeClass("active");
            $(".plugin_set").addClass("active").removeClass("inactive");
        })
    })

    // Npp 设置关闭
    $(function () {
        $("#close-pluginSettings").click(function () {
            $(".set").addClass("active").removeClass("inactive");
            $(".plugin_set").addClass("inactive").removeClass("active");
        })
    })


    // 搜索引擎列表点击
    $(".search-engine-list").on("click", ".se-li", function () {
        var url = $(this).attr('data-url');
        var name = $(this).attr('data-name');
        var icon = $(this).attr('data-icon');
        $(".search").attr("action", url);
        $(".wd").attr("name", name);
        $("#icon-se").attr("class", icon);
        $(".search-engine").slideUp(160);
    });

    // 搜索引擎列表点击
    $(".search-engine-list").on("click", ".se-li", function () {
        var url = $(this).attr('data-url');
        var name = $(this).attr('data-name');
        var icon = $(this).attr('data-icon');
        $(".search").attr("action", url);
        $(".wd").attr("name", name);
        $("#icon-se").attr("class", icon);
        $(".search-engine").slideUp(160);
    });

    // 搜索框点击事件
    $(document).on('click', '.sou', function () {
        focusWd();
        $(".search-engine").slideUp(160);
    });

    $(document).on('click', '.wd', function () {
        focusWd();
        keywordReminder();
        $(".search-engine").slideUp(160);
    });

    // 点击其它区域关闭事件
    $(document).on('click', '.close_sou', function () {
        blurWd();
        closeSet();
        closeStore();
    });
    $('.entry').on('click', function (event) {
        if (event.target === this) {
            blurWd();
            closeSet();
            closeStore();
        }
    });

    // 点击搜索引擎时隐藏自动提示
    $(document).on('click', '.se', function () {
        $('#keywords').toggle();
    });

    // 恢复自动提示
    $(document).on('click', '.se-li', function () {
        $('#keywords').show();
    });

    // 自动提示
    $('.wd').keyup(function (event) {
        var key = event.keyCode;
        // 屏蔽上下键
        var shieldKey = [38, 40];
        if (shieldKey.includes(key)) return;
        keywordReminder();
    });

    // 点击自动提示的搜索建议
    $("#keywords").on("click", ".wd", function () {
        var wd = $(this).text();
        $(".wd").val(wd);
        $(".search").submit();
        //隐藏输入
        $(".wd").val("");
        $("#keywords").hide();
    });

    // 自动提示键盘方向键选择操作
    $(".wd").keydown(function (event) { //上下键获取焦点
        var key = event.keyCode;
        if ($.trim($(this).val()).length === 0) return;

        var id = $(".choose").attr("data-id");
        if (id === undefined) id = 0;

        if (key === 38) {
            /*向上按钮*/
            id--;
        } else if (key === 40) {
            /*向下按钮*/
            id++;
        } else {
            return;
        }
        var length = $("#keywords").attr("data-length");
        if (id > length) id = 1;
        if (id < 1) id = length;

        $(".keyword[data-id=" + id + "]").addClass("choose").siblings().removeClass("choose");
        $(".wd").val($(".keyword[data-id=" + id + "]").text());
    });

    // 折叠点击
    $("#fold").click(function () {
        if ($("#content").attr("class") === "box"
            || $("#menu").hasClass("on")
            || $("#store").hasClass("on")) {
            //更改图标、状态
            if ($(this).hasClass("on")) {
                $("#icon-fold").attr("class", "iconfont icon-fold");
                $(this).removeClass('on');
                localStorage.setItem('foldTime', 'off');

                showTime();
            } else {
                $("#icon-fold").attr("class", "iconfont icon-unfold");
                $(this).addClass('on');
                localStorage.setItem('foldTime', 'on');

                hideTime();
            }
        }
    });

    // 菜单 (设置) 点击
    $("#menu").click(async function () {
        if ($(this).hasClass("on")) {
            closeSet();
        } else {
            openSet();

            // 设置内容加载
            await setSeInit(); //搜索引擎设置
            setQuickInit(); //快捷方式设置
        }
    });

    // 商店点击
    $("#store").click(function () {
        if ($(this).hasClass("on")) {
            closeStore();
        } else {
            openStore();
        }
    });

    // 修改默认搜索引擎
    $(".se_list_table").on("click", ".set_se_default", function () {
        var name = $(this).val();
        iziToast.show({
            timeout: 8000,
            message: '是否设置为默认搜索引擎？',
            buttons: [
                ['<button>确认</button>', async function (instance, toast) {
                    localStorage.setItem('se_default', name);
                    setSeInit();
                    instance.hide({
                        transitionOut: 'flipOutX',
                    }, toast, 'buttonName');
                    iziToast.show({
                        message: '设置成功,刷新后生效',
                        buttons: [
                            ['<button>确认</button>', async function (instance, toast) {
                                window.location.reload()
                                instance.hide({
                                    transitionOut: 'flipOutX',
                                }, toast, 'buttonName');
                            }, true],
                            ['<button>稍后</button>', function (instance, toast) {
                                instance.hide({
                                    transitionOut: 'flipOutX',
                                }, toast, 'buttonName');
                            }]
                        ]
                    });
                }, true],
                ['<button>取消</button>', function (instance, toast) {
                    instance.hide({
                        transitionOut: 'flipOutX',
                    }, toast, 'buttonName');
                }]
            ]
        });
    });

    // 搜索引擎添加
    $(".set_se_list_add").click(function () {
        $(".se_add_content input").val("");

        hideSe();
        $(".se_add_content").show();
    });

    // 搜索引擎保存
    $(".se_add_save").click(async function () {
        var key_inhere = $(".se_add_content input[name='key_inhere']").val();
        var key = $(".se_add_content input[name='key']").val();
        var title = $(".se_add_content input[name='title']").val();
        var url = $(".se_add_content input[name='url']").val();
        var name = $(".se_add_content input[name='name']").val();
        //var icon = $(".se_add_content input[name='icon']").val();
        var icon = "iconfont icon-internet";

        var num = /^\+?[1-9][0-9]*$/;
        if (!num.test(key)) {
            iziToast.show({
                timeout: 2000,
                message: '序号 ' + key + ' 不是正整数'
            });
            return;
        }

        var se_list = await getSeList() || {};

        if (se_list[key]) {
            iziToast.show({
                timeout: 8000,
                message: '搜索引擎 ' + key + ' 已有数据，是否覆盖？',
                buttons: [
                    ['<button>确认</button>', function (instance, toast) {
                        se_list[key] = {
                            title: title,
                            url: url,
                            name: name,
                            icon: icon,
                        };
                        setSeInit();
                        $(".se_add_content").hide();
                        //显示列表
                        showSe();

                        instance.hide({
                            transitionOut: 'flipOutX',
                        }, toast, 'buttonName');
                        iziToast.show({
                            message: '覆盖成功'
                        });
                    }, true],
                    ['<button>取消</button>', function (instance, toast) {
                        instance.hide({
                            transitionOut: 'flipOutX',
                        }, toast, 'buttonName');
                    }]
                ]
            });
            return;
        }

        if (key_inhere && key !== key_inhere) {
            delete se_list[key_inhere];
        }

        se_list[key] = {
            title: title,
            url: url,
            name: name,
            icon: icon,
        };
        setSeList(se_list);
        setSeInit();
        iziToast.show({
            timeout: 2000,
            message: '添加成功'
        });
        $(".se_add_content").hide();
        showSe();
    });

    // 关闭表单
    $(".se_add_cancel").click(function () {
        $(".se_add_content").hide();

        //显示列表
        showSe();
    });

    // 搜索引擎修改
    $('.se_list').on('click', '.edit_se', async function () {

        var se_list = await getSeList();
        var key = $(this).val();
        $(".se_add_content input[name='key_inhere']").val(key);
        $(".se_add_content input[name='key']").val(key);
        $(".se_add_content input[name='title']").val(se_list[key]["title"]);
        $(".se_add_content input[name='url']").val(se_list[key]["url"]);
        $(".se_add_content input[name='name']").val(se_list[key]["name"]);
        // $(".se_add_content input[name='icon']").val("iconfont icon-internet");

        //隐藏列表
        hideSe();

        $(".se_add_content").show();
    });

    // 搜索引擎删除
    $(".se_list").on("click", ".delete_se", function () {
        var se_default = getSeDefault();
        var key = $(this).val();
        if (key == se_default) {
            iziToast.show({
                message: '默认搜索引擎不可删除'
            });
        } else {
            iziToast.show({
                timeout: 8000,
                message: '搜索引擎 ' + key + ' 是否删除？',
                buttons: [
                    ['<button>确认</button>', async function (instance, toast) {
                        var se_list = await getSeList();
                        delete se_list[key];
                        setSeList(se_list);
                        setSeInit();
                        instance.hide({
                            transitionOut: 'flipOutX',
                        }, toast, 'buttonName');
                        iziToast.show({
                            message: '删除成功'
                        });
                    }, true],
                    ['<button>取消</button>', function (instance, toast) {
                        instance.hide({
                            transitionOut: 'flipOutX',
                        }, toast, 'buttonName');
                    }]
                ]
            });
        }
    });

    // 恢复预设搜索引擎
    $(".set_se_list_preinstall").click(function () {
        iziToast.show({
            timeout: 8000,
            message: '现有搜索引擎数据将被清空',
            buttons: [
                ['<button>确认</button>', function (instance, toast) {
                    setSeList(se_list_preinstall);
                    localStorage.setItem('se_default', 1);
                    setSeInit();
                    instance.hide({
                        transitionOut: 'flipOutX',
                    }, toast, 'buttonName');
                    iziToast.show({
                        timeout: 2000,
                        message: '重置成功'
                    });
                    // setTimeout(function () {
                    //     window.location.reload()
                    // }, 1000);
                }, true],
                ['<button>取消</button>', function (instance, toast) {
                    instance.hide({
                        transitionOut: 'flipOutX',
                    }, toast, 'buttonName');
                }]
            ]
        });
    });

    // 设置-快捷方式添加
    $(".set_quick_list_add").click(function () {
        $(".quick_add_content input").val("");
        $(".quick_add_content").show();

        //隐藏列表
        hideQuick();
    });

    // 设置-快捷方式保存
    $(".quick_add_save").click(async function () {
        var key_inhere = $(".quick_add_content input[name='key_inhere']").val();
        var key = $(".quick_add_content input[name='key']").val();
        var title = $(".quick_add_content input[name='title']").val();
        var url = $(".quick_add_content input[name='url']").val();
        var img = $(".quick_add_content input[name='img']").val();

        var num = /^\+?[1-9][0-9]*$/;
        if (!num.test(key)) {
            iziToast.show({
                timeout: 2000,
                message: '快捷方式 ' + key + ' 不是正整数'
            });
            return;
        }

        var quick_list = await getQuickList() || {};

        if (quick_list[key]) {
            iziToast.show({
                timeout: 8000,
                message: '快捷方式 ' + key + ' 已有数据，是否覆盖？',
                buttons: [
                    ['<button>确认</button>', function (instance, toast) {
                        quick_list[key] = {
                            title: title,
                            url: url,
                            img: img,
                        };
                        setQuickList(quick_list);
                        setQuickInit();
                        $(".quick_add_content").hide();
                        //显示列表
                        showQuick();

                        instance.hide({
                            transitionOut: 'flipOutX',
                        }, toast, 'buttonName');
                        iziToast.show({
                            message: '覆盖成功'
                        });
                    }, true],
                    ['<button>取消</button>', function (instance, toast) {
                        instance.hide({
                            transitionOut: 'flipOutX',
                        }, toast, 'buttonName');
                    }]
                ]
            });
            return;
        }

        if (key_inhere && key != key_inhere) {
            delete quick_list[key_inhere];
        }

        quick_list[key] = {
            title: title,
            url: url,
            img: img,
        };
        setQuickList(quick_list);
        setQuickInit();
        $(".quick_add_content").hide();
        iziToast.show({
            timeout: 2000,
            message: '添加成功'
        });

        //显示列表
        showQuick();
    });

    // 设置-快捷方式关闭添加表单
    $(".quick_add_cancel").click(function () {
        $(".quick_add_content").hide();

        //显示列表
        showQuick();
    });

    //恢复预设快捷方式
    $(".set_quick_list_preinstall").click(function () {
        iziToast.show({
            timeout: 8000,
            message: '快捷方式数据将被清空',
            buttons: [
                ['<button>确认</button>', function (instance, toast) {
                    setQuickList(quick_list_preinstall);
                    setQuickInit();
                    instance.hide({
                        transitionOut: 'flipOutX',
                    }, toast, 'buttonName');
                    iziToast.show({
                        timeout: 2000,
                        message: '重置成功'
                    });
                    // setTimeout(function () {
                    //     window.location.reload()
                    // }, 1000);
                }, true],
                ['<button>取消</button>', function (instance, toast) {
                    instance.hide({
                        transitionOut: 'flipOutX',
                    }, toast, 'buttonName');
                }]
            ]
        });
    });

    // 快捷方式修改
    $(".quick_list").on("click", ".edit_quick", function () {

        getQuickList().then(quick_list => {
            var key = $(this).val();
            $(".quick_add_content input[name='key_inhere']").val(key);
            $(".quick_add_content input[name='key']").val(key);
            $(".quick_add_content input[name='title']").val(quick_list[key]["title"]);
            $(".quick_add_content input[name='url']").val(quick_list[key]["url"]);
            $(".quick_add_content input[name='img']").val(quick_list[key]["img"]);
        }).catch(err => console.error('获取快捷方式列表失败:', err));

        //隐藏列表
        hideQuick();

        $(".quick_add_content").show();
    });

    // 快捷方式删除
    $(".quick_list").on("click", ".delete_quick", async function () {

        var key = $(this).val();

        iziToast.show({
            timeout: 8000,
            message: '快捷方式 ' + key + ' 是否删除？',
            buttons: [
                ['<button>确认</button>', async function (instance, toast) {
                    var quick_list = await getQuickList();
                    delete quick_list[key];
                    await setQuickList(quick_list);
                    setQuickInit();
                    instance.hide({
                        transitionOut: 'flipOutX',
                    }, toast, 'buttonName');
                    iziToast.show({
                        timeout: 2000,
                        message: '删除成功'
                    });
                }, true],
                ['<button>取消</button>', function (instance, toast) {
                    instance.hide({
                        transitionOut: 'flipOutX',
                    }, toast, 'buttonName');
                }]
            ]
        });
    });

    // 壁纸设置
    $("#wallpaper").on("click", ".set-wallpaper", function () {
        var type = $(this).val();
        var bg_img = getBgImg();
        bg_img["type"] = type;
        setBgImg(bg_img);

        if (type === "1") {
            $('#wallpaper_text').html("默认壁纸");
            changeWallpaper();
            iziToast.show({
                message: '壁纸切换成功',
                timeout: 2000
            });
        }

        if (type === "2") {
            $('#wallpaper_text').html("必应每日一图 4K UHD 超高清，每天更新");
            changeWallpaper();
            iziToast.show({
                message: '壁纸切换成功',
                timeout: 2000
            });
        }

        if (type === "3") {
            $('#wallpaper_text').html("必应每日一图 1080P FHD 全高清，每天更新");
            changeWallpaper();
            iziToast.show({
                message: '壁纸切换成功',
                timeout: 2000
            });
        }

        if (type === "4") {
            $('#wallpaper_text').html("随机风景图，每次刷新后更换");
            changeWallpaper();
            iziToast.show({
                message: '壁纸切换成功',
                timeout: 2000
            });
        }

        if (type === "5") {
            $('#wallpaper_text').html("随机二次元图，每次刷新后更换");
            changeWallpaper();
            iziToast.show({
                message: '壁纸切换成功',
                timeout: 2000
            });
        }

        if (type === "6") {
            $('#wallpaper_text').html("自定义壁纸地址");
            $("#wallpaper_url").fadeIn(100);
            $("#wallpaper-button").fadeIn(100);
            $("#wallpaper-url").val(bg_img["path"]);
        } else {
            $("#wallpaper_url").fadeOut(300);
            $("#wallpaper-button").fadeOut(300);
        }
    });

    // 自定义壁纸设置保存
    $(".wallpaper_save").click(function () {
        var url = $("#wallpaper-url").val();
        var reg = /^http(s)?:\/\/(?:([\w-]+\.)+[\w-]+|localhost|(\d{1,3}\.){3}\d{1,3}|\[[a-fA-F0-9:]+\])(:[0-9]{1,5})?(\/[\w ./?%&=-]*)?$/;
        if (!reg.test(url)) {
            iziToast.show({
                timeout: 8000,
                message: '检测到链接可能不可用，是否强制设置',
                buttons: [
                    ['<button>确认</button>', function (instance, toast) {
                        setQuickList();
                        setQuickInit();
                        instance.hide({
                            transitionOut: 'flipOutX',
                        }, toast, 'buttonName');
                        var bg_img = getBgImg();
                        bg_img["type"] = "6";
                        bg_img["path"] = url;
                        setBgImg(bg_img);
                        changeWallpaper();
                        iziToast.show({
                            message: '链接设置成功',
                            timeout: 2000
                        });
                        // setTimeout(function () {
                        //     window.location.reload()
                        // }, 1000);
                    }, true],
                    ['<button>取消</button>', function (instance, toast) {
                        instance.hide({
                            transitionOut: 'flipOutX',
                        }, toast, 'buttonName');
                    }]
                ]
            });
        } else {
            var bg_img = getBgImg();
            bg_img["type"] = "6";
            bg_img["path"] = url;
            setBgImg(bg_img);
            changeWallpaper();
            iziToast.show({
                message: '链接设置成功',
                timeout: 2000
            });
        }
    });

    // 我的数据导出
    $("#my_data_out").click(async function () {
        // cookies
        var cookies = Cookies.get();

        // localStorage
        var localStorageData = {};
        for (var i = 0; i < localStorage.length; i++) {
            var key = localStorage.key(i);
            localStorageData[key] = localStorage.getItem(key);
        }

        // indexedDB
        var indexedDBData = {};
        try {
            indexedDBData = await getAllIndexedDBData();
        } catch (e) {
            console.error('导出 indexedDB 数据时出错 (已跳过):', e);
        }

        // 合并数据
        var backupData = {
            cookies: cookies,
            localStorage: localStorageData,
            indexedDB: indexedDBData,
            backupTime: new Date().toISOString()
        };

        var json = JSON.stringify(backupData);
        download("NitaiPage-back-up-" + $.now() + ".json", json);
        iziToast.show({
            timeout: 2000,
            message: '已导出备份文件至下载目录'
        });
    });

    // 我的数据导入 点击触发文件选择
    $("#my_data_in").click(function () {
        $("#my_data_file").click();
    });

    // 选择文件后读取文件内容
    $("#my_data_file").change(function () {
        var selectedFile = document.getElementById('my_data_file').files[0];
        var name = selectedFile.name; // 读取选中文件的文件名
        var size = (selectedFile.size / 1024).toFixed(2);
        // console.log("文件名:"+name+" 大小:"+size);

        var reader = new FileReader(); //这是核心,读取操作就是由它完成.
        reader.readAsText(selectedFile); //读取文件的内容,也可以读取文件的URL
        reader.onload = function () {
            //当读取完成后回调这个函数,然后此时文件的内容存储到了result中,直接操作即可
            //console.log(this.result);

            // json 格式校验
            var mydata;
            try {
                mydata = JSON.parse(this.result);
            } catch (e) {
                iziToast.show({
                    timeout: 2000,
                    message: '数据解析异常'
                });
                return;
            }
            if (typeof mydata != 'object') {
                iziToast.show({
                    timeout: 2000,
                    message: '数据格式错误'
                });
                return;
            }

            iziToast.show({
                timeout: 8000,
                message: '当前数据将会被' + '"' + name + '"' + '覆盖！是否继续导入？',
                buttons: [
                    ['<button>确认</button>', async function (instance, toast) {
                        // 导入cookie数据
                        if (mydata.cookies) {
                            for (var key in mydata.cookies) {
                                Cookies.set(key, mydata.cookies[key], {
                                    expires: 36500
                                });
                            }
                        }

                        // 导入localStorage数据
                        if (mydata.localStorage) {
                            localStorage.clear();
                            for (var key in mydata.localStorage) {
                                localStorage.setItem(key, mydata.localStorage[key]);
                            }
                        }

                        // 导入indexedDB数据
                        if (mydata.indexedDB) {
                            try {
                                await importIndexedDBData(mydata.indexedDB);
                            } catch (e) {
                                console.error('导入 indexedDB 数据时出错 (已跳过):', e);
                            }
                        }
                        instance.hide({
                            transitionOut: 'flipOutX',
                        }, toast, 'buttonName');
                        iziToast.show({
                            timeout: 2000,
                            message: size + ' KB 数据被导入'
                        });
                        setTimeout(function () {
                            window.location.reload()
                        }, 1000);
                    }, true],
                    ['<button>取消</button>', function (instance, toast) {
                        instance.hide({
                            transitionOut: 'flipOutX',
                        }, toast, 'buttonName');
                        setTimeout(function () {
                            window.location.reload()
                        }, 1000);
                    }]
                ]
            });
        }
    });

    // 重置
    $("#my_data_reset").click(async function () {
        iziToast.show({
            timeout: 8000,
            message: '当前数据将全部清除！是否继续重置？',
            buttons: [
                ['<button>确认</button>', async function () {
                    // cookie
                    const cookies = document.cookie.split("; ");
                    for (let cookie of cookies) {
                        const eqPos = cookie.indexOf("=");
                        const name = eqPos > -1 ? cookie.substr(0, eqPos) : cookie;
                        document.cookie = name + "=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/";
                    }

                    // localStorage
                    localStorage.clear();

                    // IndexedDB
                    const dbs = await indexedDB.databases();
                    for (const db of dbs) {
                        indexedDB.deleteDatabase(db.name);
                    }

                    iziToast.show({
                        timeout: 1500,
                        message: '重置完成'
                    });
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

    // 检查所有更新
    $(".store_check_update").click(function () {
        iziToast.show({
            id: 'checkUpdateToast',
            message: '正在检查更新...'
        });
        checkUpdates('all');
    });

    // 插件加载顺序调整
    $(".store_order_set").click(function () {
        $("#storeTabs").css("display", "none");
        $(".store-block").css("display", "none");

        showOrderConfigDialog();
    });

    // 设置默认值
    localStorage.getItem('timeFormat12h') === null && localStorage.setItem('timeFormat12h', 'false');
    localStorage.getItem('zeroPadding') === null && localStorage.setItem('zeroPadding', 'true');
    localStorage.getItem('searchBlur') === null && localStorage.setItem('searchBlur', 'true');
    localStorage.getItem('blurPlus') === null && localStorage.setItem('blurPlus', 'false');
    localStorage.getItem('bgCover') === null && localStorage.setItem('bgCover', 'true');
    localStorage.getItem('dateDisplay') === null && localStorage.setItem('dateDisplay', 'true');
    localStorage.getItem('clockBlink') === null && localStorage.setItem('clockBlink', 'true');
    localStorage.getItem('clockNumAnimation') === null && localStorage.setItem('clockNumAnimation', 'true');

    // 初始化开关状态
    $(document).ready(function () {
        $('#toggle-time-format').toggleClass('on', localStorage.getItem('timeFormat12h') === 'true');
        $('#toggle-zero-padding').toggleClass('on', localStorage.getItem('zeroPadding') === 'true');
        $('#toggle-search-blur').toggleClass('on', localStorage.getItem('searchBlur') === 'true');
        $('#toggle-blur-plus').toggleClass('on', localStorage.getItem('blurPlus') === 'true');
        $('#toggle-bg-cover').toggleClass('on', localStorage.getItem('bgCover') === 'true');
        $('#toggle-date-display').toggleClass('on', localStorage.getItem('dateDisplay') === 'true');
        $('#toggle-clock-blink').toggleClass('on', localStorage.getItem('clockBlink') === 'true');
        $('#toggle-clock-num').toggleClass('on', localStorage.getItem('clockNumAnimation') === 'true');
    });


    $('#toggle-time-format').on('click', function () {
        const isOn = $(this).hasClass('on');
        $(this).toggleClass('on', !isOn);
        localStorage.setItem('timeFormat12h', $(this).hasClass('on'));
        time();
    });

    $('#toggle-zero-padding').on('click', function () {
        const isOn = $(this).hasClass('on');
        $(this).toggleClass('on', !isOn);
        localStorage.setItem('zeroPadding', $(this).hasClass('on'));
        time();
    });

    $('#toggle-search-blur').on('click', function () {
        const isOn = $(this).hasClass('on');
        $(this).toggleClass('on', !isOn);
        localStorage.setItem('searchBlur', $(this).hasClass('on'));
        updateSearchBlur();
    });

    $('#toggle-blur-plus').on('click', function () {
        const isOn = $(this).hasClass('on');
        $(this).toggleClass('on', !isOn);
        localStorage.setItem('blurPlus', $(this).hasClass('on'));
        updateBlurPlusStyle();
    });

    $('#toggle-bg-cover').on('click', function () {
        const isOn = $(this).hasClass('on');
        $(this).toggleClass('on', !isOn);
        localStorage.setItem('bgCover', $(this).hasClass('on'));
        updateBgCover();
    });

    $('#toggle-date-display').on('click', function () {
        const isOn = $(this).hasClass('on');
        $(this).toggleClass('on', !isOn);
        localStorage.setItem('dateDisplay', $(this).hasClass('on'));
        updateDateDisplay();
    });

    $('#toggle-clock-blink').on('click', function () {
        const isOn = $(this).hasClass('on');
        $(this).toggleClass('on', !isOn);
        localStorage.setItem('clockBlink', $(this).hasClass('on'));
        updateClockBlink();
    });

    $('#toggle-clock-num').on('click', function () {
        const isOn = $(this).hasClass('on');
        $(this).toggleClass('on', !isOn);
        localStorage.setItem('clockNumAnimation', $(this).hasClass('on'));
        updateClockNumAnimation();
    });

});
