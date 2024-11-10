document.addEventListener('DOMContentLoaded', function() {
    document.querySelectorAll('[data-onclick]').forEach(element => {
        element.addEventListener('click', function(event) {
            const functionName = element.getAttribute('data-onclick');
            window[functionName] && window[functionName](event, this);
        });
    });
    document.getElementById('dropdown-dark').onclick = function() {
        selectOption('深色模式', this);
    };
    
    document.getElementById('dropdown-light').onclick = function() {
        selectOption('浅色模式', this);
    }
});

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

function toggleDropdown() {
    const dropdownContent = document.getElementById("dropdownContent");
    if (dropdownContent.classList.contains("show")) {
        // 直接切换为关闭状态
        $("#iconfont-folding").attr("class", "iconfont icon-folding");
        closeDropdown(dropdownContent);
    }
    else {
        // 否则打开下拉菜单
        $("#iconfont-folding").attr("class", "iconfont icon-unfolding");
        openDropdown(dropdownContent);
    }
}

function openDropdown(dropdownContent) {
    dropdownContent.style.display = 'block';
    setTimeout(() => {
        dropdownContent.style.opacity = 1;
        dropdownContent.style.transform = 'translateY(0)';
        dropdownContent.classList.add("show");
    }, 0); // 提交当前样式以启用过渡
}

function closeDropdown(dropdownContent) {
    dropdownContent.style.opacity = 0;
    dropdownContent.style.transform = 'translateY(-10px)';

    setTimeout(() => {
        dropdownContent.style.display = 'none';
        dropdownContent.classList.remove("show");
    }, 10); // 动画时间
}

function selectOption(option, element) {
    // 更新控件上的文本
    const selectedOptionElement = document.getElementById("selected-option");
    selectedOptionElement.innerText = option;

    const items = document.querySelectorAll('.dropdown-item');
    items.forEach(item => {
        item.classList.remove('dropdown-selected');
        item.querySelector('.checked').innerText = ''; // 清空对勾
        item.style.backgroundColor = "#4b4b4b"; // 重设背景色
    });
    element.classList.add('dropdown-selected');
    element.querySelector('.checked').innerText = '✔'; // 设置选中项对勾
    element.style.backgroundColor = "#333"; // 设置选中项背景色

    // 浅色模式
    if (option === '浅色模式') {
        setCookie('applyTheme', 'light', 365);
        applyLightTheme();
    }
    // 深色模式
    if (option === '深色模式') {
        setCookie('applyTheme', 'dark', 365);
        applyDarkTheme();
    }
}

window.onclick = function(event) {
    if (!event.target.matches('.dropdown')) {
        closeDropdown(document.getElementById("dropdownContent"));
    }
}

// 初始化主题
window.onload = function() {
    const applyThemeState = getCookie('applyTheme');
    if (applyThemeState === 'light') {
        applyLightTheme();
        updateSelectedOptionText('浅色模式');
    } else {
        applyDarkTheme();
        updateSelectedOptionText('深色模式');
    }
}

//浅色
function applyLightTheme() {
    const root = document.documentElement;
    const selectedOptionElement = document.getElementById("selected-option");
    selectedOptionElement.innerText = '浅色模式';
    root.style.setProperty('--main-background-color', 'rgba(255, 255, 255, 0.2)');
    root.style.setProperty('--main-background-active-color', '#ffffff80');

    var updatelog = document.getElementsByClassName('update_log_text');
    for (var i = 0; i < updatelog.length; i++) {
        updatelog[i].style.color = 'rgba(255, 255, 255, 0.7)';
    }

    var switchonelements = document.querySelectorAll('.switch.on');
    switchonelements.forEach(function(switchonelement) {
        switchonelement.classList.add('switchon');
    });

    $("#switchSetOn").addClass('switchon');
}

//深色
function applyDarkTheme() {
    const root = document.documentElement;
    const selectedOptionElement = document.getElementById("selected-option");
    selectedOptionElement.innerText = '深色模式';
    root.style.removeProperty('--main-background-color');
    root.style.removeProperty('--main-background-active-color');
    root.style.setProperty('--main-background-color', '#00000040;');
    root.style.setProperty('--main-background-active-color', '#8a8a8a80;');

    var updatelog = document.getElementsByClassName('update_log_text');
    for (var i = 0; i < updatelog.length; i++) {
        updatelog[i].style.color = 'darkgray; !important';
    }

    var switchonelements = document.querySelectorAll('.switch.on');
    switchonelements.forEach(function(switchonelement) {
        switchonelement.classList.remove('switchon');
    });

    $("#switchSetOn").removeClass('switchon');
}

function updateSelectedOptionText(option) {
    const selectedOptionElement = document.getElementById("selected-option");
    selectedOptionElement.innerText = option;

    const items = document.querySelectorAll('.dropdown-item');
    items.forEach(item => {
        item.classList.remove('dropdown-selected');
        item.querySelector('.checked').innerText = ''; // 清空对勾
        item.style.backgroundColor = "#4b4b4b"; // 重设背景色
    });

    const currentSelected = document.querySelector('.dropdown-item.dropdown-selected');
    if (currentSelected) {
        currentSelected.querySelector('.checked').innerText = '✔'; // 设置选中项对勾
        currentSelected.style.backgroundColor = "#333"; // 设置选中项背景色
    }
}