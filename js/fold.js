// 引入 cookie
function setCookie(foldcookie, value) {
    document.cookie = foldcookie + "=" + (value || "") + "; path=/";
}

// cookie 存储
function getCookie(foldcookie) {
    var nameEQ = foldcookie + "=";
    var ca = document.cookie.split(';');
    for (var i = 0; i < ca.length; i++) {
        var c = ca[i];
        while (c.charAt(0) === ' ') c = c.substring(1, c.length);
        if (c.indexOf(nameEQ) === 0) return c.substring(nameEQ.length, c.length);
    }
    return null;
}

$(document).ready(function () {
    var toolAll = $('#tool-all');
    var hasBigBClass = getCookie('toolAllClass') === 'true';
    
    if (hasBigBClass) {
        toolAll.addClass('big-b');
        $("#icon-expand").removeClass('icon-fold');
        $("#icon-expand").addClass('icon-unfold');
        $('.set, .mark').addClass('big');
        $(this).attr("class", "iconfont icon-unfold");
    } else {
        toolAll.removeClass('big-b');
        $("#icon-expand").removeClass('icon-unfold');
        $("#icon-expand").addClass('icon-fold');
        // 移除 big 类
        $('.set, .mark').removeClass('big');
        $(this).attr("class", "iconfont icon-fold");
    }

    $('#icon-expand').on('click', function() {
        var hasBigBClass = toolAll.hasClass('big-b');
        
        // 切换 big-b 类
        toolAll.toggleClass('big-b');
        
        // 更新 cookie
        setCookie('toolAllClass', toolAll.hasClass('big-b'));

        if (toolAll.hasClass('big-b')) {
            // 添加 big 类
            $('.set, .mark').addClass('big');
            $(this).attr("class", "iconfont icon-unfold");
            toolAll.addClass('hidden');
        } else {
            // 移除 big 类
            $('.set, .mark').removeClass('big');
            $(this).attr("class", "iconfont icon-fold");
            toolAll.removeClass('hidden');
        }

        // 调用其他相关函数
        seList();
        quickData();
    });

});
    
//通过big-b设置基础内容

if ($('#tool-all').hasClass('big-b')) {
    $("#icon-expand").removeClass('icon-fold');
    $("#icon-expand").addClass('icon-unfold');
}
