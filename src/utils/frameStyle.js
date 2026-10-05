// 动效与遮罩

// 淡入
export function fadeIn(id, duration = 1000, delay = 0, direction = '') {
    const referenceId = document.getElementById(id)
    if (!referenceId) {
        console.error(`Element with id "${id}" not found`)
        return
    }

    referenceId.classList.remove('fadeHidden')

    let initialTransform = ''
    switch (direction) {
        case 'top':
            initialTransform = 'translateY(-42%)'
            break
        case 'bottom':
            initialTransform = 'translateY(42%)'
            break
        case 'left':
            initialTransform = 'translateX(-38%)'
            break
        case 'right':
            initialTransform = 'translateX(38%)'
            break
        case 'center':
            initialTransform = 'scale(0.7)'
            break
        default:
            initialTransform = 'translate(0)'
    }

    referenceId.style.opacity = '0'
    referenceId.style.transform = initialTransform
    referenceId.style.transition = 'none'

    void referenceId.offsetWidth

    referenceId.style.transition = `opacity ${duration}ms ease, transform ${duration}ms ease`

    setTimeout(() => {
        referenceId.style.opacity = '1'
        referenceId.style.transform = 'translate(0)'
    }, delay)
}

// 淡出
export function fadeOut(id, duration = 1000, delay = 0, direction = '') {
    const referenceId = document.getElementById(id)
    if (!referenceId) {
        console.error(`Element with id "${id}" not found`)
        return
    }

    referenceId.classList.remove('fadeHidden')
    referenceId.style.transition = `opacity ${duration}ms ease, transform ${duration}ms ease`

    void referenceId.offsetWidth

    setTimeout(() => {
        let transformStyle = ''
        switch (direction) {
            case 'top':
                transformStyle = 'translateY(-42%)'
                break
            case 'bottom':
                transformStyle = 'translateY(42%)'
                break
            case 'left':
                transformStyle = 'translateX(-38%)'
                break
            case 'right':
                transformStyle = 'translateX(38%)'
                break
            case 'center':
                transformStyle = 'scale(0.7)'
                break
            default:
                transformStyle = 'translate(0)'
        }

        const handleTransitionEnd = () => {
            referenceId.classList.add('fadeHidden')
            referenceId.removeEventListener('transitionend', handleTransitionEnd)
        }
        referenceId.addEventListener('transitionend', handleTransitionEnd)

        referenceId.style.transform = transformStyle
        referenceId.style.opacity = '0'
    }, delay)
}

// 遮罩固定用 998 / 999，水位初始值
const COVER_Z_BASE = 999

// 最大层级，首次全量扫描后按水位修改
let zWatermark = 0

// 置顶
// 找出当前最大 z-index 再 +1
export function zTop(id) {
    const target = document.getElementById(id)
    if (!target) {
        console.error(`Element with id "${id}" not found`)
        return
    }

    // 是否存在已探明的水位
    if (!zWatermark) {
        let maxZIndex = COVER_Z_BASE
        document.querySelectorAll('*').forEach((el) => {
            const zIndex = window.getComputedStyle(el).zIndex
            if (zIndex === 'auto') return
            const z = parseInt(zIndex, 10)
            if (!isNaN(z) && z > maxZIndex) {
                maxZIndex = z
            }
        })
        zWatermark = maxZIndex
    }

    zWatermark += 1
    target.style.zIndex = zWatermark
}

// 普通遮罩
export function blackCover(id, opacityParam, colorParam) {
    let cover = document.getElementById('blackCover')
    if (cover) {
        console.warn('There is already a mask, wait for it to be destroyed before creating it again')
        return
    } else {
        zTop(id)
    }

    let opacity
    if (typeof opacityParam === 'number' && opacityParam >= 0 && opacityParam <= 100) {
        opacity = opacityParam / 100
    } else {
        const blackCoverValue = localStorage.getItem('blackCover')
        opacity = blackCoverValue ? parseInt(blackCoverValue, 10) / 100 : 0.5
    }

    let isWhite
    if (colorParam === 'white' || colorParam === 'black') {
        isWhite = colorParam === 'white'
    } else {
        const colorCover = localStorage.getItem('colorCover')
        isWhite = colorCover ? colorCover.toLowerCase() === 'white' : false
    }

    cover = document.createElement('div')
    cover.id = 'blackCover'
    cover.classList.add('fadeHidden')
    document.body.appendChild(cover)

    Object.assign(cover.style, {
        position: 'fixed',
        top: '0',
        left: '0',
        width: '100%',
        height: '100%',
        zIndex: '999',
        backgroundColor: `rgba(${isWhite ? '255,255,255' : '0,0,0'}, ${opacity})`,
        pointerEvents: 'auto'
    })
}

