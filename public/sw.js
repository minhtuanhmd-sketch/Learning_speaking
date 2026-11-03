/**
 * LexiSpeak VN — Native iOS PWA Service Worker (sw.js)
 * Implements a Cache-First strategy for static assets, App Shell, and Google Fonts
 * so the application loads instantaneously offline on iPhone Safari/WebKit.
 */

const CACHE_VERSION = 'lexispeak-ios-pwa-v5';
const STATIC_SHELL_CACHE = `${CACHE_VERSION}-shell`;
const RUNTIME_ASSET_CACHE = `${CACHE_VERSION}-assets`;

const APP_SHELL_URLS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/icon.svg',
  '/apple-touch-icon.png',
  '/pwa-192x192.png',
  '/pwa-512x512.png',
  '/pwa-maskable-512x512.png',
];

self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches
      .open(STATIC_SHELL_CACHE)
      .then((cache) => cache.addAll(APP_SHELL_URLS))
      .catch(() => {})
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter(
              (key) => key !== STATIC_SHELL_CACHE && key !== RUNTIME_ASSET_CACHE
            )
            .map((oldKey) => caches.delete(oldKey))
        )
      )
      .then(() => self.clients.claim())
  );
});

self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

/**
 * Helper: Determine if a request is a static asset or App Shell resource
 * that should use Cache-First with background refresh.
 */
function isCacheFirstAsset(url, request) {
  if (request.method !== 'GET') return false;
  if (url.pathname.startsWith('/api/')) return false;
  if (
    url.pathname.startsWith('/src/') ||
    url.pathname.includes('@vite') ||
    url.pathname.includes('@react-refresh') ||
    url.pathname.includes('node_modules')
  ) {
    return false;
  }

  const staticExtensions = [
    '.png',
    '.svg',
    '.ico',
    '.woff',
    '.woff2',
    '.ttf',
    '.json',
  ];
  if (staticExtensions.some((ext) => url.pathname.endsWith(ext))) {
    return true;
  }
  if (
    url.hostname === 'fonts.googleapis.com' ||
    url.hostname === 'fonts.gstatic.com'
  ) {
    return true;
  }
  return false;
}

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;
  if (!request.url.startsWith('http')) return;

  const url = new URL(request.url);

  // Navigation requests (HTML App Shell): Network-First with instant Offline Cache Fallback
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then(async (networkResponse) => {
          if (networkResponse && networkResponse.ok) {
            const cache = await caches.open(STATIC_SHELL_CACHE);
            cache.put('/index.html', networkResponse.clone());
            cache.put('/', networkResponse.clone());
          }
          return networkResponse;
        })
        .catch(async () => {
          const cache = await caches.open(STATIC_SHELL_CACHE);
          return (
            (await cache.match('/index.html')) ||
            (await cache.match('/')) ||
            new Response('Offline', { status: 503 })
          );
        })
    );
    return;
  }

  // Static Assets & Fonts: Cache-First strategy with background update
  if (isCacheFirstAsset(url, request)) {
    event.respondWith(
      caches.match(request).then((cachedResponse) => {
        if (cachedResponse) {
          fetch(request)
            .then((networkResponse) => {
              if (networkResponse && networkResponse.ok) {
                caches
                  .open(RUNTIME_ASSET_CACHE)
                  .then((cache) => cache.put(request, networkResponse));
              }
            })
            .catch(() => {});
          return cachedResponse;
        }

        return fetch(request)
          .then((networkResponse) => {
            if (
              networkResponse &&
              (networkResponse.ok || networkResponse.type === 'opaque')
            ) {
              const clone = networkResponse.clone();
              caches
                .open(RUNTIME_ASSET_CACHE)
                .then((cache) => cache.put(request, clone));
            }
            return networkResponse;
          })
          .catch(async () => {
            const fallback = await caches.match('/index.html');
            return fallback || new Response('Offline', { status: 503 });
          });
      })
    );
  }
});
