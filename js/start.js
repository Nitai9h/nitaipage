document.getElementById('toggleStart').onclick = function () {
    toggleStart();
};

document.getElementById('toggleSearchLose').onclick = function () {
    toggleSearchLose();
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
        if ($('#switchSetOn').hasClass('switchon')) {
            $("#toggleStart").removeClass('switchon');
        }
        setCookie('quickStart', 'off', 365); // 设置 "off" 状态
    } else {
        startElement.classList.add('on');
        if ($('#switchSetOn').hasClass('switchon')) {
            $("#toggleStart").addClass('switchon');
        }
        setCookie('quickStart', 'on', 365); // 设置 "on" 状态
    }
}
function toggleSearchLose() {
    const searchLoseElement = document.getElementById('toggleSearchLose');
    if (searchLoseElement.classList.contains('on')) {
        searchLoseElement.classList.remove('on');
        if ($('#searchLoseSetOn').hasClass('switchon')) {
            $("#toggleSearchLose").removeClass('switchon');
        }
        setCookie('searchLose', 'off', 365); // 设置 "off" 状态
    } else {
    searchLoseElement.classList.add('on');
    if ($('#searchLoseSetOn').hasClass('switchon')) {
        $("#toggleSearchLose").addClass('switchon');
    }
    setCookie('searchLose', 'on', 365); // 设置 "on" 状态
    }
}