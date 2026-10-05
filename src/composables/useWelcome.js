import { useToast } from './useToast'
import { useUiStore } from '@/stores/ui'

// 进入问候与首次初始化提示
// 监听 useWallpaper 派发的 nitaipage:revealed 事件

const GREETINGS = [
    { limit: 6, text: '@global:greeting-early-morning' },
    { limit: 8, text: "@global:greeting-it's-morning" },
    { limit: 12, text: '@global:greeting-good-morning' },
    { limit: 14, text: '@global:greeting-good-noon' },
    { limit: 17, text: '@global:greeting-good-afternoon' },
    { limit: 19, text: "@global:greeting-it's-evening" },
    { limit: 21, text: '@global:greeting-good-evening' },
    { limit: Infinity, text: "@global:greeting-it's-late-night" }
]

// 当前时段对应的问候语 key
export function getGreeting(hour = new Date().getHours()) {
    return GREETINGS.find((item) => hour < item.limit).text
}

let fired = false

// 展示欢迎提示
export function showWelcomeMessage() {
    if (fired) return
    fired = true

    const toast = useToast()
    const uiStore = useUiStore()

    setTimeout(() => {
        toast.title(getGreeting(), '@global:welcome-message')
        uiStore.setSearchFocused(false)
        uiStore.closePanel()
    }, 800)
}

// 在应用挂载时监听 useWallpaper nitaipage:revealed 事件
export function useWelcome() {
    const handler = () => showWelcomeMessage()
    window.addEventListener('nitaipage:revealed', handler)
    return {
        stop: () => window.removeEventListener('nitaipage:revealed', handler)
    }
}
