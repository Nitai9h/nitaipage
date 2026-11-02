// dev 启动参数实现，目前可用： 
// --allowcore 开放 coreNpp 限制
import { spawn } from 'node:child_process'

const args = process.argv.slice(2)
const passthrough = []
let allowCore = process.env.npm_config_allowcore === 'true'

for (const arg of args) {
    if (arg === '--allowcore') allowCore = true
    else passthrough.push(arg)
}

const env = { ...process.env }
delete env.NODE_OPTIONS
if (allowCore) env.ALLOW_CORE_NPP = 'true'

const child = spawn(process.execPath, ['node_modules/vite/bin/vite.js', '--host', ...passthrough], {
    stdio: 'inherit',
    env
})

child.on('exit', (code, signal) => {
    if (signal) process.kill(process.pid, signal)
    else process.exit(code ?? 0)
})
