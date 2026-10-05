import { fileURLToPath, URL } from 'node:url'
import { readFileSync } from 'node:fs'
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

/* V3.0.0: 页脚的版本号与提交号不再需要手写；不再依赖服务器更新日志 */
const pkg = JSON.parse(readFileSync(new URL('./package.json', import.meta.url), 'utf8'))

// package.json 中的 version
function formatVersion(version) {
    const [major = '0', minor = '0', patch = '0'] = String(version).split('.')
    return `v${major}.${minor}.${patch}`
}

/**
 *   COMMIT 获取
 *   Vercel                 VERCEL_GIT_COMMIT_SHA
 *   Netlify / 自建 Server  COMMIT_REF
 *   Cloudflare Pages       CF_PAGES_COMMIT_SHA
 *   GitHub Actions         GITHUB_SHA
 */
function resolveCommit() {
    const fromCI = process.env.COMMIT_REF
        || process.env.VERCEL_GIT_COMMIT_SHA
        || process.env.CF_PAGES_COMMIT_SHA
        || process.env.GITHUB_SHA
    return fromCI ? String(fromCI).slice(0, 7) : ''
}

const APP_VERSION = formatVersion(pkg.version)
const APP_COMMIT = resolveCommit()

// https://vitejs.dev/config/
export default defineConfig(({ command }) => ({
    // Base 默认为 '/'，防止 404
    base: command === 'build' ? './' : '/',
    plugins: [
        vue({
            template: {
                compilerOptions: {
                    // <big>
                    isCustomElement: (tag) => tag === 'big'
                }
            }
        })
    ],
    resolve: {
        alias: {
            '@': fileURLToPath(new URL('./src', import.meta.url))
        }
    },
    // 编译期常量
    define: {
        __APP_VERSION__: JSON.stringify(APP_VERSION),
        __APP_SEMVER__: JSON.stringify(pkg.version),
        __APP_COMMIT__: JSON.stringify(APP_COMMIT),

        // ONLY_SERVER=true 时只使用自建 Server，本地存储禁用
        // SERVER_URL 指向自建 Server（留空则用同源/api）
        // 用户在设置里切换时只改 localStorage
        __ONLY_SERVER__: JSON.stringify(process.env.ONLY_SERVER === 'true'),
        __SERVER_URL__: JSON.stringify(process.env.SERVER_URL || '')
    },
    server: {
        // 局域网共享
        host: true,
        port: 11123,
        strictPort: false,
        open: false
    },
    preview: {
        host: true,
        port: 11123
    },
    build: {
        outDir: 'dist',
        assetsDir: 'assets',
        target: 'es2020',
        chunkSizeWarningLimit: 1500,
        rollupOptions: {
            // 多入口配置：
            // main: 主应用入口 (index.html)
            // bridge: 桥接页入口 (bridge.html)，为扩展提供按需轻量加载
            input: {
                main: fileURLToPath(new URL('./index.html', import.meta.url)),
                bridge: fileURLToPath(new URL('./bridge.html', import.meta.url))
            }
        }
    }
}))
