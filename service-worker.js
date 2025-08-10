const CACHE_NAME = 'nitai-page-cache-v2';
const urlsToCache = [
  './',
  './index.html',
  './css/animate.min.css',
  './css/guide.css',
  './css/iziToast.min.css',
  './css/loading.css',
  './css/style.css',
  './css/iconfont.css',
  './css/mobile.css',
  './css/npplication.css',
  './font/iconfont.ttf',
  './font/iconfont.woff',
  './font/iconfont.woff2',
  './js/modules/chroma.min.js',
  './js/modules/color-thief.min.js',
  './js/modules/iziToast.min.js',
  './js/modules/jquery.min.js',
  './js/modules/js.cookie.js',
  './js/modules/npplication.js',
  './js/modules/sortable.min.js',
  './js/element.js',
  './js/guide.js',
  './js/set.js',
  './js/main.js',
  './js/function.js',
  './js/settings.js',
  './js/plugin_settings.js',
  './js/plugin_welcome.js',
  './js/coreNpp/themeColor.js',
  './js/coreNpp/advancedSettings.js',
  './favicon.ico',
  './favicon.png'
];

// 检查是否为 PWA
async function isPwaClient(client) {
  if (!client) return false;

  try {
    const clientUrl = new URL(client.url);
    const isStandalone = clientUrl.searchParams.get('standalone') === 'true';

    const isNormalBrowser = clientUrl.origin === self.location.origin &&
      !clientUrl.searchParams.has('pwa') &&
      clientUrl.pathname === '/' &&
      clientUrl.hash === '';

    if (isNormalBrowser && !isStandalone) {
      return false;
    }

    const response = await new Promise((resolve) => {
      const messageChannel = new MessageChannel();
      messageChannel.port1.onmessage = (event) => {
        resolve(event.data);
      };

      client.postMessage({
        type: 'CHECK_PWA_MODE'
      }, [messageChannel.port2]);

      setTimeout(() => resolve(false), 100);
    });

    return response.isPwa || isStandalone;
  } catch (error) {
    try {
      const clientUrl = new URL(client.url);
      return clientUrl.searchParams.get('standalone') === 'true' ||
        clientUrl.searchParams.get('pwa') === 'true' ||
        clientUrl.pathname.includes('/pwa/') ||
        clientUrl.hash.includes('pwa');
    } catch (urlError) {
      return false;
    }
  }
}

// 缓存
async function cacheResources() {
  try {
    const cache = await caches.open(CACHE_NAME);
    await cache.addAll(urlsToCache);
  } catch (error) {
    console.error('缓存失败:', error);
  }
}

// 监听安装
self.addEventListener('install', event => {
  self.skipWaiting();
});

// 监听激活
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// 监听消息
self.addEventListener('message', event => {
  if (event.data && event.data.type === 'INSTALL_PWA') {
    // 安装
    event.waitUntil(cacheResources());
  } else if (event.data && event.data.type === 'UNINSTALL_PWA') {
    // 卸载
    event.waitUntil(
      caches.keys().then(cacheNames => {
        return Promise.all(
          cacheNames.map(cacheName => {
            return caches.delete(cacheName);
          })
        );
      }).catch(error => {
        console.error('清除缓存失败:', error);
      })
    );
  }
});

self.addEventListener('fetch', event => {
  event.respondWith(
    (async () => {
      const requestUrl = new URL(event.request.url);
      const isNormalBrowserAccess = requestUrl.origin === self.location.origin &&
        requestUrl.pathname === '/' &&
        !requestUrl.searchParams.has('pwa') &&
        !requestUrl.searchParams.has('standalone') &&
        !requestUrl.hash.includes('pwa') &&
        event.request.headers.get('Sec-Fetch-Dest') === 'document' &&
        event.request.headers.get('Sec-Fetch-Mode') === 'navigate';

      if (isNormalBrowserAccess) {
        return fetch(event.request);
      }

      const clients = await self.clients.matchAll({
        type: 'window',
        includeUncontrolled: true
      });

      let isPwa = false;
      for (const client of clients) {
        if (await isPwaClient(client)) {
          isPwa = true;
          break;
        }
      }

      if (!isPwa) {
        return fetch(event.request);
      }

      const cachedResponse = await caches.match(event.request);
      if (cachedResponse) {
        return cachedResponse;
      }

      try {
        const response = await fetch(event.request);

        if (response && response.status === 200 && response.type === 'basic') {
          const responseToCache = response.clone();
          const cache = await caches.open(CACHE_NAME);
          cache.put(event.request, responseToCache);
        }

        return response;
      } catch (error) {
        console.error('获取失败:', error);
        return caches.match('./index.html');
      }
    })()
  );
});