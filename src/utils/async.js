// 异步遍历

/**
 * 限并发遍历
 * @param {Array} items 待处理项
 * @param {number} limit 最大并发数
 * @param {Function} mapper 处理函数 (item, index) => Promise
 * @returns {Promise<Array>} 结果数组，顺序与传入一致
 */
export async function mapLimit(items, limit, mapper) {
    const list = Array.from(items || []);
    if (list.length === 0) return [];

    const results = new Array(list.length);
    const concurrency = Math.max(1, Math.min(limit, list.length));
    let cursor = 0;

    const worker = async () => {
        while (cursor < list.length) {
            const index = cursor;
            cursor += 1;
            results[index] = await mapper(list[index], index);
        }
    };

    await Promise.all(Array.from({ length: concurrency }, worker));
    return results;
}
