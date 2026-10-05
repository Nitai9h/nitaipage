// numerickey 工具

// 返回下一个可用整数键（当前最大值 + 1，无整数键时从 1 开始）
export function nextNumericKey(list) {
    const max = Object.keys(list ?? {}).reduce((value, key) => {
        const num = Number(key)
        return Number.isInteger(num) && num > value ? num : value
    }, 0)

    return String(max + 1)
}
