// 模板页面
const tabs = [
  { name: '@global:setting-panel', id: 'set-panel-menu', active: true },
  { name: '@global:setting-search', id: '', active: false },
  { name: '@global:setting-quick', id: 'set-quick-menu', active: false },
  { name: '@global:setting-wallpaper', id: '', active: false },
  { name: '@global:setting-more', id: '', active: false },
  { name: '@global:setting-about', id: 'set-about-menu', active: false }
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

const backupOptions = [
  {
    title: '@global:setting-import',
    description: '@global:setting-import-description',
    buttonId: 'my_data_in',
    buttonText: '@global:setting-import'
  },
  {
    title: '@global:setting-export',
    description: '@global:setting-export-description',
    buttonId: 'my_data_out',
    buttonText: '@global:setting-export'
  },
  {
    title: '@global:setting-reset',
    description: '@global:setting-reset-description',
    buttonId: 'my_data_reset',
    buttonText: '@global:setting-reset'
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
    tabElement.innerHTML = `<span class="tab_text">${tab.name}</span>`;
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
          <div class="tip_new_ac">
            <div>
              <span class="set_text">
                <i class="iconfont icon-folding mobile"></i>
                <big>@global:setting-time-date &nbsp;</big>
              </span>
            </div>
          </div>
          <div class="tip_new_setting">
            <div id="toggle_time" class="set_tip set_tip_new text_right" style="display: flex; flex-direction: column; flex-wrap: nowrap; justify-content: center; align-items: center;"> 
              <div class="tip_new_both advancedSetting tip_new_slider">
                <div>
                  <span class="set_text"><big>@global:setting-font-size &nbsp;</big><br></span>
                  <span class="set_text" style="color: gray;"><small>@global:setting-font-size-description</small></span>
                </div>
                <div class="slider-container">
                  <input type="range" class="slider" min="0" max="100" value="0" id="font-size-slider">
                  <span class="slider-value" id="font-size-slider-value" data-slider="font-size-slider">0</span>
                </div>
              </div>
              <div class="tip_new_both advancedSetting tip_new_slider">
                <div>
                  <span class="set_text"><big>@global:setting-font-width &nbsp;</big><br></span>
                  <span class="set_text" style="color: gray;"><small>@global:setting-font-width-description</small></span>
                </div>
                <div class="slider-container">
                  <input type="range" class="slider" min="0" max="100" value="0" id="font-width-time">
                  <span class="slider-value" id="font-width-time-value" data-slider="font-width-time">0</span>
                </div>
              </div>
              <div class="tip_new_both tip_new_slider">
                <div>
                  <span class="set_text"><big>@global:setting-font-thickness &nbsp;</big><br></span>
                  <span class="set_text" style="color: gray;"><small>@global:setting-font-thickness-description</small></span>
                </div>
                <div class="slider-container">
                  <input type="range" class="slider" min="0" max="100" value="50" id="font-thick-slider">
                  <span class="slider-value" id="font-thick-value" data-slider="font-thick-slider">50</span>
                </div>
              </div>
              <div class="tip_new_both tip_new_slider">
                <div>
                  <span class="set_text"><big>@global:setting-font-opacity &nbsp;</big><br></span>
                  <span class="set_text" style="color: gray;"><small>@global:setting-font-opacity-description</small></span>
                </div>
                <div class="slider-container">
                  <input type="range" class="slider" min="0" max="100" value="0" id="font-opacity-slider">
                  <span class="slider-value" id="font-opacity-slider-value" data-slider="font-opacity-slider">0</span>
                </div>
              </div>
            </div>
            <div id="toggle_date" class="set_tip set_tip_new text_right" style="display: flex; flex-direction: column; flex-wrap: nowrap; justify-content: center; align-items: center;"> 
              <div class="tip_new_both advancedSetting tip_new_slider">
                <div>
                  <span class="set_text"><big>@global:setting-font-size-date &nbsp;</big><br></span>
                  <span class="set_text" style="color: gray;"><small>@global:setting-font-size-date-description</small></span>
                </div>
                <div class="slider-container">
                  <input type="range" class="slider" min="0" max="100" value="0" id="font-size-date">
                  <span class="slider-value" id="font-size-date-value" data-slider="font-size-date">0</span>
                </div>
              </div>
              <div class="tip_new_both advancedSetting tip_new_slider">
                <div>
                  <span class="set_text"><big>@global:setting-font-width-date &nbsp;</big><br></span>
                  <span class="set_text" style="color: gray;"><small>@global:setting-font-width-date-description</small></span>
                </div>
                <div class="slider-container">
                  <input type="range" class="slider" min="0" max="100" value="0" id="font-width-date">
                  <span class="slider-value" id="font-width-date-value" data-slider="font-width-date">0</span>
                </div>
              </div>
              <div class="tip_new_both tip_new_slider">
                <div>
                  <span class="set_text"><big>@global:setting-font-thickness-date &nbsp;</big><br></span>
                  <span class="set_text" style="color: gray;"><small>@global:setting-font-thickness-date-description</small></span>
                </div>
                <div class="slider-container">
                  <input type="range" class="slider" min="0" max="100" value="50" id="font-thick-date">
                  <span class="slider-value" id="font-thick-date-value" data-slider="font-thick-date">50</span>
                </div>
              </div>
              <div class="tip_new_both tip_new_slider">
                <div>
                  <span class="set_text"><big>@global:setting-font-opacity-date &nbsp;</big><br></span>
                  <span class="set_text" style="color: gray;"><small>@global:setting-font-opacity-date-description</small></span>
                </div>
                <div class="slider-container">
                  <input type="range" class="slider" min="0" max="100" value="0" id="font-opacity-date">
                  <span class="slider-value" id="font-opacity-date-value" data-slider="font-opacity-date">0</span>
                </div>
              </div>
            </div>
            <div class="set_tip set_tip_new">
              <div class="switch-item tip_new_both" style="align-items: center;">
                <div>
                  <span class="set_text"><big>@global:setting-date-display &nbsp;</big><br></span>
                  <span class="set_text" style="color: gray;"><small>@global:setting-date-display-description</small></span>
                </div>
                <div id="toggle-date-display" class="switch"></div>
              </div>
              <div class="switch-item tip_new_both">
                <div>
                  <span class="set_text"><big>@global:setting-zero-padding &nbsp;</big><br></span>
                  <span class="set_text" style="color: gray;"><small>@global:setting-zero-padding-description</small></span>
                </div>
                <div id="toggle-zero-padding" class="switch"></div>
              </div>
              <div class="switch-item tip_new_both" style="align-items: center;">
                <div>
                  <span class="set_text"><big>@global:setting-time-format &nbsp;</big><br></span>
                  <span class="set_text" style="color: gray;"><small>@global:setting-time-format-description</small></span>
                </div>
                <div id="toggle-time-format" class="switch"></div>
              </div>
            </div>
            <div class="set_tip set_tip_new">
              <div class="switch-item tip_new_both">
                <div>
                  <span class="set_text"><big>@global:setting-clock-blink &nbsp;</big><br></span>
                  <span class="set_text" style="color: gray;"><small>@global:setting-clock-blink-description</small></span>
                </div>
                <div id="toggle-clock-blink" class="switch"></div>
              </div>
              <div class="switch-item tip_new_both">
                <div>
                  <span class="set_text"><big>@global:setting-clock-num &nbsp;</big><br></span>
                  <span class="set_text" style="color: gray;"><small>@global:setting-clock-num-description</small></span>
                </div>
                <div id="toggle-clock-num" class="switch"></div>
              </div>
            </div>
          </div>
        </div>
        <div class="global-settings">
          <div class="tip_new_ac">
            <div>
              <span class="set_text">
                <i class="iconfont icon-folding mobile"></i>
                <big>@global:setting-page &nbsp;</big>
              </span>
            </div>
          </div>
          <div class="tip_new_setting">
            <div class="switch-container">
              <div class="set_tip set_tip_new">
                <div class="switch-item tip_new_both">
                  <div>
                    <span class="set_text"><big>@global:setting-blur-plus &nbsp;</big><br></span>
                    <span class="set_text" style="color: gray;"><small>@global:setting-blur-plus-description</small></span>
                  </div>
                  <div id="toggle-blur-plus" class="switch"></div>
                </div>
                <div class="switch-item tip_new_both">
                  <div>
                    <span class="set_text"><big>@global:setting-search-blur &nbsp;</big><br></span>
                    <span class="set_text" style="color: gray;"><small>@global:setting-search-blur-description</small></span>
                  </div>
                  <div id="toggle-search-blur" class="switch"></div>
                </div>
                <div class="tip_new_both tip_new_slider">
                  <div>
                    <span class="set_text"><big>@global:setting-blur-plus-gauss &nbsp;</big><br></span>
                    <span class="set_text" style="color: gray;"><small>@global:setting-blur-plus-gauss-description</small></span>
                  </div>
                  <div class="slider-container">
                    <input type="range" class="slider" min="0" max="100" value="50" id="main-box-gauss">
                    <span class="slider-value" id="main-box-gauss-value" data-slider="main-box-gauss">50</span>
                  </div>
                </div>
              </div>
              <div class="set_tip set_tip_new">
                <div class="tip_new_both tip_new_slider">
                  <div>
                    <span class="set_text"><big>@global:setting-font-weight &nbsp;</big><br></span>
                    <span class="set_text" style="color: gray;"><small>@global:setting-font-weight-description</small></span>
                  </div>
                  <div class="slider-container">
                    <input type="range" class="slider" min="0" max="100" value="50" id="main-font-weight">
                    <span class="slider-value" id="main-font-weight-value" data-slider="main-font-weight">50</span>
                  </div>
                </div>
              </div>
              <div class="set_tip set_tip_new">
                <div class="switch-item tip_new_both">
                  <div>
                    <span class="set_text"><big>@global:setting-footer-display &nbsp;</big><br></span>
                    <span class="set_text" style="color: gray;"><small>@global:setting-footer-display-description</small></span>
                  </div>
                  <div id="toggle-footer-display" class="switch"></div>
                </div>
              </div>
            </div>
          </div>
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
                <div class="se_list_name" translate="none">${engine.name}</div>
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
            <span class="set_quick_text">@global:setting-set-se-list-add</span>
          </div>
          <div class="set_se_list_preinstall">
            <span class="set_quick_text">@global:setting-set-se-list-preinstall</span>
          </div>
        </div>
        <div class="add_content se_add_content" style="display:none;">
          <div class="froms">
            <div class="from_items">
              <div class="from_text">@global:setting-set-se-list-order</div>
              <input type="hidden" name="key_inhere">
              <input type="number" name="key" placeholder="@global:setting-set-se-list-order-placeholder" autocomplete="off" oninput="if(value>100)value=100;if(value<0)value=0">
            </div>
            <div class="from_items">
              <div class="from_text">@global:setting-set-se-list-name</div>
              <input type="text" name="title" placeholder="@global:setting-set-se-list-name-placeholder" autocomplete="off">
            </div>
            <div class="from_items">
              <div class="from_text">@global:setting-set-se-list-url</div>
              <input type="url" name="url" placeholder="@global:setting-set-se-list-url-placeholder" autocomplete="off">
            </div>
            <div class="from_items">
              <div class="from_text">@global:setting-set-se-list-field</div>
              <input type="text" name="name" placeholder="@global:setting-set-se-list-field-placeholder" autocomplete="off">
            </div>
            <div class="from_items" style="display: none;">
              <input type="text" name="icon" placeholder="iconfont icon-internet" value="iconfont icon-internet" disabled="disabled">
            </div>
          </div>
          <div class="from_items button">
            <div class="se_add_save">@global:setting-set-se-list-save</div>
            <div class="se_add_cancel">@global:setting-set-se-list-cancel</div>
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
        $('#update_logs').css('filter', 'blur(var(--main-box-gauss))');
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
      $('#versionDropdownBtn .icon-folding').attr('class', 'iconfont icon-unfolding');
      document.getElementById('versionDropdownContent').classList.remove('show');
    });
  }).catch(error => {
    console.error('Failed to load update log:', error);
    const updateLogElement = document.getElementById('updateLog');
    if (updateLogElement) {
      updateLogElement.innerHTML = `<p class="update-log-error">@global:setting-set-se-list-update-log-error</p>`;
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
                <div class="quick_list_div_num" translate="none">${shortcut.id}</div>
                <div class="quick_list_div_name" translate="none">${shortcut.name}</div>
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
            <span class="set_quick_text">@global:setting-set-quick-list-add</span>
          </div>
          <div class="set_quick_list_preinstall">
            <span class="set_quick_text">@global:setting-set-quick-list-reset</span>
          </div>
        </div>
        <div class="add_content quick_add_content" style="display:none;">
          <div class="froms">
            <div class="from_items">
              <div class="from_text">@global:setting-set-quick-list-order</div>
              <input type="hidden" name="key_inhere">
              <input type="number" name="key" placeholder="@global:setting-set-quick-list-order-placeholder" autocomplete="off" oninput="if(value>999)value=999;if(value<0)value=0">
            </div>
            <div class="from_items">
              <div class="from_text">@global:setting-set-quick-list-name</div>
              <input type="text" name="title" placeholder="@global:setting-set-quick-list-name-placeholder" autocomplete="off">
            </div>
            <div class="from_items">
              <div class="from_text">@global:setting-set-quick-list-url</div>
              <input type="url" name="url" placeholder="@global:setting-set-quick-list-url-placeholder" autocomplete="off">
            </div>
          </div>
          <div class="from_items button">
            <div class="quick_add_save">@global:setting-set-quick-list-add</div>
            <div class="quick_add_cancel">@global:setting-set-quick-list-cancel</div>
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
      <div class="set_tip set_tip_new">
        <div class="switch-item tip_new_both">
          <div>
            <span class="set_text"><big>@global:setting-set-wallpaper-cover &nbsp;</big><br></span>
            <span class="set_text" style="color: gray;"><small>@global:setting-set-wallpaper-cover-desc</small></span>
          </div>
          <div id="toggle-bg-cover" class="switch on"></div>
        </div>
        <div class="switch-item tip_new_both" id="wallpaper-sound-option">
          <div>
            <span class="set_text"><big>@global:setting-set-wallpaper-sound-notify &nbsp;</big><br></span>
            <span class="set_text" style="color: gray;"><small>@global:setting-set-wallpaper-sound-notify-desc</small></span>
          </div>
          <div id="toggle-bg-video-sound" class="switch on"></div>
        </div>
      </div>
      <div class="set_tip set_tip_new">
        <span class="set_text_wallpaper" translate="none">@global:setting-set-wallpaper-switch-desc</span>
        <span class="set_text_wallpaper" id="wallpaper_text" translate="none">@global:setting-set-wallpaper-switch-desc2</span>
      </div>
      <div class="set_blocks_content">
        <div class="from_container">
          <div class="froms">
            <div class="from_row">
              <div class="from_row_content">
                <div id="wallpaper">
                  ${wallpaperOptions.map((option, index) => `
                    <div class="form-radio" ${index !== 0 && index !== 1 && index !== 2 ? 'translate="none"' : ''}>
                      <input type="radio" id="radio${index}" class="set-wallpaper ${index === 0 ? 'wallpaper-custom' : ''}" name="wallpaper-type" value="${index}" style="display: none;">
                      <label class="form-radio-label" for="radio${index}">${option.label}</label>
                    </div>
                  `).join('')}
                </div>
                <div class="wallpaper-list-setting" id="wallpaper-list-setting">
                  <div class="setting-item">
                    <div class="wallpaper-list-container">
                      <div class="wallpaper-list-content">
                        <div class="wallpaper-list" id="wallpaper-list"></div>
                      </div>
                      <div class="wallpaper-list-add">
                        <button type="button" id="add-wallpaper-btn">@global:setting-set-wallpaper-add</button>
                        <input type="file" id="wallpaper-file-input" accept="image/*,video/*" style="display: none;">
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div class="wallpaper_container">
              <div id="wallpaper_name">
                <div class="from_row">
                  <div class="from_items">
                    <input type="text" name="wallpaper-name" id="wallpaper-name" class="form-input" placeholder="@global:setting-set-wallpaper-name-placeholder" autocomplete="off">
                  </div>
                </div>
              </div>
              <div class="wallpaper-custom-container">
                <div id="wallpaper_url">
                  <div class="from_row">
                    <div class="from_items">
                      <input type="text" name="wallpaper-url" id="wallpaper-url" class="form-input" placeholder="@global:setting-set-wallpaper-url-placeholder" autocomplete="off">
                    </div>
                  </div>
                </div>
                <div id="wallpaper_upload">
                  <div class="from_row">
                    <div class="from_items">
                      <input type="file" id="wallpaper-file" accept="image/*,video/*" style="display: none;">
                      <div class="wallpaper-upload-btn" id="wallpaper-upload-btn">@global:setting-set-wallpaper-add</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div id="wallpaper_color">
              <div class="from_row">
                <div class="from_items">
                  <div class="color-input-container">
                    <input type="text" name="wallpaper-color" id="wallpaper-color-input" class="form-input" placeholder="@global:setting-set-wallpaper-color-placeholder" autocomplete="off" maxlength="7">
                    <input type="color" id="wallpaper-color-picker" class="color-picker" value="#ffffff">
                    <div class="color-picker-btn" id="color-picker-btn">@global:setting-set-wallpaper-color-picker</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div class="from_items button" id="wallpaper-button">
          <div class="wallpaper_save">@global:setting-set-wallpaper-save</div>
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
        <div id="entryPluginSettings">@global:setting-set-more</div>
      </div>
      <div class="tip_new_ac">
        <div>
          <span class="set_text">
            <i class="iconfont icon-folding mobile"></i>
            <big>@global:setting-set-more-data-backup&nbsp;</big>
          </span>
        </div>
      </div>
      <div class="tip_new_setting">
        <div class="data_backup">
          ${backupOptions.map(option => `
            <div class="data_backup_tip set_tip">
              <div>
                <span class="set_text"><big>${option.title}&nbsp;</big><br></span>
                <span class="set_text" style="color: gray;"><small>${option.description}</small></span>
              </div>
              <div class="but-ordinary" id="${option.buttonId}">${option.buttonText}</div>
            </div>
          `).join('')}
          <input type="file" id="my_data_file" style="display: none;" accept=".json">
        </div>
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
        <span class="set_text" style="text-align: center;"><img id="favo-icon" src="./favicon.ico" style="width: 32px; height: 32px;"><br>
          <span id="version-number">${VersionInfo.VERSION}</span>
          <br><big>@global:nitaipage</big></span>
      </div>
      <div class="set_tip_about">
        <div class="set_tip_updateLog">
          <span class="set_text"><big>@global:setting-set-more-update-log</big></span>
          <div class="dropdown" id="versionDropdown">
            <span id="selectedVersion">${VersionInfo.VERSION}</span>
            <span class="iconfont icon-unfolding"></span>
            <div class="dropdown-content" id="versionDropdownContent"></div>
          </div>
        </div>
        <div class="update_logs" id="update_logs" translate="none">
          <div id="updateLog"></div>
        </div>
      </div>
      <div class="set_tip_about">
        <div class="set_version">
          <span class="set_text"><big>@global:setting-set-more-copyright-info</big></span>
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
          <span class="set_version-text2 mobile">Powered&nbsp;By&nbsp;<a target="_blank">Snavigation-v1.1</a>&nbsp;
            (Open&nbsp;Source&nbsp;By&nbsp;<a class="text_hover" href="https://www.imsyy.top/" target="_blank">imsyy</a>)
          </span>
          <span class="set_version-text2 desktop">Powered&nbsp;By&nbsp;<a target="_blank" style="font-size: 0.8rem;">Snavigation-v1.1</a>
          </span>
          <span class="set_version-text2 desktop">
            (Open&nbsp;Source&nbsp;By&nbsp;<a class="text_hover" href="https://www.imsyy.top/" target="_blank">imsyy</a>)
          </span>
        </div>
      </div>
      <div class="set_tip_about">
        <a class="text_hover about-link" href="https://github.com/Nitai9h/nitaipage" target="_blank" class="about-link">
          <span class="set_text">Github</span>
          <span class="iconfont icon-link"></span>
        </a>
      </div>
    </div>
  </div>
  `;
  return div;
}

// 标签滚动指示器
function initScrollProgressIndicators() {
  const tabsContainers = document.querySelectorAll('.set .tabs, .store .tabs, .plugin_set .tabs');

  tabsContainers.forEach(container => {
    // 如果已经存在指示器
    // 则不再创建
    if (container.querySelector('.scroll-progress-indicator')) {
      return;
    }

    // 创建指示器
    const progressIndicator = document.createElement('div');
    progressIndicator.className = 'scroll-progress-indicator';
    container.appendChild(progressIndicator);

    // 监听滚动事件
    container.addEventListener('scroll', function () {
      const scrollWidth = container.scrollWidth;
      const clientWidth = container.clientWidth;
      const scrollLeft = container.scrollLeft;
      const scrollPercentage = (scrollLeft / (scrollWidth - clientWidth)) * 100;

      progressIndicator.style.width = Math.min(scrollPercentage, 100) + '%';
    });

    // 初始化
    const scrollWidth = container.scrollWidth;
    const clientWidth = container.clientWidth;
    const scrollLeft = container.scrollLeft;
    const scrollPercentage = (scrollLeft / (scrollWidth - clientWidth)) * 100;
    progressIndicator.style.width = Math.min(scrollPercentage, 100) + '%';

    // 如果无需滚动，隐藏进度指示器
    if (scrollWidth <= clientWidth) {
      progressIndicator.style.display = 'none';
    }
  });
}

// 生成设置
document.addEventListener('DOMContentLoaded', function () {
  generateSettings();

  // 初始化标签滚动指示器
  setTimeout(() => {
    initScrollProgressIndicators();
  }, 100);

  // 设置项折叠
  $('.tip_new_setting').addClass('expanded');
  $('.tip_new_ac .icon-folding').addClass('on');
  $('.tip_new_ac').addClass('expanded');
  $('.tip_new_ac .set_text').on('click', function (e) {
    e.preventDefault();
    e.stopPropagation();

    const $this = $(this);
    const $tipNewSetting = $this.closest('.tip_new_ac').next('.tip_new_setting');
    const $tipNewAc = $this.closest('.tip_new_ac');

    if ($tipNewSetting.length) {
      $tipNewSetting.toggleClass('expanded');
      $tipNewAc.toggleClass('expanded');
      $this.find('.icon-folding').toggleClass('on');
    }
  });
});