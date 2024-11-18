document.getElementById('todo_guide_close').addEventListener('click', function () {
    // 设置Cookie
    document.cookie = "todo_guide=1; path=/";

    // 修改元素的显示状态
    document.getElementById('todo_button').style.display = 'flex';
    document.getElementById('todoList').style.display = 'block';

    // 隐藏引导层
    document.querySelector('.todo_guide').style.display = 'none';
});

window.addEventListener('load', function () {
    // 获取Cookie
    const cookies = document.cookie.split('; ').reduce((acc, cookie) => {
        const [key, value] = cookie.split('=');
        acc[key] = value;
        return acc;
    }, {});

    // 检查todo_guide Cookie的值
    if (cookies.todo_guide === '1') {
        // 显示待办事项按钮和列表
        document.getElementById('todo_button').style.display = 'block';
        document.getElementById('todoList').style.display = 'block';

        // 隐藏引导层
        document.getElementById('todo-guide').style.display = 'none';
    }
});