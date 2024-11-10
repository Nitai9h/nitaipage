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

// 初始化搜索建议状态
window.onload = function() {
    const searchSuggestState = getCookie('searchSuggests');
    if (searchSuggestState === 'on') {
        $("#toggleSuggests").addClass('on');
        if ($('#switchSetOn').hasClass('switchon')) {
            $("#toggleSuggests").add('switchon');
        }
    }
    if (searchSuggestState === 'off') {
        $("#toggleSuggests").removeClass('on');
        if ($('#switchSetOn').hasClass('switchon')) {
            $("#toggleSuggests").removeClass('switchon');
        }
    }
};

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

// 初始化农历显示状态
window.onload = function() {
    const lunarSuggestState = getCookie('lunarSuggests');
    if (lunarSuggestState === 'on') {
        $("#togglelunar").addClass('on');
        if ($('#switchSetOn').hasClass('switchon')) {
            $("#togglelunar").addClass('switchon');
        }
        $(".lunar_date_off").addClass('lunar_date_on');
    }
    if (lunarSuggestState === 'off') {
        $("#togglelunar").removeClass('on');
        if ($('#switchSetOn').hasClass('switchon')) {
            $("#togglelunar").removeClass('switchon');
        }
        $(".lunar_date_off").removeClass('lunar_date_on');
    }
};