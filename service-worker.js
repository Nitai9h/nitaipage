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

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        return cache.addAll(urlsToCache);
      })
  );
  self.skipWaiting();
});

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

self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        if (response) {
          return response;
        }

        return fetch(event.request).then(
          response => {
            if (!response || response.status !== 200 || response.type !== 'basic') {
              return response;
            }

            const responseToCache = response.clone();

            caches.open(CACHE_NAME)
              .then(cache => {
                cache.put(event.request, responseToCache);
              });

            return response;
          }
        ).catch(error => {
          console.error('获取资源失败:', error);
          return caches.match('./index.html');
        });
      })
  );
});