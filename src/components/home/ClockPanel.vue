<script setup>
// 时钟与日期
import { ref, onMounted, onUnmounted } from 'vue'
import { useUiStore } from '@/stores/ui'
import { useI18n } from 'vue-i18n'

const { t } = useI18n()

const uiStore = useUiStore()

const WEEKDAY_KEYS = [
    '@global:time-sun',
    '@global:time-mon',
    '@global:time-tue',
    '@global:time-wed',
    '@global:time-thu',
    '@global:time-fri',
    '@global:time-sat'
]

const hourDigits = ref([])
const minuteDigits = ref([])
const monthDigits = ref([])
const dayDigits = ref([])
const ampm = ref('')
const weekday = ref('')
const monthSuffix = ref('')
const daySuffix = ref('')

// 上一轮数位
// 用于判断哪一位发生了变化
let previousTimeDigits = { hour: '', minute: '' }
let previousDayDigits = { month: '', day: '' }

// 拆成逐位并标出变化的数位
function wrapDigits(numStr, type) {
    const previous = type === 'hour' || type === 'minute' ? previousTimeDigits[type] : previousDayDigits[type]
    const previousStr = previous || ''
    const animate = localStorage.getItem('clockNumAnimation') === 'true'

    const digits = numStr.split('').map((digit, index) => ({
        digit,
        changing: previousStr[index] !== digit && animate
    }))

    if (type === 'hour' || type === 'minute') {
        previousTimeDigits[type] = numStr
    } else {
        previousDayDigits[type] = numStr
    }

    return digits
}

// 每秒刷新一次时间
function tick() {
    const dt = new Date()
    let mm = dt.getMonth() + 1
    let d = dt.getDate()
    const day = dt.getDay()
    let h = dt.getHours()
    const m = dt.getMinutes()

    const is12Hour = localStorage.getItem('timeFormat12h') === 'true'
    const zeroPad = localStorage.getItem('zeroPadding') === 'true'

    if (is12Hour) {
        ampm.value = h >= 12 ? 'PM' : 'AM'
        h = h % 12 || 12
    } else {
        ampm.value = ''
    }

    // 格式化
    const hStr = zeroPad && h < 10 ? '0' + h : String(h)
    const mStr = m < 10 ? '0' + m : String(m)
    const mmStr = zeroPad && mm < 10 ? '0' + mm : String(mm)
    const dStr = zeroPad && d < 10 ? '0' + d : String(d)

    hourDigits.value = wrapDigits(hStr, 'hour')
    minuteDigits.value = wrapDigits(mStr, 'minute')
    monthDigits.value = wrapDigits(mmStr, 'month')
    dayDigits.value = wrapDigits(dStr, 'day')
    weekday.value = t(WEEKDAY_KEYS[day])

    monthSuffix.value = t('@global:time-month')
    daySuffix.value = t('@global:time-day')

    // 清理动画
    setTimeout(() => {
        document.querySelectorAll('.timeNum.changing, .dayNum.changing').forEach((el) => {
            el.classList.remove('changing')
        })
    }, 300)
}

let timer = null

// 点击时间后展开 / 收起捷径
function onTimeClick() {
    if (uiStore.boxOpen) {
        uiStore.blurSearch()
        uiStore.closePanel()
    } else {
        // 展开时不清空已输入的关键词
        uiStore.setSearchFocused(false)
        uiStore.openBox()
    }
}

onMounted(() => {
    tick()
    timer = setInterval(tick, 1000)
})

onUnmounted(() => {
    if (timer) clearInterval(timer)
})
</script>

<template>
    <div class="tool-all">
        <div class="time">
            <div id="time_text_container">
                <span id="time_text" @click="onTimeClick">
                    <span v-for="(item, i) in hourDigits" :key="'h' + i"
                        class="timeNum" :class="{ changing: item.changing }">{{ item.digit }}</span><span
                        id="point">:</span><span v-for="(item, i) in minuteDigits" :key="'m' + i"
                        class="timeNum" :class="{ changing: item.changing }">{{ item.digit }}</span>
                </span>
                <span id="ampm">
                    <span v-if="ampm" class="ampm">{{ ampm }}</span>
                </span>
            </div>
            <span id="day">
                <span v-for="(item, i) in monthDigits" :key="'mm' + i"
                    class="dayNum" :class="{ changing: item.changing }">{{ item.digit }}</span>&nbsp;{{ monthSuffix }}&nbsp;<span
                    id="point"></span><span v-for="(item, i) in dayDigits" :key="'d' + i"
                    class="dayNum" :class="{ changing: item.changing }">{{ item.digit }}</span>&nbsp;{{ daySuffix }}&nbsp;<span
                    id="point"></span>{{ weekday }}
            </span>
        </div>
    </div>
</template>
