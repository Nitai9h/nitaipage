export const VERSION = __APP_VERSION__
export const SEMVER = __APP_SEMVER__

// 优先使用注入值
export const COMMIT = globalThis.__NITAI_PAGE_COMMIT__ || __APP_COMMIT__ || ''

const REPO_URL = 'https://github.com/Nitai9h/nitaipage'

const CONSOLE_STYLES = {
    title: 'font-size: 20px; font-weight: 600; color: rgb(244,167,89);',
    version: 'font-size:14px; color: rgb(244,167,89);',
    content: 'color: rgb(30,152,255);'
}

// 控制台输出版本信息
export function logVersionInfo() {
    const content = `
    commit：${COMMIT || '未知'}
    仓库：${REPO_URL}
    `
    console.log(
        `%cNitaiPage 
        %c${VERSION}
        %c${content}`,
        CONSOLE_STYLES.title,
        CONSOLE_STYLES.version,
        CONSOLE_STYLES.content
    )
}
