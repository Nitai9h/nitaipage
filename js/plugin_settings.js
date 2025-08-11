// 生成设置页面 HTML
function generatePluginSettings() {
  const container = document.querySelector('.plugin_set');
  container.id = 'plugin_set';

  // 获取插件列表
  const plugins = JSON.parse(localStorage.getItem('npp_plugins') || '[]');
  // 筛选注册了设置页面的插件
  const settingPlugins = plugins.filter(plugin => plugin.setting === 'true');

  // 模板页面
  const tabs = [
    {
      name: '返回',
      id: 'close-pluginSettings',
      active: false,
      value: 'returnToSettings'
    }
  ];

  // 添加插件到 tabs
  settingPlugins.forEach(plugin => {
    tabs.push({
      name: plugin.name,
      id: `plugin-tab-${plugin.id}`,
      active: false,
      value: plugin.id
    });
  });

  // 设置第一个插件状态
  if (settingPlugins.length > 0) {
    tabs[1].active = true;
  }

  // 生成标签页
  const tabsContainer = document.createElement('div');
  tabsContainer.className = 'tabs';
  tabs.forEach(tab => {
    const tabElement = document.createElement('div');
    tabElement.className = `tab-items ${tab.active ? 'actives' : ''}`;
    tabElement.id = tab.id;
    tabElement.dataset.value = tab.value; // 设置 value (NID)
    tabElement.innerHTML = `<span class="tab_text">${tab.name}</span>`;
    tabElement.setAttribute('translate', 'none');
    tabsContainer.appendChild(tabElement);
  });
  container.appendChild(tabsContainer);

  // 生成内容区域
  const contents = document.createElement('div');
  contents.className = 'contents productss';
  container.appendChild(contents);

  // 创建空白提示
  const returnContent = document.createElement('div');
  returnContent.className = settingPlugins.length === 0 ? 'mainConts selected' : 'mainConts';
  returnContent.dataset.value = 'returnToSettings';
  returnContent.textContent = '还没有插件添加设置项或插件设置项未加载...请尝试刷新页面重载';
  returnContent.id = 'noPluginSetting';
  contents.appendChild(returnContent);

  // 创建插件 mainConts
  settingPlugins.forEach((plugin, index) => {
    const pluginContent = document.createElement('div');
    pluginContent.className = `mainConts pluginMainConts ${index === 0 ? 'selected' : ''}`;
    pluginContent.dataset.value = plugin.id;
    contents.appendChild(pluginContent);
  });

  // tab 切换
  tabsContainer.addEventListener('click', (e) => {
    const tab = e.target.closest('.tab-items');
    if (!tab) return;

    // 获取点击 tab 的 value
    const value = tab.dataset.value;
    // 筛选掉 返回 tab
    if (value !== 'returnToSettings') {
      // 移除所有 tab 的 active
      document.querySelectorAll('.plugin_set .tabs .tab-items').forEach(item => {
        item.classList.remove('actives');
      });
      // 为选中 tab 添加 active
      tab.classList.add('actives');
      // 隐藏所有 mainConts
      document.querySelectorAll('.plugin_set .contents .mainConts').forEach(content => {
        content.classList.remove('selected');
      });
      const targetContent = document.querySelector(`.mainConts[data-value="${value}"]`);
      if (targetContent) targetContent.classList.add('selected');
    }
  });

  return container;
}

// 生成设置
document.addEventListener('DOMContentLoaded', function () {
  generatePluginSettings();
});
