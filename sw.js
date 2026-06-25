// Command Center — Service Worker
// Cache-first for static assets so repeat visits load instantly and the
// dashboard keeps working offline. Bump CACHE_VERSION whenever any cached
// file changes so clients pick up the new version instead of stale assets.
const CACHE_VERSION = 'cc-v3';
const PRECACHE_URLS = [
    './',
    './index.html',
    './style.css',
    './script.js',
    './site.webmanifest',
    './favicon.ico',
    './favicon-16x16.png',
    './favicon-32x32.png',
    './apple-touch-icon.png',
    './android-chrome-192x192.png',
    './android-chrome-512x512.png',
];

self.addEventListener('install', (e) => {
    self.skipWaiting();
    e.waitUntil(
        caches.open(CACHE_VERSION).then((cache) => cache.addAll(PRECACHE_URLS).catch(() => {
            // Don't fail install if one asset 404s — cache whatever did succeed.
        }))
    );
});

self.addEventListener('activate', (e) => {
    e.waitUntil(
        caches.keys().then((keys) =>
            Promise.all(keys.filter((k) => k !== CACHE_VERSION).map((k) => caches.delete(k)))
        ).then(() => self.clients.claim())
    );
});

self.addEventListener('fetch', (e) => {
    const req = e.request;
    if (req.method !== 'GET') return;

    const url = new URL(req.url);
    // Only handle same-origin requests — let cross-origin calls (weather API,
    // Google Fonts, etc.) go straight to the network as normal.
    if (url.origin !== self.location.origin) return;

    e.respondWith(
        caches.match(req).then((cached) => {
            // Cache-first for instant loads; refresh the cache in the
            // background so the next visit picks up any change.
            const networkFetch = fetch(req).then((res) => {
                if (res && res.status === 200) {
                    const copy = res.clone();
                    caches.open(CACHE_VERSION).then((cache) => cache.put(req, copy));
                }
                return res;
            }).catch(() => cached); // offline fallback to whatever's cached

            return cached || networkFetch;
        })
    );
});
