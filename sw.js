/* ==========================================================================
   SERVICE WORKER - CẤP NƯỚC SƠN LA PWA
   ========================================================================== */

const CACHE_NAME = 'capnuocsl-pwa-v8';
const STATIC_ASSETS = [
  './',
  'index.html',
  'css/style.css?v=8',
  'js/data.js?v=8',
  'js/store.js?v=8',
  'js/charts.js?v=8',
  'js/app.js?v=8',
  'manifest.json',
  'favicon.ico',
  'icons/icon-192.png',
  'icons/icon-512.png',
  'icons/icon-maskable-192.png',
  'icons/icon-maskable-512.png'
];

// Install Event - Pre-cache core static resources
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[ServiceWorker] Pre-caching static app shell assets...');
      return cache.addAll(STATIC_ASSETS).catch((err) => {
        console.warn('[ServiceWorker] Some non-critical assets failed to cache:', err);
      });
    }).then(() => self.skipWaiting())
  );
});

// Activate Event - Clean up stale cache versions
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cache) => {
          if (cache !== CACHE_NAME) {
            console.log('[ServiceWorker] Removing old cache:', cache);
            return caches.delete(cache);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch Event - Handle Network-First for API data & Stale-While-Revalidate for app assets
self.addEventListener('fetch', (event) => {
  const requestUrl = event.request.url;

  // Bypass non-GET requests or browser extension requests
  if (event.request.method !== 'GET' || !requestUrl.startsWith('http')) {
    return;
  }

  // Network-First strategy for Google Sheets Apps Script API requests
  if (requestUrl.includes('script.google.com') || requestUrl.includes('macros/s/')) {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          // Clone and cache latest API data response
          if (response && response.status === 200) {
            const responseClone = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, responseClone));
          }
          return response;
        })
        .catch(() => {
          // Fallback to cached API data if network is unavailable
          return caches.match(event.request);
        })
    );
    return;
  }

  // Stale-While-Revalidate strategy for static resources & CDN assets
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      const fetchPromise = fetch(event.request)
        .then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200 && networkResponse.type === 'basic') {
            const responseToCache = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, responseToCache));
          }
          return networkResponse;
        })
        .catch((err) => {
          console.log('[ServiceWorker] Fetch failed, returning offline cached copy if available:', err);
        });

      return cachedResponse || fetchPromise;
    })
  );
});
