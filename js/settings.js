// 模板页面
const tabs = [
  { name: '面板', id: 'set-panel-menu', active: true },
  { name: '搜取', id: '', active: false },
  { name: '捷径', id: 'set-quick-menu', active: false },
  { name: '壁纸', id: '', active: false },
  { name: '更多', id: '', active: false },
  { name: '关于', id: 'set-about-menu', active: false }
];

const searchEngines = [
  {
    id: 'baidu',
    name: '百度',
    icon: 'icon-home',
    isDefault: true,
    index: ''
  },
  {
    id: 'google',
    name: '谷歌',
    icon: '',
    isDefault: false,
    index: '2'
  }
];

const shortcuts = [
  { id: 1, name: '哔哩哔哩', icon: 'iconbook-edit' },
  { id: 2, name: '知乎', icon: 'iconbook-edit' }
];

const wallpaperOptions = [
  {
    id: 'radio1',
    value: '1',
    label: '默认',
    className: ''
  },
  {
    id: 'radio2',
    value: '2',
    label: '必应 4K',
    className: ''
  },
  {
    id: 'radio3',
    value: '3',
    label: '必应 1080P',
    className: ''
  },
  {
    id: 'radio4',
    value: '4',
    label: '风景',
    className: ''
  },
  {
    id: 'radio5',
    value: '5',
    label: '二次元',
    className: ''
  },
  {
    id: 'radio6',
    value: '6',
    label: '自定义',
    className: ''
  }
];

const backupOptions = [
  {
    title: '导入',
    description: '点击选择配置文件进行恢复',
    buttonId: 'my_data_in',
    buttonText: '导入'
  },
  {
    title: '导出',
    description: '点击下载本站点的配置文件',
    buttonId: 'my_data_out',
    buttonText: '导出'
  },
  {
    title: '重置',
    description: '遇到问题可在此处进行重置',
    buttonId: 'my_data_reset',
    buttonText: '重置'
  }
];

// 生成设置页面 HTML
function generateSettings() {
  const container = document.querySelector('.set');
  container.id = 'set';

  // 生成标签页
  const tabsContainer = document.createElement('div');
  tabsContainer.className = 'tabs mark-items';
  tabs.forEach(tab => {
    const tabElement = document.createElement('div');
    tabElement.className = `tab-items mark-items ${tab.active ? 'actives' : ''}`;
    if (tab.id) tabElement.id = tab.id;
    tabElement.textContent = tab.name;
    tabsContainer.appendChild(tabElement);
  });
  container.appendChild(tabsContainer);

  // 生成内容区域
  const contents = document.createElement('div');
  contents.className = 'contents productss';
  container.appendChild(contents);

  // 创建页面
  const panelContent = createPanelContent();
  const searchEngineContent = createSearchEngineContent();
  const shortcutContent = createShortcutContent();
  const wallpaperContent = createWallpaperContent();
  const moreContent = createMoreContent();
  const aboutContent = createAboutContent();

  contents.appendChild(panelContent);
  contents.appendChild(searchEngineContent);
  contents.appendChild(shortcutContent);
  contents.appendChild(wallpaperContent);
  contents.appendChild(moreContent);
  contents.appendChild(aboutContent);

  // 初始化更新日志
  loadUpdateLog();
  // 初始化滑块
  initSliderControls();

  return container;
}