// 高斯模糊遮罩
export function guassianCover(id, blurParam, opacityParam) {
    let cover = document.getElementById('guassianCover')
    if (cover) {
        console.warn('There is already a Gaussian mask, wait for it to be destroyed before creating it again')
        return
    } else {
        zTop(id)
    }

    cover = document.createElement('div')
    cover.id = 'guassianCover'
    cover.classList.add('fadeHidden')
    document.body.appendChild(cover)

    let blur
    if (typeof blurParam === 'number' && blurParam >= 0) {
        blur = `${blurParam}px`
    } else {
        blur = localStorage.getItem('gaussianBlur') || '5px'
    }

    let opacity
    if (typeof opacityParam === 'number' && opacityParam >= 0 && opacityParam <= 1) {
        opacity = opacityParam
    } else {
        opacity = localStorage.getItem('gaussianOpacity') || '0.5'
    }

    Object.assign(cover.style, {
        position: 'fixed',
        top: '0',
        left: '0',
        width: '100%',
        height: '100%',
        zIndex: '998',
        backgroundColor: `rgba(255, 255, 255, ${opacity})`,
        backdropFilter: `blur(${blur})`,
        pointerEvents: 'auto',
        transition: 'opacity 0.3s ease, filter 0.3s ease'
    })
}

// 创建 Loading 容器
export function createLoading() {
    const loadingId = 'loading'
    let loading = document.getElementById(loadingId)
    if (loading) {
        console.warn('Loading element already exists')
        return false
    }

    loading = document.createElement('div')
    loading.id = loadingId
    Object.assign(loading.style, {
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'transparent',
        opacity: 1
    })

    document.body.appendChild(loading)
    loaderLoading(loading)
}

// loader 的 @keyframes 只需注入一次
let loaderKeyframesInjected = false

function ensureLoaderKeyframes() {
    if (loaderKeyframesInjected) return
    loaderKeyframesInjected = true

    const styleSheet = document.createElement('style')
    styleSheet.textContent = `
        @keyframes animate {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
        }
    `
    document.head.appendChild(styleSheet)
}

// 在容器内渲染 loading 动画
export function loaderLoading(loading) {
    blackCover('loading')
    guassianCover('loading', 15, 0.2)

    const loader = document.createElement('div')
    loader.className = 'loader'

    Object.assign(loader.style, {
        position: 'relative',
        width: '100px',
        height: '100px',
        borderRadius: '50%',
        background: 'linear-gradient(#14ffe9, #ffeb3b, #ff00e0)',
        animation: 'animate 0.8s linear infinite'
    })

    const center = document.createElement('div')
    Object.assign(center.style, {
        position: 'absolute',
        top: '10px',
        left: '10px',
        right: '10px',
        bottom: '10px',
        background: '#240229',
        borderRadius: '50%'
    })

    for (let i = 0; i < 4; i++) {
        const span = document.createElement('span')
        Object.assign(span.style, {
            position: 'absolute',
            width: '100%',
            height: '100%',
            borderRadius: '50%',
            background: 'linear-gradient(#14ffe9, #ffeb3b, #ff00e0)',
            animation: 'animate 0.8s linear infinite'
        })
        loader.appendChild(span)
    }

    const spans = loader.querySelectorAll('span')
    spans[0].style.filter = 'blur(5px)'
    spans[1].style.filter = 'blur(10px)'
    spans[2].style.filter = 'blur(25px)'
    spans[3].style.filter = 'blur(50px)'

    ensureLoaderKeyframes()

    loader.appendChild(center)
    loading.appendChild(loader)

    fadeIn('loading', 650, 0, 'center')
    fadeIn('blackCover', 650, 0)
    fadeIn('guassianCover', 650, 0)
}

// 移除 Loading
export function removeLoading() {
    const loading = document.getElementById('loading')
    if (!loading) {
        console.error('Loading element with id "loading" not found')
        return
    }

    fadeOut('loading', 800, 0, 'center')
    fadeOut('blackCover', 800, 0)
    fadeOut('guassianCover', 800, 0)

    setTimeout(() => {
        const loadingEl = document.getElementById('loading')
        const blackCoverEl = document.getElementById('blackCover')
        const guassianCoverEl = document.getElementById('guassianCover')

        if (loadingEl) loadingEl.remove()
        if (blackCoverEl) blackCoverEl.remove()
        if (guassianCoverEl) guassianCoverEl.remove()
    }, 800)
}

// 暴露到 window.frameStyle
export const frameStyle = {
    fadeIn,
    fadeOut,
    zTop,
    blackCover,
    guassianCover,
    createLoading,
    loaderLoading,
    removeLoading
}

export function installFrameStyle() {
    window.frameStyle = frameStyle
    return frameStyle
}
