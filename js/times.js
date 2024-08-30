document.getElementById('toggletimes').onclick = function() {
    toggletimes();
  };

function setCookie(name, value, days) {
    var expires = "";
    if (days) {
        var date = new Date();
        date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
        expires = "; expires=" + date.toUTCString();
    }
    document.cookie = name + "=" + (value || "") + expires + "; path=/";
}

function getCookie(name) {
    var nameEQ = name + "=";
    var ca = document.cookie.split(';');
    for (var i = 0; i < ca.length; i++) {
        var c = ca[i];
        while (c.charAt(0) == ' ') c = c.substring(1, c.length);
        if (c.indexOf(nameEQ) == 0) return c.substring(nameEQ.length, c.length);
    }
    return '';
}

// 切换时间秒数状态
function toggletimes() {
    const timeElement = document.getElementById('toggletimes');
    if (timeElement.classList.contains('on')) {
        timeElement.classList.remove('on');
        $("#second").removeClass('times_block');
        setCookie('times', 'off', 365); // 设置 "off" 状态
    } else {
        timeElement.classList.add('on');
        $("#second").addClass('times_block');
        setCookie('times', 'on', 365); // 设置 "on" 状态
    }
}

// 初始化时间秒数状态
window.onload = function() {
    const timesState = getCookie('times');
    if (timesState === 'on') {
        $("#toggletimes").addClass('on');
    }
    if (timesState === 'off') {
        $("#toggletimes").removeClass('on');
    }
};