// 创建面板内容
function createPanelContent() {
  const div = document.createElement('div');
  div.className = 'mainConts selected';
  div.innerHTML = `
    <div class="set_blocks">
      <div class="panelContent">
        <div class="slider-container">
          <div id="toggle_time" class="set_tip set_tip_new text_right" style="display: flex; flex-direction: column; flex-wrap: nowrap; justify-content: center; align-items: center;"> 
            <div class="tip_new_both advancedSetting">
              <div>
                <span class="set_text"><big>时间字体大小&nbsp;</big><span class="desktop"></span></span>
                <span class="set_text" style="color: gray;"><small>最左侧为默认大小</small></span>
              </div>
              <div>
                <input type="range" class="slider" min="0" max="100" value="0" id="font-size-slider">
              </div>
            </div>
            <div class="tip_new_both advancedSetting">
              <div>
                <span class="set_text"><big>时间字体宽度&nbsp;</big><span class="desktop"></span></span>
                <span class="set_text" style="color: gray;"><small>最左侧为默认大小</small></span>
              </div>
              <div>
                <input type="range" class="slider" min="0" max="100" value="0" id="font-width-time">
              </div>
            </div>
            <div class="tip_new_both">
              <div>
                <span class="set_text"><big>时间字体粗细&nbsp;</big><span class="desktop"></span></span>
                <span class="set_text" style="color: gray;"><small>正中间为默认大小</small></span>
              </div>
              <div>
                <input type="range" class="slider" min="0" max="100" value="50" id="font-thick-slider">
              </div>
            </div>
            <div class="tip_new_both">
              <div>
                <span class="set_text"><big>时间字体透明度&nbsp;</big><span class="desktop"></span></span>
                <span class="set_text" style="color: gray;"><small>最右侧为默认大小</small></span>
              </div>
              <div>
                <input type="range" class="slider" min="0" max="100" value="0" id="font-opacity-slider">
              </div>
            </div>
          </div>
          <div id="toggle_date" class="set_tip set_tip_new text_right" style="display: flex; flex-direction: column; flex-wrap: nowrap; justify-content: center; align-items: center;"> 
            <div class="tip_new_both advancedSetting">
              <div>
                <span class="set_text"><big>日期字体大小&nbsp;</big><span class="desktop"></span></span>
                <span class="set_text" style="color: gray;"><small>最左侧为默认大小</small></span>
              </div>
              <div>
                <input type="range" class="slider" min="0" max="100" value="0" id="font-size-date">
              </div>
            </div>
            <div class="tip_new_both advancedSetting">
              <div>
                <span class="set_text"><big>日期字体宽度&nbsp;</big><span class="desktop"></span></span>
                <span class="set_text" style="color: gray;"><small>最左侧为默认大小 (12.5px)</small></span>
              </div>
              <div>
                <input type="range" class="slider" min="0" max="100" value="0" id="font-width-date">
              </div>
            </div>
            <div class="tip_new_both">
              <div>
                <span class="set_text"><big>日期字体粗细&nbsp;</big><span class="desktop"></span></span>
                <span class="set_text" style="color: gray;"><small>正中间为默认大小</small></span>
              </div>
              <div>
                <input type="range" class="slider" min="0" max="100" value="50" id="font-thick-date">
              </div>
            </div>
            <div class="tip_new_both">
              <div>
                <span class="set_text"><big>日期字体透明度&nbsp;</big><span class="desktop"></span></span>
                <span class="set_text" style="color: gray;"><small>最右侧为默认大小</small></span>
              </div>
              <div>
                <input type="range" class="slider" min="0" max="100" value="0" id="font-opacity-date">
              </div>
            </div>
          </div>
        </div>
        <div class="switch-container">
        </div>
      </div>
    </div>
  `;
  return div;
}

