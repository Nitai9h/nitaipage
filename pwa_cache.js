// 检查是否为 PWA
function isPwaMode() {
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches ||
        window.navigator.standalone ||
        document.referrer.includes('android-app://');

    const urlParams = new URLSearchParams(window.location.search);
    const hasPwaParam = urlParams.has('pwa') || urlParams.has('standalone');

    const hasPwaPath = window.location.pathname.includes('/pwa/') ||
        window.location.hash.includes('pwa');

    const isFromPwa = document.referrer &&
        (document.referrer.includes('android-app://') ||
            document.referrer.includes('standalone=1'));

    return (isStandalone || hasPwaParam || hasPwaPath || isFromPwa) &&
        !(window.location.origin === window.location.origin &&
            window.location.pathname === '/' &&
            !hasPwaParam &&
            !hasPwaPath &&
            !isStandalone);
}

(async () => {
    const extensionUrl = await getExtensionUrl();
    const isExtension = extensionUrl !== null;

    if (isExtension === false) {
        if ('serviceWorker' in navigator) {
            window.addEventListener('load', () => {
                navigator.serviceWorker.register('./service-worker.js')
                    .then(registration => {
                        console.log('ServiceWorker: ', registration);

                        if (isPwaMode()) {
                            setTimeout(() => {
                                if (registration.active) {
                                    registration.active.postMessage({
                                        type: 'INSTALL_PWA'
                                    });
                                }
                            }, 1000);
                        }

                        navigator.serviceWorker.addEventListener('message', event => {
                            if (event.data && event.data.type === 'CHECK_PWA_MODE') {
                                event.ports[0].postMessage({
                                    isPwa: isPwaMode()
                                });
                            }
                        });

                        window.addEventListener('beforeinstallprompt', (e) => {
                            e.preventDefault();
                        });

                        // 安装完成，开始缓存
                        window.addEventListener('appinstalled', () => {
                            if (registration.active) {
                                registration.active.postMessage({
                                    type: 'INSTALL_PWA'
                                });
                            }
                        });

                        // 卸载完成，清除缓存
                        window.addEventListener('beforeunload', () => {
                            if (isPwaMode()) {
                                if (registration.active) {
                                    registration.active.postMessage({
                                        type: 'UNINSTALL_PWA'
                                    });
                                }
                            }
                        });

                        document.addEventListener('visibilitychange', () => {
                            if (document.visibilityState === 'hidden' && isPwaMode()) {
                                setTimeout(() => {
                                    navigator.serviceWorker.getRegistrations().then(registrations => {
                                        if (registrations.length === 0) {
                                            if (registration.active) {
                                                registration.active.postMessage({
                                                    type: 'UNINSTALL_PWA'
                                                });
                                            }
                                        }
                                    });
                                }, 5000);
                            }
                        });

                        let pwaStatusCheckInterval;

                        function startPwaStatusCheck() {
                            if (pwaStatusCheckInterval) {
                                clearInterval(pwaStatusCheckInterval);
                            }

                            pwaStatusCheckInterval = setInterval(() => {
                                if (!isPwaMode()) {
                                    if (registration.active) {
                                        registration.active.postMessage({
                                            type: 'UNINSTALL_PWA'
                                        });
                                    }
                                    clearInterval(pwaStatusCheckInterval);
                                }
                            }, 30000);
                        }

                        if (isPwaMode()) {
                            startPwaStatusCheck();
                        } else {
                            if (registration.active) {
                                registration.active.postMessage({
                                    type: 'UNINSTALL_PWA'
                                });
                            }
                        }

                        window.addEventListener('resize', () => {
                            const currentPwaMode = isPwaMode();
                            if (currentPwaMode) {
                                startPwaStatusCheck();
                            } else {
                                if (registration.active) {
                                    registration.active.postMessage({
                                        type: 'UNINSTALL_PWA'
                                    });
                                }
                            }
                        });

                        document.addEventListener('visibilitychange', () => {
                            if (document.visibilityState === 'visible') {
                                const currentPwaMode = isPwaMode();
                                if (!currentPwaMode) {
                                    if (registration.active) {
                                        registration.active.postMessage({
                                            type: 'UNINSTALL_PWA'
                                        });
                                    }
                                }
                            }
                        });
                    })
                    .catch(registrationError => {
                        console.log('ServiceWorker: ', registrationError);
                    });
            });
        }
    }
})();