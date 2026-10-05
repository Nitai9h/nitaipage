// HTML 转义
export function escapeHtml(unsafe) {
    if (typeof unsafe !== 'string') return unsafe;
    return unsafe
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

// 去掉 URL 两端可能存在的方括号 / 引号
export function cleanUrl(url) {
    if (!url || typeof url !== 'string') return '';
    return url.trim().replace(/^[`'"\[]+/, '').replace(/[`'"\]]+$/, '');
}

// 下载文本为文件
export function download(filename, text) {
    const element = document.createElement('a');
    element.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(text));
    element.setAttribute('download', filename);

    element.style.display = 'none';
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
}

// 下载为文件
export function downloadBlob(filename, blob) {
    const url = URL.createObjectURL(blob);
    const element = document.createElement('a');
    element.setAttribute('href', url);
    element.setAttribute('download', filename);

    element.style.display = 'none';
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
    // 延迟释放
    setTimeout(() => URL.revokeObjectURL(url), 10000);
}

// 本地图片路径统一原样返回
// 改成绝对路径会导致 404
export function normalizeLocalUrl(url) {
    if (typeof url !== 'string') return url;
    return url;
}