// 创建搜索引擎设置
function createSearchEngineContent() {
  const div = document.createElement('div');
  div.className = 'mainConts';
  div.innerHTML = `
    <div class="set_blocks">
      <div class="set_blocks_content">
        <div class="se_list">
          <div class="se_list_table">
            ${searchEngines.map(engine => `
              <div class="se_list_div">
                <div class="se_list_num">
                  ${engine.isDefault ? '<i class="iconfont icon-home"></i>' : engine.index}
                </div>
                <div class="se_list_name">${engine.name}</div>
                <div class="se_list_button">
                  <button class="set_se_default" value="${engine.id}" ${engine.isDefault ? 'style="border-radius: 8px 0px 0px 8px;"' : ''}>
                    <span class="iconfont icon-home"></span>
                  </button>
                  <button class="edit_se" value="${engine.id}">
                    <span class="iconfont icon-edit"></span>
                  </button>
                  <button class="delete_se" value="${engine.id}" ${engine.isDefault ? 'style="border-radius: 0px 8px 8px 0px;"' : ''}>
                    <span class="iconfont icon-delete"></span>
                  </button>
                </div>
              </div>
            `).join('')}
          </div>
        </div>
        <div class="se_add_preinstall">
          <div class="set_se_list_add">
            <span class="set_quick_text">新增</span>
          </div>
          <div class="set_se_list_preinstall">
            <span class="set_quick_text">重置</span>
          </div>
        </div>
        <div class="add_content se_add_content" style="display:none;">
          <div class="froms">
            <div class="from_items">
              <div class="from_text">顺序</div>
              <input type="hidden" name="key_inhere">
              <input type="number" name="key" placeholder="请填入小于 100 的正整数" autocomplete="off" oninput="if(value>100)value=100;if(value<0)value=0">
            </div>
            <div class="from_items">
              <div class="from_text">名称</div>
              <input type="text" name="title" placeholder="搜索引擎名称" autocomplete="off">
            </div>
            <div class="from_items">
              <div class="from_text">网址</div>
              <input type="url" name="url" placeholder="以 https 或 http 开头的 URL" autocomplete="off">
            </div>
            <div class="from_items">
              <div class="from_text">字段名</div>
              <input type="text" name="name" placeholder="URL 中 ? 后面的字段" autocomplete="off">
            </div>
            <div class="from_items" style="display: none;">
              <input type="text" name="icon" placeholder="iconfont icon-internet" value="iconfont icon-internet" disabled="disabled">
            </div>
          </div>
          <div class="from_items button">
            <div class="se_add_save">保存</div>
            <div class="se_add_cancel">取消</div>
          </div>
        </div>
      </div>
    </div>
  `;
  return div;
}

// 加载更新日志
function loadUpdateLog() {
  getInfo().then(data => {
    const updateLogElement = document.getElementById('updateLog');
    const dropdownContent = document.getElementById('versionDropdownContent');
    dropdownContent.style.height = '15vh';

    if (!updateLogElement || !dropdownContent) return;

    // 清空现有内容
    updateLogElement.innerHTML = '';
    dropdownContent.innerHTML = '';

    // 生成下拉框
    data.versions.forEach(version => {
      const option = document.createElement('div');
      option.className = `dropdown-item ${version.version === VersionInfo.VERSION ? 'dropdown-selected' : ''}`;
      option.dataset.version = version.version;
      option.innerHTML = `<span class="checked">${version.version === VersionInfo.VERSION ? '✔' : ''}</span> ${version.version}`;
      dropdownContent.appendChild(option);

      // 生成日志内容
      const versionSection = document.createElement('div');
      versionSection.className = `version-section ${version.version === VersionInfo.VERSION ? '' : 'hidden'}`;
      versionSection.dataset.version = version.version;
      versionSection.innerHTML = `
        <h3 class="version-title">${version.version} <span class="version-date">(${version.date})</span></h3>
        <ul class="version-updates">
          ${version.updates.map(update => `<li>${update}</li>`).join('')}
        </ul>
      `;
      updateLogElement.appendChild(versionSection);
    });

    // 下拉框切换事件
    document.querySelectorAll('#versionDropdownContent .dropdown-item').forEach(item => {
      item.addEventListener('click', function () {
        const selectedVersion = this.dataset.version;

        // 更新选中状态
        document.querySelectorAll('#versionDropdownContent .dropdown-item').forEach(option => {
          option.classList.remove('dropdown-selected');
          option.querySelector('.checked').textContent = '';
        });
        this.classList.add('dropdown-selected');
        this.querySelector('.checked').textContent = '✔';
        document.getElementById('selectedVersion').textContent = selectedVersion;

        // 显示选中版本日志
        document.querySelectorAll('.version-section').forEach(section => {
          section.classList.toggle('hidden', section.dataset.version !== selectedVersion);
        });
      });
    });

    // 下拉框
    document.getElementById('versionDropdown').addEventListener('click', function (e) {
      const dropdownContent = document.getElementById('versionDropdownContent');
      dropdownContent.classList.toggle('show');

      // 切换图标
      const iconElement = this.querySelector('.iconfont');
      if (dropdownContent.classList.contains('show')) {
        $('#update_logs').css('filter', 'var(--main-box-gauss)');
        iconElement.classList.remove('icon-unfolding');
        iconElement.classList.add('icon-folding');
      } else {
        $('#update_logs').css('filter', 'blur(0px)');
        iconElement.classList.remove('icon-folding');
        iconElement.classList.add('icon-unfolding');
      }

      e.stopPropagation();
    });

    // 点击其他区域关闭下拉框
    document.addEventListener('click', function () {
      $('#update_logs').css('filter', 'blur(0px)');
      $('.icon-folding').attr('class', 'iconfont icon-unfolding');
      document.getElementById('versionDropdownContent').classList.remove('show');
    });
  }).catch(error => {
    console.error('Failed to load update log:', error);
    const updateLogElement = document.getElementById('updateLog');
    if (updateLogElement) {
      updateLogElement.innerHTML = '<p class="update-log-error">未获取到此版本的更新日志</p>';
    }
  });
}

