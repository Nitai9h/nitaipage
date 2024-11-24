window.onload = function () {
    loadPinnedTodos();
}

function loadPinnedTodos() {
    let pinnedTodos = JSON.parse(localStorage.getItem('todo_pin')) || [];
    let pinnedList = document.getElementById('pinnedList');
    pinnedList.innerHTML = ''; // 清空列表

    pinnedTodos.forEach(pinnedTodo => {
        let li = document.createElement('li');
        li.textContent = pinnedTodo.text;
        pinnedList.appendChild(li);
    });
}