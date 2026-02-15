const entry = [{
  left: [
    {
      id: 'fold',
      style: '',
      icon: [{
        id: 'icon-fold',
        class: 'iconfont icon-fold'
      }]
    }
  ],
  right: [
    {
      id: 'menu',
      style: '',
      icon: [{
        id: 'icon-menu',
        class: 'iconfont icon-settings'
      }]
    },
    {
      id: 'store',
      style: '',
      icon: [{
        id: 'icon-store',
        class: 'iconfont icon-store'
      }]
    }
  ]
}];

function createSearchForm() {
  const $container = $('#search-form-container');
  if (!$container.length) return;

  // 创建表单元素
  const $form = $('<form>')
    .addClass('search')
    .attr({ action: 'https://www.baidu.com/s', target: '_Blank' });

  // 创建搜索框容器
  const $allSearchDiv = $('<div>').addClass('all-search');

  // 创建搜索引擎切换按钮
  const $seDiv = $('<div>')
    .addClass('se')
    .append($('<i>').attr({ id: 'icon-se', class: 'iconfont icon-baidu' }));

  // 创建搜索输入框
  const $inputWd = $('<input>')
    .addClass('wd')
    .attr({ type: 'text', name: 'wd', placeholder: '@global:search-placeholder', autocomplete: 'off' });

  // 创建搜索按钮
  const $souButtonDiv = $('<div>').addClass('sou-button');
  const $sDiv = $('<div>').addClass('s').attr('id', 's-button')
    .append($('<i>').attr({ id: 'icon-sou', class: 'iconfont icon-sousuo' }));
  $souButtonDiv.append($sDiv);

  // 组装搜索框
  $allSearchDiv.append($seDiv, $inputWd, $souButtonDiv);

  // 创建提交按钮 (隐藏)
  const $submitInput = $('<input>')
    .attr({ type: 'submit', id: 'search-submit' })
    .css('display', 'none');

  // 创建关键词和搜索引擎列表容器
  const $keywordsDiv = $('<div>').attr({ id: 'keywords', style: 'display: none' });
  const $searchEngineDiv = $('<div>').addClass('search-engine').attr({ id: 'search-engine', style: 'display: none' });
  const $searchEngineListDiv = $('<div>').addClass('search-engine-list');
  $searchEngineDiv.append($searchEngineListDiv);

  // 组装整个表单
  $form.append($allSearchDiv, $submitInput);
  $container.append($form, $keywordsDiv, $searchEngineDiv);
};

function createEntry() {
  const $entryLeft = $('.entry-left');
  const $entryRight = $('.entry-right');

  $entryLeft.empty();
  $entryRight.empty();

  entry[0].left.forEach(item => {
    const $div = $(`<div class="entry-items inactive" id="${item.id}" style="${item.style}"></div>`);
    item.icon.forEach(icon => {
      $div.append(`<i id="${icon.id}" class="${icon.class}"></i>`);
    });
    $entryLeft.append($div);
  });

  entry[0].right.forEach(item => {
    const $div = $(`<div class="entry-items" id="${item.id}" style="${item.style}"></div>`);
    item.icon.forEach(icon => {
      $div.append(`<i id="${icon.id}" class="${icon.class}"></i>`);
    });
    $entryRight.append($div);
  });
}

function createStore() {
  const $store = $('.store');
  if (!$store.length) return;

  // 构建商店页面HTML
  const storeHtml = `
    <div id="storePage">
      <div class="tabs" id="storeTabs">
        <div class="tab-items active" id="storeManage">
          <span class="tab_text">@global:store-manage</span>
        </div>
      </div>
      <div class="store-block">
        <div class="store-item">
          <div class="productss" id="manageContent"></div>
          <div class="content products" id="storeContent"></div>
        </div>
        <div class="store-button">
          <div class="store_check_update">
            <span class="set_quick_text">@global:store-check-update</span>
          </div>
          <div class="store_order_set">
            <span class="set_quick_text">@global:store-order-set</span>
          </div>
        </div>
      </div>
    </div>
  `;

  $store.html(storeHtml);
}

document.addEventListener('DOMContentLoaded', function () {
  createSearchForm();
  createEntry();
  createStore();
});