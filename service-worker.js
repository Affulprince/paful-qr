// App-shell cache so the core generator keeps working offline after the
// first visit. Bump CACHE_NAME whenever a precached file changes.
'use strict';

const CACHE_NAME = 'paful-qr-v5';

const PRECACHE_URLS = [
  'index.html',
  'scanner.html',
  'bulk.html',
  'history.html',
  'templates.html',
  'donate.html',
  'business-card.html',
  'social-media.html',
  'manifest.json',
  'css/paful-qr.css',
  'css/print.css',
  'js/config.js',
  'js/utils.js',
  'js/storage.js',
  'js/validation.js',
  'js/theme.js',
  'js/toast.js',
  'js/qr-generator.js',
  'js/qr-customizer.js',
  'js/qr-readability.js',
  'js/qr-history.js',
  'js/qr-scanner.js',
  'js/bulk-generator.js',
  'js/templates.js',
  'js/sharing.js',
  'js/app.js',
  'js/history-page.js',
  'js/bulk-page.js',
  'js/scanner-page.js',
  'js/templates-page.js',
  'js/pwa.js',
  'js/donate-page.js',
  'js/business-card.js',
  'js/business-card-page.js',
  'js/social-media-page.js',
  'assets/icons/favicon.svg',
  'assets/icons/icon-192.png',
  'assets/icons/icon-512.png',
  'https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css',
  'https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/js/bootstrap.bundle.min.js',
  'https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.3/font/bootstrap-icons.min.css',
  'https://cdn.jsdelivr.net/npm/qr-code-styling@1.5.0/lib/qr-code-styling.js',
  'https://cdn.jsdelivr.net/npm/jsqr@1.4.0/dist/jsQR.js',
  'https://cdn.jsdelivr.net/npm/jszip@3.10.1/dist/jszip.min.js',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => Promise.all(
      PRECACHE_URLS.map((url) => cache.add(url).catch(() => {
        // One missing/blocked resource shouldn't stop the rest from caching.
      })),
    )).then(() => self.skipWaiting()),
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => Promise.all(
      keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key)),
    )).then(() => self.clients.claim()),
  );
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;

  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((response) => {
          const copy = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request, copy));
          return response;
        })
        .catch(() => caches.match(request).then((cached) => cached || caches.match('index.html'))),
    );
    return;
  }

  event.respondWith(
    caches.match(request).then((cached) => cached || fetch(request).then((response) => {
      const copy = response.clone();
      caches.open(CACHE_NAME).then((cache) => cache.put(request, copy));
      return response;
    }).catch(() => cached)),
  );
});
