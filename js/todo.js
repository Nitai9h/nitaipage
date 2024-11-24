window.onload = function () {
    let todos = JSON.parse(localStorage.getItem('todos')) || [];
    todos.forEach(todo => addTodoToList(todo.text, todo.completed, todo.archived, todo.pinned));

    let archives = JSON.parse(localStorage.getItem('todoArchives')) || [];
    archives.forEach(archive => addTodoToList(archive.text, archive.completed, true, archive.pinned));

    // 同步状态到todo_pin
    let pinnedTodos = todos.filter(todo => todo.pinned).concat(archives.filter(archive => archive.pinned));
    localStorage.setItem('todo_pin', JSON.stringify(pinnedTodos));

    // 添加事件监听器
    document.getElementById('todo_add').addEventListener('click', function () {
        document.getElementById('todo_add_name').style.display = 'flex';
        document.getElementById('todo_add_ok').style.display = 'flex';
        document.getElementById('todo_cancel').style.display = 'flex';

        document.getElementById('todoList').style.display = 'none';
        document.getElementById('todo_add').style.display = 'none';
        document.getElementById('todo_archive').style.display = 'none';

        const todoAddMain = document.getElementById('todo_add_main');
        todoAddMain.style.display = 'flex';
        setTimeout(() => {
            todoAddMain.classList.add('show');
        }, 0);
    });

    document.getElementById('todo_cancel').addEventListener('click', function () {
        document.getElementById('todo_add_name').style.display = 'none';
        document.getElementById('todo_add_ok').style.display = 'none';
        document.getElementById('todo_cancel').style.display = 'none';

        document.getElementById('todoList').style.display = '';
        document.getElementById('todo_add').style.display = 'flex';
        document.getElementById('todo_archive').style.display = 'flex';
        const todoAddMain = document.getElementById('todo_add_main');
        todoAddMain.style.display = 'none';
        todoAddMain.classList.remove('show');
    });

    document.getElementById('todo_add_ok').addEventListener('click', function () {
        addTodo();
    });

    document.getElementById('todo_archive').addEventListener('click', function () {
        showArchiveList();
    });

    document.getElementById('todo_archive_back').addEventListener('click', function () {
        hideArchiveList();
    });
};

function addTodo() {
    let input = document.getElementById('newTodo');
    let value = input.value.trim();
    if (value) {
        addTodoToList(value);
        saveTodos();
        input.value = '';

        const todoAddMain = document.getElementById('todo_add_main');
        todoAddMain.style.display = 'none';
        todoAddMain.classList.remove('show');

        document.getElementById('todo_add_ok').style.display = 'none';
        document.getElementById('todo_cancel').style.display = 'none';

        document.getElementById('todoList').style.display = '';
        document.getElementById('todo_add').style.display = 'flex';
        document.getElementById('todo_archive').style.display = 'flex';
    }
}

function saveTodos() {
    let todos = Array.from(document.querySelectorAll('#todoList li')).map(li => {
        let divList = li.querySelector('.todo_list_div');
        return {
            text: divList.textContent,
            completed: divList.classList.contains('completed'),
            archived: li.classList.contains('archived'),
            pinned: li.classList.contains('pinned')
        };
    });
    localStorage.setItem('todos', JSON.stringify(todos));
}


function saveArchives() {
    let archives = Array.from(document.querySelectorAll('#todoArchiveList li')).map(li => {
        let divList = li.querySelector('.todo_list_div');
        return {
            text: divList.textContent,
            completed: divList.classList.contains('completed'),
            archived: true,
            pinned: li.classList.contains('pinned')
        };
    });
    localStorage.setItem('todoArchives', JSON.stringify(archives));
}

