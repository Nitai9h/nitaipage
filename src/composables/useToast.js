import iziToast from 'izitoast'

let configured = false

function ensureConfigured() {
    if (configured) return
    iziToast.settings({
        timeout: 3000,
        progressBar: false,
        close: false,
        closeOnEscape: true,
        position: 'topCenter',
        transitionIn: 'bounceInDown',
        transitionOut: 'fadeOutUp',
        transitionInMobile: 'fadeInDown',
        transitionOutMobile: 'fadeOutUp',
        displayMode: 'replace',
        layout: '1'
    })
    configured = true
}

export function useToast() {
    ensureConfigured()

    // 普通提示
    const show = (options = {}) => iziToast.show(options)

    // 只带文案的提示
    const message = (text, options = {}) => iziToast.show({ message: text, ...options })

    // 带标题的提示
    const title = (heading, text, options = {}) => iziToast.show({ title: heading, message: text, ...options })

    // 关闭指定 id 的提示
    const hideById = (selector) => {
        if (typeof hideToastById === 'function') return hideToastById(selector)
        const el = document.querySelector(selector)
        if (el && el.parentNode) el.parentNode.removeChild(el)
    }

    return { show, message, title, hideById, instance: iziToast }
}

// 按 id 隐藏提示
export function hideToastById(selector) {
    try {
        const target = document.querySelector(selector)
        if (!target) return
        const container = target.closest('.iziToast')
        if (!container) {
            if (target.parentNode) target.parentNode.removeChild(target)
            return
        }
        // 先触发淡出动画，再移除 DOM
        container.classList.add('fadeOutUp')
        setTimeout(() => {
            if (container.parentNode) container.parentNode.removeChild(container)
        }, 300)
    } catch (error) {
        console.warn('hideToastById 失败:', error)
    }
}

// 居中公告弹窗
export function showAnnouncement(heading, content, buttonText = '@global:toast-close') {
    ensureConfigured()
    const formattedContent = content ? content.replace(/\n/g, '<br>') : '@global:toast-no-content'

    iziToast.show({
        title: heading || '@global:toast-no-title',
        message: formattedContent,
        position: 'center',
        timeout: false,
        close: false,
        overlay: true,
        transitionIn: 'fadeIn',
        transitionOut: 'fadeOut',
        transitionInMobile: 'fadeIn',
        transitionOutMobile: 'fadeOut',
        buttons: [
            [
                '<button>' + buttonText + '</button>',
                function (instance, toast) {
                    instance.hide({ transitionOut: 'fadeOut' }, toast, 'button')
                },
                true
            ]
        ]
    })
}