// 创建快捷方式设置
function createShortcutContent() {
  const div = document.createElement('div');
  div.className = 'mainConts';
  div.innerHTML = `
    <div class="set_blocks">
      <div class="set_blocks_content">
        <div class="quick_list">
          <div class="quick_list_table">
            ${shortcuts.map(shortcut => `
              <div class="quick_list_div">
                <div class="quick_list_div_num">${shortcut.id}</div>
                <div class="quick_list_div_name">${shortcut.name}</div>
                <div class="quick_list_div_button">
                  <button class="edit_quick" value="${shortcut.id}" style="border-radius: 8px 0px 0px 8px;">
                    <span class="iconfont ${shortcut.icon}"></span>
                  </button>
                  <button class="delete_quick" value="${shortcut.id}" style="border-radius: 0px 8px 8px 0px;">
                    <span class="iconfont icondelete"></span>
                  </button>
                </div>
              </div>
            `).join('')}
          </div>
        </div>
        <div class="se_add_preinstalls">
          <div class="set_quick_list_add">
            <span class="set_quick_text">新增</span>
          </div>
          <div class="set_quick_list_preinstall">
            <span class="set_quick_text">重置</span>
          </div>
        </div>
        <div class="add_content quick_add_content" style="display:none;">
          <div class="froms">
            <div class="from_items">
              <div class="from_text">顺序</div>
              <input type="hidden" name="key_inhere">
              <input type="number" name="key" placeholder="请填入小于 1000 的正整数" autocomplete="off" oninput="if(value>999)value=999;if(value<0)value=0">
            </div>
            <div class="from_items">
              <div class="from_text">名称</div>
              <input type="text" name="title" placeholder="网站名称" autocomplete="off">
            </div>
            <div class="from_items">
              <div class="from_text">网址</div>
              <input type="url" name="url" placeholder="以 https 或 http 开头的 URL" autocomplete="off">
            </div>
          </div>
          <div class="from_items button">
            <div class="quick_add_save">保存</div>
            <div class="quick_add_cancel">取消</div>
          </div>
        </div>
      </div>
    </div>
  `;
  return div;
}

// 创建背景图片设置
function createWallpaperContent() {
  const div = document.createElement('div');
  div.className = 'mainConts';
  div.innerHTML = `
    <div class="set_blocks wallpapers_content">
      <div class="set_tip">
        <span class="set_text_wallpaper">点击下方选项以切换壁纸，使用除默认壁纸以外的选项可能会导致页面载入缓慢</span>
        <span class="set_text_wallpaper">不建议使用以主色调为白色的壁纸，会导致本站部分元素无法辨认</span>
        <span class="set_text_wallpaper" id="wallpaper_text">请点击选项以查看各项说明，高亮项为选中，选中后刷新页面以生效</span>
      </div>
      <div class="set_blocks_content">
        <div class="from_container">
          <div class="froms">
            <div class="from_row">
              <div class="from_row_content">
                <div id="wallpaper">
                  ${wallpaperOptions.map(option => `
                    <div class="form-radio ${option.className}">
                      <input type="radio" id="${option.id}" class="set-wallpaper ${option.value === '5' ? 'wallpaper-custom' : ''}" name="wallpaper-type" value="${option.value}" style="display: none;">
                      <label class="form-radio-label" for="${option.id}">${option.label}</label>
                    </div>
                  `).join('')}
                </div>
              </div>
            </div>
            <div id="wallpaper_url" style="display: none;">
              <div class="from_row">
                <div class="from_items">
                  <input type="text" name="wallpaper-url" id="wallpaper-url" placeholder="以 https 或 http 开头的 URL" autocomplete="off">
                </div>
              </div>
            </div>
          </div>
        </div>
        <div class="from_items button" id="wallpaper-button" style="display: none;">
          <div class="wallpaper_save">保存</div>
        </div>
      </div>
    </div>
  `;
  return div;
}

