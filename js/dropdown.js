//引入cookies
const cookieManager = {
    set: (name, value, days) => {
        const expires = days ? `; expires=${new Date(Date.now() + days * 24 * 60 * 60 * 1000).toUTCString()}` : '';
        document.cookie = `${name}=${value || ""}${expires}; path=/`;
    },
    get: (name) => {
        const nameEQ = `${name}=`;
        const ca = document.cookie.split(';');
        for (let c of ca) {
            while (c.charAt(0) === ' ') c = c.substring(1);
            if (c.indexOf(nameEQ) === 0) return c.substring(nameEQ.length);
        }
        return '';
    }
};

//主题功能
const applyTheme = (theme) => {
    const root = document.documentElement;
    const selectedOptionElement = document.getElementById("selected-theme");

    selectedOptionElement.innerText = theme === 'light' ? '浅色模式' : '深色模式';

    root.style.setProperty('--main-background-color', theme === 'light' ? 'rgba(255, 255, 255, 0.2)' : '#00000040');
    root.style.setProperty('--main-background-active-color', theme === 'light' ? '#ffffff80' : '#8a8a8a80');

    const updatelog = document.getElementsByClassName('update_log_text');
    for (let i = 0; i < updatelog.length; i++) {
        updatelog[i].style.color = theme === 'light' ? 'rgba(255, 255, 255, 0.7)' : 'dark';
    }

    const switchonelements = document.querySelectorAll('.switch.on');
    switchonelements.forEach((element) => {
        if (theme === 'light') {
            element.classList.add('switchon');
        } else {
            element.classList.remove('switchon');
        }
    });

    $("#switchSetOn").toggleClass('switchon', theme === 'light');
};

//选择框点击判断
document.addEventListener('DOMContentLoaded', () => {
    document.querySelectorAll('[data-onclick]').forEach((element) => {
        element.addEventListener('click', (event) => {
            const functionName = element.getAttribute('data-onclick');
            if (window[functionName]) window[functionName](event, element);
        });
    });

    document.getElementById('dropdownTheme').addEventListener('click', (event) => {
        const target = event.target.closest('.dropdown-item');
        if (target) {
            selectTheme(target.getAttribute('data-theme'), target);
        }
    });

    document.getElementById('dropdownSuggest').addEventListener('click', (event) => {
        const target = event.target.closest('.dropdown-item');
        if (target) {
            selectOption(target.innerText.trim(), target);
        }
    });

    document.getElementById('dropdown-suggest-bing').addEventListener('click', (event) => {
        selectOption('必应', this)
    });
    document.getElementById('dropdown-suggest-baidu').addEventListener('click', (event) => {
        selectOption('百度', this)
    });
    document.getElementById('dropdown-suggest-google').addEventListener('click', (event) => {
        selectOption('谷歌', this)
    });

    document.getElementById('dropdown-suggest').addEventListener('click', (event) => {
        toggleDropdownSuggest()
    });
    document.getElementById('dropdown-theme').addEventListener('click', (event) => {
        toggleDropdown()
    });
});

//选择框控件(右侧箭头)
function toggleDropdown() {
    const dropdownContent = document.getElementById("dropdownTheme");
    if (dropdownContent.classList.contains("show")) {
        $("#iconfont-folding-theme").attr("class", "iconfont icon-folding");
        closeDropdown(dropdownContent);
    } else {
        $("#iconfont-folding-theme").attr("class", "iconfont icon-unfolding");
        openDropdown(dropdownContent);
    }
}

function toggleDropdownSuggest() {
    const dropdownContent = document.getElementById("dropdownSuggest");
    if (dropdownContent.classList.contains("show")) {
        $("#iconfont-folding").attr("class", "iconfont icon-folding");
        closeDropdown(dropdownContent);
    } else {
        $("#iconfont-folding").attr("class", "iconfont icon-unfolding");
        openDropdown(dropdownContent);
    }
}

//选择框开启/关闭动画
function openDropdown(dropdownContent) {
    dropdownContent.style.display = 'block';
    setTimeout(() => {
        dropdownContent.style.opacity = 1;
        dropdownContent.style.transform = 'translateY(0)';
        dropdownContent.classList.add("show");
    }, 0);
}