function addTodoToList(todoText, completed = false, archived = false, pinned = false) {
    let ul = archived ? document.getElementById('todoArchiveList') : document.getElementById('todoList');

    // 创建 div
    let divList = document.createElement('div');
    divList.textContent = todoText;
    divList.classList.add('todo_list_div');

    if (completed) {
        divList.classList.add('completed');
    }

    let divShow = document.createElement('div');
    divShow.classList.add('todo_show_div');
    let divTools = document.createElement('div');
    divTools.classList.add('todo_tools_div');

    // 创建 li
    let li = document.createElement('li');
    li.classList.add('todo-item');

    if (archived) {
        li.classList.add('archived');
    }

    if (pinned) {
        li.classList.add('pinned');
    }

    // 创建 button
    let buttonCheck = document.createElement('button');
    buttonCheck.id = 'se_list_num';
    buttonCheck.innerHTML = completed ? '<i class="iconfont icon-check-on"></i>' : '<i class="iconfont icon-check-off"></i>';
    buttonCheck.addEventListener('click', function () {
        divList.classList.toggle('completed');

        // 切换图标
        if (divList.classList.contains('completed')) {
            buttonCheck.innerHTML = '<i class="iconfont icon-check-on"></i>';
        } else {
            buttonCheck.innerHTML = '<i class="iconfont icon-check-off"></i>';
        }

        // 更新本地存储
        saveTodos();
        saveArchives();
        savePinnedTodos();
    });

    let buttonCopy = document.createElement('button');
    buttonCopy.id = 'se_list_num';
    buttonCopy.innerHTML = '<i class="iconfont icon-copy"></i>';

    buttonCopy.addEventListener('click', async function () {
        try {
            let currentText = li.textContent;

            await navigator.clipboard.writeText(currentText);
            let clipboardText = await navigator.clipboard.readText();

            if (clipboardText === currentText) {
                buttonCopy.innerHTML = '<i class="iconfont icon-right1"></i>';
                buttonCopy.querySelector('i').classList.add('fade-in');
                buttonCopy.querySelector('i').classList.remove('fade-out');
            }

            setTimeout(() => {
                buttonCopy.innerHTML = '<i class="iconfont icon-copy"></i>';
                buttonCopy.querySelector('i').classList.add('fade-in');
                buttonCopy.querySelector('i').classList.remove('fade-out');
            }, 1200);
        } catch (error) {
            iziToast.show({
                timeout: 2000,
                message: '复制失败，请检查权限设置'
            });
            buttonCopy.innerHTML = '<i class="iconfont icon-wrong"></i>';
            buttonCopy.querySelector('i').classList.add('fade-in');
            buttonCopy.querySelector('i').classList.remove('fade-out');

            setTimeout(() => {
                buttonCopy.innerHTML = '<i class="iconfont icon-copy"></i>';
                buttonCopy.querySelector('i').classList.add('fade-in');
                buttonCopy.querySelector('i').classList.remove('fade-out');
            }, 1200);
        }
    });

    let buttonDelete = document.createElement('button');
    buttonDelete.id = 'se_list_num';
    buttonDelete.innerHTML = '<i class="iconfont icon-delete"></i>';

    buttonDelete.addEventListener('click', function () {
        iziToast.show({
            timeout: 8000,
            message: '是否删除？',
            buttons: [
                ['<button>确认</button>', function (instance, toast) {
                    li.classList.add('fade-out');
                    setTimeout(() => {
                        li.remove();
                        iziToast.show({
                            message: '删除成功'
                        });
                        instance.hide({
                            transitionOut: 'flipOutX',
                        }, toast, 'buttonName');

                        // 更新本地存储
                        saveTodos();
                    }, 500); // 淡出动画时间
                }, true],
                ['<button>取消</button>', function (instance, toast) {
                    instance.hide({
                        transitionOut: 'flipOutX',
                    }, toast, 'buttonName');
                }]
            ]
        });
    });

    let buttonMove = document.createElement('button');
    buttonMove.id = 'se_list_num';
    buttonMove.innerHTML = `<i class="iconfont ${archived ? 'icon-remove' : 'icon-move'}"></i>`; // 根据 archived 值设置图标

    buttonMove.addEventListener('click', function () {
        iziToast.show({
            timeout: 8000,
            message: archived ? '是否取消归档？' : '是否归档？',
            buttons: [
                ['<button>确认</button>', function (instance, toast) {
                    li.classList.add('fade-out');
                    setTimeout(() => {
                        if (archived) {
                            li.classList.remove('archived');
                            document.getElementById('todoList').appendChild(li);

                            // 从归档数据中移除任务
                            let archives = JSON.parse(localStorage.getItem('todoArchives')) || [];
                            archives = archives.filter(archive => archive.text !== todoText);
                            localStorage.setItem('todoArchives', JSON.stringify(archives));

                            // 将任务添加到普通任务列表
                            let todos = JSON.parse(localStorage.getItem('todos')) || [];
                            todos.push({ text: todoText, completed: completed, archived: false, pinned: pinned });
                            localStorage.setItem('todos', JSON.stringify(todos));

                            // 重新加载普通列表
                            reloadTodoList();
                        } else {
                            li.classList.add('archived');
                            document.getElementById('todoArchiveList').appendChild(li);

                            // 从普通任务列表中移除任务
                            let todos = JSON.parse(localStorage.getItem('todos')) || [];
                            todos = todos.filter(todo => todo.text !== todoText);
                            localStorage.setItem('todos', JSON.stringify(todos));

                            // 将任务添加到归档列表
                            let archives = JSON.parse(localStorage.getItem('todoArchives')) || [];
                            archives.push({ text: todoText, completed: completed, archived: true, pinned: pinned });
                            localStorage.setItem('todoArchives', JSON.stringify(archives));
                        }

                        iziToast.show({
                            message: archived ? '取消归档成功' : '归档成功'
                        });
                        instance.hide({
                            transitionOut: 'flipOutX',
                        }, toast, 'buttonName');

                        // 更新本地存储
                        saveTodos();
                        saveArchives();
                        savePinnedTodos();
                    }, 500); // 淡出动画时间
                }, true],
                ['<button>取消</button>', function (instance, toast) {
                    instance.hide({
                        transitionOut: 'flipOutX',
                    }, toast, 'buttonName');
                }]
            ]
        });
    });

    let buttonPin = document.createElement('button');
    buttonPin.id = 'se_list_num';
    buttonPin.innerHTML = pinned ? '<i class="iconfont icon-unnail"></i>' : '<i class="iconfont icon-nail"></i>';

    buttonPin.addEventListener('click', function () {
        if (!li.classList.contains('pinned')) {
            li.classList.add('pinned');
            buttonPin.innerHTML = '<i class="iconfont icon-unnail"></i>';

            // 钉住
            let pinnedLi = document.createElement('li');
            pinnedLi.textContent = divList.textContent;
            document.getElementById('pinnedList').appendChild(pinnedLi);

            // 更新本地存储
            saveTodos();
            saveArchives();
            savePinnedTodos();
        } else {
            li.classList.remove('pinned');
            buttonPin.innerHTML = '<i class="iconfont icon-nail"></i>';

            // 取消钉住
            let pinnedList = document.getElementById('pinnedList');
            let pinnedItems = pinnedList.querySelectorAll('li');
            pinnedItems.forEach(pinnedItem => {
                if (pinnedItem.textContent === divList.textContent) {
                    pinnedItem.remove();
                }
            });

            // 更新本地存储
            saveTodos();
            saveArchives();
            savePinnedTodos();
        }
    });

    divShow.appendChild(buttonCheck);
    divShow.appendChild(divList);
    divTools.appendChild(buttonDelete);
    divTools.appendChild(buttonCopy);
    divTools.appendChild(buttonMove);
    divTools.appendChild(buttonPin);
    li.appendChild(divShow);
    li.appendChild(divTools);
    ul.appendChild(li);
}