// 创建更多设置
function createMoreContent() {
  const div = document.createElement('div');
  div.className = 'mainConts';
  div.innerHTML = `
    <div class="set_blocks set_blocks_content set_blocks_more">
      <div class="entry-pluginSettings set_tip">
        <span class="set_text">Npplication</span>
        <div id="entryPluginSettings">设置</div>
      </div>
      <div class="data_backup">
        ${backupOptions.map(option => `
          <div class="data_backup_tip set_tip">
            <div>
              <span class="set_text"><big>${option.title}&nbsp;</big><span class="desktop"></span></span>
              <span class="set_text" style="color: gray;"><small>${option.description}</small></span>
            </div>
            <div class="but-ordinary" id="${option.buttonId}">${option.buttonText}</div>
          </div>
        `).join('')}
      </div>
    </div>
  `;
  return div;
}

// 创建关于页面
function createAboutContent() {
  const div = document.createElement('div');
  div.className = 'mainConts';
  div.innerHTML = `
  <div class="set_blocks">
    <div class="aboutContainer set_blocks_content">
      <div class="set_tip_about">
        <span class="set_text" align="center"><img id="favo-icon" src="./favicon.ico" style="width: 32px; height: 32px;" align="center"><br>
          <span id="version-number">${VersionInfo.VERSION}</span>
          <br><big>NitaiPage</big></span>
      </div>
      <div class="set_tip_about">
        <div class="set_tip_updateLog">
          <span class="set_text"><big>更新日志</big></span>
          <div class="dropdown" id="versionDropdown">
            <span id="selectedVersion">${VersionInfo.VERSION}</span>
            <span class="iconfont icon-unfolding"></span>
            <div class="dropdown-content" id="versionDropdownContent"></div>
          </div>
        </div>
        <div class="update_logs" id="update_logs">
          <div id="updateLog"></div>
        </div>
      </div>
      <div class="set_tip_about">
        <div class="set_version">
          <span class="set_text"><big>版权信息</big></span>
          <span class="set_version-text set_version-text-mobile">Copyright&nbsp;©
            <script type="text/javascript" src="./js/year.js"></script>2025&nbsp;<a class="text_hover" href="https://nitai.us.kg/">Nitai</a>
          </span>
          <span class="set_version-text2 mobile">
            Released&nbsp;under&nbsp;the&nbsp;Apache-2.0&nbsp;License.&nbsp;All&nbsp;rights&nbsp;reserved.
          </span>
          <span class="set_version-text2 desktop" style="font-size:0.7rem">
            Released&nbsp;under&nbsp;the&nbsp;Apache-2.0&nbsp;License.
          </span>
          <span class="set_version-text2 desktop" style="font-size:0.7rem">
            All&nbsp;rights&nbsp;reserved.
          </span>
          <span class="set_version-text2" style="padding-bottom: 1.4%; padding-top: 0.4%">View&nbsp;code&nbsp;on&nbsp;<a class="text_hover" href="https://github.com/Nitai9h/nitaipage" target="_blank">Github</a>
          </span>
          <span class="set_version-text2 mobile">Powered&nbsp;By&nbsp;<a target="_blank">Snavigation-v1.1</a>&nbsp;
            (Open&nbsp;Source&nbsp;By&nbsp;<a class="text_hover" href="https://www.imsyy.top/" target="_blank">imsyy)</a>
          </span>
          <span class="set_version-text2 desktop">Powered&nbsp;By&nbsp;<a target="_blank" style="font-size: 0.8rem;">Snavigation-v1.1</a>
          </span>
          <span class="set_version-text2 desktop">
            (Open&nbsp;Source&nbsp;By&nbsp;<a class="text_hover" href="https://www.imsyy.top/" target="_blank">imsyy)</a>
          </span>
        </div>
      </div>
    </div>
  </div>
  `;
  return div;
}

// 生成设置
document.addEventListener('DOMContentLoaded', function () {
  generateSettings();
});