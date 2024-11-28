document.getElementById('toggleSuggests').onclick = function() {
    toggleSuggests();
};
document.getElementById('togglelunar').onclick = function() {
    togglelunar();
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

// 切换搜索建议状态
function toggleSuggests() {
    const suggestElement = document.getElementById('toggleSuggests');
    if (suggestElement.classList.contains('on')) {
        suggestElement.classList.remove('on');
        if ($('#switchSetOn').hasClass('switchon')) {
            $("#toggleSuggests").removeClass('switchon');
        }
        setCookie('searchSuggests', 'off', 365); // 设置 "off" 状态
    } else {
        suggestElement.classList.add('on');
        if ($('#switchSetOn').hasClass('switchon')) {
            $("#toggleSuggests").addClass('switchon');
        }
        setCookie('searchSuggests', 'on', 365); // 设置 "on" 状态
    }
}

// 切换农历显示状态
function togglelunar() {
    const lunarsuggestElement = document.getElementById('togglelunar');
    if (lunarsuggestElement.classList.contains('on')) {
        lunarsuggestElement.classList.remove('on');
        if ($('#switchSetOn').hasClass('switchon')) {
            $("#togglelunar").removeClass('switchon');
        }
        $(".lunar_date_off").removeClass('lunar_date_on');
        setCookie('lunarSuggests', 'off', 365); // 设置 "off" 状态
    } else {
        lunarsuggestElement.classList.add('on');
        if ($('#switchSetOn').hasClass('switchon')) {
            $("#togglelunar").addClass('switchon');
        }
        $(".lunar_date_off").addClass('lunar_date_on');
        setCookie('lunarSuggests', 'on', 365); // 设置 "on" 状态
    }
}