function closeDropdown(dropdownContent) {
    dropdownContent.style.opacity = 0;
    dropdownContent.style.transform = 'translateY(-10px)';
    setTimeout(() => {
        dropdownContent.style.display = 'none';
        dropdownContent.classList.remove("show");
    }, 10);
}

//选择项切换
function selectTheme(theme, element) {
    const selectedOptionElement = document.getElementById("selected-theme");
    selectedOptionElement.innerText = theme === 'light' ? '浅色模式' : '深色模式';

    const items = document.querySelectorAll('#dropdownTheme .dropdown-item');
    items.forEach((item) => {
        item.classList.remove('dropdown-selected');
        item.querySelector('.checked').innerText = '';
        item.style.backgroundColor = "#4b4b4b";
    });

    if (!element.classList.contains('dropdown-selected')) {
        element.classList.add('dropdown-selected');
        element.querySelector('.checked').innerText = '✔';
        element.style.backgroundColor = "#333";
    }

    cookieManager.set('applyTheme', theme, 365);
    applyTheme(theme);
}

function selectOption(option, element) {
    const selectedOptionElement = document.getElementById("selected-option");
    const clOption = option.replace(/\s*✔\s*/g, '');
    selectedOptionElement.innerText = clOption;

    const items = document.querySelectorAll('#dropdownSuggest .dropdown-item');
    items.forEach((item) => {
        item.classList.remove('dropdown-selected');
        item.querySelector('.checked').innerText = '';
        item.style.backgroundColor = "#4b4b4b";
    });

    if (!element.classList.contains('dropdown-selected')) {
        element.classList.add('dropdown-selected');
        element.querySelector('.checked').innerText = '✔';
        element.style.backgroundColor = "#333";
    }

    applySearchAPI(clOption);
}

//搜索功能
function applySearchAPI(api) {
    switch (api) {
        case "谷歌":
        case "Google":
        case "google":
            api = "google";
            break;
        case "百度":
        case "Baidu":
        case "baidu":
            api = "baidu";
            break;
        case "必应":
        case "Bing":
        case "bing":
            api = "bing";
            break;
        default:
            api = "baidu";
            break;
    }
    //console.log(`调试: ${api}`);
    //api cookie设置
    cookieManager.set('selectedSearchAPI', api, 365);

    // 添加 class 到搜索建议辅助判断块
    const suggestSetOnDiv = document.getElementById("suggestSetOn");
    if (suggestSetOnDiv) {
        suggestSetOnDiv.className = ''; //重置搜索建议源
        if (api && api.trim()) {
            suggestSetOnDiv.classList.add(api);
        } else {
            console.error("Class name is empty or undefined:", api);
        }
    }
}

window.onclick = (event) => {
    if (!event.target.matches('.dropdown')) {
        closeDropdown(document.getElementById("dropdownTheme"));
        closeDropdown(document.getElementById("dropdownSuggest"));
    }
};

window.onload = () => {
    const applyThemeState = cookieManager.get('applyTheme');
    applyTheme(applyThemeState || 'dark');
    updateSelectedOptionText(applyThemeState === 'light' ? '浅色模式' : '深色模式');

    const selectedSearchAPI = cookieManager.get('selectedSearchAPI');
    if (selectedSearchAPI === 'bing') {
        selectOption('必应', document.getElementById('dropdown-suggest-bing'));
    } else if (selectedSearchAPI === 'google') {
        selectOption('谷歌', document.getElementById('dropdown-suggest-google'));
    } else {
        selectOption('百度', document.getElementById('dropdown-suggest-baidu'));
    }
};

//选择框控件更新
function updateSelectedOptionText(option) {
    const selectedOptionElement = document.getElementById("selected-theme");
    selectedOptionElement.innerText = option;

    const items = document.querySelectorAll('#dropdownTheme .dropdown-item');
    items.forEach((item) => {
        item.classList.remove('dropdown-selected');
        item.querySelector('.checked').innerText = '';
        item.style.backgroundColor = "#4b4b4b";
    });

    const currentSelected = document.querySelector(`#dropdownTheme .dropdown-item:contains("${option === '浅色模式' ? 'light' : 'dark'}")`);
    if (currentSelected) {
        currentSelected.classList.add('dropdown-selected');
        currentSelected.querySelector('.checked').innerText = '✔';
        currentSelected.style.backgroundColor = "#333";
    }
}