function savePinnedTodos() {
    let pinnedTodos = Array.from(document.querySelectorAll('#pinnedList li')).map(pinnedLi => {
        return {
            text: pinnedLi.textContent,
            completed: false,
            archived: false,
            pinned: true
        };
    });
    localStorage.setItem('todo_pin', JSON.stringify(pinnedTodos));
}

function showArchiveList() {
    document.getElementById('todoList').style.display = 'none';
    document.getElementById('todoArchiveList').innerHTML = ''; // 清空归档列表
    let archives = JSON.parse(localStorage.getItem('todoArchives')) || [];
    archives.forEach(archive => addTodoToList(archive.text, archive.completed, true, archive.pinned));
    document.getElementById('todoArchiveList').style.display = 'block';
    document.getElementById('todo_add').style.display = 'none';
    document.getElementById('todo_archive').style.display = 'none';
    document.getElementById('todo_archive_back').style.display = 'flex';
}

function hideArchiveList() {
    document.getElementById('todoList').style.display = 'block';
    document.getElementById('todoArchiveList').style.display = 'none';
    document.getElementById('todo_add').style.display = 'flex';
    document.getElementById('todo_archive').style.display = 'flex';
    document.getElementById('todo_archive_back').style.display = 'none';
}

function reloadTodoList() {
    document.getElementById('todoList').innerHTML = ''; // 清空普通列表
    let todos = JSON.parse(localStorage.getItem('todos')) || [];
    todos.forEach(todo => addTodoToList(todo.text, todo.completed, todo.archived, todo.pinned));
}