// 检查是否首次访问
if (!localStorage.getItem('nitaiPageVisited')) {
    // 首次访问，重定向到指南页面
    window.location.href = 'guide.html';
}