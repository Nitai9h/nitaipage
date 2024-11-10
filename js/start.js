document.getElementById('toggleStart').onclick = function() {
    toggleStart();
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

// 切换开关状态
function toggleStart() {
    const startElement = document.getElementById('toggleStart');
    if (startElement.classList.contains('on')) {
        startElement.classList.remove('on');
        $("#toggleStart").removeClass('switchon');
        setCookie('quickStart', 'off', 365); // 设置 "off" 状态
    } else {
        startElement.classList.add('on');
        $("#toggleStart").addClass('switchon');
        setCookie('quickStart', 'on', 365); // 设置 "on" 状态
    }
}

// 初始化开关状态
window.onload = function() {
    const quickStartState = getCookie('quickStart');
    if (quickStartState === 'on') {
        document.getElementById('toggleStart').classList.add('on');
    }
    if (quickStartState === 'off') {
        document.getElementById('toggleStart').classList.remove('on');
    }
};