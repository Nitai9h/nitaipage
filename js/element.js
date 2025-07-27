$(function () {
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
    .attr('title', '点击切换搜索引擎')
    .append($('<i>').attr({ id: 'icon-se', class: 'iconfont icon-baidu' }));

  // 创建搜索输入框
  const $inputWd = $('<input>')
    .addClass('wd')
    .attr({ type: 'text', name: 'wd', placeholder: '搜你所想', autocomplete: 'off' });

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
});